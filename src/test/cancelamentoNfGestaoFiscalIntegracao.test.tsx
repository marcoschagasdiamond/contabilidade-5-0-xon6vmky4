import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Legislacao from '@/pages/Legislacao'
import GestaoFiscalTributaria from '@/pages/GestaoFiscalTributaria'
import Servicos from '@/pages/Servicos'

// Mocks de serviços e hooks externos
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/services/radarTributario', () => ({
  pesquisarLegislacao: vi.fn().mockResolvedValue({ itens: [] }),
  dispararVarreduraRadar: vi.fn().mockResolvedValue({ status: 'ok' }),
  listarParametrosTributarios: vi.fn().mockResolvedValue([]),
  listarNotificacoesTributarias: vi.fn().mockResolvedValue([]),
  marcarNotificacaoComoLida: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/components/common/SecaoDuplaAcaoFinal', () => ({
  default: () => <div data-testid="secao-dupla-acao">Secao Dupla Acao</div>,
}))

describe('Cancelamento de NF no IBS/CBS integrado à Gestão Fiscal e Radar', () => {
  it('(1) Em /legislacao, exibe o card fixo no topo do Radar com badge Alerta Permanente e links corretos', async () => {
    render(
      <MemoryRouter>
        <Legislacao />
      </MemoryRouter>,
    )

    // Card fixo identificado
    const cardRadar = screen.getByTestId('card-radar-cancelamento-nf')
    expect(cardRadar).toBeDefined()

    // Badges exigidos
    expect(screen.getByText('Alerta Permanente')).toBeDefined()
    expect(screen.getByText('IBS/CBS • 2027')).toBeDefined()

    // Título e texto exigidos
    expect(screen.getByText('Cancelamento de NF no IBS/CBS: cuidado com o estorno')).toBeDefined()
    expect(
      screen.getByText(
        /A partir de janeiro \(2027\), ao cancelar uma nota fiscal no novo sistema/i,
      ),
    ).toBeDefined()

    // Botão para a página dedicada
    const linkServico = screen.getByRole('link', { name: /Conhecer o serviço →/i })
    expect(linkServico.getAttribute('href')).toBe('/servicos/cancelamento-nf-ibs-cbs')

    // Link para a tese EST-04 no Recuperador de Créditos
    const linkTese = screen.getByRole('link', { name: /Ver tese EST-04 no Recuperador →/i })
    expect(linkTese.getAttribute('href')).toContain('/recuperador-creditos')
    expect(linkTese.getAttribute('href')).toContain('tese_cancelamento_nf_devolucoes_estornos')

    // (1.1) Card 1: Janela de opção do Simples Nacional (Prazo • 30/10)
    const cardSimples = screen.getByTestId('card-radar-janela-simples')
    expect(cardSimples).toBeDefined()
    expect(screen.getByText(/Prazo • 30\/10/i)).toBeDefined()
    expect(screen.getByText(/Simples Nacional • Híbrido/i)).toBeDefined()
    expect(screen.getByText(/Janela de opção da regra híbrida do Simples Nacional/i)).toBeDefined()
    const linkTransicao = screen.getByRole('link', { name: /Analisar minha transição →/i })
    expect(linkTransicao.getAttribute('href')).toBe('/diagnostico-transicao')

    // (1.2) Card 2: Fase de teste 2026 do IBS/CBS (IBS/CBS • 2026)
    const cardFaseTeste = screen.getByTestId('card-radar-fase-teste-2026')
    expect(cardFaseTeste).toBeDefined()
    expect(screen.getByText('IBS/CBS • 2026')).toBeDefined()
    expect(screen.getByText(/Fase de teste 2026 do IBS\/CBS com alíquota zero/i)).toBeDefined()
    const linkCalculadoraTeste = screen.getByRole('link', { name: /Testar na Calculadora →/i })
    expect(linkCalculadoraTeste.getAttribute('href')).toBe('/calculadora-ibs-cbs')

    // (1.3) Card 3: Imposto Seletivo a partir de 2027 (IS • 2027)
    const cardIs = screen.getByTestId('card-radar-imposto-seletivo')
    expect(cardIs).toBeDefined()
    expect(screen.getByText('IS • 2027')).toBeDefined()
    expect(
      screen.getByText(/Imposto Seletivo \("imposto do pecado"\) a partir de 2027/i),
    ).toBeDefined()
    const linkIs = screen.getByRole('link', { name: /Ver Imposto Seletivo →/i })
    expect(linkIs.getAttribute('href')).toBe('/reforma-tributaria')

    // (1.4) Card 4: Crédito parcial de fornecedores do Simples em 2027 (Créditos • 2027)
    const cardCreditoSimples = screen.getByTestId('card-radar-credito-parcial-simples')
    expect(cardCreditoSimples).toBeDefined()
    expect(screen.getByText('Créditos • 2027')).toBeDefined()
    expect(
      screen.getByText(/Crédito parcial de fornecedores do Simples Nacional em 2027/i),
    ).toBeDefined()
    const linkCreditoSimples = screen.getByRole('link', { name: /Calcular meu crédito →/i })
    expect(linkCreditoSimples.getAttribute('href')).toBe('/calculadora-ibs-cbs')
  })

  it('(2) Em Gestão Fiscal & Tributária, exibe seção "Serviço incluso: Cancelamento de NF no IBS/CBS" com os 4 pontos', () => {
    render(
      <MemoryRouter>
        <GestaoFiscalTributaria />
      </MemoryRouter>,
    )

    const secaoIncluso = screen.getByTestId('secao-servico-incluso-cancelamento-nf')
    expect(secaoIncluso).toBeDefined()

    // Título da seção
    expect(screen.getByText('Serviço incluso: Cancelamento de NF no IBS/CBS')).toBeDefined()

    // 4 pontos informativos
    expect(screen.getByText('O que muda em janeiro (2027)')).toBeDefined()
    expect(screen.getByText('Estorno correto por NF-e de devolução')).toBeDefined()
    expect(screen.getByText('Risco de imposto sobre NF cancelada / dupla tributação')).toBeDefined()
    expect(screen.getByText('O que o serviço faz na sua empresa')).toBeDefined()

    // Botão para a página dedicada
    const linkPaginaDedicada = screen.getByRole('link', {
      name: /Ver Página do Cancelamento de NF no IBS\/CBS/i,
    })
    expect(linkPaginaDedicada.getAttribute('href')).toBe('/servicos/cancelamento-nf-ibs-cbs')
  })

  it('(3) Em /servicos, o card de Cancelamento de NF exibe badge "Incluso na Gestão Fiscal & Tributária" e mantém link', () => {
    render(
      <MemoryRouter>
        <Servicos />
      </MemoryRouter>,
    )

    // Badge presente no card
    const badge = screen.getByTestId('badge-incluso-gestao-fiscal')
    expect(badge).toBeDefined()
    expect(badge.textContent).toContain('Incluso na Gestão Fiscal & Tributária')

    // Link para a página dedicada do cancelamento
    const links = screen.getAllByRole('link', { name: /Ver Página Completa & Pilares 5.0/i })
    const linkCancelamento = links.find(
      (l) => l.getAttribute('href') === '/servicos/cancelamento-nf-ibs-cbs',
    )
    expect(linkCancelamento).toBeDefined()
  })
})
