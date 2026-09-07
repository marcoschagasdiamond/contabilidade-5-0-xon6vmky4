migrate(
  (app) => {
    const collection = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '', // Public can submit leads
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
          values: [
            'Tecnologia',
            'Varejo',
            'Indústria',
            'Serviços',
            'Agronegócio',
            'Sociedade de Profissionais',
            'Outros',
          ],
          maxSelect: 1,
        },
        {
          name: 'funcionarios',
          type: 'select',
          required: true,
          values: ['1–5', '6–20', '21–50', '51–200', 'Mais de 200'],
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_created ON leads (created DESC)',
        'CREATE INDEX idx_leads_email ON leads (email)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('leads')
      app.delete(collection)
    } catch (_) {}
  },
)
