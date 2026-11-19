/**
 * 0071 — Correção do salvamento das etapas do Diagnóstico (Transição, Regimes, Autoavaliação).
 *
 * Causa do bug "ETAPA NÃO CONCLUÍDA" no Relatório Consolidado:
 * - `regime_recomendado` é select com valores fixos (Simples Nacional | Lucro Presumido | Lucro Real);
 *   as telas enviavam textos livres ("Transição Fiscal (...)", "Autoavaliação das 7 Frentes") → 400.
 * - `carga_simples`, `carga_presumido` e `carga_real` são number REQUIRED; o PocketBase trata 0
 *   como valor vazio → as etapas que apuram carga 0 eram rejeitadas.
 *
 * Correção: regime_recomendado passa a text (o rótulo completo fica em sistema_recomendado_novo
 * e dados_extra_json) e as cargas passam a aceitar 0. Idempotente.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('diagnosticos')

    const regimeField = col.fields.getByName('regime_recomendado')
    if (regimeField && regimeField.type === 'select') {
      col.fields.removeByName('regime_recomendado')
      col.fields.add(new TextField({ name: 'regime_recomendado', required: true }))
    }

    for (const nome of ['carga_simples', 'carga_presumido', 'carga_real']) {
      const f = col.fields.getByName(nome)
      if (f && f.type === 'number' && f.required) {
        f.required = false
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('diagnosticos')

    const regimeField = col.fields.getByName('regime_recomendado')
    if (regimeField && regimeField.type === 'text') {
      col.fields.removeByName('regime_recomendado')
      col.fields.add(
        new SelectField({
          name: 'regime_recomendado',
          required: true,
          maxSelect: 1,
          values: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
        }),
      )
    }

    for (const nome of ['carga_simples', 'carga_presumido', 'carga_real']) {
      const f = col.fields.getByName(nome)
      if (f && f.type === 'number' && !f.required) {
        f.required = true
      }
    }

    app.save(col)
  },
)
