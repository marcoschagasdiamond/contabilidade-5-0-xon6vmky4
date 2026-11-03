/**
 * Utilitário de classificação de itens via NCM para a Calculadora IBS/CBS (LC 214/2025).
 *
 * Mapeia os códigos da tabela curada (src/data/tabelaNcmLc214.ts) para os tratamentos tributários:
 * - Cesta Básica Nacional (Anexo XII) -> alíquota zero (0%)
 * - Redução de 60% (Anexos I, II, III — saúde, educação, alimentos, insumos agropecuários) -> alíquota efetiva reduzida em 60%
 * - Redução de 30% (Anexo IV — bens intermediários, profissões regulamentadas) -> alíquota efetiva reduzida em 30%
 * - Monofásicos e Imposto Seletivo (bebidas frias, cervejas, cigarros, combustíveis) -> regime concentrado / IS
 * - Insumos Agropecuários (adubos, fertilizantes, defensivos, sementes) -> redução de 60% com crédito mantido
 * - Regime Geral / Padrão -> alíquota plena da fase
 *
 * Fallback intacto: se o NCM não for informado ou estiver fora da tabela curada,
 * o usuário pode selecionar manualmente o tratamento ou manter o regime padrão.
 */

import {
  buscarNcmPorCodigo,
  formatarCodigoNcm,
  type ItemNcmCurado,
  type CategoriaNcmLc214,
} from '@/data/tabelaNcmLc214'
import { CRONOGRAMA_FASES_TRANSICAO, type AnoTransicaoIbsCbs } from '@/types/calculadoraIbsCbs'
import {
  parseCsvConteudo,
  converterParaNumero,
  type LinhaPlanilhaBruta,
} from './importacaoFaturamento'

export type TratamentoTributarioNcm =
  | 'cesta_basica_zero'
  | 'reducao_60'
  | 'reducao_30'
  | 'monofasico_is'
  | 'insumo_agro'
  | 'geral'

export interface ItemComposicaoCalculadora {
  id: string
  descricao: string
  ncm?: string
  ncmFormatado?: string
  ncmClassificadoAuto?: boolean
  tratamentoTributario: TratamentoTributarioNcm
  reducaoPercentual: number // 0, 30, 60 ou 100
  valor: number // R$ mensal
  proporcaoPercentual?: number // % do faturamento total
  aliquotaEfetivaCalculada?: number // % estimada para o ano ativo
  aliquotaPersonalizada?: number // override manual opcional
  origem: 'manual' | 'ncm_sugerido'
  anexoReferencia?: string
  observacao?: string
}

export interface ClassificacaoNcmCalculadoraResultado {
  itemCurado: ItemNcmCurado | null
  tratamento: TratamentoTributarioNcm
  reducaoPercentual: number
  descricaoTratamento: string
  aliquotaTexto: string
  anexoReferencia: string
  origem: 'manual' | 'ncm_sugerido'
}

export const OPCOES_TRATAMENTO_NCM: Array<{
  id: TratamentoTributarioNcm
  rotulo: string
  reducao: number
  descricaoCurta: string
}> = [
  {
    id: 'geral',
    rotulo: 'Regime Geral (Alíquota Padrão)',
    reducao: 0,
    descricaoCurta: 'Tributação integral à alíquota de referência da fase.',
  },
  {
    id: 'cesta_basica_zero',
    rotulo: 'Cesta Básica Nacional (Alíquota Zero)',
    reducao: 100,
    descricaoCurta: 'Desoneração total de IBS/CBS (Anexo XII LC 214/2025).',
  },
  {
    id: 'reducao_60',
    rotulo: 'Redução de 60% (Agro / Saúde / Alimentos)',
    reducao: 60,
    descricaoCurta: 'Alíquota reduzida a 40% da referência legal.',
  },
  {
    id: 'reducao_30',
    rotulo: 'Redução de 30% (Regime Diferenciado)',
    reducao: 30,
    descricaoCurta: 'Alíquota reduzida a 70% da referência legal.',
  },
  {
    id: 'monofasico_is',
    rotulo: 'Monofásico / Imposto Seletivo (Bebidas / Cigarros)',
    reducao: 0,
    descricaoCurta: 'Regime concentrado ou sujeito a alíquotas seletivas.',
  },
  {
    id: 'insumo_agro',
    rotulo: 'Insumo Agropecuário Essencial (-60% com crédito pleno)',
    reducao: 60,
    descricaoCurta: 'Fertilizantes, defensivos e sementes (Anexo I LC 214).',
  },
]

