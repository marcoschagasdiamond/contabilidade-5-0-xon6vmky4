import pb from '@/lib/pocketbase/client'
import type { LeadRecord } from './leads'
import { getLeads } from './leads'

export interface EtapaFunilIndicadores {
  chave: 'leads' | 'cadastros' | 'onboarding' | 'diagnostico'
  rotulo: string
  quantidade: number
}

export interface LeadQuenteIndicadores {
  id: string
  nome: string
  empresa: string
  score: number
  estagio_pipeline: string
  ultima_interacao?: string
  temDiagnostico: boolean
}

export interface IndicadoresAdmin {
  leads: LeadRecord[]
  funil: EtapaFunilIndicadores[]
  indicadores: {
    leadsSemana: number
    leadsSemanaAnterior?: { delta: number; rotulo: string }
    diagnosticosSemana: number
    diagnosticosSemanaAnterior?: { delta: number; rotulo: string }
    percentualPerfisCompletos: number
    perfisCompletos: number
    totalPerfis: number
    totalFornecedores: number
  }
}

const PREFIXO_TITULO_DIAGNOSTICO_CRM = 'Diagnóstico concluído:'

function inicioSemana(diasAtras = 0): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 7 * (diasAtras + 1))
  return d
}

function contarEntre(datas: (string | undefined)[], de: Date, ate: Date): number {
  return datas.filter((d) => {
    if (!d) return false
    const t = new Date(d).getTime()
    return !isNaN(t) && t >= de.getTime() && t < ate.getTime()
  }).length
}

function tendenciaSemana(atual: number, anterior: number): { delta: number; rotulo: string } {
  const delta = atual - anterior
  const pct = anterior > 0 ? Math.round((delta / anterior) * 100) : null
  const rotulo =
    pct !== null ? `${Math.abs(pct)}% vs semana anterior` : `${Math.abs(delta)} vs semana anterior`
  return { delta, rotulo }
}

/** Campos que caracterizam um perfil de empresa "completo" em clientes_empresas */
function perfilCompleto(rec: Record<string, any>): boolean {
  const obrigatorios = [
    'razao_social',
    'cnpj',
    'regime_tributario',
    'faturamento_mensal',
    'cnae_principal',
  ]
  const preenchidos = obrigatorios.filter((c) => {
    const v = rec?.[c]
    if (v === null || v === undefined) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (typeof v === 'number') return true
    if (typeof v === 'object') return true // objetos/arrays (json) contam como preenchidos
    return true
  })
  return preenchidos.length === obrigatorios.length
}

/** Extraí as datas de eventos "Diagnóstico concluído:" do histórico (interacoes_json) do lead */
function datasDiagnosticoLead(lead: Partial<LeadRecord>): string[] {
  const out: string[] = []
  const raw = lead.interacoes_json
  if (!raw) return out
  try {
    const lista = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(lista)) return out
    for (const item of lista) {
      if (
        item &&
        typeof item === 'object' &&
        String(item?.titulo || '').startsWith(PREFIXO_TITULO_DIAGNOSTICO_CRM)
      ) {
        out.push(item.data || item.created)
      }
    }
  } catch {
    // json inválido → ignora
  }
  return out
}

/**
 * Carrega TODOS os dados do dashboard de indicadores (somente leitura).
 * Cada bloco é tolerante a falha: se uma coleção não estiver acessível,
 * o indicador correspondente fica em estado vazio sem quebrar a aba.
 */
