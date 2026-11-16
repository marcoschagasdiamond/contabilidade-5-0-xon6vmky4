/**
 * Serviço de rastreamento de cliques no WhatsApp da Home com Lead Scoring,
 * e de leads originados na Simulação Expressa da Home (com vedações).
 *
 * Requisitos:
 * 1. Visitante deslogado na home ao clicar no WhatsApp registra/atualiza lead na coleção `leads`.
 * 2. Fonte: "whatsapp-home".
 * 3. Idempotência: não duplica registros em cliques repetidos do mesmo visitante/sessão.
 * 4. Incremento de score / contagem de interesse registrado no payload do lead.
 * 5. Fire-and-forget: nunca atrasa nem bloqueia a navegação para o link wa.me.
 * 6. Usuário logado não gera lead.
 */

import pb from '@/lib/pocketbase/client'
import { createLead, type LeadRecord } from '@/services/leads'
import {
  OPCOES_VEDACAO_ANONIMA,
  temVedacaoAnonima,
  type IdVedacaoAnonima,
} from '@/lib/simulacaoExpressaVedacoes'

const SESSION_LEAD_KEY = 'c50_whatsapp_lead_id'
const SESSION_CLICKS_KEY = 'c50_whatsapp_lead_clicks'
const SESSION_LEAD_SIMULACAO_KEY = 'c50_simulacao_expressa_lead_id'

export interface RegistrarLeadWhatsAppOptions {
  origem?: string
  mensagem?: string
  isAuthenticated?: boolean
}

/**
 * Calcula a pontuação (score) de engajamento do lead baseado nos sinais de contato.
 * Sinal base de clique no WhatsApp: 30 pontos.
 * Cliques repetidos na mesma sessão: +10 pontos por reincidência (máx 100 pontos).
 */
export function calcularScoreLeadWhatsApp(cliques: number): number {
  const base = 30
  const bonus = Math.max(0, cliques - 1) * 10
  return Math.min(100, base + bonus)
}

/**
 * Registra o clique do visitante no WhatsApp como lead ou atualiza o lead da sessão de forma idempotente.
 * Retorna silenciosamente em caso de erro, garantindo execução fire-and-forget.
 */
export async function registrarLeadCliqueWhatsApp(
  options: RegistrarLeadWhatsAppOptions = {},
): Promise<LeadRecord | null> {
  // Usuário autenticado não gera lead de topo de funil
  if (options.isAuthenticated) {
    return null
  }

  try {
    const totalCliques = parseInt(sessionStorage.getItem(SESSION_CLICKS_KEY) || '0', 10) + 1
    sessionStorage.setItem(SESSION_CLICKS_KEY, String(totalCliques))

    const score = calcularScoreLeadWhatsApp(totalCliques)
    const existingLeadId = sessionStorage.getItem(SESSION_LEAD_KEY)

    const payloadMensagem = [
      `[Origem: ${options.origem || 'whatsapp-home'}]`,
      `Interesse demonstrado via botão flutuante de WhatsApp da Home.`,
      `Lead Score: ${score}/100 | Cliques na sessão: ${totalCliques}`,
      options.mensagem ? `Mensagem inicial pretendida: "${options.mensagem}"` : null,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
    ]
      .filter(Boolean)
      .join('\n')

    // Se já foi criado nesta sessão, atualiza o lead existente (idempotente com score incremental)
    if (existingLeadId) {
      try {
        const updated = await pb.collection('leads').update<LeadRecord>(existingLeadId, {
          mensagem: payloadMensagem,
          tipo_solicitacao: `whatsapp-home (score: ${score})`,
        })
        return updated
      } catch {
        // Se o lead anterior não for mais encontrado (ex: deletado no admin), cria um novo abaixo
      }
    }

    // Criação inicial do lead
    const novoLead = await createLead({
      nome: 'Lead WhatsApp (Visitante do Site)',
      email: '',
      telefone: '',
      empresa: 'Não informada',
      tipo_solicitacao: `whatsapp-home (score: ${score})`,
      segmento: 'Serviços',
      funcionarios: '1–5',
      mensagem: payloadMensagem,
    })

    if (novoLead?.id) {
      sessionStorage.setItem(SESSION_LEAD_KEY, novoLead.id)
    }

    return novoLead
  } catch (err) {
    // Tratamento de erro silencioso para nunca travar a experiência do usuário
    console.warn(
      '[WhatsApp Lead Scoring] Não foi possível registrar lead de forma silenciosa:',
      err,
    )
    return null
  }
}

