/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // 1. Autos de infração ativos (bool, quantidade, valor)
    collection.fields.add(
      new BoolField({
        name: 'autos_infracao_ativos',
      }),
    )
    collection.fields.add(
      new NumberField({
        name: 'autos_infracao_quantidade',
        min: 0,
      }),
    )
    collection.fields.add(
      new NumberField({
        name: 'autos_infracao_valor',
        min: 0,
      }),
    )

    // 2. Parcelamentos em curso (bool, quantidade)
    collection.fields.add(
      new BoolField({
        name: 'parcelamentos_em_curso',
      }),
    )
    collection.fields.add(
      new NumberField({
        name: 'parcelamentos_quantidade',
        min: 0,
      }),
    )

    // 3. Débitos com inscrição em dívida ativa ou execução fiscal (bool)
    collection.fields.add(
      new BoolField({
        name: 'divida_ativa_execucao_fiscal',
      }),
    )

    // 4. Obrigações acessórias em atraso (bool)
    collection.fields.add(
      new BoolField({
        name: 'obrigacoes_acessorias_atraso',
      }),
    )

    // 5. Número de filiais/estabelecimentos (number, padrão 1)
    collection.fields.add(
      new NumberField({
        name: 'numero_filiais',
        min: 1,
      }),
    )

    // 6. UFs de operação (json array de strings)
    collection.fields.add(
      new JSONField({
        name: 'ufs_operacao',
        maxSize: 10000,
      }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    collection.fields.removeByName('autos_infracao_ativos')
    collection.fields.removeByName('autos_infracao_quantidade')
    collection.fields.removeByName('autos_infracao_valor')
    collection.fields.removeByName('parcelamentos_em_curso')
    collection.fields.removeByName('parcelamentos_quantidade')
    collection.fields.removeByName('divida_ativa_execucao_fiscal')
    collection.fields.removeByName('obrigacoes_acessorias_atraso')
    collection.fields.removeByName('numero_filiais')
    collection.fields.removeByName('ufs_operacao')
    app.save(collection)
  },
)
