/// <reference path="../pb_data/types.d.ts" />
// Migration: campos antecipados de IBS/CBS na importação de documentos fiscais
// (integração antecipada — o sistema oficial ainda não emite arquivos com o grupo IBSCBS).
// Os 4 valores já viajam no blob JSON documento_fiscal_importado.totaisFiscais; estas
// colunas explícitas existem para consulta/auditoria futura.
// Idempotente: se algum campo já existir, a migration termina sem alterar nada (no-op),
// inclusive em banco vazio (findCollectionByNameOrId retorna null → sai sem erro).
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (!collection) return

    const nomesNovos = [
      'ibs_destacado',
      'cbs_destacado',
      'cst_cclass_trib',
      'credito_ibs_cbs_apurado',
    ]
    const jaExiste = collection.fields.filter((f) => nomesNovos.includes(f.name))
    if (jaExiste.length > 0) return

    collection.fields.add(
      new NumberField({
        name: 'ibs_destacado',
        min: 0,
      }),
    )
    collection.fields.add(
      new NumberField({
        name: 'cbs_destacado',
        min: 0,
      }),
    )
    collection.fields.add(
      new TextField({
        name: 'cst_cclass_trib',
      }),
    )
    collection.fields.add(
      new NumberField({
        name: 'credito_ibs_cbs_apurado',
        min: 0,
      }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clientes_empresas')
    if (!collection) return
    collection.fields.removeByName('ibs_destacado')
    collection.fields.removeByName('cbs_destacado')
    collection.fields.removeByName('cst_cclass_trib')
    collection.fields.removeByName('credito_ibs_cbs_apurado')
    app.save(collection)
  },
)
