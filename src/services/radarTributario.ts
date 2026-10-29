import pb from '@/lib/pocketbase/client'

export interface ParametroTributario {
  id: string
  ano: number
  tributo: 'CBS' | 'IBS'
  aliquota: number
  situacao: 'proposta' | 'fixada'
  fonte: string
  data?: string
  detalhes?: string
  ativo?: boolean
  created?: string
  updated?: string
}

export interface NotificacaoTributaria {
  id: string
  titulo: string
  mensagem: string
  tipo: 'aliquota_nova' | 'legislacao_nova' | 'alerta_senado' | 'tese_jurisprudencia'
  tributo?: string
  ano?: number
  aliquota?: number
  fonte?: string
  lida?: boolean
  destinatario_id?: string
  link_acao?: string
  tese_id?: string
  created?: string
  updated?: string
}

export interface EtiquetasAplicabilidade {
  tributos?: string[]
  segmentos?: string[]
  regimes?: string[]
  operacoes?: string[]
  ramos?: string[]
}

export interface ItemLegislacao {
  id: string
  titulo: string
  tipo: string
  numero: string
  ano: number
  orgao: string
  tributo: string
  dataPublicacao: string
  ementa: string
  linkOficial: string
  destaque: boolean
  categoria?: 'legislacao' | 'jurisprudencia'
  natureza?: 'mudanca_impacto' | 'recuperacao_credito'
  teseRecuperadorId?: string
  dataJulgamento?: string
  etiquetas?: EtiquetasAplicabilidade
  prazoVigencia?: string
  alertaVencimento?: string
}

export interface PerfilEmpresaFiltro {
  segmento?: string
  regimeTributario?: string
  regimeAtual?: string
  perfilNf?: string
  emissaoNf?: string
  atividadeMista?: boolean
  ramo?: string
  tipoAtividade?: string
  faturamentoMensal?: number
}

export interface RespostaLegislacaoContextual {
  perfilPreenchido: boolean
  aviso?: string
  perfil?: PerfilEmpresaFiltro
  resumo?: {
    totalMudancas: number
    totalRecuperacao: number
    totalAlertasRadar: number
  }
  mudancasQueImpactam: ItemLegislacao[]
  direitoRecuperacaoCredito: ItemLegislacao[]
  alertasRadar: Array<{
    id: string
    titulo: string
    descricao: string
    tributo?: string
    impacto?: string
    data_hora?: string
  }>
}

export interface FiltrosLegislacao {
  q?: string
  tributo?: string
  ano?: string
  tipo?: string
}

/**
 * Busca os parâmetros tributários cadastrados (CBS/IBS)
 */
export async function listarParametrosTributarios(): Promise<ParametroTributario[]> {
  try {
    const records = await pb.collection('parametros_tributarios').getFullList<ParametroTributario>({
      sort: '-ano,-created',
      filter: 'ativo = true || ativo = null',
    })
    return records
  } catch (err) {
    console.warn('[Radar] Erro ao listar parâmetros da coleção (usando fallback):', err)
    return []
  }
}

/**
 * Obtém a alíquota mais atual para o tributo e ano desejados,
 * retornando os detalhes do registro oficial se existente
 */
export async function obterParametroPorAnoETributo(
  ano: number,
  tributo: 'CBS' | 'IBS',
): Promise<ParametroTributario | null> {
  try {
    const record = await pb
      .collection('parametros_tributarios')
      .getFirstListItem<ParametroTributario>(`ano = ${ano} && tributo = "${tributo}"`, {
        sort: '-created',
      })
    return record
  } catch {
    return null
  }
}

/**
 * Lista as notificações in-app sobre alíquotas novas e radares da Reforma
 */
export async function listarNotificacoesTributarias(): Promise<NotificacaoTributaria[]> {
  try {
    const records = await pb
      .collection('notificacoes_tributarias')
      .getFullList<NotificacaoTributaria>({
        sort: '-created',
        limit: 20,
      })
    return records
  } catch (err) {
    console.warn('[Radar] Erro ao listar notificações tributárias:', err)
    return []
  }
}

/**
 * Marca uma notificação como lida
 */
export async function marcarNotificacaoComoLida(id: string): Promise<boolean> {
  try {
    await pb.collection('notificacoes_tributarias').update(id, { lida: true })
    return true
  } catch (err) {
    console.warn('[Radar] Erro ao marcar notificação lida:', err)
    return false
  }
}

/**
 * Dispara varredura manual nas fontes oficiais (endpoint pb_hooks)
 */
