migrate(
  (app) => {
    const collection = new Collection({
      name: 'simulacoes_calculadora',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
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
          name: 'regime_recomendado',
          type: 'text',
          required: false,
        },
        {
          name: 'economia_anual',
          type: 'number',
          required: false,
        },
        {
          name: 'aliquota_efetiva',
          type: 'number',
          required: false,
        },
        {
          name: 'faturamento_mensal',
          type: 'number',
          required: false,
        },
        {
          name: 'ano_base',
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
        'CREATE INDEX idx_simulacoes_user ON simulacoes_calculadora (user_id)',
        'CREATE INDEX idx_simulacoes_created ON simulacoes_calculadora (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('simulacoes_calculadora')
      app.delete(collection)
    } catch (_) {}
  },
)
