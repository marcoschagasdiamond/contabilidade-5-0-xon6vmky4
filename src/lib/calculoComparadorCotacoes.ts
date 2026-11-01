/**
 * Módulo de Cálculo para o Comparador de Cotações de Fornecedores sob a LC 214/2025.
 *
 * Caso de uso principal (solicitado pelo usuário):
 * "Empresa compradora do Lucro Real tem a opção de comprar da empresa no Simples com preço
 * da mercadoria menor ou comprar na empresa do Presumido que o preço é maior mas gera crédito".
 *
 * Suporta 2 ou 3 cotações de fornecedores:
 * - Preço de compra (R$)
 * - Regime do fornecedor: 'lucro_real' | 'lucro_presumido' | 'simples_nacional'
 * - Se Simples Nacional: % efetivo de crédito ajustável (faixa padrão 3% a 7%)
 * - Classificação do item adquirido: 'integral' (100%) | 'parcial' (% configurável) | 'nao_gera' (0%)
 *
 * Considera:
 * - Regime do comprador: Lucro Real, Lucro Presumido ou Simples Nacional.
 *   * Se comprador = Simples Nacional: não aproveita créditos tributários na entrada (regra geral).
 *     Custo líquido = preço de face em todas as cotações, decisão estritamente por preço (neutralidade).
 *   * Se item = nao_gera: crédito = 0 para todas as opções, decisão estritamente por menor preço.
 * - Ano da transição (2026 a 2033) para obter as alíquotas oficiais da LC 214/2025.
 * - Volume de compra mensal opcional para anualizar a economia financeira (R$/ano).
 * - Preço de equilíbrio (Break-even): preço máximo até o qual uma cotação compensa sobre outra.
 * - Veredito em linguagem direta e executiva (padrão Diamond Group).
 */

import { type AnoBaseSimulacao } from './reformaTributaria'
import { type RegimeComprador, obterAliquotasCreditoPorAno } from './calculoFornecedores'
import type { ClassificacaoCreditoItem } from '@/services/fornecedores'

export type RegimeFornecedorCotacao = 'lucro_real' | 'lucro_presumido' | 'simples_nacional'

export interface CotacaoItemInput {
  id: string
  identificador: string // 'A', 'B', 'C'
  fornecedorNome: string
  preco: number // Preço unitário ou da cotação em R$
  regime: RegimeFornecedorCotacao
  aliquotaSimplesCustom?: number // % efetivo ajustável caso seja Simples (padrão 3 a 7%)
}

export interface ConfiguracaoComparador {
  anoTransicao: AnoBaseSimulacao
  regimeComprador: RegimeComprador
  classificacaoItem: ClassificacaoCreditoItem
  percentualCreditoParcial?: number // % se classificacaoItem === 'parcial'
  volumeMensal?: number // Quantidade ou R$ mensal de compras para anualização
}

export interface ResultadoCotacaoIndividual {
  id: string
  identificador: string
  fornecedorNome: string
  precoBruto: number
  regime: RegimeFornecedorCotacao
  regimeRotulo: string
  aliquotaEfetivaAplicada: number // %
  fatorItemAplicado: number // decimal 0.0 a 1.0
  creditoRecuperavel: number // R$
  custoLiquido: number // R$ (precoBruto - creditoRecuperavel)
}

export interface ParBreakEven {
  base: string // 'A'
  comparada: string // 'B'
  nomeBase: string
  nomeComparada: string
  precoMaximoBaseParaEquiparar: number // Preço que tornaria o custo líquido de base igual ao de comparada
  descricaoBreakEven: string
}

export interface ResultadoComparadorCotacoes {
  configuracao: ConfiguracaoComparador
  cotacoes: ResultadoCotacaoIndividual[]
  melhorCotacao: ResultadoCotacaoIndividual
  segundaMelhorCotacao?: ResultadoCotacaoIndividual
  // Diferenças entre 1ª e 2ª colocada
  diferencaCustoLiquidoMoeda: number // R$
  diferencaCustoLiquidoPercentual: number // %
  // Anualização
  economiaMensal: number // R$/mês
  economiaAnual: number // R$/ano
  volumeMensalInformado: boolean
  // Indicadores de neutralidade
  itemNaoGeraCredito: boolean
  compradorNoSimples: boolean
  decisaoPorPrecoPuro: boolean
  // Break-evens cruzados
  breakEvens: ParBreakEven[]
  // Veredito textual direto
  vereditoDireto: string
  recomendacaoDetalhada: string
  explicacaoRegimes: string
}

