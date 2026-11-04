/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')

    // 1. % compras que não geram crédito (0-100)
    collection.fields.add(
      new NumberField({
        name: 'percentual_compras_sem_credito',
        min: 0,
        max: 100,
      }),
    )

    // 2. Saldo credor acumulado / estoque inicial de créditos (R$)
    collection.fields.add(
      new NumberField({
        name: 'saldo_credor_acumulado',
        min: 0,
      }),
    )

    // 3. % vendas interestaduais (0-100)
    collection.fields.add(
      new NumberField({
        name: 'percentual_vendas_interestaduais',
        min: 0,
        max: 100,
      }),
    )

    // 4. Regime especial atual
    collection.fields.add(
      new SelectField({
        name: 'regime_especial_atual',
        maxSelect: 1,
        values: [
          'nenhum',
          'monofasico',
          'substituicao_tributaria',
          'zona_franca_manaus',
          'ret_permuta',
        ],
      }),
    )

    // 5. Perfil de retenção / split payment dos clientes
    collection.fields.add(
      new SelectField({
        name: 'perfil_retencao_split',
        maxSelect: 1,
        values: ['sim_todos', 'parcial', 'nao'],
      }),
    )

    // 5b. % retenção quando parcial (0-100)
    collection.fields.add(
      new NumberField({
        name: 'percentual_retencao_split',
        min: 0,
        max: 100,
      }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    collection.fields.removeByName('percentual_compras_sem_credito')
    collection.fields.removeByName('saldo_credor_acumulado')
    collection.fields.removeByName('percentual_vendas_interestaduais')
    collection.fields.removeByName('regime_especial_atual')
    collection.fields.removeByName('perfil_retencao_split')
    collection.fields.removeByName('percentual_retencao_split')
    app.save(collection)
  },
)
