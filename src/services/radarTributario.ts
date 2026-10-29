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
  tipo: 'aliquota_nova' | 'legislacao_nova' | 'alerta_senado'
  tributo?: 'CBS' | 'IBS'
  ano?: number
  aliquota?: number
  fonte?: string
  lida?: boolean
  destinatario_id?: string
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
    tributo: 'Geral',
    dataPublicacao: '14/12/2011',
    ementa:
      'Desoneração da folha de pagamentos (CPRB) e cronograma de transição para o novo modelo de aproveitamento de créditos com a entrada plena do IBS/CBS.',
    linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm',
    destaque: false,
  },
]
