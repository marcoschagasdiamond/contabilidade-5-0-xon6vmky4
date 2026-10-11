migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'role' (admin | user) na coleção users se não existir
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['admin', 'user'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Garantir que auto-update de usuários normais não altere o campo 'role' arbitrariamente
    usersCol.updateRule = 'id = @request.auth.id && @request.body.role:changed = false'
    app.save(usersCol)

    // 3. Criar ou atualizar o usuário admin com e-mail e senha requeridos
    const adminEmail = 'marcoschagasdiamond@icloud.com'
    const adminPassword = 'M@c318180'

    try {
      const existingUser = app.findAuthRecordByEmail('_pb_users_auth_', adminEmail)
      existingUser.setPassword(adminPassword)
      existingUser.setVerified(true)
      existingUser.set('role', 'admin')
      if (!existingUser.getString('name')) {
        existingUser.set('name', 'Dr. Marcos Chagas')
      }
      app.save(existingUser)
    } catch (_) {
      const newUser = new Record(usersCol)
      newUser.setEmail(adminEmail)
      newUser.setPassword(adminPassword)
      newUser.setVerified(true)
      newUser.set('name', 'Dr. Marcos Chagas')
      newUser.set('role', 'admin')
      app.save(newUser)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.updateRule = 'id = @request.auth.id'
      if (usersCol.fields.getByName('role')) {
        usersCol.fields.removeByName('role')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
