migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Campo nivel_acesso (master | admin | analista | empresario)
    if (!usersCol.fields.getByName('nivel_acesso')) {
      usersCol.fields.add(
        new SelectField({
          name: 'nivel_acesso',
          required: false,
          values: ['master', 'admin', 'analista', 'empresario'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Campo permissoes_json (json)
    if (!usersCol.fields.getByName('permissoes_json')) {
      usersCol.fields.add(
        new JSONField({
          name: 'permissoes_json',
          required: false,
        }),
      )
    }

    // 3. Campo criado_por (relation users)
    if (!usersCol.fields.getByName('criado_por')) {
      usersCol.fields.add(
        new RelationField({
          name: 'criado_por',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Atualiza regras de users para garantir segurança
    usersCol.updateRule =
      '(@request.auth.nivel_acesso = "master" || @request.auth.role = "admin" || @request.auth.email = "marcoschagasdiamond@icloud.com") || (id = @request.auth.id && @request.body.nivel_acesso:changed = false && @request.body.permissoes_json:changed = false && @request.body.criado_por:changed = false && @request.body.role:changed = false && @request.body.plano:changed = false && @request.body.is_premium:changed = false)'
    app.save(usersCol)

    // 4. Promover Dr. Marco Chagas a master com permissões totais
    const masterEmail = 'marcoschagasdiamond@icloud.com'
    try {
      const marco = app.findAuthRecordByEmail('_pb_users_auth_', masterEmail)
      marco.set('nivel_acesso', 'master')
      marco.set('role', 'admin')
      marco.set('permissoes_json', [
        'ver_clientes_globais',
        'excluir_diagnosticos',
        'gerenciar_usuarios',
        'gerenciar_admins',
      ])
      app.save(marco)
    } catch (_) {}

    // Backfill no banco para atribuir nivel_acesso inicial para usuários legados
    try {
      app
        .db()
        .newQuery(`
        UPDATE users
        SET nivel_acesso = 'master'
        WHERE email = 'marcoschagasdiamond@icloud.com';

        UPDATE users
        SET nivel_acesso = CASE
          WHEN role = 'admin' THEN 'admin'
          WHEN perfil = 'empresario' THEN 'empresario'
          ELSE 'analista'
        END
        WHERE (nivel_acesso IS NULL OR nivel_acesso = '') AND email != 'marcoschagasdiamond@icloud.com';
      `)
        .execute()
    } catch (e) {
      console.log('Erro no backfill nivel_acesso:', e)
    }

    // 5. Ajustar regras de acesso da coleção 'clientes'
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      clientesCol.listRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      clientesCol.viewRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      clientesCol.updateRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      clientesCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id)"
      app.save(clientesCol)
    } catch (e) {
      console.log('Erro ao atualizar regras clientes:', e)
    }

    // 6. Ajustar regras de acesso da coleção 'diagnosticos'
    try {
      const diagCol = app.findCollectionByNameOrId('diagnosticos')
      diagCol.listRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      diagCol.viewRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      diagCol.updateRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"
      diagCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id)"
      app.save(diagCol)
    } catch (e) {
      console.log('Erro ao atualizar regras diagnosticos:', e)
    }

    // 7. Ajustar regras de acesso da coleção 'simulacoes_calculadora'
    try {
      const simCol = app.findCollectionByNameOrId('simulacoes_calculadora')
      simCol.listRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      simCol.viewRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      simCol.updateRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      simCol.deleteRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      app.save(simCol)
    } catch (e) {
      console.log('Erro ao atualizar regras simulacoes_calculadora:', e)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('nivel_acesso')) {
        usersCol.fields.removeByName('nivel_acesso')
      }
      if (usersCol.fields.getByName('permissoes_json')) {
        usersCol.fields.removeByName('permissoes_json')
      }
      if (usersCol.fields.getByName('criado_por')) {
        usersCol.fields.removeByName('criado_por')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
