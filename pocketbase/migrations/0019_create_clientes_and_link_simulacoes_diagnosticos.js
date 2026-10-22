migrate(
  (app) => {
    // 1. Criar coleção 'clientes' para a Carteira de Clientes do Contador (~100 clientes)
    const clientesCollection = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cnpj_cpf', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        {
          name: 'segmento',
          type: 'select',
          required: true,
          values: [
            'Comércio',
            'Serviços',
            'Indústria',
            'Saúde',
            'Educação',
            'Agro',
            'Transporte',
            'Tecnologia',
            'Construção Civil',
            'Bares e Restaurantes',
            'Outro',
          ],
          maxSelect: 1,
        },
        { name: 'regime_atual', type: 'text', required: true },
        { name: 'email', type: 'email', required: false },
        { name: 'telefone', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_user ON clientes (user_id)',
        'CREATE INDEX idx_clientes_nome ON clientes (nome)',
        'CREATE INDEX idx_clientes_cnpj_cpf ON clientes (cnpj_cpf)',
        'CREATE INDEX idx_clientes_created ON clientes (created DESC)',
      ],
    })
    app.save(clientesCollection)

    // 2. Adicionar campo 'cliente_id' (texto, opcional) na coleção 'simulacoes_calculadora'
    try {
      const simulacoesCol = app.findCollectionByNameOrId('simulacoes_calculadora')
      if (!simulacoesCol.fields.getByName('cliente_id')) {
        simulacoesCol.fields.add(
          new TextField({
            name: 'cliente_id',
            required: false,
          }),
        )
        simulacoesCol.addIndex('idx_simulacoes_cliente_id', false, 'cliente_id', '')
        app.save(simulacoesCol)
      }
    } catch (e) {
      console.log('Erro ao atualizar simulacoes_calculadora:', e)
    }

    // 3. Adicionar campo 'cliente_id' (texto, opcional) na coleção 'diagnosticos'
    try {
      const diagCol = app.findCollectionByNameOrId('diagnosticos')
      if (!diagCol.fields.getByName('cliente_id')) {
        diagCol.fields.add(
          new TextField({
            name: 'cliente_id',
            required: false,
          }),
        )
        diagCol.addIndex('idx_diagnosticos_cliente_id', false, 'cliente_id', '')
        app.save(diagCol)
      }
    } catch (e) {
      console.log('Erro ao atualizar diagnosticos:', e)
    }

    // 4. Seeding inicial de clientes para demonstração (se a coleção estiver vazia)
    try {
      const count = app.countRecords('clientes')
      if (count === 0) {
        const seedClientes = [
          {
            nome: 'Indústria Metalúrgica Aliança Ltda',
            cnpj_cpf: '12.345.678/0001-90',
            uf: 'SP',
            segmento: 'Indústria',
            regime_atual: 'Lucro Real',
            email: 'diretoria@metalurgicaalianca.com.br',
            telefone: '(11) 3456-7890',
          },
          {
            nome: 'TechVibe Soluções em Software S.A.',
            cnpj_cpf: '98.765.432/0001-10',
            uf: 'SC',
            segmento: 'Tecnologia',
            regime_atual: 'Lucro Presumido',
            email: 'financeiro@techvibe.com.br',
            telefone: '(48) 3221-4500',
          },
          {
            nome: 'Supermercado Progresso da Serra',
            cnpj_cpf: '45.890.123/0001-44',
            uf: 'MG',
            segmento: 'Comércio',
            regime_atual: 'Lucro Real',
            email: 'contabilidade@supermercadoprogresso.com.br',
            telefone: '(31) 3890-1200',
          },
          {
            nome: 'Clínica Médica Viver Bem',
            cnpj_cpf: '23.456.789/0001-32',
            uf: 'RJ',
            segmento: 'Saúde',
            regime_atual: 'Simples Nacional',
            email: 'gestao@clinicaviverbem.med.br',
            telefone: '(21) 2555-8900',
          },
          {
            nome: 'Agropecuária Vale do Sol Ltda',
            cnpj_cpf: '67.890.123/0001-55',
            uf: 'MT',
            segmento: 'Agro',
            regime_atual: 'Lucro Presumido',
            email: 'contato@agrovaledosol.com.br',
            telefone: '(65) 3624-9100',
          },
        ]

        for (const seed of seedClientes) {
          const rec = new Record(clientesCollection)
          rec.set('nome', seed.nome)
          rec.set('cnpj_cpf', seed.cnpj_cpf)
          rec.set('uf', seed.uf)
          rec.set('segmento', seed.segmento)
          rec.set('regime_atual', seed.regime_atual)
          rec.set('email', seed.email)
          rec.set('telefone', seed.telefone)
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Erro no seed de clientes:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('clientes')
      app.delete(col)
    } catch (_) {}
  },
)
