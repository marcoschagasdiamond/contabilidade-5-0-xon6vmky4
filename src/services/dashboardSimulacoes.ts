import pb from '@/lib/pocketbase/client'
import { listarSimulacoes, carregarSimulacoesLocais } from '@/services/simulacoesCalculadora'
import {
  listarSimulacoesRecuperador,
  carregarSimulacoesRecuperadorLocais,
} from '@/services/simulacoesRecuperador'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { CrmClienteRecord } from '@/types/crm'

export type TipoItemSimulacao = 'calculadora' | 'recuperador'

export interface ItemSimulacaoUnificado {
  id: string
  tipo: TipoItemSimulacao
  nome: string
  empresa: string
  cnpj: string
  regime: string
  created: string
  updated?: string
  origem: 'nuvem' | 'local'
  user_id?: string
  cliente_id?: string | null
  // Valores específicos
  economiaAnualOuTotal: number
  aliquotaEfetiva?: number
  faturamentoMensal?: number
  // Para Recuperador
  totalRecuperavelIntegral?: number
  totalRecuperavelConservador?: number
  // Objeto original completo
  rawCalculadora?: SimulacaoCalculadora
  rawRecuperador?: SimulacaoRecuperador
}

export interface PontoTransicaoConsolidado {
  ano: number | 'atual'
  anoLabel: string
  // Imposto anual médio projetado no novo sistema (IBS/CBS)
  impostoNovoMedio: number
  // Imposto anual médio projetado no sistema atual
  impostoAtualMedio: number
  // Diferença média (Novo - Atual)
  diferencaMedia: number
  // Alíquota média total (%)
  aliquotaTotalMedia: number
  // Quantas simulações contribuíram com esse ponto
  amostras: number
}

export interface ResumoDashboardSimulacoes {
  totalSimulacoes: number
  totalCalculadora: number
  totalRecuperador: number
  totalEmpresasUnicas: number
  // Totais agregados
  somaEconomiaCalculadoraAnual: number
  somaCreditosRecuperador: number
  somaCreditosConservador: number
  // Gráfico da transição consolidado (2026 a 2033)
  pontosTransicao: PontoTransicaoConsolidado[]
  // Lista de itens unificados
  itens: ItemSimulacaoUnificado[]
  // Contexto de visão
  isVisaoCarteira: boolean
  totalClientesCarteira?: number
}

/**
 * Carrega e consolida todas as simulações acessíveis ao usuário atual de acordo com seu papel:
 * - Empresário: somente as próprias simulações (user_id = authUser.id)
 * - Analista: simulações próprias + simulações dos clientes da sua carteira (CRM / clientes_empresas)
 * - Master / Admin: simulações de todos os usuários do sistema
 */
