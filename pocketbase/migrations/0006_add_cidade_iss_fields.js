migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')

      if (!col.fields.getByName('cidade')) {
        col.fields.add(
          new TextField({
            name: 'cidade',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('aliquota_iss')) {
        col.fields.add(
          new NumberField({
            name: 'aliquota_iss',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campos cidade/aliquota_iss na coleção diagnosticos:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      if (col.fields.getByName('cidade')) {
        col.fields.removeByName('cidade')
      }
      if (col.fields.getByName('aliquota_iss')) {
        col.fields.removeByName('aliquota_iss')
      }
      app.save(col)
    } catch (_) {}
  },
)
