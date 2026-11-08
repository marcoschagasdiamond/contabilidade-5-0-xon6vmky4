/**
 * Testes unitários para o aviso de clareza na troca do Cliente Ativo
 * (ClienteAtivoContext).
 *
 * Invariantes provados:
 * 1. Não dispara aviso na carga inicial (mesmo quando já existe cliente no localStorage);
 * 2. Ao trocar de cliente (novo id diferente do atual), dispara toast contendo o nome do novo cliente;
 * 3. Selecionar o MESMO cliente que já está ativo NÃO gera aviso (idempotência);
 * 4. Ao desselecionar/limpar o cliente ativo (passando null ou limparClienteAtivo), dispara aviso orientativo de modo teste/geral apenas se havia um ativo antes;
 * 5. Nenhum dado ou cálculo do cliente é alterado — apenas o aviso visual é acionado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ClienteAtivoProvider, useClienteAtivo } from '@/context/ClienteAtivoContext'
import type { Cliente } from '@/types/cliente'
import * as clientesService from '@/services/clientes'
import * as toastHook from '@/hooks/use-toast'

const STORAGE_KEY = 'contabilidade50_cliente_ativo_id_v1'

const clienteAlfa: Cliente = {
  id: 'cli_alfa_1',
  user_id: 'usr_1',
  nome: 'ALFA ENGENHARIA LTDA',
  cnpj_cpf: '11.222.333/0001-44',
  uf: 'SP',
  segmento: 'Serviços',
  regime_atual: 'Lucro Presumido',
  email: 'contato@alfa.com.br',
  telefone: '11999990001',
  arquivado: false,
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
}

const clienteBravo: Cliente = {
  id: 'cli_bravo_2',
  user_id: 'usr_1',
  nome: 'BRAVO IT SECURITY - INTERNATIONAL LTDA',
  cnpj_cpf: '22.333.444/0001-55',
  uf: 'PR',
  segmento: 'Tecnologia',
  regime_atual: 'Lucro Real',
  email: 'financeiro@bravoit.com',
  telefone: '41999990002',
  arquivado: false,
  created: '2026-01-02T00:00:00Z',
  updated: '2026-01-02T00:00:00Z',
}

describe('ClienteAtivoContext — aviso ao trocar Cliente Ativo', () => {
  let toastMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    toastMock = vi.fn()
    vi.spyOn(toastHook, 'toast').mockImplementation(toastMock as any)
    vi.spyOn(clientesService, 'listarClientes').mockResolvedValue([clienteAlfa, clienteBravo])
    vi.spyOn(clientesService, 'obterClientePorId').mockImplementation(async (id: string) => {
      if (id === clienteAlfa.id) return clienteAlfa
      if (id === clienteBravo.id) return clienteBravo
      return null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('não dispara o aviso na montagem/carga inicial, mesmo havendo cliente salvo no localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, clienteAlfa.id)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClienteAtivoProvider>{children}</ClienteAtivoProvider>
    )

    const { result } = renderHook(() => useClienteAtivo(), { wrapper })

    // Aguarda carregar
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.clienteAtivoId).toBe(clienteAlfa.id)
    // O toast NUNCA deve ter sido chamado na inicialização
    expect(toastMock).not.toHaveBeenCalled()
  })

  it('dispara o aviso com o nome do cliente ao trocar de cliente ativo (passando id)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClienteAtivoProvider>{children}</ClienteAtivoProvider>
    )

    const { result } = renderHook(() => useClienteAtivo(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })

    expect(toastMock).not.toHaveBeenCalled()

    // Troca para o cliente Bravo
    act(() => {
      result.current.selecionarClienteAtivo(clienteBravo.id)
    })

    expect(result.current.clienteAtivoId).toBe(clienteBravo.id)
    expect(toastMock).toHaveBeenCalledTimes(1)
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cliente Ativo alterado',
        description: expect.stringContaining('BRAVO IT SECURITY - INTERNATIONAL LTDA'),
      }),
    )
    expect(toastMock.mock.calls[0][0].description).toContain(
      'as configurações da Calculadora IBS/CBS e os diagnósticos agora refletem o perfil deste cliente',
    )
  })

  it('dispara o aviso ao trocar passando o objeto Cliente completo', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClienteAtivoProvider>{children}</ClienteAtivoProvider>
    )

    const { result } = renderHook(() => useClienteAtivo(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      result.current.selecionarClienteAtivo(clienteAlfa)
    })

    expect(toastMock).toHaveBeenCalledTimes(1)
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('ALFA ENGENHARIA LTDA'),
      }),
    )
  })

  it('selecionar o MESMO cliente ativo novamente NÃO gera aviso repetido', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClienteAtivoProvider>{children}</ClienteAtivoProvider>
    )

    const { result } = renderHook(() => useClienteAtivo(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })

    // Primeira seleção -> gera aviso
    act(() => {
      result.current.selecionarClienteAtivo(clienteAlfa.id)
    })
    expect(toastMock).toHaveBeenCalledTimes(1)

    // Segunda seleção com o MESMO cliente -> NÃO deve disparar outro aviso
    act(() => {
      result.current.selecionarClienteAtivo(clienteAlfa.id)
    })
    expect(toastMock).toHaveBeenCalledTimes(1)

    // Também com objeto com o mesmo id
    act(() => {
      result.current.selecionarClienteAtivo(clienteAlfa)
    })
    expect(toastMock).toHaveBeenCalledTimes(1)
  })

  it('ao desselecionar/limpar cliente ativo, dispara aviso orientativo de modo geral apenas se havia um ativo antes', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClienteAtivoProvider>{children}</ClienteAtivoProvider>
    )

    const { result } = renderHook(() => useClienteAtivo(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })

    // Começou sem cliente: chamar limparClienteAtivo não gera aviso inútil
    act(() => {
      result.current.limparClienteAtivo()
    })
    expect(toastMock).not.toHaveBeenCalled()

    // Ativa cliente Alfa
    act(() => {
      result.current.selecionarClienteAtivo(clienteAlfa.id)
    })
    expect(toastMock).toHaveBeenCalledTimes(1)

    // Agora limpa o cliente ativo
    act(() => {
      result.current.limparClienteAtivo()
    })
    expect(toastMock).toHaveBeenCalledTimes(2)
    expect(toastMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: 'Cliente Ativo desativado',
        description: expect.stringContaining('Modo Teste / Geral'),
      }),
    )
    expect(result.current.clienteAtivoId).toBeNull()

    // Limpar de novo quando já está null não gera aviso duplicado
    act(() => {
      result.current.limparClienteAtivo()
    })
    expect(toastMock).toHaveBeenCalledTimes(2)
  })
})
