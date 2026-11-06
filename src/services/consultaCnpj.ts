/**
 * Serviço de Consulta de CNPJ Externa
 * Fontes:
 *  1. BrasilAPI (direto do navegador, pública, sem chave, CORS habilitado)
 *  2. ReceitaWS (fallback de resiliência)
 *  3. Backend Proxy do Skip Cloud (/backend/v1/cnpj/consultar/{cnpj}) em caso de bloqueio CORS/rede
 */

import { limparCNPJ, validarCNPJ, formatarCNPJ } from '@/lib/cnpj'
import { SegmentoEmpresa, CIDADES_ISS_MAPA } from '@/lib/regimes'

export interface ItemCnaeConsulta {
  codigo: string
  codigoFormatado?: string
  descricao: string
}

export interface ItemSocioQsa {
  id?: string
  nome: string
  qualificacao: string
  cpfCnpj?: string
  percentualParticipacao?: number
  dataEntrada?: string
  faixaEtaria?: string
  nomeRepresentanteLegal?: string
  qualificacaoRepresentanteLegal?: string
  paisOrigem?: string
  tipoPessoa?: 'PF' | 'PJ' | 'ESTRANGEIRO'
}

export interface DadosCnpjConsulta {
  cnpj: string
  cnpjFormatado: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  dataSituacaoCadastral?: string
  dataAbertura?: string
  cnaePrincipalCodigo: string
  cnaePrincipalDescricao: string
  cnaesSecundarios: ItemCnaeConsulta[]
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  municipio: string
  uf: string
  telefone?: string
  email?: string
  capitalSocial?: number
  naturezaJuridica?: string
  porte?: string
  qsa?: ItemSocioQsa[]
  qsaFonte?: string
  fonte: 'brasilapi' | 'receitaws' | 'proxy' | 'minhareceita'
  consultadoEm: string
}

export interface ResultadoConsultaCnpj {
  sucesso: boolean
  dados?: DadosCnpjConsulta
  erro?: string
  aviso?: string
}

/**
 * Mapeia CNAE / descrição da atividade para 1 dos 10 segmentos oficiais do Contabilidade 5.0:
 * 'Comércio', 'Indústria', 'Serviços', 'Tecnologia', 'Saúde', 'Agronegócio',
 * 'Construção Civil', 'Transporte e Logística', 'Energia e Telecomunicações', 'Outros'
 */
/**
 * Mapeia CNAE para um dos 10 segmentos oficiais da empresa de forma opcional.
 * Retorna null se não houver correspondência semântica ou código reconhecido
 * (adequado para sugestões contextuais de CNAEs secundários).
 */
