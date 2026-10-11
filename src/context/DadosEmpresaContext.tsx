import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  DadosEmpresaPerfil,
  DADOS_EMPRESA_PADRAO,
  carregarDadosEmpresa,
  salvarDadosEmpresa as salvarNoStorage,
  limparDadosEmpresa as limparDoStorage,
  existeDadosEmpresaSalvos,
  STORAGE_EVENT,
} from '@/types/dadosEmpresa'

interface DadosEmpresaContextType {
  dadosEmpresa: DadosEmpresaPerfil
  temDadosSalvos: boolean
  salvar: (novos: Partial<DadosEmpresaPerfil>) => void
  restaurarPadrao: () => void
  limpar: () => void
}

const DadosEmpresaContext = createContext<DadosEmpresaContextType | undefined>(undefined)

export function DadosEmpresaProvider({ children }: { children: React.ReactNode }) {
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresaPerfil>(() => carregarDadosEmpresa())
  const [temDadosSalvos, setTemDadosSalvos] = useState<boolean>(() => existeDadosEmpresaSalvos())

  const sincronizar = useCallback(() => {
    setDadosEmpresa(carregarDadosEmpresa())
    setTemDadosSalvos(existeDadosEmpresaSalvos())
  }, [])

  useEffect(() => {
    sincronizar()
    const handleCustomEvent = () => sincronizar()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'contabilidade5_dados_empresa') {
        sincronizar()
      }
    }

    window.addEventListener(STORAGE_EVENT, handleCustomEvent)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleCustomEvent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [sincronizar])

  const salvar = useCallback((novos: Partial<DadosEmpresaPerfil>) => {
    const atualizado = salvarNoStorage(novos)
    setDadosEmpresa(atualizado)
    setTemDadosSalvos(true)
  }, [])

  const restaurarPadrao = useCallback(() => {
    const padrao = salvarNoStorage(DADOS_EMPRESA_PADRAO)
    setDadosEmpresa(padrao)
    setTemDadosSalvos(true)
  }, [])

  const limpar = useCallback(() => {
    limparDoStorage()
    setDadosEmpresa(DADOS_EMPRESA_PADRAO)
    setTemDadosSalvos(false)
  }, [])

  return (
    <DadosEmpresaContext.Provider
      value={{
        dadosEmpresa,
        temDadosSalvos,
        salvar,
        restaurarPadrao,
        limpar,
      }}
    >
      {children}
    </DadosEmpresaContext.Provider>
  )
}

export function useDadosEmpresa() {
  const context = useContext(DadosEmpresaContext)
  if (!context) {
    // Fallback gracioso se renderizado fora do Provider
    const dados = carregarDadosEmpresa()
    return {
      dadosEmpresa: dados,
      temDadosSalvos: existeDadosEmpresaSalvos(),
      salvar: salvarNoStorage,
      restaurarPadrao: () => salvarNoStorage(DADOS_EMPRESA_PADRAO),
      limpar: limparDoStorage,
    }
  }
  return context
}
