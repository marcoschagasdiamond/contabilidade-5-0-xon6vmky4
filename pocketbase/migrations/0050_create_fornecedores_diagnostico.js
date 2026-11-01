migrate(
  (app) => {
    // Regra de segurança padrão do projeto:
    // Master e Admin leem e gerenciam tudo
    // Analista/Contador acessa registros dele ou de clientes da sua carteira
    // Empresário autenticado vê e gerencia os seus registros (user_id = @request.auth.id)
    const ruleMasterAdmin =
      "@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com'"
    const ruleAcesso = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id || user_id = '' || user_id = null || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')`
    const ruleWrite = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id)`

    const fornecedoresCollection = new Collection({
      name: 'fornecedores_diagnostico',
      type: 'base',
      listRule: ruleAcesso,
      viewRule: ruleAcesso,
      createRule: "@request.auth.id != ''",
      updateRule: ruleAcesso,
      deleteRule: ruleWrite,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'cliente_id',
          type: 'text',
          required: false,
        },
        {
          name: 'diagnostico_id',
          type: 'text',
          required: false,
        },
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'cnpj',
          type: 'text',
          required: false,
        },
        {
          name: 'regime',
          type: 'select',
          required: true,
          values: ['lucro_real', 'lucro_presumido', 'simples_nacional', 'misto'],
          maxSelect: 1,
        },
        {
          name: 'proporcao_misto',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
        },
        {
          name: 'volume_compras',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'classificacao_credito',
          type: 'select',
          required: true,
          values: ['integral', 'parcial', 'nao_gera'],
          maxSelect: 1,
        },
        {
          name: 'percentual_credito_parcial',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
        },
        {
          name: 'descricao_item',
          type: 'text',
          required: false,
        },
        {
          name: 'aliquota_simples_informada',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        {
          name: 'dados_extra_json',
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
        'CREATE INDEX idx_fornecedores_user ON fornecedores_diagnostico (user_id)',
        'CREATE INDEX idx_fornecedores_cliente ON fornecedores_diagnostico (cliente_id)',
        'CREATE INDEX idx_fornecedores_regime ON fornecedores_diagnostico (regime)',
        'CREATE INDEX idx_fornecedores_created ON fornecedores_diagnostico (created DESC)',
      ],
    })

    app.save(fornecedoresCollection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('fornecedores_diagnostico')
      app.delete(col)
    } catch (_) {}
  },
)
