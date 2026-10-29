/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Explicação de Legislação para Leigos (Contabilidade 5.0 / Diamond Group)
 *
 * Utiliza o agente nativo "explicador-legislacao" via $ai.agent("explicador-legislacao").chat()
 * com suporte a stream (SSE) ou sync, além de cache na coleção "explicacoes_legislacao".
 *
 * Endpoints:
 * 1) GET /backend/v1/legislacao/explicacao/{chave} — Consulta cache direto
 * 2) POST /backend/v1/legislacao/explicar-stream — Executa agente nativo em streaming (SSE)
 * 3) POST /backend/v1/legislacao/explicar-sync — Executa agente nativo síncrono e salva cache
 * 4) POST /backend/v1/legislacao/salvar-explicacao — Persiste os 3 blocos na coleção
 */

/**
 * 1. Consultar explicação em cache por chave
 */
routerAdd('GET', '/backend/v1/legislacao/explicacao/{chave}', (e) => {
  try {
    const rawChave = e.request.pathValue('chave') || ''
    const chave = decodeURIComponent(rawChave).trim()
    if (!chave) {
      return e.badRequestError('Chave da norma é obrigatória.')
    }

    try {
      const record = $app.findFirstRecordByFilter(
        'explicacoes_legislacao',
        `chave_norma = "${chave.replace(/"/g, '')}"`,
      )
      if (record) {
        return e.json(200, {
          encontrado: true,
          item: {
            id: record.id,
            chave_norma: record.getString('chave_norma'),
            titulo: record.getString('titulo'),
            tipo: record.getString('tipo'),
            numero: record.getString('numero'),
            ano: record.getInt('ano'),
            tributo: record.getString('tributo'),
            orgao: record.getString('orgao'),
            link_oficial: record.getString('link_oficial'),
            o_que_e: record.getString('o_que_e'),
            para_quem_importa: record.getString('para_quem_importa'),
            na_pratica: record.getString('na_pratica'),
            texto_completo: record.getString('texto_completo'),
            created: record.getString('created'),
            updated: record.getString('updated'),
          },
        })
      }
    } catch (_) {}

    return e.json(200, { encontrado: false, item: null })
  } catch (err) {
    console.log('[Explicador Legislação] Erro ao buscar cache:', err)
    return e.json(500, { error: 'Falha ao buscar cache de explicação.' })
  }
})

/**
 * 2. Streaming via Agente Nativo Skip Cloud
 */
