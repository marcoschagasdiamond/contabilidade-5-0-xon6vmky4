/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Vedações legais ao Lucro Presumido — Lei 9.718/98 (c/ LC 214/2025)
    if (!collection.fields.getByName('vedacoes_presumido')) {
      collection.fields.add(
        new JSONField({
          name: 'vedacoes_presumido',
          maxSize: 2000,
        }),
      )
    }
    if (!collection.fields.getByName('vedacao_presumido_outra')) {
      collection.fields.add(
        new TextField({
          name: 'vedacao_presumido_outra',
          required: false,
        }),
      )
    }

    // Vedações legais ao MEI — Resolução CGSN 140/2018 (art. 3º)
    if (!collection.fields.getByName('vedacoes_mei')) {
      collection.fields.add(
        new JSONField({
          name: 'vedacoes_mei',
          maxSize: 2000,
        }),
      )
    }
    if (!collection.fields.getByName('vedacao_mei_outra')) {
      collection.fields.add(
        new TextField({
          name: 'vedacao_mei_outra',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (collection.fields.getByName('vedacoes_presumido')) {
      collection.fields.removeByName('vedacoes_presumido')
    }
    if (collection.fields.getByName('vedacao_presumido_outra')) {
      collection.fields.removeByName('vedacao_presumido_outra')
    }
    if (collection.fields.getByName('vedacoes_mei')) {
      collection.fields.removeByName('vedacoes_mei')
    }
    if (collection.fields.getByName('vedacao_mei_outra')) {
      collection.fields.removeByName('vedacao_mei_outra')
    }
    app.save(collection)
  },
)
