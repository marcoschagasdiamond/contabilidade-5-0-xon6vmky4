migrate(
  (app) => {
    const collection = new Collection({
      name: 'historico_relatorios_diagnostico',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
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
          name: 'empresa_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'gerado_por',
          type: 'text',
          required: false,
        },
        {
          name: 'user_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'versao_rotulo',
          type: 'text',
          required: false,
        },
        {
          name: 'motivo_evento',
          type: 'text',
          required: false,
        },
        {
          name: 'dados_json',
          type: 'json',
          required: true,
        },
        {
          name: 'resumo_json',
          type: 'json',
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
        'CREATE INDEX idx_hist_relat_cliente ON historico_relatorios_diagnostico (cliente_id)',
        'CREATE INDEX idx_hist_relat_user ON historico_relatorios_diagnostico (user_id)',
        'CREATE INDEX idx_hist_relat_created ON historico_relatorios_diagnostico (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('historico_relatorios_diagnostico')
      app.delete(col)
    } catch (_) {}
  },
)
