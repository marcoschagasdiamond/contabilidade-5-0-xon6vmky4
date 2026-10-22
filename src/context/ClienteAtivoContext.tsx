import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Cliente } from '@/types/cliente'
import { listarClientes } from '@/services/clientes'

const STORAGE_CLIENTE_ATIVO_ID_KEY = 'contabilidade50_cliente_ativo_id_v1'

interface ClienteAtivoContextType {
  clienteAtivo: Cliente | null
  clienteAtivoId: string | null
  clientes: Cliente[]
  carregando: boolean
  selecionarClienteAtivo: (clienteOuId: Cliente | string | null) => void
  limparClienteAtivo: () => void
  recarregarClientes: () => Promise<void>
}

const ClienteAtivoContext = createContext<ClienteAtivoContextType | undefined>(undefined)

export function ClienteAtivoProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [clienteAtivoId, setClienteAtivoId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_CLIENTE_ATIVO_ID_KEY) || null
    } catch {
      return null
    }
  })

  const recarregarClientes = useCallback(async () => {
    try {
      setCarregando(true)
      const lista = await listarClientes()
      setClientes(lista)
    } catch (err) {
      console.error('Erro ao recarregar clientes:', err)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregarClientes()
  }, [recarregarClientes])

  const selecionarClienteAtivo = useCallback((clienteOuId: Cliente | string | null) => {
    if (!clienteOuId) {
      setClienteAtivoId(null)
      try {
        localStorage.removeItem(STORAGE_CLIENTE_ATIVO_ID_KEY)
      } catch {
        /* intentionally ignored */
      }
      return
    }

    const id = typeof clienteOuId === 'string' ? clienteOuId : clienteOuId.id
    setClienteAtivoId(id)
    try {
      localStorage.setItem(STORAGE_CLIENTE_ATIVO_ID_KEY, id)
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const limparClienteAtivo = useCallback(() => {
    setClienteAtivoId(null)
    try {
      localStorage.removeItem(STORAGE_CLIENTE_ATIVO_ID_KEY)
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const clienteAtivo = React.useMemo(() => {
    if (!clienteAtivoId) return null
    return clientes.find((c) => c.id === clienteAtivoId) || null
  }, [clientes, clienteAtivoId])

  return (
    <ClienteAtivoContext.Provider
      value={{
        clienteAtivo,
        clienteAtivoId,
        clientes,
        carregando,
        selecionarClienteAtivo,
        limparClienteAtivo,
        recarregarClientes,
      }}
    >
      {children}
    </ClienteAtivoContext.Provider>
  )
}

export function useClienteAtivo() {
  const context = useContext(ClienteAtivoContext)
  if (!context) {
    throw new Error('useClienteAtivo deve ser utilizado dentro de um ClienteAtivoProvider')
  }
  return context
}
