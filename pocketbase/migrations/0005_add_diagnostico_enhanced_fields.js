migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')

      // Adicionar campos extras na coleção diagnosticos se não existirem
      if (!col.fields.getByName('funcionarios')) {
        col.fields.add(
          new TextField({
            name: 'funcionarios',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('emissao_nf')) {
        col.fields.add(
          new TextField({
            name: 'emissao_nf',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('atividade_mista')) {
        col.fields.add(
          new BoolField({
            name: 'atividade_mista',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('regime_atual')) {
        col.fields.add(
          new TextField({
            name: 'regime_atual',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('ranking_json')) {
        col.fields.add(
          new JSONField({
            name: 'ranking_json',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar campos na coleção diagnosticos:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      const removeFields = [
        'funcionarios',
        'emissao_nf',
        'atividade_mista',
        'regime_atual',
        'ranking_json',
      ]
      for (const fieldName of removeFields) {
        const f = col.fields.getByName(fieldName)
        if (f) {
          col.fields.removeByName(fieldName)
        }
      }
      app.save(col)
    } catch (_) {}
  },
)
