import { describe, it, expect } from 'vitest'
import {
  extrairScoreLead,
  extrairFonteLead,
  extrairEstagioPipelineLead,
  calcularLeadQuenteEsquecido,
  processarLeadParaPipeline,
} from '@/lib/pipelineLeadUtils'
import type { LeadRecord } from '@/services/leads'

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
  })
})