export async function carregarDadosDashboardSimulacoes(): Promise<ResumoDashboardSimulacoes> {
  const authUser = pb.authStore.record
  if (!authUser) {
    const locaisCalc = carregarSimulacoesLocais()
    const locaisRecup = carregarSimulacoesRecuperadorLocais()
    return consolidarItens(locaisCalc, locaisRecup, false)
  }

  const nivel = ((authUser as any).nivel_acesso || (authUser as any).role || '') as string
  const perfil = ((authUser as any).perfil || '') as string
  const email = (authUser.email || '').toLowerCase()

  const isMasterOrAdmin =
    nivel === 'master' ||
    nivel === 'admin' ||
    (authUser as any).role === 'admin' ||
    email === 'marcoschagasdiamond@icloud.com'

  const isEmpresario = !isMasterOrAdmin && (nivel === 'empresario' || perfil === 'empresario')

  let listaCalc: SimulacaoCalculadora[] = []
  let listaRecup: SimulacaoRecuperador[] = []
  let totalClientesCarteira = 0
  let isVisaoCarteira = !isEmpresario

  if (isEmpresario) {
    // Apenas simulações do próprio usuário
    listaCalc = await listarSimulacoes(authUser.id)
    listaRecup = await listarSimulacoesRecuperador(authUser.id)
  } else if (isMasterOrAdmin) {
    // Vê tudo
    try {
      const recordsCalc = await pb.collection('simulacoes_calculadora').getFullList<any>({
        sort: '-created',
      })
      listaCalc = recordsCalc.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          parametros: parametros as any,
          resultados: resultados as any,
          regime_recomendado: rec.regime_recomendado,
          economia_anual: rec.economia_anual,
          aliquota_efetiva: rec.aliquota_efetiva,
          faturamento_mensal: rec.faturamento_mensal,
          ano_base: rec.ano_base,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem' as const,
        }
      })
    } catch {
      listaCalc = await listarSimulacoes()
    }

    try {
      const recordsRecup = await pb.collection('simulacoes_recuperador').getFullList<any>({
        sort: '-created',
      })
      listaRecup = recordsRecup.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          regime_atual: rec.regime_atual || '',
          parametros: parametros as any,
          resultados: resultados as any,
          total_recuperavel_integral: rec.total_recuperavel_integral || 0,
          total_recuperavel_conservador: rec.total_recuperavel_conservador || 0,
          total_pis_cofins: rec.total_pis_cofins || 0,
          total_folha: rec.total_folha || 0,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem' as const,
        }
      })
    } catch {
      listaRecup = await listarSimulacoesRecuperador()
    }

    try {
      const resCount = await pb.collection('crm_clientes').getList(1, 1)
      totalClientesCarteira = resCount.totalItems
    } catch {
      totalClientesCarteira = 0
    }
  } else {
    // Analista: vê as suas próprias simulações + simulações dos clientes da sua carteira
    try {
      const crmRecords = await pb.collection('crm_clientes').getFullList<CrmClienteRecord>({
        filter: `analista_responsavel = "${authUser.id}"`,
        expand: 'empresa_id',
      })
      totalClientesCarteira = crmRecords.length

      const empresasUserIds = new Set<string>()
      empresasUserIds.add(authUser.id)
      const empresasCnpjs = new Set<string>()
      const empresasNomes = new Set<string>()
      const crmClienteIds = new Set<string>()

      crmRecords.forEach((c) => {
        crmClienteIds.add(c.id)
        const emp = (c as any).expand?.empresa_id
        if (emp) {
          if (emp.user_id) empresasUserIds.add(emp.user_id)
          if (emp.cnpj) {
            const limpo = emp.cnpj.replace(/\D/g, '')
            if (limpo) empresasCnpjs.add(limpo)
          }
          if (emp.nome_empresa?.trim()) {
            empresasNomes.add(emp.nome_empresa.trim().toLowerCase())
          }
        }
      })

      // Filtro para Calculadora
      const condicoesCalc: string[] = [`user_id = "${authUser.id}"`]
      Array.from(empresasUserIds).forEach((uId) => {
        if (uId && uId !== authUser.id) condicoesCalc.push(`user_id = "${uId}"`)
      })
      Array.from(crmClienteIds).forEach((cId) => {
        if (cId) condicoesCalc.push(`cliente_id = "${cId}"`)
      })

      let allCalcRecords: any[] = []
      try {
        allCalcRecords = await pb.collection('simulacoes_calculadora').getFullList<any>({
          filter: condicoesCalc.join(' || '),
          sort: '-created',
        })
      } catch (err) {
        console.warn('Erro ao filtrar calculadora por carteira, buscando gerais:', err)
        allCalcRecords = await pb.collection('simulacoes_calculadora').getFullList<any>({
          sort: '-created',
        })
      }

      listaCalc = allCalcRecords.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          parametros: parametros as any,
          resultados: resultados as any,
          regime_recomendado: rec.regime_recomendado,
          economia_anual: rec.economia_anual,
          aliquota_efetiva: rec.aliquota_efetiva,
          faturamento_mensal: rec.faturamento_mensal,
          ano_base: rec.ano_base,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem' as const,
        }
      })

      // Filtro para Recuperador
      let allRecupRecords: any[] = []
      try {
        allRecupRecords = await pb.collection('simulacoes_recuperador').getFullList<any>({
          filter: condicoesCalc.join(' || '),
          sort: '-created',
        })
      } catch (err) {
        console.warn('Erro ao filtrar recuperador por carteira, buscando gerais:', err)
        allRecupRecords = await pb.collection('simulacoes_recuperador').getFullList<any>({
          sort: '-created',
        })
      }

      listaRecup = allRecupRecords.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          regime_atual: rec.regime_atual || '',
          parametros: parametros as any,
          resultados: resultados as any,
          total_recuperavel_integral: rec.total_recuperavel_integral || 0,
          total_recuperavel_conservador: rec.total_recuperavel_conservador || 0,
          total_pis_cofins: rec.total_pis_cofins || 0,
          total_folha: rec.total_folha || 0,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem' as const,
        }
      })
    } catch (err) {
      console.warn('Erro ao carregar carteira do analista para simulações:', err)
      listaCalc = await listarSimulacoes(authUser.id)
      listaRecup = await listarSimulacoesRecuperador(authUser.id)
    }
  }

  const res = consolidarItens(listaCalc, listaRecup, isVisaoCarteira)
  res.totalClientesCarteira = totalClientesCarteira
  return res
}

