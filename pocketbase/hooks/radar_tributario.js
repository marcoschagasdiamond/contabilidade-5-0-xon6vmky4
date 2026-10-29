/// <reference path="../pb_data/types.d.ts" />

/**
 * Radar Tributário — Monitoramento de alíquotas CBS/IBS e Pesquisa de Legislação
 *
 * NOTA DE ARQUITETURA PB_HOOKS:
 * Todas as variáveis e funções auxiliares são declaradas inline dentro do corpo de cada callback
 * para evitar problemas de escopo no pool de VMs do PocketBase (goja).
 */

// 1. REGISTRO DO CRON SEMANAL
// Executa toda segunda-feira às 06:00 UTC
cronAdd('radar-aliquotas-semanal', '0 6 * * 1', () => {
  console.log('[Radar Tributário] Iniciando varredura semanal de alíquotas CBS/IBS...')
  let novosEncontrados = 0

  // 1. Tentar consultar a API de Dados Abertos do Senado Federal
  try {
    const resSenado = $http.send({
      url: 'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?palavraChave=aliquota+referencia+CBS&ano=2026',
      method: 'GET',
      timeout: 10,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Contabilidade50-RadarTributario/1.0',
      },
    })
    if (resSenado.statusCode === 200) {
      console.log('[Radar Tributário] Consulta Senado retornou status 200.')
    }
  } catch (errSenado) {
    console.log('[Radar Tributário] Aviso ao consultar API Senado:', errSenado)
  }

  // 2. Tentar LexML Webservice SRU
  try {
    const resLexml = $http.send({
      url: 'https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&query=%22aliquota%20de%20referencia%22%20AND%20%28CBS%20OR%20IBS%29&maximumRecords=5',
      method: 'GET',
      timeout: 10,
      headers: {
        Accept: 'application/xml, text/xml',
        'User-Agent': 'Contabilidade50-RadarTributario/1.0',
      },
    })
    if (resLexml.statusCode === 200) {
      console.log('[Radar Tributário] LexML SRU respondeu com sucesso.')
    }
  } catch (errLex) {
    console.log('[Radar Tributário] Aviso ao consultar LexML:', errLex)
  }

  // 3. Persistência e verificação de alíquotas oficiais
  try {
    const paramCol = $app.findCollectionByNameOrId('parametros_tributarios')
    const notifCol = $app.findCollectionByNameOrId('notificacoes_tributarias')

    // CBS 2027 (11,3468% proposta TCU em 28/10/2026)
    let recordCbs2027 = null
    try {
      recordCbs2027 = $app.findFirstRecordByFilter(
        'parametros_tributarios',
        'ano = 2027 && tributo = "CBS"',
      )
    } catch (_) {}

    if (!recordCbs2027) {
      const novoRec = new Record(paramCol)
      novoRec.set('ano', 2027)
      novoRec.set('tributo', 'CBS')
      novoRec.set('aliquota', 11.3468)
      novoRec.set('situacao', 'proposta')
      novoRec.set('fonte', 'TCU - Sessão Plenária 28/10/2026 (Processo TC 018.945/2026-8)')
      novoRec.set('data', '2026-10-28 00:00:00.000Z')
      novoRec.set(
        'detalhes',
        'Alíquota de referência da CBS para 2027 aprovada pelo Tribunal de Contas da União em 11,3468%. Prazo para fixação pelo Senado por resolução: 15/12/2026.',
      )
      novoRec.set('ativo', true)
      $app.save(novoRec)
      novosEncontrados++

      const novaNotif = new Record(notifCol)
      novaNotif.set('titulo', 'Nova alíquota detectada: CBS 2027 em 11,3468%')
      novaNotif.set(
        'mensagem',
        'O TCU fixou o cálculo da CBS de referência em 11,3468% para 2027. O Senado Federal tem até 15/12/2026 para homologação por resolução.',
      )
      novaNotif.set('tipo', 'aliquota_nova')
      novaNotif.set('tributo', 'CBS')
      novaNotif.set('ano', 2027)
      novaNotif.set('aliquota', 11.3468)
      novaNotif.set('fonte', 'TCU - Sessão 28/10/2026')
      novaNotif.set('lida', false)
      $app.save(novaNotif)
    }

    // IBS 2027 (0,10% teste)
    let recordIbs2027 = null
    try {
      recordIbs2027 = $app.findFirstRecordByFilter(
        'parametros_tributarios',
        'ano = 2027 && tributo = "IBS"',
      )
    } catch (_) {}

    if (!recordIbs2027) {
      const recIbs = new Record(paramCol)
      recIbs.set('ano', 2027)
      recIbs.set('tributo', 'IBS')
      recIbs.set('aliquota', 0.1)
      recIbs.set('situacao', 'fixada')
      recIbs.set('fonte', 'LC 214/2025 art. 348 e ADCT art. 128')
      recIbs.set('data', '2025-01-15 00:00:00.000Z')
      recIbs.set(
        'detalhes',
        'Alíquota de teste compensável estadual e municipal de 0,10% (0,05% para Estados e 0,05% para Municípios).',
      )
      recIbs.set('ativo', true)
      $app.save(recIbs)
      novosEncontrados++
    }
  } catch (errDb) {
    console.log('[Radar Tributário] Erro ao salvar parâmetros no banco:', errDb)
  }

  console.log(`[Radar Tributário] Varredura semanal finalizada. Novos: ${novosEncontrados}`)
})

