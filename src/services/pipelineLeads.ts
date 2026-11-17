import pb from '@/lib/pocketbase/client'
import type { LeadRecord } from '@/services/leads'
import type {
  EstagioPipelineLead,
  InteracaoLead,
  LeadProcessado,
  TipoInteracaoLead,
} from '@/types/pipelineLead'
import { processarLeadParaPipeline } from '@/lib/pipelineLeadUtils'

/**
 * Busca todos os leads da coleção `leads` e os processa com informações de pipeline,
 * scoring, fonte e timeline de interações.
 */
export async function listarLeadsPipeline(): Promise<LeadProcessado[]> {
  const records = await pb.collection('leads').getFullList<LeadRecord>({
    sort: '-created',
  })

  return records.map((record) => processarLeadParaPipeline(record))
}

/**
 * Atualiza o estágio do pipeline de um lead (ex: novo -> contato_feito -> reuniao -> cliente)
 */
export async function atualizarEstagioPipelineLead(
  leadId: string,
  novoEstagio: EstagioPipelineLead,
  notaTransicao?: string,
  usuarioNome?: string,
): Promise<LeadRecord> {
  const recordAtual = await pb.collection('leads').getOne<LeadRecord>(leadId)

  // Lê interações existentes
  let interacoes: any[] = []
  if (recordAtual.interacoes_json) {
    try {
      interacoes =
        typeof recordAtual.interacoes_json === 'string'
          ? JSON.parse(recordAtual.interacoes_json)
          : recordAtual.interacoes_json
      if (!Array.isArray(interacoes)) interacoes = []
    } catch {
      interacoes = []
    }
  }

  // Se houver nota ou mudança de estágio, registra no histórico
  const agora = new Date().toISOString()
  const rotulos: Record<EstagioPipelineLead, string> = {
    novo: 'Novo Lead',
    contato_feito: 'Contato Feito',
    reuniao: 'Reunião Agendada',
    cliente: 'Convertido em Cliente',
  }

  const novaInteracao = {
    id: `estagio_${Date.now()}`,
    data: agora,
    tipo: 'sistema',
    titulo: `Estágio alterado para "${rotulos[novoEstagio]}"`,
    descricao: notaTransicao?.trim() || `Lead movido para a etapa ${rotulos[novoEstagio]}.`,
    autorNome: usuarioNome || 'Analista CRM',
  }

  interacoes.push(novaInteracao)

  const atualizado = await pb.collection('leads').update<LeadRecord>(leadId, {
    estagio_pipeline: novoEstagio,
    interacoes_json: interacoes,
    ultima_interacao: agora,
  })

  return atualizado
}

export interface AdicionarInteracaoLeadInput {
  leadId: string
  tipo: TipoInteracaoLead
  descricao: string
  titulo?: string
  data?: string
  autorNome?: string
  autorId?: string
  proximoPasso?: string
  dataProximoPasso?: string
  novoEstagio?: EstagioPipelineLead
}

/**
 * Adiciona uma nova interação (ligação, WhatsApp, reunião, e-mail, nota) à timeline do lead
 */
export async function adicionarInteracaoLead(
  input: AdicionarInteracaoLeadInput,
): Promise<LeadRecord> {
  const {
    leadId,
    tipo,
    descricao,
    titulo,
    data = new Date().toISOString(),
    autorNome,
    autorId,
    proximoPasso,
    dataProximoPasso,
    novoEstagio,
  } = input

  const recordAtual = await pb.collection('leads').getOne<LeadRecord>(leadId)

  let interacoes: any[] = []
  if (recordAtual.interacoes_json) {
    try {
      interacoes =
        typeof recordAtual.interacoes_json === 'string'
          ? JSON.parse(recordAtual.interacoes_json)
          : recordAtual.interacoes_json
      if (!Array.isArray(interacoes)) interacoes = []
    } catch {
      interacoes = []
    }
  }

  const novaInteracao: InteracaoLead = {
    id: `inter_${Date.now()}`,
    data,
    tipo,
    titulo: titulo?.trim() || undefined,
    descricao: descricao.trim(),
    autorNome: autorNome || 'Analista',
    autorId,
    proximoPasso: proximoPasso?.trim() || undefined,
    dataProximoPasso: dataProximoPasso || undefined,
  }

  interacoes.push(novaInteracao)

  const payload: Record<string, any> = {
    interacoes_json: interacoes,
    ultima_interacao: data,
  }

  if (novoEstagio) {
    payload.estagio_pipeline = novoEstagio
  }

  const atualizado = await pb.collection('leads').update<LeadRecord>(leadId, payload)
  return atualizado
}

/**
 * Atualiza o score do lead manualmente ou via recalibração
 */
export async function atualizarScoreLead(leadId: string, novoScore: number): Promise<LeadRecord> {
  const clamped = Math.min(100, Math.max(0, novoScore))
  return await pb.collection('leads').update<LeadRecord>(leadId, {
    score: clamped,
  })
}

/**
 * Normaliza CNPJ para busca: somente dígitos.
 */
function normalizarCnpjBusca(cnpj?: string | null): string {
  // Mantém apenas dígitos e escapa para uso seguro dentro de filtro do PocketBase
  return (cnpj || '').replace(/\D/g, '').replace(/[\\'"]/g, '')
}

/**
 * Busca o lead cujo campo `cnpj` corresponde ao CNPJ informado (comparação por dígitos).
 * Usado pela integração diagnósticos → CRM para localizar o lead vinculado à empresa.
 * Nunca cria lead: devolve o primeiro encontrado (sort -created) ou null.
 */
export async function buscarLeadPorCnpj(cnpj?: string | null): Promise<LeadRecord | null> {
  const digitos = normalizarCnpjBusca(cnpj)
  if (digitos.length !== 14) return null

  try {
    const records = await pb
      .collection('leads')
      .getList<LeadRecord>(1, 1, { filter: `cnpj ~ "${digitos}"`, sort: '-created' })
    return records.items[0] || null
  } catch (err) {
    console.warn('[Pipeline Leads] Erro ao buscar lead por CNPJ:', err)
    return null
  }
}

/**
 * Fallback de busca por nome da empresa (campo `empresa`, busca aproximada).
 * Nunca cria lead: devolve o primeiro encontrado ou null.
 */
export async function buscarLeadPorNomeEmpresa(nomeEmpresa?: string): Promise<LeadRecord | null> {
  const nome = (nomeEmpresa || '').trim()
  if (nome.length < 3) return null

  try {
    const nomeEscapado = nome.replace(/"/g, '')
    const records = await pb
      .collection('leads')
      .getList<LeadRecord>(1, 1, { filter: `empresa ~ "${nomeEscapado}"`, sort: '-created' })
    return records.items[0] || null
  } catch (err) {
    console.warn('[Pipeline Leads] Erro ao buscar lead por nome da empresa:', err)
    return null
  }
}

/**
 * Atualiza o valor de faturamento potencial do lead (faturamento e faturamento_estimado).
 */
export async function atualizarFaturamentoLead(
  leadId: string,
  novoFaturamento: number,
): Promise<LeadRecord> {
  const valor = Math.max(0, Math.round(Number(novoFaturamento) || 0))
  return await pb.collection('leads').update<LeadRecord>(leadId, {
    faturamento_estimado: valor,
    faturamento: valor,
  })
}
