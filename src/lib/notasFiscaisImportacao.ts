// Parser de importação de Notas Fiscais (CSV e XML de NFe) para a aba Notas Fiscais
// de /dados-empresa. Mesmo padrão da importação de fornecedores (importacaoFornecedores.ts):
// parse puro (sem rede), preview antes de confirmar, valores sempre números.

import type { NotaFiscal } from '@/services/notasFiscais'

export interface LinhaNotaImportada extends Omit<
  NotaFiscal,
  'id' | 'user_id' | 'created' | 'updated'
> {
  linha: number // linha original no arquivo (1-based, dados sem cabeçalho)
  erro?: string // motivo de exclusão do preview (linha inválida)
}

export interface ResultadoParseNotas {
  notas: LinhaNotaImportada[] // apenas linhas válidas
  ignoradas: number // linhas descartadas (sem valor/erro de leitura)
  erros: string[] // mensagens de diagnóstico por linha ignorada
}

const CABECALHOS_ACEITOS: Record<string, string[]> = {
  numero: ['numero', 'número', 'nf', 'nfe', 'nota', 'nota_fiscal', 'numero_nota'],
  data_emissao: ['data', 'data_emissao', 'emissao', 'data emissão', 'dt_emissao'],
  cnpj_emitente: ['cnpj_emitente', 'cnpj', 'cnpj emitente', 'cnpj_emitedor'],
  nome_emitente: ['nome_emitente', 'emitente', 'fornecedor', 'razao_social', 'razão social'],
  valor_total: ['valor_total', 'valor total', 'total', 'vlr_total', 'valor_total_nota'],
  valor_produtos: ['valor_produtos', 'valor produtos', 'produtos', 'vlr_produtos'],
  regime_fornecedor: ['regime_fornecedor', 'regime', 'regime do fornecedor'],
}

