migrate(
  (app) => {
    // Leitura: Empresário vê o próprio; Analista vê da carteira / contadores; master/admin vê tudo
    const readRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')"

    // Criação: qualquer usuário autenticado (gerado ao salvar Dados da Empresa)
    const createRule = "@request.auth.id != ''"

    // Imutabilidade estrita: histórico de auditoria não pode ser editado nem excluído
    const updateRule = null
    const deleteRule = null

    const collection = new Collection({
      name: 'historico_dados_empresa',
      type: 'base',
      listRule: readRule,
      viewRule: readRule,
      createRule: createRule,
      updateRule: updateRule,
      deleteRule: deleteRule,
      fields: [
        {
          name: 'empresa_id',
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
          name: 'origem_ajuste',
          type: 'text',
          required: false, // ex: 'botao_corrigir_dados', 'dados_empresa', 'calculadora', 'recuperador', 'diagnostico'
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'nome_empresa',
          type: 'text',
          required: false,
        },
        {
          name: 'cnpj',
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
        'CREATE INDEX idx_hist_demp_empresa ON historico_dados_empresa (empresa_id)',
        'CREATE INDEX idx_hist_demp_user ON historico_dados_empresa (user_id)',
        'CREATE INDEX idx_hist_demp_cliente ON historico_dados_empresa (cliente_id)',
        'CREATE INDEX idx_hist_demp_created ON historico_dados_empresa (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('historico_dados_empresa')
      app.delete(col)
    } catch (_) {}
  },
)
