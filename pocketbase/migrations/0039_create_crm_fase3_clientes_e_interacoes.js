migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesEmpresasCol = app.findCollectionByNameOrId('clientes_empresas')

    // 1. Coleção crm_clientes (Ficha Comercial do Cliente no CRM)
    // Regras:
    // Analista: lê/cria/atualiza/exclui onde analista_responsavel = @request.auth.id
    // Master/Admin: leem e escrevem tudo
    // Empresario: sem acesso (bloqueado com @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario')
    const crmClientes = new Collection({
      name: 'crm_clientes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_responsavel = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_responsavel = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario'",
      updateRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_responsavel = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_responsavel = @request.auth.id)",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          collectionId: clientesEmpresasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'analista_responsavel',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status_comercial',
          type: 'select',
          required: true,
          values: ['Prospect', 'Onboarding', 'Ativo', 'Inativo', 'Perdido'],
          maxSelect: 1,
        },
        {
          name: 'origem_contato',
          type: 'text',
          required: false,
        },
        {
          name: 'valor_mensal_servico',
          type: 'number',
          required: false,
        },
        {
          name: 'data_entrada',
          type: 'date',
          required: false,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        {
          name: 'dados_customizados_json',
          type: 'json',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_cli_empresa ON crm_clientes (empresa_id)',
        'CREATE INDEX idx_crm_cli_analista ON crm_clientes (analista_responsavel)',
        'CREATE INDEX idx_crm_cli_status ON crm_clientes (status_comercial)',
        'CREATE INDEX idx_crm_cli_created ON crm_clientes (created DESC)',
      ],
    })
    app.save(crmClientes)

    // 2. Coleção crm_interacoes (Timeline de interações vinculada ao crm_clientes)
    // Regras: vinculada ao analista do crm_clientes ou autor da interação
    const crmInteracoes = new Collection({
      name: 'crm_interacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || crm_cliente_id.analista_responsavel = @request.auth.id || usuario_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || crm_cliente_id.analista_responsavel = @request.auth.id || usuario_id = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario'",
      updateRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || crm_cliente_id.analista_responsavel = @request.auth.id || usuario_id = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || crm_cliente_id.analista_responsavel = @request.auth.id || usuario_id = @request.auth.id)",
      fields: [
        {
          name: 'crm_cliente_id',
          type: 'relation',
          collectionId: crmClientes.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['reuniao', 'telefone', 'email', 'whatsapp', 'outros'],
          maxSelect: 1,
        },
        {
          name: 'data',
          type: 'date',
          required: true,
        },
        {
          name: 'resumo',
          type: 'text',
          required: true,
        },
        {
          name: 'proximo_passo',
          type: 'text',
          required: false,
        },
        {
          name: 'data_proximo_passo',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_inter_crm_cli ON crm_interacoes (crm_cliente_id)',
        'CREATE INDEX idx_crm_inter_user ON crm_interacoes (usuario_id)',
        'CREATE INDEX idx_crm_inter_tipo ON crm_interacoes (tipo)',
        'CREATE INDEX idx_crm_inter_data ON crm_interacoes (data DESC)',
        'CREATE INDEX idx_crm_inter_created ON crm_interacoes (created DESC)',
      ],
    })
    app.save(crmInteracoes)
  },
  (app) => {
    try {
      const crmInteracoes = app.findCollectionByNameOrId('crm_interacoes')
      app.delete(crmInteracoes)
    } catch (_) {}

    try {
      const crmClientes = app.findCollectionByNameOrId('crm_clientes')
      app.delete(crmClientes)
    } catch (_) {}
  },
)