export async function dispararVarreduraRadar(): Promise<{
  sucesso: boolean
  novosEncontrados?: number
  mensagem?: string
}> {
  try {
    const res = await pb.send<{ sucesso: boolean; novosEncontrados?: number; mensagem?: string }>(
      '/backend/v1/radar/sincronizar',
      { method: 'POST' },
    )
    return res
  } catch (err) {
    console.warn('[Radar] Falha ao disparar sincronização manual:', err)
    return { sucesso: false }
  }
}

/**
 * Consulta legislações tributárias (busca, filtros e fontes oficiais)
 */
export async function pesquisarLegislacao(filtros: FiltrosLegislacao = {}): Promise<{
  total: number
  itens: ItemLegislacao[]
}> {
  try {
    const params = new URLSearchParams()
    if (filtros.q) params.set('q', filtros.q)
    if (filtros.tributo && filtros.tributo !== 'TODOS') params.set('tributo', filtros.tributo)
    if (filtros.ano && filtros.ano !== 'TODOS') params.set('ano', filtros.ano)
    if (filtros.tipo && filtros.tipo !== 'todos') params.set('tipo', filtros.tipo)

    const queryStr = params.toString() ? `?${params.toString()}` : ''
    const res = await pb.send<{ total: number; itens: ItemLegislacao[] }>(
      `/backend/v1/legislacao/pesquisa${queryStr}`,
      { method: 'GET' },
    )
    return res
  } catch (err) {
    console.warn('[Radar] Erro ao consultar endpoint de legislação, usando catálogo local:', err)
    return {
      total: CATALOGO_LEGISLACAO_FALLBACK.length,
      itens: CATALOGO_LEGISLACAO_FALLBACK,
    }
  }
}

/**
 * Consulta o Rasante de Legislação Contextual para o perfil de empresa informado
 */
