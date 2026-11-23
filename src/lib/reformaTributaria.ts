/**
 * Módulo de Reforma Tributária sobre o Consumo (EC 132/2023, LC 214/2025, LC 227/2026)
 *
 * Legislação de referência:
 * - Emenda Constitucional nº 132/2023: Institui a Reforma Tributária do Consumo (IBS, CBS e IS)
 * - ADCT arts. 125 a 130: Cronograma de transição de 2026 a 2033 e regras de transição federativa
 * - Lei Complementar nº 214/2025: Lei Geral do IBS e da CBS
 *   - Art. 41, §3º: Opção semestral (março/setembro) pelo regime regular para optantes do Simples (Simples híbrido)
 *   - Art. 130: Regimes diferenciados e reduções setoriais de alíquota (60% e 30%)
 *   - Art. 347: CBS com redução transitória de 0,1 p.p. em 2027 e 2028
 *   - Art. 348, §1º e III, 'c': Alíquotas de teste em 2026 e dispensa para optantes do Simples Nacional
 *   - Art. 519 e Anexos XVIII–XXII: Nova partilha interna do DAS no Simples Nacional
 * - LC 123/2006 com redação dada pela LC 227/2026: Sublimite de R$ 3,6M e segregação do IBS por fora
 */

import type { SegmentoEmpresa } from './regimes'

// Anos da transição suportados na simulação
// 2026–2033: fases da transição (LC 214/2025). 2034–2040: regime definitivo (transição concluída —
// mesma base de 2033, CBS 8,80% + IBS 17,70%, IS pleno). Nenhum valor de 2026–2033 foi alterado.
export type AnoBaseSimulacao =
  | 2026
  | 2027
  | 2028
  | 2029
  | 2030
  | 2031
  | 2032
  | 2033
  | 2034
  | 2035
  | 2036
  | 2037
  | 2038
  | 2039
  | 2040

export const ANOS_SIMULACAO_DISPONIVEIS: AnoBaseSimulacao[] = [
  2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040,
]

/** Último ano com fase de transição registrada (a partir de 2034 o regime é definitivo). */
export const ANO_FIM_TRANSICAO_SIMULACAO = 2033

/** A partir de 2034 a transição está concluída — regime definitivo (100% IBS/CBS). */
export const isAnoPosTransicaoSimulacao = (ano: number | string | undefined | null): boolean =>
  ano !== undefined && ano !== null && ano !== 'atual' && Number(ano) >= 2034

/**
 * Alíquotas de referência projetadas para o IVA Dual (trava do ADCT art. 130 ~26,5% a 28%)
 * Configuráveis como constantes no topo conforme regulamentação pelo Senado Federal e CGIBS.
 */
export const TAXA_CBS_REFERENCIA = 0.088 // 8,8% (federal - substitui PIS, COFINS e IPI)
export const TAXA_IBS_REFERENCIA = 0.177 // 17,7% (estadual/municipal - substitui ICMS e ISS)
export const SOMA_IVA_DUAL_REFERENCIA = TAXA_CBS_REFERENCIA + TAXA_IBS_REFERENCIA // 26,5%

// Redução transitória de 0,1 p.p. da CBS em 2027 e 2028 (art. 347 da LC 214/2025)
export const REDUCAO_CBS_2027_2028 = 0.001 // 0,1%

// Cronograma de transição do IBS e extinção progressiva de ICMS e ISS (ADCT arts. 128 e 129)
// Em 2029 a 2032: ICMS/ISS caem para 90%, 80%, 70%, 60% e o IBS entra com 10%, 20%, 30%, 40%
export const FATOR_TRANSICAO_IBS: Record<AnoBaseSimulacao, number> = {
  2026: 0.0, // Fase de teste (0,1% simbólico sem recolhimento efetivo)
  2027: 0.0, // Fase de teste estadual/municipal (0,05% + 0,05% compensável com ICMS/ISS)
  2028: 0.0,
  2029: 0.1, // 10% da alíquota de referência
  2030: 0.2, // 20% da alíquota de referência
  2031: 0.3, // 30% da alíquota de referência
  2032: 0.4, // 40% da alíquota de referência
  2033: 1.0, // 100% da alíquota de referência (pleno)
  // 2034–2040: transição concluída — regime definitivo (100% da referência, igual a 2033)
  2034: 1.0,
  2035: 1.0,
  2036: 1.0,
  2037: 1.0,
  2038: 1.0,
  2039: 1.0,
  2040: 1.0,
}

