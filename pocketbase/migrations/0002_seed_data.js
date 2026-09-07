migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Seed admin user
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'marcoschagasdiamond@icloud.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('marcoschagasdiamond@icloud.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Dr. Marcos Chagas')
      app.save(admin)
    }

    // 2. Seed initial leads for the admin dashboard demo
    try {
      const leadsCol = app.findCollectionByNameOrId('leads')
      const existing = app.findRecordsByFilter('leads', "email != ''", '-created', 1, 0)
      if (existing.length === 0) {
        const sampleLeads = [
          {
            nome: 'Lucas Silveira',
            email: 'lucas@fintechcloud.com.br',
            telefone: '+55 (11) 98765-4321',
            empresa: 'Fintech Cloud Brasil',
            segmento: 'Tecnologia',
            funcionarios: '21–50',
            mensagem:
              'Precisamos de assessoria para migração de regime tributário para o Lucro Real e conformidade com SPED.',
          },
          {
            nome: 'Renata Vasconcelos',
            email: 'renata@boutiquemoda.com.br',
            telefone: '+55 (21) 97654-3210',
            empresa: 'Boutique Moda & Estilo',
            segmento: 'Varejo',
            funcionarios: '6–20',
            mensagem:
              'Gostaria de terceirizar a folha de pagamento e apuração do Simples Nacional.',
          },
          {
            nome: 'Eduardo Fonseca',
            email: 'eduardo@agroinova.agr.br',
            telefone: '+55 (19) 99123-4567',
            empresa: 'AgroInova Soluções Rurais',
            segmento: 'Agronegócio',
            funcionarios: '51–200',
            mensagem:
              'Buscamos consultoria tributária especializada em créditos de ICMS e PIS/COFINS para o agronegócio.',
          },
        ]

        for (const item of sampleLeads) {
          const rec = new Record(leadsCol)
          rec.set('nome', item.nome)
          rec.set('email', item.email)
          rec.set('telefone', item.telefone)
          rec.set('empresa', item.empresa)
          rec.set('segmento', item.segmento)
          rec.set('funcionarios', item.funcionarios)
          rec.set('mensagem', item.mensagem)
          app.save(rec)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcoschagasdiamond@icloud.com')
      app.delete(user)
    } catch (_) {}
  },
)
