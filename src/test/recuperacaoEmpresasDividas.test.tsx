import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import RecuperacaoEmpresasDividas from '@/pages/RecuperacaoEmpresasDividas'
import { SecaoServicosHome } from '@/components/home/SecaoServicosHome'
import { WHATSAPP_EMPRESA_NUMERO } from '@/config/empresa'
import { extrairFonteLead, extrairScoreLead } from '@/lib/pipelineLeadUtils'

// Mock de useToast e subcomponentes com dependências de contexto
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/components/common/SecaoDuplaAcaoFinal', () => ({
  SecaoDuplaAcaoFinal: () => <div data-testid="secao-dupla-acao">Secao Dupla Acao</div>,
}))

describe('Página Recuperação de Empresas & Gestão de Dívidas', () => {
  it('renderiza o título, as duas frentes e a explicação de Aquisição com Investidores', () => {
    render(
      <MemoryRouter>
        <RecuperacaoEmpresasDividas />
      </MemoryRouter>,
    )

    // Título principal
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()

    // Frente 1
    expect(screen.getByText(/Assessoria de Recuperação/i)).toBeDefined()

    // Frente 2: Aquisição com Investidores
    expect(screen.getByText(/Aquisição com Investidores da Rede/i)).toBeDefined()
    expect(
      screen.getByText(/a empresa endividada pode ser adquirida pelos investidores/i),
    ).toBeDefined()

    // Ativo fiscal
    expect(screen.getByText(/O Ativo Fiscal como Moeda de Redução/i)).toBeDefined()

    // Sigilo e Confidencialidade
    expect(screen.getByText(/Protocolo de Sigilo & Confidencialidade Absoluta/i)).toBeDefined()

    // Botão Ver Página Completa & Pilares 5.0
    expect(screen.getByText(/Ver Página Completa & Pilares 5.0/i)).toBeDefined()
  })

  it('contém link de WhatsApp com o número central de empresa.ts', () => {
    render(
      <MemoryRouter>
        <RecuperacaoEmpresasDividas />
      </MemoryRouter>,
    )

    expect(WHATSAPP_EMPRESA_NUMERO).toBe('5541974006290')

    const linksWhatsapp = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes(`wa.me/${WHATSAPP_EMPRESA_NUMERO}`))

    expect(linksWhatsapp.length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza card na grade de serviços da Home', () => {
    render(
      <MemoryRouter>
        <SecaoServicosHome />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Recuperação de Empresas/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/servicos/recuperacao-empresas-dividas')
  })

  it('pontua lead com tipo_solicitacao recuperacao-empresas com lead scoring alto', () => {
    const lead = {
      tipo_solicitacao: 'recuperacao-empresas',
      nome: 'Diretor Financeiro',
      email: 'cfo@empresa.com.br',
      telefone: '(41) 97400-6290',
      mensagem: 'Frente 2: Aquisição com Investidores. R$ 3 milhões em passivo.',
    }

    const score = extrairScoreLead(lead)
    const fonte = extrairFonteLead(lead)

    expect(score).toBeGreaterThanOrEqual(65)
    expect(fonte).toBe('Recuperação de Empresas & Dívidas')
  })
})
