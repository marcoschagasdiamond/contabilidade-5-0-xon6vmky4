/**
 * Motor de Cálculo para Análise de Fornecedores sob a Reforma Tributária (EC 132/2023 e LC 214/2025).
 *
 * REGRAS DO ESCOPO:
 * 1. Fornecedor de Regime Regular (Lucro Real ou Presumido):
 *    - Sob o IBS/CBS pleno (2033), alíquota de referência ~26,5% (CBS 8,8% + IBS 17,7%).
 *    - Durante a transição 2026-2033:
 *      * 2026: Fase de teste (CBS 0,9%, IBS 0,1% compensáveis, sem acúmulo)
 *      * 2027-2028: CBS 8,7% (8,8% - 0,1 p.p. art. 347 LC 214) + PIS/COFINS extintos + ICMS/ISS integrais (~12%)
 *      * 2029-2032: Transição federativa (CBS 8,8% + IBS 10% a 40% + ICMS/ISS 90% a 60%)
 *      * 2033: Plena vigência (IBS + CBS = 26,5%)
 * 2. Fornecedor optante do Simples Nacional:
 *    - Transfere crédito apenas correspondente à parcela do tributo incidente na partilha do DAS (LC 214/2025 art. 41 § 3º e art. 519, ou PIS/COFINS atual ~3,0% a 7,0%).
 *    - Alíquota efetiva média de transferência do Simples: ~3,5% a 7% (padrão 4,5% a 5,0% ajustável).
 * 3. Classificação do item/produto adquirido:
 *    - 'integral': 100% da base gera crédito aproveitável.
 *    - 'parcial': percentual customizado informado (ex: 50%, 70%) gera crédito.
 *    - 'nao_gera': 0% de crédito aproveitável (aqui NÃO há diferença de quem comprar — perda é zero pois ninguém geraria crédito).
 * 4. Regime do COMPRADOR (Cliente adquirente):
 *    - Se o adquirente for 'Simples Nacional':
 *      O adquirente do Simples Nacional não aproveita créditos do regime não-cumulativo (salvo se optar pelo regime regular de IBS/CBS por fora — modelo híbrido).
 *      Por padrão, quem está no Simples Tradicional tem crédito aproveitável = 0 e custo líquido = preço de face da compra.
 *    - Se o adquirente for 'Lucro Real' ou 'Lucro Presumido' (ou 'Regime Regular'):
 *      Aproveita créditos conforme o regime do fornecedor e a alíquota aplicável ao produto.
 * 5. Custo Líquido de Aquisição:
 *    Custo Líquido = Preço Pago (Volume de Compras) − Crédito Aproveitável
 * 6. Crédito Perdido (Gargalo de compra de Simples vs. Regime Regular):
 *    Crédito Potencial se comprado de Regime Regular − Crédito Efetivamente Aproveitado
 */

import {
  type AnoBaseSimulacao,
  ANOS_SIMULACAO_DISPONIVEIS,
  TAXA_CBS_REFERENCIA,
  TAXA_IBS_REFERENCIA,
  SOMA_IVA_DUAL_REFERENCIA,
  REDUCAO_CBS_2027_2028,
  FATOR_TRANSICAO_IBS,
  FATOR_REMANESCENTE_ICMS_ISS,
  isAnoPosTransicaoSimulacao,
} from './reformaTributaria'
import type {
  FornecedorDiagnostico,
  RegimeFornecedor,
  ClassificacaoCreditoItem,
} from '@/services/fornecedores'

export type RegimeComprador = 'lucro_real' | 'lucro_presumido' | 'simples_nacional'

export interface AliquotasCreditoAno {
  ano: AnoBaseSimulacao
  aliquotaRegimeRegular: number // decimal (ex: 0.265 para 26,5%)
  aliquotaSimplesMedia: number // decimal (ex: 0.045 para 4,5%)
  detalhesTexto: string
}

/**
 * Retorna as alíquotas efetivas de crédito gerado por ano da transição (2026-2040)
 * para Regime Regular vs. Simples Nacional sob a LC 214/2025.
 * A partir de 2034 a transição está concluída: mesmo tratamento do ano pleno 2033.
 */