/**
 * Classifica automaticamente um código NCM com base na base curada da LC 214/2025.
 */
export function classificarNcmParaCalculadora(
  codigoNcm?: string | null,
): ClassificacaoNcmCalculadoraResultado {
  if (!codigoNcm) {
    return {
      itemCurado: null,
      tratamento: 'geral',
      reducaoPercentual: 0,
      descricaoTratamento: 'Regime Geral (Padrão)',
      aliquotaTexto: 'Alíquota de referência padrão',
      anexoReferencia: 'Regime Comum',
      origem: 'manual',
    }
  }

  const itemCurado = buscarNcmPorCodigo(codigoNcm)
  if (!itemCurado) {
    return {
      itemCurado: null,
      tratamento: 'geral',
      reducaoPercentual: 0,
      descricaoTratamento: 'Regime Geral (NCM fora da base curada)',
      aliquotaTexto: 'Alíquota de referência padrão',
      anexoReferencia: 'Manual',
      origem: 'manual',
    }
  }

  const cat: CategoriaNcmLc214 = itemCurado.categoria
  const codigoLimpo = itemCurado.codigoLimpo

  // 1. Cesta Básica Nacional (Alíquota Zero / Redução 100%)
  if (cat === 'cesta_basica_anexo_xii') {
    return {
      itemCurado,
      tratamento: 'cesta_basica_zero',
      reducaoPercentual: 100,
      descricaoTratamento: 'Cesta Básica Nacional (Alíquota Zero)',
      aliquotaTexto: 'Alíquota Zero (0% IBS/CBS)',
      anexoReferencia: itemCurado.anexoReferencia,
      origem: 'ncm_sugerido',
    }
  }

  // 2. Monofásicos e Bens Sujeitos ao Imposto Seletivo (bebidas frias, cigarros, combustíveis)
  if (
    cat === 'monofasico_imposto_seletivo' ||
    codigoLimpo.startsWith('22') ||
    codigoLimpo.startsWith('24') ||
    codigoLimpo.startsWith('2710')
  ) {
    return {
      itemCurado,
      tratamento: 'monofasico_is',
      reducaoPercentual: 0,
      descricaoTratamento: 'Monofásico / Imposto Seletivo',
      aliquotaTexto: 'Alíquota Padrão + Seletivo (Sem crédito na cadeia)',
      anexoReferencia: itemCurado.anexoReferencia,
      origem: 'ncm_sugerido',
    }
  }

  // 3. Insumos Agropecuários (fertilizantes, defensivos, sementes)
  if (
    cat === 'insumos_agropecuarios' ||
    codigoLimpo.startsWith('31') ||
    codigoLimpo.startsWith('3808') ||
    codigoLimpo.startsWith('1201') ||
    codigoLimpo.startsWith('1005') ||
    codigoLimpo.startsWith('2309')
  ) {
    return {
      itemCurado,
      tratamento: 'insumo_agro',
      reducaoPercentual: 60,
      descricaoTratamento: 'Insumo Agropecuário (-60% com crédito pleno)',
      aliquotaTexto: 'Redução de 60% com crédito assegurado',
      anexoReferencia: itemCurado.anexoReferencia,
      origem: 'ncm_sugerido',
    }
  }

  // 4. Redução de 60% (hortícolas, frutas, medicamentos)
  if (
    cat === 'reducao_60' ||
    codigoLimpo.startsWith('07') ||
    codigoLimpo.startsWith('08') ||
    codigoLimpo.startsWith('300')
  ) {
    return {
      itemCurado,
      tratamento: 'reducao_60',
      reducaoPercentual: 60,
      descricaoTratamento: 'Redução de 60% (LC 214)',
      aliquotaTexto: 'Redução de 60% (Alíquota efetiva 40% da cheia)',
      anexoReferencia: itemCurado.anexoReferencia,
      origem: 'ncm_sugerido',
    }
  }

  // 5. Redução de 30% (bens diferenciados)
  if (
    cat === 'reducao_30' ||
    codigoLimpo.startsWith('8708') ||
    codigoLimpo.startsWith('8409') ||
    codigoLimpo.startsWith('9018')
  ) {
    return {
      itemCurado,
      tratamento: 'reducao_30',
      reducaoPercentual: 30,
      descricaoTratamento: 'Redução de 30% (Regime Diferenciado)',
      aliquotaTexto: 'Redução de 30% (Alíquota efetiva 70% da cheia)',
      anexoReferencia: itemCurado.anexoReferencia,
      origem: 'ncm_sugerido',
    }
  }

  // 6. Regime Geral de Insumos
  return {
    itemCurado,
    tratamento: 'geral',
    reducaoPercentual: 0,
    descricaoTratamento: 'Regime Geral Não-Cumulativo',
    aliquotaTexto: 'Alíquota Padrão Integral',
    anexoReferencia: itemCurado.anexoReferencia,
    origem: 'ncm_sugerido',
  }
}

