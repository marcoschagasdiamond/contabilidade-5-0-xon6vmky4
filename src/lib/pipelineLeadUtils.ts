import type { LeadRecord } from '@/services/leads'
import type {
  EstagioPipelineLead,
  InteracaoLead,
  LeadProcessado,
  TipoInteracaoLead,
} from '@/types/pipelineLead'

/**
 * Limiar de score considerado "quente"
 */
export const SCORE_LEAD_QUENTE = 40

/**
 * Dias sem interação para considerar um lead quente "esquecido"
 */
export const DIAS_LEAD_ESQUECIDO = 2

/**
 * Extrai a pontuação do lead com base no registro.
 * Prioridade:
 * 1. Campo explícito `score` (numérico)
 * 2. Regex em `tipo_solicitacao` (ex: "whatsapp-home (score: 50)")
 * 3. Análise semântica da fonte / tipo_solicitacao / completude de dados
 */
export function extrairScoreLead(lead: Partial<LeadRecord>): number {
  if (typeof lead.score === 'number' && !isNaN(lead.score) && lead.score > 0) {
    return Math.min(100, Math.max(0, lead.score))
  }

  const tipo = lead.tipo_solicitacao || ''
  const matchScore = tipo.match(/score:\s*(\d+)/i)
  if (matchScore && matchScore[1]) {
    const parsed = parseInt(matchScore[1], 10)
    if (!isNaN(parsed)) return Math.min(100, Math.max(0, parsed))
  }

  const msg = lead.mensagem || ''
  const matchMsgScore = msg.match(/Lead Score:\s*(\d+)/i)
  if (matchMsgScore && matchMsgScore[1]) {
    const parsed = parseInt(matchMsgScore[1], 10)
    if (!isNaN(parsed)) return Math.min(100, Math.max(0, parsed))
  }

  // Pontuação contextual caso não tenha score explícito:
  // - WhatsApp direto: 30 pontos
  // - Proposta preenchida completa (LeadForm): 60 pontos
  // - Agendamento: 70 pontos
  // - Bônus por ter CNPJ (+15)
  // - Bônus por ter telefone (+10)
  // - Bônus por mensagem detalhada (+10)
  let score = 20
  if (tipo.includes('whatsapp') || tipo.includes('whatsapp-home')) {
    score = 30
  } else if (tipo === 'proposta' || tipo.includes('proposta')) {
    score = 60
  } else if (tipo === 'agendamento' || tipo.includes('agendamento')) {
    score = 70
  }

  if (lead.cnpj && lead.cnpj.replace(/\D/g, '').length >= 14) {
    score += 15
  }
  if (lead.telefone && lead.telefone.replace(/\D/g, '').length >= 10) {
    score += 10
  }
  if (lead.mensagem && lead.mensagem.length > 30) {
    score += 5
  }

  return Math.min(100, score)
}

/**
 * Identifica a fonte original do lead para exibição e métricas.
 */
export function extrairFonteLead(lead: Partial<LeadRecord>): string {
  if (lead.fonte && typeof lead.fonte === 'string' && lead.fonte.trim()) {
    return lead.fonte.trim()
  }

  const tipo = lead.tipo_solicitacao || ''
  if (tipo.includes('whatsapp-home')) return 'WhatsApp (Home)'
  if (tipo.includes('whatsapp')) return 'WhatsApp'
  if (tipo === 'proposta') return 'Formulário da Home (Proposta)'
  if (tipo === 'agendamento') return 'Agendamento'
  if (tipo.includes('contato')) return 'Fale Conosco (Contato)'

  const msg = lead.mensagem || ''
  if (msg.includes('whatsapp-home')) return 'WhatsApp (Home)'
  if (msg.includes('Origem:')) {
    const match = msg.match(/\[Origem:\s*([^\]]+)\]/)
    if (match && match[1]) return match[1].trim()
  }

  return 'Formulário do Site'
}

/**
 * Normaliza o estágio do pipeline
 */
export function extrairEstagioPipelineLead(lead: Partial<LeadRecord>): EstagioPipelineLead {
  const est = (lead.estagio_pipeline || '').toLowerCase()
  if (est === 'contato_feito' || est === 'contatofeito' || est === 'contato') return 'contato_feito'
  if (est === 'reuniao' || est === 'reunião' || est === 'proposta') return 'reuniao'
  if (est === 'cliente' || est === 'ganho' || est === 'fechado') return 'cliente'
  return 'novo'
}

/**
 * Parse seguro das interações armazenadas em JSON
 */
