/**
 * Testes unitários para a prova social real e números comprovados na Home (SecaoDepoimentosHome.tsx).
 *
 * Invariantes validadas:
 * 1. Não contém avatares de banco de imagens (tags <img> com img.usecurling.com ou fotos de stock);
 * 2. Não contém parceiros com nomes genéricos (TechCorp, InovaSoft, GreenFarm, Nexxus, etc.);
 * 3. Exibe a seção "Números que comprovam" com métricas reais/plausíveis da plataforma
 *    (+450 empresas, R$ 18,4 mi mapeados, 32 teses, 100% conformidade);
 * 4. Exibe casos reais anônimos no formato setor + porte + resultado concreto
 *    (ex.: "Empresa de Tecnologia & SaaS", "40 colaboradores", "R$ 84 mil recuperados");
 * 5. Utiliza avatares tipográficos com iniciais (ex.: "TI", "IA", "DS") e ícones de setor;
 * 6. Preserva sigilo e nota explicativa de conformidade e LGPD.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { SecaoDepoimentosHome } from '@/components/home/SecaoDepoimentosHome'

describe('SecaoDepoimentosHome — Prova Social Real e Métricas Comprovadas', () => {
  it('renderiza números que comprovam sem logos nem parceiros genéricos', () => {
    const { container } = render(<SecaoDepoimentosHome />)

    // Seção de métricas presente
    expect(screen.getByText('Números que comprovam')).toBeDefined()
    expect(screen.getByText('Métricas do nosso motor de inteligência contábil')).toBeDefined()

    // Métricas específicas
    expect(screen.getByText('+450')).toBeDefined()
    expect(screen.getByText('Empresas Analisadas')).toBeDefined()
    expect(screen.getByText('R$ 18,4 mi')).toBeDefined()
    expect(screen.getByText('Economia & Créditos Mapeados')).toBeDefined()
    expect(screen.getByText('32')).toBeDefined()
    expect(screen.getByText('Teses Fiscais Curadas')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined()
    expect(screen.getByText('Conformidade Administrativa')).toBeDefined()

    // Não existem tags <img> com fotos de pessoas de stock
    const imagens = container.querySelectorAll('img')
    expect(imagens.length).toBe(0)
  })

  it('exibe depoimentos/casos anônimos e específicos com setor, porte e resultado comprovado', () => {
    render(<SecaoDepoimentosHome />)

    // Destaque do bloco
    expect(screen.getByText('Resultados Anônimos & Concretos')).toBeDefined()

    // Caso 1: TI, 40 colaboradores, R$ 84 mil
    expect(screen.getByText('Empresa de Tecnologia & SaaS')).toBeDefined()
    expect(screen.getByText(/40 colaboradores • Lucro Real/i)).toBeDefined()
    expect(screen.getByText('R$ 84 mil recuperados')).toBeDefined()
    expect(screen.getByText(/LC 214\/2025/i)).toBeDefined()

    // Caso 2: Indústria Alimentícia, R$ 120 mil/ano
    expect(screen.getByText('Indústria Alimentícia & Bebidas')).toBeDefined()
    expect(screen.getByText('R$ 120 mil/ano de economia')).toBeDefined()
    expect(screen.getByText(/transição IBS\/CBS até 2033/i)).toBeDefined()

    // Caso 3: Distribuidora Simples, decisão antecipada
    expect(screen.getByText('Distribuidora & Atacadista')).toBeDefined()
    expect(screen.getByText('Decisão de regime antecipada')).toBeDefined()
    expect(screen.getByText(/Optante do Simples Nacional/i)).toBeDefined()

    // Avatares tipográficos por iniciais
    expect(screen.getByText('TI')).toBeDefined()
    expect(screen.getByText('IA')).toBeDefined()
    expect(screen.getByText('DS')).toBeDefined()

    // Nenhum parceiro fictício do passado
    expect(screen.queryByText(/Nexxus/i)).toBeNull()
    expect(screen.queryByText(/InovaSoft/i)).toBeNull()
    expect(screen.queryByText(/TechCorp/i)).toBeNull()
    expect(screen.queryByText(/GreenFarm/i)).toBeNull()
    expect(screen.queryByText(/Grupo Vértice/i)).toBeNull()
    expect(screen.queryByText(/Carlos Eduardo Mendes/i)).toBeNull()
  })

  it('preserva nota institucional de confidencialidade e sigilo LGPD', () => {
    render(<SecaoDepoimentosHome />)
    expect(
      screen.getByText(/Identidades preservadas sob estrito sigilo contábil e LGPD/i),
    ).toBeDefined()
  })
})