export const FATOR_REMANESCENTE_ICMS_ISS: Record<AnoBaseSimulacao, number> = {
  2026: 1.0,
  2027: 1.0,
  2028: 1.0,
  2029: 0.9, // 90% das alíquotas de ICMS e ISS
  2030: 0.8, // 80% das alíquotas de ICMS e ISS
  2031: 0.7, // 70% das alíquotas de ICMS e ISS
  2032: 0.6, // 60% das alíquotas de ICMS e ISS
  2033: 0.0, // ICMS e ISS extintos
  // 2034–2040: ICMS e ISS permanecem extintos (regime definitivo)
  2034: 0.0,
  2035: 0.0,
  2036: 0.0,
  2037: 0.0,
  2038: 0.0,
  2039: 0.0,
  2040: 0.0,
}

/**
 * Reduções setoriais da alíquota padrão de IBS e CBS (LC 214/2025 art. 130 e ADCT art. 130)
 * - 60% de redução (alíquota = 40% da padrão): Saúde, Educação, Transporte público coletivo, Alimentos básicos
 * - 30% de redução (alíquota = 70% da padrão): Serviços de profissão intelectual de natureza regulamentada
 */
export function obterReducaoSetorialReforma(segmento: SegmentoEmpresa): {
  fatorMultiplicador: number
  percentualReducao: number
  baseLegal: string
} {
  switch (segmento) {
    case 'Saúde':
    case 'Educação':
      return {
        fatorMultiplicador: 0.4, // 60% de desconto
        percentualReducao: 60,
        baseLegal: 'LC 214/2025 art. 130 (Regime Diferenciado - Redução de 60%)',
      }
    case 'Transporte':
      return {
        fatorMultiplicador: 0.4, // Transporte coletivo/público com 60% de desconto
        percentualReducao: 60,
        baseLegal: 'LC 214/2025 art. 130 (Transporte Coletivo - Redução de 60%)',
      }
    case 'Tecnologia':
    case 'Serviços':
    case 'Construção Civil':
      return {
        fatorMultiplicador: 0.7, // 30% de desconto para profissões regulamentadas / serviços técnicos
        percentualReducao: 30,
        baseLegal: 'LC 214/2025 art. 130 (Profissões Intelectuais Regulamentadas - Redução de 30%)',
      }
    case 'Agro':
      return {
        fatorMultiplicador: 0.4, // Insumos agropecuários e cesta básica nacional
        percentualReducao: 60,
        baseLegal:
          'LC 214/2025 art. 130 (Insumos Agropecuários e Alimentos Básicos - Redução de 60%)',
      }
    case 'Comércio':
    case 'Indústria':
    case 'Bares e Restaurantes':
    default:
      return {
        fatorMultiplicador: 1.0, // Alíquota padrão plena
        percentualReducao: 0,
        baseLegal: 'Alíquota Padrão de Referência do IVA Dual (CBS + IBS)',
      }
  }
}

/**
 * Verifica se o segmento é suscetível à incidência do Imposto Seletivo (IS)
 * Regulamentação: ADCT art. 153, VIII e LC 214/2025 (incidência sobre bebidas açucaradas/alcoólicas,
 * veículos, fumo, bens minerais e itens prejudiciais à saúde/meio ambiente).
 */