export function mapearCnaeParaSegmentoOpcional(
  cnaeCodigo?: string | null,
  cnaeDescricao: string = '',
): SegmentoEmpresa | null {
  if (!cnaeCodigo && !cnaeDescricao) return null
  const codLimpo = (cnaeCodigo || '').replace(/\D/g, '')
  const cod2 = codLimpo.slice(0, 2)
  const desc = (cnaeDescricao || '').toLowerCase()

  // Tecnologia
  if (
    ['62', '63'].includes(cod2) ||
    desc.includes('software') ||
    desc.includes('desenvolvimento de programa') ||
    desc.includes('tecnologia da informação') ||
    desc.includes('portais, provedores') ||
    desc.includes('hospedagem de dados')
  ) {
    return 'Tecnologia'
  }

  // Saúde
  if (
    cod2 === '86' ||
    cod2 === '87' ||
    desc.includes('médic') ||
    desc.includes('medic') ||
    desc.includes('odontol') ||
    desc.includes('hospital') ||
    desc.includes('fisioterap') ||
    desc.includes('psicol') ||
    desc.includes('laboratório') ||
    desc.includes('laboratorio') ||
    desc.includes('saúde humana') ||
    desc.includes('saude humana')
  ) {
    return 'Saúde'
  }

  // Educação (Divisão 85)
  if (
    cod2 === '85' ||
    desc.includes('educação') ||
    desc.includes('educacao') ||
    desc.includes('ensino') ||
    desc.includes('escola') ||
    desc.includes('faculdade') ||
    desc.includes('universidade') ||
    desc.includes('cursos livres') ||
    desc.includes('treinamento em desenvolvimento') ||
    desc.includes('instituto de ensino')
  ) {
    return 'Educação'
  }

  // Agro
  if (
    ['01', '02', '03'].includes(cod2) ||
    desc.includes('agropecu') ||
    desc.includes('agrícola') ||
    desc.includes('agricola') ||
    desc.includes('pecuária') ||
    desc.includes('pecuaria') ||
    desc.includes('cultivo') ||
    desc.includes('soja') ||
    desc.includes('gado') ||
    desc.includes('pesca')
  ) {
    return 'Agro'
  }

  // Construção Civil
  if (
    ['41', '42', '43'].includes(cod2) ||
    desc.includes('construção') ||
    desc.includes('construcao') ||
    desc.includes('obras') ||
    desc.includes('edifícios') ||
    desc.includes('edificios') ||
    desc.includes('engenharia') ||
    desc.includes('incorporação') ||
    desc.includes('incorporacao')
  ) {
    return 'Construção Civil'
  }

  // Transporte
  if (
    ['49', '50', '51', '52', '53'].includes(cod2) ||
    desc.includes('transporte') ||
    desc.includes('carga') ||
    desc.includes('logística') ||
    desc.includes('logistica') ||
    desc.includes('armazena') ||
    desc.includes('rodoviário') ||
    desc.includes('rodoviario') ||
    desc.includes('frete')
  ) {
    return 'Transporte'
  }

  // Bares e Restaurantes (alimentação fora do lar)
  if (
    ['56'].includes(cod2) ||
    desc.includes('restaurante') ||
    desc.includes('bar ') ||
    desc.includes('bares') ||
    desc.includes('lanchonete') ||
    desc.includes('pizzaria') ||
    desc.includes('choperia') ||
    desc.includes('cafeteria') ||
    desc.includes('fornecimento de alimentos preparados')
  ) {
    return 'Bares e Restaurantes'
  }

  // Indústria (Divisões 05 a 33)
  const num2 = parseInt(cod2, 10)
  if (
    (!isNaN(num2) && num2 >= 5 && num2 <= 33) ||
    desc.includes('fabricação') ||
    desc.includes('fabricacao') ||
    desc.includes('indústria') ||
    desc.includes('industria') ||
    desc.includes('manufatura') ||
    desc.includes('usinagem')
  ) {
    return 'Indústria'
  }

  // Comércio (Divisões 45, 46, 47)
  if (
    ['45', '46', '47'].includes(cod2) ||
    desc.includes('comércio') ||
    desc.includes('comercio') ||
    desc.includes('varejista') ||
    desc.includes('atacadista') ||
    desc.includes('distribuidora')
  ) {
    return 'Comércio'
  }

  // Serviços explícitos (Divisões de serviços típicos ou termos de serviço)
  if (
    [
      '58',
      '59',
      '60',
      '61',
      '64',
      '65',
      '66',
      '68',
      '69',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '77',
      '78',
      '79',
      '80',
      '81',
      '82',
      '90',
      '91',
      '92',
      '93',
      '94',
      '95',
      '96',
    ].includes(cod2) ||
    desc.includes('prestação de serviço') ||
    desc.includes('prestacao de servico') ||
    desc.includes('consultoria') ||
    desc.includes('assessoria') ||
    desc.includes('advocacia') ||
    desc.includes('contabilidade') ||
    desc.includes('locação') ||
    desc.includes('locacao') ||
    desc.includes('limpeza') ||
    desc.includes('vigilância') ||
    desc.includes('vigilancia')
  ) {
    return 'Serviços'
  }

  return null
}

export function mapearCnaeParaSegmento(
  cnaeCodigo: string,
  cnaeDescricao: string = '',
): SegmentoEmpresa {
  const match = mapearCnaeParaSegmentoOpcional(cnaeCodigo, cnaeDescricao)
  return match || 'Serviços'
}

/**
 * Encontra a cidade compatível na lista do CIDADES_ISS_MAPA a partir do município e UF da Receita
 */
export function mapearCidadeIss(
  municipio: string,
  uf: string,
): { cidadeId: string; nomeExibicao: string } {
  if (!municipio) return { cidadeId: 'outra', nomeExibicao: 'Outra cidade' }

  const muniNorm = municipio
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  const ufNorm = (uf || '').toUpperCase().trim()

  const match = CIDADES_ISS_MAPA.find((cid) => {
    if (cid.id === 'outra') return false
    const cidNomeNorm = cid.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return cid.uf === ufNorm && (cidNomeNorm === muniNorm || muniNorm.includes(cidNomeNorm))
  })

  if (match) {
    return {
      cidadeId: match.id,
      nomeExibicao: match.descricao || `${match.nome}/${match.uf}`,
    }
  }

  return {
    cidadeId: 'outra',
    nomeExibicao: `${municipio} - ${uf} (Outra cidade / Interior)`,
  }
}