export function extrairInteracoesLead(lead: Partial<LeadRecord>): InteracaoLead[] {
  const interacoes: InteracaoLead[] = []

  // Interação virtual do evento de criação/origem
  if (lead.created) {
    const fonte = extrairFonteLead(lead)
    const msg = lead.mensagem || 'Lead registrado no sistema.'
    interacoes.push({
      id: `origem_${lead.id || 'novo'}`,
      data: lead.created,
      tipo: fonte.includes('WhatsApp') ? 'whatsapp' : 'sistema',
      titulo: `Entrada via ${fonte}`,
      descricao: msg,
    })
  }

  // Interações registradas na coluna JSON
  if (lead.interacoes_json) {
    try {
      const raw =
        typeof lead.interacoes_json === 'string'
          ? JSON.parse(lead.interacoes_json)
          : lead.interacoes_json

      if (Array.isArray(raw)) {
        raw.forEach((item, idx) => {
          if (item && typeof item === 'object') {
            interacoes.push({
              id: item.id || `inter_${idx}_${Date.now()}`,
              data: item.data || item.created || new Date().toISOString(),
              tipo: (item.tipo as TipoInteracaoLead) || 'nota',
              titulo: item.titulo,
              descricao: item.descricao || item.resumo || '',
              autorNome: item.autorNome || item.autor,
              autorId: item.autorId,
              proximoPasso: item.proximoPasso || item.proximo_passo,
              dataProximoPasso: item.dataProximoPasso || item.data_proximo_passo,
            })
          }
        })
      }
    } catch (e) {
      console.warn('Erro ao decodificar interacoes_json do lead:', e)
    }
  }

  // Ordenar timeline da mais recente para a mais antiga
  return interacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
}

/**
 * Calcula se o lead é um "lead quente esquecido":
 * - Score alto (>= SCORE_LEAD_QUENTE, ex: >= 40)
 * - Estágio diferente de "cliente" (ainda no funil aberto)
 * - Sem interação recente (mais de DIAS_LEAD_ESQUECIDO dias ou nunca teve interação após criação antiga)
 */
export function calcularLeadQuenteEsquecido(
  score: number,
  estagio: EstagioPipelineLead,
  dataCriacao?: string,
  ultimaInteracao?: string,
  interacoesQtd = 0,
): { isQuenteEsquecido: boolean; diasSemInteracao: number } {
  // Apenas leads ainda não convertidos em cliente podem estar "esquecidos"
  if (estagio === 'cliente') {
    return { isQuenteEsquecido: false, diasSemInteracao: 0 }
  }

  if (score < SCORE_LEAD_QUENTE) {
    return { isQuenteEsquecido: false, diasSemInteracao: 0 }
  }

  const agora = Date.now()
  const dataRefStr = ultimaInteracao || dataCriacao
  if (!dataRefStr) {
    return { isQuenteEsquecido: false, diasSemInteracao: 0 }
  }

  const dataRef = new Date(dataRefStr).getTime()
  if (isNaN(dataRef)) {
    return { isQuenteEsquecido: false, diasSemInteracao: 0 }
  }

  const diffMs = Math.max(0, agora - dataRef)
  const diasSemInteracao = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Se tem score alto e está há 2 ou mais dias sem contato
  // OU se é um lead "novo" com mais de 24h sem nenhuma interação além da entrada
  const isQuenteEsquecido =
    diasSemInteracao >= DIAS_LEAD_ESQUECIDO ||
    (estagio === 'novo' && diffMs >= 24 * 60 * 60 * 1000 && interacoesQtd <= 1)

  return { isQuenteEsquecido, diasSemInteracao }
}

/**
 * Converte um LeadRecord em LeadProcessado enriquecido para a interface do pipeline
 */
export function processarLeadParaPipeline(lead: LeadRecord): LeadProcessado {
  const score = extrairScoreLead(lead)
  const estagio_pipeline = extrairEstagioPipelineLead(lead)
  const fonte = extrairFonteLead(lead)
  const interacoes = extrairInteracoesLead(lead)

  const dataMaisRecente =
    lead.ultima_interacao || (interacoes.length > 0 ? interacoes[0].data : lead.created)

  const { isQuenteEsquecido, diasSemInteracao } = calcularLeadQuenteEsquecido(
    score,
    estagio_pipeline,
    lead.created,
    dataMaisRecente,
    interacoes.length,
  )

  return {
    id: lead.id,
    nome: lead.nome || 'Lead sem nome',
    email: lead.email || '',
    telefone: lead.telefone || '',
    empresa: lead.empresa || 'Empresa não informada',
    cnpj: lead.cnpj,
    segmento: lead.segmento || 'Não Informado',
    funcionarios: lead.funcionarios || '1–5',
    mensagem: lead.mensagem,
    tipo_solicitacao: lead.tipo_solicitacao,
    created: lead.created,
    updated: lead.updated,
    estagio_pipeline,
    score,
    fonte,
    interacoes,
    ultima_interacao: dataMaisRecente,
    isQuenteEsquecido,
    diasSemInteracao,
  }
}