export function segmentoSusceptivelImpostoSeletivo(segmento: SegmentoEmpresa): {
  suscetivel: boolean
  motivo?: string
} {
  if (segmento === 'Bares e Restaurantes') {
    return {
      suscetivel: true,
      motivo:
        'Incidência potencial de Imposto Seletivo sobre venda de bebidas alcoólicas e refrigerantes/bebidas açucaradas a partir de 2027.',
    }
  }
  if (segmento === 'Transporte') {
    return {
      suscetivel: true,
      motivo:
        'Possível incidência de IS em etapas de fabricação/aquisição de veículos de combustão e combustíveis fósseis.',
    }
  }
  if (segmento === 'Agro') {
    return {
      suscetivel: true,
      motivo:
        'Alerta para eventual IS sobre defensivos agrícolas específicos ou minérios conforme lista taxativa do Congresso.',
    }
  }
  return { suscetivel: false }
}

/**
 * Repartição interna estimada dos novos tributos (CBS e IBS) no DAS do Simples Nacional
 * Base legal: LC 214/2025 art. 519 e Anexos XVIII a XXII (redação art. 13-A da LC 123/2006)
 *
 * - Em 2026: 0% (não se aplica ao Simples — art. 348, III, 'c')
 * - Em 2027–2028: CBS entra em substituição a PIS/COFINS (média de 15,33% da guia no comércio e 0,17% de IBS teste)
 * - Em 2029–2032: IBS entra progressivamente no DAS substituindo a cota de ICMS/ISS
 * - Em 2033: IBS e CBS representam a fatia consolidada de consumo dentro do DAS
 * - 2034+: transição concluída — mesma partilha definitiva de 2033
 */
export function obterPercentualConsumoSimplesPorAno(
  ano: AnoBaseSimulacao,
  faixaNumero: number,
): {
  percentualCBS: number // % dentro do DAS (ex: 15.33)
  percentualIBS: number // % dentro do DAS
  percentualTotalNovosImpostos: number // percentual somado CBS + IBS no DAS
} {
  if (ano === 2026) {
    return { percentualCBS: 0, percentualIBS: 0, percentualTotalNovosImpostos: 0 }
  }

  // Na 6ª faixa (> R$ 3,6M até R$ 4,8M), o IBS/ICMS é por fora do DAS!
  if (faixaNumero >= 6) {
    if (ano <= 2028) {
      return { percentualCBS: 15.33, percentualIBS: 0, percentualTotalNovosImpostos: 15.33 }
    }
    return { percentualCBS: 15.33, percentualIBS: 0, percentualTotalNovosImpostos: 15.33 }
  }

  if (ano === 2027 || ano === 2028) {
    return { percentualCBS: 15.33, percentualIBS: 0.17, percentualTotalNovosImpostos: 15.5 }
  }
  if (ano === 2029) {
    return { percentualCBS: 15.33, percentualIBS: 3.4, percentualTotalNovosImpostos: 18.73 }
  }
  if (ano === 2030) {
    return { percentualCBS: 15.33, percentualIBS: 6.8, percentualTotalNovosImpostos: 22.13 }
  }
  if (ano === 2031) {
    return { percentualCBS: 15.33, percentualIBS: 10.2, percentualTotalNovosImpostos: 25.53 }
  }
  if (ano === 2032) {
    return { percentualCBS: 15.33, percentualIBS: 13.6, percentualTotalNovosImpostos: 28.93 }
  }
  // 2033 pleno (e 2034+ regime definitivo — mesma partilha, transição concluída)
  return { percentualCBS: 15.33, percentualIBS: 34.0, percentualTotalNovosImpostos: 49.33 }
}

/**
 * Retorna as alíquotas vigentes de CBS e IBS no regime regular para o ano selecionado
 */
