migrate(
  (app) => {
    // 1. Resolver IDs das coleções existentes
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const clientesEmpresasCol = app.findCollectionByNameOrId('clientes_empresas')

    // 2. Adicionar campos de funil na coleção 'clientes'
    if (!clientesCol.fields.getByName('estagio_funil')) {
      clientesCol.fields.add(
        new SelectField({
          name: 'estagio_funil',
          required: false,
          values: ['lead', 'diagnostico', 'proposta', 'cliente_ativo', 'descartado'],
          maxSelect: 1,
        }),
      )
    }
    if (!clientesCol.fields.getByName('origem_lead')) {
      clientesCol.fields.add(
        new TextField({
          name: 'origem_lead',
          required: false,
        }),
      )
    }
    if (!clientesCol.fields.getByName('funil_atualizado_em')) {
      clientesCol.fields.add(
        new DateField({
          name: 'funil_atualizado_em',
          required: false,
        }),
      )
    }
    if (!clientesCol.fields.getByName('funil_atualizado_por')) {
      clientesCol.fields.add(
        new RelationField({
          name: 'funil_atualizado_por',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(clientesCol)

    // 3. Adicionar campos de funil na coleção 'clientes_empresas' (para paridade total na Visão Global)
    if (!clientesEmpresasCol.fields.getByName('estagio_funil')) {
      clientesEmpresasCol.fields.add(
        new SelectField({
          name: 'estagio_funil',
          required: false,
          values: ['lead', 'diagnostico', 'proposta', 'cliente_ativo', 'descartado'],
          maxSelect: 1,
        }),
      )
    }
    if (!clientesEmpresasCol.fields.getByName('origem_lead')) {
      clientesEmpresasCol.fields.add(
        new TextField({
          name: 'origem_lead',
          required: false,
        }),
      )
    }
    if (!clientesEmpresasCol.fields.getByName('funil_atualizado_em')) {
      clientesEmpresasCol.fields.add(
        new DateField({
          name: 'funil_atualizado_em',
          required: false,
        }),
      )
    }
    if (!clientesEmpresasCol.fields.getByName('funil_atualizado_por')) {
      clientesEmpresasCol.fields.add(
        new RelationField({
          name: 'funil_atualizado_por',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(clientesEmpresasCol)

    // 4. Nova coleção 'crm_anotacoes'
    // cliente (relation clientes), autor (relation users), texto, created, updated
    // Regras: master/admin leem e escrevem tudo; analistas leem e escrevem apenas para os próprios clientes
    const crmAnotacoes = new Collection({
      name: 'crm_anotacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || cliente.user_id = @request.auth.id || autor = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || cliente.user_id = @request.auth.id || autor = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || autor = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || autor = @request.auth.id)",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'cliente_empresa_id',
          type: 'text',
          required: false,
        },
        {
          name: 'autor',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'texto',
          type: 'text',
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_anotacoes_cliente ON crm_anotacoes (cliente)',
        'CREATE INDEX idx_crm_anotacoes_empresa_id ON crm_anotacoes (cliente_empresa_id)',
        'CREATE INDEX idx_crm_anotacoes_autor ON crm_anotacoes (autor)',
        'CREATE INDEX idx_crm_anotacoes_created ON crm_anotacoes (created DESC)',
      ],
    })
    app.save(crmAnotacoes)

    // 5. Nova coleção 'crm_tarefas'
    // cliente (relation), cliente_empresa_id (text), titulo, descricao, prazo (date), responsavel (relation users),
    // status (select: pendente | concluida | cancelada), autor (relation users), concluida_em (date), created, updated
    const crmTarefas = new Collection({
      name: 'crm_tarefas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || cliente.user_id = @request.auth.id || responsavel = @request.auth.id || autor = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || cliente.user_id = @request.auth.id || responsavel = @request.auth.id || autor = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || responsavel = @request.auth.id || autor = @request.auth.id || cliente.user_id = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || autor = @request.auth.id)",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'cliente_empresa_id',
          type: 'text',
          required: false,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'prazo',
          type: 'date',
          required: false,
        },
        {
          name: 'responsavel',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        {
          name: 'autor',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'concluida_em',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_tarefas_cliente ON crm_tarefas (cliente)',
        'CREATE INDEX idx_crm_tarefas_empresa_id ON crm_tarefas (cliente_empresa_id)',
        'CREATE INDEX idx_crm_tarefas_responsavel ON crm_tarefas (responsavel)',
        'CREATE INDEX idx_crm_tarefas_status ON crm_tarefas (status)',
        'CREATE INDEX idx_crm_tarefas_prazo ON crm_tarefas (prazo)',
        'CREATE INDEX idx_crm_tarefas_created ON crm_tarefas (created DESC)',
      ],
    })
    app.save(crmTarefas)
  },
  (app) => {
    try {
      const crmTarefas = app.findCollectionByNameOrId('crm_tarefas')
      app.delete(crmTarefas)
    } catch (_) {}

    try {
      const crmAnotacoes = app.findCollectionByNameOrId('crm_anotacoes')
      app.delete(crmAnotacoes)
    } catch (_) {}

    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      if (clientesCol.fields.getByName('estagio_funil')) {
        clientesCol.fields.removeByName('estagio_funil')
      }
      if (clientesCol.fields.getByName('origem_lead')) {
        clientesCol.fields.removeByName('origem_lead')
      }
      if (clientesCol.fields.getByName('funil_atualizado_em')) {
        clientesCol.fields.removeByName('funil_atualizado_em')
      }
      if (clientesCol.fields.getByName('funil_atualizado_por')) {
        clientesCol.fields.removeByName('funil_atualizado_por')
      }
      app.save(clientesCol)
    } catch (_) {}

    try {
      const ceCol = app.findCollectionByNameOrId('clientes_empresas')
      if (ceCol.fields.getByName('estagio_funil')) {
        ceCol.fields.removeByName('estagio_funil')
      }
      if (ceCol.fields.getByName('origem_lead')) {
        ceCol.fields.removeByName('origem_lead')
      }
      if (ceCol.fields.getByName('funil_atualizado_em')) {
        ceCol.fields.removeByName('funil_atualizado_em')
      }
      if (ceCol.fields.getByName('funil_atualizado_por')) {
        ceCol.fields.removeByName('funil_atualizado_por')
      }
      app.save(ceCol)
    } catch (_) {}
  },
)
