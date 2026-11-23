/// <reference path="../pb_data/types.d.ts" />

/**
 * Auditoria de Faturamento Importado (Grupo Econômico).
 *
 * Sempre que o campo `faturamento_mensal` de um registro em
 * `clientes_empresas` é alterado, este hook compara com o valor anterior e
 * APPENDA em `historico_vinculos` (JSON na própria empresa) um registro com:
 * data/hora, usuário (id e nome), acao 'faturamento_importado' e o valor
 * anterior → novo formatado em BRL.
 *
 * Por que no SERVIDOR (onRecordUpdate, no ONTO): garante auditoria para
 * QUALQUER via de gravação (importação por arquivo, digitação manual na
 * página, admin UI, API) e não altera o fluxo do app. Como roda no ONTO
 * (antes da gravação concluir), uma operação que FALHA depois não deixa
 * registro: o histórico só nasce quando o update de fato persiste.
 *
 * Limites: mantém no máximo 100 registros (corta os mais antigos); nunca
 * falha a gravação do faturamento por erro de auditoria (try/catch com log).
 */
onRecordUpdate((e) => {
  try {
    const record = e.record
    const original = e.original

    const novoValor = Number(record.get('faturamento_mensal') || 0)
    const valorAnterior = Number(original.get('faturamento_mensal') || 0)

    // Sem mudança relevante no faturamento: nada a auditar.
    if (Math.abs(novoValor - valorAnterior) < 0.005) {
      return e.next()
    }

    // Usuário da requisição (quem está logado e gravando)
    const authRecord = e.requestInfo().auth
    const usuarioId = authRecord ? String(authRecord.id || 'desconhecido') : 'desconhecido'
    let usuarioNome = ''
    if (authRecord) {
      usuarioNome = String(authRecord.get('name') || authRecord.get('email') || '')
    }
    if (!usuarioNome) usuarioNome = usuarioId

    const agora = new Date().toISOString()

    const fmtBrl = function (valor) {
      return (
        'R$ ' +
        Number(valor || 0).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      )
    }

    const registro = {
      data: agora,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      acao: 'faturamento_importado',
      empresa_nome: String(record.get('nome_empresa') || ''),
      empresa_cnpj: String(record.get('cnpj') || ''),
      tipo_vinculo: '',
      detalhe_faturamento: fmtBrl(valorAnterior) + ' → ' + fmtBrl(novoValor),
    }

    // Anexa ao histórico existente (corta os mais antigos acima de 100)
    let historico = normalizar(record.get('historico_vinculos'))
    historico = historico.concat([registro])
    if (historico.length > 100) {
      historico = historico.slice(historico.length - 100)
    }
    record.set('historico_vinculos', historico)

    console.log(
      '[HISTORICO_FATURAMENTO] Auditoria gravada | registro=' +
        record.id +
        ' | usuario=' +
        usuarioNome +
        ' | ' +
        fmtBrl(valorAnterior) +
        ' -> ' +
        fmtBrl(novoValor),
    )
  } catch (err) {
    // Auditoria NUNCA pode quebrar a gravação do faturamento
    console.error('[HISTORICO_FATURAMENTO] Erro ao montar auditoria (ignorado): ' + err)
  }

  return e.next()

  // ---------------------------------------------------------------- helpers

  function normalizar(bruto) {
    if (Array.isArray(bruto)) return bruto
    if (typeof bruto === 'string' && bruto !== '') {
      try {
        const parsed = JSON.parse(bruto)
        return Array.isArray(parsed) ? parsed : []
      } catch (err) {
        return []
      }
    }
    return []
  }
}, 'clientes_empresas')