export function calcularAliquotasEfetivasReforma(
  ano: AnoBaseSimulacao,
  segmento: SegmentoEmpresa,
  aliquotaISSMunicipal: number = 2.0,
): {
  aliquotaCBS: number // decimal (ex: 0.087 em 2027)
  aliquotaIBS: number // decimal (ex: 0.0354 com transição 20%)
  aliquotaICMSRemanescente: number // decimal
  aliquotaISSRemanescente: number // decimal
  fatorReducaoSetorial: number
  explicacaoTransicao: string
} {
  const reducao = obterReducaoSetorialReforma(segmento)
  const fatorSetorial = reducao.fatorMultiplicador

  // CBS (federal)
  let aliqCBS = 0
  if (ano === 2026) {
    // 2026: 0,9% alíquota teste, mas com dispensa de recolhimento efetivo (art. 348, §1º)
    aliqCBS = 0.0
  } else if (ano === 2027 || ano === 2028) {
    // 8,8% - 0,1 p.p. = 8,7% base ajustada pela redução setorial
    const cbsBase = Math.max(0, TAXA_CBS_REFERENCIA - REDUCAO_CBS_2027_2028)
    aliqCBS = cbsBase * fatorSetorial
  } else {
    // 2029 em diante: CBS plena 8,8% ajustada pelo setor
    aliqCBS = TAXA_CBS_REFERENCIA * fatorSetorial
  }

  // IBS (estadual/municipal)
  const fatorIBS = FATOR_TRANSICAO_IBS[ano]
  let aliqIBS = 0
  if (ano === 2026 || ano === 2027 || ano === 2028) {
    // Fase de teste sem recolhimento efetivo / compensável integralmente
    aliqIBS = 0.0
  } else {
    // 2029 a 2033: entra progressivamente conforme o fator de transição do ano
    aliqIBS = TAXA_IBS_REFERENCIA * fatorIBS * fatorSetorial
  }

  // ICMS e ISS remanescentes
  const fatorAntigos = FATOR_REMANESCENTE_ICMS_ISS[ano]
  const isMercadoria =
    segmento === 'Comércio' ||
    segmento === 'Indústria' ||
    segmento === 'Agro' ||
    segmento === 'Bares e Restaurantes'

  const aliquotaICMSRemanescente = isMercadoria ? 0.12 * fatorAntigos : 0.0
  const aliquotaISSRemanescente = !isMercadoria ? (aliquotaISSMunicipal / 100) * fatorAntigos : 0.0

  let explicacaoTransicao = ''
  if (ano === 2026) {
    explicacaoTransicao =
      'Ano de teste operacional (CBS 0,9% e IBS 0,1% com dispensa de recolhimento). O Simples Nacional não é afetado em 2026.'
  } else if (ano === 2027 || ano === 2028) {
    explicacaoTransicao =
      'PIS e COFINS extintos; CBS entra com 8,7% (redução de 0,1 p.p.); ICMS e ISS continuam integrais; Imposto Seletivo em vigor.'
  } else if (ano >= 2029 && ano <= 2032) {
    const pctIBS = Math.round(fatorIBS * 100)
    const pctAntigos = Math.round(fatorAntigos * 100)
    explicacaoTransicao = `Transição federativa (ADCT 128): IBS aplicado a ${pctIBS}% da referência e ICMS/ISS reduzidos para ${pctAntigos}%.`
  } else if (isAnoPosTransicaoSimulacao(ano)) {
    explicacaoTransicao = `Regime definitivo (${ano}): transição concluída — ICMS, ISS, PIS, COFINS e IPI extintos; CBS e IBS em 100% das alíquotas definitivas e IS pleno.`
  } else {
    explicacaoTransicao =
      'Sistema Pleno (2033): ICMS, ISS, PIS, COFINS e IPI totalmente extintos. CBS e IBS em alíquota cheia integral.'
  }

  return {
    aliquotaCBS: aliqCBS,
    aliquotaIBS: aliqIBS,
    aliquotaICMSRemanescente,
    aliquotaISSRemanescente,
    fatorReducaoSetorial: fatorSetorial,
    explicacaoTransicao,
  }
}

