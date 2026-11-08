migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')

      if (!col.fields.getByName('estagio_pipeline')) {
        col.fields.add(
          new TextField({
            name: 'estagio_pipeline',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('score')) {
        col.fields.add(
          new NumberField({
            name: 'score',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('interacoes_json')) {
        col.fields.add(
          new JSONField({
            name: 'interacoes_json',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('ultima_interacao')) {
        col.fields.add(
          new DateField({
            name: 'ultima_interacao',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('fonte')) {
        col.fields.add(
          new TextField({
            name: 'fonte',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campos de pipeline no leads:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads')
      const fields = ['estagio_pipeline', 'score', 'interacoes_json', 'ultima_interacao', 'fonte']
      fields.forEach((f) => {
        if (col.fields.getByName(f)) {
          col.fields.removeByName(f)
        }
      })
      app.save(col)
    } catch (_) {}
  },
)
