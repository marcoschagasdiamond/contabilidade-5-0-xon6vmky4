import {
  ConfiguracoesGerais,
  CONFIGURACOES_PADRAO,
  RegimeDiferenciadoTipo,
  TipoAtividade,
  TipoAtividadePrincipal,
  normalizarTipoAtividade,
  CategoriaDespesaCredito,
  CATEGORIAS_CREDITO_PADRAO,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeAgronegocio,
  SubatividadeConstrucao,
  SubatividadeLocacao,
  SubatividadeFoodService,
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_AGRONEGOCIO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_FOOD_SERVICE,
  AnoTransicaoIbsCbs,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
  obterGrupoRegimeOperacao,
} from '@/types/calculadoraIbsCbs'
import { TABELAS_SIMPLES } from '@/lib/regimes'
import { calcularIbsCbsSimplesNacional, type AnoBaseSimulacao } from '@/lib/reformaTributaria'
import { obterAliquotasCreditoPorAno } from '@/lib/calculoFornecedores'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'

/**
 * Função de cálculo puro e isolado da Calculadora IBS/CBS.
 * Reutiliza 100% das fórmulas, tabelas do Simples e regras da LC 214/2025 já homologadas no CalculadoraIbsCbsContext.
 */
export function calcularResultadosSimulacao(
  parametros: ParametrosSimulacaoCalculadora,
): ResultadosSimulacaoCalculadora {
  const config: ConfiguracoesGerais = {
    ...CONFIGURACOES_PADRAO,
    ...(parametros.config || {}),
  }

  const faturamentoMensal = Math.max(0, parametros.faturamentoMensal || 0)
  const percentualComprasVendasComparativo =
    parametros.percentualComprasVendasComparativo ??
    parametros.percentualComprasVendas ??
    config.percentualComprasVendas ??
    0
  const tipoAtividade: TipoAtividadePrincipal = normalizarTipoAtividade(
    parametros.tipoAtividade || config.tipoAtividade,
  )
  const subatividadeServico: SubatividadeServico =
    parametros.subatividadeServico || config.subatividadeServico || 'servico_comum'
  const subatividadeIndustria: SubatividadeIndustria =
    parametros.subatividadeIndustria || config.subatividadeIndustria || 'industria_comum'
  const subatividadeComercio: SubatividadeComercio =
    parametros.subatividadeComercio || config.subatividadeComercio || 'varejo_comum'
  const subatividadeAgro: SubatividadeAgronegocio =
    parametros.subatividadeAgro || config.subatividadeAgro || 'producao_agricola_graos'
  const subatividadeConstrucao: SubatividadeConstrucao =
    parametros.subatividadeConstrucao || config.subatividadeConstrucao || 'obras_edificacoes_ret'
  const subatividadeLocacao: SubatividadeLocacao =
    parametros.subatividadeLocacao || config.subatividadeLocacao || 'locacao_veiculos_maquinas'
  const subatividadeFoodService: SubatividadeFoodService =
    parametros.subatividadeFoodService ||
    config.subatividadeFoodService ||
    'restaurante_a_la_carte_buffet'

  const aliquotaImpostoSeletivo =
    parametros.aliquotaImpostoSeletivo ?? config.aliquotaImpostoSeletivo ?? 10
  const proporcaoServicoMisto =
    parametros.proporcaoServicoMisto ?? config.proporcaoServicoMisto ?? 50
  const folhaPagamentoMensal = Math.max(0, parametros.folhaPagamentoMensal || 0)
  const margemLucroEstimada = parametros.margemLucroEstimada ?? 20
  const despesasComCreditosMensais = Math.max(0, parametros.despesasComCreditosMensais || 0)
  const percentualExportacao = Math.max(0, Math.min(100, parametros.percentualExportacao || 0))
  const ufOrigem = parametros.ufOrigem || 'SP'

  const valorOperacao = parametros.valorOperacao || faturamentoMensal
  const regimeOperacao: RegimeDiferenciadoTipo =
    parametros.regimeOperacao ||
    (config.presetSetor && config.presetSetor !== 'nenhum' ? config.presetSetor : 'padrao')
  const anoOperacao: AnoTransicaoIbsCbs = parametros.anoOperacao || config.anoTransicao || 2033
  const percentualComprasVendasSimples =
    parametros.percentualComprasVendasSimples ?? percentualComprasVendasComparativo

  const despesasCreditos: CategoriaDespesaCredito[] =
    parametros.despesasCreditos && parametros.despesasCreditos.length > 0
      ? parametros.despesasCreditos
      : CATEGORIAS_CREDITO_PADRAO

  const faturamentoAnualProjetado = parametros.faturamentoAnualProjetado || faturamentoMensal * 12
  const setorTransicao: TipoAtividade =
    (parametros.setorTransicao as TipoAtividade) || tipoAtividade
  const valorEstoqueVirada =
    parametros.valorEstoqueVirada ??
    Math.round(faturamentoMensal * (percentualComprasVendasComparativo / 100) * 1.5)
  const taxaMensalCapitalGiro = parametros.taxaMensalCapitalGiro ?? 1.0
  const diasAntecipacaoSplit = parametros.diasAntecipacaoSplit ?? 30

  const regimeAtualFiltro: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional' =
    parametros.regimeAtualFiltro ||
    parametros.regimeAtualEmpresa ||
    config.regimeAtualEmpresa ||
    'Lucro Presumido'
  const anoTransicaoDashboard: AnoTransicaoIbsCbs =
    parametros.anoTransicaoDashboard || config.anoTransicao || 2033

  // ==========================================
  // CÁLCULO MÓDULO 2 (Calculadora Simples)
  // ==========================================
  const anoSimples = anoOperacao || config.anoTransicao || 2033
  const dadosFaseAnoSimples =
    CRONOGRAMA_FASES_TRANSICAO[anoSimples] || CRONOGRAMA_FASES_TRANSICAO[2033]
  const ehMesmoAnoDoModulo1Simples = config.anoTransicao === anoSimples

  const totalIvaBase = ehMesmoAnoDoModulo1Simples
    ? config.totalIvaDual
    : dadosFaseAnoSimples.totalIvaDual
  const cbsBase = ehMesmoAnoDoModulo1Simples ? config.cbsPadrao : dadosFaseAnoSimples.aliquotaCbs
  const ibsBase = ehMesmoAnoDoModulo1Simples ? config.ibsPadrao : dadosFaseAnoSimples.aliquotaIbs

  let aliquotaTotal = totalIvaBase
  let aliqCbs = cbsBase
  let aliqIbs = ibsBase

  const presetCorrespondente = PRESETS_SETORES_LC214.find((p) => p.id === regimeOperacao)
  const grupo =
    presetCorrespondente?.grupo ||
    (regimeOperacao === 'saude_educacao'
      ? 'reducao_60'
      : regimeOperacao === 'transporte' || regimeOperacao === 'transporte_intelectual'
        ? 'reducao_30'
        : regimeOperacao === 'cesta_basica'
          ? 'aliquota_zero'
          : 'geral')

  if (anoSimples === 'atual') {
    aliquotaTotal = 0
    aliqCbs = 0
    aliqIbs = 0
  } else if (grupo === 'reducao_60') {
    aliquotaTotal = ehMesmoAnoDoModulo1Simples
      ? config.saudeEducacaoAliquota
      : Number((totalIvaBase * 0.4).toFixed(2))
    const ratioCbs = totalIvaBase > 0 ? cbsBase / totalIvaBase : 0
    aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
    aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
  } else if (grupo === 'reducao_30') {
    aliquotaTotal = ehMesmoAnoDoModulo1Simples
      ? config.transporteAliquota
      : Number((totalIvaBase * 0.7).toFixed(2))
    const ratioCbs = totalIvaBase > 0 ? cbsBase / totalIvaBase : 0
    aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
    aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
  } else if (grupo === 'aliquota_zero') {
    aliquotaTotal = 0
    aliqCbs = 0
    aliqIbs = 0
  }

  const vOperacao = Math.max(0, valorOperacao)
  const debitoCbs = (vOperacao * aliqCbs) / 100
  const debitoIbs = (vOperacao * aliqIbs) / 100
  const totalDebito = debitoCbs + debitoIbs
  const pctComprasSimples = Math.max(0, percentualComprasVendasSimples) / 100
  const pctFornecSimples = Math.min(
    1,
    Math.max(
      0,
      (parametros.porcentagemComprasSimplesNacional ??
        config.porcentagemComprasSimplesNacional ??
        0) / 100,
    ),
  )
  const anoSimplesNum =
    typeof anoSimples === 'number' ? (anoSimples as AnoBaseSimulacao) : (2033 as AnoBaseSimulacao)
  const aliqSimplesCreditoModulo2 =
    obterAliquotasCreditoPorAno(anoSimplesNum).aliquotaSimplesMedia * 100
  const aliqEfetivaComprasModulo2 =
    pctFornecSimples > 0
      ? (1 - pctFornecSimples) * totalIvaBase + pctFornecSimples * aliqSimplesCreditoModulo2
      : totalIvaBase
  const valorCreditos = vOperacao * pctComprasSimples * (aliqEfetivaComprasModulo2 / 100)
  const valorARecolher = Math.max(0, totalDebito - valorCreditos)
  const aliquotaEfetivaSimples = vOperacao > 0 ? (valorARecolher / vOperacao) * 100 : 0

  let etiquetaLegalExibida = ''
  if (anoSimples === 'atual') {
    etiquetaLegalExibida = 'Sistema atual (pré-reforma) · CBS e IBS em 0,00%'
  } else if (presetCorrespondente) {
    etiquetaLegalExibida = `${presetCorrespondente.etiquetaOrigem} · fase ${anoSimples}`
  } else if (regimeOperacao === 'saude_educacao') {
    etiquetaLegalExibida = `LC 214/2025 · redução de 60% · fase ${anoSimples}`
  } else if (regimeOperacao === 'transporte' || regimeOperacao === 'transporte_intelectual') {
    etiquetaLegalExibida = `LC 214/2025 · redução de 30% · fase ${anoSimples}`
  } else if (regimeOperacao === 'cesta_basica') {
    etiquetaLegalExibida = `LC 214/2025 · alíquota zero · fase ${anoSimples}`
  } else {
    etiquetaLegalExibida = `LC 214/2025 · alíquota padrão · fase ${anoSimples}`
  }

  const resultadoSimples = {
    aliquotaCbsAplicada: aliqCbs,
    aliquotaIbsAplicada: aliqIbs,
    aliquotaTotalAplicada: aliquotaTotal,
    debitoCbs,
    debitoIbs,
    totalDebito,
    valorCreditos,
    valorARecolher,
    aliquotaEfetiva: aliquotaEfetivaSimples,
    valorTotalNotaFiscal: vOperacao,
    anoOperacao: anoSimples,
    etiquetaLegalExibida,
  }

  // ==========================================
  // CÁLCULO MÓDULO 3 (Comparativo por Regime)
  // ==========================================
  const faturamentoBruto = Math.max(0, faturamentoMensal)
  const pctExp = Math.max(0, Math.min(100, percentualExportacao)) / 100
  const receitaExportacao = faturamentoBruto * pctExp
  const faturamentoInternoTributavel = Math.max(0, faturamentoBruto - receitaExportacao)

  const pctComprasComp = Math.max(0, percentualComprasVendasComparativo) / 100
  const comprasValor = faturamentoBruto * pctComprasComp
  const despesasCreditosTotal = Math.max(0, despesasComCreditosMensais)
  const folha = Math.max(0, folhaPagamentoMensal)

  let aliqIcmsReal = config.lucroRealIcms
  let aliqIcmsPresumido = config.lucroPresumidoIcms

  const mapaUf: Record<string, number> = {
    AC: 19,
    AL: 19,
    AM: 20,
    AP: 18,
    BA: 20.5,
    CE: 20,
    DF: 20,
    ES: 17,
    GO: 19,
    MA: 22,
    MG: 18,
    MS: 17,
    MT: 17,
    PA: 19,
    PB: 20,
    PE: 20.5,
    PI: 21,
    PR: 19.5,
    RJ: 20,
    RN: 18,
    RO: 19.5,
    RR: 20,
    RS: 17,
    SC: 17,
    SE: 19,
    SP: 18,
    TO: 20,
  }
  if (ufOrigem && mapaUf[ufOrigem]) {
    aliqIcmsReal = mapaUf[ufOrigem]
    aliqIcmsPresumido = mapaUf[ufOrigem]
  }

  const infoSubServico =
    SUBATIVIDADES_SERVICO.find((s) => s.id === subatividadeServico) || SUBATIVIDADES_SERVICO[0]
  const infoSubIndustria =
    SUBATIVIDADES_INDUSTRIA.find((s) => s.id === subatividadeIndustria) ||
    SUBATIVIDADES_INDUSTRIA[0]
  const infoSubComercio =
    SUBATIVIDADES_COMERCIO.find((s) => s.id === subatividadeComercio) || SUBATIVIDADES_COMERCIO[0]
  const infoSubAgro =
    SUBATIVIDADES_AGRONEGOCIO.find((s) => s.id === subatividadeAgro) || SUBATIVIDADES_AGRONEGOCIO[0]
  const infoSubConstrucao =
    SUBATIVIDADES_CONSTRUCAO.find((s) => s.id === subatividadeConstrucao) ||
    SUBATIVIDADES_CONSTRUCAO[0]
  const infoSubLocacao =
    SUBATIVIDADES_LOCACAO.find((s) => s.id === subatividadeLocacao) || SUBATIVIDADES_LOCACAO[0]
  const infoSubFoodService =
    SUBATIVIDADES_FOOD_SERVICE.find((s) => s.id === subatividadeFoodService) ||
    SUBATIVIDADES_FOOD_SERVICE[0]

  let presuncaoIrpj = 32
  let presuncaoCsll = 32
  let taxaIpiIcmsIssReal = 0
  let taxaIpiIcmsIssPresumido = 0
  let nomeImpostoIndireto = ''
  let reducaoIbsCbsPct = 0
  let temImpostoSeletivo = false
  let isIcmsSt = false

  if (tipoAtividade === 'servico') {
    presuncaoIrpj = infoSubServico.presuncaoIrpj
    presuncaoCsll = infoSubServico.presuncaoCsll
    reducaoIbsCbsPct = infoSubServico.reducaoIbsCbsPercentual || 0
    taxaIpiIcmsIssReal = config.lucroRealIss
    taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
    nomeImpostoIndireto = `ISS (${config.lucroPresumidoIss}%)`
  } else if (tipoAtividade === 'industria') {
    presuncaoIrpj = infoSubIndustria.presuncaoIrpj
    presuncaoCsll = infoSubIndustria.presuncaoCsll
    reducaoIbsCbsPct = infoSubIndustria.reducaoIbsCbsPercentual || 0
    temImpostoSeletivo = !!infoSubIndustria.sujeitoImpostoSeletivo
    const aliqIpi =
      infoSubIndustria.aliquotaIpi !== undefined
        ? infoSubIndustria.aliquotaIpi
        : config.lucroRealIpi
    taxaIpiIcmsIssReal = aliqIpi
    taxaIpiIcmsIssPresumido = aliqIpi
    nomeImpostoIndireto = `IPI (${aliqIpi}%)`
  } else if (tipoAtividade === 'comercio') {
    presuncaoIrpj = infoSubComercio.presuncaoIrpj
    presuncaoCsll = infoSubComercio.presuncaoCsll
    reducaoIbsCbsPct = infoSubComercio.reducaoIbsCbsPercentual || 0
    if (infoSubComercio.id === 'com_icms_st') {
      isIcmsSt = true
      taxaIpiIcmsIssReal = 0
      taxaIpiIcmsIssPresumido = 0
      nomeImpostoIndireto = 'ICMS Próprio ≈ 0% (ICMS-ST retido na origem)'
    } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
      taxaIpiIcmsIssReal = infoSubComercio.aliquotaIcmsOverride
      taxaIpiIcmsIssPresumido = infoSubComercio.aliquotaIcmsOverride
      nomeImpostoIndireto = `ICMS Atacado (${infoSubComercio.aliquotaIcmsOverride}%)`
    } else {
      taxaIpiIcmsIssReal = aliqIcmsReal
      taxaIpiIcmsIssPresumido = aliqIcmsPresumido
      nomeImpostoIndireto = `ICMS Varejo (${aliqIcmsReal}%)`
    }
  } else if (tipoAtividade === 'agronegocio') {
    presuncaoIrpj = infoSubAgro.presuncaoIrpj
    presuncaoCsll = infoSubAgro.presuncaoCsll
    reducaoIbsCbsPct = infoSubAgro.reducaoIbsCbsPercentual || 0
    if (infoSubAgro.id === 'agroindustria_processamento') {
      taxaIpiIcmsIssReal = config.lucroRealIpi
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIpi
      nomeImpostoIndireto = `IPI (${config.lucroRealIpi}%)`
    } else {
      taxaIpiIcmsIssReal = aliqIcmsReal
      taxaIpiIcmsIssPresumido = aliqIcmsPresumido
      nomeImpostoIndireto = `ICMS Agro (${aliqIcmsReal}%)`
    }
  } else if (tipoAtividade === 'construcao_civil') {
    presuncaoIrpj = infoSubConstrucao.presuncaoIrpj
    presuncaoCsll = infoSubConstrucao.presuncaoCsll
    reducaoIbsCbsPct = infoSubConstrucao.reducaoIbsCbsPercentual || 0
    taxaIpiIcmsIssReal = config.lucroRealIss
    taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
    nomeImpostoIndireto = `ISS Obras (${config.lucroPresumidoIss}%)`
  } else if (tipoAtividade === 'locacao_bens') {
    presuncaoIrpj = infoSubLocacao.presuncaoIrpj
    presuncaoCsll = infoSubLocacao.presuncaoCsll
    reducaoIbsCbsPct = infoSubLocacao.reducaoIbsCbsPercentual || 0
    if (infoSubLocacao.id === 'coworking_espacos') {
      taxaIpiIcmsIssReal = config.lucroRealIss
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
      nomeImpostoIndireto = `ISS Coworking (${config.lucroPresumidoIss}%)`
    } else {
      taxaIpiIcmsIssReal = 0
      taxaIpiIcmsIssPresumido = 0
      nomeImpostoIndireto = 'Sem ISS (Súmula Vinculante 31 STF)'
    }
  } else if (tipoAtividade === 'food_service') {
    presuncaoIrpj = infoSubFoodService.presuncaoIrpj
    presuncaoCsll = infoSubFoodService.presuncaoCsll
    reducaoIbsCbsPct = infoSubFoodService.reducaoIbsCbsPercentual || 0
    temImpostoSeletivo = !!infoSubFoodService.sujeitoImpostoSeletivo
    taxaIpiIcmsIssReal = aliqIcmsReal
    taxaIpiIcmsIssPresumido = aliqIcmsPresumido
    nomeImpostoIndireto = `ICMS Restaurante (${aliqIcmsReal}%)`
  } else {
    // Misto
    const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
    const pCom = 1 - pServ
    presuncaoIrpj = Number(
      (infoSubServico.presuncaoIrpj * pServ + infoSubComercio.presuncaoIrpj * pCom).toFixed(2),
    )
    presuncaoCsll = Number(
      (infoSubServico.presuncaoCsll * pServ + infoSubComercio.presuncaoCsll * pCom).toFixed(2),
    )
    reducaoIbsCbsPct = Number(
      (
        (infoSubServico.reducaoIbsCbsPercentual || 0) * pServ +
        (infoSubComercio.reducaoIbsCbsPercentual || 0) * pCom
      ).toFixed(2),
    )
    let aliqComercioReal = aliqIcmsReal
    let aliqComercioPres = aliqIcmsPresumido
    if (infoSubComercio.id === 'com_icms_st') {
      aliqComercioReal = 0
      aliqComercioPres = 0
      isIcmsSt = true
    } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
      aliqComercioReal = infoSubComercio.aliquotaIcmsOverride
      aliqComercioPres = infoSubComercio.aliquotaIcmsOverride
    }
    taxaIpiIcmsIssReal = config.lucroRealIss * pServ + aliqComercioReal * pCom
    taxaIpiIcmsIssPresumido = config.lucroPresumidoIss * pServ + aliqComercioPres * pCom
    nomeImpostoIndireto = `ISS (${Math.round(pServ * 100)}%) + ICMS (${Math.round(pCom * 100)}%)`
  }

  // Lucro Real
  const lrPisNominal = (faturamentoInternoTributavel * config.lucroRealPis) / 100
  const lrCofinsNominal = (faturamentoInternoTributavel * config.lucroRealCofins) / 100
  const lrIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssReal) / 100
  const lrTotalNominal = lrPisNominal + lrCofinsNominal + lrIndiretoNominal

  const isAtividadeComercioOuIndustriaOuAgroOuFood =
    tipoAtividade === 'comercio' ||
    tipoAtividade === 'industria' ||
    tipoAtividade === 'agronegocio' ||
    tipoAtividade === 'food_service'

  const aliqCreditoRealCompras = !isAtividadeComercioOuIndustriaOuAgroOuFood
    ? config.lucroRealPis + config.lucroRealCofins
    : isIcmsSt
      ? config.lucroRealPis + config.lucroRealCofins
      : config.lucroRealPis + config.lucroRealCofins + taxaIpiIcmsIssReal
  const creditosComprasReal = (comprasValor * aliqCreditoRealCompras) / 100

  const aliqPisCofinsReal = config.lucroRealPis + config.lucroRealCofins
  const creditosDespesasReal = (despesasCreditosTotal * aliqPisCofinsReal) / 100
  const lrCreditosTotal = creditosComprasReal + creditosDespesasReal
  const lrTotalEfetivo = Math.max(0, lrTotalNominal - lrCreditosTotal)
  const lrAliqEfetiva = faturamentoBruto > 0 ? (lrTotalEfetivo / faturamentoBruto) * 100 : 0

  // Lucro Presumido
  const lpPisNominal = (faturamentoInternoTributavel * config.lucroPresumidoPis) / 100
  const lpCofinsNominal = (faturamentoInternoTributavel * config.lucroPresumidoCofins) / 100
  const lpIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssPresumido) / 100
  const lpTotalNominal = lpPisNominal + lpCofinsNominal + lpIndiretoNominal
  const lpCreditos = 0
  const lpTotalEfetivo = lpTotalNominal
  const lpAliqEfetiva = faturamentoBruto > 0 ? (lpTotalEfetivo / faturamentoBruto) * 100 : 0

  // Simples Nacional
  const rbt12 = faturamentoBruto * 12
  const fatorR = faturamentoBruto > 0 ? folha / faturamentoBruto : 0
  const qualificaAnexoIII = fatorR >= 0.28

  let tabelaSimples = TABELAS_SIMPLES.anexoIII
  let faixaNome = 'Anexo III'
  let anexoCod = 'Anexo III'

  if (tipoAtividade === 'comercio') {
    tabelaSimples = TABELAS_SIMPLES.anexoI
    faixaNome = 'Anexo I (Comércio)'
    anexoCod = 'Anexo I'
  } else if (tipoAtividade === 'industria') {
    tabelaSimples = TABELAS_SIMPLES.anexoII
    faixaNome = 'Anexo II (Indústria)'
    anexoCod = 'Anexo II'
  } else if (tipoAtividade === 'servico') {
    if (qualificaAnexoIII) {
      tabelaSimples = TABELAS_SIMPLES.anexoIII
      faixaNome = 'Anexo III'
      anexoCod = 'Anexo III'
    } else {
      tabelaSimples = TABELAS_SIMPLES.anexoV
      faixaNome = 'Anexo V'
      anexoCod = 'Anexo V'
    }
  } else if (tipoAtividade === 'agronegocio') {
    if (infoSubAgro.id === 'agroindustria_processamento') {
      tabelaSimples = TABELAS_SIMPLES.anexoII
      faixaNome = 'Anexo II (Agroindústria)'
      anexoCod = 'Anexo II'
    } else {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I (Agronegócio)'
      anexoCod = 'Anexo I'
    }
  } else if (tipoAtividade === 'construcao_civil') {
    if (infoSubConstrucao.id === 'engenharia_projetos') {
      tabelaSimples = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
      faixaNome = qualificaAnexoIII ? 'Anexo III (Engenharia)' : 'Anexo V (Engenharia)'
      anexoCod = qualificaAnexoIII ? 'Anexo III' : 'Anexo V'
    } else {
      tabelaSimples = TABELAS_SIMPLES.anexoIV
      faixaNome = 'Anexo IV (Construção Civil)'
      anexoCod = 'Anexo IV'
    }
  } else if (tipoAtividade === 'locacao_bens') {
    if (infoSubLocacao.id === 'coworking_espacos') {
      tabelaSimples = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
      faixaNome = qualificaAnexoIII ? 'Anexo III (Coworking)' : 'Anexo V (Coworking)'
      anexoCod = qualificaAnexoIII ? 'Anexo III' : 'Anexo V'
    } else {
      tabelaSimples = TABELAS_SIMPLES.anexoIII
      faixaNome = 'Anexo III (Locação de Bens Móveis)'
      anexoCod = 'Anexo III'
    }
  } else if (tipoAtividade === 'food_service') {
    tabelaSimples = TABELAS_SIMPLES.anexoI
    faixaNome = 'Anexo I (Bares e Restaurantes)'
    anexoCod = 'Anexo I'
  } else {
    // Misto
    const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
    tabelaSimples = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
    anexoCod = `Misto (I + ${qualificaAnexoIII ? 'III' : 'V'})`
    faixaNome = `Misto: Anexo I (${Math.round((1 - pServ) * 100)}%)`
  }

  let snAliqEfetiva = 0
  if (rbt12 <= 4800000 && rbt12 > 0) {
    if (tipoAtividade === 'misto') {
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const pCom = 1 - pServ
      const tabServ = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
      const fServ = tabServ.find((f) => rbt12 <= f.max) || tabServ[tabServ.length - 1]
      const fCom =
        TABELAS_SIMPLES.anexoI.find((f) => rbt12 <= f.max) ||
        TABELAS_SIMPLES.anexoI[TABELAS_SIMPLES.anexoI.length - 1]
      const aliqServ = Math.max(0, ((rbt12 * (fServ.aliq / 100) - fServ.deducao) / rbt12) * 100)
      const aliqCom = Math.max(0, ((rbt12 * (fCom.aliq / 100) - fCom.deducao) / rbt12) * 100)
      snAliqEfetiva = aliqServ * pServ + aliqCom * pCom
    } else {
      const faixa =
        tabelaSimples.find((f) => rbt12 <= f.max) || tabelaSimples[tabelaSimples.length - 1]
      snAliqEfetiva = Math.max(0, ((rbt12 * (faixa.aliq / 100) - faixa.deducao) / rbt12) * 100)
    }
  } else if (rbt12 > 4800000) {
    snAliqEfetiva = 19.0
    faixaNome = 'Excede o teto de R$ 4,8M/ano'
  }

  const snTotalEfetivo = (faturamentoInternoTributavel * snAliqEfetiva) / 100
  const snCreditos = 0
  const snAliqEfetivaSobreTotal =
    faturamentoBruto > 0 ? (snTotalEfetivo / faturamentoBruto) * 100 : 0

  // IBS / CBS
  const fatorAliquotaIbsCbs = Math.max(0, 1 - reducaoIbsCbsPct / 100)
  const aliquotaCbsEfetivaSaida = config.cbsPadrao * fatorAliquotaIbsCbs
  const aliquotaIbsEfetivaSaida = config.ibsPadrao * fatorAliquotaIbsCbs
  const cbsNominal = (faturamentoInternoTributavel * aliquotaCbsEfetivaSaida) / 100
  const ibsNominal = (faturamentoInternoTributavel * aliquotaIbsEfetivaSaida) / 100
  const aliqIsEfetiva = temImpostoSeletivo ? Math.max(0, aliquotaImpostoSeletivo) : 0
  const valorImpostoSeletivo = (faturamentoInternoTributavel * aliqIsEfetiva) / 100
  const ibsCbsTotalNominal = cbsNominal + ibsNominal + valorImpostoSeletivo

  const pctFornecSimplesComp = Math.min(
    1,
    Math.max(
      0,
      (parametros.porcentagemComprasSimplesNacional ??
        config.porcentagemComprasSimplesNacional ??
        0) / 100,
    ),
  )
  const anoTransicaoComp =
    typeof config.anoTransicao === 'number'
      ? (config.anoTransicao as AnoBaseSimulacao)
      : (2033 as AnoBaseSimulacao)
  const aliqSimplesCreditoModulo3 =
    obterAliquotasCreditoPorAno(anoTransicaoComp).aliquotaSimplesMedia * 100
  const aliqEfetivaComprasModulo3 =
    pctFornecSimplesComp > 0
      ? (1 - pctFornecSimplesComp) * config.totalIvaDual +
        pctFornecSimplesComp * aliqSimplesCreditoModulo3
      : config.totalIvaDual
  const creditosComprasIbsCbs = (comprasValor * aliqEfetivaComprasModulo3) / 100
  const creditosDespesasIbsCbs = (despesasCreditosTotal * config.totalIvaDual) / 100
  const ibsCbsCreditosTotal = creditosComprasIbsCbs + creditosDespesasIbsCbs
  const ibsCbsTotalEfetivo = Math.max(0, ibsCbsTotalNominal - ibsCbsCreditosTotal)
  const ibsCbsAliqEfetiva = faturamentoBruto > 0 ? (ibsCbsTotalEfetivo / faturamentoBruto) * 100 : 0

  const ehAno2026OuAtualComparativo =
    config.anoTransicao === 'atual' || String(config.anoTransicao) === '2026'

  const cenarios = [
    { nome: 'Lucro Real', total: lrTotalEfetivo, aliq: lrAliqEfetiva },
    { nome: 'Lucro Presumido', total: lpTotalEfetivo, aliq: lpAliqEfetiva },
    { nome: 'Simples Nacional', total: snTotalEfetivo, aliq: snAliqEfetivaSobreTotal },
    ...(ehAno2026OuAtualComparativo
      ? []
      : [{ nome: 'IBS/CBS', total: ibsCbsTotalEfetivo, aliq: ibsCbsAliqEfetiva }]),
  ]

  let fatorReducaoSetorialSimples = 1.0
  if (config.presetSetor && config.presetSetor !== 'nenhum') {
    const presetInfo = PRESETS_SETORES_LC214.find((p) => p.id === config.presetSetor)
    if (presetInfo) {
      fatorReducaoSetorialSimples = Math.max(0, 1 - (presetInfo.reducaoPercentual || 0) / 100)
    }
  } else if (reducaoIbsCbsPct > 0) {
    fatorReducaoSetorialSimples = Math.max(0, 1 - reducaoIbsCbsPct / 100)
  }

  const simplesReformaCalculado = calcularIbsCbsSimplesNacional({
    faturamentoMensal: faturamentoBruto,
    aliquotaEfetivaAtualSimples: snAliqEfetivaSobreTotal,
    ano: (config.anoTransicao as AnoBaseSimulacao | 'atual') || 2033,
    fatorReducaoSetorial: fatorReducaoSetorialSimples,
    percentualExportacao,
  })

  const isRegimeSimplesSelecionado = config.regimeAtualEmpresa === 'Simples Nacional'
  const cenariosOrdenados = [...cenarios].sort((a, b) => a.total - b.total)
  const melhor = cenariosOrdenados[0]
  const pior = cenariosOrdenados[cenariosOrdenados.length - 1]
  const economia = Math.max(0, pior.total - melhor.total)
  const economiaPct = pior.total > 0 ? (economia / pior.total) * 100 : 0

  let regimeMaisVantajosoFinal = melhor.nome
  let piorCenarioFinal = pior.nome
  let economiaFinal = economia
  let economiaPctFinal = economiaPct

  if (isRegimeSimplesSelecionado) {
    if (ehAno2026OuAtualComparativo) {
      regimeMaisVantajosoFinal = 'Simples Nacional (DAS atual)'
      piorCenarioFinal = 'Simples Nacional'
      economiaFinal = 0
      economiaPctFinal = 0
    } else {
      const transicaoMenorQueDas =
        simplesReformaCalculado.cenarioTransicaoTotal < simplesReformaCalculado.dasAtualTotal
      if (transicaoMenorQueDas) {
        regimeMaisVantajosoFinal = 'Simples na Reforma (Transição)'
        piorCenarioFinal = 'DAS Atual'
        economiaFinal = simplesReformaCalculado.economiaMensal
        economiaPctFinal = Math.abs(simplesReformaCalculado.variacaoPercentual)
      } else if (
        simplesReformaCalculado.cenarioTransicaoTotal > simplesReformaCalculado.dasAtualTotal
      ) {
        regimeMaisVantajosoFinal = 'DAS Atual (Mais Econômico)'
        piorCenarioFinal = 'Simples na Reforma (Transição)'
        economiaFinal = simplesReformaCalculado.diferencaMensal
        economiaPctFinal = simplesReformaCalculado.variacaoPercentual
      } else {
        regimeMaisVantajosoFinal = 'Simples Nacional (Equivalente)'
        piorCenarioFinal = 'Simples Nacional'
        economiaFinal = 0
        economiaPctFinal = 0
      }
    }
  }

  const resultadoComparativo = {
    lucroReal: {
      totalEfetivo: lrTotalEfetivo,
      aliquotaEfetiva: lrAliqEfetiva,
      totalNominal: lrTotalNominal,
      creditos: lrCreditosTotal,
    },
    lucroPresumido: {
      totalEfetivo: lpTotalEfetivo,
      aliquotaEfetiva: lpAliqEfetiva,
      totalNominal: lpTotalNominal,
      creditos: lpCreditos,
    },
    simplesNacional: {
      totalEfetivo: snTotalEfetivo,
      aliquotaEfetiva: snAliqEfetivaSobreTotal,
      totalNominal: snTotalEfetivo,
      creditos: snCreditos,
      anexoUtilizado: anexoCod,
      faixaEncontrada: faixaNome,
    },
    ibsCbs: {
      totalEfetivo: ibsCbsTotalEfetivo,
      aliquotaEfetiva: ibsCbsAliqEfetiva,
      totalNominal: ibsCbsTotalNominal,
      creditos: ibsCbsCreditosTotal,
      impostoSeletivo: valorImpostoSeletivo,
    },
    simplesReforma: simplesReformaCalculado,
    regimeMaisVantajoso: regimeMaisVantajosoFinal,
    piorCenario: piorCenarioFinal,
    economiaVersusPior: economiaFinal,
    economiaPercentual: economiaPctFinal,
  }

  // ==========================================
  // CÁLCULO MÓDULO 4 (Simulador de Créditos)
  // ==========================================
  const anoCreditos = anoOperacao || config.anoTransicao || 2033
  const dadosFaseAnoCreditos =
    CRONOGRAMA_FASES_TRANSICAO[anoCreditos] || CRONOGRAMA_FASES_TRANSICAO[2033]
  const aliquotaReferenciaFaseCreditos =
    config.anoTransicao === anoCreditos ? config.totalIvaDual : dadosFaseAnoCreditos.totalIvaDual

  const grupoRegimeCred = obterGrupoRegimeOperacao(regimeOperacao)
  const isAliquotaZeroCred = grupoRegimeCred === 'aliquota_zero'

  let totalAntigoCred = 0
  let totalNovoCred = 0

  despesasCreditos.forEach((item) => {
    const v = Math.max(0, item.valorMensal)
    const cAntigo = (v * item.aliquotaAntiga) / 100
    const aliqNova = isAliquotaZeroCred
      ? 0
      : item.aliquotaNova !== undefined
        ? item.aliquotaNova
        : aliquotaReferenciaFaseCreditos
    const cNovo = (v * aliqNova) / 100
    totalAntigoCred += cAntigo
    totalNovoCred += cNovo
  })

  const adicionalGanhoCred = totalNovoCred - totalAntigoCred
  const aumentoPercentualCred =
    totalAntigoCred > 0 ? (adicionalGanhoCred / totalAntigoCred) * 100 : 0
  const economiaAnualCred = adicionalGanhoCred * 12

  const resultadoCreditos = {
    totalAntigo: totalAntigoCred,
    totalNovo: totalNovoCred,
    adicionalGanho: adicionalGanhoCred,
    aumentoPercentual: aumentoPercentualCred,
    economiaAnual: economiaAnualCred,
    anoOperacao: anoCreditos,
    aliquotaReferencia: aliquotaReferenciaFaseCreditos,
    regimeOperacao,
    grupoRegime: grupoRegimeCred,
    isAliquotaZero: isAliquotaZeroCred,
  }

  // ==========================================
  // ETAPA 5: CRÉDITO PRESUMIDO DE ESTOQUE
  // ==========================================
  const isSetorServico = setorTransicao === 'servico'
  // Atividade mista: a fração prestadora de serviços não guarda mercadoria em estoque,
  // então o crédito presumido de abertura incide apenas sobre a parcela mercantil.
  const fatorMercantilMisto =
    setorTransicao === 'misto' ? Math.max(0, Math.min(100, 100 - proporcaoServicoMisto)) / 100 : 1
  const estoqueBruto = Math.max(0, valorEstoqueVirada)
  const estoque = isSetorServico ? 0 : estoqueBruto * fatorMercantilMisto
  const aliqCreditoEstoque = config.cbsPadrao
  const creditoTotalEstoque = (estoque * aliqCreditoEstoque) / 100
  const resultadoEstoque = {
    valorEstoqueVirada: estoque,
    aliquotaCreditoPresumido: aliqCreditoEstoque,
    creditoTotalEstoque,
    economiaAno1: creditoTotalEstoque,
    ...(setorTransicao === 'misto'
      ? {
          percentualServicoMistoAplicado: proporcaoServicoMisto,
          valorEstoqueBrutoInformado: estoqueBruto,
        }
      : {}),
  }

  // ==========================================
  // CÁLCULO MÓDULO 5 (Transição 2026 a 2033)
  // ==========================================
  const anosTransicao: AnoTransicaoIbsCbs[] = [
    'atual',
    2026,
    2027,
    2028,
    2029,
    2030,
    2031,
    2032,
    2033,
  ]
  const fatAnual = Math.max(0, faturamentoAnualProjetado)

  const aliqAtualEstimada =
    setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
      ? config.lucroPresumidoPis + config.lucroPresumidoCofins + config.lucroPresumidoIss
      : setorTransicao === 'locacao_bens'
        ? config.lucroPresumidoPis + config.lucroPresumidoCofins
        : setorTransicao === 'industria'
          ? config.lucroRealPis + config.lucroRealCofins + config.lucroRealIpi
          : config.lucroRealPis + config.lucroRealCofins + config.lucroRealIcms
  const impostoAtual = (fatAnual * aliqAtualEstimada) / 100

  const fatorReducaoTransicao = Math.max(0, 1 - reducaoIbsCbsPct / 100)

  const resultadoTransicao = anosTransicao.map((ano) => {
    const dadosFase = CRONOGRAMA_FASES_TRANSICAO[ano]
    const fase = dadosFase.fase
    const aliqCbsBase = dadosFase.aliquotaCbs
    const aliqIbsBase = dadosFase.aliquotaIbs

    let aliqCbsAno = aliqCbsBase
    let aliqIbsAno = aliqIbsBase
    let aliqEfetivaAno = aliqCbsAno + aliqIbsAno

    if (ano === 'atual' || ano === 2026) {
      aliqEfetivaAno = aliqAtualEstimada
    } else if (ano === 2027 || ano === 2028) {
      aliqCbsAno = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
      aliqIbsAno = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
      const remanescente =
        setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
          ? config.lucroPresumidoIss
          : setorTransicao === 'locacao_bens'
            ? 0
            : config.lucroRealIcms
      aliqEfetivaAno = aliqCbsAno + remanescente
    } else if (typeof ano === 'number' && ano >= 2029 && ano <= 2032) {
      aliqCbsAno = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
      aliqIbsAno = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
      const fatorIbs = (ano - 2028) * 0.1
      const fatorAntigo = 1 - fatorIbs
      const remanescente =
        (setorTransicao === 'servico' || setorTransicao === 'construcao_civil'
          ? config.lucroPresumidoIss
          : setorTransicao === 'locacao_bens'
            ? 0
            : config.lucroRealIcms) * fatorAntigo
      aliqEfetivaAno = (aliqCbsBase + aliqIbsBase) * fatorReducaoTransicao + remanescente
    } else {
      aliqCbsAno = Number((aliqCbsBase * fatorReducaoTransicao).toFixed(2))
      aliqIbsAno = Number((aliqIbsBase * fatorReducaoTransicao).toFixed(2))
      aliqEfetivaAno = config.totalIvaDual * fatorReducaoTransicao
    }

    const impostoEstimado = (fatAnual * aliqEfetivaAno) / 100
    const creditoEstoqueAno =
      ano === 2027 && setorTransicao !== 'servico' ? resultadoEstoque.economiaAno1 : 0

    return {
      ano,
      fase,
      aliquotaCbs: aliqCbsAno,
      aliquotaIbs: aliqIbsAno,
      impostoEstimado,
      aliquotaEfetivaTotal: Number(aliqEfetivaAno.toFixed(2)),
      creditoEstoqueAno,
    }
  })

  // ==========================================
  // ETAPA 4: SPLIT PAYMENT
  // ==========================================
  const anoAtualSplit = anoTransicaoDashboard ?? config.anoTransicao ?? 2033
  const is2026OuAtualSplit = anoAtualSplit === 'atual' || String(anoAtualSplit) === '2026'
  const fatorReducaoSplit = Math.max(0, 1 - reducaoIbsCbsPct / 100)
  const retencaoMensalNota =
    (faturamentoInternoTributavel * config.totalIvaDual * fatorReducaoSplit) / 100

  let recolhimentoAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
  if (regimeAtualFiltro === 'Lucro Real') {
    recolhimentoAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
  } else if (regimeAtualFiltro === 'Lucro Presumido') {
    recolhimentoAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
  }

  const taxaDecimal = Math.max(0, taxaMensalCapitalGiro) / 100
  const fatorTempo = Math.max(1, diasAntecipacaoSplit) / 30
  const custoCapitalMensal = is2026OuAtualSplit ? 0 : retencaoMensalNota * taxaDecimal * fatorTempo

  const resultadoSplitPayment = {
    retencaoMensalNota: is2026OuAtualSplit ? 0 : retencaoMensalNota,
    recolhimentoAtualMensal,
    diferencaFluxoCaixa: is2026OuAtualSplit ? 0 : retencaoMensalNota - recolhimentoAtualMensal,
    taxaMensalCapital: taxaMensalCapitalGiro,
    custoCapitalMensal,
    custoCapitalAnual: custoCapitalMensal * 12,
    diasAntecipacao: diasAntecipacaoSplit,
  }

  // ==========================================
  // CÁLCULO MÓDULO 6 (Dashboard KPIs)
  // ==========================================
  const anoDashboard = anoTransicaoDashboard ?? config.anoTransicao ?? 2033
  const is2026Dash = String(anoDashboard) === '2026'
  const isAtualDash = anoDashboard === 'atual'
  const is2026OuAtualDash = is2026Dash || isAtualDash

  let aliqAtualDash = 0
  let cargaAtualMensalDash = 0

  if (regimeAtualFiltro === 'Lucro Real') {
    aliqAtualDash = resultadoComparativo.lucroReal.aliquotaEfetiva
    cargaAtualMensalDash = resultadoComparativo.lucroReal.totalEfetivo
  } else if (regimeAtualFiltro === 'Lucro Presumido') {
    aliqAtualDash = resultadoComparativo.lucroPresumido.aliquotaEfetiva
    cargaAtualMensalDash = resultadoComparativo.lucroPresumido.totalEfetivo
  } else {
    aliqAtualDash = resultadoComparativo.simplesNacional.aliquotaEfetiva
    cargaAtualMensalDash = resultadoComparativo.simplesNacional.totalEfetivo
  }

  let aliqNovaDash = 0
  let cargaNovaMensalDash = 0
  let economiaMensalDash = 0
  let economiaAnualDash = 0
  let regimeRecDash = ''

  if (regimeAtualFiltro === 'Simples Nacional') {
    const sr = resultadoComparativo.simplesReforma
    if (is2026OuAtualDash) {
      aliqNovaDash = aliqAtualDash
      cargaNovaMensalDash = cargaAtualMensalDash
      regimeRecDash = 'Simples Nacional (DAS atual)'
    } else if (sr) {
      aliqNovaDash = sr.aliquotaEfetivaTransicao
      cargaNovaMensalDash = sr.cenarioTransicaoTotal
      economiaMensalDash = sr.economiaMensal
      economiaAnualDash = sr.economiaAnual
      regimeRecDash =
        sr.cenarioTransicaoTotal < sr.dasAtualTotal
          ? 'Simples na Reforma (Transição)'
          : 'DAS Atual (Mais Econômico)'
    } else {
      aliqNovaDash = aliqAtualDash
      cargaNovaMensalDash = cargaAtualMensalDash
      regimeRecDash = 'Simples Nacional'
    }
  } else {
    aliqNovaDash = is2026OuAtualDash ? 0 : resultadoComparativo.ibsCbs.aliquotaEfetiva
    cargaNovaMensalDash = is2026OuAtualDash ? 0 : resultadoComparativo.ibsCbs.totalEfetivo
    economiaMensalDash = is2026OuAtualDash ? 0 : cargaAtualMensalDash - cargaNovaMensalDash
    economiaAnualDash = economiaMensalDash * 12

    const cenariosTradicionais = [
      { nome: 'Lucro Real', total: resultadoComparativo.lucroReal.totalEfetivo },
      { nome: 'Lucro Presumido', total: resultadoComparativo.lucroPresumido.totalEfetivo },
      { nome: 'Simples Nacional', total: resultadoComparativo.simplesNacional.totalEfetivo },
    ].sort((a, b) => a.total - b.total)

    regimeRecDash = is2026OuAtualDash
      ? cenariosTradicionais[0]?.nome || 'Simples Nacional'
      : resultadoComparativo.regimeMaisVantajoso
  }

  const resultadoDashboard = {
    aliquotaEfetivaAtual: aliqAtualDash,
    aliquotaEfetivaNova: aliqNovaDash,
    economiaMensalProjetada: economiaMensalDash,
    economiaAnualProjetada: economiaAnualDash,
    regimeRecomendado: regimeRecDash,
  }

  return {
    resultadoSimples,
    resultadoComparativo,
    resultadoCreditos,
    resultadoTransicao,
    resultadoEstoque,
    resultadoSplitPayment,
    resultadoDashboard,
  }
}
