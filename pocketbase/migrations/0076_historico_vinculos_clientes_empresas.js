/**
 * 0076 — Campo de auditoria dos Vínculos Societários / Grupo Econômico.
 *
 * Adiciona `historico_vinculos` (JSON) em clientes_empresas: array com os
 * registros de auditoria de cada operação bem-sucedida de adicionar/remover
 * vínculo (data/hora, usuário, ação, empresa afetada, tipo de vínculo).
 * Escolha de campo na própria empresa (opção de MENOR mudança do pedido) —
 * nenhuma coleção nova, nenhum fluxo de gravação alterado.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes_empresas')
    if (!col.fields.getByName('historico_vinculos')) {
      col.fields.add(new JSONField({ name: 'historico_vinculos', maxSize: 2000000 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes_empresas')
    if (col.fields.getByName('historico_vinculos')) {
      col.fields.removeByName('historico_vinculos')
      app.save(col)
    }
  },
)
