/**
 * Ajuste da alíquota média efetiva do Simples Nacional usada no crédito presumido
 * de compras de optantes do Simples (LC 214/2025, Anexos XVIII–XXII; LC 123/2006 art. 23).
 *
 * A estimativa padrão continua vinda de obterAliquotasCreditoPorAno (src/lib/calculoFornecedores.ts).
 * Esta camada permite ao usuário SUBSTITUIR a estimativa por um valor único (%) ou por uma
 * tabela por ano (%) configurada no Módulo 1 (Configurações). Nenhuma fórmula muda:
 * apenas a fonte do valor (ajuste com fallback para a estimativa padrão).
 */

import { obterAliquotasCreditoPorAno } from './calculoFornecedores'
import type { AnoBaseSimulacao } from './reformaTributaria'

/** Texto oficial de fundamento exibido no card do Cenário Ponderado e na nota de rodapé. */
export const FUNDAMENTO_ALIQUOTA_SIMPLES_MEDIA =
  'estimativa da alíquota média efetiva do DAS (LC 214/2025, crédito presumido de compras de optantes do Simples — Anexos XVIII–XXII; LC 123/2006 art. 23) — ajustável no Módulo 1'

export interface AjusteAliquotaSimplesMedia {
  /** Valor único (%) aplicado a todos os anos. null/undefined/0 = usar estimativa padrão. */
  valorUnico?: number | null
  /** Tabela por ano (%) — tem precedência sobre o valor único. Chaves: '2026'...'2033'/'2040'. */
  porAno?: Record<string, number> | null
}

/**
 * Retorna a alíquota média do Simples (em DECIMAL, ex.: 0.045 = 4,5%) para o ano,
 * priorizando: ajuste por ano > valor único > estimativa padrão de obterAliquotasCreditoPorAno.
 */
export function obterAliquotaSimplesMediaAjustada(
  ano: AnoBaseSimulacao,
  ajuste?: AjusteAliquotaSimplesMedia | null,
): number {
  const padrao = obterAliquotasCreditoPorAno(ano).aliquotaSimplesMedia

  const normalizar = (v: unknown): number | null => {
    const n = typeof v === 'string' ? Number(v) : (v as number)
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return null
    return Math.min(100, Math.max(0, n))
  }

  const porAno = normalizar(ajuste?.porAno?.[String(ano)])
  if (porAno != null) return porAno / 100

  const unico = normalizar(ajuste?.valorUnico)
  if (unico != null) return unico / 100

  return padrao
}

/** Igual a obterAliquotaSimplesMediaAjustada, mas em % (ex.: 4.5 = 4,5%) — formato que os consumidores usam. */
export function obterAliquotaSimplesMediaEfectivaEm(
  ano: AnoBaseSimulacao,
  ajuste?: AjusteAliquotaSimplesMedia | null,
): number {
  return obterAliquotaSimplesMediaAjustada(ano, ajuste) * 100
}

/** Indica se o usuário ajustou a alíquota (para sinalizar na UI, ex.: badge "ajustado"). */
export function temAjusteAliquotaSimplesMedia(ajuste?: AjusteAliquotaSimplesMedia | null): boolean {
  const unico = ajuste?.valorUnico
  const porAno = ajuste?.porAno
  return (
    (typeof unico === 'number' && Number.isFinite(unico) && unico > 0) ||
    (!!porAno && Object.values(porAno).some((v) => typeof v === 'number' && v > 0))
  )
}
