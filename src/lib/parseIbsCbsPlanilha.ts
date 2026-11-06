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
 *
 * Correções de bugs (documentados antes como casos "QUIRK" da suíte de testes):
 * - v0.0.309: prioridade de matching por papel (crédito/CST/cClassTrib
 *   antes dos valores destacados); códigos CST/cClassTrib validados como numéricos;
 *   soma zero grava o campo como 0 (diferente de coluna ausente).
 *
 * Regras de matching (corrigidas — ver suíte de testes):
 * - Cada papel (crédito, CST, cClassTrib, IBS, CBS) reivindica UMA coluna e uma
 *   coluna reivindicada não serve a outro papel. Papéis mais específicos
 *   (crédito, CST, cClassTrib) são resolvidos ANTES dos de valor destacado,
 *   então "Crédito IBS" nunca é contado como IBS destacado e "CST IBS/CBS"
 *   nunca é contado como coluna de valor.
 * - CST/cClassTrib só aceita códigos plausíveis (numéricos, com separadores
 *   típicos); texto alfabético livre ("sem classe") é descartado.
 * - Soma zero (ex.: +100 e -100) grava o campo como 0 — valor zerado é
 *   diferente de "coluna ausente/sem valor válido" (que fica ausente).
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

/**
 * Ordem de precedência dos papéis: os mais específicos reivindicam suas
 * colunas primeiro, para que colunas de crédito e de código (CST/cClassTrib)
 * nunca sejam capturadas como IBS/CBS destacados (que têm termos genéricos
 * "ibs"/"cbs" e viriam por último).
 */
const ORDEM_PRECEDENCIA: (keyof ColunasIbsCbs)[] = [
  'colCClassTrib',
  'colCst',
  'colCreditoIbsCbs',
  'colCreditoIbs',
  'colCreditoCbs',
  'colIbs',
  'colCbs',
]

/** Indica se a célula é um código plausível de CST/cClassTrib. */
function ehCodigoPlausivel(val: unknown): boolean {
  if (val === null || val === undefined) return false
  const str = String(val).trim()
  if (!str) return false
  // Apenas dígitos, admitindo separadores típicos de código (., -, /)
  return /^[0-9][0-9.\-/]*$/.test(str) && /[0-9]/.test(str)
}

/**
 * Mapeia as colunas de IBS/CBS no cabeçalho da planilha.
 * Cada papel pega a primeira coluna livre (não reivindicada por papel mais
 * específico) que case seus termos; retorna objeto vazio quando NENHUMA
 * coluna reconhecida é encontrada (o chamador trata como "arquivo sem
 * IBS/CBS" e mantém a saída anterior).
 */
export function mapearColunasIbsCbs(colunas: string[]): ColunasIbsCbs {
  const out: ColunasIbsCbs = {}
  const reivindicadas = new Set<string>()
  let totalReconhecidas = 0

  for (const papel of ORDEM_PRECEDENCIA) {
    const col = colunas.find((c) => {
      if (reivindicadas.has(c)) return false
      const limpo = normalizar(c)
      return TERMOS[papel].some((t) => limpo === normalizar(t) || limpo.includes(normalizar(t)))
    })
    if (col) {
      out[papel] = col
      reivindicadas.add(col)
      totalReconhecidas++
    }
  }

  if (totalReconhecidas === 0) return {}
  return out
}

/** Indica se a planilha tem alguma coluna de IBS/CBS reconhecível. */
export function planilhaTemColunasIbsCbs(colunas: string[]): boolean {
  return Object.keys(mapearColunasIbsCbs(colunas)).length > 0
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
  // "tem valor válido" ≠ "soma ≠ 0": +100 e -100 soma 0, mas a coluna TEM valor
  let temValorIbs = false
  let temValorCbs = false
  let temCreditoIbsCbs = false
  let temCreditoIbs = false
  let temCreditoCbs = false
  const cstSet = new Set<string>()
  const cClassTribSet = new Set<string>()

  for (const linha of linhas) {
    if (mapeamento.colIbs) {
      const v = paraNumero(linha[mapeamento.colIbs])
      if (v !== undefined) {
        ibsTotal += v
        temValorIbs = true
      }
    }
    if (mapeamento.colCbs) {
      const v = paraNumero(linha[mapeamento.colCbs])
      if (v !== undefined) {
        cbsTotal += v
        temValorCbs = true
      }
    }
    if (mapeamento.colCst) {
      const v = linha[mapeamento.colCst]
      // Só aceita códigos plausíveis — texto livre ("sem classe") é descartado
      if (ehCodigoPlausivel(v)) cstSet.add(String(v).trim())
    }
    if (mapeamento.colCClassTrib) {
      const v = linha[mapeamento.colCClassTrib]
      if (ehCodigoPlausivel(v)) cClassTribSet.add(String(v).trim())
    }
    if (mapeamento.colCreditoIbsCbs) {
      const v = paraNumero(linha[mapeamento.colCreditoIbsCbs])
      if (v !== undefined) {
        creditoIbsCbsTotal += v
        temCreditoIbsCbs = true
      }
    }
    if (mapeamento.colCreditoIbs) {
      const v = paraNumero(linha[mapeamento.colCreditoIbs])
      if (v !== undefined) {
        creditoIbsTotal += v
        temCreditoIbs = true
      }
    }
    if (mapeamento.colCreditoCbs) {
      const v = paraNumero(linha[mapeamento.colCreditoCbs])
      if (v !== undefined) {
        creditoCbsTotal += v
        temCreditoCbs = true
      }
    }
  }

  // Crédito: coluna combinada tem prioridade; sem ela, soma das separadas.
  // Grava mesmo quando a soma é zero, desde que haja algum valor válido.
  const creditoIbsCbsApurado = temCreditoIbsCbs
    ? arredondar(creditoIbsCbsTotal)
    : temCreditoIbs || temCreditoCbs
      ? arredondar(creditoIbsTotal + creditoCbsTotal)
      : undefined

  const resultado: CamposIbsCbsPlanilha = {}

  // Soma zero (ex.: +100 e -100) grava o campo como 0 — "valor zerado" é
  // diferente de "sem IBS na planilha" (coluna ausente ou sem valor válido).
  if (temValorIbs) resultado.ibsDestacado = normalizarZero(arredondar(ibsTotal))
  if (temValorCbs) resultado.cbsDestacado = normalizarZero(arredondar(cbsTotal))
  if (cstSet.size > 0) resultado.cstIbsCbsDetectados = Array.from(cstSet)
  if (cClassTribSet.size > 0) resultado.cClassTribDetectados = Array.from(cClassTribSet)
  if (creditoIbsCbsApurado !== undefined)
    resultado.creditoIbsCbsApurado = normalizarZero(creditoIbsCbsApurado)

  return resultado
}

/** Evita -0 e ruído de ponto flutuante: soma zero vira exatamente 0. */
function normalizarZero(v: number): number {
  return v === 0 ? 0 : v
}

function arredondar(v: number): number {
  return Math.round(v * 100) / 100
}
