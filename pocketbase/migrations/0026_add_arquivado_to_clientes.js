migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('clientes')
      if (!col.fields.getByName('arquivado')) {
        col.fields.add(
          new BoolField({
            name: 'arquivado',
            required: false,
          }),
        )
        col.addIndex('idx_clientes_arquivado', false, 'arquivado', '')
        app.save(col)
      }
    } catch (e) {
      console.log('Erro ao adicionar campo arquivado na coleção clientes:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('clientes')
      const campo = col.fields.getByName('arquivado')
      if (campo) {
        col.removeIndex('idx_clientes_arquivado')
        col.fields.removeByName('arquivado')
        app.save(col)
      }
    } catch (_) {}
  },
)
