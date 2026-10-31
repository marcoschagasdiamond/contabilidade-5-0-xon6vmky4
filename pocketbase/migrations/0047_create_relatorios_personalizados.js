migrate(
  (app) => {
    // Leitura: Empresário vê o próprio; Analista vê da carteira / contadores; master/admin vê tudo
    const readRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')"

    // Criação: qualquer usuário autenticado
    const createRule = "@request.auth.id != ''"

    // Atualização: autor do relatório ou master/admin
    const updateRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"

    // Exclusão: autor do relatório ou master/admin
    const deleteRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"

    const collection = new Collection({
      name: 'relatorios_personalizados',
      type: 'base',
      listRule: readRule,
      viewRule: readRule,
      createRule: createRule,
      updateRule: updateRule,
      deleteRule: deleteRule,
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
          name: 'empresa_id',
          type: 'text',
          required: false,
        },
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'empresa_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'cnpj',
          type: 'text',
          required: false,
        },
        {
          name: 'analises_incluidas',
          type: 'json',
          required: false,
        },
        {
          name: 'secoes_selecionadas',
          type: 'json',
          required: false,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        {
          name: 'configuracao',
          type: 'json',
          required: true,
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
        'CREATE INDEX idx_relat_pers_user ON relatorios_personalizados (user_id)',
        'CREATE INDEX idx_relat_pers_cliente ON relatorios_personalizados (cliente_id)',
        'CREATE INDEX idx_relat_pers_empresa ON relatorios_personalizados (empresa_id)',
        'CREATE INDEX idx_relat_pers_created ON relatorios_personalizados (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('relatorios_personalizados')
      app.delete(col)
    } catch (_) {}
  },
)
