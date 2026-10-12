migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('diagnosticos')

    if (!col.fields.getByName('tipo_diagnostico')) {
      col.fields.add(
        new TextField({
          name: 'tipo_diagnostico',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('dados_extra_json')) {
      col.fields.add(
        new JSONField({
          name: 'dados_extra_json',
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('diagnosticos')
    const field1 = col.fields.getByName('tipo_diagnostico')
    if (field1) col.fields.remove(field1)
    const field2 = col.fields.getByName('dados_extra_json')
    if (field2) col.fields.remove(field2)
    app.save(col)
  },
)
