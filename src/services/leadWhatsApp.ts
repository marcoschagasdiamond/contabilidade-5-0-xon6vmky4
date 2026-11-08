/**
 * Serviço de rastreamento de cliques no WhatsApp da Home com Lead Scoring.
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

const SESSION_LEAD_KEY = 'c50_whatsapp_lead_id'
const SESSION_CLICKS_KEY = 'c50_whatsapp_lead_clicks'

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
