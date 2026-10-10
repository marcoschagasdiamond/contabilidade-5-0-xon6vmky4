migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')

      if (!col.fields.getByName('folha_pagamento')) {
        col.fields.add(
          new NumberField({
            name: 'folha_pagamento',
            required: false,
            min: 0,
          }),
        )
      }

      if (!col.fields.getByName('despesas_creditos')) {
        col.fields.add(
          new NumberField({
            name: 'despesas_creditos',
            required: false,
            min: 0,
          }),
        )
      }

      if (!col.fields.getByName('percentual_exportacao')) {
        col.fields.add(
          new NumberField({
            name: 'percentual_exportacao',
            required: false,
            min: 0,
            max: 100,
          }),
        )
      }

      if (!col.fields.getByName('uf_origem')) {
        col.fields.add(
          new TextField({
            name: 'uf_origem',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('aliquota_icms')) {
        col.fields.add(
          new NumberField({
            name: 'aliquota_icms',
            required: false,
            min: 0,
          }),
        )
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao adicionar novos campos em diagnosticos (migração 0009):', e)
      throw e
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('diagnosticos')
      const fieldsToRemove = [
        'folha_pagamento',
        'despesas_creditos',
        'percentual_exportacao',
        'uf_origem',
        'aliquota_icms',
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
