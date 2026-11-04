import { useEffect, useRef } from 'react'
import { EVENTO_FONTE_MESTRA } from '@/lib/fonteMestra'

/**
 * Assina o evento da fonte mestra (Dados da Empresa salvos).
 * O callback é guardado em ref — o efeito não depende dele, então nunca
 * re-assina nem dispara loops de sincronização (padrão useCallback/refs
 * adotado neste projeto após os laços "Maximum update depth").
 *
 * O callback é chamado SOMENTE quando o cadastro mestre é salvo; o módulo
 * decide internamente se aplica (quando não há override manual).
 */
export function useFonteMestraSync(ativo: boolean, aoAtualizarMestre: () => void) {
  const cbRef = useRef(aoAtualizarMestre)
  cbRef.current = aoAtualizarMestre

  useEffect(() => {
    if (!ativo) return
    const handler = () => cbRef.current()
    window.addEventListener(EVENTO_FONTE_MESTRA, handler)
    return () => window.removeEventListener(EVENTO_FONTE_MESTRA, handler)
  }, [ativo])
}
