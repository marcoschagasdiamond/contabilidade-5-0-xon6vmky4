/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de chat com o agente nativo "assistente-suporte-50" do sistema Contabilidade 5.0.
 * Atende usuários autenticados de todos os perfis (Empresário, Analista, Admin, Master).
 * Oferece:
 * 1) Streaming (SSE) via $ai.agent('assistente-suporte-50').chat({ stream: true })
 * 2) Listagem de mensagens de uma conversa nativa
 * 3) Listagem de conversas nativas do usuário autenticado
 */
routerAdd(
  'POST',
  '/backend/v1/suporte/chat-stream',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária para consultar o Suporte.')
      }

      const body = e.requestInfo().body || {}
      const message = (body.message || '').trim()
      if (!message) {
        return e.badRequestError('Mensagem é obrigatória.')
      }

      const agent = $ai.agent('assistente-suporte-50')
      const tituloConversa = 'Suporte Contabilidade 5.0'

      const conv = agent.getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
        title: tituloConversa,
      })

      const iter = agent.chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      return $response.stream(e, iter)
    } catch (err) {
      if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de suporte temporariamente indisponível' })
      }
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao processar solicitação de suporte' : err.message,
        })
      }
      if (typeof SkipAiError !== 'undefined' && err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Serviço de suporte temporariamente indisponível' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

/**
 * Listagem das mensagens de uma conversa de suporte
 */
routerAdd(
  'GET',
  '/backend/v1/suporte/conversas/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const conversationId = e.request.pathValue('conversationId')
      const agent = $ai.agent('assistente-suporte-50')
      const result = agent.listMessages({
        conversation_id: conversationId,
        user_id: userId,
        limit: 50,
      })

      return e.json(200, result)
    } catch (err) {
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Falha ao buscar mensagens' : err.message })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

/**
 * Listagem de conversas anteriores do usuário com o agente de suporte
 */
routerAdd(
  'GET',
  '/backend/v1/suporte/conversas',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const agent = $ai.agent('assistente-suporte-50')
      const result = agent.listConversations({
        user_id: userId,
        limit: 20,
      })

      return e.json(200, result)
    } catch (err) {
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Falha ao buscar conversas' : err.message })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
