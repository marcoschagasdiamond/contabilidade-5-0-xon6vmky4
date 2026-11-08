import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { Cliente } from '@/types/cliente'
import { listarClientes, obterClientePorId } from '@/services/clientes'
import { toast } from '@/hooks/use-toast'

const STORAGE_CLIENTE_ATIVO_ID_KEY = 'contabilidade50_cliente_ativo_id_v1'

interface ClienteAtivoContextType {
  clienteAtivo: Cliente | null
  clienteAtivoId: string | null
  clientes: Cliente[]
  carregando: boolean
  selecionarClienteAtivo: (clienteOuId: Cliente | string | null) => void
  adicionarCliente: (cliente: Cliente) => void
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

  // Ref para rastrear o clienteAtivoId atual de forma síncrona dentro de selecionarClienteAtivo
  const clienteAtivoIdRef = useRef<string | null>(clienteAtivoId)
  useEffect(() => {
    clienteAtivoIdRef.current = clienteAtivoId
  }, [clienteAtivoId])

  // Ref para a lista em memória de clientes, permitindo resolver o nome imediatamente
  const clientesRef = useRef<Cliente[]>(clientes)
  useEffect(() => {
    clientesRef.current = clientes
  }, [clientes])

  const dispararAvisoTrocaCliente = useCallback((nomeCliente: string) => {
    const nomeExibicao = (nomeCliente || '').trim() || 'cliente selecionado'
    toast({
      title: 'Cliente Ativo alterado',
      description: `Cliente Ativo alterado para ${nomeExibicao} — as configurações da Calculadora IBS/CBS e os diagnósticos agora refletem o perfil deste cliente.`,
      duration: 5000,
    })
  }, [])

  const selecionarClienteAtivo = useCallback(
    (clienteOuId: Cliente | string | null) => {
      if (!clienteOuId) {
        const idAnterior = clienteAtivoIdRef.current
        if (idAnterior === null) {
          // Já não havia cliente ativo: nenhuma ação nem aviso duplicado
          return
        }
        clienteAtivoIdRef.current = null
        setClienteAtivoId(null)
        try {
          localStorage.removeItem(STORAGE_CLIENTE_ATIVO_ID_KEY)
        } catch {
          /* intentionally ignored */
        }
        toast({
          title: 'Cliente Ativo desativado',
          description:
            'Nenhum cliente ativo selecionado — a Calculadora IBS/CBS e os diagnósticos agora operam em Modo Teste / Geral.',
          duration: 4000,
        })
        return
      }

      const id = typeof clienteOuId === 'string' ? clienteOuId : clienteOuId.id
      const idAnterior = clienteAtivoIdRef.current

      // Regra: se o usuário selecionou exatamente o mesmo cliente que já está ativo,
      // não faz nada e não gera aviso novamente.
      if (idAnterior === id) {
        return
      }

      clienteAtivoIdRef.current = id
      setClienteAtivoId(id)
      try {
        localStorage.setItem(STORAGE_CLIENTE_ATIVO_ID_KEY, id)
      } catch {
        /* intentionally ignored */
      }

      // Resolução do nome do novo cliente ativo:
      // 1) Se o objeto Cliente já veio como parâmetro com a propriedade nome
      if (typeof clienteOuId === 'object' && clienteOuId.nome) {
        dispararAvisoTrocaCliente(clienteOuId.nome)
        return
      }

      // 2) Se o cliente está na lista em memória
      const clienteEncontrado = clientesRef.current.find((c) => c.id === id)
      if (clienteEncontrado && clienteEncontrado.nome) {
        dispararAvisoTrocaCliente(clienteEncontrado.nome)
        return
      }

      // 3) Se não estava na memória (ex.: recém-criado ou seleção direta por ID),
      // busca assincronamente pelo serviço e dispara o aviso com o nome real
      obterClientePorId(id)
        .then((c) => {
          if (clienteAtivoIdRef.current === id) {
            dispararAvisoTrocaCliente(c?.nome || 'cliente selecionado')
          }
        })
        .catch(() => {
          if (clienteAtivoIdRef.current === id) {
            dispararAvisoTrocaCliente('cliente selecionado')
          }
        })
    },
    [dispararAvisoTrocaCliente],
  )

  // Insere (ou atualiza) um cliente na lista imediatamente, sem esperar o
  // recarregamento do banco — evita janelas em que clienteAtivo fica null
  // logo após criar um cliente novo.
  const adicionarCliente = useCallback((cliente: Cliente) => {
    setClientes((atual) => {
      const jaExiste = atual.some((c) => c.id === cliente.id)
      return jaExiste ? atual.map((c) => (c.id === cliente.id ? cliente : c)) : [cliente, ...atual]
    })
  }, [])

  const limparClienteAtivo = useCallback(() => {
    selecionarClienteAtivo(null)
  }, [selecionarClienteAtivo])

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
        adicionarCliente,
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
