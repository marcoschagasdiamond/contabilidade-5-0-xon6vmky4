import { useEffect, useRef, useState, useCallback } from 'react'
import { EVENTO_FONTE_MESTRA } from '@/lib/fonteMestra'
import { carregarDadosEmpresa, DadosEmpresaPerfil } from '@/types/dadosEmpresa'

/**
 * Assina o evento da fonte mestra (Dados da Empresa salvos) e/ou provê
 * os dados cadastrais mais recentes de forma segura.
 *
 * Suporta duas formas de uso:
 * 1. `const dadosMestres = useFonteMestraSync()` -> retorna DadosEmpresaPerfil atualizado
 * 2. `useFonteMestraSync(ativo, () => callback())` -> escuta eventos condicionalmente
 *
 * Os callbacks são guardados em ref para nunca re-assinar nem disparar
 * loops de sincronização (padrão adotado neste projeto após problemas de
 * "Maximum update depth exceeded").
 */
export function useFonteMestraSync(
  arg1?: boolean | (() => void),
  arg2?: () => void,
): DadosEmpresaPerfil {
  const [dadosMestres, setDadosMestres] = useState<DadosEmpresaPerfil>(() => carregarDadosEmpresa())

  const ativo = typeof arg1 === 'boolean' ? arg1 : true
  const aoAtualizarMestre = typeof arg1 === 'function' ? arg1 : arg2

  const cbRef = useRef(aoAtualizarMestre)
  cbRef.current = aoAtualizarMestre

  const atualizar = useCallback(() => {
    setDadosMestres(carregarDadosEmpresa())
    if (cbRef.current) {
      cbRef.current()
    }
  }, [])

  useEffect(() => {
    if (!ativo) return
    const handler = () => atualizar()
    window.addEventListener(EVENTO_FONTE_MESTRA, handler)
    window.addEventListener('contabilidade5_dados_empresa_updated', handler)
    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener(EVENTO_FONTE_MESTRA, handler)
      window.removeEventListener('contabilidade5_dados_empresa_updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [ativo, atualizar])

  return dadosMestres
}

export default useFonteMestraSync
