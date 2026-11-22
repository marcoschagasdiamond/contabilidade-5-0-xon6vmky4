import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  displayableMessages,
  type AgentMessage,
  type DisplayMessage,
  type StreamAgentChatHandlers,
  type StreamAgentChatResult,
} from '@/lib/skipAi'

export interface ConversaNativaSuporte {
  id: string
  title?: string
  created?: string
  updated?: string
}

/**
 * Envia mensagem para o agente nativo assistente-suporte-50 via SSE (streaming).
 *
 * Contexto opcional do cliente (botão "Suporte" do card na /carteira):
 * Não cria conversa/agente novo — o hook injeta o contexto na MESMA conversa
 * do MESMO agente assistente-suporte-50.
 */
export interface ContextoClienteSuporte {
  nome?: string
  cnpj?: string
  regime?: string
  estagio_funil?: string
  segmento?: string
  uf?: string
}

export async function enviarMensagemSuporteStream(
  mensagem: string,
  conversationId: string | null,
  handlers: StreamAgentChatHandlers = {},
  contextoCliente?: ContextoClienteSuporte | null,
): Promise<StreamAgentChatResult & { conversation_id: string }> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(`${baseUrl}/backend/v1/suporte/chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({
      message: mensagem,
      conversation_id: conversationId || undefined,
      contexto_cliente: contextoCliente || undefined,
    }),
    signal: handlers.signal,
  })

  const resultado = await streamAgentChat(res, handlers)
  const headerConvId = res.headers.get('X-Conversation-Id')

  return {
    ...resultado,
    conversation_id: headerConvId || resultado.conversation_id,
  }
}

/**
 * Busca o histórico de mensagens de uma conversa nativa do agente de suporte.
 */
export async function carregarMensagensSuporte(conversationId: string): Promise<DisplayMessage[]> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(
    `${baseUrl}/backend/v1/suporte/conversas/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: {
        Authorization: token,
      },
    },
  )

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Falha ao carregar histórico de mensagens.')
  }

  const data = payload as { messages: AgentMessage[] }
  return displayableMessages(data.messages || [])
}

/**
 * Lista as conversas nativas de suporte do usuário atual.
 */
export async function listarConversasSuporte(): Promise<ConversaNativaSuporte[]> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const token = pb.authStore.token

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(`${baseUrl}/backend/v1/suporte/conversas`, {
    headers: {
      Authorization: token,
    },
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Falha ao listar conversas de suporte.')
  }

  const items = (payload?.conversations || payload || []) as ConversaNativaSuporte[]
  return Array.isArray(items) ? items : []
}
