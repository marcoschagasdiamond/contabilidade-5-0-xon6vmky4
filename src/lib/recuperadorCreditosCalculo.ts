import type {
  TeseRecuperacaoDefinicao,
  FaturamentoAno,
  ConfiguracoesRecuperador,
  ParametrosRecuperador,
  ResultadosRecuperador,
  ResultadoTese,
  ApuracaoAnoTese,
  FarolRisco,
} from '@/types/recuperadorCreditos'

// Fatores históricos acumulados da SELIC estimados para os últimos 5 anos (60 meses)
// Calculados da competência base até 2025/2026
export const FATORES_SELIC_ESTIMADOS: Record<number, number> = {
  2021: 1.485, // ~48.5% de correção SELIC acumulada
  2022: 1.378, // ~37.8% de correção SELIC acumulada
  2023: 1.252, // ~25.2% de correção SELIC acumulada
  2024: 1.134, // ~13.4% de correção SELIC acumulada
  2025: 1.042, // ~4.2% de correção SELIC acumulada
}

export const ANOS_60_MESES_PADRAO: FaturamentoAno[] = [
  { ano: 2021, faturamento: 12000000, fatorSelicAcumulado: FATORES_SELIC_ESTIMADOS[2021] },
  { ano: 2022, faturamento: 13500000, fatorSelicAcumulado: FATORES_SELIC_ESTIMADOS[2022] },
  { ano: 2023, faturamento: 15000000, fatorSelicAcumulado: FATORES_SELIC_ESTIMADOS[2023] },
  { ano: 2024, faturamento: 16800000, fatorSelicAcumulado: FATORES_SELIC_ESTIMADOS[2024] },
  { ano: 2025, faturamento: 18000000, fatorSelicAcumulado: FATORES_SELIC_ESTIMADOS[2025] },
]

