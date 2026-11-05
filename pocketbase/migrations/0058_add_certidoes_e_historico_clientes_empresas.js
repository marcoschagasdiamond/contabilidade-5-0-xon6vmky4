/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // Documentos fiscais e certidões (Etapa 1 da Integração Fiscal: manual + preparado para API futura)
    if (!collection.fields.getByName('certidoes_fiscais')) {
      collection.fields.add(
        new JSONField({
          name: 'certidoes_fiscais',
          maxSize: 20000,
        }),
      )
    }

    // Histórico unificado de importações fiscais (EFD, Balancete, Certidões)
    if (!collection.fields.getByName('historico_documentos_fiscais')) {
      collection.fields.add(
        new JSONField({
          name: 'historico_documentos_fiscais',
          maxSize: 30000,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (collection.fields.getByName('certidoes_fiscais')) {
      collection.fields.removeByName('certidoes_fiscais')
    }
    if (collection.fields.getByName('historico_documentos_fiscais')) {
      collection.fields.removeByName('historico_documentos_fiscais')
    }
    app.save(collection)
  },
)
