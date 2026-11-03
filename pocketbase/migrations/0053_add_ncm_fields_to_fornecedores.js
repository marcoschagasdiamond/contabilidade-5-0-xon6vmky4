migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('fornecedores_diagnostico')

    if (!col.fields.getByName('ncm')) {
      col.fields.add(
        new TextField({
          name: 'ncm',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('ncm_classificado_auto')) {
      col.fields.add(
        new BoolField({
          name: 'ncm_classificado_auto',
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('fornecedores_diagnostico')

    if (col.fields.getByName('ncm')) {
      col.fields.removeByName('ncm')
    }

    if (col.fields.getByName('ncm_classificado_auto')) {
      col.fields.removeByName('ncm_classificado_auto')
    }

    app.save(col)
  },
)
