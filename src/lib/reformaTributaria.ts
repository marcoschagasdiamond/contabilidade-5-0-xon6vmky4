/**
 * Módulo de Reforma Tributária sobre o Consumo (EC 132/2023, LC 214/2025, LC 227/2026)
 *
 * Legislação de referência:
 * - Emenda Constitucional nº 132/2023: Institui a Reforma Tributária do Consumo (IBS, CBS e IS)
 * - ADCT arts. 125 a 130: Cronograma de transição de 2026 a 2033 e regras de transição federativa
 * - Lei Complementar nº 214/2025: Lei Geral do IBS e da CBS
 *   - Art. 41, §3º: Opção anual pelo regime regular para optantes do Simples (Simples híbrido)
 *   - Art. 130: Regimes diferenciados e reduções setoriais de alíquota (60% e 30%)
 *   - Art. 347: CBS com redução transitória de 0,1 p.p. em 2027 e 2028
 *   - Art. 348, §1º e III, 'c': Alíquotas de teste em 2026 e dispensa para optantes do Simples Nacional
 *   - Art. 519 e Anexos XVIII–XXII: Nova partilha interna do DAS no Simples Nacional
 * - LC 123/2006 com redação dada pela LC 227/2026: Sublimite de R$ 3,6M e segregação do IBS por fora
 */

import type { SegmentoEmpresa } from './regimes'

// Anos da transição suportados na simulação
export type AnoBaseSimulacao = 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033

export const ANOS_SIMULACAO_DISPONIVEIS: AnoBaseSimulacao[] = [
  2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033,
]

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
  // 2033 pleno
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
]