/**
 * Calcula a alíquota efetiva aplicada a um item específico da composição
 * conforme seu tratamento tributário e o ano da transição selecionado.
 */
export function calcularAliquotaEfetivaItemComposicao(
  item: ItemComposicaoCalculadora,
  ano: AnoTransicaoIbsCbs,
  totalIvaDualPadrao = 26.5,
): number {
  if (item.aliquotaPersonalizada !== undefined) {
    return Math.max(0, item.aliquotaPersonalizada)
  }

  // Em 2026 (fase teste) a alíquota é CBS 0,9% + IBS 0,1% = 1,0%
  if (ano === 'atual') return 0
  if (String(ano) === '2026') {
    if (item.tratamentoTributario === 'cesta_basica_zero') return 0
    if (item.tratamentoTributario === 'reducao_60' || item.tratamentoTributario === 'insumo_agro') {
      return 0.4 // 40% de 1%
    }
    if (item.tratamentoTributario === 'reducao_30') {
      return 0.7 // 70% de 1%
    }
    return 1.0
  }

  const fase = CRONOGRAMA_FASES_TRANSICAO[ano] || CRONOGRAMA_FASES_TRANSICAO[2033]
  const baseAliq = fase.totalIvaDual > 0 ? fase.totalIvaDual : totalIvaDualPadrao

  switch (item.tratamentoTributario) {
    case 'cesta_basica_zero':
      return 0
    case 'reducao_60':
    case 'insumo_agro':
      return Number((baseAliq * 0.4).toFixed(2))
    case 'reducao_30':
      return Number((baseAliq * 0.7).toFixed(2))
    case 'monofasico_is':
    case 'geral':
    default:
      return Number(baseAliq.toFixed(2))
  }
}

/**
 * Totaliza e pondera uma lista de itens da composição por NCM
 */
