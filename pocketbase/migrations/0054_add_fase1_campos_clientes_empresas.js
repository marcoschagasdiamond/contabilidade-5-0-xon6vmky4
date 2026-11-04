migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes_empresas')

    // 1. Perfil de insumos (% somando 100)
    if (!col.fields.getByName('perfil_insumos_aliquota_cheia')) {
      col.fields.add(new NumberField({ name: 'perfil_insumos_aliquota_cheia', min: 0, max: 100 }))
    }
    if (!col.fields.getByName('perfil_insumos_monofasicos')) {
      col.fields.add(new NumberField({ name: 'perfil_insumos_monofasicos', min: 0, max: 100 }))
    }
    if (!col.fields.getByName('perfil_insumos_aliquota_reduzida')) {
      col.fields.add(
        new NumberField({ name: 'perfil_insumos_aliquota_reduzida', min: 0, max: 100 }),
      )
    }

    // 2. Presença de monofásicos
    if (!col.fields.getByName('presenca_monofasicos')) {
      col.fields.add(new BoolField({ name: 'presenca_monofasicos' }))
    }
    if (!col.fields.getByName('categorias_monofasicos')) {
      col.fields.add(new JSONField({ name: 'categorias_monofasicos', maxSize: 50000 }))
    }

    // 3. Insumos energéticos
    if (!col.fields.getByName('insumos_energeticos')) {
      col.fields.add(new BoolField({ name: 'insumos_energeticos' }))
    }

    // 4. Intangíveis / royalties
    if (!col.fields.getByName('intangiveis_royalties')) {
      col.fields.add(new BoolField({ name: 'intangiveis_royalties' }))
    }

    // 5. Imobilizado (investimentos últimos 5 anos)
    if (!col.fields.getByName('imobilizado_ultimos_5_anos')) {
      col.fields.add(new NumberField({ name: 'imobilizado_ultimos_5_anos', min: 0 }))
    }
    if (!col.fields.getByName('imobilizado_anos_detalhe')) {
      col.fields.add(new JSONField({ name: 'imobilizado_anos_detalhe', maxSize: 50000 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes_empresas')
    const nomes = [
      'perfil_insumos_aliquota_cheia',
      'perfil_insumos_monofasicos',
      'perfil_insumos_aliquota_reduzida',
      'presenca_monofasicos',
      'categorias_monofasicos',
      'insumos_energeticos',
      'intangiveis_royalties',
      'imobilizado_ultimos_5_anos',
      'imobilizado_anos_detalhe',
    ]
    nomes.forEach((nome) => {
      const f = col.fields.getByName(nome)
      if (f) col.fields.remove(f)
    })
    app.save(col)
  },
)
