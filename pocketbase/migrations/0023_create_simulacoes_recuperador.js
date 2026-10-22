migrate(
  (app) => {
    const collection = new Collection({
      name: 'simulacoes_recuperador',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'text',
          required: false,
        },
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'empresa',
          type: 'text',
          required: false,
        },
        {
          name: 'cnpj',
          type: 'text',
          required: false,
        },
        {
          name: 'regime_atual',
          type: 'text',
          required: false,
        },
        {
          name: 'parametros_json',
          type: 'json',
          required: true,
        },
        {
          name: 'resultados_json',
          type: 'json',
          required: true,
        },
        {
          name: 'total_recuperavel_integral',
          type: 'number',
          required: false,
        },
        {
          name: 'total_recuperavel_conservador',
          type: 'number',
          required: false,
        },
        {
          name: 'total_pis_cofins',
          type: 'number',
          required: false,
        },
        {
          name: 'total_folha',
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
        'CREATE INDEX idx_sim_recup_user ON simulacoes_recuperador (user_id)',
        'CREATE INDEX idx_sim_recup_cliente ON simulacoes_recuperador (cliente_id)',
        'CREATE INDEX idx_sim_recup_created ON simulacoes_recuperador (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('simulacoes_recuperador')
      app.delete(col)
    } catch (_) {}
  },
)
