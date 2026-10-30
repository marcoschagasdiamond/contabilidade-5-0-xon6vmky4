migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Coleção onboarding_progresso
    // Armazena o estado do onboarding guiado dos 3 passos para o usuário (perfil Empresário/Cliente):
    // 1. passo_empresa_concluido (bool)
    // 2. passo_diagnostico_concluido (bool)
    // 3. passo_calculadora_concluido (bool)
    // - wizard_dispensado (bool): caso o usuário tenha clicado em "Pular por enquanto" / dispensar o modal inicial
    // - checklist_recolhido (bool): controle de colapso visual do card no painel
    // - concluido_em (date): data em que os 3 passos foram finalizados
    const onboarding = new Collection({
      name: 'onboarding_progresso',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'passo_empresa_concluido',
          type: 'bool',
          required: false,
        },
        {
          name: 'passo_diagnostico_concluido',
          type: 'bool',
          required: false,
        },
        {
          name: 'passo_calculadora_concluido',
          type: 'bool',
          required: false,
        },
        {
          name: 'wizard_dispensado',
          type: 'bool',
          required: false,
        },
        {
          name: 'checklist_recolhido',
          type: 'bool',
          required: false,
        },
        {
          name: 'concluido_em',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_onboarding_user ON onboarding_progresso (user_id)',
        'CREATE INDEX idx_onboarding_created ON onboarding_progresso (created DESC)',
      ],
    })

    app.save(onboarding)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('onboarding_progresso')
      app.delete(col)
    } catch (_) {}
  },
)
