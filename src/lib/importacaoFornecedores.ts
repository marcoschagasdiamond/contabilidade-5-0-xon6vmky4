/**
 * Utilitário de importação de carteira de fornecedores via CSV e XLSX.
 * Baseado no modelo robusto e testado de `importacaoFaturamento.ts`.
 */

import {
  parseCsvConteudo,
  converterParaNumero,
  type LinhaPlanilhaBruta,
  type ResultadoParsePlanilha,
} from './importacaoFaturamento'
import type {
  FornecedorDiagnostico,
  RegimeFornecedor,
  ClassificacaoCreditoItem,
} from '@/services/fornecedores'

export interface FornecedorImportadoPreview {
  nome: string
  cnpj?: string
  regime: RegimeFornecedor
  proporcao_misto?: number
  volume_compras: number
  classificacao_credito: ClassificacaoCreditoItem
  percentual_credito_parcial?: number
  descricao_item?: string
  aliquota_simples_informada?: number
  observacoes?: string
  valido: boolean
  avisos: string[]
}

export interface ResultadoImportacaoFornecedores {
  sucesso: boolean
  erro?: string
  totalLidas: number
  totalValidas: number
  fornecedores: FornecedorImportadoPreview[]
}

/**
 * Normaliza o regime lido do texto da planilha
 */
function normalizarRegimeFornecedor(texto?: string): RegimeFornecedor {
  if (!texto) return 'lucro_real'
  const t = texto.toLowerCase().trim()
  if (t.includes('simples') || t.includes('sn')) return 'simples_nacional'
  if (t.includes('presumido') || t.includes('lp')) return 'lucro_presumido'
  if (t.includes('misto') || t.includes('hibrido') || t.includes('híbrido')) return 'misto'
  return 'lucro_real'
}

/**
 * Normaliza a classificação de crédito do item
 */
function normalizarClassificacaoCredito(texto?: string): ClassificacaoCreditoItem {
  if (!texto) return 'integral'
  const t = texto.toLowerCase().trim()
  if (
    t.includes('nao') ||
    t.includes('não') ||
    t.includes('zero') ||
    t.includes('sem') ||
    t.includes('isento')
  ) {
    return 'nao_gera'
  }
  if (t.includes('parcial') || t.includes('%') || t.includes('fracao') || t.includes('fração')) {
    return 'parcial'
  }
  return 'integral'
}

/**
 * Tenta encontrar a coluna mais adequada por palavras-chave
 */
function encontrarColuna(colunas: string[], termos: string[]): string | undefined {
  return colunas.find((c) => {
    const limpo = c.toLowerCase()
    return termos.some((t) => limpo.includes(t))
  })
}

/**
 * Converte linhas tabulares em lista de fornecedores estruturados
 */
export function mapearLinhasParaFornecedores(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
): FornecedorImportadoPreview[] {
  const colNome =
    encontrarColuna(colunas, ['nome', 'fornecedor', 'razao', 'razão', 'empresa', 'cliente']) ||
    colunas[0]
  const colCnpj = encontrarColuna(colunas, ['cnpj', 'cpf', 'documento'])
  const colRegime = encontrarColuna(colunas, [
    'regime',
    'tributacao',
    'tributação',
    'enquadramento',
  ])
  const colVolume =
    encontrarColuna(colunas, [
      'volume',
      'compras',
      'valor',
      'total',
      'faturamento',
      'compra',
      'pago',
      'preco',
      'preço',
    ]) || colunas[1]
  const colClassificacao = encontrarColuna(colunas, [
    'credito',
    'crédito',
    'classificacao',
    'classificação',
    'item',
    'tipo',
  ])
  const colPercentual = encontrarColuna(colunas, [
    'percentual',
    '%',
    'proporcao',
    'proporção',
    'fatia',
    'aliquota',
    'alíquota',
  ])
  const colItem = encontrarColuna(colunas, [
    'produto',
    'servico',
    'serviço',
    'descricao',
    'descrição',
    'item',
  ])

  const lista: FornecedorImportadoPreview[] = []

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const nomeRaw = (l[colNome] || '').trim()
    if (!nomeRaw) continue

    const avisos: string[] = []
    const volumeRaw = l[colVolume || '']
    const volume = converterParaNumero(volumeRaw)

    if (volume <= 0) {
      avisos.push('Volume de compras zerado ou não identificado.')
    }

    const regimeRaw = colRegime ? l[colRegime] : ''
    const regime = normalizarRegimeFornecedor(regimeRaw)

    const classRaw = colClassificacao ? l[colClassificacao] : ''
    const classificacao = normalizarClassificacaoCredito(classRaw)

    const pctRaw = colPercentual ? converterParaNumero(l[colPercentual]) : undefined
    let pctParcial: number | undefined = undefined
    let proporcaoMisto: number | undefined = undefined

    if (classificacao === 'parcial') {
      pctParcial = pctRaw && pctRaw > 0 ? Math.min(100, pctRaw) : 50
    }
    if (regime === 'misto') {
      proporcaoMisto = pctRaw && pctRaw > 0 ? Math.min(100, pctRaw) : 50
    }

    const cnpj = colCnpj ? (l[colCnpj] || '').trim() : undefined
    const descricaoItem = colItem ? (l[colItem] || '').trim() : undefined

    lista.push({
      nome: nomeRaw,
      cnpj,
      regime,
      proporcao_misto: proporcaoMisto,
      volume_compras: volume,
      classificacao_credito: classificacao,
      percentual_credito_parcial: pctParcial,
      descricao_item: descricaoItem,
      valido: volume > 0,
      avisos,
    })
  }

  return lista
}

/**
 * Processa arquivo CSV ou texto e retorna fornecedores formatados
 */
export function processarCsvFornecedores(
  textoCsv: string,
  nomeArquivo: string,
): ResultadoImportacaoFornecedores {
  const parse = parseCsvConteudo(textoCsv, nomeArquivo)
  if (!parse.sucesso) {
    return {
      sucesso: false,
      erro: parse.erro || 'Falha ao ler arquivo CSV.',
      totalLidas: 0,
      totalValidas: 0,
      fornecedores: [],
    }
  }

  const fornecedores = mapearLinhasParaFornecedores(parse.linhas, parse.colunas)
  const validas = fornecedores.filter((f) => f.valido).length

  return {
    sucesso: true,
    totalLidas: fornecedores.length,
    totalValidas: validas,
    fornecedores,
  }
}

/**
 * Cria modelo de planilha de exemplo para download em CSV
 */
export function gerarCsvModeloFornecedores(): string {
  const cabecalho =
    'Nome do Fornecedor;CNPJ;Regime;Volume de Compras;Classificacao do Item;Percentual Credito;Descricao do Item\n'
  const linhas = [
    'Fornecedor Matéria-Prima Alpha Ltda;12.345.678/0001-90;Lucro Real;1500000;integral;100;Insumos industriais diretos',
    'Distribuidora Beta Presumido S/A;23.456.789/0001-01;Lucro Presumido;850000;integral;100;Embalagens e caixas',
    'Comercial Gamma Simples ME;34.567.890/0001-12;Simples Nacional;620000;integral;100;Peças de reposição e componentes',
    'Cooperativa Delta Mista;45.678.901/0001-23;Misto;480000;integral;60;Fornecimento consorciado',
    'Papelaria e Escritório Epsilon Eireli;56.789.012/0001-34;Simples Nacional;120000;nao_gera;0;Material de consumo e expediente',
    'Transportadora Zeta Logística;67.890.123/0001-45;Lucro Real;340000;parcial;70;Frete sobre insumos e transferências',
  ]
  return cabecalho + linhas.join('\n')
}
