migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'plano' (gratuito | premium)
    if (!usersCol.fields.getByName('plano')) {
      usersCol.fields.add(
        new SelectField({
          name: 'plano',
          required: false,
          values: ['gratuito', 'premium'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar campo 'is_premium' (bool)
    if (!usersCol.fields.getByName('is_premium')) {
      usersCol.fields.add(
        new BoolField({
          name: 'is_premium',
          required: false,
        }),
      )
    }

    // 3. Adicionar campo 'simulacoes_usadas' (number)
    if (!usersCol.fields.getByName('simulacoes_usadas')) {
      usersCol.fields.add(
        new NumberField({
          name: 'simulacoes_usadas',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    // 4. Adicionar campo 'diagnosticos_usados' (number)
    if (!usersCol.fields.getByName('diagnosticos_usados')) {
      usersCol.fields.add(
        new NumberField({
          name: 'diagnosticos_usados',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    // 5. Configurar regras de acesso da coleção users
    // Usuários normais podem atualizar seus próprios dados (nome, avatar, senha, e contadores de uso),
    // mas NÃO podem alterar 'role', 'plano' ou 'is_premium' arbitrariamente.
    // O admin autenticado (role = admin ou email do admin) tem permissão irrestrita para gerenciar planos e contadores.
    usersCol.updateRule =
      '(@request.auth.role = "admin" || @request.auth.email = "marcoschagasdiamond@icloud.com") || (id = @request.auth.id && @request.body.role:changed = false && @request.body.plano:changed = false && @request.body.is_premium:changed = false)'

    // List & View: usuário logado pode listar/ver usuários (admin precisa listar todos os usuários no painel)
    usersCol.listRule = '@request.auth.id != ""'
    usersCol.viewRule = '@request.auth.id != ""'

    app.save(usersCol)

    // Garantir que a conta do admin tenha is_premium = true e plano = 'premium'
    try {
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'marcoschagasdiamond@icloud.com',
      )
      adminUser.set('plano', 'premium')
      adminUser.set('is_premium', true)
      app.save(adminUser)
    } catch (_) {}
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.updateRule = 'id = @request.auth.id && @request.body.role:changed = false'
      if (usersCol.fields.getByName('plano')) usersCol.fields.removeByName('plano')
      if (usersCol.fields.getByName('is_premium')) usersCol.fields.removeByName('is_premium')
      if (usersCol.fields.getByName('simulacoes_usadas'))
        usersCol.fields.removeByName('simulacoes_usadas')
      if (usersCol.fields.getByName('diagnosticos_usados'))
        usersCol.fields.removeByName('diagnosticos_usados')
      app.save(usersCol)
    } catch (_) {}
  },
)
