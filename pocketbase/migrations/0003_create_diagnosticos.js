migrate(
  (app) => {
    const collection = new Collection({
      name: 'diagnosticos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '', // Público pode registrar diagnósticos
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'telefone', type: 'text', required: true },
        { name: 'empresa', type: 'text', required: true },
        {
          name: 'segmento',
          type: 'select',
          required: true,
          values: ['Comércio', 'Indústria', 'Serviços'],
          maxSelect: 1,
        },
        { name: 'rbt12', type: 'number', required: true },
        { name: 'folha12', type: 'number', required: true },
        { name: 'margem_lucro', type: 'number', required: true },
        {
          name: 'regime_recomendado',
          type: 'select',
          required: true,
          values: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
          maxSelect: 1,
        },
        { name: 'carga_simples', type: 'number', required: true },
        { name: 'carga_presumido', type: 'number', required: true },
        { name: 'carga_real', type: 'number', required: true },
        { name: 'economia_anual', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_diagnosticos_created ON diagnosticos (created DESC)',
        'CREATE INDEX idx_diagnosticos_email ON diagnosticos (email)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('diagnosticos')
      app.delete(collection)
    } catch (_) {}
  },
)
