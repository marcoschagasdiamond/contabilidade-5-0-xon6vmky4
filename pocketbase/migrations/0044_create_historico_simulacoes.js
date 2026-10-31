migrate(
  (app) => {
    // Regra de leitura: Empresário só o próprio; Analista da carteira / contadores; master/admin tudo
    const readRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')"

    // Regra de criação: usuários autenticados
    const createRule = "@request.auth.id != ''"

    // Imutabilidade: histórico não pode ser editado nem excluído via API do app
    const updateRule = null
    const deleteRule = null

    const collection = new Collection({
      name: 'historico_simulacoes',
      type: 'base',
      listRule: readRule,
      viewRule: readRule,
      createRule: createRule,
      updateRule: updateRule,
      deleteRule: deleteRule,
      fields: [
        {
          name: 'simulacao_id',
          type: 'text',
          required: true,
        },
        {
          name: 'tipo_simulacao',
          type: 'select',
          required: true,
          values: ['calculadora', 'recuperador'],
          maxSelect: 1,
        },
        {
          name: 'tipo_evento',
          type: 'select',
          required: true,
          values: ['criacao', 'renomeacao', 'edicao_parametros', 'exclusao'],
          maxSelect: 1,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'simulacao_nome',
          type: 'text',
          required: false,
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
          name: 'cliente_id',
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
          name: 'autor_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'autor_email',
          type: 'text',
          required: false,
        },
        {
          name: 'autor_nivel',
          type: 'text',
          required: false,
        },
        {
          name: 'alteracoes_json',
          type: 'json',
          required: false,
        },
        {
          name: 'snapshot_anterior_json',
          type: 'json',
          required: false,
        },
        {
          name: 'snapshot_novo_json',
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
        'CREATE INDEX idx_hist_sim_id ON historico_simulacoes (simulacao_id)',
        'CREATE INDEX idx_hist_sim_user ON historico_simulacoes (user_id)',
        'CREATE INDEX idx_hist_sim_cliente ON historico_simulacoes (cliente_id)',
        'CREATE INDEX idx_hist_sim_tipo ON historico_simulacoes (tipo_simulacao)',
        'CREATE INDEX idx_hist_sim_evento ON historico_simulacoes (tipo_evento)',
        'CREATE INDEX idx_hist_sim_created ON historico_simulacoes (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('historico_simulacoes')
      app.delete(col)
    } catch (_) {}
  },
)
