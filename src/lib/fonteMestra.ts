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
 * Compara campos espelhados entre o estado atual do módulo e a nova versão.
 * Retorna true quando algum campo listado diverge (ou seja, houve alteração
 * manual nos dados que vêm do cadastro do cliente).
 */
export function camposDivergem(
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
  campos: string[],
): boolean {
  return campos.some((campo) => {
    const valorA = (antes as Record<string, unknown>)[campo]
    const valorD = (depois as Record<string, unknown>)[campo]
    return JSON.stringify(valorA ?? null) !== JSON.stringify(valorD ?? null)
  })
}
