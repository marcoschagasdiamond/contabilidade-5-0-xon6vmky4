/**
 * Utilitário de Importação de Planilha (CSV/XLSX) para o Recuperador de Créditos.
 *
 * Aceita planilhas com colunas de NCM:
 * - 'ncm', 'codigo_ncm', 'código_ncm', 'classificacao_fiscal', 'classificação_fiscal'
 * Além de colunas opcionais de faturamento anual/mensal ou histórico de 60 meses.
 *
 * Quando o código NCM está presente na base curada (LC 214/2025):
 * - Sugere automaticamente as teses aplicáveis (monofásicos, agropecuários, cesta básica, redução 60%/30%)
 * - Marca com badge 'Sugerido via NCM'
 * - Mantém override manual irrestrito
 *
 * Quando o NCM não for informado ou não constar na base:
 * - Mantém fallback manual intacto
 */

import {
  parseCsvConteudo,
  converterParaNumero,
  type LinhaPlanilhaBruta,
} from './importacaoFaturamento'
import { buscarNcmPorCodigo, formatarCodigoNcm, type ItemNcmCurado } from '@/data/tabelaNcmLc214'
import { sugerirTesesPorItemNcm, type SugestaoNcmRecuperador } from './ncmRecuperadorCreditos'

export interface ItemNcmImportadoRecuperador {
  linhaIndex: number
  produtoOuItem: string
  ncmRaw?: string
  ncmFormatado?: string
  itemCurado?: ItemNcmCurado | null
  sugestao?: SugestaoNcmRecuperador | null
  classificadoAuto: boolean
  valorOuFaturamento?: number
  observacoes?: string
  avisos: string[]
}

export interface ResultadoImportacaoPlanilhaRecuperador {
  sucesso: boolean
  erro?: string
  totalLidas: number
  totalComNcm: number
  totalSugeridasAuto: number
  itens: ItemNcmImportadoRecuperador[]
  todosNcmSugeridos: SugestaoNcmRecuperador[]
  faturamentoTotalDetectado?: number
}

function encontrarColuna(colunas: string[], termos: string[]): string | undefined {
  return colunas.find((c) => {
    const limpo = c.toLowerCase().trim()
    return termos.some((t) => limpo.includes(t))
  })
}

export function mapearLinhasPlanilhaRecuperador(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
): ResultadoImportacaoPlanilhaRecuperador {
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
  ])

  const itens: ItemNcmImportadoRecuperador[] = []
  const mapaSugestoesUnicas = new Map<string, SugestaoNcmRecuperador>()
  let fatTotal = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const descRaw = (l[colDescricao] || '').trim()
    const ncmRaw = colNcm ? (l[colNcm] || '').trim() : undefined
    const valorRaw = colValor ? l[colValor] : undefined
    const valorNum = valorRaw !== undefined ? converterParaNumero(valorRaw) : undefined

    if (valorNum && valorNum > 0) {
      fatTotal += valorNum
    }

    if (!descRaw && !ncmRaw) continue

    const avisos: string[] = []
    let itemCurado: ItemNcmCurado | null = null
    let sugestao: SugestaoNcmRecuperador | null = null
    let ncmFormatado: string | undefined = undefined
    let classificadoAuto = false

    if (ncmRaw) {
      ncmFormatado = formatarCodigoNcm(ncmRaw)
      itemCurado = buscarNcmPorCodigo(ncmRaw)

      if (itemCurado) {
        sugestao = sugerirTesesPorItemNcm(itemCurado)
        classificadoAuto = true
        avisos.push(
          `Sugerido via NCM ${formatarCodigoNcm(itemCurado.codigoLimpo)} (${itemCurado.categoriaRotulo})`,
        )
        mapaSugestoesUnicas.set(itemCurado.codigoLimpo, sugestao)
      } else {
        avisos.push(`NCM ${ncmFormatado} não consta na base curada LC 214: mantida seleção manual.`)
      }
    } else {
      avisos.push('Sem NCM informado: mantido fallback manual.')
    }

    itens.push({
      linhaIndex: i + 1,
      produtoOuItem: descRaw || `Item ${i + 1}`,
      ncmRaw,
      ncmFormatado,
      itemCurado,
      sugestao,
      classificadoAuto,
      valorOuFaturamento: valorNum,
      avisos,
    })
  }

  const totalComNcm = itens.filter((it) => Boolean(it.ncmRaw)).length
  const totalSugeridasAuto = itens.filter((it) => it.classificadoAuto).length

  return {
    sucesso: true,
    totalLidas: itens.length,
    totalComNcm,
    totalSugeridasAuto,
    itens,
    todosNcmSugeridos: Array.from(mapaSugestoesUnicas.values()),
    faturamentoTotalDetectado: fatTotal > 0 ? fatTotal : undefined,
  }
}

export function processarCsvRecuperador(
  textoCsv: string,
  nomeArquivo: string,
): ResultadoImportacaoPlanilhaRecuperador {
  const parse = parseCsvConteudo(textoCsv, nomeArquivo)
  if (!parse.sucesso) {
    return {
      sucesso: false,
      erro: parse.erro || 'Falha ao ler arquivo CSV.',
      totalLidas: 0,
      totalComNcm: 0,
      totalSugeridasAuto: 0,
      itens: [],
      todosNcmSugeridos: [],
    }
  }

  return mapearLinhasPlanilhaRecuperador(parse.linhas, parse.colunas)
}

/**
 * Gera modelo CSV para download com exemplos das categorias-chave da LC 214/2025.
 */
export function gerarCsvModeloRecuperador(): string {
  const cabecalho = 'Produto / Insumo;NCM;Faturamento ou Volume (R$);Observacoes\n'
  const linhas = [
    'Arroz Parboilizado Tipo 1 Cesta Basica;1006.30.21;850000;Item desonerado Anexo XII LC 214',
    'Cerveja de Malte Monofasica;2203.00.00;620000;Bebida fria sujeita a Imposto Seletivo e monofasico',
    'Adubo e Fertilizante NPK Lavoura;3105.20.00;1200000;Insumo agropecuario essencial com manutencao de credito',
    'Medicamento Humano Continuo;3004.90.99;450000;Produto farmaceutico com reducao de 60%',
    'Peca Automotiva Estampada;8708.29.99;380000;Componente industrial com reducao de 30%',
    'Servico ou Item Avulso Sem NCM;;250000;Exemplo sem NCM (fallback manual mantido)',
  ]
  return cabecalho + linhas.join('\n')
}
