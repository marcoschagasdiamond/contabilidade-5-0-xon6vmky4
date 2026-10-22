/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de chat com o agente nativo "assistente-calculadora-ibs-cbs" da Calculadora IBS/CBS.
 * Oferece:
 * 1) Streaming (SSE) via $ai.agent(slug).chat({ stream: true })
 * 2) Contexto do cliente ativo passado na mensagem enviada ao agente
 * 3) Endpoint para persistir / sincronizar conversa arquivada na coleção 'conversas_assistente'
 * 4) Endpoints para listar conversas arquivadas por cliente ou gerais e obter histórico
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

      const clienteId = (body.cliente_id || '').trim()
      const clienteNome = (body.cliente_nome || '').trim()

      // Injeta instrução contextual de cliente ativo para o agente quando informado
      let promptParaAgente = message
      if (clienteId && clienteNome) {
        promptParaAgente = `[CONTEXTO DO CLIENTE ATIVO NA SESSÃO:
Nome do Cliente: "${clienteNome}"
ID do Cliente: "${clienteId}"
INSTRUÇÃO OBRIGATÓRIA: Considere preferencialmente as simulações salvas na coleção "simulacoes_calculadora" cujo campo "cliente_id" seja igual a "${clienteId}" ou cujo campo "empresa"/"nome" faça referência a "${clienteNome}". Caso não haja simulações para este cliente, mencione isso explicitamente ao contador.]

Pergunta do Usuário:
${message}`
      } else if (clienteNome && !clienteId) {
        promptParaAgente = `[CONTEXTO DA SESSÃO: Cliente "${clienteNome}" selecionado (modo sem ID direto).]

Pergunta do Usuário:
${message}`
      }

      const agent = $ai.agent('assistente-calculadora-ibs-cbs')
      const tituloConversa = clienteNome
        ? `Análise — ${clienteNome}`
        : 'Análise Geral Calculadora IBS/CBS'

      const conv = agent.getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
        title: tituloConversa,
      })

      const iter = agent.chat({
        user_id: userId,
        conversation_id: conv.id,
        message: promptParaAgente,
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
 * Endpoint de mensagens anteriores da conversa nativa do agente
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
 * Endpoint para listar conversas nativas do agente
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

/**
 * Endpoint para persistir / sincronizar o arquivamento de uma conversa
 * na coleção 'conversas_assistente' vinculada a um cliente_id (ou geral se cliente_id vazio)
 */
routerAdd(
  'POST',
  '/backend/v1/calculadora/assistente-conversas/salvar',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const body = e.requestInfo().body || {}
      const conversaIdNativo = (body.conversa_id_nativo || '').trim()
      const clienteId = (body.cliente_id || '').trim()
      const clienteNome = (body.cliente_nome || '').trim()
      const titulo =
        (body.titulo || '').trim() || (clienteNome ? `Análise — ${clienteNome}` : 'Análise Geral')
      const mensagens = Array.isArray(body.mensagens) ? body.mensagens : []

      if (!mensagens || mensagens.length === 0) {
        return e.badRequestError('Nenhuma mensagem para arquivar.')
      }

      const conversasCol = $app.findCollectionByNameOrId('conversas_assistente')

      // Busca se já existe registro arquivado para este conversa_id_nativo (ou id informado)
      let record = null
      if (body.id) {
        try {
          record = $app.findRecordById('conversas_assistente', body.id)
        } catch (_) {}
      } else if (conversaIdNativo) {
        try {
          record = $app.findFirstRecordByFilter(
            'conversas_assistente',
            `user_id = "${userId}" && conversa_id_nativo = "${conversaIdNativo}"`,
          )
        } catch (_) {}
      }

      if (!record) {
        record = new Record(conversasCol)
        record.set('user_id', userId)
      }

      record.set('cliente_id', clienteId)
      record.set('cliente_nome', clienteNome)
      record.set('conversa_id_nativo', conversaIdNativo)
      record.set('titulo', titulo)
      record.set('mensagens', JSON.stringify(mensagens))
      record.set('total_mensagens', mensagens.length)

      $app.save(record)

      return e.json(200, {
        id: record.id,
        cliente_id: clienteId,
        cliente_nome: clienteNome,
        conversa_id_nativo: conversaIdNativo,
        titulo: titulo,
        total_mensagens: mensagens.length,
        updated: record.getString('updated'),
        created: record.getString('created'),
      })
    } catch (err) {
      console.log('Erro ao salvar conversa do assistente:', err)
      return e.json(500, { error: 'Falha ao arquivar conversa do assistente' })
    }
  },
  $apis.requireAuth(),
)
