migrate(
  (app) => {
    // Atualizar deleteRule da coleção users para que master e admins autorizados possam deletar usuários
    // Mas NUNCA o master (marcoschagasdiamond@icloud.com ou nivel_acesso = 'master')
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.deleteRule =
        "email != 'marcoschagasdiamond@icloud.com' && nivel_acesso != 'master' && (" +
        'id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com' || " +
        "(@request.auth.nivel_acesso = 'admin' && nivel_acesso != 'admin' && nivel_acesso != 'master')" +
        ')'
      app.save(usersCol)
    } catch (e) {
      console.log('Erro ao atualizar deleteRule de users:', e)
    }

    // Atualizar regras de clientes_empresas para que admin/master possam deletar e atualizar
    try {
      const ceCol = app.findCollectionByNameOrId('clientes_empresas')
      ceCol.updateRule =
        "@request.auth.id != '' && (" +
        'user_id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.nivel_acesso = 'admin' || " +
        "@request.auth.role = 'admin' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com'" +
        ')'
      ceCol.deleteRule =
        "@request.auth.id != '' && (" +
        'user_id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.nivel_acesso = 'admin' || " +
        "@request.auth.role = 'admin' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com'" +
        ')'
      app.save(ceCol)
    } catch (e) {
      console.log('Erro ao atualizar regras clientes_empresas:', e)
    }

    // Garantir que convites_clientes possam ser atualizados/deletados por admin/master
    try {
      const convCol = app.findCollectionByNameOrId('convites_clientes')
      convCol.listRule =
        "@request.auth.id != '' && (" +
        'analista_id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.nivel_acesso = 'admin' || " +
        "@request.auth.role = 'admin' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com'" +
        ')'
      convCol.updateRule =
        "@request.auth.id != '' && (" +
        'analista_id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.nivel_acesso = 'admin' || " +
        "@request.auth.role = 'admin' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com'" +
        ')'
      convCol.deleteRule =
        "@request.auth.id != '' && (" +
        'analista_id = @request.auth.id || ' +
        "@request.auth.nivel_acesso = 'master' || " +
        "@request.auth.nivel_acesso = 'admin' || " +
        "@request.auth.role = 'admin' || " +
        "@request.auth.email = 'marcoschagasdiamond@icloud.com'" +
        ')'
      app.save(convCol)
    } catch (e) {
      console.log('Erro ao atualizar regras convites_clientes:', e)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.deleteRule = 'id = @request.auth.id'
      app.save(usersCol)
    } catch (_) {}
  },
)
