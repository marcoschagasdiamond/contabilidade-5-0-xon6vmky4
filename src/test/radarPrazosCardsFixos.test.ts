import { describe, it, expect } from 'vitest'
import {
  CONFIG_CARDS_RADAR_FIXOS,
  calcularEstadoPrazoCard,
  type CardRadarPrazoConfig,
} from '../config/radarPrazos'

describe('Automação de Prazos e Prorrogações dos Cards Fixos do Radar (/legislacao)', () => {
  it('(1) Os 5 cards fixos possuem configuração bem definida na tabela centralizada', () => {
    expect(CONFIG_CARDS_RADAR_FIXOS.cancelamentoNf).toBeDefined()
    expect(CONFIG_CARDS_RADAR_FIXOS.janelaSimples).toBeDefined()
    expect(CONFIG_CARDS_RADAR_FIXOS.faseTeste2026).toBeDefined()
    expect(CONFIG_CARDS_RADAR_FIXOS.impostoSeletivo).toBeDefined()
    expect(CONFIG_CARDS_RADAR_FIXOS.creditoParcialSimples).toBeDefined()

    // Cancelamento NF permanece no topo como alerta permanente
    expect(CONFIG_CARDS_RADAR_FIXOS.cancelamentoNf.tipo).toBe('permanente')

    // Marcos de vigência ('a partir de') são do tipo marco
    expect(CONFIG_CARDS_RADAR_FIXOS.faseTeste2026.tipo).toBe('marco')
    expect(CONFIG_CARDS_RADAR_FIXOS.impostoSeletivo.tipo).toBe('marco')
  })

  it('(2) Janela Simples: antes da data-limite exibe status "vigente", sem tarja de vencido e CTA normal', () => {
    const config = CONFIG_CARDS_RADAR_FIXOS.janelaSimples
    const dataAntes = new Date(2026, 9, 15, 12, 0, 0) // 15 de Outubro de 2026
    const estado = calcularEstadoPrazoCard(config, dataAntes)

    expect(estado.status).toBe('vigente')
    expect(estado.isVencido).toBe(false)
    expect(estado.isProrrogado).toBe(false)
    expect(estado.tarjaTexto).toBeNull()
    expect(estado.ctaTexto).toBe('Analisar minha transição →')
    expect(estado.ctaHref).toBe('/diagnostico-transicao')
  })

  it('(3) Janela Simples: após data-limite (30/10) exibe tarja vermelha "Prazo Vencido" e CTA "Prazo encerrado — ver próximo passo"', () => {
    const config = CONFIG_CARDS_RADAR_FIXOS.janelaSimples
    const dataDepois = new Date(2026, 10, 1, 12, 0, 0) // 01 de Novembro de 2026
    const estado = calcularEstadoPrazoCard(config, dataDepois)

    expect(estado.status).toBe('vencido')
    expect(estado.isVencido).toBe(true)
    expect(estado.isProrrogado).toBe(false)
    expect(estado.tarjaTexto).toBe('Prazo Vencido')
    expect(estado.ctaTexto).toBe('Prazo encerrado — ver próximo passo')
    // Mantém exatamente o mesmo link / destino
    expect(estado.ctaHref).toBe('/diagnostico-transicao')
  })

  it('(4) Com prorrogação ativa: exibe tarja azul "Prorrogado até DD/MM" e reativa o CTA original', () => {
    const configProrrogada: CardRadarPrazoConfig = {
      ...CONFIG_CARDS_RADAR_FIXOS.janelaSimples,
      prorrogado: true,
      prorrogadoAte: '15/12',
    }

    // Mesmo com data posterior a 30/10:
    const dataNovembro = new Date(2026, 10, 10, 12, 0, 0)
    const estado = calcularEstadoPrazoCard(configProrrogada, dataNovembro)

    expect(estado.status).toBe('prorrogado')
    expect(estado.isVencido).toBe(false)
    expect(estado.isProrrogado).toBe(true)
    expect(estado.tarjaTexto).toBe('Prorrogado até 15/12')
    // CTA reativado para o original
    expect(estado.ctaTexto).toBe('Analisar minha transição →')
    expect(estado.ctaHref).toBe('/diagnostico-transicao')
  })

  it('(5) Marcos "a partir de" (Fase de teste 2026 e Imposto Seletivo) nunca vencem', () => {
    // Data muito no futuro:
    const dataFuturaDistante = new Date(2035, 0, 1)

    const estadoFaseTeste = calcularEstadoPrazoCard(
      CONFIG_CARDS_RADAR_FIXOS.faseTeste2026,
      dataFuturaDistante,
    )
    expect(estadoFaseTeste.status).toBe('vigente')
    expect(estadoFaseTeste.isVencido).toBe(false)
    expect(estadoFaseTeste.tarjaTexto).toBeNull()
    expect(estadoFaseTeste.ctaTexto).toBe('Testar na Calculadora →')
    expect(estadoFaseTeste.ctaHref).toBe('/calculadora-ibs-cbs')

    const estadoIS = calcularEstadoPrazoCard(
      CONFIG_CARDS_RADAR_FIXOS.impostoSeletivo,
      dataFuturaDistante,
    )
    expect(estadoIS.status).toBe('vigente')
    expect(estadoIS.isVencido).toBe(false)
    expect(estadoIS.tarjaTexto).toBeNull()
    expect(estadoIS.ctaTexto).toBe('Ver Imposto Seletivo →')
    expect(estadoIS.ctaHref).toBe('/reforma-tributaria')

    const estadoCancelamento = calcularEstadoPrazoCard(
      CONFIG_CARDS_RADAR_FIXOS.cancelamentoNf,
      dataFuturaDistante,
    )
    expect(estadoCancelamento.status).toBe('vigente')
    expect(estadoCancelamento.isVencido).toBe(false)
    expect(estadoCancelamento.tarjaTexto).toBeNull()
    expect(estadoCancelamento.ctaTexto).toBe('Conhecer o serviço →')
    expect(estadoCancelamento.ctaHref).toBe('/servicos/cancelamento-nf-ibs-cbs')
  })

  it('(6) Marcos "a partir de" podem ter prorrogação caso recebam normativa que altere vigência', () => {
    const configISAlterada: CardRadarPrazoConfig = {
      ...CONFIG_CARDS_RADAR_FIXOS.impostoSeletivo,
      prorrogado: true,
      prorrogadoAte: '01/07/2027',
    }

    const estado = calcularEstadoPrazoCard(configISAlterada, new Date(2026, 10, 1))
    expect(estado.status).toBe('prorrogado')
    expect(estado.tarjaTexto).toBe('Prorrogado até 01/07/2027')
    expect(estado.ctaTexto).toBe('Ver Imposto Seletivo →')
  })
})
