import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { LeadRecord } from './pipelineLeads'
import { extrairScoreLead } from '@/lib/pipelineLeadUtils'
import { buscarLeadPorCnpj, registrarEventoNoLead, adicionarOuSubirScore } from './crm'

const CRM_SCORE_BONUS_DIAGNOSTICO = 10

export interface EventoDiagnosticoCrm {
  /** CNPJ da empresa do diagnóstico (vinculação com o lead) */
  cnpj?: string | null
  /** Fallback de busca quando o lead não tem CNPJ gravado (nome da empresa) */
  nomeEmpresa?: string
  /** Ex: 'Diagnóstico 360°', 'Relatório Consolidado (Versão de 12/05 14:32)', 'Recuperador de Créditos — Análise X' */
  nomeDiagnostico: string
  /** Resumo do resultado em 1 linha, ex.: 'risco alto · vedação ao Simples' */
  resumo: string
}

export interface ResultadoRegistroCrm {
  ok: boolean
  leadId?: string
  scoreAnterior?: number
  scoreNovo?: number
  motivo?: string
}

/**
 * Normaliza CNPJ para busca: somente dígitos.
 */
function normalizarCnpj(cnpj?: string | null): string {
  return (cnpj || '').replace(/\D/g, '')
}

/**
 * Encontra o lead do CRM vinculado à empresa do diagnóstico.
 * 1ª tentativa: por CNPJ normalizado (campo cnpj).
 * Fallback: por nome da empresa (sem criar nada).
 */
export async function buscarLeadVinculadoAoDiagnostico(
  ev: Pick<EventoDiagnosticoCrm, 'cnpj' | 'nomeEmpresa'>,
): Promise<LeadRecord | null> {
  const cnpj = normalizarCnpj(ev.cnpj)
  if (cnpj.length === 14) {
    const lead = await buscarLeadPorCnpj(cnpj)
    if (lead) return lead
  }
  if (ev.nomeEmpresa && ev.nomeEmpresa.trim().length >= 3) {
    const lead = await buscarLeadPorNomeEmpresa(ev.nomeEmpresa.trim())
    if (lead) return lead
  }
  return null
}

/**
 * Registra um evento de conclusão de diagnóstico no histórico do lead do CRM.
 * - NUNCA cria lead (somente reusa o existente por CNPJ/nome da empresa).
 * - Sobe o score do lead (engajamento), respeitando o teto 100 e o critério
 *   atual do lead (nunca reduz e nunca passa do que o lead já conquistou).
 * - Nunca lança: falhas são logadas e ignoradas para não quebrar o fluxo do
 *   diagnóstico.
 */
export async function registrarDiagnosticoNoCrm(
  ev: EventoDiagnosticoCrm,
): Promise<ResultadoRegistroCrm> {
  try {
    const lead = await buscarLeadVinculadoAoDiagnostico(ev)
    if (!lead) {
      return { ok: false, motivo: 'lead_nao_encontrado' }
    }

    const dataAgora = new Date().toISOString()
    const titulo = `Diagnóstico concluído: ${ev.nomeDiagnostico}`
    const descricao = ev.resumo || 'Concluído'

    // 1) Evento no histórico do lead (interacoes_json)
    await registrarEventoNoLead(lead.id, {
      tipo: 'sistema',
      titulo,
      descricao,
      data: dataAgora,
      autorNome: 'Sistema — Diagnósticos',
    })

    // 2) Score: sobe por engajamento, sem reduzir e sem passar de 100
    const scoreAtual = extrairScoreLead(lead)
    const candidato = Math.min(100, scoreAtual + CRM_SCORE_BONUS_DIAGNOSTICO)
    const scoreNovo = Math.max(candidato, scoreAtual) // nunca reduz
    if (scoreNovo !== scoreAtual) {
      await adicionarOuSubirScore(lead.id, scoreNovo)
    }

    return {
      ok: true,
      leadId: lead.id,
      scoreAnterior: scoreAtual,
      scoreNovo,
    }
  } catch (err) {
    console.warn('[CRM] Falha ao registrar diagnóstico no lead do CRM:', err)
    return { ok: false, motivo: 'erro' }
  }
}

/**
 * Deriva o payload de evento CRM a partir de um registro de diagnóstico salvo.
 * Usado por createDiagnostico (Diagnóstico 360°, Enquadramento etc.).
 */
export function eventoDiagnosticoDeRegistro(rec: {
  tipo_diagnostico?: string
  regime_recomendado?: string
  sistema_recomendado_novo?: string
  carga_simples?: number
  carga_presumido?: number
  carga_real?: number
  economia_anual?: number
  economia_anual_novo?: number
  empresa?: string
  cnpj?: string
}): EventoDiagnosticoCrm {
  const mapTipo: Record<string, string> = {
    '360': 'Diagnóstico 360°',
    autoavaliacao: 'Diagnóstico 360°',
    enquadramento: 'Diagnóstico de Enquadramento',
    transicao: 'Diagnóstico de Transição',
    regimes: 'Diagnóstico de Regimes',
  }
  const nome =
    mapTipo[rec.tipo_diagnostico || ''] || rec.tipo_diagnostico || 'Diagnóstico tributário'

  const regime = rec.sistema_recomendado_novo || rec.regime_recomendado || ''
  const economia = rec.economia_anual_novo ?? rec.economia_anual ?? 0

  const partes: string[] = []
  if (regime) partes.push(`regime ${regime}`)
  if (typeof economia === 'number' && economia > 0)
    partes.push(`economia R$ ${Math.round(economia).toLocaleString('pt-BR')}/ano`)
  if (rec.carga_real && rec.carga_simples && rec.carga_real < rec.carga_simples)
    partes.push('Lucro Real vence o Simples')
  if (rec.carga_real && rec.carga_presumido && rec.carga_real < rec.carga_presumido)
    partes.push('Lucro Real vence o Presumido')

  return {
    cnpj: rec.cnpj,
    nomeEmpresa: rec.empresa,
    nomeDiagnostico: nome,
    resumo: partes.length > 0 ? partes.join(' · ') : 'concluído',
  }
}