export function calcularResumoComposicaoNcm(
  itens: ItemComposicaoCalculadora[],
  ano: AnoTransicaoIbsCbs,
  totalIvaDualPadrao = 26.5,
): {
  totalFaturamento: number
  aliquotaMediaPonderada: number
  impostoEstimadoTotal: number
  quantidadeItens: number
  totalComNcm: number
  totalSugeridosAuto: number
  distribuicaoPorTratamento: Record<
    TratamentoTributarioNcm,
    { valor: number; percentual: number; quantidade: number }
  >
} {
  const totalFaturamento = itens.reduce((acc, it) => acc + Math.max(0, it.valor || 0), 0)

  let impostoPonderado = 0
  let totalComNcm = 0
  let totalSugeridosAuto = 0

  const dist: Record<
    TratamentoTributarioNcm,
    { valor: number; percentual: number; quantidade: number }
  > = {
    geral: { valor: 0, percentual: 0, quantidade: 0 },
    cesta_basica_zero: { valor: 0, percentual: 0, quantidade: 0 },
    reducao_60: { valor: 0, percentual: 0, quantidade: 0 },
    reducao_30: { valor: 0, percentual: 0, quantidade: 0 },
    monofasico_is: { valor: 0, percentual: 0, quantidade: 0 },
    insumo_agro: { valor: 0, percentual: 0, quantidade: 0 },
  }

  itens.forEach((it) => {
    const val = Math.max(0, it.valor || 0)
    if (it.ncm) totalComNcm++
    if (it.origem === 'ncm_sugerido') totalSugeridosAuto++

    const aliq = calcularAliquotaEfetivaItemComposicao(it, ano, totalIvaDualPadrao)
    const impostoItem = (val * aliq) / 100
    impostoPonderado += impostoItem

    const trat = it.tratamentoTributario || 'geral'
    if (dist[trat]) {
      dist[trat].valor += val
      dist[trat].quantidade += 1
    }
  })

  if (totalFaturamento > 0) {
    Object.keys(dist).forEach((key) => {
      const k = key as TratamentoTributarioNcm
      dist[k].percentual = Number(((dist[k].valor / totalFaturamento) * 100).toFixed(1))
    })
  }

  const aliquotaMediaPonderada =
    totalFaturamento > 0 ? Number(((impostoPonderado / totalFaturamento) * 100).toFixed(2)) : 0

  return {
    totalFaturamento,
    aliquotaMediaPonderada,
    impostoEstimadoTotal: impostoPonderado,
    quantidadeItens: itens.length,
    totalComNcm,
    totalSugeridosAuto,
    distribuicaoPorTratamento: dist,
  }
}

// ============================================================================
// IMPORTAÇÃO DE PLANILHA CSV/XLSX PARA COMPOSIÇÃO DE ITENS COM NCM
// ============================================================================

export interface ItemComposicaoImportadoPreview {
  descricao: string
  ncm?: string
  ncmFormatado?: string
  ncmClassificadoAuto: boolean
  tratamento: TratamentoTributarioNcm
  descricaoTratamento: string
  reducaoPercentual: number
  valor: number
  origem: 'manual' | 'ncm_sugerido'
  anexoReferencia?: string
  observacoes?: string
  valido: boolean
  avisos: string[]
}

export interface ResultadoImportacaoComposicaoNcm {
  sucesso: boolean
  erro?: string
  totalLidas: number
  totalValidas: number
  totalComNcm: number
  totalSugeridasNcm: number
  valorTotalDetectado: number
  itens: ItemComposicaoImportadoPreview[]
}

function encontrarColuna(colunas: string[], termos: string[]): string | undefined {
  return colunas.find((c) => {
    const limpo = c.toLowerCase().trim()
    return termos.some((t) => limpo.includes(t))
  })
}

