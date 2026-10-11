migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')

      if (!col.fields.getByName('cnpj')) {
        col.fields.add(
          new TextField({
            name: 'cnpj',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campo cnpj na coleção leads:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')
      if (col.fields.getByName('cnpj')) {
        col.fields.removeByName('cnpj')
      }
      app.save(col)
    } catch (_) {}
  },
)
