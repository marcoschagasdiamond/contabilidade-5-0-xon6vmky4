migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção 'configuracoes_agenda'
    // Permite que o escritório defina:
    // - dias da semana habilitados (ex: [1, 2, 3, 4, 5] -> seg a sex)
    // - janelas de horários padrão (ex: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"])
    // - duracao_minutos (ex: 45 ou 60)
    // - antecedencia_minima_horas (ex: 2)
    // - ativo (bool)
    // - observacoes (text)
    const configAgenda = new Collection({
      name: 'configuracoes_agenda',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'chave',
          type: 'text',
          required: true,
        },
        {
          name: 'dias_semana_json',
          type: 'json',
          required: false,
        },
        {
          name: 'horarios_disponiveis_json',
          type: 'json',
          required: false,
        },
        {
          name: 'duracao_minutos',
          type: 'number',
          required: false,
        },
        {
          name: 'antecedencia_minima_horas',
          type: 'number',
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_config_agenda_chave ON configuracoes_agenda (chave)'],
    })
    app.save(configAgenda)

    // Semente inicial de configuração padrão da agenda
    try {
      const rec = new Record(configAgenda)
      rec.set('chave', 'agenda_padrao_especialista')
      rec.set('dias_semana_json', JSON.stringify([1, 2, 3, 4, 5])) // 1=segunda ... 5=sexta
      rec.set(
        'horarios_disponiveis_json',
        JSON.stringify(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']),
      )
      rec.set('duracao_minutos', 50)
      rec.set('antecedencia_minima_horas', 4)
      rec.set('ativo', true)
      rec.set('observacoes', 'Disponibilidade de reuniões estratégicas Diamond Group')
      app.save(rec)
    } catch (e) {
      console.log('Seed configuracoes_agenda info:', e)
    }

    // 2. Coleção 'reunioes'
    // Campos:
    // - user_id (relation -> users) cliente / solicitante
    // - cliente_nome (text)
    // - cliente_email (email)
    // - cliente_telefone (text)
    // - empresa (text)
    // - data (text: YYYY-MM-DD)
    // - horario (text: HH:mm)
    // - assunto (text)
    // - observacao (text)
    // - origem_contexto (text, ex: 'diagnostico_360', 'relatorio_consolidado', 'portal_cliente')
    // - status (select: agendada | reagendada | cancelada | realizada)
    // - resposta_especialista (text)
    // - cancelado_motivo (text)
    const reunioes = new Collection({
      name: 'reunioes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'cliente_nome',
          type: 'text',
          required: true,
        },
        {
          name: 'cliente_email',
          type: 'email',
          required: true,
        },
        {
          name: 'cliente_telefone',
          type: 'text',
          required: false,
        },
        {
          name: 'empresa',
          type: 'text',
          required: false,
        },
        {
          name: 'data',
          type: 'text',
          required: true,
        },
        {
          name: 'horario',
          type: 'text',
          required: true,
        },
        {
          name: 'assunto',
          type: 'text',
          required: true,
        },
        {
          name: 'observacao',
          type: 'text',
          required: false,
        },
        {
          name: 'origem_contexto',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendada', 'reagendada', 'cancelada', 'realizada'],
          maxSelect: 1,
        },
        {
          name: 'resposta_especialista',
          type: 'text',
          required: false,
        },
        {
          name: 'cancelado_motivo',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_reunioes_user ON reunioes (user_id)',
        'CREATE INDEX idx_reunioes_data_horario ON reunioes (data, horario)',
        'CREATE INDEX idx_reunioes_status ON reunioes (status)',
        'CREATE INDEX idx_reunioes_created ON reunioes (created DESC)',
      ],
    })
    app.save(reunioes)
  },
  (app) => {
    try {
      const rCol = app.findCollectionByNameOrId('reunioes')
      app.delete(rCol)
    } catch (_) {}

    try {
      const cCol = app.findCollectionByNameOrId('configuracoes_agenda')
      app.delete(cCol)
    } catch (_) {}
  },
)
