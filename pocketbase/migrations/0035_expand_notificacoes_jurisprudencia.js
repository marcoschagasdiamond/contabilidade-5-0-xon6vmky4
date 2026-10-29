migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('notificacoes_tributarias')

    // 1. Atualizar valores permitidos do campo 'tipo' para suportar 'tese_jurisprudencia'
    const tipoField = col.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = [
        'aliquota_nova',
        'legislacao_nova',
        'alerta_senado',
        'tese_jurisprudencia',
      ]
    }

    // 2. Atualizar valores permitidos do campo 'tributo' para aceitar todos os tributos nacionais
    const tributoField = col.fields.getByName('tributo')
    if (tributoField) {
      tributoField.values = [
        'CBS',
        'IBS',
        'PIS/Cofins',
        'ICMS',
        'ISS',
        'IPI',
        'IRPJ',
        'CSLL',
        'INSS',
        'Geral',
      ]
    }

    // 3. Adicionar campos opcionais: 'link_acao' e 'tese_id'
    if (!col.fields.getByName('link_acao')) {
      col.fields.add(
        new TextField({
          name: 'link_acao',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('tese_id')) {
      col.fields.add(
        new TextField({
          name: 'tese_id',
          required: false,
        }),
      )
    }

    app.save(col)

    // 4. Semear alerta in-app inicial de decisão favorável do STF (Tema 118 / RE 592.616)
    // "julgado em 21/10/2026: ISS não integra a base de cálculo do PIS/Cofins"
    let existeNotifTese = false
    try {
      const rec = app.findFirstRecordByFilter(
        'notificacoes_tributarias',
        'tipo = "tese_jurisprudencia" && tese_id = "tese_pis_iss_servicos"',
      )
      if (rec) existeNotifTese = true
    } catch (_) {}

    if (!existeNotifTese) {
      const novaNotif = new Record(col)
      novaNotif.set(
        'titulo',
        'STF fixa Tema 118: Exclusão do ISS da base do PIS/Cofins (RE 592.616)',
      )
      novaNotif.set(
        'mensagem',
        'Julgamento concluído pelo Plenário do STF favorável aos contribuintes: o ISS destacado não integra a base de cálculo da contribuição ao PIS e da Cofins. Créditos passíveis de recuperação administrativa.',
      )
      novaNotif.set('tipo', 'tese_jurisprudencia')
      novaNotif.set('tributo', 'PIS/Cofins')
      novaNotif.set('ano', 2026)
      novaNotif.set('fonte', 'STF - Plenário (RE 592.616 / Tema 118 RG, julgado em 21/10/2026)')
      novaNotif.set('tese_id', 'tese_pis_iss_servicos')
      novaNotif.set('link_acao', '/recuperador-creditos?tese=tese_pis_iss_servicos')
      novaNotif.set('lida', false)
      app.save(novaNotif)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('notificacoes_tributarias')
      if (col.fields.getByName('link_acao')) {
        col.fields.removeByName('link_acao')
      }
      if (col.fields.getByName('tese_id')) {
        col.fields.removeByName('tese_id')
      }
      app.save(col)
    } catch (_) {}
  },
)
