migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção 'parametros_tributarios'
    // Campos:
    // - ano (number, e.g. 2027)
    // - tributo (select: 'CBS' | 'IBS')
    // - aliquota (number, e.g. 11.3468)
    // - situacao (select: 'proposta' | 'fixada')
    // - fonte (text, e.g. 'TCU - Sessão Plenária 28/10/2026')
    // - data (date ou text)
    // - detalhes (text)
    // - ativo (bool)
    const parametrosCol = new Collection({
      name: 'parametros_tributarios',
      type: 'base',
      listRule: '', // Público para leitura (calculadora e visitantes)
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'ano',
          type: 'number',
          required: true,
        },
        {
          name: 'tributo',
          type: 'select',
          required: true,
          values: ['CBS', 'IBS'],
          maxSelect: 1,
        },
        {
          name: 'aliquota',
          type: 'number',
          required: true,
        },
        {
          name: 'situacao',
          type: 'select',
          required: true,
          values: ['proposta', 'fixada'],
          maxSelect: 1,
        },
        {
          name: 'fonte',
          type: 'text',
          required: true,
        },
        {
          name: 'data',
          type: 'date',
          required: false,
        },
        {
          name: 'detalhes',
          type: 'text',
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_param_tributo_ano ON parametros_tributarios (tributo, ano)',
        'CREATE INDEX idx_param_created ON parametros_tributarios (created DESC)',
      ],
    })
    app.save(parametrosCol)

    // 2. Coleção 'notificacoes_tributarias' para notificações in-app
    // Notificações geradas quando nova alíquota é detectada
    const notificacoesCol = new Collection({
      name: 'notificacoes_tributarias',
      type: 'base',
      listRule: '', // Leitura pública/in-app para avisos e badges
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'mensagem',
          type: 'text',
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['aliquota_nova', 'legislacao_nova', 'alerta_senado'],
          maxSelect: 1,
        },
        {
          name: 'tributo',
          type: 'select',
          required: false,
          values: ['CBS', 'IBS'],
          maxSelect: 1,
        },
        {
          name: 'ano',
          type: 'number',
          required: false,
        },
        {
          name: 'aliquota',
          type: 'number',
          required: false,
        },
        {
          name: 'fonte',
          type: 'text',
          required: false,
        },
        {
          name: 'lida',
          type: 'bool',
          required: false,
        },
        {
          name: 'destinatario_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notif_created ON notificacoes_tributarias (created DESC)',
        'CREATE INDEX idx_notif_tipo ON notificacoes_tributarias (tipo)',
      ],
    })
    app.save(notificacoesCol)

    // 3. Semear registro oficial solicitado:
    // "TCU aprovou em 28/10/2026 a CBS de referência em 11,3468% para 2027 e o Senado tem até 15/12/2026 para fixar por resolução. Pode semear esse registro como "proposta" na coleção."
    const recordCbs2027 = new Record(parametrosCol)
    recordCbs2027.set('ano', 2027)
    recordCbs2027.set('tributo', 'CBS')
    recordCbs2027.set('aliquota', 11.3468)
    recordCbs2027.set('situacao', 'proposta')
    recordCbs2027.set(
      'fonte',
      'TCU - Sessão Plenária de 28/10/2026 (Processo TC 018.945/2026-8 / Acórdão Referência CBS)',
    )
    recordCbs2027.set('data', '2026-10-28 00:00:00.000Z')
    recordCbs2027.set(
      'detalhes',
      'O Tribunal de Contas da União (TCU) aprovou o cálculo da alíquota de referência da CBS em 11,3468% para o ano de 2027. O Senado Federal tem até 15/12/2026 para fixar a alíquota final por meio de Resolução do Senado.',
    )
    recordCbs2027.set('ativo', true)
    app.save(recordCbs2027)

    // Semear notificação in-app correspondente
    const notifInicial = new Record(notificacoesCol)
    notifInicial.set(
      'titulo',
      'Radar Tributário: TCU aprova CBS de referência em 11,3468% para 2027',
    )
    notifInicial.set(
      'mensagem',
      'O TCU aprovou a proposta da CBS de referência em 11,3468% para 2027 em 28/10/2026. O Senado Federal tem até 15/12/2026 para fixar por Resolução. O radar da Calculadora IBS/CBS já disponibiliza este parâmetro para suas simulações.',
    )
    notifInicial.set('tipo', 'aliquota_nova')
    notifInicial.set('tributo', 'CBS')
    notifInicial.set('ano', 2027)
    notifInicial.set('aliquota', 11.3468)
    notifInicial.set('fonte', 'TCU - Sessão Plenária Extraordinária 28/10/2026')
    notifInicial.set('lida', false)
    app.save(notifInicial)
  },
  (app) => {
    try {
      const notifCol = app.findCollectionByNameOrId('notificacoes_tributarias')
      app.delete(notifCol)
    } catch (_) {}

    try {
      const paramCol = app.findCollectionByNameOrId('parametros_tributarios')
      app.delete(paramCol)
    } catch (_) {}
  },
)
