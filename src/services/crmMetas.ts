import pb from '@/lib/pocketbase/client'
import type {
  CrmMetaRecord,
  SalvarMetaInput,
  DashboardMetasResultado,
  ItemIndicadorMeta,
  EstadoIndicadorMeta,
} from '@/types/crmMetas'
import type { CrmClienteRecord } from '@/types/crm'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function formatarMesAnoExtenso(mesAnoIso: string): string {
  if (!mesAnoIso || !mesAnoIso.includes('-')) return mesAnoIso
  const [anoStr, mesStr] = mesAnoIso.split('-')
  const mesIndex = parseInt(mesStr, 10) - 1
  const nomeMes = NOMES_MESES[mesIndex] || mesStr
  return `${nomeMes} de ${anoStr}`
}

export function obterMesAnoAtualIso(): string {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

export function classificarEstadoMeta(realizado: number, meta: number): EstadoIndicadorMeta {
  if (meta <= 0) {
    return realizado > 0 ? 'atingida' : 'em_progresso'
  }
  const pct = (realizado / meta) * 100
  if (pct >= 100) return 'atingida'
  if (pct >= 60) return 'em_progresso'
  return 'abaixo'
}

/**
 * Obtém a meta mensal de um analista para um período específico (YYYY-MM).
 */
export async function obterMetaMensal(
  mesAno: string,
  analistaId?: string,
): Promise<CrmMetaRecord | null> {
  const authUser = pb.authStore.record
  if (!authUser) return null

  const targetAnalista = analistaId || authUser.id

  try {
    const record = await pb
      .collection('crm_metas_analistas')
      .getFirstListItem<CrmMetaRecord>(
        `analista_id = "${targetAnalista}" && mes_ano = "${mesAno}"`,
        {
          expand: 'analista_id',
        },
      )
    return record
  } catch {
    return null
  }
}

/**
 * Salva ou atualiza as metas mensais do analista.
 */
export async function salvarMetaMensal(input: SalvarMetaInput): Promise<CrmMetaRecord> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário autenticado obrigatório para definir metas.')
  }

  const analistaId = input.analista_id || authUser.id
  const mesAno = input.mes_ano.trim()

  const payload = {
    analista_id: analistaId,
    mes_ano: mesAno,
    meta_novos_clientes:
      typeof input.meta_novos_clientes === 'number' ? input.meta_novos_clientes : 0,
    meta_receita_carteira:
      typeof input.meta_receita_carteira === 'number' ? input.meta_receita_carteira : 0,
    meta_creditos_recuperados:
      typeof input.meta_creditos_recuperados === 'number' ? input.meta_creditos_recuperados : 0,
    meta_diagnosticos_concluidos:
      typeof input.meta_diagnosticos_concluidos === 'number'
        ? input.meta_diagnosticos_concluidos
        : 0,
    observacoes: input.observacoes?.trim() || '',
  }

  // Verificar se já existe registro para esse analista e mês
  const metaExistente = await obterMetaMensal(mesAno, analistaId)

  if (metaExistente?.id) {
    return await pb
      .collection('crm_metas_analistas')
      .update<CrmMetaRecord>(metaExistente.id, payload, {
        expand: 'analista_id',
      })
  } else {
    return await pb.collection('crm_metas_analistas').create<CrmMetaRecord>(payload, {
      expand: 'analista_id',
    })
  }
}

/**
 * Carrega todos os indicadores reais e calcula o Dashboard de Metas para um determinado mês/ano.
 * Se o usuário for master ou admin, pode calcular consolidado de todas as carteiras
 * ou filtrar por uma carteira específica.
 */
