import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcularEstimativaExpressa,
  formatarValorK,
} from '@/components/home/WidgetSimulacaoExpressa'
import { calcularScoreLeadWhatsApp, registrarLeadCliqueWhatsApp } from '@/services/leadWhatsApp'
import pb from '@/lib/pocketbase/client'
import * as leadsService from '@/services/leads'

describe('WidgetSimulacaoExpressa - Lógica de Cálculo', () => {
  it('calcula estimativa ilustrativa com piso mínimo de segurança', () => {
    const resSimples = calcularEstimativaExpressa('ate_4_8m', 'simples', 'baixa')
    expect(resSimples.minimo).toBeGreaterThanOrEqual(12_000)
    expect(resSimples.maximo).toBeGreaterThanOrEqual(resSimples.minimo)
    expect(resSimples.descricao).toContain('Simples')

    const resPresumido = calcularEstimativaExpressa('4_8m_50m', 'presumido', 'alta')
    expect(resPresumido.minimo).toBeGreaterThan(resSimples.minimo)
    expect(resPresumido.maximo).toBeGreaterThan(resSimples.maximo)

    const resReal = calcularEstimativaExpressa('acima_50m', 'real', 'alta')
    expect(resReal.maximo).toBeGreaterThan(100_000)
  })

  it('formata valores em K e Mi corretamente', () => {
    expect(formatarValorK(15_000)).toBe('R$ 15 mil')
    expect(formatarValorK(180_000)).toBe('R$ 180 mil')
    expect(formatarValorK(1_200_000)).toBe('R$ 1,2 mi')
    expect(formatarValorK(2_000_000)).toBe('R$ 2 mi')
  })
})

describe('Lead Scoring WhatsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('calcula score inicial e incrementa com cliques repetidos até o teto', () => {
    expect(calcularScoreLeadWhatsApp(1)).toBe(30)
    expect(calcularScoreLeadWhatsApp(2)).toBe(40)
    expect(calcularScoreLeadWhatsApp(3)).toBe(50)
    expect(calcularScoreLeadWhatsApp(10)).toBe(100)
    expect(calcularScoreLeadWhatsApp(15)).toBe(100)
  })

  it('não cria lead para usuário logado', async () => {
    const res = await registrarLeadCliqueWhatsApp({
      isAuthenticated: true,
      origem: 'whatsapp-home',
    })
    expect(res).toBeNull()
  })

  it('cria lead no primeiro clique de deslogado e atualiza no segundo de forma idempotente', async () => {
    const mockLeadCriado = { id: 'lead_abc_123', nome: 'Lead WhatsApp' } as any
    const spyCreate = vi.spyOn(leadsService, 'createLead').mockResolvedValue(mockLeadCriado)
    const spyUpdate = vi.spyOn(pb.collection('leads'), 'update').mockResolvedValue({
      id: 'lead_abc_123',
      mensagem: 'atualizado',
    } as any)

    // Primeiro clique
    const resultado1 = await registrarLeadCliqueWhatsApp({
      isAuthenticated: false,
      origem: 'whatsapp-home',
    })

    expect(spyCreate).toHaveBeenCalledTimes(1)
    expect(resultado1?.id).toBe('lead_abc_123')
    expect(sessionStorage.getItem('c50_whatsapp_lead_id')).toBe('lead_abc_123')
    expect(sessionStorage.getItem('c50_whatsapp_lead_clicks')).toBe('1')

    // Segundo clique na mesma sessão -> deve chamar update e NÃO createLead novamente
    await registrarLeadCliqueWhatsApp({
      isAuthenticated: false,
      origem: 'whatsapp-home',
    })

    expect(spyCreate).toHaveBeenCalledTimes(1) // mantem 1
    expect(spyUpdate).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('c50_whatsapp_lead_clicks')).toBe('2')
  })
})