/**
 * Consulta direta à BrasilAPI (Client-side, CORS habilitado)
 */
async function consultarBrasilApi(cnpjLimpo: string): Promise<DadosCnpjConsulta> {
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (resp.status === 404) {
    throw new Error('CNPJ não encontrado na base de dados oficial.')
  }

  if (!resp.ok) {
    throw new Error(`BrasilAPI retornou status ${resp.status}`)
  }

  const json = await resp.json()

  return {
    cnpj: cnpjLimpo,
    cnpjFormatado: formatarCNPJ(cnpjLimpo),
    razaoSocial: (json.razao_social || '').trim(),
    nomeFantasia: (json.nome_fantasia || '').trim(),
    situacaoCadastral: (json.descricao_situacao_cadastral || 'Ativa').trim(),
    dataSituacaoCadastral: json.data_situacao_cadastral || undefined,
    dataAbertura: json.data_inicio_atividade || undefined,
    cnaePrincipalCodigo: json.cnae_fiscal ? String(json.cnae_fiscal) : '',
    cnaePrincipalDescricao: (json.cnae_fiscal_descricao || '').trim(),
    cnaesSecundarios: Array.isArray(json.cnaes_secundarios)
      ? json.cnaes_secundarios.map((c: any) => ({
          codigo: String(c.codigo || ''),
          descricao: (c.descricao || '').trim(),
        }))
      : [],
    logradouro: (json.logradouro || '').trim(),
    numero: (json.numero || '').trim(),
    complemento: (json.complemento || '').trim(),
    bairro: (json.bairro || '').trim(),
    cep: json.cep ? String(json.cep).replace(/\D/g, '') : '',
    municipio: (json.municipio || '').trim(),
    uf: (json.uf || '').toUpperCase().trim(),
    telefone: json.ddd_telefone_1 ? String(json.ddd_telefone_1).trim() : undefined,
    email: (json.email || '').trim(),
    capitalSocial: Number(json.capital_social || 0),
    naturezaJuridica: (json.natureza_juridica || '').trim(),
    porte: (json.porte || '').trim(),
    qsa: Array.isArray(json.qsa)
      ? json.qsa.map((s: any, idx: number) => {
          const cpfCnpjDoc = (s.cnpj_cpf_do_socio || '').trim()
          const docNumeros = cpfCnpjDoc.replace(/\D/g, '')
          const tipoPessoa: 'PF' | 'PJ' = docNumeros.length === 14 ? 'PJ' : 'PF'
          return {
            id: `qsa_${idx}_${docNumeros.slice(-4) || Math.random().toString(36).slice(2, 6)}`,
            nome: (s.nome_socio || '').trim(),
            qualificacao: (s.qualificacao_socio || '').trim(),
            cpfCnpj: cpfCnpjDoc || undefined,
            percentualParticipacao:
              typeof s.percentual_capital_social === 'number'
                ? s.percentual_capital_social
                : undefined,
            dataEntrada: s.data_entrada_sociedade || undefined,
            faixaEtaria: s.faixa_etaria || undefined,
            nomeRepresentanteLegal: (s.nome_representante_legal || '').trim() || undefined,
            qualificacaoRepresentanteLegal:
              (s.qualificacao_representante_legal || '').trim() || undefined,
            paisOrigem: (s.pais || '').trim() || undefined,
            tipoPessoa,
          }
        })
      : [],
    fonte: 'brasilapi',
    consultadoEm: new Date().toISOString(),
  }
}

/**
 * Consulta direta de contingência à Minha Receita (dados públicos abertos da RFB com QSA completo)
 */
