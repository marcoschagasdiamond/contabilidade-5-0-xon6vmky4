migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')

      if (!col.fields.getByName('tipo_solicitacao')) {
        col.fields.add(
          new TextField({
            name: 'tipo_solicitacao',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campo tipo_solicitacao na coleção leads:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')
      if (col.fields.getByName('tipo_solicitacao')) {
        col.fields.removeByName('tipo_solicitacao')
      }
      app.save(col)
    } catch (_) {}
  },
)