export function obterAliquotasCreditoPorAno(ano: AnoBaseSimulacao): AliquotasCreditoAno {
  if (ano === 2026) {
    // 2026: Sistema atual vigente (PIS/COFINS 9,25% no Real + ICMS 12% a 18% = ~21,25% a 26,5% ou CBS/IBS 1% teste)
    // No sistema atual regular o crédito médio somado (PIS/COFINS não cumulativo + ICMS insumos) gira em torno de 21,25% a 26,5%
    return {
      ano,
      aliquotaRegimeRegular: 0.2125, // 9,25% PIS/COFINS + 12% ICMS insumos
      aliquotaSimplesMedia: 0.035, // LC 123/2006 art. 23 (ICMS ~1,25% a 3,95% + PIS/COFINS 0%)
      detalhesTexto: 'Ano 2026: Sistema atual (PIS/COFINS + ICMS) com teste piloto CBS/IBS 1,0%.',
    }
  }

  if (ano === 2027 || ano === 2028) {
    // CBS 8,7% (8,8% - 0,1 p.p. art. 347 LC 214) + ICMS remanescente 12% = ~20,7%
    // Simples Nacional transfere CBS proporcional (~15,33% da guia = ~1,5% a 2,5% + ICMS ~3%) = ~4,5%
    const aliqCBS = Math.max(0, TAXA_CBS_REFERENCIA - REDUCAO_CBS_2027_2028)
    const aliqRegular = aliqCBS + 0.12 // CBS 8,7% + ICMS 12%
    return {
      ano,
      aliquotaRegimeRegular: aliqRegular, // ~20,7%
      aliquotaSimplesMedia: 0.045, // ~4,5%
      detalhesTexto: `Ano ${ano}: CBS entra com 8,7% (redução transitória de 0,1 p.p.); ICMS ainda vigente integral (12%).`,
    }
  }

  if (ano >= 2029 && ano <= 2032) {
    // Transição federativa (ADCT art. 128)
    const fatorIBS = FATOR_TRANSICAO_IBS[ano] // 0.1, 0.2, 0.3, 0.4
    const fatorAntigos = FATOR_REMANESCENTE_ICMS_ISS[ano] // 0.9, 0.8, 0.7, 0.6
    const aliqCBS = TAXA_CBS_REFERENCIA // 8,8%
    const aliqIBS = TAXA_IBS_REFERENCIA * fatorIBS
    const aliqICMS = 0.12 * fatorAntigos
    const aliqRegular = aliqCBS + aliqIBS + aliqICMS
    // Simples Nacional vai transferindo CBS + IBS conforme Anexos XVIII-XXII LC 214/2025 (~4,8% a 6,2%)
    const aliqSimples = 0.045 + 0.04 * fatorIBS
    return {
      ano,
      aliquotaRegimeRegular: aliqRegular,
      aliquotaSimplesMedia: Math.min(0.07, aliqSimples),
      detalhesTexto: `Ano ${ano}: Transição federativa (IBS ${Math.round(fatorIBS * 100)}%, ICMS ${Math.round(fatorAntigos * 100)}%, CBS 8,8%).`,
    }
  }

  // 2033 pleno (e 2034+ regime definitivo — transição concluída): CBS (8,8%) + IBS (17,7%) = 26,5%
  // Simples Nacional no regime híbrido transfere cota de consumo (~6,5% a 7,0%)
  return {
    ano,
    aliquotaRegimeRegular: SOMA_IVA_DUAL_REFERENCIA, // 26,5%
    aliquotaSimplesMedia: 0.065, // ~6,5%
    detalhesTexto: isAnoPosTransicaoSimulacao(ano)
      ? `Ano ${ano}: Regime definitivo — 100% IBS/CBS (CBS 8,8% + IBS 17,7% = 26,5%), transição concluída.`
      : 'Ano 2033: Sistema Pleno IVA Dual (CBS 8,8% + IBS 17,7% = 26,5%).',
  }
}

export interface ResultadoCalculoFornecedor {
  fornecedor: FornecedorDiagnostico
  ano: AnoBaseSimulacao
  regimeComprador: RegimeComprador
  // Alíquotas aplicadas
  aliquotaRegimeRegularAplicavel: number // % (ex: 26.5)
  aliquotaEfetivaCredito: number // % (ex: 4.5 se for Simples, 26.5 se for Real/Presumido)
  fatorProduto: number // 1.0 integral, 0.0 nao_gera, ou % parcial
  // Valores financeiros
  volumeCompras: number // R$
  creditoAproveitavel: number // R$ efetivamente recuperado
  custoLiquidoAquisicao: number // R$ (Volume - Credito)
  creditoPotencialRegular: number // R$ (se comprado de Lucro Real/Presumido)
  custoLiquidoPotencialRegular: number // R$
  creditoPerdido: number // R$ (CreditoPotencial - CreditoAproveitavel)
  percentualPerdaSobreCompras: number // %
  diferencaPercentualCusto: number // %
  ehGargalo: boolean // se crédito perdido > 0
  explicacao: string
}