function consolidarItens(
  listaCalc: SimulacaoCalculadora[],
  listaRecup: SimulacaoRecuperador[],
  isVisaoCarteira: boolean,
): ResumoDashboardSimulacoes {
  // Unifica em itens padronizados
  const itens: ItemSimulacaoUnificado[] = []
  const empresasSet = new Set<string>()

  let somaEconomiaCalculadoraAnual = 0
  let somaCreditosRecuperador = 0
  let somaCreditosConservador = 0

  listaCalc.forEach((s) => {
    const eco =
      typeof s.economia_anual === 'number'
        ? s.economia_anual
        : s.resultados?.resultadoDashboard?.economiaAnualProjetada || 0
    somaEconomiaCalculadoraAnual += eco

    const emp = (s.empresa || s.parametros?.empresa || '').trim()
    if (emp) empresasSet.add(emp.toLowerCase())

    const regime =
      s.regime_recomendado ||
      s.resultados?.resultadoDashboard?.regimeRecomendado ||
      s.parametros?.regimeOperacao ||
      s.parametros?.regimeAtualFiltro ||
      'IBS/CBS Dual'

    itens.push({
      id: s.id,
      tipo: 'calculadora',
      nome: s.nome || 'Simulação Calculadora',
      empresa: emp || 'Empresa não informada',
      cnpj: s.cnpj || s.parametros?.cnpj || '',
      regime,
      created: s.created,
      updated: s.updated,
      origem: s.origem,
      user_id: s.user_id,
      cliente_id: s.cliente_id,
      economiaAnualOuTotal: eco,
      aliquotaEfetiva:
        typeof s.aliquota_efetiva === 'number'
          ? s.aliquota_efetiva
          : s.resultados?.resultadoDashboard?.aliquotaEfetivaNova,
      faturamentoMensal: s.faturamento_mensal || s.parametros?.faturamentoMensal,
      rawCalculadora: s,
    })
  })

  listaRecup.forEach((r) => {
    const credIntegral = r.total_recuperavel_integral || r.resultados?.totalIntegralCorrigido || 0
    const credConservador =
      r.total_recuperavel_conservador || r.resultados?.totalConservadorCorrigido || 0
    somaCreditosRecuperador += credIntegral
    somaCreditosConservador += credConservador

    const emp = (r.empresa || r.parametros?.configuracoes?.empresa || '').trim()
    if (emp) empresasSet.add(emp.toLowerCase())

    const regime = r.regime_atual || r.parametros?.configuracoes?.regimeAtual || 'Lucro Presumido'

    itens.push({
      id: r.id,
      tipo: 'recuperador',
      nome: r.nome || 'Levantamento de Créditos',
      empresa: emp || 'Empresa não informada',
      cnpj: r.cnpj || r.parametros?.configuracoes?.cnpj || '',
      regime,
      created: r.created,
      updated: r.updated,
      origem: r.origem,
      user_id: r.user_id,
      cliente_id: r.cliente_id,
      economiaAnualOuTotal: credIntegral,
      totalRecuperavelIntegral: credIntegral,
      totalRecuperavelConservador: credConservador,
      rawRecuperador: r,
    })
  })

  // Ordenar decrescente por data
  itens.sort((a, b) => {
    const timeA = new Date(a.updated || a.created).getTime()
    const timeB = new Date(b.updated || b.created).getTime()
    return timeB - timeA
  })

  // Constrói os pontos de evolução 2026–2033 com base nos resultados já calculados e salvos
  const pontosTransicao = calcularEvolucaoTransicao(listaCalc)

  return {
    totalSimulacoes: itens.length,
    totalCalculadora: listaCalc.length,
    totalRecuperador: listaRecup.length,
    totalEmpresasUnicas: empresasSet.size,
    somaEconomiaCalculadoraAnual,
    somaCreditosRecuperador,
    somaCreditosConservador,
    pontosTransicao,
    itens,
    isVisaoCarteira,
  }
}

