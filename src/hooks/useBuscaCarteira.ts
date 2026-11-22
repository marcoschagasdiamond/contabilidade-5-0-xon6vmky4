import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Devolve o valor do estado após o debounce (300ms padrão). O valor imediato
 * continua disponível em `valorImediato` para exibição no input.
 */
export function useDebounce<T>(valor: T, atrasoMs: number = 300): T {
  const [valorDebounced, setValorDebounced] = useState(valor)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setValorDebounced(valor), atrasoMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [valor, atrasoMs])

  return valorDebounced
}

/**
 * Estado simples para o campo de busca da carteira: valor digitado (imediato,
 * mostra no input) + valor efetivo (debounced, dispara a busca server-side).
 */
export function useBuscaCarteira() {
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca, 300)

  return { busca, setBusca, buscaDebounced }
}
