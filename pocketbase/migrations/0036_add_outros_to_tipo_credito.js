migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('anuncios_creditos')
      const field = col.fields.getByName('tipo_credito')
      if (field) {
        field.values = [
          'Precatório Federal',
          'Precatório Estadual',
          'Precatório Municipal',
          'RPV',
          'Crédito de IBS/CBS',
          'Crédito de PIS/Cofins',
          'Crédito de ICMS de incentivos',
          'Crédito judicial contra o Fisco',
          'Dívida ativa securitizada',
          'Outros',
        ]
        field.maxSelect = 1
        app.save(col)
      }
    } catch (e) {
      console.log('Erro ao atualizar tipo_credito em anuncios_creditos:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('anuncios_creditos')
      const field = col.fields.getByName('tipo_credito')
      if (field) {
        field.values = [
          'Precatório Federal',
          'Precatório Estadual',
          'Precatório Municipal',
          'RPV',
          'Crédito de IBS/CBS',
          'Crédito de PIS/Cofins',
          'Crédito de ICMS de incentivos',
          'Crédito judicial contra o Fisco',
          'Dívida ativa securitizada',
        ]
        app.save(col)
      }
    } catch (_) {}
  },
)