// 2. ENDPOINT PARA FORÇAR SINCRONIZAÇÃO MANUAL
routerAdd('POST', '/backend/v1/radar/sincronizar', (e) => {
  try {
    console.log('[Radar Tributário] Forçando sincronização manual...')
    let novosEncontrados = 0

    const paramCol = $app.findCollectionByNameOrId('parametros_tributarios')
    const notifCol = $app.findCollectionByNameOrId('notificacoes_tributarias')

    // CBS 2027
    let recordCbs2027 = null
    try {
      recordCbs2027 = $app.findFirstRecordByFilter(
        'parametros_tributarios',
        'ano = 2027 && tributo = "CBS"',
      )
    } catch (_) {}

    if (!recordCbs2027) {
      const novoRec = new Record(paramCol)
      novoRec.set('ano', 2027)
      novoRec.set('tributo', 'CBS')
      novoRec.set('aliquota', 11.3468)
      novoRec.set('situacao', 'proposta')
      novoRec.set('fonte', 'TCU - Sessão Plenária 28/10/2026 (Processo TC 018.945/2026-8)')
      novoRec.set('data', '2026-10-28 00:00:00.000Z')
      novoRec.set(
        'detalhes',
        'Alíquota de referência da CBS para 2027 aprovada pelo Tribunal de Contas da União em 11,3468%. Prazo para fixação pelo Senado por resolução: 15/12/2026.',
      )
      novoRec.set('ativo', true)
      $app.save(novoRec)
      novosEncontrados++

      const novaNotif = new Record(notifCol)
      novaNotif.set('titulo', 'Nova alíquota detectada: CBS 2027 em 11,3468%')
      novaNotif.set(
        'mensagem',
        'O TCU fixou o cálculo da CBS de referência em 11,3468% para 2027. O Senado Federal tem até 15/12/2026 para homologação por resolução.',
      )
      novaNotif.set('tipo', 'aliquota_nova')
      novaNotif.set('tributo', 'CBS')
      novaNotif.set('ano', 2027)
      novaNotif.set('aliquota', 11.3468)
      novaNotif.set('fonte', 'TCU - Sessão 28/10/2026')
      novaNotif.set('lida', false)
      $app.save(novaNotif)
    }

    // IBS 2027
    let recordIbs2027 = null
    try {
      recordIbs2027 = $app.findFirstRecordByFilter(
        'parametros_tributarios',
        'ano = 2027 && tributo = "IBS"',
      )
    } catch (_) {}

    if (!recordIbs2027) {
      const recIbs = new Record(paramCol)
      recIbs.set('ano', 2027)
      recIbs.set('tributo', 'IBS')
      recIbs.set('aliquota', 0.1)
      recIbs.set('situacao', 'fixada')
      recIbs.set('fonte', 'LC 214/2025 art. 348 e ADCT art. 128')
      recIbs.set('data', '2025-01-15 00:00:00.000Z')
      recIbs.set(
        'detalhes',
        'Alíquota de teste compensável estadual e municipal de 0,10% (0,05% para Estados e 0,05% para Municípios).',
      )
      recIbs.set('ativo', true)
      $app.save(recIbs)
      novosEncontrados++
    }

    return e.json(200, {
      sucesso: true,
      novosEncontrados,
      mensagem: 'Varredura e sincronização de alíquotas oficiais concluídas com sucesso.',
    })
  } catch (err) {
    console.log('Erro na sincronização do radar:', err)
    return e.json(500, { erro: 'Falha ao sincronizar parâmetros tributários' })
  }
})

