/**
 * Extração antecipada de IBS/CBS (Reforma Tributária 2026+) em planilhas
 * importadas (CSV / XLSX) pela rota de Balancete em /dados-empresa.
 *
 * FATIA 2 da integração antecipada: como ainda não existe arquivo oficial do
 * novo sistema circulando, aqui aceita-se QUALQUER planilha que traz colunas
 * razoáveis de IBS/CBS (aceitando variações de cabeçalho: "IBS", "CBS",
 * "cClassTrib", "CST IBS/CBS", "Crédito IBS/CBS", "vIBS", "vCBS" etc.).
 * O parser NUNCA lança erro e NUNCA altera a saída quando as colunas não
 * existem — ausência = resultado idêntico ao de antes.
 */

import type { LinhaPlanilhaBruta } from './importacaoFaturamento'

/** Normaliza texto para busca insensível a acentos e pontuação. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Campos de IBS/CBS extraídos de uma planilha (todos opcionais). */
export interface CamposIbsCbsPlanilha {
  ibsDestacado?: number
  cbsDestacado?: number
  cstIbsCbsDetectados?: string[]
  cClassTribDetectados?: string[]
  creditoIbsCbsApurado?: number
}

interface ColunasIbsCbs {
  colIbs?: string
  colCbs?: string
  colCst?: string
  colCClassTrib?: string
  colCreditoIbsCbs?: string
  colCreditoIbs?: string
  colCreditoCbs?: string
}

/** Palavras-chave aceitas em cada cabeçalho (comparação sem acento, minúscula). */
const TERMOS: Record<keyof ColunasIbsCbs, string[]> = {
  colIbs: ['ibs', 'vibs', 'valor_ibs', 'valor ibs', 'ibs destacado', 'ibs_total', 'ibs total'],
  colCbs: ['cbs', 'vcbs', 'valor_cbs', 'valor cbs', 'cbs destacado', 'cbs_total', 'cbs total'],
  colCst: ['cst_ibs', 'cst ibs', 'cst_cbs', 'cst cbs', 'cst ibs/cbs', 'cst do ibs'],
  colCClassTrib: ['cclasstrib', 'c_class_trib', 'cclass_trib', 'classificacao tributaria'],
  colCreditoIbsCbs: [
    'credito ibs/cbs',
    'credito ibs cbs',
    'credito_ibs_cbs',
    'credito ibs+cbs',
    'credito apurado',
    'credito_ibs_cbs_apurado',
    'credito ibs/cbs apurado',
  ],
  colCreditoIbs: ['credito_ibs', 'credito ibs', 'credito de ibs'],
  colCreditoCbs: ['credito_cbs', 'credito cbs', 'credito de cbs'],
}

function encontrarColunaIbsCbs(colunas: string[], termos: string[]): string | undefined {
  return colunas.find((c) => {
    const limpo = normalizar(c)
    return termos.some((t) => limpo === normalizar(t) || limpo.includes(normalizar(t)))
  })
}

/** Normaliza valores numéricos "1.234,56" / "(123,45)" / -1.2 para número. */
function paraNumero(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  if (typeof val === 'number') return isFinite(val) ? val : undefined
  const str = String(val).trim()
  if (!str) return undefined
  const isNegativo = /^\(.*\)$/.test(str) || str.startsWith('-')
  const limpo = str
    .replace(/[()]/g, '')
    .replace(/-/g, '')
    .replace(/[^\d,.]/g, '')
    .trim()
  if (!limpo) return undefined
  let num: number
  if (limpo.includes(',')) {
    // Formato BR: separador decimal vírgula
    num = parseFloat(limpo.replace(/\./g, '').replace(',', '.'))
  } else {
    num = parseFloat(limpo)
  }
  if (isNaN(num)) return undefined
  return isNegativo ? -num : num
}

/**
 * Mapeia as colunas de IBS/CBS no cabeçalho da planilha.
 * Retorna objeto vazio quando NENHUMA coluna reconhecida é encontrada
 * (o chamador trata como "arquivo sem IBS/CBS" e mantém a saída anterior).
 */