/**
 * Constrói o comparativo da carga tributária ano a ano (2026–2033)
 * unindo exclusivamente os dados de resultadoTransicao já salvos nas simulações.
 * Sem inventar fórmulas tributárias — apenas computa médias / totais das simulações salvas.
 */
function calcularEvolucaoTransicao(
  simulacoesCalc: SimulacaoCalculadora[],
): PontoTransicaoConsolidado[] {
  const anosAlvo: (number | 'atual')[] = ['atual', 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

  // Acumuladores por ano
  const mapa = new Map<
    string | number,
    {
      impostoNovoSoma: number
      impostoAtualSoma: number
      aliquotaSoma: number
      amostras: number
    }
  >()

  anosAlvo.forEach((ano) => {
    mapa.set(ano, { impostoNovoSoma: 0, impostoAtualSoma: 0, aliquotaSoma: 0, amostras: 0 })
  })

  simulacoesCalc.forEach((sim) => {
    const transicao = sim.resultados?.resultadoTransicao
    if (!Array.isArray(transicao) || transicao.length === 0) return

    // Imposto do sistema atual da simulação (para comparação)
    // Tenta obter do resultadoComparativo ou da primeira fase de resultadoTransicao ('atual')
    let impostoAtualSimulacao = 0
    const pontoAtual = transicao.find((t) => t.ano === 'atual' || String(t.ano) === 'atual')
    if (pontoAtual && pontoAtual.impostoEstimado > 0) {
      impostoAtualSimulacao = pontoAtual.impostoEstimado
    } else {
      // Pega o regime atual mais provável do comparativo
      const comp = sim.resultados?.resultadoComparativo
      if (comp) {
        const regimeEmpresa =
          sim.parametros?.regimeAtualFiltro || sim.parametros?.regimeAtualEmpresa
        if (regimeEmpresa === 'Lucro Real') {
          impostoAtualSimulacao = (comp.lucroReal?.totalEfetivo || 0) * 12
        } else if (regimeEmpresa === 'Simples Nacional') {
          impostoAtualSimulacao = (comp.simplesNacional?.totalEfetivo || 0) * 12
        } else {
          impostoAtualSimulacao = (comp.lucroPresumido?.totalEfetivo || 0) * 12
        }
      }
    }

    transicao.forEach((item) => {
      const chave = item.ano === 'atual' ? 'atual' : Number(item.ano)
      const reg = mapa.get(chave)
      if (reg) {
        reg.impostoNovoSoma += item.impostoEstimado || 0
        reg.impostoAtualSoma +=
          item.ano === 'atual' ? item.impostoEstimado || 0 : impostoAtualSimulacao
        reg.aliquotaSoma += item.aliquotaEfetivaTotal || 0
        reg.amostras += 1
      }
    })
  })

  return anosAlvo.map((ano) => {
    const reg = mapa.get(ano) || {
      impostoNovoSoma: 0,
      impostoAtualSoma: 0,
      aliquotaSoma: 0,
      amostras: 0,
    }
    const amostras = reg.amostras || 1
    const impostoNovoMedio = reg.impostoNovoSoma / amostras
    const impostoAtualMedio = reg.impostoAtualSoma / amostras
    const diferencaMedia = impostoNovoMedio - impostoAtualMedio
    const aliquotaTotalMedia = reg.aliquotaSoma / amostras

    return {
      ano,
      anoLabel: ano === 'atual' ? 'Sistema Atual' : String(ano),
      impostoNovoMedio,
      impostoAtualMedio,
      diferencaMedia,
      aliquotaTotalMedia,
      amostras: reg.amostras,
    }
  })
}