async function consultarMinhaReceita(cnpjLimpo: string): Promise<DadosCnpjConsulta> {
  const url = `https://minhareceita.org/${cnpjLimpo}`
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!resp.ok) {
    throw new Error(`Minha Receita retornou status ${resp.status}`)
  }

  const json = await resp.json()

  return {
    cnpj: cnpjLimpo,
    cnpjFormatado: formatarCNPJ(cnpjLimpo),
    razaoSocial: (json.razao_social || '').trim(),
    nomeFantasia: (json.nome_fantasia || '').trim(),
    situacaoCadastral: (json.descricao_situacao_cadastral || 'Ativa').trim(),
    dataSituacaoCadastral: json.data_situacao_cadastral || undefined,
    dataAbertura: json.data_inicio_atividade || undefined,
    cnaePrincipalCodigo: json.cnae_fiscal ? String(json.cnae_fiscal) : '',
    cnaePrincipalDescricao: (json.cnae_fiscal_descricao || '').trim(),
    cnaesSecundarios: Array.isArray(json.cnaes_secundarios)
      ? json.cnaes_secundarios.map((c: any) => ({
          codigo: String(c.codigo || ''),
          descricao: (c.descricao || '').trim(),
        }))
      : [],
    logradouro: (json.logradouro || '').trim(),
    numero: (json.numero || '').trim(),
    complemento: (json.complemento || '').trim(),
    bairro: (json.bairro || '').trim(),
    cep: json.cep ? String(json.cep).replace(/\D/g, '') : '',
    municipio: (json.municipio || '').trim(),
    uf: (json.uf || '').toUpperCase().trim(),
    telefone: json.ddd_telefone_1 ? String(json.ddd_telefone_1).trim() : undefined,
    email: (json.email || '').trim(),
    capitalSocial: Number(json.capital_social || 0),
    naturezaJuridica: (json.natureza_juridica || '').trim(),
    porte: (json.porte || '').trim(),
    qsa: Array.isArray(json.qsa)
      ? json.qsa.map((s: any, idx: number) => {
          const doc = (s.cnpj_cpf_do_socio || '').trim()
          const docNum = doc.replace(/\D/g, '')
          return {
            id: `qsa_${idx}_${docNum.slice(-4) || Math.random().toString(36).slice(2, 6)}`,
            nome: (s.nome_socio || '').trim(),
            qualificacao: (s.qualificacao_socio || '').trim(),
            cpfCnpj: doc || undefined,
            percentualParticipacao:
              typeof s.percentual_capital_social === 'number'
                ? s.percentual_capital_social
                : undefined,
            dataEntrada: s.data_entrada_sociedade || undefined,
            faixaEtaria: s.faixa_etaria || undefined,
            nomeRepresentanteLegal: (s.nome_representante_legal || '').trim() || undefined,
            qualificacaoRepresentanteLegal:
              (s.qualificacao_representante_legal || '').trim() || undefined,
            paisOrigem: (s.pais || '').trim() || undefined,
            tipoPessoa: docNum.length === 14 ? 'PJ' : 'PF',
          }
        })
      : [],
    fonte: 'minhareceita',
    consultadoEm: new Date().toISOString(),
  }
}

/**
 * Tenta enriquecer uma consulta que veio sem sócios ou sem CNAEs secundários
 * buscando especificamente via Minha Receita ou ReceitaWS.
 */
async function enriquecerDadosCnpjSeNecessario(
  dados: DadosCnpjConsulta,
): Promise<DadosCnpjConsulta> {
  const precisaQsa = !Array.isArray(dados.qsa) || dados.qsa.length === 0
  const precisaCnaesSecundarios =
    !Array.isArray(dados.cnaesSecundarios) || dados.cnaesSecundarios.length === 0

  if (!precisaQsa && !precisaCnaesSecundarios) {
    return dados
  }

  // Se falta QSA ou CNAEs secundários, tenta Minha Receita
  try {
    const resM = await consultarMinhaReceita(dados.cnpj)
    let alterado = false
    const copia = { ...dados }

    if (precisaQsa && Array.isArray(resM.qsa) && resM.qsa.length > 0) {
      copia.qsa = resM.qsa
      copia.qsaFonte = 'minhareceita'
      alterado = true
    }

    if (
      precisaCnaesSecundarios &&
      Array.isArray(resM.cnaesSecundarios) &&
      resM.cnaesSecundarios.length > 0
    ) {
      copia.cnaesSecundarios = resM.cnaesSecundarios
      alterado = true
    }

    if (alterado) return copia
  } catch (_e) {
    // Silencioso se Minha Receita falhar
  }

  return dados
}

async function enriquecerQsaSeNecessario(dados: DadosCnpjConsulta): Promise<DadosCnpjConsulta> {
  return enriquecerDadosCnpjSeNecessario(dados)
}

/**
 * Consulta direta de fallback à ReceitaWS (Client-side, suporta JSONP ou fetch direto)
 */
