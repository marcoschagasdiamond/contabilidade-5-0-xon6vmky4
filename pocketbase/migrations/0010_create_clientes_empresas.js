migrate(
  (app) => {
    // 1. Atualizar regras de acesso da coleção 'users' para permitir que admin liste/veja todos
    // e o usuário continue editando o seu próprio registro
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    // Qualquer usuário autenticado (ou cliente/admin) pode se registrar (create já é ""),
    // e usuários autenticados podem listar/ver seus registros ou admins podem listar tudo.
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    app.save(usersCol)

    // 2. Criar coleção 'clientes_empresas' para armazenar o perfil completo de Dados da Empresa
    const clientesEmpresas = new Collection({
      name: 'clientes_empresas',
      type: 'base',
      // Regras: qualquer autenticado pode ler/listar (admin lê todos; cliente lê o seu ou filtra)
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      // Cliente autenticado pode criar seu registro vinculado
      createRule: "@request.auth.id != ''",
      // O próprio usuário dono pode atualizar ou admin
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        // Relação com o usuário da conta
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
          required: false,
        },
        // Identificação (fiel a DadosEmpresaPerfil)
        { name: 'nome_contato', type: 'text', required: true },
        { name: 'nome_empresa', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'telefone', type: 'text', required: true },
        // Localização
        { name: 'uf_origem', type: 'text', required: true },
        { name: 'cidade', type: 'text', required: true },
        // Segmento
        {
          name: 'segmento',
          type: 'select',
          required: true,
          values: [
            'Comércio',
            'Serviços',
            'Indústria',
            'Saúde',
            'Educação',
            'Agro',
            'Transporte',
            'Tecnologia',
            'Construção Civil',
            'Bares e Restaurantes',
          ],
          maxSelect: 1,
        },
        // Perfil Operacional
        { name: 'regime_atual', type: 'text', required: false },
        { name: 'funcionarios', type: 'text', required: false },
        { name: 'emissao_nf', type: 'text', required: false },
        { name: 'atividade_mista', type: 'bool', required: false },
        // Campos operacionais para motores de cálculo
        { name: 'faturamento_mensal', type: 'number', required: false },
        { name: 'percentual_compras_vendas', type: 'number', required: false },
        { name: 'tipo_atividade', type: 'text', required: false },
        { name: 'subatividade_servico', type: 'text', required: false },
        { name: 'subatividade_industria', type: 'text', required: false },
        { name: 'subatividade_comercio', type: 'text', required: false },
        { name: 'proporcao_servico_misto', type: 'number', required: false },
        // Parâmetros tributários de alta precisão
        { name: 'folha_pagamento_mensal', type: 'number', required: false },
        { name: 'margem_lucro_estimada', type: 'number', required: false },
        { name: 'despesas_creditos_mensais', type: 'number', required: false },
        { name: 'percentual_exportacao', type: 'number', required: false },
        { name: 'ano_base_transicao', type: 'number', required: false },
        // Timestamps obrigatórios para collections base
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_empresas_user ON clientes_empresas (user_id)',
        'CREATE INDEX idx_clientes_empresas_email ON clientes_empresas (email)',
        'CREATE INDEX idx_clientes_empresas_cnpj ON clientes_empresas (cnpj)',
        'CREATE INDEX idx_clientes_empresas_created ON clientes_empresas (created DESC)',
      ],
    })
    app.save(clientesEmpresas)

    // 3. Adicionar campo 'user_id' na coleção 'diagnosticos' se ainda não existir
    try {
      const diagCol = app.findCollectionByNameOrId('diagnosticos')
      if (!diagCol.fields.getByName('user_id')) {
        diagCol.fields.add(
          new RelationField({
            name: 'user_id',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
            required: false,
          }),
        )
        app.save(diagCol)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('clientes_empresas')
      app.delete(col)
    } catch (_) {}
  },
)
