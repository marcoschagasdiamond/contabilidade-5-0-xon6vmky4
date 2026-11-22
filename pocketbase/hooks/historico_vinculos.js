/// <reference path="../pb_data/types.d.ts" />

/**
 * Auditoria dos Vínculos Societários / Grupo Econômico.
 *
 * Sempre que o campo `vinculos_societarios` de um registro em
 * `clientes_empresas` é gravado, este hook compara com o valor anterior e
 * APPENDA em `historico_vinculos` (JSON na própria empresa) um registro por
 * vínculo adicionado ou removido, com: data/hora, usuário (id e nome), ação,
 * nome/CNPJ da empresa afetada e tipo de vínculo.
 *
 * Por que no SERVIDOR (onRecordUpdate, no ONTO): garante auditoria para
 * QUALQUER via de gravação (app, admin UI, API) e NÃO altera o fluxo do app —
 * o hook usePersistenciaVinculosSocietarios continua gravando exatamente como
 * antes. Como roda no ONTO (antes da gravação concluir), uma operação que
 * FALHA depois (validação de campo, erro de disco) não deixa registro: o
 * histórico só nasce quando o update de fato persiste.
 *
 * Limites: mantém no máximo 100 registros (corta os mais antigos); nunca
 * falha a gravação do vínculo por erro de auditoria (try/catch com log).
 */
onRecordUpdate((e) => {
  try {
    const record = e.record
    const original = e.original

    const NOVOS = normalizar(record.get('vinculos_societarios'))
    const ANTES = normalizar(original.get('vinculos_societarios'))

    // Mesma quantidade: pode ser edição de vínculo existente — compara
    // conteúdo; igual → nada a auditar.
    if (NOVOS.length === ANTES.length && serializar(ANTES) === serializar(NOVOS)) {
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

    const idsAntes = {}
    ANTES.forEach(function (v) {
      if (v && v.id) idsAntes[String(v.id)] = v
    })
    const idsNovos = {}
    NOVOS.forEach(function (v) {
      if (v && v.id) idsNovos[String(v.id)] = v
    })

    const registros = []

    // REMOVIDOS: estavam antes e não estão mais (por id).
    ANTES.forEach(function (v) {
      if (v && v.id && !idsNovos[String(v.id)]) {
        registros.push(criarRegistro('vinculo_removido', v))
      }
    })

    // ADICIONADOS: ids que não existiam antes.
    NOVOS.forEach(function (v) {
      if (v && v.id && !idsAntes[String(v.id)]) {
        registros.push(criarRegistro('vinculo_adicionado', v))
      }
    })

    if (registros.length === 0) {
      // Sem id reconhecível nas diferenças (lista legada sem id): sem como
      // nomear a empresa afetada, não audita — não polui o histórico.
      return e.next()
    }

    // Anexa ao histórico existente (corta os mais antigos acima de 100)
    let historico = normalizar(record.get('historico_vinculos'))
    historico = historico.concat(registros)
    if (historico.length > 100) {
      historico = historico.slice(historico.length - 100)
    }
    record.set('historico_vinculos', historico)

    console.log(
      '[HISTORICO_VINCULOS] Auditoria gravada | registro=' +
        record.id +
        ' | usuario=' +
        usuarioNome +
        ' | eventos=' +
        registros
          .map(function (r) {
            return r.acao + ':' + (r.empresa_nome || r.empresa_cnpj)
          })
          .join(', '),
    )
  } catch (err) {
    // Auditoria NUNCA pode quebrar a gravação dos vínculos
    console.error('[HISTORICO_VINCULOS] Erro ao montar auditoria (ignorado): ' + err)
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

  function serializar(lista) {
    return lista
      .map(function (v) {
        if (v && typeof v === 'object') {
          return [v.id, v.nomeEmpresa, v.cnpj, v.papelCliente, v.faturamentoAnual, v.excecaoLegal]
            .map(function (x) {
              return x === undefined || x === null ? '' : String(x)
            })
            .join('|')
        }
        return String(v)
      })
      .join(';;')
  }

  function criarRegistro(acao, vinculo) {
    return {
      data: agora,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      acao: acao,
      empresa_nome: vinculo.nomeEmpresa || vinculo.nome_empresa || '',
      empresa_cnpj: vinculo.cnpj || vinculo.cnpjEmpresa || '',
      tipo_vinculo: vinculo.papelCliente || vinculo.papel_cliente || '',
    }
  }
}, 'clientes_empresas')
