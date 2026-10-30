migrate(
  (app) => {
    // Coleção para armazenar a lista de destinatários configurados do Radar Tributário semanal
    // Permite que Master e Admin gerenciem os e-mails que recebem os resumos semanais de novidades
    const configRadar = new Collection({
      name: 'configuracoes_radar',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'chave',
          type: 'text',
          required: true,
        },
        {
          name: 'destinatarios_json',
          type: 'json',
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_config_radar_chave ON configuracoes_radar (chave)'],
    })
    app.save(configRadar)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('configuracoes_radar')
      app.delete(col)
    } catch (_) {}
  },
)