/**
 * Informações dos marcos legais da Reforma para exibição didática
 */
/**
 * Parâmetros de entrada para o cálculo do Simples Nacional na Reforma Tributária
 */
export interface ParametrosCalculoSimplesReforma {
  faturamentoMensal: number
  aliquotaEfetivaAtualSimples: number // % (ex: 8.5)
  ano: AnoBaseSimulacao | 'atual'
  fatorReducaoSetorial?: number // decimal (1.0 = padrão, 0.4 = 60%, 0.7 = 30%, 0 = 100%)
  aliquotaISSMunicipal?: number // % municipal (padrão 2.0%)
  percentualExportacao?: number // % da receita desonerada (0 a 100)
}

/**
 * Resultado completo do impacto da Reforma Tributária sobre empresa do Simples Nacional
 * Base legal: LC 214/2025 art. 41 § 3º, art. 347, art. 348, art. 519 e LC 123/2006 (com LC 227/2026)
 */
export interface ResultadoCalculoSimplesReforma {
  // Cenário Atual (Vigente / DAS Tradicional)
  dasAtualTotal: number // R$
  aliquotaEfetivaAtual: number // %

  // Cenário da Transição LC 214/2025
  cbsNoDas: number // R$ (incorporada ao DAS a partir de 2027)
  aliquotaEfetivaCbsNoDas: number // %
  ibsPorFora: number // R$ (IBS recolhido por fora durante a transição com crédito outorgado/fator de transição)
  aliquotaEfetivaIbsPorFora: number // %
  dasBaseRemanescente: number // R$ (fração restante do DAS sem duplicação)
  cenarioTransicaoTotal: number // R$ (DAS ajustado + IBS por fora)
  aliquotaEfetivaTransicao: number // %

  // Comparativo
  diferencaMensal: number // R$ (cenarioTransicaoTotal - dasAtualTotal)
  economiaMensal: number // R$ (positivo se transição for menor que atual)
  economiaAnual: number // R$ (economiaMensal * 12)
  variacaoPercentual: number // % de variação frente ao DAS atual

  // Rótulos e Metadados Didáticos
  rotuloCenarioAtual: string // "DAS atual"
  rotuloCbs: string // "CBS no DAS"
  rotuloIbs: string // "IBS por fora"
  descricaoFase: string
  ano: AnoBaseSimulacao | 'atual'
}

/**
 * Calcula o impacto da Reforma Tributária no Simples Nacional ano a ano (2026–2033 ou 'atual')
 * Ramo isolado: não altera regras de Lucro Real e Presumido.
 *
 * Regras:
 * - Em 2026 ou 'atual': O Simples Nacional permanece inalterado (art. 348 LC 214/2025). CBS e IBS teste têm recolhimento zero no Simples.
 * - Em 2027–2028: CBS incorporada ao DAS (alíquota efetiva CBS ~15,33% da partilha da guia do DAS, ou 8,7% com crédito outorgado da LC 214/2025 art. 519).
 * - Em 2029–2032: IBS entra progressivamente por fora (10%, 20%, 30%, 40% conforme FATOR_TRANSICAO_IBS), com crédito outorgado/redução setorial, enquanto o DAS ajusta a parcela proporcional de ICMS/ISS.
 * - Em 2033: Plena vigência da transição do Simples sob a LC 214/2025.
 */