routerAdd('POST', '/backend/v1/legislacao/explicar-stream', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const chave = (body.chave_norma || '').trim()
    const titulo = (body.titulo || '').trim()
    const ementa = (body.ementa || '').trim()
    const tipo = (body.tipo || '').trim()
    const numero = (body.numero || '').trim()
    const ano = body.ano || ''
    const tributo = (body.tributo || '').trim()
    const orgao = (body.orgao || '').trim()
    const linkOficial = (body.link_oficial || '').trim()

    if (!chave || !titulo) {
      return e.badRequestError('Chave e título da norma são obrigatórios.')
    }

    // 1) Se já está cacheado no banco, informa no cabeçalho ou retorna direto
    try {
      const cacheRecord = $app.findFirstRecordByFilter(
        'explicacoes_legislacao',
        `chave_norma = "${chave.replace(/"/g, '')}"`,
      )
      if (cacheRecord && cacheRecord.getString('o_que_e')) {
        // Retorna via SSE instantâneo ou direto
        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-From-Cache', 'true')

        const payloadCache =
          cacheRecord.getString('texto_completo') ||
          `### O que é\n${cacheRecord.getString('o_que_e')}\n\n### Para quem importa\n${cacheRecord.getString('para_quem_importa')}\n\n### Na prática\n${cacheRecord.getString('na_pratica')}`

        e.response.write(`event: chunk\ndata: ${JSON.stringify({ content: payloadCache })}\n\n`)
        e.response.write(
          `event: done\ndata: ${JSON.stringify({ conversation_id: 'cache', message_id: cacheRecord.id })}\n\n`,
        )
        return
      }
    } catch (_) {}

    // 2) Identificar o usuário para o agente nativo
    let userId = e.auth?.id
    if (!userId) {
      // Buscar usuário master padrão do sistema para chamadas de visitantes
      try {
        const masterUser = $app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'marcoschagasdiamond@icloud.com',
        )
        if (masterUser) userId = masterUser.id
      } catch (_) {}
    }

    if (!userId) {
      // Busca qualquer usuário cadastrado
      try {
        const users = $app.findRecordsByFilter('_pb_users_auth_', '', '-created', 1, 0)
        if (users && users.length > 0) userId = users[0].id
      } catch (_) {}
    }

    if (!userId) {
      return e.json(503, { error: 'Nenhum usuário base disponível para executar o agente.' })
    }

    // Prompt construído estritamente a partir dos dados oficiais do card
    const promptNorma = `DADOS OFICIAIS DA NORMA:
- Título: ${titulo}
- Tipo de Ato: ${tipo || 'Não especificado'}
- Número/Identificador: ${numero || 'Não informado'}
- Ano: ${ano || 'Não informado'}
- Tributo: ${tributo || 'Geral'}
- Órgão Emissor/Julgador: ${orgao || 'Poder Público'}
- Link Oficial: ${linkOficial || 'Não informado'}
- Ementa Oficial:
"""
${ementa || 'Sem ementa detalhada informada.'}
"""

INSTRUÇÃO:
Gere a explicação em linguagem leiga, acessível e executiva, dividida RIGOROSAMENTE nos 3 blocos:
### O que é
### Para quem importa
### Na prática

Lembre-se: baseie-se exclusivamente nos dados acima, sem inventar artigos ou detalhes não informados.`

    const agent = $ai.agent('explicador-legislacao')
    const conv = agent.getOrCreateConversation({
      user_id: userId,
      id: null,
      title: `Explicação — ${titulo.slice(0, 50)}`,
    })

    const iter = agent.chat({
      user_id: userId,
      conversation_id: conv.id,
      message: promptNorma,
      stream: true,
    })

    e.response.header().set('Content-Type', 'text/event-stream')
    e.response.header().set('Cache-Control', 'no-cache')
    e.response.header().set('X-Conversation-Id', conv.id)
    return $response.stream(e, iter)
  } catch (err) {
    console.log('[Explicador Legislação] Erro no stream:', err)
    if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
    }
    if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
      const status = err.status || 500
      return e.json(status, {
        error: status >= 500 ? 'Falha ao processar explicação pelo agente' : err.message,
      })
    }
    if (typeof SkipAiError !== 'undefined' && err instanceof SkipAiError) {
      const status = err.status || 502
      return e.json(status, {
        error: status >= 500 ? 'Serviço de IA temporariamente indisponível' : err.message,
      })
    }
    return e.json(500, { error: 'Erro ao gerar explicação.' })
  }
})

/**
 * 3. Persistência de cache após término da geração
 */
routerAdd('POST', '/backend/v1/legislacao/salvar-explicacao', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const chave = (body.chave_norma || '').trim()
    if (!chave) {
      return e.badRequestError('Chave da norma é obrigatória.')
    }

    const col = $app.findCollectionByNameOrId('explicacoes_legislacao')

    let record = null
    try {
      record = $app.findFirstRecordByFilter(
        'explicacoes_legislacao',
        `chave_norma = "${chave.replace(/"/g, '')}"`,
      )
    } catch (_) {}

    if (!record) {
      record = new Record(col)
      record.set('chave_norma', chave)
    }

    if (body.titulo) record.set('titulo', body.titulo)
    if (body.tipo) record.set('tipo', body.tipo)
    if (body.numero) record.set('numero', String(body.numero))
    if (body.ano) record.set('ano', parseInt(body.ano, 10) || 0)
    if (body.tributo) record.set('tributo', body.tributo)
    if (body.orgao) record.set('orgao', body.orgao)
    if (body.link_oficial) record.set('link_oficial', body.link_oficial)
    if (body.o_que_e) record.set('o_que_e', body.o_que_e)
    if (body.para_quem_importa) record.set('para_quem_importa', body.para_quem_importa)
    if (body.na_pratica) record.set('na_pratica', body.na_pratica)
    if (body.texto_completo) record.set('texto_completo', body.texto_completo)

    $app.save(record)

    return e.json(200, {
      sucesso: true,
      id: record.id,
      chave_norma: chave,
    })
  } catch (err) {
    console.log('[Explicador Legislação] Erro ao persistir cache:', err)
    return e.json(500, { error: 'Falha ao salvar explicação no cache.' })
  }
})
