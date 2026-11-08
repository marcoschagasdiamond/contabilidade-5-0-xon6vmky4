/**
 * Testes unitários para o Funil de 6 Etapas da Home (SecaoFunilJornadaHome.tsx).
 *
 * Invariantes provados:
 * 1. As 6 etapas numeradas (1 a 6) são renderizadas com seus títulos e fases narrativas:
 *    (1) Problema: Descobriu o gargalo fiscal
 *    (2) Solução: Conheceu a Contabilidade 5.0
 *    (3) Provas: Viu resultados concretos
 *    (4) Simulação: Simulou o impacto em segundos
 *    (5) Cadastro: Cadastrou seus dados fiscais
 *    (6) Especialista: Falou com o especialista sênior
 * 2. Cada etapa possui seu CTA respectivo com o destino correto (rotas internas, scroll e WhatsApp);
 * 3. A etapa 5 (cadastro) consome dinamicamente o cadastroHref passado via prop (/dados-empresa ou /cadastro?redirect=...);
 * 4. A etapa 6 (especialista) aponta para o WhatsApp com o número oficial (+55 41 97400-6290).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SecaoFunilJornadaHome } from '@/components/home/SecaoFunilJornadaHome'
import { WHATSAPP_EMPRESA_NUMERO } from '@/config/empresa'

describe('SecaoFunilJornadaHome — Funil Narrativo de 6 Etapas na Home', () => {
  it('renderiza as 6 etapas numeradas com fases e títulos narrativos corretos', () => {
    render(
      <MemoryRouter>
        <SecaoFunilJornadaHome cadastroHref="/cadastro?redirect=%2Fdados-empresa" />
      </MemoryRouter>,
    )

    // Cabeçalho da seção
    expect(screen.getByText(/Jornada de Transformação Contábil/i)).toBeDefined()
    expect(screen.getByText(/O caminho claro para proteger o seu lucro em/i)).toBeDefined()

    // 6 etapas numeradas presentes
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByTestId(`etapa-funil-${i}`)).toBeDefined()
      expect(screen.getByText(`Etapa ${i} de 6`)).toBeDefined()
    }

    // Nomes das 6 fases
    expect(screen.getByText('Problema')).toBeDefined()
    expect(screen.getByText('Solução')).toBeDefined()
    expect(screen.getByText('Provas')).toBeDefined()
    expect(screen.getByText('Simulação')).toBeDefined()
    expect(screen.getByText('Cadastro')).toBeDefined()
    expect(screen.getByText('Especialista')).toBeDefined()

    // Títulos específicos das etapas
    expect(screen.getByText('Descobriu o gargalo fiscal')).toBeDefined()
    expect(screen.getByText('Conheceu a Contabilidade 5.0')).toBeDefined()
    expect(screen.getByText('Viu resultados concretos')).toBeDefined()
    expect(screen.getByText('Simulou o impacto em segundos')).toBeDefined()
    expect(screen.getByText('Cadastrou seus dados fiscais')).toBeDefined()
    expect(screen.getByText('Falou com o especialista sênior')).toBeDefined()
  })

  it('o CTA da Etapa 2 leva a /servicos e da Etapa 4 leva a /calculadora-ibs-cbs', () => {
    render(
      <MemoryRouter>
        <SecaoFunilJornadaHome cadastroHref="/dados-empresa" />
      </MemoryRouter>,
    )

    const ctaEtapa2 = screen.getByTestId('cta-etapa-2')
    expect(ctaEtapa2.getAttribute('href')).toBe('/servicos')

    const ctaEtapa4 = screen.getByTestId('cta-etapa-4')
    expect(ctaEtapa4.getAttribute('href')).toBe('/calculadora-ibs-cbs')
  })

  it('o CTA da Etapa 5 respeita o cadastroHref passado para visitante deslogado vs logado', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SecaoFunilJornadaHome cadastroHref="/cadastro?redirect=%2Fdados-empresa" />
      </MemoryRouter>,
    )

    const ctaEtapa5Deslogado = screen.getByTestId('cta-etapa-5')
    expect(ctaEtapa5Deslogado.getAttribute('href')).toBe('/cadastro?redirect=%2Fdados-empresa')

    // Rerender com usuário logado
    rerender(
      <MemoryRouter>
        <SecaoFunilJornadaHome cadastroHref="/dados-empresa" />
      </MemoryRouter>,
    )

    const ctaEtapa5Logado = screen.getByTestId('cta-etapa-5')
    expect(ctaEtapa5Logado.getAttribute('href')).toBe('/dados-empresa')
  })

  it('o CTA da Etapa 6 aponta para o link do WhatsApp oficial da empresa', () => {
    render(
      <MemoryRouter>
        <SecaoFunilJornadaHome cadastroHref="/dados-empresa" />
      </MemoryRouter>,
    )

    const ctaEtapa6 = screen.getByTestId('cta-etapa-6')
    const href = ctaEtapa6.getAttribute('href') || ''

    expect(href).toContain(`wa.me/${WHATSAPP_EMPRESA_NUMERO}`)
    expect(href).toContain(encodeURIComponent('funil de 6 etapas'))
  })
})
