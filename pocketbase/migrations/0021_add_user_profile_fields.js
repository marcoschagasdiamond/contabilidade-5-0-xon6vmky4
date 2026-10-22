migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'perfil' (contador | empresario) na coleção users
    if (!usersCol.fields.getByName('perfil')) {
      usersCol.fields.add(
        new SelectField({
          name: 'perfil',
          required: false,
          values: ['contador', 'empresario'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar campo 'cliente_id' (texto ou relação) no user para vínculo direto cliente <-> user na Fase 2
    if (!usersCol.fields.getByName('cliente_id')) {
      usersCol.fields.add(
        new TextField({
          name: 'cliente_id',
          required: false,
        }),
      )
    }

    // Preservar e atualizar regra de update: usuário pode atualizar seus campos próprios
    // mas não pode alterar arbitrariamente role/plano/is_premium.
    // Usuário pode definir seu perfil no cadastro ou edição, mantendo admin com privilégios.
    usersCol.updateRule =
      '(@request.auth.role = "admin" || @request.auth.email = "marcoschagasdiamond@icloud.com") || (id = @request.auth.id && @request.body.role:changed = false && @request.body.plano:changed = false && @request.body.is_premium:changed = false)'

    app.save(usersCol)

    // 3. Garantir que a coleção 'clientes' tenha o campo 'user_id' e index (já possui do 0019, mas validamos)
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      if (!clientesCol.fields.getByName('user_id')) {
        clientesCol.fields.add(
          new RelationField({
            name: 'user_id',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
            required: false,
          }),
        )
        app.save(clientesCol)
      }
    } catch (e) {
      console.log('Erro ao checar user_id em clientes:', e)
    }

    // 4. Migração idempotente de usuários existentes:
    // Qualquer usuário existente com campo perfil vazio/nulo passa para 'contador'
    try {
      app
        .db()
        .newQuery(`
        UPDATE users
        SET perfil = 'contador'
        WHERE perfil IS NULL OR perfil = ''
      `)
        .execute()
    } catch (e) {
      console.log('Erro no backfill de perfil dos usuários existentes:', e)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('perfil')) {
        usersCol.fields.removeByName('perfil')
      }
      if (usersCol.fields.getByName('cliente_id')) {
        usersCol.fields.removeByName('cliente_id')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
