/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de chat com o agente nativo "assistente-calculadora-ibs-cbs" da Calculadora IBS/CBS.
 * Oferece streaming (SSE) via $ai.agent(slug).chat({ stream: true })
 * e suporte a histórico via listMessages / getOrCreateConversation.
 */
routerAdd(
  'POST',
  '/backend/v1/calculadora/assistente-chat-stream',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError(
          'Autenticação necessária para consultar o Assistente de Análise.',
        )
      }

      const body = e.requestInfo().body || {}
      const message = (body.message || '').trim()
      if (!message) {
        return e.badRequestError('Mensagem é obrigatória.')
      }

      const agent = $ai.agent('assistente-calculadora-ibs-cbs')
      const conv = agent.getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
        title: 'Análise Calculadora IBS/CBS',
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
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
      }
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao processar solicitação do assistente' : err.message,
        })
      }
      if (typeof SkipAiError !== 'undefined' && err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Serviço de IA temporariamente indisponível' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

/**
 * Endpoint de mensagens anteriores da conversa (para histórico de chat)
 */
routerAdd(
  'GET',
  '/backend/v1/calculadora/assistente-conversas/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const conversationId = e.request.pathValue('conversationId')
      const agent = $ai.agent('assistente-calculadora-ibs-cbs')
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
 * Endpoint para listar conversas do usuário com este agente
 */
routerAdd(
  'GET',
  '/backend/v1/calculadora/assistente-conversas',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const agent = $ai.agent('assistente-calculadora-ibs-cbs')
      const result = agent.listConversations({
        user_id: userId,
        limit: 10,
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
