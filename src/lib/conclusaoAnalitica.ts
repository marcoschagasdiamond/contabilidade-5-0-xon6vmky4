/**
 * Utilitário para geração da Conclusão Analítica da Calculadora IBS/CBS (Módulo 6 & PDFs)
 * Padrão Diamond Group: Tom executivo, consultivo e técnico, sem ícones.
 */

import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { isAno2026, TEXTO_FASE_TESTE_2026 } from '@/context/CalculadoraIbsCbsContext'
import {
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_AGRO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_FOOD_SERVICE,
} from '@/types/calculadoraIbsCbs'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'

export interface FatorExplicativoAnalitico {
  titulo: string
  descricao: string
}

export interface ConclusaoAnaliticaDados {
  anoSelecionado: number | string
  is2026: boolean
  isAtual: boolean
  regimeRecomendado: string
  regimeAtualReferencia: string
  aliquotaAtual: number
  aliquotaNova: number
  temEconomia: boolean
  economiaMensalStr: string
  economiaAnualStr: string
  economiaMensalValor: number
  economiaAnualValor: number
  vereditoTexto: string
  fatores: FatorExplicativoAnalitico[]
}

export interface GerarConclusaoAnaliticaInput {
  anoSelecionado: number | string
  regimeAtualFiltro: string
  regimeRecomendado: string
  economiaMensalProjetada: number
  economiaAnualProjetada: number
  aliquotaEfetivaAtual: number
  aliquotaEfetivaNova: number
  faturamentoMensal: number
  percentualComprasVendas: number
  percentualExportacao?: number
  margemLucroEstimada?: number
  tipoAtividade?: string
  presuncaoSegmento?: number
  alertaLimitesSimples?: {
    isDesenquadrado?: boolean
    isHibrido?: boolean
    statusTeto?: 'verde' | 'amarelo' | 'vermelho'
    statusSublimite?: 'verde' | 'amarelo' | 'vermelho'
    percentualAtingidoTeto?: number
    percentualAtingidoSublimite?: number
    faturamentoAnualProjetado?: number
  }
}

/**
 * Deriva os 2 a 3 fatores explicativos a partir dos parâmetros de contexto da calculadora.
 */