/**
 * Normaliza o rótulo legível do regime do fornecedor
 */
export function rotuloRegimeFornecedor(regime: RegimeFornecedorCotacao): string {
  switch (regime) {
    case 'lucro_real':
      return 'Lucro Real'
    case 'lucro_presumido':
      return 'Lucro Presumido'
    case 'simples_nacional':
      return 'Simples Nacional'
    default:
      return 'Regime Regular'
  }
}

/**
 * Realiza o cálculo comparativo de cotações de fornecedores.
 */
export function calcularComparadorCotacoes(
  cotacoesInput: CotacaoItemInput[],
  config: ConfiguracaoComparador,
): ResultadoComparadorCotacoes {
  const infoAno = obterAliquotasCreditoPorAno(config.anoTransicao)
  const compradorNoSimples = config.regimeComprador === 'simples_nacional'
  const itemNaoGeraCredito = config.classificacaoItem === 'nao_gera'
  const decisaoPorPrecoPuro = compradorNoSimples || itemNaoGeraCredito

  // Fator de aproveitamento do item
  let fatorItem = 1.0
  if (itemNaoGeraCredito) {
    fatorItem = 0.0
  } else if (config.classificacaoItem === 'parcial') {
    const pct = Math.max(0, Math.min(100, config.percentualCreditoParcial ?? 50))
    fatorItem = pct / 100
  }

  // Alíquota regular do ano selecionado (decimal)
  const aliqRegular = infoAno.aliquotaRegimeRegular

  // Processa cada cotação
  const cotacoesProcessadas: ResultadoCotacaoIndividual[] = cotacoesInput.map((cot) => {
    const preco = Math.max(0, Number(cot.preco) || 0)

    let aliqDecimal = 0
    if (compradorNoSimples || itemNaoGeraCredito) {
      // Simples Nacional adquirente ou item que não gera crédito = 0 aproveitamento
      aliqDecimal = 0
    } else if (cot.regime === 'lucro_real' || cot.regime === 'lucro_presumido') {
      // Regime Regular transfere crédito pleno do ano
      aliqDecimal = aliqRegular
    } else if (cot.regime === 'simples_nacional') {
      // Simples Nacional: % customizável ou padrão do ano
      if (
        cot.aliquotaSimplesCustom !== undefined &&
        cot.aliquotaSimplesCustom !== null &&
        !isNaN(cot.aliquotaSimplesCustom) &&
        cot.aliquotaSimplesCustom >= 0
      ) {
        aliqDecimal = Math.max(0, Math.min(100, cot.aliquotaSimplesCustom)) / 100
      } else {
        aliqDecimal = infoAno.aliquotaSimplesMedia
      }
    }

    // Crédito recuperável: Preço * Alíquota * Fator do Item
    const creditoRecuperavel = preco * aliqDecimal * fatorItem
    const custoLiquido = Math.max(0, preco - creditoRecuperavel)

    return {
      id: cot.id,
      identificador: cot.identificador,
      fornecedorNome: cot.fornecedorNome || `Cotação ${cot.identificador}`,
      precoBruto: preco,
      regime: cot.regime,
      regimeRotulo: rotuloRegimeFornecedor(cot.regime),
      aliquotaEfetivaAplicada: aliqDecimal * 100,
      fatorItemAplicado: fatorItem,
      creditoRecuperavel,
      custoLiquido,
    }
  })

  // Ordena por menor custo líquido (melhor opção primeiro)
  const cotacoesOrdenadas = [...cotacoesProcessadas].sort((a, b) => a.custoLiquido - b.custoLiquido)
  const melhor = cotacoesOrdenadas[0] || cotacoesProcessadas[0]
  const segunda = cotacoesOrdenadas.length > 1 ? cotacoesOrdenadas[1] : undefined

  // Diferença entre a 1ª e a 2ª melhor
  const diferencaCustoLiquidoMoeda = segunda
    ? Math.max(0, segunda.custoLiquido - melhor.custoLiquido)
    : 0
  const diferencaCustoLiquidoPercentual =
    segunda && segunda.custoLiquido > 0
      ? (diferencaCustoLiquidoMoeda / segunda.custoLiquido) * 100
      : 0

  // Anualização da economia
  const volMensal = Math.max(0, config.volumeMensal || 0)
  const volumeMensalInformado = volMensal > 0
  // Se informado volume mensal (unidades ou volume de compras):
  // se o preço for unitário e volMensal for quantidade, ou volMensal for valor mensal:
  // Economia por unidade = diferencaCustoLiquidoMoeda.
  // Projeção: economiaMensal = diferencaCustoLiquidoMoeda * volMensal;
  const economiaMensal = diferencaCustoLiquidoMoeda * (volumeMensalInformado ? volMensal : 1)
  const economiaAnual = economiaMensal * 12

  // Break-even cruzado entre as opções
  // Custo líquido de i: CL_i = P_i * (1 - aliq_i * fatorItem)
  // Igualar CL_base = CL_comparada:
  // P_base * (1 - aliq_base * fatorItem) = CL_comparada
  // => P_base_max = CL_comparada / (1 - aliq_base * fatorItem)
  const breakEvens: ParBreakEven[] = []

  cotacoesProcessadas.forEach((cotBase) => {
    cotacoesProcessadas.forEach((cotComp) => {
      if (cotBase.id === cotComp.id) return

      const denom = 1 - (cotBase.aliquotaEfetivaAplicada / 100) * cotBase.fatorItemAplicado
      let precoMaximo = 0
      if (denom > 0) {
        precoMaximo = cotComp.custoLiquido / denom
      } else {
        precoMaximo = cotComp.custoLiquido
      }

      let desc = ''
      if (cotBase.precoBruto <= precoMaximo) {
        desc = `${cotBase.fornecedorNome} compensa frente a ${cotComp.fornecedorNome} até o preço de R$ ${precoMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      } else {
        desc = `Para ${cotBase.fornecedorNome} compensar sobre ${cotComp.fornecedorNome}, seu preço precisaria baixar de R$ ${cotBase.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para no máximo R$ ${precoMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      }

      breakEvens.push({
        base: cotBase.identificador,
        comparada: cotComp.identificador,
        nomeBase: cotBase.fornecedorNome,
        nomeComparada: cotComp.fornecedorNome,
        precoMaximoBaseParaEquiparar: precoMaximo,
        descricaoBreakEven: desc,
      })
    })
  })

  // Veredito textual em linguagem direta e executiva
  let vereditoDireto = ''
  let recomendacaoDetalhada = ''
  let explicacaoRegimes = ''

  if (decisaoPorPrecoPuro) {
    if (compradorNoSimples) {
      vereditoDireto = `Decisão estritamente por preço nominal: compre de ${melhor.fornecedorNome} (${melhor.identificador}) por R$ ${melhor.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      recomendacaoDetalhada = `Como sua empresa está enquadrada no Simples Nacional, você não toma crédito de IBS/CBS na entrada contra a guia DAS. Portanto, nenhum fornecedor gera crédito aproveitável e o critério de decisão é 100% pelo menor preço de face do item.`
      explicacaoRegimes = `Neutralidade fiscal: fornecedores de Lucro Real, Presumido ou Simples Nacional têm o mesmo impacto tributário na sua entrada (crédito = zero).`
    } else {
      // Item não gera crédito
      vereditoDireto = `Decisão estritamente por menor preço: compre de ${melhor.fornecedorNome} (${melhor.identificador}) por R$ ${melhor.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      recomendacaoDetalhada = `O item classificado como "Não gera crédito" desfruta de neutralidade tributária na aquisição. Não há crédito aproveitável de nenhum fornecedor, tornando o preço de face o único fator de escolha.`
      explicacaoRegimes = `Item sem crédito: a legislação da LC 214/2025 veda o crédito deste insumo, anulando qualquer vantagem fiscal de fornecedores do regime regular.`
    }
  } else {
    // Caso com crédito ativo
    if (segunda) {
      const beMelhorVsSegunda = breakEvens.find(
        (b) => b.base === melhor.identificador && b.comparada === segunda.identificador,
      )
      const beSegundaVsMelhor = breakEvens.find(
        (b) => b.base === segunda.identificador && b.comparada === melhor.identificador,
      )

      const precoTetoMelhor = beMelhorVsSegunda?.precoMaximoBaseParaEquiparar ?? melhor.precoBruto
      const precoPisoSegunda = beSegundaVsMelhor?.precoMaximoBaseParaEquiparar ?? segunda.precoBruto

      // Exemplos de veredito direto atendendo a especificação do usuário
      if (melhor.regime === 'lucro_presumido' || melhor.regime === 'lucro_real') {
        if (segunda.regime === 'simples_nacional') {
          vereditoDireto = `Compre de ${melhor.fornecedorNome} (${melhor.identificador}) até o preço de R$ ${precoTetoMelhor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Abaixo de R$ ${precoPisoSegunda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ${segunda.fornecedorNome} (${segunda.identificador}) passa a compensar.`
          recomendacaoDetalhada = `Mesmo com preço de face de R$ ${melhor.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, o fornecedor do ${melhor.regimeRotulo} gera R$ ${melhor.creditoRecuperavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de crédito (${melhor.aliquotaEfetivaAplicada.toFixed(1)}%), resultando em custo líquido de R$ ${melhor.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — inferior ao Simples Nacional (${segunda.fornecedorNome}, custo líquido R$ ${segunda.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
        } else {
          vereditoDireto = `Compre de ${melhor.fornecedorNome} (${melhor.identificador}) com custo líquido de R$ ${melhor.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, gerando vantagem de R$ ${diferencaCustoLiquidoMoeda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} frente a ${segunda.fornecedorNome}.`
          recomendacaoDetalhada = `Ambos os fornecedores estão em regimes regulares, de modo que a melhor oferta combina preço competitivo e crédito integral de IBS/CBS (${melhor.aliquotaEfetivaAplicada.toFixed(1)}%).`
        }
      } else {
        // Melhor é do Simples
        vereditoDireto = `Compre de ${melhor.fornecedorNome} (${melhor.identificador}) do Simples Nacional: o desconto no preço compensa a menor transferência de crédito frente a ${segunda.fornecedorNome}.`
        recomendacaoDetalhada = `O preço menor de R$ ${melhor.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} supera a perda de crédito frente a ${segunda.fornecedorNome} (${segunda.regimeRotulo}), garantindo um custo líquido R$ ${diferencaCustoLiquidoMoeda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} menor. ${segunda.fornecedorNome} só compensaria se baixasse seu preço para até R$ ${precoPisoSegunda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      }

      explicacaoRegimes = `Ano da Transição ${config.anoTransicao}: Regime Regular transfere ${(aliqRegular * 100).toFixed(1)}% de crédito; Simples Nacional transfere taxa efetiva média configurada (${cotacoesProcessadas.find((c) => c.regime === 'simples_nacional')?.aliquotaEfetivaAplicada.toFixed(1) || (infoAno.aliquotaSimplesMedia * 100).toFixed(1)}%).`
    } else {
      vereditoDireto = `Cotação única avaliada: ${melhor.fornecedorNome} (${melhor.regimeRotulo}) com custo líquido de R$ ${melhor.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      recomendacaoDetalhada = `Informe ao menos 2 cotações para calcular a comparação direta de regimes e o preço de equilíbrio.`
      explicacaoRegimes = `Regime Regular transfere ${(aliqRegular * 100).toFixed(1)}% sob a LC 214/2025 para ${config.anoTransicao}.`
    }
  }

  return {
    configuracao: config,
    cotacoes: cotacoesProcessadas,
    melhorCotacao: melhor,
    segundaMelhorCotacao: segunda,
    diferencaCustoLiquidoMoeda,
    diferencaCustoLiquidoPercentual,
    economiaMensal,
    economiaAnual,
    volumeMensalInformado,
    itemNaoGeraCredito,
    compradorNoSimples,
    decisaoPorPrecoPuro,
    breakEvens,
    vereditoDireto,
    recomendacaoDetalhada,
    explicacaoRegimes,
  }
}
