migrate(
  (app) => {
    // Coleção notas_fiscais — notas fiscais reais de compras importadas (CSV/XML NFe)
    // em /dados-empresa (aba Notas Fiscais), usadas como fonte real na Calculadora IBS/CBS.
    // Regra de segurança padrão do projeto (mesmo padrão de clientes_empresas):
    // Master e Admin leem e gerenciam tudo; Empresário gerencia os seus registros.
    const ruleMasterAdmin =
      "@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com'"
    const ruleAcesso = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id || user_id = '' || user_id = null)`
    const ruleWrite = `@request.auth.id != '' && (${ruleMasterAdmin} || user_id = @request.auth.id)`

    // Idempotente: remove a coleção se já existir antes de recriar
    // (findCollectionByNameOrId lança erro quando não existe, por isso try/catch)
    try {
      const existente = app.findCollectionByNameOrId('notas_fiscais')
      app.delete(existente)
    } catch {
      // coleção ainda não existe — seguir
    }

    const collection = new Collection({
      name: 'notas_fiscais',
      type: 'base',
      listRule: ruleAcesso,
      viewRule: ruleAcesso,
      createRule: "@request.auth.id != ''",
      updateRule: ruleWrite,
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
          name: 'numero',
          type: 'text',
          required: true,
        },
        {
          name: 'data_emissao',
          type: 'date',
          required: false,
        },
        {
          name: 'cnpj_emitente',
          type: 'text',
          required: false,
        },
        {
          name: 'nome_emitente',
          type: 'text',
          required: false,
        },
        {
          name: 'valor_total',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'valor_produtos',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'regime_fornecedor',
          type: 'select',
          required: false,
          maxSelect: 1,
          values: ['lucro_real', 'lucro_presumido', 'simples_nacional', 'misto'],
        },
        {
          name: 'origem',
          type: 'select',
          required: false,
          maxSelect: 1,
          values: ['csv', 'xml_nfe', 'manual'],
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
        'CREATE INDEX idx_notas_user ON notas_fiscais (user_id)',
        'CREATE INDEX idx_notas_cliente ON notas_fiscais (cliente_id)',
        'CREATE INDEX idx_notas_data ON notas_fiscais (data_emissao)',
        'CREATE INDEX idx_notas_created ON notas_fiscais (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    // Rollback: remove a coleção se existir
    try {
      const existente = app.findCollectionByNameOrId('notas_fiscais')
      app.delete(existente)
    } catch {
      // nada a remover
    }
  },
)