export function derivarFatoresExplicativos(
  dados: GerarConclusaoAnaliticaInput,
): FatorExplicativoAnalitico[] {
  const fatores: FatorExplicativoAnalitico[] = []
  const {
    percentualComprasVendas,
    percentualExportacao = 0,
    margemLucroEstimada = 15,
    presuncaoSegmento = 32,
    alertaLimitesSimples,
    faturamentoMensal,
    anoSelecionado,
  } = dados

  const eh2026 = isAno2026(anoSelecionado)
  const faturamentoAnual = alertaLimitesSimples?.faturamentoAnualProjetado || faturamentoMensal * 12

  // 1. Fator: Base de Créditos (% Compras s/ Vendas)
  if (percentualComprasVendas >= 50) {
    fatores.push({
      titulo: `Alta base de créditos (${percentualComprasVendas}% de compras s/ vendas)`,
      descricao: `O expressivo volume de compras e insumos operacionais (${percentualComprasVendas}% da receita) maximiza a apropriação de créditos na não-cumulatividade plena do IBS/CBS e no Lucro Real, abatendo a carga tributária efetiva de saída.`,
    })
  } else if (percentualComprasVendas <= 25) {
    fatores.push({
      titulo: `Baixa base de créditos tributários (${percentualComprasVendas}% de compras s/ vendas)`,
      descricao: `Com compras em apenas ${percentualComprasVendas}% das vendas, o volume reduzido de créditos de entrada limita o abatimento no IBS/CBS e Lucro Real, favorecendo regimes simplificados ou com presunção quando a folha e margens permitirem.`,
    })
  } else {
    fatores.push({
      titulo: `Base moderada de créditos (${percentualComprasVendas}% de compras s/ vendas)`,
      descricao: `Compras representando ${percentualComprasVendas}% da receita bruta viabilizam recuperação parcial dos débitos no regime não-cumulativo do IVA Dual e Lucro Real.`,
    })
  }

  // 2. Fator: Limites e Elegibilidade do Simples Nacional (Teto R$ 4,8M / Sublimite R$ 3,6M)
  const isDesenquadrado = alertaLimitesSimples?.isDesenquadrado || faturamentoAnual > 4800000
  const isHibrido =
    alertaLimitesSimples?.isHibrido || (faturamentoAnual > 3600000 && faturamentoAnual <= 4800000)

  if (isDesenquadrado) {
    fatores.push({
      titulo: 'Inelegibilidade ao Simples Nacional (Faturamento acima de R$ 4,8M)',
      descricao: `Com faturamento anual projetado em ${formatarMoeda(faturamentoAnual)}, a empresa ultrapassa o teto legal de R$ 4,8 milhões, tornando o Simples Nacional juridicamente inaplicável e restringindo a escolha aos regimes de Lucro Presumido, Lucro Real ou IBS/CBS.`,
    })
  } else if (isHibrido) {
    fatores.push({
      titulo: 'Simples Híbrido (Faturamento acima do sublimite de R$ 3,6M)',
      descricao: `O faturamento anual de ${formatarMoeda(faturamentoAnual)} supera o sublimite de R$ 3,6M, exigindo apuração de ICMS e ISS por fora da guia DAS unificada e reduzindo a atratividade do Simples frente aos demais regimes.`,
    })
  } else if (faturamentoAnual <= 3600000 && !eh2026) {
    fatores.push({
      titulo: `Plena elegibilidade ao Simples Nacional (${((faturamentoAnual / 4800000) * 100).toFixed(0)}% do teto legal)`,
      descricao: `Faturamento anual de ${formatarMoeda(faturamentoAnual)} permite enquadramento integral na guia única DAS com alíquotas progressivas favoráveis, competindo diretamente com a incidência do novo sistema.`,
    })
  }

  // 3. Fator: Margem de Lucro Efetiva vs. Presunção do Segmento
  const difMargemPresuncao = margemLucroEstimada - presuncaoSegmento
  if (difMargemPresuncao >= 8) {
    fatores.push({
      titulo: `Margem de lucro real (${margemLucroEstimada}%) superior à presunção legal (${presuncaoSegmento}%)`,
      descricao: `Por operar com lucratividade real (${margemLucroEstimada}%) acima da margem presumida pelo Fisco (${presuncaoSegmento}%), o Lucro Presumido tributa o IRPJ e a CSLL sobre uma base arbitrária menor do que o lucro societário efetivo, gerando ganho fiscal relevante.`,
    })
  } else if (difMargemPresuncao <= -8) {
    fatores.push({
      titulo: `Margem de lucro real (${margemLucroEstimada}%) inferior à presunção legal (${presuncaoSegmento}%)`,
      descricao: `A lucratividade real estimada (${margemLucroEstimada}%) é inferior à base de presunção fixada para o segmento (${presuncaoSegmento}%), o que penalizaria o Lucro Presumido e confere vantagem competitiva ao Lucro Real ou IBS/CBS com deduções integrais.`,
    })
  }

  // 4. Fator: Exportação de Mercadorias / Serviços (imunidade constitucional LC 214/2025)
  if (percentualExportacao > 0 && fatores.length < 3) {
    fatores.push({
      titulo: `Operações de exportação desoneradas (${percentualExportacao}% da receita)`,
      descricao: `A parcela de receita auferida no comércio exterior (${percentualExportacao}%) goza de imunidade tributária e alíquota zero de IBS/CBS nos termos da EC 132/2023, assegurando crédito financeiro integral sobre os insumos correspondentes.`,
    })
  }

  // Garantir entre 2 e 3 fatores explicativos
  if (fatores.length < 2) {
    fatores.push({
      titulo: 'Estrutura de despesas e insumos operacionais',
      descricao:
        'A proporcionalidade entre custos tributados e margem de contribuição operacional define o ponto de equilíbrio fiscal entre a cumulatividade e a não-cumulatividade plena.',
    })
  }

  return fatores.slice(0, 3)
}

/**
 * Constrói o parecer completo da Conclusão Analítica
 */
