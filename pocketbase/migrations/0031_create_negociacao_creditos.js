migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção 'anuncios_creditos'
    // Campos:
    // - user_id (relation -> users)
    // - operacao (select: 'venda' | 'compra')
    // Se VENDA:
    // - tipo_credito (select: Precatório Federal, Precatório Estadual, Precatório Municipal, RPV, Crédito de IBS/CBS, Crédito de PIS/Cofins, Crédito de ICMS de incentivos, Crédito judicial contra o Fisco, Dívida ativa securitizada)
    // - situacao (select: protocolado, expedido, divida_ativa, reconhecido_judicialmente)
    // Se COMPRA:
    // - finalidade (select: compensar_debitos, investimento, compra_imoveis_publicos, quitar_parcelamentos)
    // Comuns:
    // - esfera (select: federal, estadual, municipal)
    // - uf (text)
    // - municipio (text)
    // - valor_nominal (number) - Se compra, valor disponível
    // - desagio_percentual (number) - % de deságio desejado / alvo
    // - observacoes (text)
    // - status (select: ativo, pausado, negociado, cancelado)
    // Dados de contato do anunciante:
    // - contato_nome (text)
    // - contato_documento (text) - CNPJ ou CPF
    // - contato_email (email)
    // - contato_telefone (text)
    //
    // Regras de acesso:
    // List/View: Qualquer usuário autenticado (@request.auth.id != '')
    // Create: Qualquer usuário autenticado (@request.auth.id != '')
    // Update/Delete: Dono do anúncio ou Master/Admin
    const anunciosCreditos = new Collection({
      name: 'anuncios_creditos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'operacao',
          type: 'select',
          required: true,
          values: ['venda', 'compra'],
          maxSelect: 1,
        },
        {
          name: 'tipo_credito',
          type: 'select',
          required: false,
          values: [
            'Precatório Federal',
            'Precatório Estadual',
            'Precatório Municipal',
            'RPV',
            'Crédito de IBS/CBS',
            'Crédito de PIS/Cofins',
            'Crédito de ICMS de incentivos',
            'Crédito judicial contra o Fisco',
            'Dívida ativa securitizada',
          ],
          maxSelect: 1,
        },
        {
          name: 'esfera',
          type: 'select',
          required: true,
          values: ['federal', 'estadual', 'municipal'],
          maxSelect: 1,
        },
        {
          name: 'uf',
          type: 'text',
          required: false,
        },
        {
          name: 'municipio',
          type: 'text',
          required: false,
        },
        {
          name: 'valor_nominal',
          type: 'number',
          required: true,
        },
        {
          name: 'desagio_percentual',
          type: 'number',
          required: true,
        },
        {
          name: 'situacao',
          type: 'select',
          required: false,
          values: ['protocolado', 'expedido', 'divida_ativa', 'reconhecido_judicialmente'],
          maxSelect: 1,
        },
        {
          name: 'finalidade',
          type: 'select',
          required: false,
          values: [
            'compensar_debitos',
            'investimento',
            'compra_imoveis_publicos',
            'quitar_parcelamentos',
          ],
          maxSelect: 1,
        },
        {
          name: 'observacoes',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'pausado', 'negociado', 'cancelado'],
          maxSelect: 1,
        },
        {
          name: 'contato_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'contato_documento',
          type: 'text',
          required: false,
        },
        {
          name: 'contato_email',
          type: 'email',
          required: false,
        },
        {
          name: 'contato_telefone',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_anuncios_user ON anuncios_creditos (user_id)',
        'CREATE INDEX idx_anuncios_operacao ON anuncios_creditos (operacao)',
        'CREATE INDEX idx_anuncios_esfera ON anuncios_creditos (esfera)',
        'CREATE INDEX idx_anuncios_status ON anuncios_creditos (status)',
        'CREATE INDEX idx_anuncios_created ON anuncios_creditos (created DESC)',
      ],
    })
    app.save(anunciosCreditos)

    // 2. Coleção 'pedidos_informacao_creditos'
    // Cada pedido vincula-se ao anúncio e ao usuário interessado.
    // Campos:
    // - anuncio_id (relation -> anuncios_creditos)
    // - solicitante_id (relation -> users)
    // - solicitante_nome (text)
    // - solicitante_email (email)
    // - solicitante_telefone (text)
    // - mensagem (text)
    // - resposta_admin (text)
    // - respondido_por (relation -> users)
    // - respondido_em (date)
    // - status (select: pendente | respondido | arquivado)
    // - visualizado_pelo_solicitante (bool)
    const pedidosInfo = new Collection({
      name: 'pedidos_informacao_creditos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (solicitante_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      viewRule:
        "@request.auth.id != '' && (solicitante_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (solicitante_id = @request.auth.id || @request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'master' || @request.auth.nivel_acesso = 'admin' || @request.auth.role = 'admin' || @request.auth.email = 'marcoschagasdiamond@icloud.com')",
      fields: [
        {
          name: 'anuncio_id',
          type: 'relation',
          collectionId: anunciosCreditos.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'solicitante_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'solicitante_nome',
          type: 'text',
          required: true,
        },
        {
          name: 'solicitante_email',
          type: 'email',
          required: true,
        },
        {
          name: 'solicitante_telefone',
          type: 'text',
          required: false,
        },
        {
          name: 'mensagem',
          type: 'text',
          required: true,
        },
        {
          name: 'resposta_admin',
          type: 'text',
          required: false,
        },
        {
          name: 'respondido_por',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        {
          name: 'respondido_em',
          type: 'date',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'respondido', 'arquivado'],
          maxSelect: 1,
        },
        {
          name: 'visualizado_pelo_solicitante',
          type: 'bool',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pedidos_anuncio ON pedidos_informacao_creditos (anuncio_id)',
        'CREATE INDEX idx_pedidos_solicitante ON pedidos_informacao_creditos (solicitante_id)',
        'CREATE INDEX idx_pedidos_status ON pedidos_informacao_creditos (status)',
        'CREATE INDEX idx_pedidos_created ON pedidos_informacao_creditos (created DESC)',
      ],
    })
    app.save(pedidosInfo)
  },
  (app) => {
    try {
      const pCol = app.findCollectionByNameOrId('pedidos_informacao_creditos')
      app.delete(pCol)
    } catch (_) {}

    try {
      const aCol = app.findCollectionByNameOrId('anuncios_creditos')
      app.delete(aCol)
    } catch (_) {}
  },
)