export function mapearLinhasParaComposicaoNcm(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
): ResultadoImportacaoComposicaoNcm {
  const colNcm = encontrarColuna(colunas, [
    'ncm',
    'codigo_ncm',
    'código_ncm',
    'classificacao_fiscal',
    'classificação_fiscal',
    'cod_ncm',
  ])
  const colDescricao =
    encontrarColuna(colunas, [
      'produto',
      'item',
      'descricao',
      'descrição',
      'mercadoria',
      'insumo',
      'servico',
      'serviço',
      'nome',
    ]) || colunas[0]
  const colValor = encontrarColuna(colunas, [
    'valor',
    'faturamento',
    'receita',
    'total',
    'volume',
    'preco',
    'preço',
    'mensal',
  ])

  const itens: ItemComposicaoImportadoPreview[] = []
  let totalValidas = 0
  let totalComNcm = 0
  let totalSugeridasNcm = 0
  let valorTotalDetectado = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const descRaw = (l[colDescricao] || '').trim()
    const ncmRaw = colNcm ? (l[colNcm] || '').trim() : undefined
    const valorRaw = colValor ? l[colValor] : undefined
    const valorNum = valorRaw !== undefined ? converterParaNumero(valorRaw) : 0

    if (!descRaw && !ncmRaw && valorNum <= 0) continue

    const avisos: string[] = []
    let ncmFormatado: string | undefined = undefined
    let ncmClassificadoAuto = false
    let tratamento: TratamentoTributarioNcm = 'geral'
    let reducaoPercentual = 0
    let descricaoTratamento = 'Regime Geral (Padrão)'
    let origem: 'manual' | 'ncm_sugerido' = 'manual'
    let anexoReferencia: string | undefined = undefined

    if (ncmRaw) {
      totalComNcm++
      ncmFormatado = formatarCodigoNcm(ncmRaw)
      const classif = classificarNcmParaCalculadora(ncmRaw)

      tratamento = classif.tratamento
      reducaoPercentual = classif.reducaoPercentual
      descricaoTratamento = classif.descricaoTratamento
      origem = classif.origem
      anexoReferencia = classif.anexoReferencia

      if (classif.itemCurado) {
        ncmClassificadoAuto = true
        totalSugeridasNcm++
        avisos.push(
          `Classificado via NCM ${formatarCodigoNcm(classif.itemCurado.codigoLimpo)} (${classif.itemCurado.categoriaRotulo})`,
        )
      } else {
        avisos.push(
          `NCM ${ncmFormatado} não consta na base curada LC 214: mantido regime geral editável.`,
        )
      }
    } else {
      avisos.push('Sem NCM informado: classificado no regime padrão editável.')
    }

    if (valorNum > 0) {
      valorTotalDetectado += valorNum
      totalValidas++
    } else {
      avisos.push('Valor mensal zerado ou não informado.')
    }

    itens.push({
      descricao: descRaw || (ncmFormatado ? `Item NCM ${ncmFormatado}` : `Item ${i + 1}`),
      ncm: ncmRaw,
      ncmFormatado,
      ncmClassificadoAuto,
      tratamento,
      descricaoTratamento,
      reducaoPercentual,
      valor: valorNum,
      origem,
      anexoReferencia,
      valido: valorNum > 0 || Boolean(ncmRaw),
      avisos,
    })
  }

  return {
    sucesso: true,
    totalLidas: itens.length,
    totalValidas,
    totalComNcm,
    totalSugeridasNcm,
    valorTotalDetectado,
    itens,
  }
}

/**
 * Processa CSV com itens/NCM para preencher a composição
 */
export function processarCsvComposicaoNcm(
  textoCsv: string,
  nomeArquivo: string,
): ResultadoImportacaoComposicaoNcm {
  const parse = parseCsvConteudo(textoCsv, nomeArquivo)
  if (!parse.sucesso) {
    return {
      sucesso: false,
      erro: parse.erro || 'Falha ao ler arquivo CSV.',
      totalLidas: 0,
      totalValidas: 0,
      totalComNcm: 0,
      totalSugeridasNcm: 0,
      valorTotalDetectado: 0,
      itens: [],
    }
  }

  return mapearLinhasParaComposicaoNcm(parse.linhas, parse.colunas)
}

/**
 * Gera modelo CSV para download de composição com NCM
 */
export function gerarCsvModeloComposicaoNcm(): string {
  const cabecalho = 'Item / Produto;NCM;Valor Mensal (R$);Observacao\n'
  const linhas = [
    'Arroz Parboilizado Pacote 5kg;1006.30.21;45000;Cesta Basica Nacional (Aliquota Zero)',
    'Feijao Preto 1kg;0713.33.19;32000;Cesta Basica Nacional (Aliquota Zero)',
    'Tomates Frescos Selecionados;0702.00.00;28000;Horticola in natura (-60%)',
    'Cerveja de Malte Lager;2203.00.00;65000;Monofasico e Imposto Seletivo',
    'Ureia Granulada Agricola;3102.10.10;50000;Insumo agropecuario com manutencao de credito',
    'Peca Automotiva Estampada;8708.29.99;30000;Regime diferenciado com reducao de 30%',
    'Servico Avulso de Manutencao;;20000;Item sem NCM (fallback manual no regime geral)',
  ]
  return cabecalho + linhas.join('\n')
}
