/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Consulta Externa de CNAE (Contabilidade 5.0)
 *
 * Rotas proxy:
 *  1. GET /backend/v1/cnae/codigo/{codigo}  -> Busca CNAE pelo código numérico (ex: 6201501 ou 6201-5/01)
 *  2. GET /backend/v1/cnae/busca           -> Busca CNAE por termo ou código via query param ?q=
 *
 * Fontes:
 *  - IBGE Serviço de Dados (servicodados.ibge.gov.br/api/v2/cnae/subclasses)
 *  - BrasilAPI (brasilapi.com.br/api/ibge/cnae/v1/classes)
 *
 * NOTA: Conforme requisitos do PocketBase JSVM, todas as funções auxiliares
 * devem ficar inlined dentro de cada callback para evitar Hook Scoping Error.
 */

routerAdd('GET', '/backend/v1/cnae/codigo/{codigo}', (e) => {
  const formatarCodigoCnae = (codigo) => {
    const limpo = String(codigo || '').replace(/\D/g, '')
    if (limpo.length === 7) {
      return `${limpo.slice(0, 4)}-${limpo.slice(4, 5)}/${limpo.slice(5, 7)}`
    }
    return limpo
  }

  try {
    const rawCodigo = e.request.pathValue('codigo') || ''
    const codLimpo = rawCodigo.replace(/\D/g, '')

    if (codLimpo.length < 4 || codLimpo.length > 7) {
      return e.json(400, {
        sucesso: false,
        erro: 'Código CNAE inválido. O código deve ter entre 4 e 7 dígitos.',
      })
    }

    // 1. Tentar IBGE subclasses
    try {
      const resIbge = $http.send({
        url: `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${codLimpo}`,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 10,
      })

      if (resIbge.statusCode === 200 && resIbge.json) {
        const item = Array.isArray(resIbge.json) ? resIbge.json[0] : resIbge.json
        if (item && item.id) {
          const classe = item.classe || {}
          const grupo = classe.grupo || {}
          const divisao = grupo.divisao || {}
          const secao = divisao.secao || {}

          return e.json(200, {
            sucesso: true,
            provedor: 'ibge',
            dados: {
              codigo: String(item.id),
              codigoFormatado: formatarCodigoCnae(String(item.id)),
              descricao: item.descricao || '',
              classeCodigo: classe.id ? String(classe.id) : '',
              classeDescricao: classe.descricao || '',
              grupoCodigo: grupo.id ? String(grupo.id) : '',
              grupoDescricao: grupo.descricao || '',
              divisaoCodigo: divisao.id ? String(divisao.id) : '',
              divisaoDescricao: divisao.descricao || '',
              secaoCodigo: secao.id ? String(secao.id) : '',
              secaoDescricao: secao.descricao || '',
            },
          })
        }
      }
    } catch (errIbge) {
      console.log('[Proxy CNAE] Erro ao consultar IBGE por código:', errIbge)
    }

    // 2. Se for código de 5 dígitos (classe), tentar BrasilAPI
    if (codLimpo.length === 5) {
      try {
        const resBrasil = $http.send({
          url: `https://brasilapi.com.br/api/ibge/cnae/v1/classes/${codLimpo}`,
          method: 'GET',
          headers: { Accept: 'application/json' },
          timeout: 10,
        })

        if (resBrasil.statusCode === 200 && resBrasil.json) {
          const item = Array.isArray(resBrasil.json) ? resBrasil.json[0] : resBrasil.json
          if (item && item.id) {
            const grupo = item.grupo || {}
            const divisao = grupo.divisao || {}
            const secao = divisao.secao || {}

            return e.json(200, {
              sucesso: true,
              provedor: 'brasilapi',
              dados: {
                codigo: String(item.id),
                codigoFormatado: String(item.id),
                descricao: item.descricao || '',
                classeCodigo: String(item.id),
                classeDescricao: item.descricao || '',
                grupoCodigo: grupo.id ? String(grupo.id) : '',
                grupoDescricao: grupo.descricao || '',
                divisaoCodigo: divisao.id ? String(divisao.id) : '',
                divisaoDescricao: divisao.descricao || '',
                secaoCodigo: secao.id ? String(secao.id) : '',
                secaoDescricao: secao.descricao || '',
              },
            })
          }
        }
      } catch (errBrasil) {
        console.log('[Proxy CNAE] Erro ao consultar BrasilAPI por classe:', errBrasil)
      }
    }

    return e.json(404, {
      sucesso: false,
      erro: `Nenhum CNAE encontrado para o código ${codLimpo}.`,
    })
  } catch (errGeral) {
    console.log('[Proxy CNAE] Erro geral ao consultar código:', errGeral)
    return e.json(500, {
      sucesso: false,
      erro: 'Erro interno ao consultar CNAE por código.',
    })
  }
})

