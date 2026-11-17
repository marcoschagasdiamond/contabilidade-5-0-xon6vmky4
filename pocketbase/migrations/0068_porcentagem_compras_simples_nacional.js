/// <reference path="../pb_data/types.d.ts" />
// Migration 0068: coluna porcentagem_compras_simples_nacional (number, padrão 0)
// na coleção clientes_empresas — LC 214/2025, % das compras vindas de fornecedores
// do Simples Nacional (parâmetro editável em Dados da Empresa, propagado à Calculadora).
// Idempotente: se a coleção ou a coluna já existir, termina sem alterar nada (no-op).
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (!collection) return

    const jaExiste = collection.fields.filter(
      (f) => f.name === 'porcentagem_compras_simples_nacional',
    )
    if (jaExiste.length > 0) return

    collection.fields.add(
      new NumberField({
        name: 'porcentagem_compras_simples_nacional',
        min: 0,
        max: 100,
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (!collection) return
    collection.fields.removeByName('porcentagem_compras_simples_nacional')
    app.save(collection)
  },
)
