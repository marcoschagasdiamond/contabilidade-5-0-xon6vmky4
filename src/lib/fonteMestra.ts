// Camada da FONTE MESTRA: Dados da Empresa (/dados-empresa) é o cadastro mestre
// que alimenta Calculadora IBS/CBS, Recuperador de Créditos e Diagnóstico 360°.
// Cada módulo pode derivar dados localmente (override manual) SEM escrever de
// volta na mestra — a sincronização é só leitura (evento), nunca escrita.
// Isso evita os laços "Maximum update depth" já vistos neste projeto.

export const EVENTO_FONTE_MESTRA = 'c50:fonte-mestra-atualizada'
export const FONTE_MESTRA_EVENTO = EVENTO_FONTE_MESTRA

/** Disparado APENAS pela página Dados da Empresa ao salvar o cadastro mestre. */
export function notificarFonteMestraAtualizada() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENTO_FONTE_MESTRA))
}

/**
 * Compara valores ou campos espelhados entre o estado atual do módulo e a nova versão.
 * Suporta comparação de valores individuais (2 argumentos) ou de campos de um objeto (3 argumentos).
 * Retorna true quando algum campo ou valor diverge (ou seja, houve alteração manual).
 */
export function camposDivergem(antes: unknown, depois: unknown, campos?: string[]): boolean {
  if (Array.isArray(campos) && campos.length > 0) {
    const objA = (antes && typeof antes === 'object' ? antes : {}) as Record<string, unknown>
    const objD = (depois && typeof depois === 'object' ? depois : {}) as Record<string, unknown>
    return campos.some((campo) => camposDivergem(objA[campo], objD[campo]))
  }

  // Normalização de vazios (null, undefined, '')
  const normA = antes === null || antes === undefined || antes === '' ? null : antes
  const normD = depois === null || depois === undefined || depois === '' ? null : depois

  if (normA === null && normD === null) return false
  if (normA === null || normD === null) return true

  // Comparação numérica exata
  if (typeof normA === 'number' && typeof normD === 'number') {
    return normA !== normD
  }

  return JSON.stringify(normA) !== JSON.stringify(normD)
}