routerAdd('GET', '/backend/v1/cnae/busca', (e) => {
  const formatarCodigoCnae = (codigo) => {
    const limpo = String(codigo || '').replace(/\D/g, '')
    if (limpo.length === 7) {
      return `${limpo.slice(0, 4)}-${limpo.slice(4, 5)}/${limpo.slice(5, 7)}`
    }
    return limpo
  }

  const normalizarTexto = (str) => {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  const extrairDadosCnae = (item) => {
    const classe = item.classe || {}
    const grupo = classe.grupo || {}
    const divisao = grupo.divisao || {}
    const secao = divisao.secao || {}

    const idStr = String(item.id || '')
    return {
      codigo: idStr,
      codigoFormatado: formatarCodigoCnae(idStr),
      descricao: (item.descricao || '').trim(),
      classeCodigo: classe.id ? String(classe.id) : '',
      classeDescricao: classe.descricao || '',
      grupoCodigo: grupo.id ? String(grupo.id) : '',
      grupoDescricao: grupo.descricao || '',
      divisaoCodigo: divisao.id ? String(divisao.id) : '',
      divisaoDescricao: divisao.descricao || '',
      secaoCodigo: secao.id ? String(secao.id) : '',
      secaoDescricao: secao.descricao || '',
    }
  }

  try {
    const termo = (e.request.url.query().get('q') || '').trim()

    if (!termo || termo.length < 2) {
      return e.json(400, {
        sucesso: false,
        erro: 'Informe pelo menos 2 caracteres para realizar a busca de CNAE.',
      })
    }

    const codNumerico = termo.replace(/\D/g, '')

    // Se o termo for prioritariamente numérico (>= 4 dígitos), tenta buscar pelo código primeiro
    if (codNumerico.length >= 4 && codNumerico.length <= 7) {
      try {
        const resIbge = $http.send({
          url: `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${codNumerico}`,
          method: 'GET',
          headers: { Accept: 'application/json' },
          timeout: 10,
        })

        if (resIbge.statusCode === 200 && resIbge.json) {
          const itens = Array.isArray(resIbge.json) ? resIbge.json : [resIbge.json]
          const formatados = itens.filter((it) => it && it.id).map((it) => extrairDadosCnae(it))

          if (formatados.length > 0) {
            return e.json(200, {
              sucesso: true,
              provedor: 'ibge',
              total: formatados.length,
              itens: formatados,
            })
          }
        }
      } catch (errCod) {
        console.log('[Proxy CNAE] Erro ao buscar código no endpoint de busca:', errCod)
      }
    }

    // Busca textual no IBGE
    try {
      const resIbge = $http.send({
        url: 'https://servicodados.ibge.gov.br/api/v2/cnae/subclasses',
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 15,
      })

      if (resIbge.statusCode === 200 && Array.isArray(resIbge.json)) {
        const termoNorm = normalizarTexto(termo)
        const partesTermo = termoNorm.split(/\s+/).filter(Boolean)

        const filtrados = []
        for (let i = 0; i < resIbge.json.length; i++) {
          const item = resIbge.json[i]
          if (!item || !item.id) continue

          const idStr = String(item.id)
          const descNorm = normalizarTexto(item.descricao || '')

          const codigoMatch = codNumerico.length >= 3 && idStr.includes(codNumerico)
          const descMatch = partesTermo.length > 0 && partesTermo.every((p) => descNorm.includes(p))

          if (codigoMatch || descMatch) {
            filtrados.push(extrairDadosCnae(item))
            if (filtrados.length >= 25) break
          }
        }

        return e.json(200, {
          sucesso: true,
          provedor: 'ibge',
          total: filtrados.length,
          itens: filtrados,
        })
      }
    } catch (errBusca) {
      console.log('[Proxy CNAE] Erro ao buscar subclasses completas no IBGE:', errBusca)
    }

    return e.json(502, {
      sucesso: false,
      erro: 'Serviço público de CNAE temporariamente indisponível. Tente novamente em instantes.',
    })
  } catch (errGeral) {
    console.log('[Proxy CNAE] Erro fatal no endpoint de busca:', errGeral)
    return e.json(500, {
      sucesso: false,
      erro: 'Erro interno ao processar a busca de CNAE.',
    })
  }
})
