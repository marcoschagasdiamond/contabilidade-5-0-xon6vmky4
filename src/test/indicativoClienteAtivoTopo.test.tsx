import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { IndicativoClienteAtivoTopo } from '@/components/dadosEmpresa/IndicativoClienteAtivoTopo'

// Mocks dos contextos e hooks
const mockUseAuth = vi.fn()
const mockUseClienteAtivo = vi.fn()
const mockUseProgressoTrilha = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/context/ClienteAtivoContext', () => ({
  useClienteAtivo: () => mockUseClienteAtivo(),
}))

vi.mock('@/hooks/useProgressoTrilha', () => ({
  useProgressoTrilha: () => mockUseProgressoTrilha(),
}))

describe('IndicativoClienteAtivoTopo Tooltips e Comportamento', () => {
  it('renderiza para analista/master com botões, aria-labels informativos e tooltips', () => {
    mockUseAuth.mockReturnValue({
      isMaster: true,
      isAdmin: false,
      isEmpresario: false,
      nivelAcesso: 'master',
    })

    mockUseClienteAtivo.mockReturnValue({
      clienteAtivo: {
        id: 'c1',
        nome: 'BRAVO IT SECURITY LTDA',
        cnpj_cpf: '12.345.678/0001-90',
        uf: 'SP',
        regime_atual: 'Lucro Presumido',
        segmento: 'Tecnologia',
      },
    })

    mockUseProgressoTrilha.mockReturnValue({
      etapa00: { estado: 'concluida' },
      etapa01: { estado: 'concluida' },
      etapa02: { estado: 'concluida' },
      etapa03: { estado: 'pendente' },
      etapa04: { estado: 'nao_iniciada' },
      etapa05: { estado: 'nao_iniciada' },
      etapa06: { estado: 'nao_iniciada' },
      algumaEtapaIniciada: true,
    })

    render(
      <MemoryRouter>
        <IndicativoClienteAtivoTopo onCadastrarNovaEmpresa={() => {}} />
      </MemoryRouter>,
    )

    // Nome e dados do cliente ativo
    expect(screen.getByText('BRAVO IT SECURITY LTDA')).toBeDefined()
    expect(screen.getByText('Cliente Ativo')).toBeDefined()
    expect(screen.getByText('Cadastrar Outra Empresa')).toBeDefined()

    // Botão Continuar Análise com aria-label rico informando a etapa pendente
    const botaoContinuar = screen.getByRole('button', { name: /Continuar Análise/i })
    expect(botaoContinuar).toBeDefined()
    expect(botaoContinuar.getAttribute('aria-label')).toContain('Transição Fiscal 2026–2033')

    // Botão de ajuda Painel Analista & Master com aria-label
    const botaoAjudaMaster = screen.getByRole('button', {
      name: /Painel do Analista & Master/i,
    })
    expect(botaoAjudaMaster).toBeDefined()
  })

  it('exibe aria-label explicativo de cliente ativo quando nenhum cliente está selecionado', () => {
    mockUseAuth.mockReturnValue({
      isMaster: false,
      isAdmin: false,
      isEmpresario: false,
      nivelAcesso: 'analista',
    })

    mockUseClienteAtivo.mockReturnValue({
      clienteAtivo: null,
    })

    mockUseProgressoTrilha.mockReturnValue({
      etapa00: { estado: 'nao_iniciada' },
      etapa01: { estado: 'nao_iniciada' },
      etapa02: { estado: 'nao_iniciada' },
      etapa03: { estado: 'nao_iniciada' },
      etapa04: { estado: 'nao_iniciada' },
      etapa05: { estado: 'nao_iniciada' },
      etapa06: { estado: 'nao_iniciada' },
      algumaEtapaIniciada: false,
    })

    render(
      <MemoryRouter>
        <IndicativoClienteAtivoTopo />
      </MemoryRouter>,
    )

    expect(screen.getByText('Nenhum Cliente Ativo Selecionado')).toBeDefined()
    const botaoAjudaCliente = screen.getByRole('button', {
      name: /O que é o Cliente Ativo\?/i,
    })
    expect(botaoAjudaCliente).toBeDefined()
  })

  it('não renderiza para usuário empresário', () => {
    mockUseAuth.mockReturnValue({
      isMaster: false,
      isAdmin: false,
      isEmpresario: true,
      nivelAcesso: 'empresario',
    })

    mockUseClienteAtivo.mockReturnValue({
      clienteAtivo: null,
    })

    mockUseProgressoTrilha.mockReturnValue({
      etapa00: { estado: 'nao_iniciada' },
      etapa01: { estado: 'nao_iniciada' },
      etapa02: { estado: 'nao_iniciada' },
      etapa03: { estado: 'nao_iniciada' },
      etapa04: { estado: 'nao_iniciada' },
      etapa05: { estado: 'nao_iniciada' },
      etapa06: { estado: 'nao_iniciada' },
      algumaEtapaIniciada: false,
    })

    const { container } = render(
      <MemoryRouter>
        <IndicativoClienteAtivoTopo />
      </MemoryRouter>,
    )

    expect(container.firstChild).toBeNull()
  })
})