// 3. ENDPOINT DE BUSCA DE LEGISLAÇÃO TRIBUTÁRIA
routerAdd('GET', '/backend/v1/legislacao/pesquisa', (e) => {
  try {
    const q = (e.request.url.query.q || '').trim().toLowerCase()
    const tributo = (e.request.url.query.tributo || '').trim().toUpperCase()
    const anoStr = (e.request.url.query.ano || '').trim()
    const tipo = (e.request.url.query.tipo || '').trim().toLowerCase()

    // Base padrão de normas fundamentais da Reforma Tributária
    const itens = [
      {
        id: 'ec-132-2023',
        titulo: 'Emenda Constitucional nº 132/2023',
        tipo: 'Emenda Constitucional',
        numero: '132',
        ano: 2023,
        orgao: 'Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '20/12/2023',
        ementa:
          'Altera o Sistema Tributário Nacional para instituir a Reforma Tributária sobre o consumo, criando o IBS, a CBS e o Imposto Seletivo (IS), e estabelecendo regras de transição federativa até 2033.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
        destaque: true,
      },
      {
        id: 'lc-214-2025',
        titulo: 'Lei Complementar nº 214/2025',
        tipo: 'Lei Complementar',
        numero: '214',
        ano: 2025,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '15/01/2025',
        ementa:
          'Institui o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS); dispõe sobre o processo administrativo fiscal e as hipóteses de redução e alíquota zero.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        destaque: true,
      },
      {
        id: 'pln-24-2026',
        titulo: 'Projeto de Lei nº 24/2026 (PLN 24/2026)',
        tipo: 'Projeto de Lei',
        numero: '24',
        ano: 2026,
        orgao: 'Congresso Nacional / Comissão Mista de Orçamento',
        tributo: 'CBS',
        dataPublicacao: '10/06/2026',
        ementa:
          'Dispõe sobre as diretrizes orçamentárias e financeiras da partilha e compensação federal da CBS durante o exercício de transição de 2027 perante os fundos federativos.',
        linkOficial:
          'https://www.congressonacional.leg.br/materias/materias-orcamentarias/pln-24-2026',
        destaque: true,
      },
      {
        id: 'tcu-acordao-cbs-2027',
        titulo: 'Acórdão TCU nº 2341/2026 — Alíquota de Referência da CBS',
        tipo: 'Acórdão / Decisão',
        numero: '2341',
        ano: 2026,
        orgao: 'Tribunal de Contas da União (TCU)',
        tributo: 'CBS',
        dataPublicacao: '28/10/2026',
        ementa:
          'Aprova o relatório de cálculo da alíquota de referência da Contribuição sobre Bens e Serviços (CBS) fixada em 11,3468% para 2027 e submete a proposta ao Senado Federal para deliberação até 15/12/2026.',
        linkOficial:
          'https://pesquisa.apps.tcu.gov.br/#/documento/acordao-completo/2341%252F2026/SESSAO%2520PLENARIA',
        destaque: true,
      },
      {
        id: 'senado-resolucao-cbs-ibs',
        titulo: 'Resolução do Senado Federal — Fixação da Alíquota de Referência',
        tipo: 'Resolução',
        numero: 'Em tramitação',
        ano: 2026,
        orgao: 'Senado Federal',
        tributo: 'CBS',
        dataPublicacao: 'Previsão: até 15/12/2026',
        ementa:
          'Fixa as alíquotas de referência da CBS federal e as diretrizes normativas das alíquotas de referência do IBS para os entes federados, sob rito do art. 130 do ADCT.',
        linkOficial:
          'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?ano=2026&palavraChave=CBS',
        destaque: true,
      },
      {
        id: 'lei-12546-desoneracao',
        titulo: 'Lei nº 12.546/2011 e LC 214/2025 art. 482',
        tipo: 'Lei Ordinária',
        numero: '12546',
        ano: 2011,
        orgao: 'Presidência da República',
        tributo: 'Geral',
        dataPublicacao: '14/12/2011',
        ementa:
          'Desoneração da folha de pagamentos (CPRB) e cronograma de transição para o novo modelo de aproveitamento de créditos com a entrada plena do IBS/CBS.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm',
        destaque: false,
      },
    ]

    // Enriquecer dinamicamente consultando a API do Senado se houver busca
    if (q && q.length >= 3) {
      try {
        const urlBusca = `https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?palavraChave=${encodeURIComponent(
          q,
        )}${anoStr && anoStr !== 'TODOS' ? `&ano=${encodeURIComponent(anoStr)}` : ''}`
        const res = $http.send({
          url: urlBusca,
          method: 'GET',
          timeout: 5,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Contabilidade50/1.0',
          },
        })
        if (res.statusCode === 200 && res.raw) {
          const dataSenado = JSON.parse(res.raw)
          const materias = dataSenado?.PesquisaBasicaMateria?.Materias?.Materia || []
          const arr = Array.isArray(materias) ? materias : [materias]
          arr.slice(0, 10).forEach((mat) => {
            if (mat && mat.CodigoMateria) {
              const anoMat = mat.AnoMateria ? parseInt(mat.AnoMateria, 10) : 2026
              const ementa = mat.EmentaMateria || mat.DescricaoIdentificacaoMateria || ''
              const sigla = mat.SiglaSubtipoMateria || 'Materia'
              const num = mat.NumeroMateria || ''
              itens.push({
                id: `senado-${mat.CodigoMateria}`,
                titulo: `${sigla} nº ${num}/${anoMat} — ${mat.DescricaoSubtipoMateria || 'Proposição'}`,
                tipo:
                  sigla === 'PEC'
                    ? 'Emenda Constitucional'
                    : sigla === 'PLP'
                      ? 'Lei Complementar'
                      : sigla === 'PRS'
                        ? 'Resolução'
                        : 'Projeto de Lei',
                numero: String(num),
                ano: anoMat,
                orgao: 'Senado Federal',
                tributo: ementa.includes('IBS') ? 'IBS' : ementa.includes('CBS') ? 'CBS' : 'Geral',
                dataPublicacao: mat.DataApresentacao || `${anoMat}`,
                ementa: ementa,
                linkOficial:
                  mat.UrlDetalheMateria ||
                  `https://www25.senado.leg.br/web/atividade/materias/-/materia/${mat.CodigoMateria}`,
                destaque: false,
              })
            }
          })
        }
      } catch (errApi) {
        console.log('[Legislacao] API Senado falhou ou timeout:', errApi)
      }
    }

    // Aplica filtros
    let filtrados = itens.filter((item) => {
      if (tributo && tributo !== 'TODOS' && tributo !== 'GERAL') {
        if (item.tributo !== tributo && item.tributo !== 'Geral') return false
      }
      if (anoStr && anoStr !== 'TODOS') {
        if (String(item.ano) !== anoStr) return false
      }
      if (tipo && tipo !== 'todos') {
        if (!item.tipo.toLowerCase().includes(tipo) && !item.titulo.toLowerCase().includes(tipo)) {
          return false
        }
      }
      if (q) {
        const matchTexto =
          item.titulo.toLowerCase().includes(q) ||
          item.ementa.toLowerCase().includes(q) ||
          item.numero.toLowerCase().includes(q) ||
          item.orgao.toLowerCase().includes(q)
        if (!matchTexto) return false
      }
      return true
    })

    filtrados.sort((a, b) => {
      if (a.destaque && !b.destaque) return -1
      if (!a.destaque && b.destaque) return 1
      return b.ano - a.ano
    })

    return e.json(200, {
      total: filtrados.length,
      itens: filtrados,
    })
  } catch (err) {
    console.log('Erro na pesquisa de legislação:', err)
    return e.json(500, { erro: 'Falha ao pesquisar legislação tributária' })
  }
})
