migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('notificacoes_tributarias')

    // 1. Campo email_enviado (bool) — indica se esta novidade já foi enviada por e-mail aos analistas/admins
    if (!col.fields.getByName('email_enviado')) {
      col.fields.add(
        new BoolField({
          name: 'email_enviado',
          required: false,
        }),
      )
    }

    // 2. Campo email_enviado_em (date) — data/hora do disparo do e-mail-resumo
    if (!col.fields.getByName('email_enviado_em')) {
      col.fields.add(
        new DateField({
          name: 'email_enviado_em',
          required: false,
        }),
      )
    }

    // 3. Campo alerta_vencimento (text) — para registrar alertas de vencimento ou fases (ex.: "Fase muda em 2027")
    if (!col.fields.getByName('alerta_vencimento')) {
      col.fields.add(
        new TextField({
          name: 'alerta_vencimento',
          required: false,
        }),
      )
    }

    // 4. Campo prazo_vigencia (text) — para registrar prazo/cronograma de vigência da norma/tese
    if (!col.fields.getByName('prazo_vigencia')) {
      col.fields.add(
        new TextField({
          name: 'prazo_vigencia',
          required: false,
        }),
      )
    }

    app.save(col)

    // Marcar registros pré-existentes como já notificados/enviados para não disparar novidades antigas
    try {
      app
        .db()
        .newQuery(`
        UPDATE notificacoes_tributarias
        SET email_enviado = true, email_enviado_em = datetime('now')
        WHERE email_enviado IS NULL OR email_enviado = false;
      `)
        .execute()
    } catch (e) {
      console.log('Aviso ao atualizar notificacoes_tributarias legadas:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('notificacoes_tributarias')
      if (col.fields.getByName('email_enviado')) {
        col.fields.removeByName('email_enviado')
      }
      if (col.fields.getByName('email_enviado_em')) {
        col.fields.removeByName('email_enviado_em')
      }
      if (col.fields.getByName('alerta_vencimento')) {
        col.fields.removeByName('alerta_vencimento')
      }
      if (col.fields.getByName('prazo_vigencia')) {
        col.fields.removeByName('prazo_vigencia')
      }
      app.save(col)
    } catch (_) {}
  },
)
