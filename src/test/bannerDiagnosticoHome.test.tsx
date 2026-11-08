/**
 * Testes unitários para o banner de simulação tributária na página inicial (Index.tsx).
 *
 * Invariantes provados:
 * 1. O selo do banner exibe "Simulador Gratuito" sem o ano desatualizado "2025";
 * 2. Quando o visitante NÃO está logado (isAuthenticated = false), clicar no botão do banner
 *    direciona para o cadastro/login self-service com redirect para /dados-empresa;
 * 3. Quando o usuário JÁ está logado (isAuthenticated = true), clicar no botão do banner
 *    vai direto para /dados-empresa sem cadastro repetido;
 * 4. O formulário de contato (#contato) e a seção de contato continuam presentes e funcionais.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Index from '@/pages/Index'
import * as authContext from '@/context/AuthContext'
import * as onboardingHook from '@/hooks/useOnboarding'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Index — Banner do Diagnóstico Tributário', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock do useOnboarding com estado neutro
    vi.spyOn(onboardingHook, 'useOnboarding').mockReturnValue({
      exibirWizard: false,
      fecharModalWizardTemporariamente: vi.fn(),
      dispensarWizard: vi.fn(),
      abrirWizard: vi.fn(),
      exibirChecklist: false,
      checklistRecolhido: false,
      alternarChecklistRecolhido: vi.fn(),
      passos: [],
      totalConcluidos: 0,
      totalPassos: 5,
      percentualConcluido: 0,
      todosPassosConcluidos: false,
      marcarPassoConcluido: vi.fn(),
    } as any)
  })

  it('exibe o selo "Simulador Gratuito" sem "2025" e mantém o formulário de contato', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      updateProfile: vi.fn(),
      isAdmin: false,
      isMaster: false,
      isAnalista: false,
      isContador: false,
      isEmpresario: false,
      isAnalistaOuMaster: false,
    } as any)

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    )

    // Selo sem 2025
    expect(screen.getByText('Simulador Gratuito')).toBeDefined()
    expect(screen.queryByText(/Simulador Gratuito 2025/i)).toBeNull()

    // O texto da promessa está presente
    expect(screen.getByText('Descubra o melhor regime tributário para sua empresa')).toBeDefined()

    // Botão com chamada clara para simulação
    expect(screen.getByText('Simular em 4 Etapas Grátis')).toBeDefined()

    // Seção de contato continua presente
    expect(screen.getByText('Pronto para modernizar a sua contabilidade?')).toBeDefined()
  })

  it('quando o visitante NÃO está logado, clicar no botão do banner leva a /cadastro?redirect=%2Fdados-empresa', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      updateProfile: vi.fn(),
      isAdmin: false,
      isMaster: false,
      isAnalista: false,
      isContador: false,
      isEmpresario: false,
      isAnalistaOuMaster: false,
    } as any)

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    )

    const botaoBanner = screen.getByRole('button', { name: /Simular em 4 Etapas Grátis/i })
    fireEvent.click(botaoBanner)

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/cadastro?redirect=%2Fdados-empresa')
  })

  it('quando o visitante JÁ está logado, clicar no botão do banner vai direto para /dados-empresa', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr_1', email: 'teste@empresa.com' },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      updateProfile: vi.fn(),
      isAdmin: false,
      isMaster: false,
      isAnalista: false,
      isContador: false,
      isEmpresario: true,
      isAnalistaOuMaster: false,
    } as any)

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    )

    const botaoBanner = screen.getByRole('button', { name: /Simular em 4 Etapas Grátis/i })
    fireEvent.click(botaoBanner)

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/dados-empresa')
  })
})
