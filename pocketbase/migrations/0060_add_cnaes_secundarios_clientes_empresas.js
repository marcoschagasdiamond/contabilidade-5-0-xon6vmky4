/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Lista de CNAEs Secundários obtidos em consultas públicas
    if (!collection.fields.getByName('cnaes_secundarios')) {
      collection.fields.add(
        new JSONField({
          name: 'cnaes_secundarios',
          maxSize: 30000,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (collection.fields.getByName('cnaes_secundarios')) {
      collection.fields.removeByName('cnaes_secundarios')
    }
    app.save(collection)
  },
)