export async function obterLegislacaoContextual(
  perfil: PerfilEmpresaFiltro,
): Promise<RespostaLegislacaoContextual> {
  const temPerfil = Boolean(
    (perfil.segmento && perfil.segmento.trim()) ||
    (perfil.regimeTributario && perfil.regimeTributario.trim()) ||
    (perfil.regimeAtual && perfil.regimeAtual.trim()) ||
    (perfil.ramo && perfil.ramo.trim()) ||
    (perfil.tipoAtividade && perfil.tipoAtividade.trim()),
  )

  if (!temPerfil) {
    return {
      perfilPreenchido: false,
      aviso:
        'Perfil da empresa não preenchido. Preencha os Dados da Empresa para visualizar a legislação aplicável.',
      mudancasQueImpactam: [],
      direitoRecuperacaoCredito: [],
      alertasRadar: [],
    }
  }

  try {
    const res = await pb.send<RespostaLegislacaoContextual>(
      '/backend/v1/c50/legislacao/contextual',
      {
        method: 'POST',
        body: JSON.stringify(perfil),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return res
  } catch (err) {
    console.warn(
      '[Radar] Erro ao buscar legislação contextual via backend, usando fallback local:',
      err,
    )

    // Fallback local se backend estiver offline
    const seg = (perfil.segmento || '').toLowerCase()
    const reg = (perfil.regimeTributario || perfil.regimeAtual || '').toLowerCase()
    const isSimples = reg.includes('simples')
    const isReal = reg.includes('real')
    const isIndustria = seg.includes('indústria') || seg.includes('industria')
    const isServico = seg.includes('serviço') || seg.includes('servico')

    const mudancasQueImpactam = CATALOGO_LEGISLACAO_FALLBACK.filter((item) => {
      if (item.categoria === 'jurisprudencia') return false
      if (item.tributo === 'IPI' && !isIndustria) return false
      if (item.tributo === 'ISS' && !isServico && !perfil.atividadeMista) return false

      // Regras de regime:
      // Se for Lucro Real: não mostrar legislação exclusiva do Simples Nacional
      if (
        isReal &&
        (item.id === 'lc-123-2006-simples' || item.id === 'lc-214-2025-simples-nacional')
      ) {
        return false
      }
      // Se for Simples Nacional: leis exclusivas de Lucro Real/Presumido (PIS/Cofins não-cumulativo, IRPJ/CSLL Lucro Real) não se aplicam diretamente
      if (isSimples) {
        if (
          item.id === 'lei-10637-2002-pis' ||
          item.id === 'lei-10833-2003-cofins' ||
          item.id === 'lei-12973-2014-irpj' ||
          item.id === 'decreto-7212-2010-ripi' ||
          item.id === 'lei-4502-1964-ipi'
        ) {
          return false
        }
      }

      return true
    })

    const direitoRecuperacaoCredito = CATALOGO_LEGISLACAO_FALLBACK.filter((item) => {
      if (item.categoria !== 'jurisprudencia' && item.natureza !== 'recuperacao_credito')
        return false
      // Teses de PIS/Cofins, IPI e teses exclusivas de Lucro Real/Presumido (ex: Tema 959/STF) NUNCA aparecem para Simples Nacional
      if (isSimples) {
        if (
          item.id === 'juris-stf-re-592616-tema-118' ||
          item.id === 'juris-stf-re-574706-tema-69' ||
          item.id === 'juris-stj-tema-1182-resp-1945110' ||
          item.id === 'juris-stj-tema-77-resp-1075508' ||
          item.id === 'juris-stf-tema-959-re-1187264' ||
          item.id === 'juris-stf-tema-1079-fapi-salario-educacao' ||
          item.id === 'juris-stf-tema-1023-jcp-pis-cofins' ||
          item.tributo === 'PIS/Cofins' ||
          item.tributo === 'IPI'
        ) {
          return false
        }
      }
      if (item.id === 'juris-stj-tema-77-resp-1075508' && !isIndustria) return false
      if (item.id === 'juris-stf-re-592616-tema-118' && !isServico && !perfil.atividadeMista)
        return false
      return true
    })

    return {
      perfilPreenchido: true,
      perfil,
      resumo: {
        totalMudancas: mudancasQueImpactam.length,
        totalRecuperacao: direitoRecuperacaoCredito.length,
        totalAlertasRadar: 2,
      },
      mudancasQueImpactam,
      direitoRecuperacaoCredito,
      alertasRadar: [
        {
          id: 'radar-aliquota-cbs-2027',
          titulo: 'Alíquota de Referência CBS fixada em 11,35%',
          descricao: 'TCU aprovou relatório de alíquota da CBS para 2027. Impacto na apuração.',
          tributo: 'CBS',
          impacto: 'alto',
        },
      ],
    }
  }
}

/**
 * Catálogo estático garantido para fallback total sem rede
 */
export const CATALOGO_LEGISLACAO_FALLBACK: ItemLegislacao[] = [
  // Jurisprudência-Chave Vinculante para Recuperação de Créditos (STF / STJ)
  {
    id: 'juris-stf-re-592616-tema-118',
    titulo: 'STF — RE 592.616 (Tema 118 RG): ISS não integra a base de cálculo do PIS/Cofins',
    tipo: 'Jurisprudência / STF',
    numero: 'RE 592.616 (Tema 118)',
    ano: 2026,
    orgao: 'Supremo Tribunal Federal (STF)',
    tributo: 'PIS/Cofins',
    dataPublicacao: '21/10/2026',
    ementa:
      'Tese fixada pelo Plenário do STF sob repercussão geral: o valor recolhido a título de ISS não integra a base de cálculo das contribuições ao PIS e à Cofins, assegurando o direito à repetição e compensação administrativa de indébito para empresas tomadoras e prestadoras.',
    linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=118',
    destaque: true,
    categoria: 'jurisprudencia',
    teseRecuperadorId: 'tese_pis_iss_servicos',
    dataJulgamento: '21/10/2026',
  },
  {
    id: 'juris-stf-re-574706-tema-69',
    titulo:
      'STF — RE 574.706 e RE 594.339: Exclusão do ICMS da Base do PIS/Cofins (Tese do Século)',
    tipo: 'Jurisprudência / STF',
    numero: 'RE 574.706 / RE 594.339',
    ano: 2021,
    orgao: 'Supremo Tribunal Federal (STF)',
    tributo: 'PIS/Cofins',
    dataPublicacao: '13/05/2021',
    ementa:
      'Julgamento histórico do Tema 69/STF transitado em julgado: o ICMS destacado nas notas fiscais não se incorpora ao patrimônio do contribuinte e não compõe a receita bruta para fins de apuração de PIS/Cofins, com modulação dos efeitos a partir de 15/03/2017.',
    linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=69',
    destaque: true,
    categoria: 'jurisprudencia',
    teseRecuperadorId: 'tese_pis_icms_base',
    dataJulgamento: '13/05/2021',
  },
  {
    id: 'juris-stj-tema-1182-resp-1945110',
    titulo:
      'STJ — Tema 1182 (REsp 1.945.110/RN): Exclusão de Benefícios e Crédito Presumido de ICMS',
    tipo: 'Jurisprudência / STJ',
    numero: 'Tema 1182 / REsp 1.945.110',
    ano: 2023,
    orgao: 'Superior Tribunal de Justiça (STJ)',
    tributo: 'ICMS',
    dataPublicacao: '26/04/2023',
    ementa:
      'Primeira Seção do STJ fixou tese vinculante sobre a não incidência de PIS/Cofins e IRPJ/CSLL sobre incentivos fiscais estaduais de ICMS (crédito presumido, isenção e redução de base), preenchidos os requisitos formais de reserva de incentivos fiscais.',
    linkOficial:
      'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1182&cod_tema_final=1182',
    destaque: true,
    categoria: 'jurisprudencia',
    teseRecuperadorId: 'tese_pis_subvencao_icms',
    dataJulgamento: '26/04/2023',
  },
  {
    id: 'juris-stj-tema-77-resp-1075508',
    titulo: 'STJ — Tema 77 (REsp 1.075.508/SC): Crédito de IPI na Entrada de Insumos Desonerados',
    tipo: 'Jurisprudência / STJ',
    numero: 'Tema 77 / REsp 1.075.508',
    ano: 2009,
    orgao: 'Superior Tribunal de Justiça (STJ)',
    tributo: 'IPI',
    dataPublicacao: '24/06/2009',
    ementa:
      'Direito ao creditamento de IPI na aquisição de matérias-primas, produtos intermediários e insumos industriais aplicados na industrialização de produtos finais tributados à alíquota zero ou desonerados, assegurando a não cumulatividade constitucional.',
    linkOficial:
      'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=77&cod_tema_final=77',
    destaque: true,
    categoria: 'jurisprudencia',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_pis_insumos_presumido',
    dataJulgamento: '24/06/2009',
    etiquetas: {
      tributos: ['IPI'],
      segmentos: ['Indústria'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'Geral'],
      ramos: ['industria', 'misto'],
    },
  },
  {
    id: 'juris-stf-tema-959-re-1187264',
    titulo:
      'STF — Tema 959 (RE 1.187.264): Exclusão do ICMS da Base do INSS/CPRB (Tese dos Desembolsos)',
    tipo: 'Jurisprudência / STF',
    numero: 'Tema 959 / RE 1.187.264',
    ano: 2021,
    orgao: 'Supremo Tribunal Federal (STF)',
    tributo: 'INSS',
    dataPublicacao: '24/02/2021',
    ementa:
      'Fixação pelo Plenário do STF: é inconstitucional a inclusão do ICMS destacado na base de cálculo da CPRB (Contribuição Previdenciária sobre a Receita Bruta), aplicando a tese dos desembolsos e vedando tributação de valores que não compõem faturamento. Aplicável estritamente a Lucro Real e Lucro Presumido.',
    linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=959',
    destaque: true,
    categoria: 'jurisprudencia',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_folha_icms_base_inss_tema_959',
    dataJulgamento: '24/02/2021',
    etiquetas: {
      tributos: ['INSS', 'ICMS'],
      segmentos: [
        'Comércio',
        'Indústria',
        'Agro',
        'Transporte',
        'Bares e Restaurantes',
        'Construção Civil',
        'Tecnologia',
      ],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['comercio', 'industria', 'agronegocio', 'construcao_civil', 'servico', 'misto'],
    },
  },
  {
    id: 'juris-stf-tema-1079-fapi-salario-educacao',
    titulo:
      'STF/STJ — Tema 1079 / Salário-Educação e FAPI: Limitação de 20 Salários Mínimos e Verbas Indenizatórias',
    tipo: 'Jurisprudência / STF',
    numero: 'Tema 1079 / REsp 1.570.980',
    ano: 2024,
    orgao: 'Superior Tribunal de Justiça (STJ) / STF',
    tributo: 'INSS',
    dataPublicacao: '13/03/2024',
    ementa:
      'Direito à recuperação de recolhimentos indevidos das contribuições ao Salário-Educação e Fundo de Aposentadoria Programada Individual (FAPI/Previdência Complementar), afastando a base de cálculo sem teto legal ou sobre verbas não remuneratórias (Lei 6.950/1981 art. 4º).',
    linkOficial:
      'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1079&cod_tema_final=1079',
    destaque: true,
    categoria: 'jurisprudencia',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_folha_salario_educacao_fapi',
    dataJulgamento: '13/03/2024',
    etiquetas: {
      tributos: ['INSS'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'juris-stf-tema-1023-jcp-pis-cofins',
    titulo:
      'STF — Tema 1023 (RE 1.072.485): Exclusão de Juros sobre Capital Próprio (JCP) da Base do PIS/Cofins',
    tipo: 'Jurisprudência / STF',
    numero: 'Tema 1023 / RE 1.072.485',
    ano: 2023,
    orgao: 'Supremo Tribunal Federal (STF)',
    tributo: 'PIS/Cofins',
    dataPublicacao: '18/08/2023',
    ementa:
      'Não incidência de PIS e Cofins sobre receitas auferidas a título de Juros sobre o Capital Próprio (JCP), por constituírem remuneração de capital próprio/distribuição patrimonial e não receita bruta operacional de venda de bens ou serviços. Cabível para pessoas jurídicas no Lucro Real e Presumido.',
    linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=1023',
    destaque: true,
    categoria: 'jurisprudencia',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_pis_juros_capital_proprio',
    dataJulgamento: '18/08/2023',
    etiquetas: {
      tributos: ['PIS/Cofins'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },

  // Reforma Tributária
  {
    id: 'ec-132-2023',
    titulo: 'Emenda Constitucional nº 132/2023',
    tipo: 'Emenda Constitucional',
    numero: '132',
    ano: 2023,
    orgao: 'Congresso Nacional',
    tributo: 'Geral',
    dataPublicacao: '20/12/2023',
    ementa:
      'Altera o Sistema Tributário Nacional para instituir a Reforma Tributária sobre o consumo, criando o IBS, a CBS e o Imposto Seletivo (IS), e estabelecendo regras de transição federativa até 2033.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Cronograma 2026–2033',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['IBS', 'CBS', 'IS', 'Geral'],
      segmentos: ['Todos'],
      regimes: ['Todos'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'lc-214-2025',
    titulo: 'Lei Complementar nº 214/2025',
    tipo: 'Lei Complementar',
    numero: '214',
    ano: 2025,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'Geral',
    dataPublicacao: '15/01/2025',
    ementa:
      'Institui o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS); dispõe sobre o processo administrativo fiscal e as hipóteses de redução e alíquota zero.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena até 2033',
    alertaVencimento: 'Teste em 2026, vigência CBS 2027',
    etiquetas: {
      tributos: ['IBS', 'CBS', 'IS', 'Geral'],
      segmentos: ['Todos'],
      regimes: ['Todos'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'pln-24-2026',
    titulo: 'Projeto de Lei nº 24/2026 (PLN 24/2026)',
    tipo: 'Projeto de Lei',
    numero: '24',
    ano: 2026,
    orgao: 'Congresso Nacional / Comissão Mista de Orçamento',
    tributo: 'CBS',
    dataPublicacao: '10/06/2026',
    ementa:
      'Dispõe sobre as diretrizes orçamentárias e financeiras da partilha e compensação federal da CBS durante o exercício de transição de 2027 perante os fundos federativos.',
    linkOficial: 'https://www.congressonacional.leg.br/materias/materias-orcamentarias/pln-24-2026',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Exercício 2026–2027',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['CBS'],
      segmentos: ['Todos'],
      regimes: ['Todos'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'tcu-acordao-cbs-2027',
    titulo: 'Acórdão TCU nº 2341/2026 — Alíquota de Referência da CBS',
    tipo: 'Acórdão / Decisão',
    numero: '2341',
    ano: 2026,
    orgao: 'Tribunal de Contas da União (TCU)',
    tributo: 'CBS',
    dataPublicacao: '28/10/2026',
    ementa:
      'Aprova o relatório de cálculo da alíquota de referência da Contribuição sobre Bens e Serviços (CBS) fixada em 11,3468% para 2027 e submete a proposta ao Senado Federal para deliberação até 15/12/2026.',
    linkOficial:
      'https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/2341%252F2026/SESSAO%2520PLENARIA',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Prazo Senado: até 15/12/2026',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['CBS'],
      segmentos: ['Todos'],
      regimes: ['Todos'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'lc-123-2006-simples',
    titulo: 'Lei Complementar nº 123/2006 (Estatuto Nacional da MPE)',
    tipo: 'Lei Complementar',
    numero: '123',
    ano: 2006,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'Geral',
    dataPublicacao: '14/12/2006',
    ementa:
      'Institui o Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte (Simples Nacional), estabelecendo regime único de arrecadação, tributação simplificada e tratamento jurídico diferenciado.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência por prazo indeterminado (transição até 2033)',
    alertaVencimento: 'Vigência até 2033',
    etiquetas: {
      tributos: ['Geral', 'Simples Nacional', 'IBS', 'CBS'],
      segmentos: ['Todos'],
      regimes: ['Simples Nacional'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'lc-214-2025-simples-nacional',
    titulo: 'LC 214/2025 — Regras do Simples Nacional na Transição (IBS/CBS no DAS)',
    tipo: 'Lei Complementar',
    numero: '214 (Simples)',
    ano: 2025,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'Geral',
    dataPublicacao: '15/01/2025',
    ementa:
      'Regras de permanência das micro e pequenas empresas no Simples Nacional durante a transição da Reforma Tributária: manutenção do regime único com recolhimento de CBS e IBS dentro do DAS ou opção pelo recolhimento por fora com transferência integral de créditos.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Regime de transição 2027–2032',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['IBS', 'CBS', 'Simples Nacional'],
      segmentos: ['Todos'],
      regimes: ['Simples Nacional'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'senado-resolucao-cbs-ibs',
    titulo: 'Resolução do Senado Federal — Fixação da Alíquota de Referência',
    tipo: 'Resolução',
    numero: 'Em tramitação',
    ano: 2026,
    orgao: 'Senado Federal',
    tributo: 'CBS',
    dataPublicacao: 'Previsão: até 15/12/2026',
    ementa:
      'Fixa as alíquotas de referência da CBS federal e as diretrizes normativas das alíquotas de referência do IBS para os entes federados, sob rito do art. 130 do ADCT.',
    linkOficial:
      'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?ano=2026&palavraChave=CBS',
    destaque: true,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Deliberação obrigatória em 2026',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['CBS', 'IBS'],
      segmentos: ['Todos'],
      regimes: ['Todos'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'lei-12546-desoneracao',
    titulo: 'Lei nº 12.546/2011 e LC 214/2025 art. 482',
    tipo: 'Lei Ordinária',
    numero: '12546',
    ano: 2011,
    orgao: 'Presidência da República',
    tributo: 'INSS',
    dataPublicacao: '14/12/2011',
    ementa:
      'Desoneração da folha de pagamentos (CPRB) e cronograma de transição para o novo modelo de aproveitamento de créditos com a entrada plena do IBS/CBS.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_folha_desoneracao_12546',
    prazoVigencia: 'Cronograma regressivo até 2027',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['INSS'],
      segmentos: ['Transporte', 'Construção Civil', 'Tecnologia', 'Indústria'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'Geral'],
      ramos: ['industria', 'construcao_civil', 'servico'],
    },
  },

  // Legislação-Chave por Tributo
  // ICMS
  {
    id: 'lc-87-1996-kandir',
    titulo: 'Lei Complementar nº 87/1996 (Lei Kandir)',
    tipo: 'Lei Complementar',
    numero: '87',
    ano: 1996,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'ICMS',
    dataPublicacao: '13/09/1996',
    ementa:
      'Dispõe sobre o imposto dos Estados e do Distrito Federal sobre operações relativas à circulação de mercadorias e sobre prestações de serviços de transporte interestadual e intermunicipal e de comunicação (ICMS).',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Extinção gradual de 2029 a 2032',
    alertaVencimento: 'Vigência até 2033',
    etiquetas: {
      tributos: ['ICMS'],
      segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
      regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['comercio', 'industria', 'agronegocio', 'food_service', 'misto'],
    },
  },
  {
    id: 'lc-190-2022-difal',
    titulo: 'Lei Complementar nº 190/2022 (DIFAL ICMS)',
    tipo: 'Lei Complementar',
    numero: '190',
    ano: 2022,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'ICMS',
    dataPublicacao: '04/01/2022',
    ementa:
      'Regulamenta a cobrança do Diferencial de Alíquota (DIFAL) do ICMS nas operações e prestações interestaduais destinadas a consumidor final não contribuinte do imposto.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp190.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Substituição pelo princípio do destino na LC 214/2025',
    alertaVencimento: 'Fase muda em 2029',
    etiquetas: {
      tributos: ['ICMS'],
      segmentos: ['Comércio', 'Indústria', 'Bares e Restaurantes'],
      regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
      operacoes: ['B2C', 'Geral'],
      ramos: ['comercio', 'industria', 'food_service', 'misto'],
    },
  },

  // IPI
  {
    id: 'decreto-7212-2010-ripi',
    titulo: 'Decreto nº 7.212/2010 (RIPI - Regulamento do IPI)',
    tipo: 'Decreto Federal',
    numero: '7212',
    ano: 2010,
    orgao: 'Presidência da República',
    tributo: 'IPI',
    dataPublicacao: '15/06/2010',
    ementa:
      'Regulamenta a cobrança, fiscalização, arrecadação e administração do Imposto sobre Produtos Industrializados (IPI), definindo fato gerador, estabelecimento industrial e equiparados.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/decreto/d7212.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Alíquotas reduzidas a zero a partir de 2027 (salvo ZFM)',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['IPI'],
      segmentos: ['Indústria'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'Geral'],
      ramos: ['industria', 'misto'],
    },
  },
  {
    id: 'lei-4502-1964-ipi',
    titulo: 'Lei nº 4.502/1964 (Lei Básica do IPI)',
    tipo: 'Lei Ordinária',
    numero: '4502',
    ano: 1964,
    orgao: 'Presidência da República',
    tributo: 'IPI',
    dataPublicacao: '30/11/1964',
    ementa:
      'Dispõe sobre o imposto de consumo e reorganiza a tributação dos produtos industrializados no ordenamento nacional.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l4502.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Revogação gradativa e transição para o Imposto Seletivo (IS)',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['IPI'],
      segmentos: ['Indústria'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'Geral'],
      ramos: ['industria', 'misto'],
    },
  },

  // PIS / COFINS
  {
    id: 'lei-10637-2002-pis',
    titulo: 'Lei nº 10.637/2002 (PIS Não Cumulativo)',
    tipo: 'Lei Ordinária',
    numero: '10637',
    ano: 2002,
    orgao: 'Presidência da República',
    tributo: 'PIS/Cofins',
    dataPublicacao: '30/12/2002',
    ementa:
      'Dispõe sobre a não-cumulatividade na cobrança da contribuição para os Programas de Integração Social (PIS) e de Formação do Patrimônio do Servidor Público (Pasep).',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10637.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Extinção definitiva e substituição pela CBS em 2027',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['PIS/Cofins'],
      segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
      regimes: ['Lucro Real'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
    },
  },
  {
    id: 'lei-10833-2003-cofins',
    titulo: 'Lei nº 10.833/2003 (Cofins Não Cumulativa)',
    tipo: 'Lei Ordinária',
    numero: '10833',
    ano: 2003,
    orgao: 'Presidência da República',
    tributo: 'PIS/Cofins',
    dataPublicacao: '29/12/2003',
    ementa:
      'Altera a Legislação Tributária Federal e dispõe sobre a cobrança não-cumulativa da Contribuição para o Financiamento da Seguridade Social (Cofins).',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10833.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Extinção definitiva e substituição pela CBS em 2027',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['PIS/Cofins'],
      segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
      regimes: ['Lucro Real'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
    },
  },
  {
    id: 'in-rfb-2121-2022-pis-cofins',
    titulo: 'Instrução Normativa RFB nº 2.121/2022 (Consolidação PIS/Cofins)',
    tipo: 'Instrução Normativa',
    numero: '2121',
    ano: 2022,
    orgao: 'Receita Federal do Brasil (RFB)',
    tributo: 'PIS/Cofins',
    dataPublicacao: '15/12/2022',
    ementa:
      'Consolida as normas sobre a apuração, a cobrança, a fiscalização, a arrecadação e a administração da Contribuição para o PIS/Pasep e da Cofins.',
    linkOficial: 'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=127926',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Aplicabilidade plena até dezembro de 2026',
    alertaVencimento: 'Fase muda em 2027',
    etiquetas: {
      tributos: ['PIS/Cofins'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },

  // ISS
  {
    id: 'lc-116-2003-iss',
    titulo: 'Lei Complementar nº 116/2003 (Lei Geral do ISSQN)',
    tipo: 'Lei Complementar',
    numero: '116',
    ano: 2003,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'ISS',
    dataPublicacao: '31/07/2003',
    ementa:
      'Dispõe sobre o Imposto Sobre Serviços de Qualquer Natureza, de competência dos Municípios e do Distrito Federal, e fixa a Lista de Serviços Anexa.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Transição federativa com extinção gradual 2029–2032',
    alertaVencimento: 'Vigência até 2033',
    etiquetas: {
      tributos: ['ISS'],
      segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
      regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['servico', 'construcao_civil', 'locacao_bens', 'misto'],
    },
  },
  {
    id: 'lc-175-2020-iss',
    titulo: 'Lei Complementar nº 175/2020 (Padrão Nacional do ISS)',
    tipo: 'Lei Complementar',
    numero: '175',
    ano: 2020,
    orgao: 'Presidência da República / Congresso Nacional',
    tributo: 'ISS',
    dataPublicacao: '23/09/2020',
    ementa:
      'Dispõe sobre o padrão nacional de obrigação acessória do ISSQN incidente sobre planos de saúde, leasing, cartões de crédito/débito e fundos.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp175.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Integração ao Comitê Gestor do IBS (LC 214/2025)',
    alertaVencimento: 'Vigência até 2033',
    etiquetas: {
      tributos: ['ISS'],
      segmentos: ['Serviços', 'Saúde', 'Tecnologia'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['B2B', 'B2C', 'Geral'],
      ramos: ['servico', 'misto'],
    },
  },

  // IRPJ
  {
    id: 'lei-12973-2014-irpj',
    titulo: 'Lei nº 12.973/2014 (Adequação aos Padrões IFRS)',
    tipo: 'Lei Ordinária',
    numero: '12973',
    ano: 2014,
    orgao: 'Presidência da República',
    tributo: 'IRPJ',
    dataPublicacao: '13/05/2014',
    ementa:
      'Altera a legislação tributária federal relativa ao IRPJ, CSLL, PIS e Cofins; revoga o Regime Tributário de Transição (RTT) e adapta as regras fiscais às normas contábeis internacionais (IFRS).',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12973.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena e contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['IRPJ', 'CSLL', 'PIS/Cofins'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'decreto-9580-2018-rir',
    titulo: 'Decreto nº 9.580/2018 (RIR/2018 - Regulamento do IR)',
    tipo: 'Decreto Federal',
    numero: '9580',
    ano: 2018,
    orgao: 'Presidência da República',
    tributo: 'IRPJ',
    dataPublicacao: '22/11/2018',
    ementa:
      'Regulamenta a tributação, a fiscalização, a arrecadação e a administração do Imposto sobre a Renda e Proventos de Qualquer Natureza (Lucro Real, Presumido e Arbitrado).',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9580.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena e contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['IRPJ'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'lei-9249-1995-irpj',
    titulo: 'Lei nº 9.249/1995 (Bases de Cálculo do IRPJ e JCP)',
    tipo: 'Lei Ordinária',
    numero: '9249',
    ano: 1995,
    orgao: 'Presidência da República',
    tributo: 'IRPJ',
    dataPublicacao: '26/12/1995',
    ementa:
      'Altera a legislação do imposto de renda das pessoas jurídicas, define as regras de Juros sobre Capital Próprio (JCP), apuração do Lucro Real e percentuais do Lucro Presumido.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l9249.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena e contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['IRPJ'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },

  // CSLL
  {
    id: 'lei-7689-1988-csll',
    titulo: 'Lei nº 7.689/1988 (Instituição da CSLL)',
    tipo: 'Lei Ordinária',
    numero: '7689',
    ano: 1988,
    orgao: 'Presidência da República',
    tributo: 'CSLL',
    dataPublicacao: '15/12/1988',
    ementa:
      'Institui a Contribuição Social sobre o Lucro das Pessoas Jurídicas (CSLL) destinada ao financiamento da Seguridade Social.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l7689.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena e contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['CSLL'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'in-rfb-1700-2017-irpj-csll',
    titulo: 'Instrução Normativa RFB nº 1.700/2017 (Apuração IRPJ e CSLL)',
    tipo: 'Instrução Normativa',
    numero: '1700',
    ano: 2017,
    orgao: 'Receita Federal do Brasil (RFB)',
    tributo: 'CSLL',
    dataPublicacao: '14/03/2017',
    ementa:
      'Dispõe sobre a determinação e o pagamento do IRPJ e da CSLL devidos pelas pessoas jurídicas e disciplina o tratamento tributário do Lucro Real, Presumido e Arbitrado.',
    linkOficial: 'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=81268',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência plena e contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['CSLL', 'IRPJ'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },

  // INSS
  {
    id: 'lei-8212-1991-custeio',
    titulo: 'Lei nº 8.212/1991 (Lei Orgânica da Seguridade Social)',
    tipo: 'Lei Ordinária',
    numero: '8212',
    ano: 1991,
    orgao: 'Presidência da República',
    tributo: 'INSS',
    dataPublicacao: '24/07/1991',
    ementa:
      'Dispõe sobre a organização da Seguridade Social, institui Plano de Custeio e as contribuições sociais sobre folha, faturamento e lucro.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'mudanca_impacto',
    prazoVigencia: 'Vigência contínua (com transição da CPRB)',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['INSS'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
  {
    id: 'in-rfb-2110-2022-inss',
    titulo: 'Instrução Normativa RFB nº 2.110/2022 (Normas Gerais da CPRB e INSS)',
    tipo: 'Instrução Normativa',
    numero: '2110',
    ano: 2022,
    orgao: 'Receita Federal do Brasil (RFB)',
    tributo: 'INSS',
    dataPublicacao: '17/10/2022',
    ementa:
      'Dispõe sobre as normas gerais de tributação previdenciária e de arrecadação das contribuições sociais destinadas à Previdência Social e de outras entidades/fundos.',
    linkOficial: 'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=126484',
    destaque: false,
    categoria: 'legislacao',
    natureza: 'recuperacao_credito',
    teseRecuperadorId: 'tese_folha_inss_verbas_indenizatorias',
    prazoVigencia: 'Vigência contínua',
    alertaVencimento: 'Vigência contínua',
    etiquetas: {
      tributos: ['INSS'],
      segmentos: ['Todos'],
      regimes: ['Lucro Real', 'Lucro Presumido'],
      operacoes: ['Todos'],
      ramos: ['Todos'],
    },
  },
]