export async function carregarIndicadoresAdmin(): Promise<IndicadoresAdmin> {
  // ---- 1) Leads (com score e histórico de interações) ----
  let leads: LeadRecord[] = []
  try {
    leads = await getLeads()
  } catch (err) {
    console.warn('[IndicadoresAdmin] Falha ao carregar leads:', err)
  }

  // ---- 2) Cadastros (clientes_empresas) ----
  let cadastros: Record<string, any>[] = []
  try {
    cadastros = await pb
      .collection('clientes_empresas')
      .getFullList({
        fields: 'id,created,razao_social,cnpj,regime_tributario,faturamento_mensal,cnae_principal',
      })
  } catch (err) {
    console.warn('[IndicadoresAdmin] Falha ao carregar cadastros (clientes_empresas):', err)
  }

  // ---- 3) Onboarding concluído (concluido_em preenchido) ----
  let onboardingConcluidos: Record<string, any>[] = []
  try {
    onboardingConcluidos = await pb.collection('onboarding_progresso').getFullList({
      filter: 'concluido_em != ""',
      fields: 'id,user_id,concluido_em',
    })
  } catch (err) {
    console.warn('[IndicadoresAdmin] Falha ao carregar onboarding:', err)
  }

  // ---- 4) Diagnósticos completados = eventos 'Diagnóstico concluído:' no histórico do lead ----
  // Também considera diagnosticos da coleção 'diagnosticos' como fonte auxiliar de "na semana".
  const datasDiagLeads = leads.flatMap((l) => datasDiagnosticoLead(l))

  let diagnosticosSemanaColecao = 0
  let diagnosticosSemanaAnteriorColecao = 0
  try {
    const sem1 = inicioSemana(0)
    const sem2 = inicioSemana(1)
    const sem3 = inicioSemana(2)
    const res = await pb.collection('diagnosticos').getList(1, 1, {
      filter: `created >= "${sem1.toISOString()}"`,
      fields: 'id',
    })
    diagnosticosSemanaColecao = res.totalItems
    const resAnterior = await pb.collection('diagnosticos').getList(1, 1, {
      filter: `created >= "${sem2.toISOString()}" && created < "${sem1.toISOString()}"`,
      fields: 'id',
    })
    diagnosticosSemanaAnteriorColecao = resAnterior.totalItems
    void sem3
  } catch (err) {
    console.warn('[IndicadoresAdmin] Falha ao carregar diagnosticos:', err)
  }

  const diagSemanaEventos = contarEntre(datasDiagLeads, inicioSemana(0), new Date())
  const diagSemanaAntEventos = contarEntre(datasDiagLeads, inicioSemana(1), inicioSemana(0))

  // Funil
  const agora = new Date()
  const sem1 = inicioSemana(0)
  const leadsSemana = leads.filter((l) => {
    const t = new Date(l.created || '').getTime()
    return !isNaN(t) && t >= sem1.getTime() && t <= agora.getTime()
  }).length

  const cadastrosSemana = cadastros.filter((c) => {
    const t = new Date(c.created || '').getTime()
    return !isNaN(t) && t >= sem1.getTime() && t <= agora.getTime()
  }).length

  const onboardingSemana = onboardingConcluidos.filter((o) => {
    const t = new Date(o.concluido_em || '').getTime()
    return !isNaN(t) && t >= sem1.getTime() && t <= agora.getTime()
  }).length

  const sem2 = inicioSemana(1)
  const leadsSemanaAnteriorQtd = leads.filter((l) => {
    const t = new Date(l.created || '').getTime()
    return !isNaN(t) && t >= sem2.getTime() && t < sem1.getTime()
  }).length

  const funil: EtapaFunilIndicadores[] = [
    { chave: 'leads', rotulo: 'Leads', quantidade: leads.length },
    { chave: 'cadastros', rotulo: 'Cadastros (empresas)', quantidade: cadastros.length },
    {
      chave: 'onboarding',
      rotulo: 'Onboarding concluído',
      quantidade: onboardingConcluidos.length,
    },
    {
      chave: 'diagnostico',
      rotulo: 'Diagnóstico completado',
      quantidade: datasDiagLeads.length,
    },
  ]

  // Perfis completos
  const totalPerfis = cadastros.length
  const perfisCompletos = cadastros.filter(perfilCompleto).length
  const percentualPerfisCompletos = totalPerfis > 0 ? (perfisCompletos / totalPerfis) * 100 : 0

  // Fornecedores (total, via contagem leve)
  let totalFornecedores = 0
  try {
    const res = await pb.collection('fornecedores_diagnostico').getList(1, 1, { fields: 'id' })
    totalFornecedores = res.totalItems
  } catch (err) {
    console.warn('[IndicadoresAdmin] Falha ao carregar fornecedores:', err)
  }

  return {
    leads,
    funil,
    indicadores: {
      leadsSemana,
      leadsSemanaAnterior: tendenciaSemana(leadsSemana, leadsSemanaAnteriorQtd),
      diagnosticosSemana: Math.max(diagnosticosSemanaColecao, diagSemanaEventos),
      diagnosticosSemanaAnterior: tendenciaSemana(
        Math.max(diagnosticosSemanaColecao, diagSemanaEventos),
        Math.max(diagnosticosSemanaAnteriorColecao, diagSemanaAntEventos),
      ),
      percentualPerfisCompletos,
      perfisCompletos,
      totalPerfis,
      totalFornecedores,
    },
  }
}

// Reexport para reuso de helpers de score na aba (mesma origem do CRM)
export { extrairScoreLead } from '@/lib/pipelineLeadUtils'