export function construirConclusaoAnalitica(
  input: GerarConclusaoAnaliticaInput,
): ConclusaoAnaliticaDados {
  const {
    anoSelecionado,
    regimeAtualFiltro,
    regimeRecomendado,
    economiaMensalProjetada,
    economiaAnualProjetada,
    aliquotaEfetivaAtual,
    aliquotaEfetivaNova,
  } = input

  const eh2026 = isAno2026(anoSelecionado)
  const isAtual = anoSelecionado === 'atual'
  const temEconomia = economiaAnualProjetada >= 0 && !eh2026 && !isAtual

  const economiaMensalStr = temEconomia
    ? formatarMoeda(economiaMensalProjetada)
    : 'Sem economia neste cenário'

  const economiaAnualStr = temEconomia
    ? formatarMoeda(economiaAnualProjetada)
    : 'Sem economia neste cenário'

  let vereditoTexto = ''

  if (isAtual) {
    vereditoTexto = `Para o cenário atual pré-reforma, o regime recomendado apurado é o ${regimeRecomendado}, com alíquota efetiva de ${formatarPorcentagem(aliquotaEfetivaAtual)} sobre o faturamento. O sistema tributário vigente (PIS, COFINS, IPI, ICMS e ISS) segue em plena aplicação até o início da transição formal em 2026.`
  } else if (eh2026) {
    vereditoTexto = `Para o ano da transição 2026, o regime recomendado é o ${regimeRecomendado}. Conforme estabelece o art. 348 da LC 214/2025 (fase de teste piloto), a CBS (0,90%) e o IBS (0,10%) operam com carga zero/compensável integralmente contra tributos federais e sem recolhimento cumulativo, ficando o IBS/CBS fora da disputa de escolha de regime neste ano. O resultado reflete a melhor opção entre os regimes vigentes (Simples Nacional, Lucro Presumido e Lucro Real).`
  } else if (temEconomia) {
    vereditoTexto = `Para o ano da transição ${anoSelecionado}, o regime recomendado é o ${regimeRecomendado}. A projeção técnica aponta uma economia anual estimada em ${economiaAnualStr} (${economiaMensalStr} por competência mensal) em comparação ao regime atual (${regimeAtualFiltro}), reduzindo a alíquota efetiva para ${formatarPorcentagem(aliquotaEfetivaNova)}.`
  } else {
    vereditoTexto = `Para o ano da transição ${anoSelecionado}, o regime recomendado é o ${regimeRecomendado}. Em relação ao regime atual (${regimeAtualFiltro}), a projeção aponta alíquota efetiva de ${formatarPorcentagem(aliquotaEfetivaNova)} com resultado financeiro classificado como "Sem economia neste cenário", demandando reestruturação de créditos ou revisão das margens de compras antes de eventual migração.`
  }

  const fatores = derivarFatoresExplicativos(input)

  return {
    anoSelecionado,
    is2026: eh2026,
    isAtual,
    regimeRecomendado,
    regimeAtualReferencia: regimeAtualFiltro,
    aliquotaAtual: aliquotaEfetivaAtual,
    aliquotaNova: aliquotaEfetivaNova,
    temEconomia,
    economiaMensalStr,
    economiaAnualStr,
    economiaMensalValor: economiaMensalProjetada,
    economiaAnualValor: economiaAnualProjetada,
    vereditoTexto,
    fatores,
  }
}

/**
 * Função helper que extrai diretamente de uma Simulação salva para reuso nos relatórios
 */
export function extrairConclusaoDeSimulacao(
  parametros: ParametrosSimulacaoCalculadora,
  resultados: ResultadosSimulacaoCalculadora,
): ConclusaoAnaliticaDados {
  const ano =
    parametros.anoTransicaoDashboard === 'atual'
      ? 'atual'
      : (parametros.anoTransicaoDashboard ?? parametros.config?.anoTransicao ?? 2033)

  // Derivação de presunção do segmento a partir dos parâmetros salvos
  let presuncaoSegmento = 32
  const tipo = parametros.tipoAtividade || 'servico'
  if (tipo === 'comercio') {
    const sub = SUBATIVIDADES_COMERCIO.find((s) => s.id === parametros.subatividadeComercio)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 8
  } else if (tipo === 'industria') {
    const sub = SUBATIVIDADES_INDUSTRIA.find((s) => s.id === parametros.subatividadeIndustria)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 8
  } else if (tipo === 'agronegocio') {
    const sub = SUBATIVIDADES_AGRO.find((s) => s.id === parametros.subatividadeAgro)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 8
  } else if (tipo === 'construcao_civil') {
    const sub = SUBATIVIDADES_CONSTRUCAO.find((s) => s.id === parametros.subatividadeConstrucao)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 32
  } else if (tipo === 'locacao_bens') {
    const sub = SUBATIVIDADES_LOCACAO.find((s) => s.id === parametros.subatividadeLocacao)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 32
  } else if (tipo === 'food_service') {
    const sub = SUBATIVIDADES_FOOD_SERVICE.find((s) => s.id === parametros.subatividadeFoodService)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 8
  } else if (tipo === 'servico') {
    const sub = SUBATIVIDADES_SERVICO.find((s) => s.id === parametros.subatividadeServico)
    presuncaoSegmento = sub?.presuncaoIrpj ?? 32
  }

  return construirConclusaoAnalitica({
    anoSelecionado: ano,
    regimeAtualFiltro:
      parametros.regimeAtualFiltro || parametros.regimeAtualEmpresa || 'Simples Nacional',
    regimeRecomendado: resultados.resultadoDashboard.regimeRecomendado,
    economiaMensalProjetada: resultados.resultadoDashboard.economiaMensalProjetada,
    economiaAnualProjetada: resultados.resultadoDashboard.economiaAnualProjetada,
    aliquotaEfetivaAtual: resultados.resultadoDashboard.aliquotaEfetivaAtual,
    aliquotaEfetivaNova: resultados.resultadoDashboard.aliquotaEfetivaNova,
    faturamentoMensal: parametros.faturamentoMensal,
    percentualComprasVendas: parametros.percentualComprasVendasComparativo,
    percentualExportacao: parametros.percentualExportacao || 0,
    margemLucroEstimada: parametros.margemLucroEstimada ?? 15,
    tipoAtividade: parametros.tipoAtividade,
    presuncaoSegmento,
  })
}
