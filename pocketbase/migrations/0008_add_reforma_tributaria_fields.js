migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')

      if (!col.fields.getByName('ano_base')) {
        col.fields.add(
          new NumberField({
            name: 'ano_base',
            required: false,
            min: 2026,
            max: 2035,
            onlyInt: true,
          }),
        )
      }

      if (!col.fields.getByName('sistema_recomendado_atual')) {
        col.fields.add(
          new TextField({
            name: 'sistema_recomendado_atual',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('sistema_recomendado_novo')) {
        col.fields.add(
          new TextField({
            name: 'sistema_recomendado_novo',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('carga_simples_novo')) {
        col.fields.add(
          new NumberField({
            name: 'carga_simples_novo',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('carga_presumido_novo')) {
        col.fields.add(
          new NumberField({
            name: 'carga_presumido_novo',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('carga_real_novo')) {
        col.fields.add(
          new NumberField({
            name: 'carga_real_novo',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('economia_anual_novo')) {
        col.fields.add(
          new NumberField({
            name: 'economia_anual_novo',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('detalhes_reforma_json')) {
        col.fields.add(
          new JSONField({
            name: 'detalhes_reforma_json',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar campos da reforma tributária em diagnosticos:', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      const fieldsToRemove = [
        'ano_base',
        'sistema_recomendado_atual',
        'sistema_recomendado_novo',
        'carga_simples_novo',
        'carga_presumido_novo',
        'carga_real_novo',
        'economia_anual_novo',
        'detalhes_reforma_json',
      ]
      for (let i = 0; i < fieldsToRemove.length; i++) {
        const f = fieldsToRemove[i]
        if (col.fields.getByName(f)) {
          col.fields.removeByName(f)
        }
      }
      app.save(col)
    } catch (_) {}
  },
)
