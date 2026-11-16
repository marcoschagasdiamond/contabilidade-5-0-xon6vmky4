import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcularEstimativaExpressa,
  formatarValorK,
  calcularFaixaLucroRealExpressa,
} from '@/components/home/WidgetSimulacaoExpressa'
import {
  calcularScoreLeadWhatsApp,
  calcularScoreLeadSimulacaoExpressa,
  ORIGEM_LEAD_SIMULACAO_EXPRESSA_VEDACAO,
  registrarLeadCliqueWhatsApp,
  registrarLeadSimulacaoExpressa,
} from '@/services/leadWhatsApp'
import { matrizVedacoesDoPerfil, temVedacaoAnonima } from '@/lib/simulacaoExpressaVedacoes'
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

describe('WidgetSimulacaoExpressa - Faixa Lucro Real mensal (conservadora)', () => {
  it('devolve faixa mensal positiva, com mínimo ≤ máximo, e cresce com as compras', () => {
    const baixa = calcularFaixaLucroRealExpressa('ate_4_8m', 'baixa')
    const alta = calcularFaixaLucroRealExpressa('ate_4_8m', 'alta')
    expect(baixa.minimo).toBeGreaterThanOrEqual(0)
    expect(baixa.maximo).toBeGreaterThanOrEqual(baixa.minimo)
    expect(alta.maximo).toBeGreaterThan(baixa.maximo)
  })

  it('nunca inventa número único: mínimo e máximo são distintos (faixa real)', () => {
    const faixa = calcularFaixaLucroRealExpressa('4_8m_50m', 'media')
    expect(faixa.maximo).toBeGreaterThan(faixa.minimo)
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

describe('Simulação Expressa - Vedações ao Simples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('detecta vedação anônima só quando há situação marcada', () => {
    expect(temVedacaoAnonima([])).toBe(false)
    expect(temVedacaoAnonima(['debito_inss_fazenda'])).toBe(true)
    expect(temVedacaoAnonima(['socio_outra_empresa'])).toBe(true)
  })

  it('score do lead cresce com situações de vedação marcadas (caso complexo)', () => {
    expect(calcularScoreLeadSimulacaoExpressa([])).toBe(30)
    expect(calcularScoreLeadSimulacaoExpressa(['debito_inss_fazenda'])).toBe(50)
    expect(calcularScoreLeadSimulacaoExpressa(['debito_inss_fazenda', 'socio_outra_empresa'])).toBe(
      70,
    )
  })

  it('lead da simulação com vedação usa origem indicando vedação e score maior', async () => {
    const spyCreate = vi
      .spyOn(leadsService, 'createLead')
      .mockResolvedValue({ id: 'lead_sim_ved' } as any)

    await registrarLeadSimulacaoExpressa({
      isAuthenticated: false,
      selecionadas: ['debito_inss_fazenda'],
      faturamento: 'Até R$ 4,8 mi',
      regime: 'Simples Nacional',
    })

    expect(spyCreate).toHaveBeenCalledTimes(1)
    const payload = spyCreate.mock.calls[0][0]
    expect(payload.fonte).toBe(ORIGEM_LEAD_SIMULACAO_EXPRESSA_VEDACAO)
    expect(payload.score).toBe(50)
    expect(payload.mensagem).toContain('vedação ao Simples')
    expect(payload.mensagem).toContain('Débito com INSS ou Fazendas Públicas')
    expect(sessionStorage.getItem('c50_simulacao_expressa_lead_id')).toBe('lead_sim_ved')
  })

  it('lead da simulação sem vedação mantém score base e origem padrão', async () => {
    const spyCreate = vi
      .spyOn(leadsService, 'createLead')
      .mockResolvedValue({ id: 'lead_sim_ok' } as any)

    await registrarLeadSimulacaoExpressa({ isAuthenticated: false })

    expect(spyCreate).toHaveBeenCalledTimes(1)
    const payload = spyCreate.mock.calls[0][0]
    expect(payload.fonte).toBe('Simulação Expressa (home)')
    expect(payload.score).toBe(30)
  })

  it('monta matriz de vedações do perfil da fonte mestra (nível logado)', () => {
    const vazia = matrizVedacoesDoPerfil(null)
    expect(vazia.origemCadastro).toBe(false)

    const comVedacao = matrizVedacoesDoPerfil({
      vedacoesSimplesArt17: ['inc1_debitos_fazenda'],
      vedacaoSimplesArt17Outra: '',
      vedacoesPresumido: [],
      vedacaoPresumidoOutra: '',
      vedacoesMei: [],
      vedacaoMeiOutra: '',
    })
    expect(comVedacao.origemCadastro).toBe(true)
    expect(comVedacao.vedadosSimples).toBe(true)
    expect(comVedacao.vedadosPresumido).toBe(false)
  })
})
