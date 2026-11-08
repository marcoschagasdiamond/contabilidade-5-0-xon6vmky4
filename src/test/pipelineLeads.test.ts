import { describe, it, expect } from 'vitest'
import {
  extrairScoreLead,
  extrairFonteLead,
  extrairEstagioPipelineLead,
  extrairValorPotencialLead,
  formatarValorCompacto,
  calcularDiasParado,
  calcularTempoPrimeiroContatoHoras,
  consolidarMetricasPipeline,
  calcularLeadQuenteEsquecido,
  processarLeadParaPipeline,
} from '@/lib/pipelineLeadUtils'
import type { LeadRecord } from '@/services/leads'
import type { LeadProcessado } from '@/types/pipelineLead'

describe('Pipeline de Leads - Utilitários e Lógica de Negócio', () => {
  it('extrai score e fonte de lead vindo de whatsapp-home', () => {
    const lead: Partial<LeadRecord> = {
      id: 'l1',
      nome: 'Lead WhatsApp',
      tipo_solicitacao: 'whatsapp-home (score: 50)',
      mensagem: '[Origem: whatsapp-home] Lead clicou no botão flutuante',
    }

    const score = extrairScoreLead(lead)
    const fonte = extrairFonteLead(lead)

    expect(score).toBe(50)
    expect(fonte).toBe('WhatsApp (Home)')
  })

  it('extrai score de formulário de proposta com dados enriquecidos', () => {
    const lead: Partial<LeadRecord> = {
      id: 'l2',
      nome: 'Lead Formulário',
      tipo_solicitacao: 'proposta',
      cnpj: '12.345.678/0001-90',
      telefone: '(41) 99999-9999',
      mensagem: 'Gostaria de proposta completa para migração de contabilidade',
    }

    const score = extrairScoreLead(lead)
    const fonte = extrairFonteLead(lead)

    expect(score).toBeGreaterThanOrEqual(60)
    expect(fonte).toContain('Formulário da Home (Proposta)')
  })

  it('reconhece lead de recuperacao-empresas com pontuacao alta no scoring', () => {
    const lead: Partial<LeadRecord> = {
      id: 'l_rec_emp',
      nome: 'Empresário em Dificuldade',
      tipo_solicitacao: 'recuperacao-empresas',
      cnpj: '11.222.333/0001-44',
      telefone: '(41) 97777-6666',
      mensagem: 'Frente: Aquisição com Investidores. Dívidas tributárias e bancárias.',
    }

    const score = extrairScoreLead(lead)
    const fonte = extrairFonteLead(lead)

    expect(score).toBeGreaterThanOrEqual(65)
    expect(fonte).toBe('Recuperação de Empresas & Dívidas')
  })

  it('respeita score numérico direto quando presente no registro', () => {
    const lead: Partial<LeadRecord> = {
      id: 'l3',
      nome: 'Lead com Score Direto',
      score: 85,
      tipo_solicitacao: 'contato',
    }

    expect(extrairScoreLead(lead)).toBe(85)
  })

  it('normaliza estágios do funil corretamente', () => {
    expect(extrairEstagioPipelineLead({ estagio_pipeline: 'novo' })).toBe('novo')
    expect(extrairEstagioPipelineLead({ estagio_pipeline: 'contato_feito' })).toBe('contato_feito')
    expect(extrairEstagioPipelineLead({ estagio_pipeline: 'reuniao' })).toBe('reuniao')
    expect(extrairEstagioPipelineLead({ estagio_pipeline: 'cliente' })).toBe('cliente')
    expect(extrairEstagioPipelineLead({})).toBe('novo')
  })

  it('detecta lead quente esquecido quando score >= 40 e sem interação recente', () => {
    const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { isQuenteEsquecido, diasSemInteracao } = calcularLeadQuenteEsquecido(
      70,
      'novo',
      tresDiasAtras,
      tresDiasAtras,
      1,
    )

    expect(isQuenteEsquecido).toBe(true)
    expect(diasSemInteracao).toBeGreaterThanOrEqual(2)
  })

  it('NÃO marca como quente esquecido se for cliente convertido', () => {
    const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { isQuenteEsquecido } = calcularLeadQuenteEsquecido(
      80,
      'cliente',
      tresDiasAtras,
      tresDiasAtras,
      2,
    )

    expect(isQuenteEsquecido).toBe(false)
  })

  it('NÃO marca como quente esquecido se score for baixo', () => {
    const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { isQuenteEsquecido } = calcularLeadQuenteEsquecido(
      20,
      'novo',
      tresDiasAtras,
      tresDiasAtras,
      1,
    )

    expect(isQuenteEsquecido).toBe(false)
  })

  it('processa LeadRecord completo gerando LeadProcessado com timeline', () => {
    const agora = new Date().toISOString()
    const lead: any = {
      id: 'rec_lead_01',
      nome: 'Empresa Alpha Ltda',
      email: 'contato@alpha.com.br',
      telefone: '(41) 98888-7777',
      empresa: 'Alpha Tecnologia',
      cnpj: '12.345.678/0001-00',
      segmento: 'Tecnologia',
      funcionarios: '6–20',
      tipo_solicitacao: 'proposta',
      created: agora,
      interacoes_json: [
        {
          id: 'int_1',
          data: agora,
          tipo: 'whatsapp',
          descricao: 'Contato inicial realizado via WhatsApp.',
        },
      ],
    }

    const processado = processarLeadParaPipeline(lead)
    expect(processado.id).toBe('rec_lead_01')
    expect(processado.estagio_pipeline).toBe('novo')
    expect(processado.interacoes.length).toBe(2) // origem + interacao registrada
    expect(processado.score).toBeGreaterThanOrEqual(60)
    expect(processado.valorPotencial).toBeGreaterThan(0)
    expect(typeof processado.diasParado).toBe('number')
  })

  it('extrai valor potencial a partir de campos e formatos variados de texto', () => {
    // 1. Campo numérico direto
    expect(extrairValorPotencialLead({ faturamento_estimado: 500_000 } as any)).toBe(500_000)
    expect(extrairValorPotencialLead({ faturamento: 1_200_000 } as any)).toBe(1_200_000)

    // 2. Texto com milhões
    expect(
      extrairValorPotencialLead({
        mensagem: 'Nossa empresa fatura cerca de R$ 2,5 mi por ano.',
      }),
    ).toBe(2_500_000)

    // 3. Texto com mil
    expect(
      extrairValorPotencialLead({
        mensagem: 'Previsão de faturamento mensal de R$ 350 mil.',
      }),
    ).toBe(350_000)

    // 4. Estimativa por funcionários
    expect(extrairValorPotencialLead({ funcionarios: '1–5' })).toBe(240_000)
    expect(extrairValorPotencialLead({ funcionarios: '51–200' })).toBe(4_800_000)
  })

  it('formata valor compacto em R$ corretamente', () => {
    expect(formatarValorCompacto(0)).toBe('R$ 0')
    expect(formatarValorCompacto(80_000)).toBe('R$ 80 mil')
    expect(formatarValorCompacto(1_500_000)).toBe('R$ 1,5 mi')
    expect(formatarValorCompacto(2_000_000_000)).toBe('R$ 2 bi')
  })

  it('calcula tempo até o primeiro contato em horas a partir de interações reais', () => {
    const criacao = '2026-11-01T10:00:00.000Z'
    const interacoes = [
      {
        id: 'origem_123',
        data: criacao,
        tipo: 'sistema' as const,
        descricao: 'Origem',
      },
      {
        id: 'int_real_1',
        data: '2026-11-01T14:30:00.000Z', // 4,5h depois
        tipo: 'whatsapp' as const,
        descricao: 'Primeiro contato por WhatsApp',
      },
    ]

    const horas = calcularTempoPrimeiroContatoHoras(criacao, interacoes)
    expect(horas).toBe(4.5)
  })

  it('consolida métricas completas do CRM (volume, conversão, tempo de resposta, quentes esfriando)', () => {
    const agora = new Date()
    const tresDiasAtras = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const cincoDiasAtras = new Date(agora.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

    const mockLeads: LeadProcessado[] = [
      {
        id: 'lead_1',
        nome: 'Lead Novo 1',
        empresa: 'Empresa A',
        email: 'a@a.com',
        telefone: '(11) 99999-0001',
        segmento: 'Serviços',
        funcionarios: '1–5',
        estagio_pipeline: 'novo',
        score: 75,
        fonte: 'WhatsApp',
        interacoes: [],
        isQuenteEsquecido: true,
        diasSemInteracao: 3,
        diasParado: 3,
        valorPotencial: 300_000,
        created: tresDiasAtras,
      },
      {
        id: 'lead_2',
        nome: 'Lead Contato 2',
        empresa: 'Empresa B',
        email: 'b@b.com',
        telefone: '(11) 99999-0002',
        segmento: 'Comércio',
        funcionarios: '6–20',
        estagio_pipeline: 'contato_feito',
        score: 45,
        fonte: 'Home',
        interacoes: [],
        isQuenteEsquecido: false,
        diasSemInteracao: 1,
        diasParado: 1,
        valorPotencial: 720_000,
        created: cincoDiasAtras,
        primeiroContatoEmHoras: 2.0,
      },
      {
        id: 'lead_3',
        nome: 'Cliente Convertido',
        empresa: 'Empresa C',
        email: 'c@c.com',
        telefone: '(11) 99999-0003',
        segmento: 'Tecnologia',
        funcionarios: '21–50',
        estagio_pipeline: 'cliente',
        score: 90,
        fonte: 'Indicação',
        interacoes: [],
        isQuenteEsquecido: false,
        diasSemInteracao: 0,
        diasParado: 0,
        valorPotencial: 1_800_000,
        created: cincoDiasAtras,
        primeiroContatoEmHoras: 1.0,
      },
    ]

    const metricas = consolidarMetricasPipeline(mockLeads)

    expect(metricas.totalLeads).toBe(3)
    expect(metricas.totalNovos).toBe(1)
    expect(metricas.totalConvertidos).toBe(1)
    expect(metricas.taxaConversaoNovoParaCliente).toBeCloseTo(33.3, 1)
    expect(metricas.leadsQuentesEsfriando).toBe(1)
    expect(metricas.valorPotencialTotal).toBe(2_820_000)
    expect(metricas.valorPotencialPorEstagio.novo).toBe(300_000)
    expect(metricas.valorPotencialPorEstagio.cliente).toBe(1_800_000)
    expect(metricas.tempoMedioPrimeiroContatoHoras).toBe(1.5)
    expect(metricas.tempoMedioPrimeiroContatoFormatado).toBe('1,5h')
  })

  it('permite parse de valores digitados no input inline de faturamento', async () => {
    const { parseValorDigitado } = await import('@/components/crm/EdicaoValorPotencialInline')
    expect(parseValorDigitado('500000')).toBe(500_000)
    expect(parseValorDigitado('500.000')).toBe(500_000)
    expect(parseValorDigitado('500.000,00')).toBe(500_000)
    expect(parseValorDigitado('R$ 1.500.000')).toBe(1_500_000)
    expect(parseValorDigitado('1,5 mi')).toBe(1_500_000)
    expect(parseValorDigitado('350 mil')).toBe(350_000)
    expect(parseValorDigitado('350k')).toBe(350_000)
    expect(parseValorDigitado('2m')).toBe(2_000_000)
    expect(parseValorDigitado('')).toBe(0)
    expect(parseValorDigitado('abc')).toBe(0)
  })
})