export const TESES_RECUPERADOR: TeseRecuperacaoDefinicao[] = [
  // ==========================================
  // BLOCO 1: PIS / COFINS
  // ==========================================
  {
    id: 'tese_pis_icms_base',
    modulo: 'pis_cofins',
    codigo: 'PIS-01',
    titulo: 'Exclusão do ICMS da Base do PIS/COFINS (Tese do Século)',
    fundamento: 'STF - Tema 69 da Repercussão Geral (RE 574.706)',
    descricao:
      'Exclusão do ICMS destacado nas notas fiscais de saída da base de cálculo das contribuições ao PIS e COFINS, pacificado pelo STF com modulação a partir de 15/03/2017.',
    riscoPadrao: 'verde',
    justificativaRisco: 'Jurisprudência vinculante do STF transitada em julgado. Risco mínimo.',
    percentualEstimadoPadrao: 1.65, // Estimativa média líquida de impacto sobre o faturamento tributado
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_pis_iss_servicos',
    modulo: 'pis_cofins',
    codigo: 'PIS-02',
    titulo: 'Exclusão do ISS da Base do PIS/COFINS (Prestadores de Serviços)',
    fundamento: 'STF - Tema 118 da Repercussão Geral (RE 592.616)',
    descricao:
      'Exclusão do Imposto Sobre Serviços (ISS) destacado da base de cálculo do PIS e da COFINS para empresas tomadoras e prestadoras.',
    riscoPadrao: 'verde',
    justificativaRisco: 'STF fixou tese definitiva favorável ao contribuinte. Risco baixo.',
    percentualEstimadoPadrao: 0.38,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_pis_insumos_presumido',
    modulo: 'pis_cofins',
    codigo: 'PIS-03',
    titulo: 'Insumos Essenciais e Relevantes no Lucro Presumido / monofásicos',
    fundamento: 'STJ - REsp 1.221.170/PR (Tema 329) & Soluções Cosit RFB',
    descricao:
      'Recuperação de créditos de insumos essenciais à atividade produtiva e produtos sujeitos ao regime monofásico comercializados sem segregação.',
    riscoPadrao: 'amarelo',
    justificativaRisco:
      'Exige comprovação de essencialidade do insumo ou auditoria de segregação de itens monofásicos. Risco moderado.',
    percentualEstimadoPadrao: 0.55,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_pis_subvencao_icms',
    modulo: 'pis_cofins',
    codigo: 'PIS-04',
    titulo: 'Exclusão de Subvenções de ICMS para Custeio e Investimento',
    fundamento: 'STJ - Tema 1.182 (REsp 1.945.110/RN) & RE 1.145.728',
    descricao:
      'Não incidência de PIS/COFINS e IRPJ/CSLL sobre benefícios fiscais de ICMS (crédito presumido, isenção, redução de base de cálculo concedidos pelos Estados).',
    riscoPadrao: 'amarelo',
    justificativaRisco:
      'Exige cumprimento de requisitos contábeis da LC 160/2017 e Lei 12.973/2014. Risco moderado.',
    percentualEstimadoPadrao: 0.85,
    regimesElegiveis: ['Lucro Real'],
  },
  {
    id: 'tese_pis_creditos_exportacao',
    modulo: 'pis_cofins',
    codigo: 'PIS-05',
    titulo: 'Ressarcimento de Créditos Acumulados de Exportação',
    fundamento: 'CF/88 art. 149, § 2º, I e Leis 10.637/02 e 10.833/03',
    descricao:
      'Monetização ou compensação de saldos credores de PIS/COFINS decorrentes de saídas imunes para o exterior vinculadas a insumos adquiridos no mercado interno.',
    riscoPadrao: 'verde',
    justificativaRisco: 'Previsão constitucional e legal expressa de imunidade. Risco mínimo.',
    percentualEstimadoPadrao: 0.6,
    regimesElegiveis: ['Lucro Real'],
  },
  {
    id: 'tese_pis_retencoes_indevidas',
    modulo: 'pis_cofins',
    codigo: 'PIS-06',
    titulo: 'Recuperação de Retenções Indevidas na Fonte (Lei 10.833/03)',
    fundamento: 'IN RFB 2.110/2022 e art. 30 da Lei 10.833/2003',
    descricao:
      'Identificação de retenções de 4,65% (PIS/COFINS/CSLL) sofridas sem o devido abatimento nas apurações mensais ou recolhidas a maior pelo tomador.',
    riscoPadrao: 'verde',
    justificativaRisco:
      'Apurado diretamente via conciliação de DIRF, DCTF e EFD-Contribuições. Risco baixo.',
    percentualEstimadoPadrao: 0.35,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },

  // ==========================================
  // BLOCO 2: FOLHA / PREVIDENCIÁRIO
  // ==========================================
  {
    id: 'tese_folha_inss_verbas_indenizatorias',
    modulo: 'folha',
    codigo: 'FOL-01',
    titulo: 'Não Incidência de INSS Patronal sobre Verbas Indenizatórias',
    fundamento: 'STJ - REsp 1.116.205/RS (Tema 378) & Tema 163 STF',
    descricao:
      'Exclusão da cota patronal (~26,8% composta: 20% INSS + 5,8% Terceiros/Sistema S + RAT) sobre terço constitucional de férias, primeiros 15 dias de auxílio-doença e aviso prévio indenizado.',
    riscoPadrao: 'verde',
    justificativaRisco:
      'Tema pacificado nos Tribunais Superiores quanto à natureza indenizatória. Risco baixo.',
    percentualEstimadoPadrao: 1.85, // % sobre a folha anual
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_folha_irrf_fgts_multa40',
    modulo: 'folha',
    codigo: 'FOL-02',
    titulo: 'Restituição de IRRF sobre FGTS e Multa Rescisória de 40%',
    fundamento: 'STJ - REsp 1.230.957/RS & Súmula 215 STJ',
    descricao:
      'Não incidência de imposto de renda retido na fonte sobre indenizações rescisórias, levantamento de FGTS e a multa de 40% paga em demissões sem justa causa.',
    riscoPadrao: 'verde',
    justificativaRisco: 'Súmula consolidada e entendimento pacífico da RFB. Risco baixo.',
    percentualEstimadoPadrao: 0.75, // proporcional à rotatividade anual
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
  },
  {
    id: 'tese_folha_coparticipacao_saude',
    modulo: 'folha',
    codigo: 'FOL-03',
    titulo: 'Não Incidência Previdenciária sobre Coparticipação em Plano de Saúde',
    fundamento: 'STJ - Súmula 559 e Jurisprudência Unificada da 1ª Seção',
    descricao:
      'Valores descontados ou suportados pela empresa referentes à assistência médica e odontológica não integram o salário de contribuição.',
    riscoPadrao: 'verde',
    justificativaRisco:
      'Súmula vinculada do STJ e previsão expressa na Lei 8.212/91. Risco mínimo.',
    percentualEstimadoPadrao: 0.45,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_folha_salario_maternidade_cpr',
    modulo: 'folha',
    codigo: 'FOL-04',
    titulo: 'Exclusão de Salário-Maternidade da Contribuição Patronal (Tema 72)',
    fundamento: 'STF - RE 576.967 (Tema 72 RG) & Parecer SEI 18.361/2020 ME',
    descricao:
      'Inconstitucionalidade da incidência da contribuição previdenciária patronal sobre o salário-maternidade, gerando direito de repetição e compensação de competências (CPR).',
    riscoPadrao: 'verde',
    justificativaRisco: 'Decisão do plenário do STF em repercussão geral. Risco mínimo.',
    percentualEstimadoPadrao: 0.3,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_folha_revisao_rat_fap',
    modulo: 'folha',
    codigo: 'FOL-05',
    titulo: 'Revisão do Fator Acidentário de Prevenção (FAP) e RAT Ajustado',
    fundamento: 'Decreto 3.048/1999 art. 202-A e Resoluções CNPS',
    descricao:
      'Identificação de divergências de CNAE preponderante, exclusão de acidentes in itinere e contestações administrativas de índices multiplicadores FAP (0,5000 a 2,0000).',
    riscoPadrao: 'amarelo',
    justificativaRisco:
      'Depende da reclassificação de acidentes e conferência do extrato FAPWeb. Risco moderado.',
    percentualEstimadoPadrao: 0.8,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
  {
    id: 'tese_folha_desoneracao_12546',
    modulo: 'folha',
    codigo: 'FOL-06',
    titulo: 'Elegibilidade e Enquadramento à Desoneração da Folha (CPRB)',
    fundamento: 'Lei 12.546/2011, Lei 14.784/2023 e ADI 7633 STF',
    descricao:
      'Apuração de créditos em virtude da opção incorreta ou recolhimentos dúplices entre contribuição patronal de 20% e a CPRB sobre a receita bruta nos setores elegíveis.',
    riscoPadrao: 'amarelo',
    justificativaRisco:
      'Exige avaliação de enquadramento do CNAE principal e atividade econômica preponderante.',
    percentualEstimadoPadrao: 1.1,
    regimesElegiveis: ['Lucro Real', 'Lucro Presumido'],
  },
]

export const CONFIGURACOES_PADRAO: ConfiguracoesRecuperador = {
  clienteId: null,
  empresa: '',
  cnpj: '',
  regimeAtual: 'Lucro Presumido',
  segmento: 'Comércio',
  uf: 'SP',
  anosFaturamento: ANOS_60_MESES_PADRAO,
  numeroMedioEmpregados: 45,
  percentualRotatividadeAnual: 22,
  massaSalarialMensal: 180000,
  aliquotaPatronalComposta: 26.8, // 20% INSS + 5.8% terceiros + 1% RAT
  aliquotaPisCofinsPadrao: 3.65, // Presumido padrão (ou 9.25% se Real)
}

/**
 * Cria a seleção padrão com todas as teses ativas com o farol de risco recomendado
 */
export function gerarSelecaoTesesPadrao(): Record<
  string,
  {
    teseId: string
    ativa: boolean
    farol: FarolRisco
    percentualBaseCustomizado?: number
    observacaoAnalista?: string
  }
> {
  const map: Record<string, any> = {}
  TESES_RECUPERADOR.forEach((t) => {
    map[t.id] = {
      teseId: t.id,
      ativa: true,
      farol: t.riscoPadrao,
      percentualBaseCustomizado: t.percentualEstimadoPadrao,
      observacaoAnalista: '',
    }
  })
  return map
}

/**
 * Motor de Apuração do Recuperador de Créditos:
 * Calcula ano a ano (60 meses) com correção estimada da taxa SELIC
 */
export function calcularRecuperadorCreditos(
  parametros: ParametrosRecuperador,
): ResultadosRecuperador {
  const { configuracoes, teses } = parametros

  const faturamentosPorAno = configuracoes.anosFaturamento || ANOS_60_MESES_PADRAO
  const folhaMensal = configuracoes.massaSalarialMensal || 0
  const folhaAnual = folhaMensal * 13.33 // 12 meses + 13º salário + 1/3 férias
  const rotatividade = configuracoes.percentualRotatividadeAnual || 20

  const resultadosTeses: ResultadoTese[] = []

  let totalIntegralOriginal = 0
  let totalIntegralSelic = 0
  let totalIntegralCorrigido = 0

  let totalConservadorOriginal = 0
  let totalConservadorSelic = 0
  let totalConservadorCorrigido = 0

  let totalPisCofinsCorrigido = 0
  let totalFolhaCorrigido = 0

  let totalVerdeCorrigido = 0
  let totalAmareloCorrigido = 0
  let totalVermelhoCorrigido = 0

  // Acumuladores anuais
  const mapaPorAno: Record<
    number,
    { valorOriginal: number; correcaoSelic: number; totalCorrigido: number }
  > = {}
  faturamentosPorAno.forEach((f) => {
    mapaPorAno[f.ano] = { valorOriginal: 0, correcaoSelic: 0, totalCorrigido: 0 }
  })

  TESES_RECUPERADOR.forEach((teseDef) => {
    const selecao = teses[teseDef.id] || {
      teseId: teseDef.id,
      ativa: false,
      farol: teseDef.riscoPadrao,
      percentualBaseCustomizado: teseDef.percentualEstimadoPadrao,
    }

    const ativa = selecao.ativa
    const farol = selecao.farol
    const pctBase =
      selecao.percentualBaseCustomizado !== undefined
        ? selecao.percentualBaseCustomizado
        : teseDef.percentualEstimadoPadrao

    const apuracaoPorAno: ApuracaoAnoTese[] = []
    let teseOriginalTotal = 0
    let teseSelicTotal = 0
    let teseCorrigidoTotal = 0

    faturamentosPorAno.forEach((fAno) => {
      const fatorSelic = fAno.fatorSelicAcumulado || FATORES_SELIC_ESTIMADOS[fAno.ano] || 1.1

      let baseCalculo = 0
      let aliquotaOuPercentual = pctBase

      if (teseDef.modulo === 'pis_cofins') {
        baseCalculo = fAno.faturamento
      } else {
        // Folha: base proporcional ao faturamento anual ou direta da folha anual
        // com crescimento estimado proporcional
        baseCalculo = folhaAnual
        // Ajuste especial para tese de IRRF sobre FGTS (proporcional à rotatividade)
        if (teseDef.id === 'tese_folha_irrf_fgts_multa40') {
          baseCalculo = folhaAnual * (rotatividade / 100)
        }
      }

      // Se inativa, gera valores zerados
      const valorOriginal = ativa ? baseCalculo * (aliquotaOuPercentual / 100) : 0
      const valorTotalCorrigido = valorOriginal * fatorSelic
      const correcaoSelic = valorTotalCorrigido - valorOriginal

      teseOriginalTotal += valorOriginal
      teseSelicTotal += correcaoSelic
      teseCorrigidoTotal += valorTotalCorrigido

      apuracaoPorAno.push({
        ano: fAno.ano,
        baseCalculo,
        aliquotaOuPercentual,
        valorOriginal,
        fatorSelic,
        correcaoSelic,
        valorTotalCorrigido,
      })

      if (ativa) {
        if (!mapaPorAno[fAno.ano]) {
          mapaPorAno[fAno.ano] = { valorOriginal: 0, correcaoSelic: 0, totalCorrigido: 0 }
        }
        mapaPorAno[fAno.ano].valorOriginal += valorOriginal
        mapaPorAno[fAno.ano].correcaoSelic += correcaoSelic
        mapaPorAno[fAno.ano].totalCorrigido += valorTotalCorrigido
      }
    })

    if (ativa) {
      totalIntegralOriginal += teseOriginalTotal
      totalIntegralSelic += teseSelicTotal
      totalIntegralCorrigido += teseCorrigidoTotal

      // Cenário Conservador = apenas teses VERDES (jurisprudência pacificada)
      if (farol === 'verde') {
        totalConservadorOriginal += teseOriginalTotal
        totalConservadorSelic += teseSelicTotal
        totalConservadorCorrigido += teseCorrigidoTotal
      }

      // Por módulo de tributo
      if (teseDef.modulo === 'pis_cofins') {
        totalPisCofinsCorrigido += teseCorrigidoTotal
      } else {
        totalFolhaCorrigido += teseCorrigidoTotal
      }

      // Por farol
      if (farol === 'verde') {
        totalVerdeCorrigido += teseCorrigidoTotal
      } else if (farol === 'amarelo') {
        totalAmareloCorrigido += teseCorrigidoTotal
      } else {
        totalVermelhoCorrigido += teseCorrigidoTotal
      }
    }

    resultadosTeses.push({
      teseId: teseDef.id,
      modulo: teseDef.modulo,
      titulo: teseDef.titulo,
      fundamento: teseDef.fundamento,
      farol,
      ativa,
      valorOriginalTotal: teseOriginalTotal,
      correcaoSelicTotal: teseSelicTotal,
      totalCorrigido: teseCorrigidoTotal,
      apuracaoPorAno,
    })
  })

  const totaisPorAno = Object.entries(mapaPorAno).map(([anoStr, vals]) => ({
    ano: Number(anoStr),
    valorOriginal: vals.valorOriginal,
    correcaoSelic: vals.correcaoSelic,
    totalCorrigido: vals.totalCorrigido,
  }))

  return {
    totalIntegralOriginal,
    totalIntegralSelic,
    totalIntegralCorrigido,
    totalConservadorOriginal,
    totalConservadorSelic,
    totalConservadorCorrigido,
    totalPisCofinsCorrigido,
    totalFolhaCorrigido,
    totalVerdeCorrigido,
    totalAmareloCorrigido,
    totalVermelhoCorrigido,
    totaisPorAno,
    resultadosTeses,
  }
}