// ============================================================================
// LEAD DA SIMULAÇÃO EXPRESSA (home "/") — com vedações ao Simples
// ============================================================================

/** Origem padrão do lead da Simulação Expressa sem vedação marcada. */
export const ORIGEM_LEAD_SIMULACAO_EXPRESSA = 'Simulação Expressa (home)'

/** Origem do lead da Simulação Expressa quando há possível vedação marcada. */
export const ORIGEM_LEAD_SIMULACAO_EXPRESSA_VEDACAO =
  'Simulação Expressa — vedação ao Simples (home)'

/**
 * Score do lead da Simulação Expressa anônima.
 * Caso com vedação marcada é caso complexo (procura-se orientação especializada):
 * base 30 + 20 por situação marcada (1 situação → 50, 2 → 70).
 * Sem vedação: base 30.
 */
export function calcularScoreLeadSimulacaoExpressa(selecionadas: IdVedacaoAnonima[]): number {
  const base = 30
  const bonusVedacao = Math.min(2, selecionadas.length) * 20
  return Math.min(100, base + bonusVedacao)
}

export interface RegistrarLeadSimulacaoExpressaOptions {
  /** Ids das situações de vedação marcadas no widget anônimo. */
  selecionadas?: IdVedacaoAnonima[]
  /** Faixa de faturamento e regime informados (contexto no payload). */
  faturamento?: string
  regime?: string
  isAuthenticated?: boolean
}

/**
 * Registra/atualiza o lead gerado pela Simulação Expressa anônima (fire-and-forget).
 * - Sem situações marcadas: lead simples com score base.
 * - Com situações marcadas: score maior e origem indicando possível vedação,
 *   com as situações descritas no payload para o técnico do CRM.
 * - Idempotente por sessão (primeiro envio cria; os seguintes atualizam).
 */
export async function registrarLeadSimulacaoExpressa(
  options: RegistrarLeadSimulacaoExpressaOptions = {},
): Promise<LeadRecord | null> {
  if (options.isAuthenticated) return null

  try {
    const selecionadas = options.selecionadas || []
    const comVedacao = temVedacaoAnonima(selecionadas)
    const score = calcularScoreLeadSimulacaoExpressa(selecionadas)
    const origem = comVedacao
      ? ORIGEM_LEAD_SIMULACAO_EXPRESSA_VEDACAO
      : ORIGEM_LEAD_SIMULACAO_EXPRESSA

    const rotulosMarcadas = selecionadas
      .map((id) => OPCOES_VEDACAO_ANONIMA.find((o) => o.id === id)?.rotulo || id)
      .filter(Boolean)

    const payloadMensagem = [
      `[Origem: ${origem}]`,
      `Lead gerado pela Simulação Expressa de IBS/CBS na Home.`,
      `Lead Score: ${score}/100`,
      options.faturamento ? `Faturamento anual informado: ${options.faturamento}` : null,
      options.regime ? `Regime tributário atual: ${options.regime}` : null,
      comVedacao
        ? `Possível vedação ao Simples Nacional (art. 17, LC 123/2006) — situações marcadas: ${rotulosMarcadas.join('; ')}.`
        : null,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
    ]
      .filter(Boolean)
      .join('\n')

    const payloadLead = {
      nome: 'Lead Simulação Expressa (Visitante do Site)',
      email: '',
      telefone: '',
      empresa: 'Não informada',
      tipo_solicitacao: `simulacao-expressa (score: ${score})`,
      segmento: 'Serviços',
      funcionarios: '1–5',
      mensagem: payloadMensagem,
      score,
      fonte: origem,
    }

    const existingLeadId = sessionStorage.getItem(SESSION_LEAD_SIMULACAO_KEY)

    // Atualização idempotente: só o primeiro envio da sessão cria o lead
    if (existingLeadId) {
      try {
        return await pb.collection('leads').update<LeadRecord>(existingLeadId, {
          mensagem: payloadMensagem,
          tipo_solicitacao: payloadLead.tipo_solicitacao,
          score,
          fonte: origem,
        })
      } catch {
        // Lead anterior removido no admin: segue para criar novo abaixo
      }
    }

    const novoLead = await createLead(payloadLead)

    if (novoLead?.id) {
      sessionStorage.setItem(SESSION_LEAD_SIMULACAO_KEY, novoLead.id)
    }

    return novoLead
  } catch (err) {
    console.warn(
      '[Simulação Expressa Lead] Não foi possível registrar lead de forma silenciosa:',
      err,
    )
    return null
  }
}
