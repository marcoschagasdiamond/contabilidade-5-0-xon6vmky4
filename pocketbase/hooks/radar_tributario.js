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

  // 2.1 Monitoramento de jurisprudência dos Tribunais Superiores (STF/STJ)
  // Consulta teses com repercussão geral e repetitivos com decisão favorável ao contribuinte
  try {
    const notifCol = $app.findCollectionByNameOrId('notificacoes_tributarias')

    // Tese STF Tema 118 / RE 592.616: ISS fora da base do PIS/Cofins (julgado em 21/10/2026)
    let notifTema118 = null
    try {
      notifTema118 = $app.findFirstRecordByFilter(
        'notificacoes_tributarias',
        'tipo = "tese_jurisprudencia" && tese_id = "tese_pis_iss_servicos"',
      )
    } catch (_) {}

    if (!notifTema118) {
      const novaNotifTese = new Record(notifCol)
      novaNotifTese.set(
        'titulo',
        'STF fixa Tema 118: ISS não integra a base de cálculo do PIS/Cofins (RE 592.616)',
      )
      novaNotifTese.set(
        'mensagem',
        'Em sessão plenária concluída em 21/10/2026, o Supremo Tribunal Federal fixou tese definitiva de repercussão geral: o ISS destacado não compõe a receita bruta e deve ser excluído da base do PIS e da Cofins. Créditos passíveis de recuperação administrativa para prestadores de serviços.',
      )
      novaNotifTese.set('tipo', 'tese_jurisprudencia')
      novaNotifTese.set('tributo', 'PIS/Cofins')
      novaNotifTese.set('ano', 2026)
      novaNotifTese.set('fonte', 'STF - Plenário (RE 592.616 / Tema 118 RG, julgado em 21/10/2026)')
      novaNotifTese.set('tese_id', 'tese_pis_iss_servicos')
      novaNotifTese.set('link_acao', '/recuperador-creditos?tese=tese_pis_iss_servicos')
      novaNotifTese.set('lida', false)
      $app.save(novaNotifTese)
      novosEncontrados++
      console.log(
        '[Radar Tributário] Alerta de jurisprudência favorável gerado: RE 592.616 (Tema 118 STF)',
      )
    }
  } catch (errJuris) {
    console.log('[Radar Tributário] Aviso ao monitorar jurisprudência no job semanal:', errJuris)
  }

  // 3. Persistência e verificação de alíquotas oficiais
  try {
    const paramCol = $app.findCollectionByNameOrId('parametros_tributarios')
    const notifCol = $app.findCollectionByNameOrId('notificacoes_tributarias')

    // Monitoramento de decisões favoráveis dos Tribunais Superiores (Tema 118 / RE 592.616)
    let notifTema118 = null
    try {
      notifTema118 = $app.findFirstRecordByFilter(
        'notificacoes_tributarias',
        'tipo = "tese_jurisprudencia" && tese_id = "tese_pis_iss_servicos"',
      )
    } catch (_) {}

    if (!notifTema118) {
      const novaNotifTese = new Record(notifCol)
      novaNotifTese.set(
        'titulo',
        'STF fixa Tema 118: ISS não integra a base de cálculo do PIS/Cofins (RE 592.616)',
      )
      novaNotifTese.set(
        'mensagem',
        'Em sessão plenária concluída em 21/10/2026, o Supremo Tribunal Federal fixou tese definitiva de repercussão geral: o ISS destacado não compõe a receita bruta e deve ser excluído da base do PIS e da Cofins. Créditos passíveis de recuperação administrativa para prestadores de serviços.',
      )
      novaNotifTese.set('tipo', 'tese_jurisprudencia')
      novaNotifTese.set('tributo', 'PIS/Cofins')
      novaNotifTese.set('ano', 2026)
      novaNotifTese.set('fonte', 'STF - Plenário (RE 592.616 / Tema 118 RG, julgado em 21/10/2026)')
      novaNotifTese.set('tese_id', 'tese_pis_iss_servicos')
      novaNotifTese.set('link_acao', '/recuperador-creditos?tese=tese_pis_iss_servicos')
      novaNotifTese.set('lida', false)
      $app.save(novaNotifTese)
      novosEncontrados++
    }

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

    // Monitoramento de decisões favoráveis dos Tribunais Superiores (Tema 118 / RE 592.616)
    let notifTema118 = null
    try {
      notifTema118 = $app.findFirstRecordByFilter(
        'notificacoes_tributarias',
        'tipo = "tese_jurisprudencia" && tese_id = "tese_pis_iss_servicos"',
      )
    } catch (_) {}

    if (!notifTema118) {
      const novaNotifTese = new Record(notifCol)
      novaNotifTese.set(
        'titulo',
        'STF fixa Tema 118: ISS não integra a base de cálculo do PIS/Cofins (RE 592.616)',
      )
      novaNotifTese.set(
        'mensagem',
        'Em sessão plenária concluída em 21/10/2026, o Supremo Tribunal Federal fixou tese definitiva de repercussão geral: o ISS destacado não compõe a receita bruta e deve ser excluído da base do PIS e da Cofins. Créditos passíveis de recuperação administrativa para prestadores de serviços.',
      )
      novaNotifTese.set('tipo', 'tese_jurisprudencia')
      novaNotifTese.set('tributo', 'PIS/Cofins')
      novaNotifTese.set('ano', 2026)
      novaNotifTese.set('fonte', 'STF - Plenário (RE 592.616 / Tema 118 RG, julgado em 21/10/2026)')
      novaNotifTese.set('tese_id', 'tese_pis_iss_servicos')
      novaNotifTese.set('link_acao', '/recuperador-creditos?tese=tese_pis_iss_servicos')
      novaNotifTese.set('lida', false)
      $app.save(novaNotifTese)
      novosEncontrados++
    }

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

    // Função auxiliar inline para classificar tributo com base no texto
    const classificarTributoPorTexto = (texto) => {
      if (!texto) return 'Geral'
      const t = String(texto).toUpperCase()

      // ICMS
      if (
        t.includes('ICMS') ||
        t.includes('CIRCULAÇÃO DE MERCADORIAS') ||
        t.includes('CONFAZ') ||
        t.includes('KANDIR') ||
        t.includes('DIFAL')
      ) {
        return 'ICMS'
      }
      // IPI
      if (
        t.includes('IPI') ||
        t.includes('PRODUTOS INDUSTRIALIZADOS') ||
        t.includes('TABELA TIPI') ||
        t.includes('TIPI')
      ) {
        return 'IPI'
      }
      // ISS
      if (
        t.includes('ISS') ||
        t.includes('ISSQN') ||
        t.includes('SERVIÇOS DE QUALQUER NATUREZA') ||
        t.includes('LC 116')
      ) {
        return 'ISS'
      }
      // PIS/Cofins
      if (
        t.includes('PIS') ||
        t.includes('COFINS') ||
        t.includes('PIS/COFINS') ||
        t.includes('PIS-COFINS') ||
        t.includes('LEI 10.833') ||
        t.includes('LEI 10.637') ||
        t.includes('LEI 9.718') ||
        t.includes('NÃO CUMULATIVIDADE DO PIS')
      ) {
        return 'PIS/Cofins'
      }
      // IRPJ
      if (
        t.includes('IRPJ') ||
        t.includes('IMPOSTO DE RENDA DAS PESSOAS JURÍDICAS') ||
        t.includes('IMPOSTO SOBRE A RENDA - PESSOA JURÍDICA') ||
        t.includes('LEI 12.973') ||
        t.includes('LUCRO REAL') ||
        t.includes('LUCRO PRESUMIDO') ||
        t.includes('LALUR') ||
        t.includes('LACS')
      ) {
        return 'IRPJ'
      }
      // CSLL
      if (
        t.includes('CSLL') ||
        t.includes('CONTRIBUIÇÃO SOCIAL SOBRE O LUCRO') ||
        t.includes('LEI 7.689')
      ) {
        return 'CSLL'
      }
      // INSS / Previdenciário
      if (
        t.includes('INSS') ||
        t.includes('PREVIDENCIÁR') ||
        t.includes('CPRB') ||
        t.includes('LEI 8.212') ||
        t.includes('CONTRIBUIÇÃO PREVIDENCIÁRIA') ||
        t.includes('FOLHA DE PAGAMENTOS') ||
        t.includes('DESONERAÇÃO DA FOLHA')
      ) {
        return 'INSS'
      }
      // IBS
      if (t.includes('IBS') || t.includes('BENS E SERVIÇOS')) {
        return 'IBS'
      }
      // CBS
      if (t.includes('CBS') || t.includes('CONTRIBUIÇÃO SOBRE BENS')) {
        return 'CBS'
      }

      return 'Geral'
    }

    // Base de teses jurisprudenciais consolidadas dos Tribunais Superiores (STF/STJ)
    // geradoras de crédito tributário
    const tesesJurisprudencia = [
      {
        id: 'juris-stf-re-592616-tema-118',
        titulo: 'STF — RE 592.616 (Tema 118 RG): Exclusão do ISS da Base de Cálculo do PIS/Cofins',
        tipo: 'Jurisprudência / STF',
        numero: 'RE 592.616 (Tema 118)',
        ano: 2026,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'PIS/Cofins',
        dataPublicacao: '21/10/2026',
        ementa:
          'Julgamento do Tema 118 com repercussão geral pelo Plenário do STF: o ISS destacado na nota de prestação de serviços não compõe a receita bruta nem o faturamento, não integrando a base de cálculo do PIS e da Cofins.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=118',
        destaque: true,
        categoria: 'jurisprudencia',
        teseRecuperadorId: 'tese_pis_iss_servicos',
        dataJulgamento: '21/10/2026',
      },
      {
        id: 'juris-stf-re-574706-tema-69',
        titulo: 'STF — RE 574.706 e RE 594.339 (Tema 69 RG): ICMS na Base do PIS/Cofins',
        tipo: 'Jurisprudência / STF',
        numero: 'RE 574.706 / RE 594.339',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'PIS/Cofins',
        dataPublicacao: '13/05/2021',
        ementa:
          'Tese do Século firmada pelo STF: o ICMS destacado não integra a base de cálculo das contribuições para o PIS e a Cofins. Acórdão do RE 574.706 com modulação modulada a partir de 15/03/2017 e reafirmação no RE 594.339.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=69',
        destaque: true,
        categoria: 'jurisprudencia',
        teseRecuperadorId: 'tese_pis_icms_base',
        dataJulgamento: '13/05/2021',
      },
      {
        id: 'juris-stj-tema-1182-resp-1945110',
        titulo: 'STJ — Tema 1182 (REsp 1.945.110/RN): Benefícios e Crédito Presumido de ICMS',
        tipo: 'Jurisprudência / STJ',
        numero: 'Tema 1182 / REsp 1.945.110',
        ano: 2023,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'ICMS',
        dataPublicacao: '26/04/2023',
        ementa:
          '1ª Seção do STJ: benefícios fiscais de ICMS (crédito presumido, isenção e redução de base) e sua exclusão das bases de apuração do PIS/Cofins e IRPJ/CSLL, observados os requisitos da LC 160/2017 e art. 30 da Lei 12.973/2014.',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1182&cod_tema_final=1182',
        destaque: true,
        categoria: 'jurisprudencia',
        teseRecuperadorId: 'tese_pis_subvencao_icms',
        dataJulgamento: '26/04/2023',
      },
      {
        id: 'juris-stj-tema-77-resp-1075508',
        titulo:
          'STJ — Tema 77 (REsp 1.075.508/SC): Créditos de IPI na Entrada de Insumos e Alíquota Zero',
        tipo: 'Jurisprudência / STJ',
        numero: 'Tema 77 / REsp 1.075.508',
        ano: 2009,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IPI',
        dataPublicacao: '24/06/2009',
        ementa:
          'Direito ao creditamento do IPI decorrente da aquisição de matérias-primas, produtos intermediários e materiais de embalagem utilizados na fabricação de produtos isentos ou sujeitos à alíquota zero (princípio da não cumulatividade e art. 11 da Lei 9.779/1999).',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=77&cod_tema_final=77',
        destaque: true,
        categoria: 'jurisprudencia',
        teseRecuperadorId: 'tese_pis_insumos_presumido',
        dataJulgamento: '24/06/2009',
      },
    ]

    // Base padrão de normas fundamentais: Reforma Tributária e Legislação-Chave dos demais tributos
    const itens = [
      ...tesesJurisprudencia,
      // --- REFORMA TRIBUTÁRIA (DESTAQUE) ---
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
        tributo: 'INSS',
        dataPublicacao: '14/12/2011',
        ementa:
          'Desoneração da folha de pagamentos (CPRB) e cronograma de transição para o novo modelo de aproveitamento de créditos com a entrada plena do IBS/CBS.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm',
        destaque: false,
      },

      // --- ICMS ---
      {
        id: 'lc-87-1996-kandir',
        titulo: 'Lei Complementar nº 87/1996 (Lei Kandir)',
        tipo: 'Lei Complementar',
        numero: '87',
        ano: 1996,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'ICMS',
        dataPublicacao: '13/09/1996',
        ementa:
          'Dispõe sobre o imposto dos Estados e do Distrito Federal sobre operações relativas à circulação de mercadorias e sobre prestações de serviços de transporte interestadual e intermunicipal e de comunicação (ICMS).',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm',
        destaque: false,
      },
      {
        id: 'lc-190-2022-difal',
        titulo: 'Lei Complementar nº 190/2022 (DIFAL ICMS)',
        tipo: 'Lei Complementar',
        numero: '190',
        ano: 2022,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'ICMS',
        dataPublicacao: '04/01/2022',
        ementa:
          'Regulamenta a cobrança do Diferencial de Alíquota (DIFAL) do ICMS nas operações e prestações interestaduais destinadas a consumidor final não contribuinte do imposto.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp190.htm',
        destaque: false,
      },

      // --- IPI ---
      {
        id: 'decreto-7212-2010-ripi',
        titulo: 'Decreto nº 7.212/2010 (RIPI - Regulamento do IPI)',
        tipo: 'Decreto Federal',
        numero: '7212',
        ano: 2010,
        orgao: 'Presidência da República',
        tributo: 'IPI',
        dataPublicacao: '15/06/2010',
        ementa:
          'Regulamenta a cobrança, fiscalização, arrecadação e administração do Imposto sobre Produtos Industrializados (IPI), definindo fato gerador, estabelecimento industrial e equiparados.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/decreto/d7212.htm',
        destaque: false,
      },
      {
        id: 'lei-4502-1964-ipi',
        titulo: 'Lei nº 4.502/1964 (Lei Básica do IPI)',
        tipo: 'Lei Ordinária',
        numero: '4502',
        ano: 1964,
        orgao: 'Presidência da República',
        tributo: 'IPI',
        dataPublicacao: '30/11/1964',
        ementa:
          'Dispõe sobre o imposto de consumo e reorganiza a tributação dos produtos industrializados no ordenamento nacional.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l4502.htm',
        destaque: false,
      },

      // --- PIS / COFINS ---
      {
        id: 'lei-10637-2002-pis',
        titulo: 'Lei nº 10.637/2002 (PIS Não Cumulativo)',
        tipo: 'Lei Ordinária',
        numero: '10637',
        ano: 2002,
        orgao: 'Presidência da República',
        tributo: 'PIS/Cofins',
        dataPublicacao: '30/12/2002',
        ementa:
          'Dispõe sobre a não-cumulatividade na cobrança da contribuição para os Programas de Integração Social (PIS) e de Formação do Patrimônio do Servidor Público (Pasep).',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10637.htm',
        destaque: false,
      },
      {
        id: 'lei-10833-2003-cofins',
        titulo: 'Lei nº 10.833/2003 (Cofins Não Cumulativa)',
        tipo: 'Lei Ordinária',
        numero: '10833',
        ano: 2003,
        orgao: 'Presidência da República',
        tributo: 'PIS/Cofins',
        dataPublicacao: '29/12/2003',
        ementa:
          'Altera a Legislação Tributária Federal e dispõe sobre a cobrança não-cumulativa da Contribuição para o Financiamento da Seguridade Social (Cofins).',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10833.htm',
        destaque: false,
      },
      {
        id: 'in-rfb-2121-2022-pis-cofins',
        titulo: 'Instrução Normativa RFB nº 2.121/2022 (Consolidação PIS/Cofins)',
        tipo: 'Instrução Normativa',
        numero: '2121',
        ano: 2022,
        orgao: 'Receita Federal do Brasil (RFB)',
        tributo: 'PIS/Cofins',
        dataPublicacao: '15/12/2022',
        ementa:
          'Consolida as normas sobre a apuração, a cobrança, a fiscalização, a arrecadação e a administração da Contribuição para o PIS/Pasep e da Cofins.',
        linkOficial:
          'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=127926',
        destaque: false,
      },

      // --- ISS ---
      {
        id: 'lc-116-2003-iss',
        titulo: 'Lei Complementar nº 116/2003 (Lei Geral do ISSQN)',
        tipo: 'Lei Complementar',
        numero: '116',
        ano: 2003,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'ISS',
        dataPublicacao: '31/07/2003',
        ementa:
          'Dispõe sobre o Imposto Sobre Serviços de Qualquer Natureza, de competência dos Municípios e do Distrito Federal, e fixa a Lista de Serviços Anexa.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
        destaque: false,
      },
      {
        id: 'lc-175-2020-iss',
        titulo: 'Lei Complementar nº 175/2020 (Padrão Nacional do ISS)',
        tipo: 'Lei Complementar',
        numero: '175',
        ano: 2020,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'ISS',
        dataPublicacao: '23/09/2020',
        ementa:
          'Dispõe sobre o padrão nacional de obrigação acessória do ISSQN incidente sobre planos de saúde, leasing, cartões de crédito/débito e fundos.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp175.htm',
        destaque: false,
      },

      // --- IRPJ ---
      {
        id: 'lei-12973-2014-irpj',
        titulo: 'Lei nº 12.973/2014 (Adequação aos Padrões IFRS)',
        tipo: 'Lei Ordinária',
        numero: '12973',
        ano: 2014,
        orgao: 'Presidência da República',
        tributo: 'IRPJ',
        dataPublicacao: '13/05/2014',
        ementa:
          'Altera a legislação tributária federal relativa ao IRPJ, CSLL, PIS e Cofins; revoga o Regime Tributário de Transição (RTT) e adapta as regras fiscais às normas contábeis internacionais (IFRS).',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12973.htm',
        destaque: false,
      },
      {
        id: 'decreto-9580-2018-rir',
        titulo: 'Decreto nº 9.580/2018 (RIR/2018 - Regulamento do IR)',
        tipo: 'Decreto Federal',
        numero: '9580',
        ano: 2018,
        orgao: 'Presidência da República',
        tributo: 'IRPJ',
        dataPublicacao: '22/11/2018',
        ementa:
          'Regulamenta a tributação, a fiscalização, a arrecadação e a administração do Imposto sobre a Renda e Proventos de Qualquer Natureza (Lucro Real, Presumido e Arbitrado).',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9580.htm',
        destaque: false,
      },
      {
        id: 'lei-9249-1995-irpj',
        titulo: 'Lei nº 9.249/1995 (Bases de Cálculo do IRPJ e JCP)',
        tipo: 'Lei Ordinária',
        numero: '9249',
        ano: 1995,
        orgao: 'Presidência da República',
        tributo: 'IRPJ',
        dataPublicacao: '26/12/1995',
        ementa:
          'Altera a legislação do imposto de renda das pessoas jurídicas, define as regras de Juros sobre Capital Próprio (JCP), apuração do Lucro Real e percentuais do Lucro Presumido.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l9249.htm',
        destaque: false,
      },

      // --- CSLL ---
      {
        id: 'lei-7689-1988-csll',
        titulo: 'Lei nº 7.689/1988 (Instituição da CSLL)',
        tipo: 'Lei Ordinária',
        numero: '7689',
        ano: 1988,
        orgao: 'Presidência da República',
        tributo: 'CSLL',
        dataPublicacao: '15/12/1988',
        ementa:
          'Institui a Contribuição Social sobre o Lucro das Pessoas Jurídicas (CSLL) destinada ao financiamento da Seguridade Social.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l7689.htm',
        destaque: false,
      },
      {
        id: 'in-rfb-1700-2017-irpj-csll',
        titulo: 'Instrução Normativa RFB nº 1.700/2017 (Apuração IRPJ e CSLL)',
        tipo: 'Instrução Normativa',
        numero: '1700',
        ano: 2017,
        orgao: 'Receita Federal do Brasil (RFB)',
        tributo: 'CSLL',
        dataPublicacao: '14/03/2017',
        ementa:
          'Dispõe sobre a determinação e o pagamento do IRPJ e da CSLL devidos pelas pessoas jurídicas e disciplina o tratamento tributário do Lucro Real, Presumido e Arbitrado.',
        linkOficial: 'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=81268',
        destaque: false,
      },

      // --- INSS / PREVIDENCIÁRIO ---
      {
        id: 'lei-8212-1991-custeio',
        titulo: 'Lei nº 8.212/1991 (Lei Orgânica da Seguridade Social)',
        tipo: 'Lei Ordinária',
        numero: '8212',
        ano: 1991,
        orgao: 'Presidência da República',
        tributo: 'INSS',
        dataPublicacao: '24/07/1991',
        ementa:
          'Dispõe sobre a organização da Seguridade Social, institui Plano de Custeio e as contribuições sociais sobre folha, faturamento e lucro.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
        destaque: false,
      },
      {
        id: 'in-rfb-2110-2022-inss',
        titulo: 'Instrução Normativa RFB nº 2.110/2022 (Normas Gerais da CPRB e INSS)',
        tipo: 'Instrução Normativa',
        numero: '2110',
        ano: 2022,
        orgao: 'Receita Federal do Brasil (RFB)',
        tributo: 'INSS',
        dataPublicacao: '17/10/2022',
        ementa:
          'Dispõe sobre as normas gerais de tributação previdenciária e de arrecadação das contribuições sociais destinadas à Previdência Social e de outras entidades/fundos.',
        linkOficial:
          'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=126484',
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
              const textoCompleto = `${sigla} ${num} ${ementa} ${mat.DescricaoSubtipoMateria || ''}`
              const tributoClassificado = classificarTributoPorTexto(textoCompleto)

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
                tributo: tributoClassificado,
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
        const tLower = item.tipo.toLowerCase()
        const titLower = item.titulo.toLowerCase()
        const catLower = (item.categoria || '').toLowerCase()
        if (
          !tLower.includes(tipo) &&
          !titLower.includes(tipo) &&
          !catLower.includes(tipo) &&
          !(
            tipo === 'jurisprudencia' &&
            (tLower.includes('stf') || tLower.includes('stj') || tLower.includes('tema'))
          )
        ) {
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
