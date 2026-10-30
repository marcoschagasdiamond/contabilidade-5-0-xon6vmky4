migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Coleção crm_metas_analistas
    // Regras:
    // Analista: lê/cria/atualiza/exclui apenas onde analista_id = @request.auth.id
    // Master/Admin: leem todas as metas (e podem editar/criar se necessário)
    // Empresário: sem acesso
    const crmMetas = new Collection({
      name: 'crm_metas_analistas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_id = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_id = @request.auth.id)",
      updateRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_id = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && @request.auth.nivel_acesso != 'empresario' && @request.auth.perfil != 'empresario' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || analista_id = @request.auth.id)",
      fields: [
        {
          name: 'analista_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'mes_ano',
          type: 'text', // Formato YYYY-MM (ex: '2025-05')
          required: true,
        },
        {
          name: 'meta_novos_clientes',
          type: 'number',
          required: false,
        },
        {
          name: 'meta_receita_carteira',
          type: 'number',
          required: false,
        },
        {
          name: 'meta_creditos_recuperados',
          type: 'number',
          required: false,
        },
        {
          name: 'meta_diagnosticos_concluidos',
          type: 'number',
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
      indexes: [
        'CREATE UNIQUE INDEX idx_crm_metas_analista_mes ON crm_metas_analistas (analista_id, mes_ano)',
        'CREATE INDEX idx_crm_metas_mes ON crm_metas_analistas (mes_ano)',
        'CREATE INDEX idx_crm_metas_created ON crm_metas_analistas (created DESC)',
      ],
    })
    app.save(crmMetas)
  },
  (app) => {
    try {
      const crmMetas = app.findCollectionByNameOrId('crm_metas_analistas')
      app.delete(crmMetas)
    } catch (_) {}
  },
)
