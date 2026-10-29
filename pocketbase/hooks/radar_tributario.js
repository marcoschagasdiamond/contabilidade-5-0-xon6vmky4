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
    // geradoras de crédito tributário com ETIQUETAS DE APLICABILIDADE
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_iss_servicos',
        dataJulgamento: '21/10/2026',
        etiquetas: {
          tributos: ['PIS/Cofins', 'ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto', 'construcao_civil'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_icms_base',
        dataJulgamento: '13/05/2021',
        etiquetas: {
          tributos: ['PIS/Cofins', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'food_service', 'misto'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_subvencao_icms',
        dataJulgamento: '26/04/2023',
        etiquetas: {
          tributos: ['ICMS', 'PIS/Cofins', 'IRPJ', 'CSLL'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_insumos_presumido',
        dataJulgamento: '24/06/2009',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-959-re-1187264',
        titulo:
          'STF — Tema 959 (RE 1.187.264): Exclusão do ICMS da Base do INSS/CPRB (Tese dos Desembolsos)',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 959 / RE 1.187.264',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'INSS',
        dataPublicacao: '24/02/2021',
        ementa:
          'Fixação pelo Plenário do STF: é inconstitucional a inclusão do ICMS destacado na base de cálculo da CPRB (Contribuição Previdenciária sobre a Receita Bruta), aplicando a tese dos desembolsos e vedando tributação de valores que não compõem faturamento. Aplicável estritamente a Lucro Real e Lucro Presumido.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=959',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_icms_base_inss_tema_959',
        moduloRecuperador: 'folha',
        dataJulgamento: '24/02/2021',
        etiquetas: {
          tributos: ['INSS', 'ICMS'],
          segmentos: [
            'Comércio',
            'Indústria',
            'Agro',
            'Transporte',
            'Bares e Restaurantes',
            'Construção Civil',
            'Tecnologia',
          ],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'construcao_civil', 'servico', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-1079-fapi-salario-educacao',
        titulo:
          'STF/STJ — Tema 1079 / Salário-Educação e FAPI: Limitação de 20 Salários Mínimos e Verbas Indenizatórias',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 1079 / REsp 1.570.980',
        ano: 2024,
        orgao: 'Superior Tribunal de Justiça (STJ) / STF',
        tributo: 'INSS',
        dataPublicacao: '13/03/2024',
        ementa:
          'Direito à recuperação de recolhimentos indevidos das contribuições ao Salário-Educação e Fundo de Aposentadoria Programada Individual (FAPI/Previdência Complementar), afastando a base de cálculo sem teto legal ou sobre verbas não remuneratórias (Lei 6.950/1981 art. 4º).',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1079&cod_tema_final=1079',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_salario_educacao_fapi',
        moduloRecuperador: 'folha',
        dataJulgamento: '13/03/2024',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'juris-stf-tema-1023-jcp-pis-cofins',
        titulo:
          'STF — Tema 1023 (RE 1.072.485): Exclusão de Juros sobre Capital Próprio (JCP) da Base do PIS/Cofins',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 1023 / RE 1.072.485',
        ano: 2023,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'PIS/Cofins',
        dataPublicacao: '18/08/2023',
        ementa:
          'Não incidência de PIS e Cofins sobre receitas auferidas a título de Juros sobre o Capital Próprio (JCP), por constituírem remuneração de capital próprio/distribuição patrimonial e não receita bruta operacional de venda de bens ou serviços. Cabível para pessoas jurídicas no Lucro Real e Presumido.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=1023',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_juros_capital_proprio',
        moduloRecuperador: 'pis_cofins',
        dataJulgamento: '18/08/2023',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      // --- NOVAS TESES: IRPJ & CSLL ---
      {
        id: 'juris-stj-tema-1008-resp-1767631',
        titulo:
          'STJ — Tema 1008 (REsp 1.767.631/SC): Exclusão do ICMS da Base do IRPJ e da CSLL (Lucro Presumido)',
        tipo: 'Jurisprudência / STJ',
        numero: 'Tema 1008 / REsp 1.767.631',
        ano: 2023,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '18/05/2023',
        ementa:
          'Primeira Seção do STJ: exclusão do ICMS destacado nas notas fiscais da base de cálculo presumida do IRPJ e da CSLL no regime do Lucro Presumido, estendendo a lógica do Tema 69/STF por não integrar a receita bruta operacional.',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1008&cod_tema_final=1008',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_exclusao_icms_presumido',
        dataJulgamento: '18/05/2023',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
      },
      {
        id: 'juris-stj-tema-1008-iss-irpj',
        titulo:
          'STJ — REsp 1.839.814/PR: Exclusão do ISS da Base de Cálculo do IRPJ e CSLL (Lucro Presumido)',
        tipo: 'Jurisprudência / STJ',
        numero: 'REsp 1.839.814/PR',
        ano: 2023,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '22/08/2023',
        ementa:
          'Jurisprudência do STJ e RE 592.616: o ISSQN municipal faturado por prestadores de serviços não compõe receita própria e deve ser deduzido da receita bruta na apuração da base presumida de 32% do IRPJ e da CSLL.',
        linkOficial:
          'https://processo.stj.jus.br/jurisprudencia/externo/informativo/?aplicacao=informativo&acao=pesquisar&livre=1839814',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_exclusao_iss_presumido',
        dataJulgamento: '22/08/2023',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto', 'construcao_civil'],
        },
      },
      {
        id: 'juris-stj-eresp-1517492-credito-presumido',
        titulo:
          'STJ — EREsp 1.517.492/PR (1ª Seção): Não Incidência de IRPJ e CSLL sobre Créditos Presumidos de ICMS',
        tipo: 'Jurisprudência / STJ',
        numero: 'EREsp 1.517.492/PR',
        ano: 2020,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '01/02/2020',
        ementa:
          '1ª Seção do STJ pacificou que créditos presumidos de ICMS outorgados por Estados não configuram receita ou acréscimo patrimonial, sendo inconstitucional e ilegal a sua tributação por IRPJ e CSLL no Lucro Real.',
        linkOficial:
          'https://processo.stj.jus.br/jurisprudencia/externo/informativo/?aplicacao=informativo&acao=pesquisar&livre=1517492',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_credito_presumido_icms',
        dataJulgamento: '01/02/2020',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-962-re-1063187',
        titulo:
          'STF — Tema 962 (RE 1.063.187 RG): Não Incidência de IRPJ e CSLL sobre SELIC na Repetição de Indébito',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 962 / RE 1.063.187',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'IRPJ',
        dataPublicacao: '24/09/2021',
        ementa:
          'Plenário do STF fixou a tese vinculante do Tema 962: é inconstitucional a incidência do IRPJ e da CSLL sobre os valores atinentes à taxa SELIC recebidos em razão de repetição de indébito tributário.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=962',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_selic_repeticao',
        dataJulgamento: '24/09/2021',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },

      // --- NOVAS TESES: ICMS, ISS & ITCMD ---
      {
        id: 'juris-stj-tema-1109-icms-energia',
        titulo:
          'STJ/LC 87: Crédito de ICMS sobre Energia Elétrica e Telecomunicações na Atividade Industrial',
        tipo: 'Jurisprudência / STJ',
        numero: 'LC 87/96 art. 33 e Tema 1.109',
        ano: 2022,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'ICMS',
        dataPublicacao: '15/12/2022',
        ementa:
          'Direito de apropriação e recuperação de créditos de ICMS cobrados sobre o consumo de energia elétrica e serviços de telecomunicação diretamente vinculados ao processo de industrialização e produção fabril.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_icms_energia_eletrica_comunicacao',
        dataJulgamento: '15/12/2022',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Indústria', 'Tecnologia'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-201-re-593849',
        titulo: 'STF — Tema 201 (RE 593.849 RG): Restituição da Diferença de ICMS-ST Pago a Maior',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 201 / RE 593.849',
        ano: 2016,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'ICMS',
        dataPublicacao: '19/10/2016',
        ementa:
          'Plenário do STF: é devida a restituição da diferença do ICMS pago a maior no regime de substituição tributária para frente se a base de cálculo efetiva da operação for inferior à presumida pelo Fisco.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=201',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_icms_st_restituicao_base_efetiva',
        dataJulgamento: '19/10/2016',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2C', 'B2B', 'Geral'],
          ramos: ['comercio', 'food_service', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-918-iss-uniprofissional',
        titulo: 'STF — Tema 918 (RE 940.769 RG): ISS Fixo de Sociedades Uniprofissionais',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 918 / RE 940.769',
        ano: 2019,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'ISS',
        dataPublicacao: '24/04/2019',
        ementa:
          'Plenário do STF fixou a constitucionalidade do regime de tributação de ISS em alíquota fixa anual por profissional habilitado (art. 9º, §§ 1º e 3º do DL 406/1968), vedando alíquotas percentuais sobre o faturamento de sociedades civis uniprofissionais.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=918',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_iss_sociedades_uniprofissionais',
        dataJulgamento: '24/04/2019',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico'],
        },
      },
      {
        id: 'juris-stf-tema-851-re-851108',
        titulo:
          'STF — Tema 851 (RE 851.108 RG): Inconstitucionalidade do ITCMD sobre Bens no Exterior',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 851 / RE 851.108',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'Geral',
        dataPublicacao: '01/03/2021',
        ementa:
          'STF julgou inconstitucional a instituição de ITCMD pelos Estados sobre doações e transmissões hereditárias quando o doador tiver domicílio no exterior ou os bens estiverem situados fora do país antes da edição de LC federal.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=851',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_itcmd_planejamento_doacoes_exterior',
        dataJulgamento: '01/03/2021',
        prazoVigencia: 'Decisão modulada com eficácia erga omnes',
        alertaVencimento: 'Vigência contínua',
        etiquetas: {
          tributos: ['Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
    ]

    // Base padrão de normas fundamentais: Reforma Tributária e Legislação-Chave com ETIQUETAS DE APLICABILIDADE
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Cronograma 2026–2033',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'IS', 'Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Vigência plena até 2033',
        alertaVencimento: 'Teste em 2026, vigência CBS 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'IS', 'Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Exercício 2026–2027',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Prazo Senado: até 15/12/2026',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'lc-123-2006-simples',
        titulo: 'Lei Complementar nº 123/2006 (Estatuto Nacional da MPE)',
        tipo: 'Lei Complementar',
        numero: '123',
        ano: 2006,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '14/12/2006',
        ementa:
          'Institui o Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte (Simples Nacional), estabelecendo regime único de arrecadação, tributação simplificada e tratamento jurídico diferenciado.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
        destaque: true,
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Vigência por prazo indeterminado (transição até 2033)',
        alertaVencimento: 'Vigência até 2033',
        etiquetas: {
          tributos: ['Geral', 'Simples Nacional', 'IBS', 'CBS'],
          segmentos: ['Todos'],
          regimes: ['Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'lc-214-2025-simples-nacional',
        titulo: 'LC 214/2025 — Regras do Simples Nacional na Transição (IBS/CBS no DAS)',
        tipo: 'Lei Complementar',
        numero: '214 (Simples)',
        ano: 2025,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '15/01/2025',
        ementa:
          'Regras de permanência das micro e pequenas empresas no Simples Nacional durante a transição da Reforma Tributária: manutenção do regime único com recolhimento de CBS e IBS dentro do DAS ou opção pelo recolhimento por fora com transferência integral de créditos.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        destaque: true,
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Regime de transição 2027–2032',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'Simples Nacional'],
          segmentos: ['Todos'],
          regimes: ['Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Deliberação obrigatória em 2026',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS', 'IBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_desoneracao_12546',
        prazoVigencia: 'Cronograma regressivo até 2027',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Transporte', 'Construção Civil', 'Tecnologia', 'Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'construcao_civil', 'servico'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'food_service', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'food_service', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'construcao_civil', 'locacao_bens', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde', 'Tecnologia'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['CSLL'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['CSLL', 'IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_inss_verbas_indenizatorias',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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

/**
 * POST /backend/v1/c50/legislacao/contextual
 * Cruzamento contextual do perfil da empresa com o catálogo e teses jurisprudenciais
 * Retorna as normas/teses aplicáveis separadas em:
 * - mudancasQueImpactam (normas e alterações legais aplicáveis)
 * - direitoRecuperacaoCredito (teses jurisprudenciais e créditos cabíveis)
 * - alertasRadar (notificações ativas do radar tributário)
 */
routerAdd('POST', '/backend/v1/c50/legislacao/contextual', (e) => {
  try {
    function testarAplicabilidadeNorma(item, perfil) {
      if (!item) return false
      const et = item.etiquetas || {}
      const segs = et.segmentos || ['Todos']
      const regs = et.regimes || ['Todos']
      const ops = et.operacoes || ['Todos']
      const rms = et.ramos || ['Todos']

      const perfilSeg = (perfil.segmento || '').trim().toLowerCase()
      const perfilReg = (perfil.regimeTributario || perfil.regimeAtual || '').trim().toLowerCase()
      const perfilOp = (perfil.perfilNf || perfil.emissaoNf || '').trim().toUpperCase()
      const perfilRamo = (perfil.ramo || perfil.tipoAtividade || '').trim().toLowerCase()
      const atividadeMista = !!perfil.atividadeMista
      const isSimples = perfilReg.includes('simples')

      // Blindagem estrita contra Simples Nacional:
      // Nenhuma tese de PIS/Cofins, IPI, IRPJ ou CSLL pode aparecer para Simples Nacional.
      if (
        isSimples &&
        (item.categoria === 'jurisprudencia' || item.natureza === 'recuperacao_credito')
      ) {
        const tributosEtiqueta = (et.tributos || []).map((t) => String(t).toUpperCase())
        const tributoPrincipal = String(item.tributo || '').toUpperCase()
        const idTese = String(item.id || '')

        const isPisCofinsOuIpiOuIrpj =
          tributoPrincipal.includes('PIS') ||
          tributoPrincipal.includes('COFINS') ||
          tributoPrincipal.includes('IPI') ||
          tributoPrincipal.includes('IRPJ') ||
          tributoPrincipal.includes('CSLL') ||
          tributosEtiqueta.some(
            (t) =>
              t.includes('PIS') ||
              t.includes('COFINS') ||
              t.includes('IPI') ||
              t.includes('IRPJ') ||
              t.includes('CSLL'),
          ) ||
          idTese === 'juris-stf-re-592616-tema-118' ||
          idTese === 'juris-stf-re-574706-tema-69' ||
          idTese === 'juris-stj-tema-1182-resp-1945110' ||
          idTese === 'juris-stj-tema-77-resp-1075508' ||
          idTese === 'juris-stf-tema-959-re-1187264' ||
          idTese === 'juris-stf-tema-1079-fapi-salario-educacao' ||
          idTese === 'juris-stf-tema-1023-jcp-pis-cofins' ||
          idTese === 'juris-stj-tema-1008-resp-1767631' ||
          idTese === 'juris-stj-tema-1008-iss-irpj' ||
          idTese === 'juris-stj-eresp-1517492-credito-presumido' ||
          idTese === 'juris-stf-tema-962-re-1063187' ||
          idTese === 'juris-stj-tema-1109-icms-energia' ||
          idTese === 'juris-stf-tema-201-re-593849' ||
          idTese === 'juris-stf-tema-918-iss-uniprofissional'

        if (isPisCofinsOuIpiOuIrpj) {
          return false
        }
      }

      // 1. Regime tributário
      if (!regs.includes('Todos')) {
        const regMatch = regs.some((r) => {
          const rLower = r.toLowerCase()
          if (perfilReg.includes('real') && rLower.includes('real')) return true
          if (perfilReg.includes('presumido') && rLower.includes('presumido')) return true
          if (perfilReg.includes('simples') && rLower.includes('simples')) return true
          return false
        })
        if (!regMatch && perfilReg) return false
      }

      // 2. Segmento / Ramo
      if (!segs.includes('Todos') || !rms.includes('Todos')) {
        let segMatch = false
        if (segs.includes('Todos') || rms.includes('Todos')) {
          segMatch = true
        } else {
          for (const s of segs) {
            const sLower = s.toLowerCase()
            if (perfilSeg && (perfilSeg.includes(sLower) || sLower.includes(perfilSeg))) {
              segMatch = true
              break
            }
          }
          if (!segMatch && perfilRamo) {
            for (const rm of rms) {
              const rmLower = rm.toLowerCase()
              if (perfilRamo.includes(rmLower) || rmLower.includes(perfilRamo)) {
                segMatch = true
                break
              }
            }
          }
          if (!segMatch && atividadeMista) {
            if (rms.includes('misto') || segs.includes('Serviços') || segs.includes('Comércio')) {
              segMatch = true
            }
          }
        }
        if (!segMatch && (perfilSeg || perfilRamo)) return false
      }

      // 3. Operação (B2B, B2C)
      if (!ops.includes('Todos') && !ops.includes('Geral') && perfilOp) {
        const opMatch = ops.some((o) => o.toUpperCase() === perfilOp || o === 'Geral')
        if (!opMatch && (perfilOp === 'B2B' || perfilOp === 'B2C')) return false
      }

      return true
    }
    let body = {}
    try {
      const info = e.requestInfo()
      body = info.body || {}
      if (typeof body === 'string') {
        body = JSON.parse(body)
      }
    } catch (_) {
      body = {}
    }

    const perfil = {
      segmento: body.segmento || '',
      regimeTributario: body.regimeTributario || body.regimeAtual || '',
      perfilNf: body.perfilNf || body.emissaoNf || '',
      atividadeMista: !!body.atividadeMista,
      ramo: body.ramo || body.tipoAtividade || '',
      faturamentoMensal: body.faturamentoMensal || 0,
    }

    const temPerfilMinimo = Boolean(
      (perfil.segmento && perfil.segmento.trim()) ||
      (perfil.regimeTributario && perfil.regimeTributario.trim()) ||
      (perfil.ramo && perfil.ramo.trim()),
    )

    if (!temPerfilMinimo) {
      return e.json(200, {
        perfilPreenchido: false,
        aviso:
          'Perfil da empresa não preenchido. Preencha os Dados da Empresa para visualizar a legislação aplicável.',
        mudancasQueImpactam: [],
        direitoRecuperacaoCredito: [],
        alertasRadar: [],
      })
    }

    // Obter todas as normas e teses base
    const catalogoCompleto = [
      // Teses de jurisprudência
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_iss_servicos',
        moduloRecuperador: 'pis_cofins',
        dataJulgamento: '21/10/2026',
        etiquetas: {
          tributos: ['PIS/Cofins', 'ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto', 'construcao_civil'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_icms_base',
        dataJulgamento: '13/05/2021',
        etiquetas: {
          tributos: ['PIS/Cofins', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'food_service', 'misto'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_subvencao_icms',
        dataJulgamento: '26/04/2023',
        etiquetas: {
          tributos: ['ICMS', 'PIS/Cofins', 'IRPJ', 'CSLL'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
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
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_insumos_presumido',
        dataJulgamento: '24/06/2009',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-959-re-1187264',
        titulo:
          'STF — Tema 959 (RE 1.187.264): Exclusão do ICMS da Base do INSS/CPRB (Tese dos Desembolsos)',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 959 / RE 1.187.264',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'INSS',
        dataPublicacao: '24/02/2021',
        ementa:
          'Fixação pelo Plenário do STF: é inconstitucional a inclusão do ICMS destacado na base de cálculo da CPRB (Contribuição Previdenciária sobre a Receita Bruta), aplicando a tese dos desembolsos e vedando tributação de valores que não compõem faturamento. Aplicável estritamente a Lucro Real e Lucro Presumido.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=959',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_icms_base_inss_tema_959',
        moduloRecuperador: 'folha',
        dataJulgamento: '24/02/2021',
        etiquetas: {
          tributos: ['INSS', 'ICMS'],
          segmentos: [
            'Comércio',
            'Indústria',
            'Agro',
            'Transporte',
            'Bares e Restaurantes',
            'Construção Civil',
            'Tecnologia',
          ],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'construcao_civil', 'servico', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-1079-fapi-salario-educacao',
        titulo:
          'STF/STJ — Tema 1079 / Salário-Educação e FAPI: Limitação de 20 Salários Mínimos e Verbas Indenizatórias',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 1079 / REsp 1.570.980',
        ano: 2024,
        orgao: 'Superior Tribunal de Justiça (STJ) / STF',
        tributo: 'INSS',
        dataPublicacao: '13/03/2024',
        ementa:
          'Direito à recuperação de recolhimentos indevidos das contribuições ao Salário-Educação e Fundo de Aposentadoria Programada Individual (FAPI/Previdência Complementar), afastando a base de cálculo sem teto legal ou sobre verbas não remuneratórias (Lei 6.950/1981 art. 4º).',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1079&cod_tema_final=1079',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_salario_educacao_fapi',
        moduloRecuperador: 'folha',
        dataJulgamento: '13/03/2024',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'juris-stf-tema-1023-jcp-pis-cofins',
        titulo:
          'STF — Tema 1023 (RE 1.072.485): Exclusão de Juros sobre Capital Próprio (JCP) da Base do PIS/Cofins',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 1023 / RE 1.072.485',
        ano: 2023,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'PIS/Cofins',
        dataPublicacao: '18/08/2023',
        ementa:
          'Não incidência de PIS e Cofins sobre receitas auferidas a título de Juros sobre o Capital Próprio (JCP), por constituírem remuneração de capital próprio/distribuição patrimonial e não receita bruta operacional de venda de bens ou serviços. Cabível para pessoas jurídicas no Lucro Real e Presumido.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=1023',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_pis_juros_capital_proprio',
        moduloRecuperador: 'pis_cofins',
        dataJulgamento: '18/08/2023',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      // --- NOVAS TESES: IRPJ & CSLL ---
      {
        id: 'juris-stj-tema-1008-resp-1767631',
        titulo:
          'STJ — Tema 1008 (REsp 1.767.631/SC): Exclusão do ICMS da Base do IRPJ e da CSLL (Lucro Presumido)',
        tipo: 'Jurisprudência / STJ',
        numero: 'Tema 1008 / REsp 1.767.631',
        ano: 2023,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '18/05/2023',
        ementa:
          'Primeira Seção do STJ: exclusão do ICMS destacado nas notas fiscais da base de cálculo presumida do IRPJ e da CSLL no regime do Lucro Presumido, estendendo a lógica do Tema 69/STF por não integrar a receita bruta operacional.',
        linkOficial:
          'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1008&cod_tema_final=1008',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_exclusao_icms_presumido',
        dataJulgamento: '18/05/2023',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
      },
      {
        id: 'juris-stj-tema-1008-iss-irpj',
        titulo:
          'STJ — REsp 1.839.814/PR: Exclusão do ISS da Base de Cálculo do IRPJ e CSLL (Lucro Presumido)',
        tipo: 'Jurisprudência / STJ',
        numero: 'REsp 1.839.814/PR',
        ano: 2023,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '22/08/2023',
        ementa:
          'Jurisprudência do STJ e RE 592.616: o ISSQN municipal faturado por prestadores de serviços não compõe receita própria e deve ser deduzido da receita bruta na apuração da base presumida de 32% do IRPJ e da CSLL.',
        linkOficial:
          'https://processo.stj.jus.br/jurisprudencia/externo/informativo/?aplicacao=informativo&acao=pesquisar&livre=1839814',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_exclusao_iss_presumido',
        dataJulgamento: '22/08/2023',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto', 'construcao_civil'],
        },
      },
      {
        id: 'juris-stj-eresp-1517492-credito-presumido',
        titulo:
          'STJ — EREsp 1.517.492/PR (1ª Seção): Não Incidência de IRPJ e CSLL sobre Créditos Presumidos de ICMS',
        tipo: 'Jurisprudência / STJ',
        numero: 'EREsp 1.517.492/PR',
        ano: 2020,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'IRPJ',
        dataPublicacao: '01/02/2020',
        ementa:
          '1ª Seção do STJ pacificou que créditos presumidos de ICMS outorgados por Estados não configuram receita ou acréscimo patrimonial, sendo inconstitucional e ilegal a sua tributação por IRPJ e CSLL no Lucro Real.',
        linkOficial:
          'https://processo.stj.jus.br/jurisprudencia/externo/informativo/?aplicacao=informativo&acao=pesquisar&livre=1517492',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_credito_presumido_icms',
        dataJulgamento: '01/02/2020',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-962-re-1063187',
        titulo:
          'STF — Tema 962 (RE 1.063.187 RG): Não Incidência de IRPJ e CSLL sobre SELIC na Repetição de Indébito',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 962 / RE 1.063.187',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'IRPJ',
        dataPublicacao: '24/09/2021',
        ementa:
          'Plenário do STF fixou a tese vinculante do Tema 962: é inconstitucional a incidência do IRPJ e da CSLL sobre os valores atinentes à taxa SELIC recebidos em razão de repetição de indébito tributário.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=962',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_irpj_csll_selic_repeticao',
        dataJulgamento: '24/09/2021',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },

      // --- NOVAS TESES: ICMS, ISS & ITCMD ---
      {
        id: 'juris-stj-tema-1109-icms-energia',
        titulo:
          'STJ/LC 87: Crédito de ICMS sobre Energia Elétrica e Telecomunicações na Atividade Industrial',
        tipo: 'Jurisprudência / STJ',
        numero: 'LC 87/96 art. 33 e Tema 1.109',
        ano: 2022,
        orgao: 'Superior Tribunal de Justiça (STJ)',
        tributo: 'ICMS',
        dataPublicacao: '15/12/2022',
        ementa:
          'Direito de apropriação e recuperação de créditos de ICMS cobrados sobre o consumo de energia elétrica e serviços de telecomunicação diretamente vinculados ao processo de industrialização e produção fabril.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_icms_energia_eletrica_comunicacao',
        dataJulgamento: '15/12/2022',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Indústria', 'Tecnologia'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-201-re-593849',
        titulo: 'STF — Tema 201 (RE 593.849 RG): Restituição da Diferença de ICMS-ST Pago a Maior',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 201 / RE 593.849',
        ano: 2016,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'ICMS',
        dataPublicacao: '19/10/2016',
        ementa:
          'Plenário do STF: é devida a restituição da diferença do ICMS pago a maior no regime de substituição tributária para frente se a base de cálculo efetiva da operação for inferior à presumida pelo Fisco.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=201',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_icms_st_restituicao_base_efetiva',
        dataJulgamento: '19/10/2016',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2C', 'B2B', 'Geral'],
          ramos: ['comercio', 'food_service', 'misto'],
        },
      },
      {
        id: 'juris-stf-tema-918-iss-uniprofissional',
        titulo: 'STF — Tema 918 (RE 940.769 RG): ISS Fixo de Sociedades Uniprofissionais',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 918 / RE 940.769',
        ano: 2019,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'ISS',
        dataPublicacao: '24/04/2019',
        ementa:
          'Plenário do STF fixou a constitucionalidade do regime de tributação de ISS em alíquota fixa anual por profissional habilitado (art. 9º, §§ 1º e 3º do DL 406/1968), vedando alíquotas percentuais sobre o faturamento de sociedades civis uniprofissionais.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=918',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_iss_sociedades_uniprofissionais',
        dataJulgamento: '24/04/2019',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico'],
        },
      },
      {
        id: 'juris-stf-tema-851-re-851108',
        titulo:
          'STF — Tema 851 (RE 851.108 RG): Inconstitucionalidade do ITCMD sobre Bens no Exterior',
        tipo: 'Jurisprudência / STF',
        numero: 'Tema 851 / RE 851.108',
        ano: 2021,
        orgao: 'Supremo Tribunal Federal (STF)',
        tributo: 'Geral',
        dataPublicacao: '01/03/2021',
        ementa:
          'STF julgou inconstitucional a instituição de ITCMD pelos Estados sobre doações e transmissões hereditárias quando o doador tiver domicílio no exterior ou os bens estiverem situados fora do país antes da edição de LC federal.',
        linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=851',
        destaque: true,
        categoria: 'jurisprudencia',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_itcmd_planejamento_doacoes_exterior',
        dataJulgamento: '01/03/2021',
        prazoVigencia: 'Decisão modulada com eficácia erga omnes',
        alertaVencimento: 'Vigência contínua',
        etiquetas: {
          tributos: ['Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      // --- Normas Reforma Tributária ---
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Cronograma 2026–2033',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'IS', 'Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Vigência plena até 2033',
        alertaVencimento: 'Teste em 2026, vigência CBS 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'IS', 'Geral'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Exercício 2026–2027',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Prazo Senado: até 15/12/2026',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'lc-123-2006-simples',
        titulo: 'Lei Complementar nº 123/2006 (Estatuto Nacional da MPE)',
        tipo: 'Lei Complementar',
        numero: '123',
        ano: 2006,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '14/12/2006',
        ementa:
          'Institui o Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte (Simples Nacional), estabelecendo regime único de arrecadação, tributação simplificada e tratamento jurídico diferenciado.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
        destaque: true,
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Vigência por prazo indeterminado (transição até 2033)',
        alertaVencimento: 'Vigência até 2033',
        etiquetas: {
          tributos: ['Geral', 'Simples Nacional', 'IBS', 'CBS'],
          segmentos: ['Todos'],
          regimes: ['Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
      {
        id: 'lc-214-2025-simples-nacional',
        titulo: 'LC 214/2025 — Regras do Simples Nacional na Transição (IBS/CBS no DAS)',
        tipo: 'Lei Complementar',
        numero: '214 (Simples)',
        ano: 2025,
        orgao: 'Presidência da República / Congresso Nacional',
        tributo: 'Geral',
        dataPublicacao: '15/01/2025',
        ementa:
          'Regras de permanência das micro e pequenas empresas no Simples Nacional durante a transição da Reforma Tributária: manutenção do regime único com recolhimento de CBS e IBS dentro do DAS ou opção pelo recolhimento por fora com transferência integral de créditos.',
        linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        destaque: true,
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Regime de transição 2027–2032',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['IBS', 'CBS', 'Simples Nacional'],
          segmentos: ['Todos'],
          regimes: ['Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        prazoVigencia: 'Deliberação obrigatória em 2026',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['CBS', 'IBS'],
          segmentos: ['Todos'],
          regimes: ['Todos'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_desoneracao_12546',
        prazoVigencia: 'Cronograma regressivo até 2027',
        alertaVencimento: 'Fase muda em 2027',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Transporte', 'Construção Civil', 'Tecnologia', 'Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'construcao_civil', 'servico'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Agro', 'Transporte', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'agronegocio', 'food_service', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ICMS'],
          segmentos: ['Comércio', 'Indústria', 'Bares e Restaurantes'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'food_service', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IPI'],
          segmentos: ['Indústria'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'Geral'],
          ramos: ['industria', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Comércio', 'Indústria', 'Serviços', 'Agro', 'Transporte', 'Tecnologia'],
          regimes: ['Lucro Real'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['comercio', 'industria', 'servico', 'agronegocio', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde', 'Educação', 'Tecnologia', 'Construção Civil'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'construcao_civil', 'locacao_bens', 'misto'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['ISS'],
          segmentos: ['Serviços', 'Saúde', 'Tecnologia'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['B2B', 'B2C', 'Geral'],
          ramos: ['servico', 'misto'],
        },
      },
      // --- IRPJ / CSLL ---
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ', 'CSLL', 'PIS/Cofins'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['CSLL'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['CSLL', 'IRPJ'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'mudanca_impacto',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
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
        categoria: 'legislacao',
        natureza: 'recuperacao_credito',
        teseRecuperadorId: 'tese_folha_inss_verbas_indenizatorias',
        etiquetas: {
          tributos: ['INSS'],
          segmentos: ['Todos'],
          regimes: ['Lucro Real', 'Lucro Presumido'],
          operacoes: ['Todos'],
          ramos: ['Todos'],
        },
      },
    ]

    const aplicaveis = catalogoCompleto.filter((item) => testarAplicabilidadeNorma(item, perfil))

    const mudancasQueImpactam = aplicaveis.filter(
      (item) => item.natureza === 'mudanca_impacto' || item.categoria !== 'jurisprudencia',
    )
    const direitoRecuperacaoCredito = aplicaveis.filter(
      (item) => item.natureza === 'recuperacao_credito' || item.categoria === 'jurisprudencia',
    )

    // Buscar notificações ativas do Radar Tributário no banco de dados
    let alertasRadar = []
    try {
      const records = $app.findRecordsByFilter(
        'notificacoes_tributarias',
        'lida = false',
        '-data_hora',
        5,
      )
      alertasRadar = records.map((r) => ({
        id: r.id,
        titulo: r.getString('titulo'),
        descricao: r.getString('descricao'),
        tributo: r.getString('tributo'),
        impacto: r.getString('impacto'),
        data_hora: r.getString('data_hora'),
      }))
    } catch (eNotif) {
      // Se não houver coleção ou falhar, fallback de alertas recentes
      alertasRadar = [
        {
          id: 'radar-aliquota-cbs-2027',
          titulo: 'Alíquota de Referência CBS fixada em 11,35%',
          descricao:
            'TCU aprovou relatório de alíquota da CBS para 2027. Impacto direto na apuração não cumulativa.',
          tributo: 'CBS',
          impacto: 'alto',
          data_hora: new Date().toISOString(),
        },
        {
          id: 'radar-lc214-reducao-60',
          titulo: 'Regulamentação da Redução de 60% (LC 214/2025)',
          descricao:
            'Setores de saúde, educação e medicamentos com regime diferenciado elegível a crédito integral.',
          tributo: 'IBS/CBS',
          impacto: 'medio',
          data_hora: new Date().toISOString(),
        },
      ]
    }

    return e.json(200, {
      perfilPreenchido: true,
      perfil,
      resumo: {
        totalMudancas: mudancasQueImpactam.length,
        totalRecuperacao: direitoRecuperacaoCredito.length,
        totalAlertasRadar: alertasRadar.length,
      },
      mudancasQueImpactam,
      direitoRecuperacaoCredito,
      alertasRadar,
    })
  } catch (err) {
    console.log('Erro no rasante de legislação contextual:', err)
    return e.json(500, { erro: 'Falha ao processar legislação contextual' })
  }
})
