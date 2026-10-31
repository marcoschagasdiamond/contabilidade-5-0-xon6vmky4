migrate(
  (app) => {
    // 1. Atualizar regras da coleção simulacoes_calculadora
    try {
      const calcCol = app.findCollectionByNameOrId('simulacoes_calculadora')
      const rule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')"
      calcCol.listRule = rule
      calcCol.viewRule = rule
      app.save(calcCol)
    } catch (e) {
      console.log('Erro ao atualizar regras simulacoes_calculadora:', e)
    }

    // 2. Atualizar regras da coleção simulacoes_recuperador
    try {
      const recupCol = app.findCollectionByNameOrId('simulacoes_recuperador')
      const rule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || @request.auth.nivel_acesso = 'analista' || @request.auth.perfil = 'contador')"
      recupCol.listRule = rule
      recupCol.viewRule = rule
      recupCol.updateRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      recupCol.deleteRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')"
      app.save(recupCol)
    } catch (e) {
      console.log('Erro ao atualizar regras simulacoes_recuperador:', e)
    }
  },
  (app) => {
    // Reverter regras básicas se necessário
    try {
      const calcCol = app.findCollectionByNameOrId('simulacoes_calculadora')
      calcCol.listRule =
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin')"
      calcCol.viewRule = calcCol.listRule
      app.save(calcCol)
    } catch (_) {}
  },
)
