migrate(
  (app) => {
    const novosSegmentos = [
      'Comércio',
      'Serviços',
      'Indústria',
      'Saúde',
      'Educação',
      'Agro',
      'Transporte',
      'Tecnologia',
      'Construção Civil',
      'Bares e Restaurantes',
    ]

    // 1. Atualizar coleção 'diagnosticos'
    try {
      const colDiag = app.findCollectionByNameOrId('diagnosticos')
      const segFieldDiag = colDiag.fields.getByName('segmento')
      if (segFieldDiag) {
        segFieldDiag.values = novosSegmentos
        segFieldDiag.maxSelect = 1
        app.save(colDiag)
      }
    } catch (e) {
      console.log('Erro ao atualizar segmento em diagnosticos:', e)
    }

    // 2. Atualizar coleção 'leads'
    try {
      const colLeads = app.findCollectionByNameOrId('leads')
      const segFieldLeads = colLeads.fields.getByName('segmento')
      if (segFieldLeads) {
        segFieldLeads.values = novosSegmentos
        segFieldLeads.maxSelect = 1
        app.save(colLeads)
      }
    } catch (e) {
      console.log('Erro ao atualizar segmento em leads:', e)
    }
  },
  (app) => {
    // Reverter coleções para valores anteriores se necessário
    try {
      const colDiag = app.findCollectionByNameOrId('diagnosticos')
      const segFieldDiag = colDiag.fields.getByName('segmento')
      if (segFieldDiag) {
        segFieldDiag.values = ['Comércio', 'Indústria', 'Serviços']
        app.save(colDiag)
      }
    } catch (_) {}

    try {
      const colLeads = app.findCollectionByNameOrId('leads')
      const segFieldLeads = colLeads.fields.getByName('segmento')
      if (segFieldLeads) {
        segFieldLeads.values = [
          'Tecnologia',
          'Varejo',
          'Indústria',
          'Serviços',
          'Agronegócio',
          'Sociedade de Profissionais',
          'Outros',
        ]
        app.save(colLeads)
      }
    } catch (_) {}
  },
)
