/**
 * Testes unitários para o fluxo de cadastro no ModalCliente:
 * - Oferece botão 'Tornar Cliente Ativo' via action no toast de sucesso ao cadastrar novo cliente;
 * - Sem clicar, o cliente ativo permanece inalterado;
 * - Ao clicar no botão, dispara a seleção do recém-cadastrado no ClienteAtivoContext;
 * - Ao editar cliente existente, não exibe o botão 'Tornar Cliente Ativo' (apenas toast informativo).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import { ClienteAtivoProvider, useClienteAtivo } from '@/context/ClienteAtivoContext'
import type { Cliente } from '@/types/cliente'
import * as clientesService from '@/services/clientes'
import * as toastHook from '@/hooks/use-toast'

const clienteNovoCriado: Cliente = {
  id: 'cli_novo_99',
  user_id: 'usr_1',
  nome: 'NOVA EMPRESA EXEMPLO LTDA',
  cnpj_cpf: '33.444.555/0001-66',
  uf: 'SP',
  segmento: 'Comércio',
  regime_atual: 'Simples Nacional',
  email: 'contato@novaempresa.com.br',
  telefone: '11988887777',
  arquivado: false,
  created: '2026-02-01T00:00:00Z',
  updated: '2026-02-01T00:00:00Z',
}

describe('ModalCliente — Botão "Tornar Cliente Ativo" no toast pós-cadastro', () => {
  let toastMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    toastMock = vi.fn()
    vi.spyOn(toastHook, 'toast').mockImplementation(toastMock as any)
    vi.spyOn(clientesService, 'listarClientes').mockResolvedValue([])
    vi.spyOn(clientesService, 'criarCliente').mockResolvedValue(clienteNovoCriado)
    vi.spyOn(clientesService, 'atualizarCliente').mockResolvedValue({
      ...clienteNovoCriado,
      nome: 'EMPRESA ATUALIZADA LTDA',
    })
    vi.spyOn(clientesService, 'obterClientePorId').mockResolvedValue(clienteNovoCriado)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('ao cadastrar novo cliente, o toast recebe a action com rótulo "Tornar Cliente Ativo"', async () => {
    const onSalvoComSucesso = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ClienteAtivoProvider>
        <ModalCliente
          open={true}
          onOpenChange={onOpenChange}
          onSalvoComSucesso={onSalvoComSucesso}
        />
      </ClienteAtivoProvider>,
    )

    // Preenche campos obrigatórios
    const inputNome = screen.getByLabelText(/Razão Social \/ Nome do Cliente/i)
    const inputCnpj = screen.getByLabelText(/CNPJ \/ CPF/i)

    fireEvent.change(inputNome, { target: { value: 'NOVA EMPRESA EXEMPLO LTDA' } })
    fireEvent.change(inputCnpj, { target: { value: '33.444.555/0001-66' } })

    const botaoCadastrar = screen.getByRole('button', { name: /Cadastrar Cliente/i })
    fireEvent.click(botaoCadastrar)

    await waitFor(() => {
      expect(clientesService.criarCliente).toHaveBeenCalledTimes(1)
      expect(onSalvoComSucesso).toHaveBeenCalledWith(clienteNovoCriado)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    // Verifica que o toast de sucesso foi disparado com título, descrição e action
    expect(toastMock).toHaveBeenCalledTimes(1)
    const chamadaToast = toastMock.mock.calls[0][0]
    expect(chamadaToast.title).toBe('Cliente cadastrado')
    expect(chamadaToast.description).toContain('NOVA EMPRESA EXEMPLO LTDA')
    expect(chamadaToast.action).toBeDefined()

    // Renderiza a action para verificar se contém o botão com o texto esperado
    const { getByText } = render(chamadaToast.action)
    const botaoAction = getByText('Tornar Cliente Ativo')
    expect(botaoAction).toBeDefined()
  })

  it('ao clicar na action do toast, o cliente recém-cadastrado se torna o Cliente Ativo', async () => {
    let capturedClienteAtivoId: string | null = null

    function MonitorClienteAtivo() {
      const { clienteAtivoId } = useClienteAtivo()
      capturedClienteAtivoId = clienteAtivoId
      return <div data-testid="ativo-id">{clienteAtivoId || 'nenhum'}</div>
    }

    render(
      <ClienteAtivoProvider>
        <MonitorClienteAtivo />
        <ModalCliente open={true} onOpenChange={() => {}} onSalvoComSucesso={() => {}} />
      </ClienteAtivoProvider>,
    )

    expect(capturedClienteAtivoId).toBeNull()

    // Preenche e submete
    fireEvent.change(screen.getByLabelText(/Razão Social \/ Nome do Cliente/i), {
      target: { value: 'NOVA EMPRESA EXEMPLO LTDA' },
    })
    fireEvent.change(screen.getByLabelText(/CNPJ \/ CPF/i), {
      target: { value: '33.444.555/0001-66' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Cliente/i }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledTimes(1)
    })

    // Antes de clicar na action, o cliente ativo permanece inalterado (null)
    expect(capturedClienteAtivoId).toBeNull()

    // Clica no botão "Tornar Cliente Ativo" da action do toast
    const actionElement = toastMock.mock.calls[0][0].action
    const { getByRole } = render(actionElement)
    const botaoTornarAtivo = getByRole('button', { name: /Tornar Cliente Ativo/i })

    fireEvent.click(botaoTornarAtivo)

    // Agora o cliente recém-cadastrado deve estar selecionado como Cliente Ativo
    await waitFor(() => {
      expect(capturedClienteAtivoId).toBe('cli_novo_99')
    })

    // E deve ter sido disparado o toast da troca de Cliente Ativo (v0.0.332)
    expect(toastMock).toHaveBeenCalledTimes(2)
    const chamadaSegundoToast = toastMock.mock.calls[1][0]
    expect(chamadaSegundoToast.title).toBe('Cliente Ativo alterado')
    expect(chamadaSegundoToast.description).toContain('NOVA EMPRESA EXEMPLO LTDA')
  })

  it('ao editar cliente existente, não inclui action de "Tornar Cliente Ativo"', async () => {
    render(
      <ClienteAtivoProvider>
        <ModalCliente
          open={true}
          onOpenChange={() => {}}
          clienteParaEditar={clienteNovoCriado}
          onSalvoComSucesso={() => {}}
        />
      </ClienteAtivoProvider>,
    )

    const botaoSalvar = screen.getByRole('button', { name: /Salvar Alterações/i })
    fireEvent.click(botaoSalvar)

    await waitFor(() => {
      expect(clientesService.atualizarCliente).toHaveBeenCalledTimes(1)
    })

    expect(toastMock).toHaveBeenCalledTimes(1)
    const chamadaToast = toastMock.mock.calls[0][0]
    expect(chamadaToast.title).toBe('Cliente atualizado')
    expect(chamadaToast.action).toBeUndefined()
  })
})