export interface ResultadoComparativoAnosFornecedor {
  ano: AnoBaseSimulacao
  aliquotaRegular: number
  aliquotaSimples: number
  creditoAproveitavelTotal: number
  creditoPerdidoTotal: number
  custoLiquidoTotal: number
}

export interface ResumoCarteiraFornecedores {
  anoSelecionado: AnoBaseSimulacao
  regimeComprador: RegimeComprador
  totalFornecedores: number
  volumeTotalCompras: number
  creditoAproveitavelTotal: number
  custoLiquidoTotal: number
  creditoPerdidoTotal: number
  percentualMedioPerda: number
  totalGargalos: number
  distribuicaoPorRegime: {
    lucroReal: { quantidade: number; volume: number; creditoAproveitado: number; perda: number }
    lucroPresumido: {
      quantidade: number
      volume: number
      creditoAproveitado: number
      perda: number
    }
    simplesNacional: {
      quantidade: number
      volume: number
      creditoAproveitado: number
      perda: number
    }
    misto: { quantidade: number; volume: number; creditoAproveitado: number; perda: number }
  }
  rankingGargalos: ResultadoCalculoFornecedor[]
  detalhamentoPorFornecedor: ResultadoCalculoFornecedor[]
  evolucaoAnos: ResultadoComparativoAnosFornecedor[]
}

/**
 * Normaliza o regime do comprador vindo do perfil de dados da empresa
 */
export function normalizarRegimeComprador(regimeTexto?: string): RegimeComprador {
  if (!regimeTexto) return 'lucro_real'
  const t = regimeTexto.toLowerCase()
  if (t.includes('simples')) return 'simples_nacional'
  if (t.includes('presumido')) return 'lucro_presumido'
  return 'lucro_real'
}

/**
 * Calcula a análise de um único fornecedor para um ano específico
 */
