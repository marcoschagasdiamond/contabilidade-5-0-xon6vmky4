migrate(
  (app) => {
    // Regra global de list/view para master e admin, ou dono do registro (user_id)
    const ruleMasterAdminOuDono =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id || user_id = '' || user_id = null)"

    const ruleMasterAdminOuDonoMutacao =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com' || user_id = @request.auth.id)"

    // 1. clientes_empresas
    try {
      const col = app.findCollectionByNameOrId('clientes_empresas')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      col.updateRule = ruleMasterAdminOuDono
      col.deleteRule = ruleMasterAdminOuDonoMutacao
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras clientes_empresas:', e)
    }

    // 2. simulacoes_calculadora
    try {
      const col = app.findCollectionByNameOrId('simulacoes_calculadora')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      col.updateRule = ruleMasterAdminOuDonoMutacao
      col.deleteRule = ruleMasterAdminOuDonoMutacao
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras simulacoes_calculadora:', e)
    }

    // 3. simulacoes_recuperador
    try {
      const col = app.findCollectionByNameOrId('simulacoes_recuperador')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      col.updateRule = ruleMasterAdminOuDonoMutacao
      col.deleteRule = ruleMasterAdminOuDonoMutacao
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras simulacoes_recuperador:', e)
    }

    // 4. diagnosticos
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      col.updateRule = ruleMasterAdminOuDono
      col.deleteRule = ruleMasterAdminOuDonoMutacao
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras diagnosticos:', e)
    }

    // 5. historico_simulacoes (imutável: update e delete null)
    try {
      const col = app.findCollectionByNameOrId('historico_simulacoes')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras historico_simulacoes:', e)
    }

    // 6. historico_dados_empresa (imutável: update e delete null)
    try {
      const col = app.findCollectionByNameOrId('historico_dados_empresa')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras historico_dados_empresa:', e)
    }

    // 7. historico_relatorios_diagnostico
    try {
      const col = app.findCollectionByNameOrId('historico_relatorios_diagnostico')
      col.listRule = ruleMasterAdminOuDono
      col.viewRule = ruleMasterAdminOuDono
      col.updateRule = ruleMasterAdminOuDonoMutacao
      col.deleteRule = ruleMasterAdminOuDonoMutacao
      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar regras historico_relatorios_diagnostico:', e)
    }
  },
  (app) => {
    // Reversão
  },
)
