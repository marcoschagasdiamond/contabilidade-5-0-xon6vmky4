/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Documento fiscal importado (referência de auditoria e metadados)
    collection.fields.add(
      new JSONField({
        name: 'documento_fiscal_importado',
        maxSize: 10000,
      }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    collection.fields.removeByName('documento_fiscal_importado')
    app.save(collection)
  },
)
