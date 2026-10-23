migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')

      if (!col.fields.getByName('configuracoes_diagnostico_json')) {
        col.fields.add(
          new JSONField({
            name: 'configuracoes_diagnostico_json',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log(
        'Erro ao adicionar campo configuracoes_diagnostico_json na coleção diagnosticos:',
        e,
      )
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      if (col.fields.getByName('configuracoes_diagnostico_json')) {
        col.fields.removeByName('configuracoes_diagnostico_json')
        app.save(col)
      }
    } catch (_) {}
  },
)
