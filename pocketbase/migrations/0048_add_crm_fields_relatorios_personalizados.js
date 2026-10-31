migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios_personalizados')
    if (!col) return

    let mudou = false

    if (!col.fields.getByName('crm_cliente_id')) {
      col.fields.add(
        new Field({
          name: 'crm_cliente_id',
          type: 'text',
          required: false,
        }),
      )
      mudou = true
    }

    if (!col.fields.getByName('canal_envio')) {
      col.fields.add(
        new Field({
          name: 'canal_envio',
          type: 'text',
          required: false,
        }),
      )
      mudou = true
    }

    if (!col.fields.getByName('enviado_para')) {
      col.fields.add(
        new Field({
          name: 'enviado_para',
          type: 'text',
          required: false,
        }),
      )
      mudou = true
    }

    if (!col.fields.getByName('data_envio')) {
      col.fields.add(
        new Field({
          name: 'data_envio',
          type: 'date',
          required: false,
        }),
      )
      mudou = true
    }

    if (mudou) {
      col.indexes.push(
        'CREATE INDEX idx_relat_pers_crm_cli ON relatorios_personalizados (crm_cliente_id)',
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('relatorios_personalizados')
      if (!col) return
      col.fields.removeByName('crm_cliente_id')
      col.fields.removeByName('canal_envio')
      col.fields.removeByName('enviado_para')
      col.fields.removeByName('data_envio')
      app.save(col)
    } catch (_) {}
  },
)
