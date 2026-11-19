/**
 * 0073 — Backfill idempotente de estagio_funil (clientes e clientes_empresas).
 *
 * Causa do bug "não há vínculo com cliente ativo" e da mistura de dados entre
 * empresas: estagio_funil é select OPCIONAL em ambas as coleções e registros
 * antigos nasceram vazio, quebrando a resolução de cliente ativo.
 *
 * Registros com estagio_funil vazio passam a 'diagnostico'. Idempotente:
 * em base sem registros vazios (ou re-executada) não faz nada.
 * Valor explícito (lead/proposta/cliente_ativo/descartado) é preservado.
 */
migrate(
  (app) => {
    for (const colecao of ['clientes', 'clientes_empresas']) {
      const vazios = app.findRecordsByFilter(colecao, "estagio_funil = ''", '-created', 0, 0)
      for (const rec of vazios) {
        rec.set('estagio_funil', 'diagnostico')
        app.save(rec)
      }
      if (vazios.length > 0) {
        console.log(
          '[0073] estagio_funil preenchido para ' + vazios.length + ' registro(s) em ' + colecao,
        )
      }
    }
  },
  (app) => {
    // Down: não reverte valores preenchidos (backfill é seguro manter).
    // Apenas registra que nada foi desfeito.
    console.log('[0073] down: backfill de estagio_funil mantido (reversão não aplicável)')
  },
)
