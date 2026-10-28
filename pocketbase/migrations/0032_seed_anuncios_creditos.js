migrate(
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const anunciosCol = app.findCollectionByNameOrId('anuncios_creditos')

      // Verificar se já existe algum anúncio
      const total = app.countRecords('anuncios_creditos')
      if (total > 0) return

      let adminUser
      try {
        adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'marcoschagasdiamond@icloud.com')
      } catch (_) {
        const users = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 1, 0)
        if (users.length > 0) adminUser = users[0]
      }

      if (!adminUser) return

      // Anúncio 1: Venda - Precatório Federal
      const rec1 = new Record(anunciosCol)
      rec1.set('user_id', adminUser.id)
      rec1.set('operacao', 'venda')
      rec1.set('tipo_credito', 'Precatório Federal')
      rec1.set('esfera', 'federal')
      rec1.set('uf', 'DF')
      rec1.set('municipio', 'Brasília')
      rec1.set('valor_nominal', 1850000)
      rec1.set('desagio_percentual', 28)
      rec1.set('situacao', 'expedido')
      rec1.set(
        'observacoes',
        'Precatório federal alimentar expedido pelo TRF1, certidão de trânsito em julgado e liquidação orçamentária para 2026.',
      )
      rec1.set('status', 'ativo')
      rec1.set('contato_nome', 'Dr. Marco Chagas — Custódia Diamond')
      rec1.set('contato_documento', '12.345.678/0001-90')
      rec1.set('contato_email', 'marcoschagasdiamond@icloud.com')
      rec1.set('contato_telefone', '(11) 98765-4321')
      app.save(rec1)

      // Anúncio 2: Venda - Crédito de ICMS de incentivos
      const rec2 = new Record(anunciosCol)
      rec2.set('user_id', adminUser.id)
      rec2.set('operacao', 'venda')
      rec2.set('tipo_credito', 'Crédito de ICMS de incentivos')
      rec2.set('esfera', 'estadual')
      rec2.set('uf', 'SP')
      rec2.set('municipio', 'São Paulo')
      rec2.set('valor_nominal', 3200000)
      rec2.set('desagio_percentual', 22)
      rec2.set('situacao', 'reconhecido_judicialmente')
      rec2.set(
        'observacoes',
        'Saldo credor acumulado de ICMS homologado pela SEFAZ/SP com parecer técnico e pronto para transferência nos termos do RICMS.',
      )
      rec2.set('status', 'ativo')
      rec2.set('contato_nome', 'Indústria Paulista de Alimentos')
      rec2.set('contato_documento', '98.765.432/0001-11')
      rec2.set('contato_email', 'diretoria.fiscal@exemplo.com.br')
      rec2.set('contato_telefone', '(11) 3456-7890')
      app.save(rec2)

      // Anúncio 3: Compra - Compensação de débitos tributários
      const rec3 = new Record(anunciosCol)
      rec3.set('user_id', adminUser.id)
      rec3.set('operacao', 'compra')
      rec3.set('esfera', 'federal')
      rec3.set('uf', 'BR')
      rec3.set('valor_nominal', 5000000)
      rec3.set('desagio_percentual', 32)
      rec3.set('finalidade', 'compensar_debitos')
      rec3.set(
        'observacoes',
        'Grupo empresarial com passivo tributário federal consolidado em PGFN busca precatórios federais e créditos líquidos para liquidação.',
      )
      rec3.set('status', 'ativo')
      rec3.set('contato_nome', 'Holdings Brasil S/A')
      rec3.set('contato_documento', '45.123.789/0001-55')
      rec3.set('contato_email', 'tributario@holdingsbrasil.com.br')
      rec3.set('contato_telefone', '(11) 4002-8922')
      app.save(rec3)
    } catch (err) {
      console.log('Erro ao seedar anúncios:', err)
    }
  },
  (app) => {
    // Reversão
  },
)
