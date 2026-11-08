migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')

      if (!col.fields.getByName('faturamento_estimado')) {
        col.fields.add(
          new NumberField({
            name: 'faturamento_estimado',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('faturamento')) {
        col.fields.add(
          new NumberField({
            name: 'faturamento',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campos de faturamento em leads:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')
      const fields = ['faturamento_estimado', 'faturamento']
      fields.forEach((f) => {
        if (col.fields.getByName(f)) {
          col.fields.removeByName(f)
        }
      })
      app.save(col)
    } catch (_) {}
  },
)
