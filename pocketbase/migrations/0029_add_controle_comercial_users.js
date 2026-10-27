migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. valor_mensal_personalizado (number)
    if (!usersCol.fields.getByName('valor_mensal_personalizado')) {
      usersCol.fields.add(
        new NumberField({
          name: 'valor_mensal_personalizado',
          required: false,
          min: 0,
        }),
      )
    }

    // 2. status_operacao (select: 'autorizado' | 'suspenso')
    if (!usersCol.fields.getByName('status_operacao')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status_operacao',
          required: false,
          values: ['autorizado', 'suspenso'],
          maxSelect: 1,
        }),
      )
    }

    // 3. autorizado_por (relation -> users)
    if (!usersCol.fields.getByName('autorizado_por')) {
      usersCol.fields.add(
        new RelationField({
          name: 'autorizado_por',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // 4. autorizado_em (date)
    if (!usersCol.fields.getByName('autorizado_em')) {
      usersCol.fields.add(
        new DateField({
          name: 'autorizado_em',
          required: false,
        }),
      )
    }

    // 5. Campo nivel_convite e whatsapp em convites_clientes se necessário
    try {
      const convCol = app.findCollectionByNameOrId('convites_clientes')
      if (!convCol.fields.getByName('nivel_convite')) {
        convCol.fields.add(
          new SelectField({
            name: 'nivel_convite',
            required: false,
            values: ['admin', 'analista', 'empresario'],
            maxSelect: 1,
          }),
        )
      }
      if (!convCol.fields.getByName('whatsapp')) {
        convCol.fields.add(
          new TextField({
            name: 'whatsapp',
            required: false,
          }),
        )
      }
      app.save(convCol)
    } catch (e) {
      console.log('Erro ao atualizar campos de convites_clientes:', e)
    }

    // 6. Atualizar updateRule de users para garantir segurança:
    // Usuários normais não podem alterar campos de controle comercial nem status_operacao
    usersCol.updateRule =
      '(@request.auth.nivel_acesso = "master" || @request.auth.role = "admin" || @request.auth.email = "marcoschagasdiamond@icloud.com") || ' +
      '(id = @request.auth.id && @request.body.nivel_acesso:changed = false && @request.body.permissoes_json:changed = false && ' +
      '@request.body.criado_por:changed = false && @request.body.role:changed = false && @request.body.plano:changed = false && ' +
      '@request.body.is_premium:changed = false && @request.body.valor_mensal_personalizado:changed = false && ' +
      '@request.body.status_operacao:changed = false && @request.body.autorizado_por:changed = false && @request.body.autorizado_em:changed = false)'

    app.save(usersCol)

    // Backfill inicial: definir status_operacao padrão como 'autorizado' para analistas existentes
    try {
      app
        .db()
        .newQuery(`
        UPDATE users
        SET status_operacao = 'autorizado'
        WHERE (status_operacao IS NULL OR status_operacao = '') AND (nivel_acesso = 'analista' OR perfil = 'contador');
      `)
        .execute()
    } catch (e) {
      console.log('Erro no backfill status_operacao:', e)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('valor_mensal_personalizado')) {
        usersCol.fields.removeByName('valor_mensal_personalizado')
      }
      if (usersCol.fields.getByName('status_operacao')) {
        usersCol.fields.removeByName('status_operacao')
      }
      if (usersCol.fields.getByName('autorizado_por')) {
        usersCol.fields.removeByName('autorizado_por')
      }
      if (usersCol.fields.getByName('autorizado_em')) {
        usersCol.fields.removeByName('autorizado_em')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
