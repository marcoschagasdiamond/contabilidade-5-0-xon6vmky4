/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('escritorio_nome')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_nome',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_responsavel')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_responsavel',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_cnpj')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_cnpj',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_email')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_email',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_telefone')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_telefone',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_uf')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_uf',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_cidade')) {
      usersCol.fields.add(
        new TextField({
          name: 'escritorio_cidade',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('escritorio_cadastrado')) {
      usersCol.fields.add(
        new BoolField({
          name: 'escritorio_cadastrado',
          required: false,
        }),
      )
    }

    app.save(usersCol)
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const campos = [
        'escritorio_nome',
        'escritorio_responsavel',
        'escritorio_cnpj',
        'escritorio_email',
        'escritorio_telefone',
        'escritorio_uf',
        'escritorio_cidade',
        'escritorio_cadastrado',
      ]
      campos.forEach((campo) => {
        if (usersCol.fields.getByName(campo)) {
          usersCol.fields.removeByName(campo)
        }
      })
      app.save(usersCol)
    } catch (_) {
      // Ignore rollback errors
    }
  },
)
