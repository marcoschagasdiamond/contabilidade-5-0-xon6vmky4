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
  descricao: string
}

export interface ItemSocioQsa {
  nome: string
  qualificacao: string
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
  fonte: 'brasilapi' | 'receitaws' | 'proxy'
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
export function mapearCnaeParaSegmento(
  cnaeCodigo: string,
  cnaeDescricao: string = '',
): SegmentoEmpresa {
  const codLimpo = cnaeCodigo.replace(/\D/g, '')
  const cod2 = codLimpo.slice(0, 2)
  const desc = cnaeDescricao.toLowerCase()

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
    desc.includes('odontol') ||
    desc.includes('hospital') ||
    desc.includes('fisioterap') ||
    desc.includes('psicol') ||
    desc.includes('laboratório') ||
    desc.includes('saúde humana')
  ) {
    return 'Saúde'
  }

  // Agro
  if (
    ['01', '02', '03'].includes(cod2) ||
    desc.includes('agropecu') ||
    desc.includes('agrícola') ||
    desc.includes('pecuária') ||
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
    desc.includes('obras') ||
    desc.includes('edifícios') ||
    desc.includes('engenharia') ||
    desc.includes('incorporação')
  ) {
    return 'Construção Civil'
  }

  // Transporte
  if (
    ['49', '50', '51', '52', '53'].includes(cod2) ||
    desc.includes('transporte') ||
    desc.includes('carga') ||
    desc.includes('logística') ||
    desc.includes('armazena') ||
    desc.includes('rodoviário') ||
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
    desc.includes('cafeteria')
  ) {
    return 'Bares e Restaurantes'
  }

  // Indústria (Divisões 05 a 33)
  const num2 = parseInt(cod2, 10)
  if (
    (!isNaN(num2) && num2 >= 5 && num2 <= 33) ||
    desc.includes('fabricação') ||
    desc.includes('indústria') ||
    desc.includes('manufatura') ||
    desc.includes('usinagem')
  ) {
    return 'Indústria'
  }

  // Comércio (Divisões 45, 46, 47)
  if (
    ['45', '46', '47'].includes(cod2) ||
    desc.includes('comércio') ||
    desc.includes('varejista') ||
    desc.includes('atacadista') ||
    desc.includes('distribuidora')
  ) {
    return 'Comércio'
  }

  // Serviços em geral (ou fallback Serviços)
  return 'Serviços'
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
      ? json.qsa.map((s: any) => ({
          nome: (s.nome_socio || '').trim(),
          qualificacao: (s.qualificacao_socio || '').trim(),
        }))
      : [],
    fonte: 'brasilapi',
    consultadoEm: new Date().toISOString(),
  }
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
      ? json.qsa.map((s: any) => ({
          nome: (s.nome || '').trim(),
          qualificacao: (s.qual || '').trim(),
        }))
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
    qsa: d.qsa || [],
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
    const dados = await consultarBrasilApi(cnpjLimpo)
    return { sucesso: true, dados }
  } catch (errBrasil: any) {
    const msgBrasil = errBrasil?.message || ''
    // Se explicitamente 404, não adianta tentar outro provedor se a empresa não existe
    if (msgBrasil.includes('não encontrado')) {
      return {
        sucesso: false,
        erro: 'CNPJ não encontrado na base pública da Receita Federal.',
      }
    }

    // 2. Fallback: ReceitaWS
    try {
      const dadosRws = await consultarReceitaWs(cnpjLimpo)
      return {
        sucesso: true,
        dados: dadosRws,
        aviso: 'Dados recuperados via ReceitaWS (fonte de contingência).',
      }
    } catch (_errReceita) {
      // 3. Fallback: Backend Proxy (contorna CORS ou bloqueios de navegador)
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
