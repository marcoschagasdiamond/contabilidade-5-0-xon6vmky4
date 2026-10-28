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
import { useAuth } from './AuthContext'
import {
  getClienteEmpresaPorUsuario,
  salvarClienteEmpresaNoBanco,
  recordToPerfil,
} from '@/services/clientesEmpresas'

interface DadosEmpresaContextType {
  dadosEmpresa: DadosEmpresaPerfil
  temDadosSalvos: boolean
  salvoNoBanco: boolean
  isSalvando: boolean
  salvar: (novos: Partial<DadosEmpresaPerfil>) => Promise<DadosEmpresaPerfil>
  restaurarPadrao: () => void
  limpar: () => void
}

const DadosEmpresaContext = createContext<DadosEmpresaContextType | undefined>(undefined)

export function DadosEmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresaPerfil>(() =>
    isAuthenticated ? carregarDadosEmpresa() : DADOS_EMPRESA_PADRAO,
  )
  const [temDadosSalvos, setTemDadosSalvos] = useState<boolean>(() =>
    isAuthenticated ? existeDadosEmpresaSalvos() : false,
  )
  const [salvoNoBanco, setSalvoNoBanco] = useState(false)
  const [isSalvando, setIsSalvando] = useState(false)

  const sincronizar = useCallback(() => {
    if (!isAuthenticated) {
      setDadosEmpresa(DADOS_EMPRESA_PADRAO)
      setTemDadosSalvos(false)
      setSalvoNoBanco(false)
      return
    }
    setDadosEmpresa(carregarDadosEmpresa())
    setTemDadosSalvos(existeDadosEmpresaSalvos())
  }, [isAuthenticated])

  // Ao autenticar: busca dados do banco ou migra localStorage para o banco se ainda não existir
  useEffect(() => {
    let cancelado = false

    async function sincronizarComBanco() {
      if (!isAuthenticated || !user?.id) {
        setSalvoNoBanco(false)
        setDadosEmpresa(DADOS_EMPRESA_PADRAO)
        setTemDadosSalvos(false)
        return
      }

      try {
        const registroBanco = await getClienteEmpresaPorUsuario(user.id)
        if (cancelado) return

        if (registroBanco) {
          // Registro já existe no banco: atualiza localStorage e estado
          const perfilDoBanco = recordToPerfil(registroBanco)
          salvarNoStorage(perfilDoBanco)
          setDadosEmpresa(perfilDoBanco)
          const temDadosValidos =
            Boolean(perfilDoBanco.nomeEmpresa?.trim()) && Boolean(perfilDoBanco.cnpj?.trim())
          setTemDadosSalvos(temDadosValidos || existeDadosEmpresaSalvos())
          setSalvoNoBanco(true)
        } else {
          // Usuário autenticado mas sem registro no banco ainda:
          // Se já preencheu os dados no navegador, sincroniza para a conta
          if (existeDadosEmpresaSalvos()) {
            const dadosAtuais = carregarDadosEmpresa()
            const dadosCompletos: DadosEmpresaPerfil = {
              ...dadosAtuais,
              email: dadosAtuais.email || user.email || '',
              nomeContato: dadosAtuais.nomeContato || (user as any).name || '',
            }
            const salvo = await salvarClienteEmpresaNoBanco(dadosCompletos, user.id)
            if (cancelado) return
            const perfilSalvo = recordToPerfil(salvo)
            salvarNoStorage(perfilSalvo)
            setDadosEmpresa(perfilSalvo)
            setTemDadosSalvos(true)
            setSalvoNoBanco(true)
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar dados com o banco:', err)
      }
    }

    sincronizarComBanco()

    return () => {
      cancelado = true
    }
  }, [isAuthenticated, user?.id, user?.email])

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

  const salvar = useCallback(
    async (novos: Partial<DadosEmpresaPerfil>): Promise<DadosEmpresaPerfil> => {
      setIsSalvando(true)
      // 1. Salva imediatamente no localStorage (cache/offline rápido)
      const atualizado = salvarNoStorage(novos)
      setDadosEmpresa(atualizado)
      setTemDadosSalvos(true)

      // 2. Se autenticado, salva no banco vinculado ao usuário
      if (user?.id) {
        try {
          const rec = await salvarClienteEmpresaNoBanco(atualizado, user.id)
          const perfilPersistido = recordToPerfil(rec)
          setDadosEmpresa(perfilPersistido)
          salvarNoStorage(perfilPersistido)
          setSalvoNoBanco(true)
          setIsSalvando(false)
          return perfilPersistido
        } catch (err) {
          console.error('Erro ao salvar no banco:', err)
          setIsSalvando(false)
          return atualizado
        }
      }

      setIsSalvando(false)
      return atualizado
    },
    [user?.id],
  )

  const restaurarPadrao = useCallback(() => {
    const padrao = salvarNoStorage(DADOS_EMPRESA_PADRAO)
    setDadosEmpresa(padrao)
    setTemDadosSalvos(true)
    if (user?.id) {
      salvarClienteEmpresaNoBanco(padrao, user.id).catch((err) =>
        console.warn('Falha ao restaurar padrão no banco:', err),
      )
    }
  }, [user?.id])

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
        salvoNoBanco,
        isSalvando,
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
    const dados = carregarDadosEmpresa()
    return {
      dadosEmpresa: dados,
      temDadosSalvos: existeDadosEmpresaSalvos(),
      salvoNoBanco: false,
      isSalvando: false,
      salvar: async (novos: Partial<DadosEmpresaPerfil>) => salvarNoStorage(novos),
      restaurarPadrao: () => salvarNoStorage(DADOS_EMPRESA_PADRAO),
      limpar: limparDoStorage,
    }
  }
  return context
}