export function mapearColunasIbsCbs(colunas: string[]): ColunasIbsCbs {
  const out: ColunasIbsCbs = {}
  const totalReconhecidas = (Object.keys(TERMOS) as (keyof ColunasIbsCbs)[]).reduce((acc, k) => {
    const col = encontrarColunaIbsCbs(colunas, TERMOS[k])
    if (col) out[k] = col
    return col ? acc + 1 : acc
  }, 0)
  if (totalReconhecidas === 0) return {}
  return out
}

/** Indica se a planilha tem alguma coluna de IBS/CBS reconhecível. */
export function planilhaTemColunasIbsCbs(colunas: string[]): boolean {
  return Object.keys(mapearColunasIbsCbs(colunas)).length > 0
}

/**
 * Extrai os campos de IBS/CBS das linhas da planilha.
 * Só é chamada quando mapearColunasIbsCbs reconheceu ao menos uma coluna —
 * com colunas ausentes o resultado é vazio e a saída fica idêntica à anterior.
 */
export function extrairIbsCbsDePlanilha(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
): CamposIbsCbsPlanilha {
  const mapeamento = mapearColunasIbsCbs(colunas)
  if (Object.keys(mapeamento).length === 0) return {}

  let ibsTotal = 0
  let cbsTotal = 0
  let creditoIbsCbsTotal = 0
  let creditoIbsTotal = 0
  let creditoCbsTotal = 0
  const cstSet = new Set<string>()
  const cClassTribSet = new Set<string>()

  for (const linha of linhas) {
    if (mapeamento.colIbs) {
      const v = paraNumero(linha[mapeamento.colIbs])
      if (v !== undefined) ibsTotal += v
    }
    if (mapeamento.colCbs) {
      const v = paraNumero(linha[mapeamento.colCbs])
      if (v !== undefined) cbsTotal += v
    }
    if (mapeamento.colCst) {
      const v = String(linha[mapeamento.colCst] || '').trim()
      if (v) cstSet.add(v)
    }
    if (mapeamento.colCClassTrib) {
      const v = String(linha[mapeamento.colCClassTrib] || '').trim()
      if (v) cClassTribSet.add(v)
    }
    if (mapeamento.colCreditoIbsCbs) {
      const v = paraNumero(linha[mapeamento.colCreditoIbsCbs])
      if (v !== undefined) creditoIbsCbsTotal += v
    }
    if (mapeamento.colCreditoIbs) {
      const v = paraNumero(linha[mapeamento.colCreditoIbs])
      if (v !== undefined) creditoIbsTotal += v
    }
    if (mapeamento.colCreditoCbs) {
      const v = paraNumero(linha[mapeamento.colCreditoCbs])
      if (v !== undefined) creditoCbsTotal += v
    }
  }

  const creditoIbsCbsApurado =
    creditoIbsCbsTotal > 0
      ? arredondar(creditoIbsCbsTotal)
      : creditoIbsTotal > 0 || creditoCbsTotal > 0
        ? arredondar(creditoIbsTotal + creditoCbsTotal)
        : undefined

  const resultado: CamposIbsCbsPlanilha = {}
  const temIbs = ibsTotal !== 0
  const temCbs = cbsTotal !== 0
  const temCst = cstSet.size > 0
  const temCClassTrib = cClassTribSet.size > 0

  if (temIbs) resultado.ibsDestacado = arredondar(ibsTotal)
  if (temCbs) resultado.cbsDestacado = arredondar(cbsTotal)
  if (temCst) resultado.cstIbsCbsDetectados = Array.from(cstSet)
  if (temCClassTrib) resultado.cClassTribDetectados = Array.from(cClassTribSet)
  if (creditoIbsCbsApurado !== undefined) resultado.creditoIbsCbsApurado = creditoIbsCbsApurado

  return resultado
}

function arredondar(v: number): number {
  return Math.round(v * 100) / 100
}
