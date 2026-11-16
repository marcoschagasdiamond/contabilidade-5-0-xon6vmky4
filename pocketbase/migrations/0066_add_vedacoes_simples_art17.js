/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Vedações legais ao Simples Nacional — art. 17 da LC 123/2006 (c/ LC 214/2025)
    // Lista curada de incisos marcados + campo livre "Outra (descrever)".
    if (!collection.fields.getByName('vedacoes_simples_art17')) {
      collection.fields.add(
        new JSONField({
          name: 'vedacoes_simples_art17',
          maxSize: 2000,
        }),
      )
    }
    if (!collection.fields.getByName('vedacao_simples_outra')) {
      collection.fields.add(
        new TextField({
          name: 'vedacao_simples_outra',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (collection.fields.getByName('vedacoes_simples_art17')) {
      collection.fields.removeByName('vedacoes_simples_art17')
    }
    if (collection.fields.getByName('vedacao_simples_outra')) {
      collection.fields.removeByName('vedacao_simples_outra')
    }
    app.save(collection)
  },
)
