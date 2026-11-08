import type { LeadRecord } from '@/services/leads'
import type {
  EstagioPipelineLead,
  InteracaoLead,
  LeadProcessado,
  MetricasPipelineCrm,
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
 * Extrai o faturamento / valor potencial do lead.
 * Fontes avaliadas em cascata:
 * 1. Campos diretos (faturamento_estimado, faturamento, faturamento_mensal)
 * 2. Texto em mensagem ou tipo_solicitacao (ex: "Faturamento: R$ 500.000", "R$ 1,2M", "faturamento anual: ...")
 * 3. Estimativa empírica por porte/funcionários (padrão de mercado para PMEs no Brasil)
 */
export function extrairValorPotencialLead(lead: Partial<LeadRecord>): number {
  const directFat =
    (lead as any).faturamento_estimado ??
    (lead as any).faturamento ??
    (lead as any).faturamento_mensal
  if (typeof directFat === 'number' && !isNaN(directFat) && directFat > 0) {
    return directFat
  }

  const textoCompleto = `${lead.mensagem || ''} ${lead.tipo_solicitacao || ''}`
  if (textoCompleto) {
    // 1. Padrão "R$ 1,2M" ou "1.5 mi" ou "1.5 milhoes"
    const matchMilhoes = textoCompleto.match(
      /R?\$?\s*(\d+[.,]?\d*)\s*(?:mi|milh[aãõ]o|milh[õo]es|m\b)/i,
    )
    if (matchMilhoes && matchMilhoes[1]) {
      const num = parseFloat(matchMilhoes[1].replace(',', '.'))
      if (!isNaN(num) && num > 0) {
        return Math.round(num * 1_000_000)
      }
    }

    // 2. Padrão "R$ 300 mil" ou "R$ 300k"
    const matchMil = textoCompleto.match(/R?\$?\s*(\d+[.,]?\d*)\s*(?:mil|k\b)/i)
    if (matchMil && matchMil[1]) {
      const num = parseFloat(matchMil[1].replace(',', '.'))
      if (!isNaN(num) && num > 0) {
        return Math.round(num * 1_000)
      }
    }

    // 3. Padrão "Faturamento: R$ 150.000,00" ou "fat: 150000"
    const matchFat = textoCompleto.match(
      /(?:faturamento|fat\.?|receita|fatura)\s*(?:mensal|anual|estimad[oa])?\s*[:=]\s*R?\$?\s*([\d.,]+)/i,
    )
    if (matchFat && matchFat[1]) {
      const raw = matchFat[1].replace(/\./g, '').replace(',', '.')
      const num = parseFloat(raw)
      if (!isNaN(num) && num > 0) {
        return Math.round(num)
      }
    }
  }

  // 4. Estimativa prudente por faixa de colaboradores (apenas quando o lead tem faixa válida informada)
  const porte = (lead.funcionarios || '').toString().trim()
  if (porte === 'Mais de 200' || porte.includes('>200')) return 12_000_000
  if (porte === '51–200' || porte === '51-200') return 4_800_000
  if (porte === '21–50' || porte === '21-50') return 1_800_000
  if (porte === '6–20' || porte === '6-20') return 720_000
  if (porte === '1–5' || porte === '1-5') return 240_000

  return 0
}

/**
 * Formata um valor monetário de forma compacta e legível para cabeçalhos e badges do Kanban.
 * Exemplos:
 * R$ 1.500.000 -> R$ 1,5 mi
 * R$ 350.000 -> R$ 350 mil
 * R$ 80.000 -> R$ 80 mil
 * R$ 0 -> R$ 0
 */
export function formatarValorCompacto(valor: number, placeholder: string = 'R$ 0'): string {
  if (isNaN(valor) || valor <= 0) return placeholder

  if (valor >= 1_000_000_000) {
    const bi = valor / 1_000_000_000
    return `R$ ${bi.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} bi`
  }

  if (valor >= 1_000_000) {
    const mi = valor / 1_000_000
    return `R$ ${mi.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mi`
  }

  if (valor >= 1_000) {
    const mil = valor / 1_000
    return `R$ ${mil.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mil`
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

/**
 * Calcula quantos dias o lead está sem nova interação ou movimentação
 */
export function calcularDiasParado(dataRefStr?: string): number {
  if (!dataRefStr) return 0
  const dataRef = new Date(dataRefStr).getTime()
  if (isNaN(dataRef)) return 0
  const diffMs = Math.max(0, Date.now() - dataRef)
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calcula o tempo até o primeiro contato (em horas) entre a criação e a primeira interação real registrada
 */
export function calcularTempoPrimeiroContatoHoras(
  createdStr?: string,
  interacoes: InteracaoLead[] = [],
): number | undefined {
  if (!createdStr) return undefined
  const dataCriacao = new Date(createdStr).getTime()
  if (isNaN(dataCriacao)) return undefined

  // Interações reais (exclui a virtual 'origem_...')
  const interacoesReais = interacoes.filter((i) => !i.id.startsWith('origem_'))
  if (interacoesReais.length === 0) return undefined

  // Encontra a interação real mais antiga
  const primeira = interacoesReais.reduce((maisAntiga, item) => {
    const tItem = new Date(item.data).getTime()
    const tAntiga = new Date(maisAntiga.data).getTime()
    return tItem < tAntiga ? item : maisAntiga
  }, interacoesReais[0])

  const tPrimeira = new Date(primeira.data).getTime()
  if (isNaN(tPrimeira) || tPrimeira < dataCriacao) return 0

  const horas = (tPrimeira - dataCriacao) / (1000 * 60 * 60)
  return Math.max(0, Math.round(horas * 10) / 10)
}

/**
 * Converte horas em formato legível amigável (ex: "2,5h", "18h", "2d 4h")
 */
export function formatarHorasEmTempoAmigavel(horas?: number): string {
  if (horas === undefined || isNaN(horas)) return 'Pendente'
  if (horas < 1) {
    const mins = Math.max(1, Math.round(horas * 60))
    return `${mins} min`
  }
  if (horas < 24) {
    return `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`
  }
  const dias = Math.floor(horas / 24)
  const restoHoras = Math.round(horas % 24)
  return restoHoras > 0 ? `${dias}d ${restoHoras}h` : `${dias}d`
}

/**
 * Consolida todas as métricas analíticas do CRM a partir da lista de leads
 */
export function consolidarMetricasPipeline(leads: LeadProcessado[]): MetricasPipelineCrm {
  const agora = Date.now()
  const ms7dias = 7 * 24 * 60 * 60 * 1000
  const ms30dias = 30 * 24 * 60 * 60 * 1000

  const totalLeads = leads.length
  let leads7Dias = 0
  let leads30Dias = 0
  let totalConvertidos = 0
  let totalNovos = 0
  let leadsQuentesEsfriando = 0
  let somaHorasPrimeiroContato = 0
  let contagemComPrimeiroContato = 0

  const valorPotencialPorEstagio: Record<EstagioPipelineLead, number> = {
    novo: 0,
    contato_feito: 0,
    reuniao: 0,
    cliente: 0,
  }

  leads.forEach((lead) => {
    // Faturamento do estágio
    const est = lead.estagio_pipeline
    valorPotencialPorEstagio[est] = (valorPotencialPorEstagio[est] || 0) + lead.valorPotencial

    // Datas de criação
    if (lead.created) {
      const tCriacao = new Date(lead.created).getTime()
      if (!isNaN(tCriacao)) {
        const diff = agora - tCriacao
        if (diff <= ms7dias) leads7Dias++
        if (diff <= ms30dias) leads30Dias++
      }
    }

    if (lead.estagio_pipeline === 'cliente') {
      totalConvertidos++
    }
    if (lead.estagio_pipeline === 'novo') {
      totalNovos++
    }
    if (lead.isQuenteEsquecido) {
      leadsQuentesEsfriando++
    }

    if (typeof lead.primeiroContatoEmHoras === 'number') {
      somaHorasPrimeiroContato += lead.primeiroContatoEmHoras
      contagemComPrimeiroContato++
    }
  })

  const taxaConversaoNovoParaCliente =
    totalLeads > 0 ? Math.round((totalConvertidos / totalLeads) * 1000) / 10 : 0

  const tempoMedioPrimeiroContatoHoras =
    contagemComPrimeiroContato > 0
      ? Math.round((somaHorasPrimeiroContato / contagemComPrimeiroContato) * 10) / 10
      : 0

  const tempoMedioPrimeiroContatoFormatado =
    contagemComPrimeiroContato > 0
      ? formatarHorasEmTempoAmigavel(tempoMedioPrimeiroContatoHoras)
      : 'Sem registros'

  const valorPotencialTotal = Object.values(valorPotencialPorEstagio).reduce((a, b) => a + b, 0)

  return {
    totalLeads,
    leads7Dias,
    leads30Dias,
    taxaConversaoNovoParaCliente,
    totalConvertidos,
    totalNovos,
    tempoMedioPrimeiroContatoHoras,
    tempoMedioPrimeiroContatoFormatado,
    leadsQuentesEsfriando,
    valorPotencialTotal,
    valorPotencialPorEstagio,
  }
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

  const diasParado = calcularDiasParado(dataMaisRecente)
  const valorPotencial = extrairValorPotencialLead(lead)
  const primeiroContatoEmHoras = calcularTempoPrimeiroContatoHoras(lead.created, interacoes)

  return {
    id: lead.id,
    nome: lead.nome || 'Lead sem nome',
    email: lead.email || '',
    telefone: lead.telefone || '',
    empresa: lead.empresa || 'Empresa não informada',
    cnpj: lead.cnpj,
    segmento: lead.segmento || 'Não Informado',
    funcionarios: lead.funcionarios || '',
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
    diasParado,
    valorPotencial,
    primeiroContatoEmHoras,
  }
}