async function consultarReceitaWs(cnpjLimpo: string): Promise<DadosCnpjConsulta> {
  const url = `https://receitaws.com.br/api/cnpj/${cnpjLimpo}`
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!resp.ok) {
    throw new Error(`ReceitaWS retornou status ${resp.status}`)
  }

  const json = await resp.json()

  if (json.status === 'ERROR') {
    throw new Error(json.message || 'CNPJ não localizado na ReceitaWS.')
  }

  const cnaePrinc =
    Array.isArray(json.atividade_principal) && json.atividade_principal[0]
      ? json.atividade_principal[0]
      : null

  return {
    cnpj: cnpjLimpo,
    cnpjFormatado: formatarCNPJ(cnpjLimpo),
    razaoSocial: (json.nome || '').trim(),
    nomeFantasia: (json.fantasia || '').trim(),
    situacaoCadastral: (json.situacao || 'Ativa').trim(),
    dataSituacaoCadastral: json.data_situacao || undefined,
    dataAbertura: json.abertura || undefined,
    cnaePrincipalCodigo: cnaePrinc?.code ? String(cnaePrinc.code).replace(/\D/g, '') : '',
    cnaePrincipalDescricao: (cnaePrinc?.text || '').trim(),
    cnaesSecundarios: Array.isArray(json.atividades_secundarias)
      ? json.atividades_secundarias.map((c: any) => ({
          codigo: String(c.code || '').replace(/\D/g, ''),
          descricao: (c.text || '').trim(),
        }))
      : [],
    logradouro: (json.logradouro || '').trim(),
    numero: (json.numero || '').trim(),
    complemento: (json.complemento || '').trim(),
    bairro: (json.bairro || '').trim(),
    cep: json.cep ? String(json.cep).replace(/\D/g, '') : '',
    municipio: (json.municipio || '').trim(),
    uf: (json.uf || '').toUpperCase().trim(),
    telefone: (json.telefone || '').trim(),
    email: (json.email || '').trim(),
    capitalSocial: Number(json.capital_social || 0),
    naturezaJuridica: (json.natureza_juridica || '').trim(),
    porte: (json.porte || '').trim(),
    qsa: Array.isArray(json.qsa)
      ? json.qsa.map((s: any, idx: number) => {
          const qual = (s.qual || '').trim()
          const qualLower = qual.toLowerCase()
          const tipoPessoa: 'PF' | 'PJ' =
            qualLower.includes('jurídica') || qualLower.includes('juridica') ? 'PJ' : 'PF'

          // Extração de percentual se presente no texto da ReceitaWS
          let perc: number | undefined
          if (typeof s.participacao === 'number') perc = s.participacao
          else if (typeof s.percentual === 'number') perc = s.percentual

          return {
            id: `qsa_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            nome: (s.nome || '').trim(),
            qualificacao: qual,
            percentualParticipacao: perc,
            nomeRepresentanteLegal: (s.nome_rep_legal || '').trim() || undefined,
            qualificacaoRepresentanteLegal: (s.qual_rep_legal || '').trim() || undefined,
            paisOrigem: (s.pais || '').trim() || undefined,
            tipoPessoa,
          }
        })
      : [],
    fonte: 'receitaws',
    consultadoEm: new Date().toISOString(),
  }
}

/**
 * Consulta via Backend Proxy do Skip Cloud (evita bloqueios CORS locais ou adblockers)
 */
async function consultarViaBackendProxy(cnpjLimpo: string): Promise<DadosCnpjConsulta> {
  const baseUrl = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/+$/, '')
  const url = `${baseUrl}/backend/v1/cnpj/consultar/${cnpjLimpo}`

  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const json = await resp.json().catch(() => ({}))

  if (!resp.ok || !json.sucesso) {
    throw new Error(json.erro || `Falha na consulta de CNPJ pelo backend (${resp.status})`)
  }

  const d = json.dados
  return {
    cnpj: cnpjLimpo,
    cnpjFormatado: formatarCNPJ(cnpjLimpo),
    razaoSocial: (d.razaoSocial || '').trim(),
    nomeFantasia: (d.nomeFantasia || '').trim(),
    situacaoCadastral: (d.situacaoCadastral || 'Ativa').trim(),
    dataSituacaoCadastral: d.dataSituacaoCadastral,
    dataAbertura: d.dataAbertura,
    cnaePrincipalCodigo: d.cnaePrincipalCodigo || '',
    cnaePrincipalDescricao: (d.cnaePrincipalDescricao || '').trim(),
    cnaesSecundarios: d.cnaesSecundarios || [],
    logradouro: (d.logradouro || '').trim(),
    numero: (d.numero || '').trim(),
    complemento: (d.complemento || '').trim(),
    bairro: (d.bairro || '').trim(),
    cep: (d.cep || '').replace(/\D/g, ''),
    municipio: (d.municipio || '').trim(),
    uf: (d.uf || '').toUpperCase().trim(),
    telefone: d.telefone,
    email: d.email,
    capitalSocial: d.capitalSocial,
    naturezaJuridica: d.naturezaJuridica,
    porte: d.porte,
    qsa: Array.isArray(d.qsa)
      ? d.qsa.map((s: any, idx: number) => ({
          id: s.id || `qsa_${idx}`,
          nome: (s.nome || '').trim(),
          qualificacao: (s.qualificacao || '').trim(),
          cpfCnpj: s.cpfCnpj,
          percentualParticipacao: s.percentualParticipacao,
          dataEntrada: s.dataEntrada,
          faixaEtaria: s.faixaEtaria,
          nomeRepresentanteLegal: s.nomeRepresentanteLegal,
          qualificacaoRepresentanteLegal: s.qualificacaoRepresentanteLegal,
          paisOrigem: s.paisOrigem,
          tipoPessoa: s.tipoPessoa || 'PF',
        }))
      : [],
    fonte: 'proxy',
    consultadoEm: new Date().toISOString(),
  }
}

/**
 * Função mestra para consulta de CNPJ:
 * 1. Valida tamanho (14 dígitos) e algoritmo de dígitos verificadores
 * 2. Tenta BrasilAPI
 * 3. Se falhar por rede/erro, tenta ReceitaWS
 * 4. Se falhar, tenta o Backend Proxy
 * 5. Retorna resultado seguro com mensagens claras em português
 */
export async function consultarCnpjExterno(cnpjInformado: string): Promise<ResultadoConsultaCnpj> {
  const cnpjLimpo = limparCNPJ(cnpjInformado)

  if (!cnpjLimpo) {
    return {
      sucesso: false,
      erro: 'Informe o número do CNPJ para realizar a busca.',
    }
  }

  if (cnpjLimpo.length !== 14) {
    return {
      sucesso: false,
      erro: `CNPJ incompleto (${cnpjLimpo.length} de 14 dígitos). Digite o número completo.`,
    }
  }

  if (!validarCNPJ(cnpjLimpo)) {
    return {
      sucesso: false,
      erro: 'CNPJ inválido de acordo com os dígitos verificadores da Receita Federal.',
    }
  }

  // 1. Tentar BrasilAPI primeiro
  try {
    const dadosBrasil = await consultarBrasilApi(cnpjLimpo)
    const dadosEnriquecidos = await enriquecerDadosCnpjSeNecessario(dadosBrasil)
    return { sucesso: true, dados: dadosEnriquecidos }
  } catch (errBrasil: any) {
    const msgBrasil = errBrasil?.message || ''
    // Se explicitamente 404, não adianta tentar outro provedor se a empresa não existe
    if (msgBrasil.includes('não encontrado')) {
      return {
        sucesso: false,
        erro: 'CNPJ não encontrado na base pública da Receita Federal.',
      }
    }

    // 2. Tentativa secundária: Minha Receita
    try {
      const dadosMinha = await consultarMinhaReceita(cnpjLimpo)
      return {
        sucesso: true,
        dados: dadosMinha,
        aviso: 'Dados recuperados via Minha Receita (dados abertos da Receita Federal).',
      }
    } catch (_errMinha) {
      // 3. Fallback: ReceitaWS
      try {
        const dadosRws = await consultarReceitaWs(cnpjLimpo)
        const dadosEnriquecidos = await enriquecerDadosCnpjSeNecessario(dadosRws)
        return {
          sucesso: true,
          dados: dadosEnriquecidos,
          aviso: 'Dados recuperados via ReceitaWS (fonte de contingência).',
        }
      } catch (_errReceita) {
        // 4. Fallback: Backend Proxy (contorna CORS ou bloqueios de navegador)
        try {
          const dadosProxy = await consultarViaBackendProxy(cnpjLimpo)
          return {
            sucesso: true,
            dados: dadosProxy,
            aviso: 'Dados recuperados via serviço proxy seguro da Contabilidade 5.0.',
          }
        } catch (errProxy: any) {
          return {
            sucesso: false,
            erro:
              errProxy?.message ||
              'Não foi possível consultar os dados da empresa no momento. Verifique sua conexão ou tente novamente mais tarde.',
          }
        }
      }
    }
  }
}
