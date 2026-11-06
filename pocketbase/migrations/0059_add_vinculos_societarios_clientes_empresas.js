/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Vínculos Societários & Risco de Regime (LC 123/2006, art. 3º §4º)
    if (!collection.fields.getByName('vinculos_societarios')) {
      collection.fields.add(
        new JSONField({
          name: 'vinculos_societarios',
          maxSize: 30000,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (collection.fields.getByName('vinculos_societarios')) {
      collection.fields.removeByName('vinculos_societarios')
    }
    app.save(collection)
  },
)
