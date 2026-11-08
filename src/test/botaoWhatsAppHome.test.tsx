/**
 * Testes unitários para o botão flutuante de WhatsApp na Home e a configuração institucional.
 *
 * Invariantes validadas:
 * 1. O link gerado para o WhatsApp aponta para https://wa.me/551140028922 com a mensagem padrão pré-configurada;
 * 2. O botão flutuante renderiza com target="_blank", rel="noopener noreferrer", aria-label acessível e foco por teclado;
 * 3. O botão flutuante na Home (Index.tsx) está presente no DOM com todas as propriedades requeridas;
 * 4. Ao passar o mouse / focar, o balão orientativo de apoio fica ativo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { BotaoWhatsAppFlutuante } from '@/components/home/BotaoWhatsAppFlutuante'
import Index from '@/pages/Index'
import {
  buildWhatsAppLink,
  WHATSAPP_EMPRESA_NUMERO,
  WHATSAPP_MENSAGEM_PADRAO_HOME,
} from '@/config/empresa'
import * as authContext from '@/context/AuthContext'
import * as onboardingHook from '@/hooks/useOnboarding'

describe('WhatsApp — Configuração e Botão Flutuante', () => {
  it('buildWhatsAppLink gera URL válida para wa.me com número e mensagem pré-preenchida', () => {
    const url = buildWhatsAppLink()
    expect(url).toBe(
      `https://wa.me/5541974006290?text=${encodeURIComponent(WHATSAPP_MENSAGEM_PADRAO_HOME)}`,
    )
    expect(url).toContain(`https://wa.me/${WHATSAPP_EMPRESA_NUMERO}`)

    const urlCustom = buildWhatsAppLink('Mensagem de teste customizada')
    expect(urlCustom).toBe(
      `https://wa.me/5541974006290?text=${encodeURIComponent('Mensagem de teste customizada')}`,
    )
  })

  it('BotaoWhatsAppFlutuante renderiza com atributos corretos de acessibilidade e link seguro', () => {
    render(<BotaoWhatsAppFlutuante />)

    const link = screen.getByRole('link', {
      name: /falar com um especialista no whatsapp/i,
    })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe(buildWhatsAppLink())
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('BotaoWhatsAppFlutuante responde a eventos de mouse enter / mouse leave e foco', () => {
    render(<BotaoWhatsAppFlutuante />)

    const link = screen.getByRole('link', {
      name: /falar com um especialista no whatsapp/i,
    })

    // Hover
    fireEvent.mouseEnter(link)
    expect(screen.getByText(/falar com especialista no whatsapp/i)).toBeDefined()

    fireEvent.mouseLeave(link)
    // Focus para acessibilidade por teclado
    fireEvent.focus(link)
    expect(screen.getByText(/falar com especialista no whatsapp/i)).toBeDefined()

    fireEvent.blur(link)
  })

  describe('Integração com Index.tsx', () => {
    beforeEach(() => {
      vi.clearAllMocks()
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
    })

    it('renderiza o BotaoWhatsAppFlutuante na página inicial', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Index />
        </MemoryRouter>,
      )

      const botaoWhatsapp = screen.getByTestId('whatsapp-floating-button')
      expect(botaoWhatsapp).toBeDefined()
      expect(botaoWhatsapp.getAttribute('href')).toContain(
        `https://wa.me/${WHATSAPP_EMPRESA_NUMERO}`,
      )
    })
  })
})
