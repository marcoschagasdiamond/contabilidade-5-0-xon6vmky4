import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Servicos from '@/pages/Servicos'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe('Página de Serviços (/servicos)', () => {
  it('renderiza o grid de mini-cards no topo e as categorias agrupadas', () => {
    render(
      <MemoryRouter>
        <Servicos />
      </MemoryRouter>,
    )

    // Grid do índice visual de serviços
    expect(screen.getByTestId('indice-servicos-grid')).toBeDefined()

    // Categorias principais agrupadas
    expect(screen.getByRole('heading', { name: 'Diagnóstico & Estratégia' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Wealth & Governance' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Operação & BPO' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Finanças & Estruturação de Fluxo' })).toBeDefined()
    expect(
      screen.getByRole('heading', { name: 'Tributário, Créditos & Recuperação' }),
    ).toBeDefined()
  })

  it('permite clicar em Contratar este Serviço e acionar a seleção do formulário', () => {
    // Mock do scrollIntoView no JSDOM
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock

    render(
      <MemoryRouter>
        <Servicos />
      </MemoryRouter>,
    )

    const botoesContratar = screen.getAllByRole('button', { name: /Contratar este Serviço/i })
    expect(botoesContratar.length).toBeGreaterThanOrEqual(1)

    // Clica no primeiro serviço: Diagnóstico 360°
    fireEvent.click(botoesContratar[0])

    expect(scrollMock).toHaveBeenCalled()
    expect(screen.getByText(/Diagnóstico 360°/i)).toBeDefined()
  })
})