export function calcularDiagnosticoFornecedor(
  fornecedor: FornecedorDiagnostico,
  ano: AnoBaseSimulacao,
  regimeComprador: RegimeComprador,
): ResultadoCalculoFornecedor {
  const volume = Math.max(0, fornecedor.volume_compras || 0)
  const infoAno = obterAliquotasCreditoPorAno(ano)

  // 1. Fator do produto:
  // - nao_gera: 0 (sem crédito de ninguém)
  // - integral: 1.0 (crédito total do regime)
  // - parcial: percentual customizado / 100
  let fatorProduto = 1.0
  if (fornecedor.classificacao_credito === 'nao_gera') {
    fatorProduto = 0.0
  } else if (fornecedor.classificacao_credito === 'parcial') {
    const pct = Math.max(0, Math.min(100, fornecedor.percentual_credito_parcial ?? 50))
    fatorProduto = pct / 100
  }

  // 2. Regime do Comprador:
  // Se o comprador está no Simples Nacional tradicional:
  // Pela regra geral da LC 123/2006 e LC 214/2025, o optante do Simples não se apropria de créditos
  // na entrada contra o seu DAS. Custo líquido = volume de compra, crédito = 0, perda = 0.
  const compradorNoSimples = regimeComprador === 'simples_nacional'

  // Alíquota de referência do regime regular
  const aliqRegular = infoAno.aliquotaRegimeRegular

  // Alíquota de crédito gerada pelo fornecedor:
  let aliqEfetivaFornecedor = 0
  if (fornecedor.regime === 'lucro_real' || fornecedor.regime === 'lucro_presumido') {
    // Ambos no regime regular geram alíquota plena do período
    aliqEfetivaFornecedor = aliqRegular
  } else if (fornecedor.regime === 'simples_nacional') {
    // Alíquota informada ou estimada pelo padrão do ano (3% a 7%)
    if (fornecedor.aliquota_simples_informada && fornecedor.aliquota_simples_informada > 0) {
      aliqEfetivaFornecedor = fornecedor.aliquota_simples_informada / 100
    } else {
      aliqEfetivaFornecedor = infoAno.aliquotaSimplesMedia
    }
  } else if (fornecedor.regime === 'misto') {
    // Misto: proporção informada (% Lucro Real + % Simples)
    const pctReal = Math.max(0, Math.min(100, fornecedor.proporcao_misto ?? 50)) / 100
    const aliqSimples =
      fornecedor.aliquota_simples_informada && fornecedor.aliquota_simples_informada > 0
        ? fornecedor.aliquota_simples_informada / 100
        : infoAno.aliquotaSimplesMedia
    aliqEfetivaFornecedor = pctReal * aliqRegular + (1 - pctReal) * aliqSimples
  }

  // Se o comprador for do Simples, não aproveita nada
  if (compradorNoSimples) {
    aliqEfetivaFornecedor = 0
  }

  // Crédito efetivamente aproveitável:
  const creditoAproveitavel = volume * aliqEfetivaFornecedor * fatorProduto
  const custoLiquidoAquisicao = volume - creditoAproveitavel

  // Crédito potencial se este mesmo produto fosse comprado de um fornecedor do Regime Regular:
  let creditoPotencialRegular = 0
  if (!compradorNoSimples) {
    creditoPotencialRegular = volume * aliqRegular * fatorProduto
  }
  const custoLiquidoPotencialRegular = volume - creditoPotencialRegular

  // Crédito perdido (perda de crédito tributário por comprar de Simples/Misto vs Regular):
  // Se o item NÃO gera crédito, a perda é estritamente 0!
  const creditoPerdido =
    fatorProduto === 0 ? 0 : Math.max(0, creditoPotencialRegular - creditoAproveitavel)

  const percentualPerdaSobreCompras = volume > 0 ? (creditoPerdido / volume) * 100 : 0
  const diferencaPercentualCusto =
    custoLiquidoPotencialRegular > 0
      ? ((custoLiquidoAquisicao - custoLiquidoPotencialRegular) / custoLiquidoPotencialRegular) *
        100
      : 0

  let explicacao = ''
  if (fornecedor.classificacao_credito === 'nao_gera') {
    explicacao =
      'O item adquirido não gera crédito tributário na legislação. Não há diferença de regime de quem comprar.'
  } else if (compradorNoSimples) {
    explicacao =
      'Como sua empresa está no Simples Nacional tradicional, não aproveita créditos da não-cumulatividade nesta etapa.'
  } else if (fornecedor.regime === 'simples_nacional') {
    explicacao = `Fornecedor do Simples gera apenas ${(aliqEfetivaFornecedor * 100).toFixed(1)}% de crédito contra ${(aliqRegular * 100).toFixed(1)}% do regime regular, gerando perda líquida de R$ ${creditoPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
  } else if (fornecedor.regime === 'misto') {
    explicacao = `Fornecedor misto (${fornecedor.proporcao_misto || 50}% regular / ${100 - (fornecedor.proporcao_misto || 50)}% simples) gera crédito ponderado de ${(aliqEfetivaFornecedor * 100).toFixed(1)}%.`
  } else {
    explicacao = `Fornecedor de Regime Regular gera crédito integral de ${(aliqRegular * 100).toFixed(1)}% sob o cronograma da LC 214/2025 para ${ano}.`
  }

  return {
    fornecedor,
    ano,
    regimeComprador,
    aliquotaRegimeRegularAplicavel: aliqRegular * 100,
    aliquotaEfetivaCredito: aliqEfetivaFornecedor * 100,
    fatorProduto,
    volumeCompras: volume,
    creditoAproveitavel,
    custoLiquidoAquisicao,
    creditoPotencialRegular,
    custoLiquidoPotencialRegular,
    creditoPerdido,
    percentualPerdaSobreCompras,
    diferencaPercentualCusto,
    ehGargalo: creditoPerdido > 1,
    explicacao,
  }
}

/**
 * Calcula a análise completa da carteira de fornecedores, com ranking e evolução 2026-2033
 */
export function calcularResumoCarteiraFornecedores(
  fornecedores: FornecedorDiagnostico[],
  anoSelecionado: AnoBaseSimulacao = 2027,
  regimeComprador: RegimeComprador = 'lucro_real',
): ResumoCarteiraFornecedores {
  const detalhamentoPorFornecedor = fornecedores.map((f) =>
    calcularDiagnosticoFornecedor(f, anoSelecionado, regimeComprador),
  )

  // Ranking ordenado pelo crédito perdido desc (maiores gargalos primeiro)
  const rankingGargalos = [...detalhamentoPorFornecedor].sort(
    (a, b) => b.creditoPerdido - a.creditoPerdido,
  )

  let volumeTotalCompras = 0
  let creditoAproveitavelTotal = 0
  let custoLiquidoTotal = 0
  let creditoPerdidoTotal = 0
  let totalGargalos = 0

  const dist = {
    lucroReal: { quantidade: 0, volume: 0, creditoAproveitado: 0, perda: 0 },
    lucroPresumido: { quantidade: 0, volume: 0, creditoAproveitado: 0, perda: 0 },
    simplesNacional: { quantidade: 0, volume: 0, creditoAproveitado: 0, perda: 0 },
    misto: { quantidade: 0, volume: 0, creditoAproveitado: 0, perda: 0 },
  }

  detalhamentoPorFornecedor.forEach((item) => {
    volumeTotalCompras += item.volumeCompras
    creditoAproveitavelTotal += item.creditoAproveitavel
    custoLiquidoTotal += item.custoLiquidoAquisicao
    creditoPerdidoTotal += item.creditoPerdido
    if (item.ehGargalo) totalGargalos++

    const reg = item.fornecedor.regime
    if (reg === 'lucro_real') {
      dist.lucroReal.quantidade++
      dist.lucroReal.volume += item.volumeCompras
      dist.lucroReal.creditoAproveitado += item.creditoAproveitavel
      dist.lucroReal.perda += item.creditoPerdido
    } else if (reg === 'lucro_presumido') {
      dist.lucroPresumido.quantidade++
      dist.lucroPresumido.volume += item.volumeCompras
      dist.lucroPresumido.creditoAproveitado += item.creditoAproveitavel
      dist.lucroPresumido.perda += item.creditoPerdido
    } else if (reg === 'simples_nacional') {
      dist.simplesNacional.quantidade++
      dist.simplesNacional.volume += item.volumeCompras
      dist.simplesNacional.creditoAproveitado += item.creditoAproveitavel
      dist.simplesNacional.perda += item.creditoPerdido
    } else if (reg === 'misto') {
      dist.misto.quantidade++
      dist.misto.volume += item.volumeCompras
      dist.misto.creditoAproveitado += item.creditoAproveitavel
      dist.misto.perda += item.creditoPerdido
    }
  })

  const percentualMedioPerda =
    volumeTotalCompras > 0 ? (creditoPerdidoTotal / volumeTotalCompras) * 100 : 0

  // Evolução de TODOS os anos 2026-2033
  const evolucaoAnos: ResultadoComparativoAnosFornecedor[] = ANOS_SIMULACAO_DISPONIVEIS.map(
    (ano) => {
      const infoAno = obterAliquotasCreditoPorAno(ano)
      let anoCreditoAproveitado = 0
      let anoCreditoPerdido = 0
      let anoCustoLiquido = 0

      fornecedores.forEach((f) => {
        const res = calcularDiagnosticoFornecedor(f, ano, regimeComprador)
        anoCreditoAproveitado += res.creditoAproveitavel
        anoCreditoPerdido += res.creditoPerdido
        anoCustoLiquido += res.custoLiquidoAquisicao
      })

      return {
        ano,
        aliquotaRegular: infoAno.aliquotaRegimeRegular * 100,
        aliquotaSimples: infoAno.aliquotaSimplesMedia * 100,
        creditoAproveitavelTotal: anoCreditoAproveitado,
        creditoPerdidoTotal: anoCreditoPerdido,
        custoLiquidoTotal: anoCustoLiquido,
      }
    },
  )

  return {
    anoSelecionado,
    regimeComprador,
    totalFornecedores: fornecedores.length,
    volumeTotalCompras,
    creditoAproveitavelTotal,
    custoLiquidoTotal,
    creditoPerdidoTotal,
    percentualMedioPerda,
    totalGargalos,
    distribuicaoPorRegime: dist,
    rankingGargalos,
    detalhamentoPorFornecedor,
    evolucaoAnos,
  }
}

export type NivelUrgenciaRiscoTroca = 'alta' | 'media'

export interface ItemRankingRiscoTroca {
  fornecedor: FornecedorDiagnostico
  resultadoCalculo: ResultadoCalculoFornecedor
  scoreRisco: number
  urgencia: NivelUrgenciaRiscoTroca
  rotuloUrgencia: string
  fatorRegime: number
  fatorItem: number
}

/**
 * Calcula o Ranking de Risco de Troca (fornecedores com maior urgência de renegociação/troca).
 * Combina 3 fatores:
 * 1. Regime do fornecedor menos favorável à transferência de crédito:
 *    - Simples Nacional = 1.0
 *    - Misto = 0.75
 *    - Lucro Presumido = 0.25
 *    - Lucro Real = 0.15
 * 2. Volume de compras (normalizado pelo maior volume da carteira com item que gera crédito).
 * 3. Item que gera crédito:
 *    - integral = 1.0
 *    - parcial = proporção informada (ex: 0.5 a 0.7)
 *    - nao_gera = 0.0 (fornecedor cujos itens NÃO geram crédito NÃO entra nesse ranking).
 *
 * Pontuação = (Score Regime * 0.45 + Score Volume * 0.40 + Score Item * 0.15) * 100
 * Retorna os top 5 ordenados por pontuação decrescente.
 */
export function calcularRankingRiscoTroca(
  detalhamento: ResultadoCalculoFornecedor[],
): ItemRankingRiscoTroca[] {
  // 1. Filtrar estritamente quem gera crédito (itens não_gera pontuam zero e não entram no ranking)
  const candidatos = detalhamento.filter((item) => {
    return (
      item.fornecedor.classificacao_credito !== 'nao_gera' &&
      item.fatorProduto > 0 &&
      item.volumeCompras > 0
    )
  })

  if (candidatos.length === 0) return []

  const maxVolume = Math.max(...candidatos.map((c) => c.volumeCompras), 1)

  const pontuados: ItemRankingRiscoTroca[] = candidatos.map((item) => {
    // Fator 1: Regime do fornecedor menos favorável à transferência de crédito
    let fatorRegime = 0.2
    if (item.fornecedor.regime === 'simples_nacional') {
      fatorRegime = 1.0
    } else if (item.fornecedor.regime === 'misto') {
      const pctMistoSimples = (100 - (item.fornecedor.proporcao_misto ?? 50)) / 100
      fatorRegime = 0.4 + 0.6 * pctMistoSimples // ~0.70 a 0.85
    } else if (item.fornecedor.regime === 'lucro_presumido') {
      fatorRegime = 0.3
    } else {
      fatorRegime = 0.15
    }

    // Fator 2: Volume de compras (normalizado 0 a 1)
    const fatorVolume = Math.min(1, Math.max(0, item.volumeCompras / maxVolume))

    // Fator 3: Item que gera crédito (integral = 1.0, parcial = fatorProduto)
    const fatorItem = item.fatorProduto

    // Pontuação composta (0 a 100)
    // O crédito perdido efetivo também ganha peso natural pela combinação de regime desfavorável + alto volume + item que gera crédito
    const scoreRisco = (fatorRegime * 0.45 + fatorVolume * 0.4 + fatorItem * 0.15) * 100

    const urgencia: NivelUrgenciaRiscoTroca = scoreRisco >= 50 ? 'alta' : 'media'
    const rotuloUrgencia = urgencia === 'alta' ? 'Prioridade alta' : 'Prioridade média'

    return {
      fornecedor: item.fornecedor,
      resultadoCalculo: item,
      scoreRisco: Math.round(scoreRisco * 10) / 10,
      urgencia,
      rotuloUrgencia,
      fatorRegime,
      fatorItem,
    }
  })

  // Ordena por score decrescente e desempata por crédito perdido e volume
  pontuados.sort((a, b) => {
    if (b.scoreRisco !== a.scoreRisco) return b.scoreRisco - a.scoreRisco
    if (b.resultadoCalculo.creditoPerdido !== a.resultadoCalculo.creditoPerdido) {
      return b.resultadoCalculo.creditoPerdido - a.resultadoCalculo.creditoPerdido
    }
    return b.resultadoCalculo.volumeCompras - a.resultadoCalculo.volumeCompras
  })

  return pontuados.slice(0, 5)
}
