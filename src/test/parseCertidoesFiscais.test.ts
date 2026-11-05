import { describe, it, expect } from 'vitest'
import {
  avaliarValidadeCertidao,
  extrairDatasTexto,
  sugerirDadosCertidaoPorArquivo,
  obterAlertasValidadeCertidoes,
} from '../lib/parseCertidoesFiscais'
import { CertidaoFiscalRegistro } from '../types/dadosEmpresa'

describe('parseCertidoesFiscais - Etapa 1 da Integração Fiscal', () => {
  it('extrai datas no formato brasileiro DD/MM/AAAA para YYYY-MM-DD', () => {
    const texto = 'Certidão emitida em 15/03/2026 válida até 15/09/2026 código 1234.'
    const datas = extrairDatasTexto(texto)
    expect(datas).toEqual(['2026-03-15', '2026-09-15'])
  })

  it('avalia certidão vencida corretamente', () => {
    const ref = new Date(2026, 4, 1) // 01/05/2026
    const res = avaliarValidadeCertidao('2026-04-10', ref)
    expect(res.status).toBe('vencida')
    expect(res.diasRestantes).toBeLessThan(0)
    expect(res.mensagem).toContain('Vencida há')
  })

  it('avalia certidão próxima do vencimento (<= 30 dias)', () => {
    const ref = new Date(2026, 4, 1) // 01/05/2026
    const res = avaliarValidadeCertidao('2026-05-20', ref) // 19 dias
    expect(res.status).toBe('proxima_vencimento')
    expect(res.diasRestantes).toBe(19)
    expect(res.mensagem).toContain('Vence em 19 dias')
  })

  it('avalia certidão válida (> 30 dias)', () => {
    const ref = new Date(2026, 4, 1) // 01/05/2026
    const res = avaliarValidadeCertidao('2026-10-01', ref)
    expect(res.status).toBe('valida')
    expect(res.diasRestantes).toBeGreaterThan(30)
  })

  it('sugere tipo federal e órgão com base no nome do arquivo e texto', () => {
    const sugestao = sugerirDadosCertidaoPorArquivo(
      'CND_Federal_Receita_PGFN.pdf',
      'Certidão conjunta negativa de tributos federais e à dívida ativa da união. Emitida em 10/01/2026 com validade até 10/07/2026.',
    )
    expect(sugestao.tipo).toBe('cnd_federal')
    expect(sugestao.orgaoEmissor).toBe('Receita Federal / PGFN')
    expect(sugestao.situacao).toBe('negativa')
    expect(sugestao.dataEmissao).toBe('2026-01-10')
    expect(sugestao.dataValidade).toBe('2026-07-10')
  })

  it('sugere situação positiva com efeito de negativa quando houver parcelamento/suspensão', () => {
    const sugestao = sugerirDadosCertidaoPorArquivo(
      'certidao_estadual_sefaz.pdf',
      'Certidão positiva com efeitos de negativa de débitos fiscais. Débitos com exigibilidade suspensa.',
    )
    expect(sugestao.tipo).toBe('cnd_estadual')
    expect(sugestao.situacao).toBe('positiva_efeito_negativa')
    expect(sugestao.sugestoesFase3.parcelamentosEmCurso).toBe(true)
  })

  it('gera alertas consolidados identificando níveis de perigo e alerta', () => {
    const certidoes: CertidaoFiscalRegistro[] = [
      {
        id: '1',
        tipo: 'cnd_federal',
        nomeTipo: 'Federal',
        orgaoEmissor: 'RFB',
        situacao: 'negativa',
        nomeArquivo: 'cnd.pdf',
        fonte: 'manual',
        dataRegistro: new Date().toISOString(),
        dataValidade: '2020-01-01', // vencida
      },
    ]

    const alertas = obterAlertasValidadeCertidoes(certidoes)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].status).toBe('vencida')
    expect(alertas[0].nivel).toBe('perigo')
  })
})
