import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Servicos from '@/pages/Servicos'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

function renderServicos() {
  return render(
    <MemoryRouter>
      <Servicos />
    </MemoryRouter>,
  )
}

describe('Página de Serviços (/servicos)', () => {
  it('renderiza o grid de mini-cards no topo e as categorias agrupadas', () => {
    renderServicos()

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

    // Cancelamento de NF não deve constar como card avulso nem no índice de mini-cards
    expect(screen.queryByText('Cancelamento de NF no IBS/CBS')).toBeNull()
  })

  it('permite clicar em Contratar este Serviço e acionar a seleção do formulário', () => {
    // Mock do scrollIntoView no JSDOM
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock

    renderServicos()

    const botoesContratar = screen.getAllByRole('button', { name: /Contratar este Serviço/i })
    expect(botoesContratar.length).toBeGreaterThanOrEqual(1)

    // Clica no primeiro serviço: Diagnóstico 360°
    fireEvent.click(botoesContratar[0])

    expect(scrollMock).toHaveBeenCalled()
    expect(screen.getByText(/Diagnóstico 360°/i)).toBeDefined()
  })

  it('cada serviço exibe sua linha de prova social no estilo dos resultados da home', () => {
    renderServicos()

    // 12 serviços na página — 12 cards de prova social, todos preenchidos
    const linhas = screen
      .getAllByTestId(/^prova-social-/)
      .filter((el) => el.getAttribute('data-testid') !== 'prova-social')
    expect(linhas.length).toBe(12)

    linhas.forEach((linha) => {
      expect(linha.textContent.trim().length).toBeGreaterThan(0)
    })

    // Formato com resultado concreto (porte + resultado), como na home
    expect(screen.getByText(/Empresa de TI, 40 funcionários/i)).toBeDefined()
  })

  it('exibe o CTA de WhatsApp com o número oficial +55 41 97400-6290', () => {
    renderServicos()

    const botao = screen.getByTestId('botao-whatsapp-servicos')
    expect(botao).toBeDefined()
    expect(botao.getAttribute('href')).toContain('https://wa.me/5541974006290')
    expect(botao.getAttribute('target')).toBe('_blank')
    expect(botao.getAttribute('rel')).toContain('noopener')
  })

  it('quiz orientador recomenda um serviço e rola suavemente até a seção dele', () => {
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock

    renderServicos()

    // O bloco orientador fica entre o índice de mini-cards e as seções de categorias
    const quiz = screen.getByTestId('quiz-qual-servico')
    expect(quiz).toBeDefined()

    // Percorre as 4 perguntas escolhendo a primeira opção de cada uma
    const opcoesQuiz = () =>
      screen
        .getAllByRole('button')
        .filter((b) => (b.getAttribute('data-testid') || '').startsWith('quiz-opcao-'))

    for (let i = 0; i < 4; i++) {
      const opcoes = opcoesQuiz()
      expect(opcoes.length).toBeGreaterThanOrEqual(3)
      fireEvent.click(opcoes[0])
    }

    // Ao final, a página rolou suavemente até a seção de um serviço recomendado
    expect(scrollMock).toHaveBeenCalled()
  })

  it('quiz orientador: botão Recomeçar volta à primeira pergunta', () => {
    renderServicos()

    const opcoesQuiz = () =>
      screen
        .getAllByRole('button')
        .filter((b) => (b.getAttribute('data-testid') || '').startsWith('quiz-opcao-'))

    fireEvent.click(opcoesQuiz()[0])
    expect(screen.getByTestId('quiz-reiniciar')).toBeDefined()

    fireEvent.click(screen.getByTestId('quiz-reiniciar'))
    // Volta à primeira pergunta (problema): opções com test-id quiz-opcao-problema-*
    const primeiras = opcoesQuiz().filter((b) =>
      (b.getAttribute('data-testid') || '').startsWith('quiz-opcao-problema-'),
    )
    expect(primeiras.length).toBeGreaterThanOrEqual(3)
  })
})
