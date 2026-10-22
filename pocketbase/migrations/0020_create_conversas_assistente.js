migrate(
  (app) => {
    // 1. Criar coleção 'conversas_assistente' para arquivar as análises do Assistente
    // vinculadas ao cliente_id (ou gerais/avulsas caso cliente_id esteja vazio)
    const conversasCollection = new Collection({
      name: 'conversas_assistente',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'cliente_id',
          type: 'text',
          required: false,
        },
        {
          name: 'cliente_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'conversa_id_nativo',
          type: 'text',
          required: false,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'mensagens',
          type: 'json',
          required: false,
        },
        {
          name: 'total_mensagens',
          type: 'number',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_conversas_user ON conversas_assistente (user_id)',
        'CREATE INDEX idx_conversas_cliente ON conversas_assistente (cliente_id)',
        'CREATE INDEX idx_conversas_conversa_nativo ON conversas_assistente (conversa_id_nativo)',
        'CREATE INDEX idx_conversas_updated ON conversas_assistente (updated DESC)',
      ],
    })
    app.save(conversasCollection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('conversas_assistente')
      app.delete(col)
    } catch (_) {}
  },
)
