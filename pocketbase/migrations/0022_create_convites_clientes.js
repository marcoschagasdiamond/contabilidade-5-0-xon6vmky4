migrate(
  (app) => {
    // 1. Criar coleção 'convites_clientes'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let clientesColId = null
    try {
      clientesColId = app.findCollectionByNameOrId('clientes').id
    } catch (_) {}

    const collection = new Collection({
      name: 'convites_clientes',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (analista_id = @request.auth.id || @request.auth.role = "admin")',
      viewRule: '', // Público para permitir validar token no cadastro
      createRule: '@request.auth.id != ""',
      updateRule:
        '@request.auth.id != "" && (analista_id = @request.auth.id || @request.auth.role = "admin")',
      deleteRule:
        '@request.auth.id != "" && (analista_id = @request.auth.id || @request.auth.role = "admin")',
      fields: [
        {
          name: 'analista_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'relation',
          required: false,
          collectionId: clientesColId || 'clientes',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'cliente_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'mensagem',
          type: 'text',
          required: false,
        },
        {
          name: 'token',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aceito', 'expirado', 'cancelado'],
          maxSelect: 1,
        },
        {
          name: 'convidado_user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'enviado_em',
          type: 'date',
          required: false,
        },
        {
          name: 'aceito_em',
          type: 'date',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_convites_analista ON convites_clientes (analista_id)',
        'CREATE INDEX idx_convites_cliente ON convites_clientes (cliente_id)',
        'CREATE INDEX idx_convites_email ON convites_clientes (email)',
        'CREATE UNIQUE INDEX idx_convites_token ON convites_clientes (token)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('convites_clientes')
      app.delete(collection)
    } catch (_) {}
  },
)