function normalizarChave(k: string): string {
  return k
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Conversão numérica tolerante: aceita "1.234,56", "1234.56", "R$ 1.234,56", "(123,45)"
export function converterParaNumeroNota(valor: unknown): number {
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0
  if (valor === null || valor === undefined) return 0
  let s = String(valor).trim()
  if (!s) return 0
  const negativo = /^\(.*\)$/.test(s) || s.startsWith('-')
  s = s.replace(/[()]/g, '').replace(/[^\d,.-]/g, '')
  if (!s) return 0
  // Se tem vírgula e ponto, decide pelo último separador
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  if (!isFinite(n)) return 0
  return negativo ? -Math.abs(n) : n
}

// Aceita YYYY-MM-DD, DD/MM/YYYY, DD/MM/YY e ISO com hora. Retorna YYYY-MM-DD ou ''.
export function normalizarDataNota(valor: unknown): string {
  if (!valor) return ''
  const s = String(valor).trim()
  if (!s) return ''
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{2})[/\-.](\d{2})[/\-.](\d{2,4})/)
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${ano}-${m[2]}-${m[1]}`
  }
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().slice(0, 10)
    return iso
  }
  return ''
}

function mapearCabecalho(colunas: string[]): Record<string, number> {
  const mapa: Record<string, number> = {}
  colunas.forEach((col, idx) => {
    const chave = normalizarChave(col)
    for (const [campo, aliases] of Object.entries(CABECALHOS_ACEITOS)) {
      if (mapa[campo] === undefined && aliases.includes(chave)) {
        mapa[campo] = idx
        break
      }
    }
  })
  return mapa
}

function parseLinhaCsv(linha: string): string[] {
  const campos: string[] = []
  let campoAtual = ''
  let dentroAspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        campoAtual += '"'
        i++
      } else {
        dentroAspas = !dentroAspas
      }
    } else if ((c === ';' || c === ',') && !dentroAspas) {
      campos.push(campoAtual)
      campoAtual = ''
    } else {
      campoAtual += c
    }
  }
  campos.push(campoAtual)
  return campos
}

// CSV/TSV de notas fiscais. Colunas esperadas: numero, data, cnpj_emitente,
// nome_emitente, valor_total, valor_produtos (regime_fornecedor opcional).
export function parseCsvNotasFiscais(conteudo: string): ResultadoParseNotas {
  const linhas = conteudo.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (linhas.length === 0) {
    return { notas: [], ignoradas: 0, erros: ['Arquivo vazio.'] }
  }

  const primeira = linhas[0]
  const sep = primeira.includes(';') ? ';' : primeira.includes('\t') ? '\t' : ','
  const colunas = parseLinhaCsv(primeira).map((c) => c.replace(/^"|"$/g, ''))
  const mapa = mapearCabecalho(colunas)

  const temCabecalho =
    mapa.valor_total !== undefined && (mapa.numero !== undefined || mapa.data_emissao !== undefined)
  const indiceInicial = temCabecalho ? 1 : 0
  const mapaFinal = temCabecalho
    ? mapa
    : mapearCabecalho([
        'numero',
        'data',
        'cnpj_emitente',
        'nome_emitente',
        'valor_total',
        'valor_produtos',
      ])

  const notas: LinhaNotaImportada[] = []
  const erros: string[] = []
  let ignoradas = 0

  for (let i = indiceInicial; i < linhas.length; i++) {
    const campos = parseLinhaCsv(linhas[i]).map((c) => c.replace(/^"|"$/g, '').trim())
    if (campos.every((c) => c === '')) continue
    const pegar = (campo: string): string => {
      const idx = mapaFinal[campo]
      return idx !== undefined && idx < campos.length ? campos[idx] : ''
    }
    const valorTotal = converterParaNumeroNota(pegar('valor_total'))
    if (!valorTotal && !pegar('numero')) {
      ignoradas++
      erros.push(`Linha ${i + 1}: sem valor_total e sem numero — ignorada.`)
      continue
    }
    if (!valorTotal) {
      ignoradas++
      erros.push(`Linha ${i + 1}: valor_total inválido ou ausente — ignorada.`)
      continue
    }
    notas.push({
      linha: i + 1,
      numero: pegar('numero') || `NF-${i + 1}`,
      data_emissao: normalizarDataNota(pegar('data_emissao')) || '',
      cnpj_emitente: pegar('cnpj_emitente') || '',
      nome_emitente: pegar('nome_emitente') || '',
      valor_total: valorTotal,
      valor_produtos: converterParaNumeroNota(pegar('valor_produtos')) || 0,
      regime_fornecedor: (pegar('regime_fornecedor') || '') as NotaFiscal['regime_fornecedor'],
      origem: 'csv',
    })
  }

  return { notas, ignoradas, erros: erros.slice(0, 20) }
}

function textoTag(el: Element | null | undefined): string {
  return el?.textContent?.trim() || ''
}

function tagPorNomes(pai: Document | Element, nomes: string[]): Element | null {
  for (const nome of nomes) {
    const el = pai.getElementsByTagName(nome)[0]
    if (el) return el
  }
  return null
}

// XML de NFe (layout padrão NF-e / NFC-e). Extrai ide (nNF, dEmi/dhEmi), emit (CNPJ, xNome)
// e prod (vProd) somando os itens; usa vNF (total da nota) quando presente.
// Vários <infNFe> no mesmo arquivo (lote) geram várias notas.
export function parseXmlNfe(conteudo: string): ResultadoParseNotas {
  const notas: LinhaNotaImportada[] = []
  const erros: string[] = []
  let ignoradas = 0

  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return { notas: [], ignoradas: 0, erros: ['Parser de XML indisponível neste ambiente.'] }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(conteudo, 'text/xml')
  const erroParse = doc.getElementsByTagName('parsererror')[0]
  if (erroParse) {
    return {
      notas: [],
      ignoradas: 0,
      erros: ['XML inválido: ' + (erroParse.textContent || '').slice(0, 200)],
    }
  }

  const infNFes = Array.from(doc.getElementsByTagName('infNFe'))
  if (infNFes.length === 0) {
    return { notas: [], ignoradas: 0, erros: ['Nenhuma NFe encontrada no XML (sem <infNFe>).'] }
  }

  infNFes.forEach((infNFe, idx) => {
    const ide = tagPorNomes(infNFe, ['ide'])
    const emit = tagPorNomes(infNFe, ['emit'])

    const numero = textoTag(tagPorNomes(ide || infNFe, ['nNF']))
    const dataEmissao =
      normalizarDataNota(textoTag(tagPorNomes(ide || infNFe, ['dhEmi', 'dEmi']))) || ''

    const cnpjEmitente = textoTag(tagPorNomes(emit || infNFe, ['CNPJ']))
    const nomeEmitente = textoTag(tagPorNomes(emit || infNFe, ['xNome']))

    // vProd de todos os itens <det><prod>
    let valorProdutos = 0
    const prods = Array.from(infNFe.getElementsByTagName('prod'))
    for (const prod of prods) {
      valorProdutos += converterParaNumeroNota(textoTag(tagPorNomes(prod, ['vProd'])))
    }

    // vNF do <total><ICMSTot> tem precedência
    const tot = tagPorNomes(infNFe, ['ICMSTot'])
    const vNF = tot ? converterParaNumeroNota(textoTag(tagPorNomes(tot, ['vNF']))) : 0
    const valorTotal = vNF > 0 ? vNF : valorProdutos

    if (!valorTotal) {
      ignoradas++
      erros.push(`NFe ${idx + 1}: sem vNF e sem vProd nos itens — ignorada.`)
      return
    }

    notas.push({
      linha: idx + 1,
      numero: numero || `NFE-${idx + 1}`,
      data_emissao: dataEmissao,
      cnpj_emitente: cnpjEmitente,
      nome_emitente: nomeEmitente,
      valor_total: valorTotal,
      valor_produtos: valorProdutos,
      regime_fornecedor: '',
      origem: 'xml_nfe',
    })
  })

  return { notas, ignoradas, erros: erros.slice(0, 20) }
}

export function ehArquivoXml(nomeArquivo: string): boolean {
  return /\.xml$/i.test(nomeArquivo)
}
