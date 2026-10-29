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
  teseRecuperadorId?: string
  dataJulgamento?: string
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
    teseRecuperadorId: 'tese_pis_insumos_presumido',
    dataJulgamento: '24/06/2009',
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
  },
]
