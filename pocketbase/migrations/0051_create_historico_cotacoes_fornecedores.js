migrate(
  (app) => {
    // Regra de segurança padrão do projeto (igual a 0050_create_fornecedores_diagnostico.js)
    const ruleMasterAdmin =
      "@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com'"
    const ruleAcesso = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id || user_id = '' || user_id = null || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')`
    const ruleWrite = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id)`

    const fornecedorCol = app.findCollectionByNameOrId('fornecedores_diagnostico')

    const historicoCollection = new Collection({
      name: 'historico_cotacoes_fornecedores',
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
          name: 'fornecedor_id',
          type: 'relation',
          collectionId: fornecedorCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'fornecedor_nome',
          type: 'text',
          required: true,
        },
        {
          name: 'data_cotacao',
          type: 'date',
          required: false,
        },
        {
          name: 'descricao_item',
          type: 'text',
          required: false,
        },
        {
          name: 'preco_informado',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'regime',
          type: 'select',
          required: true,
          values: ['lucro_real', 'lucro_presumido', 'simples_nacional'],
          maxSelect: 1,
        },
        {
          name: 'percentual_efetivo_simples',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
        },
        {
          name: 'custo_liquido_calculado',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'credito_calculado',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'eh_vencedora',
          type: 'bool',
          required: false,
        },
        {
          name: 'ano_transicao',
          type: 'number',
          required: false,
        },
        {
          name: 'regime_comprador',
          type: 'text',
          required: false,
        },
        {
          name: 'classificacao_item',
          type: 'text',
          required: false,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        {
          name: 'dados_comparacao_json',
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
        'CREATE INDEX idx_hist_cot_user ON historico_cotacoes_fornecedores (user_id)',
        'CREATE INDEX idx_hist_cot_cliente ON historico_cotacoes_fornecedores (cliente_id)',
        'CREATE INDEX idx_hist_cot_fornecedor ON historico_cotacoes_fornecedores (fornecedor_id)',
        'CREATE INDEX idx_hist_cot_vencedora ON historico_cotacoes_fornecedores (eh_vencedora)',
        'CREATE INDEX idx_hist_cot_created ON historico_cotacoes_fornecedores (created DESC)',
      ],
    })

    app.save(historicoCollection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('historico_cotacoes_fornecedores')
      app.delete(col)
    } catch (_) {}
  },
)