export function calcularIbsCbsSimplesNacional(
  params: ParametrosCalculoSimplesReforma,
): ResultadoCalculoSimplesReforma {
  const faturamentoBruto = Math.max(0, params.faturamentoMensal)
  const pctExportacao = Math.max(0, Math.min(100, params.percentualExportacao || 0)) / 100
  const receitaTributavel = faturamentoBruto * (1 - pctExportacao)

  const aliqAtual = Math.max(0, params.aliquotaEfetivaAtualSimples)
  const dasAtualTotal = (receitaTributavel * aliqAtual) / 100

  const ano = params.ano
  const fatorSetorial =
    params.fatorReducaoSetorial !== undefined ? params.fatorReducaoSetorial : 1.0

  // Se ano for 'atual' ou 2026: Simples Nacional 100% inalterado (dispensa LC 214/2025 art. 348)
  if (ano === 'atual' || String(ano) === '2026') {
    return {
      dasAtualTotal,
      aliquotaEfetivaAtual:
        faturamentoBruto > 0 ? (dasAtualTotal / faturamentoBruto) * 100 : aliqAtual,
      cbsNoDas: 0,
      aliquotaEfetivaCbsNoDas: 0,
      ibsPorFora: 0,
      aliquotaEfetivaIbsPorFora: 0,
      dasBaseRemanescente: dasAtualTotal,
      cenarioTransicaoTotal: dasAtualTotal,
      aliquotaEfetivaTransicao:
        faturamentoBruto > 0 ? (dasAtualTotal / faturamentoBruto) * 100 : aliqAtual,
      diferencaMensal: 0,
      economiaMensal: 0,
      economiaAnual: 0,
      variacaoPercentual: 0,
      rotuloCenarioAtual: 'DAS atual',
      rotuloCbs: 'CBS no DAS',
      rotuloIbs: 'IBS por fora',
      descricaoFase:
        ano === 'atual'
          ? 'Sistema Atual (Pré-Reforma): Guia DAS com recolhimento unificado de tributos federais e subnacionais.'
          : 'Fase de Teste Operacional (2026): Simples Nacional dispensado de CBS (0,9%) e IBS (0,1%) conforme art. 348 da LC 214/2025.',
      ano,
    }
  }

  const anoNum = Number(ano) as AnoBaseSimulacao

  // (a) CBS no DAS a partir de 2027:
  // Na partilha da LC 214/2025 art. 519 / Anexos XVIII–XXII, a CBS substitui PIS e COFINS no DAS.
  // A fatia média de consumo federal no DAS é de 15,33% da guia (ou ~20% somando PIS/Cofins).
  // No Simples regular, a CBS fica contida na guia DAS com a alíquota efetiva setorial.
  // Parcela da CBS no DAS calculada com base na partilha oficial (15,33% da guia do DAS, sujeita à redução setorial se houver):
  const fatiaCbsNoDas = 0.1533 * fatorSetorial
  const cbsNoDas = dasAtualTotal * fatiaCbsNoDas
  const aliquotaEfetivaCbsNoDas = faturamentoBruto > 0 ? (cbsNoDas / faturamentoBruto) * 100 : 0

  // (b) IBS por fora na transição:
  // Conforme ADCT art. 128 / LC 214/2025 e LC 123/2006 art. 13-A:
  // Em 2027 e 2028: IBS é fase de teste (0,1% compensável integralmente nos estados/municípios, sem impacto adicional).
  // A partir de 2029: IBS entra cobrando conforme o FATOR_TRANSICAO_IBS (10% a 40%, 100% em 2033).
  // Na sistemática de crédito outorgado para optantes do Simples (art. 41 § 3º e art. 519 da LC 214/2025),
  // a empresa transfere crédito e recolhe IBS por fora calculado sobre a alíquota de transição com redução de crédito outorgado proporcional.
  // Alíquota de referência do IBS = 17,7% multiplicada pelo fator de transição do ano e fator setorial:
  const fatorIbs = FATOR_TRANSICAO_IBS[anoNum] || 0
  let aliqIbsEfetivaPorFora = 0

  if (anoNum >= 2029) {
    // Alíquota nominal de transição do IBS ajustada pelo setor
    const aliqIbsTrans = TAXA_IBS_REFERENCIA * fatorIbs * fatorSetorial
    // Crédito outorgado/abatimento do Simples Nacional na transição (~60% de creditamento presumido sobre insumos)
    // Carga líquida efetiva do IBS por fora = aliqIbsTrans * 40% (descontado crédito outorgado médio de 60%)
    aliqIbsEfetivaPorFora = aliqIbsTrans * 0.4
  }

  const ibsPorFora = receitaTributavel * aliqIbsEfetivaPorFora

  // (c) Parcela remanescente do DAS (IRPJ, CSLL, CPP e eventual ICMS/ISS remanescente):
  // Em 2029 a 2032, ICMS/ISS no DAS é reduzido proporcionalmente ao FATOR_REMANESCENTE_ICMS_ISS
  const fatorRemanescenteAntigos = FATOR_REMANESCENTE_ICMS_ISS[anoNum] ?? 1.0
  // Cota de ICMS/ISS no DAS representa ~34% da guia
  const fatiaIcmsIssNoDas = 0.34
  const cotaIcmsIssReduzida = dasAtualTotal * fatiaIcmsIssNoDas * fatorRemanescenteAntigos
  const cotaOutrosTributosDas = dasAtualTotal * (1 - fatiaIcmsIssNoDas - 0.1533)
  const dasBaseRemanescente = Math.max(0, cbsNoDas + cotaOutrosTributosDas + cotaIcmsIssReduzida)

  // Total do cenário de transição = DAS com CBS + IBS por fora
  const cenarioTransicaoTotal = dasBaseRemanescente + ibsPorFora
  const aliquotaEfetivaTransicao =
    faturamentoBruto > 0 ? (cenarioTransicaoTotal / faturamentoBruto) * 100 : 0

  const diferencaMensal = cenarioTransicaoTotal - dasAtualTotal
  const economiaMensal = dasAtualTotal - cenarioTransicaoTotal
  const economiaAnual = economiaMensal * 12
  const variacaoPercentual =
    dasAtualTotal > 0 ? ((cenarioTransicaoTotal - dasAtualTotal) / dasAtualTotal) * 100 : 0

  let descricaoFase = ''
  if (anoNum === 2027 || anoNum === 2028) {
    descricaoFase = `Transição Federal (${anoNum}): CBS incorporada na partilha do DAS em substituição a PIS/COFINS (LC 214/2025 art. 519). IBS em fase de homologação sem cobrança por fora.`
  } else if (anoNum >= 2029 && anoNum <= 2032) {
    const pctIbs = Math.round(fatorIbs * 100)
    descricaoFase = `Transição Federativa (${anoNum}): CBS no DAS e IBS cobrado por fora a ${pctIbs}% da referência com crédito outorgado e desoneração progressiva de ICMS/ISS no DAS.`
  } else if (isAnoPosTransicaoSimulacao(anoNum)) {
    descricaoFase = `Regime definitivo (${anoNum}): transição concluída — CBS consolidada no DAS e IBS pleno por fora, nas alíquotas definitivas (igual a 2033).`
  } else {
    descricaoFase =
      'Sistema Pleno (2033): CBS consolidada no DAS e IBS pleno por fora com ampla transferência de créditos.'
  }

  return {
    dasAtualTotal,
    aliquotaEfetivaAtual:
      faturamentoBruto > 0 ? (dasAtualTotal / faturamentoBruto) * 100 : aliqAtual,
    cbsNoDas,
    aliquotaEfetivaCbsNoDas,
    ibsPorFora,
    aliquotaEfetivaIbsPorFora: faturamentoBruto > 0 ? (ibsPorFora / faturamentoBruto) * 100 : 0,
    dasBaseRemanescente,
    cenarioTransicaoTotal,
    aliquotaEfetivaTransicao,
    diferencaMensal,
    economiaMensal,
    economiaAnual,
    variacaoPercentual,
    rotuloCenarioAtual: 'DAS atual',
    rotuloCbs: 'CBS no DAS',
    rotuloIbs: 'IBS por fora',
    descricaoFase,
    ano,
  }
}