export async function carregarDashboardMetas(params?: {
  mesAno?: string
  analistaFiltroId?: string
}): Promise<DashboardMetasResultado> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário não autenticado.')
  }

  const nivel = (authUser as any).nivel_acesso || (authUser as any).role
  const isMasterOrAdmin =
    nivel === 'master' ||
    nivel === 'admin' ||
    (authUser as any).role === 'admin' ||
    authUser.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com'

  const mesAno = params?.mesAno || obterMesAnoAtualIso()
  const [anoStr, mesStr] = mesAno.split('-')
  const inicioMesIso = `${anoStr}-${mesStr}-01`
  // Fim do mês (aproximação segura para filtro >= e <=)
  const ultimoDia = new Date(parseInt(anoStr, 10), parseInt(mesStr, 10), 0).getDate()
  const fimMesIso = `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, '0')} 23:59:59`

  // Define escopo de analista
  const ehVisaoConsolidada = isMasterOrAdmin && !params?.analistaFiltroId
  const analistaAlvoId = ehVisaoConsolidada ? '' : params?.analistaFiltroId || authUser.id

  // 1. Carregar fichas de crm_clientes do escopo
  let filtroCrm = ''
  if (!ehVisaoConsolidada) {
    filtroCrm = `analista_responsavel = "${analistaAlvoId}"`
  }

  let crmClientes: CrmClienteRecord[] = []
  try {
    crmClientes = await pb.collection('crm_clientes').getFullList<CrmClienteRecord>({
      filter: filtroCrm || undefined,
      sort: '-created',
      expand: 'empresa_id,analista_responsavel',
    })
  } catch (err) {
    console.warn('Erro ao carregar crm_clientes para metas:', err)
  }

  // Contar carteiras ativas
  const analistasSet = new Set<string>()
  crmClientes.forEach((c) => {
    if (c.analista_responsavel) analistasSet.add(c.analista_responsavel)
  })
  const totalCarteiras = Math.max(1, analistasSet.size)

  // (a) Indicador 1: Novos clientes captados no mês
  // Considera fichas criadas dentro do período do mês OU ativadas no período (data_entrada ou created no mês)
  const clientesCaptadosNoMes = crmClientes.filter((c) => {
    const dataCriacao = (c.created || '').slice(0, 7)
    const dataEntrada = (c.data_entrada || '').slice(0, 7)
    const statusAtivoOuOnboarding =
      c.status_comercial === 'Ativo' ||
      c.status_comercial === 'Onboarding' ||
      c.status_comercial === 'Prospect'
    return (dataCriacao === mesAno || dataEntrada === mesAno) && statusAtivoOuOnboarding
  })
  const realizadoNovosClientes = clientesCaptadosNoMes.length

  // (b) Indicador 2: Receita da carteira (soma do valor mensal dos clientes com status 'Ativo')
  // Clientes ativos na carteira e valor mensal
  const clientesAtivos = crmClientes.filter((c) => c.status_comercial === 'Ativo')
  const realizadoReceitaCarteira = clientesAtivos.reduce(
    (acc, curr) => acc + (curr.valor_mensal_servico || 0),
    0,
  )

  // (c) Indicador 3: Créditos recuperados no mês (do Recuperador de Créditos vinculados à carteira)
  // Cruzamento pelos CNPJs, empresas ou user_ids dos clientes da carteira
  const empresaUserIds = new Set<string>()
  const cnpjsCarteira = new Set<string>()

  crmClientes.forEach((c) => {
    const emp = (c as any).expand?.empresa_id
    if (emp?.user_id) empresaUserIds.add(emp.user_id)
    if (emp?.cnpj) cnpjsCarteira.add(emp.cnpj.replace(/\D/g, ''))
  })

  let realizadoCreditosRecuperados = 0
  try {
    // Buscar simulações do recuperador criadas dentro do mês selecionado
    // Se visão de analista sem empresas ainda, busca as do analista
    const filtrosRecup: string[] = [`created >= "${inicioMesIso}" && created <= "${fimMesIso}"`]
    if (!ehVisaoConsolidada) {
      const subFiltros: string[] = [`user_id = "${analistaAlvoId}"`]
      empresaUserIds.forEach((uid) => subFiltros.push(`user_id = "${uid}"`))
      filtrosRecup.push(`(${subFiltros.join(' || ')})`)
    }

    const simulacoesRecup = await pb
      .collection('simulacoes_recuperador')
      .getFullList<SimulacaoRecuperador>({
        filter: filtrosRecup.join(' && '),
      })

    realizadoCreditosRecuperados = simulacoesRecup.reduce(
      (acc, curr) => acc + (curr.total_recuperavel_integral || 0),
      0,
    )
  } catch (err) {
    console.warn('Erro ao consultar recuperador para metas:', err)
  }

  // (d) Indicador 4: Diagnósticos concluídos no mês (trilha 360° dos clientes da carteira)
  let realizadoDiagnosticosConcluidos = 0
  try {
    const filtrosDiag: string[] = [
      `created >= "${inicioMesIso}" && created <= "${fimMesIso}"`,
      `(regime_recomendado != "" || carga_simples > 0)`,
    ]
    if (!ehVisaoConsolidada) {
      const subFiltros: string[] = [`user_id = "${analistaAlvoId}"`]
      empresaUserIds.forEach((uid) => subFiltros.push(`user_id = "${uid}"`))
      filtrosDiag.push(`(${subFiltros.join(' || ')})`)
    }

    const diagnosticos = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
      filter: filtrosDiag.join(' && '),
    })

    realizadoDiagnosticosConcluidos = diagnosticos.length
  } catch (err) {
    console.warn('Erro ao consultar diagnósticos para metas:', err)
  }

  // 2. Carregar Metas do Período
  let metaRecord: CrmMetaRecord | null = null
  let metaNovosClientes = 0
  let metaReceitaCarteira = 0
  let metaCreditosRecuperados = 0
  let metaDiagnosticosConcluidos = 0

  if (ehVisaoConsolidada) {
    // Na visão consolidada master/admin: somar as metas de todos os analistas no mês
    try {
      const todasMetas = await pb.collection('crm_metas_analistas').getFullList<CrmMetaRecord>({
        filter: `mes_ano = "${mesAno}"`,
      })
      todasMetas.forEach((m) => {
        metaNovosClientes += m.meta_novos_clientes || 0
        metaReceitaCarteira += m.meta_receita_carteira || 0
        metaCreditosRecuperados += m.meta_creditos_recuperados || 0
        metaDiagnosticosConcluidos += m.meta_diagnosticos_concluidos || 0
      })
    } catch (err) {
      console.warn('Erro ao carregar metas consolidadas:', err)
    }
  } else {
    metaRecord = await obterMetaMensal(mesAno, analistaAlvoId)
    if (metaRecord) {
      metaNovosClientes = metaRecord.meta_novos_clientes || 0
      metaReceitaCarteira = metaRecord.meta_receita_carteira || 0
      metaCreditosRecuperados = metaRecord.meta_creditos_recuperados || 0
      metaDiagnosticosConcluidos = metaRecord.meta_diagnosticos_concluidos || 0
    }
  }

  // Utilitário para construir item
  function montarItem(
    id: ItemIndicadorMeta['id'],
    titulo: string,
    descricao: string,
    unidade: 'qtd' | 'moeda',
    realizado: number,
    meta: number,
  ): ItemIndicadorMeta {
    const percentual = meta > 0 ? (realizado / meta) * 100 : realizado > 0 ? 100 : 0
    const diferenca = realizado - meta
    const gapParaMeta = Math.max(0, meta - realizado)
    const estado = classificarEstadoMeta(realizado, meta)
    return {
      id,
      titulo,
      descricao,
      unidade,
      realizado,
      meta,
      percentual: Math.round(percentual * 10) / 10,
      diferenca,
      gapParaMeta,
      estado,
    }
  }

  const indNovosClientes = montarItem(
    'novos_clientes',
    'Novos Clientes Captados',
    'Fichas comerciais cadastradas/ativadas no mês',
    'qtd',
    realizadoNovosClientes,
    metaNovosClientes,
  )

  const indReceitaCarteira = montarItem(
    'receita_carteira',
    'Receita da Carteira',
    'Soma dos honorários mensais dos clientes ativos',
    'moeda',
    realizadoReceitaCarteira,
    metaReceitaCarteira,
  )

  const indCreditosRecuperados = montarItem(
    'creditos_recuperados',
    'Créditos Recuperados',
    'Levantamentos de recuperação tributária no mês',
    'moeda',
    realizadoCreditosRecuperados,
    metaCreditosRecuperados,
  )

  const indDiagnosticosConcluidos = montarItem(
    'diagnosticos_concluidos',
    'Diagnósticos Concluídos',
    'Diagnósticos 360° concluídos no mês',
    'qtd',
    realizadoDiagnosticosConcluidos,
    metaDiagnosticosConcluidos,
  )

  const listaIndicadores = [
    indNovosClientes,
    indReceitaCarteira,
    indCreditosRecuperados,
    indDiagnosticosConcluidos,
  ]

  // Encontrar o indicador mais distante da meta (menor percentual relativo onde meta > 0, ou maior gap)
  let indicadorMaisDistante = listaIndicadores[0]
  let menorPercentual = Infinity

  listaIndicadores.forEach((item) => {
    if (item.meta > 0 && item.percentual < menorPercentual) {
      menorPercentual = item.percentual
      indicadorMaisDistante = item
    }
  })

  // Resumo de atingimento geral
  const totalAtingidas = listaIndicadores.filter((i) => i.estado === 'atingida').length
  const totalEmProgresso = listaIndicadores.filter((i) => i.estado === 'em_progresso').length
  const totalAbaixo = listaIndicadores.filter((i) => i.estado === 'abaixo').length
  const percentualMedio =
    listaIndicadores.reduce((acc, curr) => acc + curr.percentual, 0) / listaIndicadores.length

  return {
    mesAno,
    mesAnoRotulo: formatarMesAnoExtenso(mesAno),
    analistaId: analistaAlvoId || authUser.id,
    analistaNome: ehVisaoConsolidada
      ? 'Visão Consolidada de Todas as Carteiras'
      : authUser.name || 'Analista',
    isVisaoConsolidada: ehVisaoConsolidada,
    totalCarteiras,
    indicadores: {
      novosClientes: indNovosClientes,
      receitaCarteira: indReceitaCarteira,
      creditosRecuperados: indCreditosRecuperados,
      diagnosticosConcluidos: indDiagnosticosConcluidos,
    },
    metaRecord,
    indicadorMaisDistante,
    resumoAtingimentoGeral: {
      totalAtingidas,
      totalEmProgresso,
      totalAbaixo,
      percentualMedio: Math.round(percentualMedio * 10) / 10,
    },
  }
}