export const CRONOGRAMA_REFORMA = [
  {
    ano: 2026,
    fase: 'Fase de Teste Operacional',
    descricao:
      'CBS a 0,9% e IBS a 0,1% com dispensa de recolhimento efetivo para quem cumpre obrigações acessórias (art. 348 LC 214). Simples Nacional permanece 100% inalterado neste ano.',
    impactoSimples: 'Sem alteração no DAS',
    impactoGeral: 'Teste técnico dos sistemas federais e CGIBS',
  },
  {
    ano: 2027,
    fase: 'Entrada da CBS e Extinção do PIS/COFINS',
    descricao:
      'Extinção definitiva de PIS e COFINS. CBS passa a ser recolhida em alíquota de 8,7% (-0,1 p.p.). Início do Imposto Seletivo (IS). IPI zerado (exceto Zona Franca de Manaus).',
    impactoSimples: 'CBS substitui PIS/COFINS na partilha do DAS (15,33% da guia)',
    impactoGeral: 'CBS plena com crédito amplo para empresas no regime regular',
  },
  {
    ano: 2028,
    fase: 'Consolidação da CBS e Preparação do IBS',
    descricao:
      'Último ano da redução transitória da CBS. Preparação final dos 27 estados e mais de 5.500 municípios para a transição dos impostos locais.',
    impactoSimples: 'Manutenção da partilha com CBS',
    impactoGeral: 'CBS a 8,7% e ICMS/ISS ainda integrais',
  },
  {
    ano: 2029,
    fase: 'Início da Transição ICMS/ISS → IBS (10%)',
    descricao:
      'ICMS e ISS caem para 90% das alíquotas atuais. O IBS entra cobrando 10% da sua alíquota de referência (ADCT art. 128).',
    impactoSimples: 'IBS passa a compor 3,40% do DAS nas faixas iniciais',
    impactoGeral: 'Início do regime de substituição federativa',
  },
  {
    ano: 2030,
    fase: 'Evolução da Transição (20%)',
    descricao: 'ICMS e ISS reduzidos a 80%. IBS passa para 20% da alíquota de referência.',
    impactoSimples: 'IBS compõe 6,80% do DAS',
    impactoGeral: 'Crescimento da participação do IBS',
  },
  {
    ano: 2031,
    fase: 'Evolução da Transição (30%)',
    descricao: 'ICMS e ISS reduzidos a 70%. IBS passa para 30% da alíquota de referência.',
    impactoSimples: 'IBS compõe 10,20% do DAS',
    impactoGeral: 'Avanço expressivo da não-cumulatividade ampla',
  },
  {
    ano: 2032,
    fase: 'Último Ano de Transição (40%)',
    descricao:
      'ICMS e ISS em seus últimos meses de existência (60%). IBS passa para 40% da alíquota de referência.',
    impactoSimples: 'IBS compõe 13,60% do DAS',
    impactoGeral: 'Última competência com declarações de ICMS e ISS',
  },
  {
    ano: 2033,
    fase: 'Sistema Pleno do IVA Dual Brasileiro',
    descricao:
      'ICMS e ISS totalmente extintos. O novo sistema opera em sua plenitude: CBS federal + IBS estadual/municipal com split payment automático.',
    impactoSimples: 'Partilha definitiva (CBS ~15,33% + IBS 34% da guia)',
    impactoGeral: 'IVA Dual plenamente implementado em todo o território nacional',
  },
  {
    ano: 2034,
    fase: 'Regime Definitivo — 100% IBS/CBS (Transição Concluída)',
    descricao:
      'A partir de 2034 a transição da Reforma está concluída: CBS 8,80% e IBS 17,70% em 100% das alíquotas definitivas, com Imposto Seletivo pleno. Os anos de 2034 a 2040 repetem as regras definitivas do ano pleno de 2033.',
    impactoSimples: 'Partilha definitiva do Simples (CBS ~15,33% + IBS 34% da guia)',
    impactoGeral: 'Regime definitivo vigente em todos os anos de 2034 a 2040',
  },
]
