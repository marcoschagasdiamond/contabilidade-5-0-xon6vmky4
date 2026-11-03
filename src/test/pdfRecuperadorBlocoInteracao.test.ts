/**
 * Suíte de testes do BLOCO "Interação com demais teses" (EST-04) no parecer PDF
 * do Recuperador de Créditos (gerarParecerRecuperadorPDF — src/lib/pdfRecuperadorCreditos.ts).
 *
 * Estratégia: o jsPDF é MOCADO por vi.mock com um documento falso que registra
 * todas as chamadas — as provas são sobre o CONTEÚDO efetivamente gerado no
 * parecer, sem navegador e sem alterar o app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gerarFakeDocJsPdf, type FakeDocJsPdf } from './fakeDocJsPdf'

// Referência mutável ao documento falso entregue pela classe mockada
const docPendente: { doc: FakeDocJsPdf | null } = { doc: null }

vi.mock('jspdf', () => {
  class JsPdfMock {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor() {
      Object.assign(this, gerarFakeDocJsPdf() as unknown as Record<string, unknown>)
      docPendente.doc = this as unknown as FakeDocJsPdf
    }
  }
  return { jsPDF: JsPdfMock }
})

// Os imports do módulo sob teste vêm APÓS o vi.mock (hoisting do Vitest)
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'
import { calcularRecuperadorCreditos, TESES_RECUPERADOR } from '@/lib/recuperadorCreditosCalculo'
import { TESE_CANCELAMENTO_ID } from '@/lib/relacionamentoEst04'
import type { ParametrosRecuperador } from '@/types/recuperadorCreditos'

const FATOR_SELIC_PADRAO = 1.3

const montarParametros = (idsAtivos: string[]): ParametrosRecuperador => {
  const teses: Record<
    string,
    { teseId: string; ativa: boolean; farol: 'verde' | 'amarelo' | 'vermelho' }
  > = {}
  TESES_RECUPERADOR.forEach((t) => {
    teses[t.id] = { teseId: t.id, ativa: idsAtivos.includes(t.id), farol: t.riscoPadrao }
  })

  return {
    configuracoes: {
      clienteId: null,
      empresa: 'Indústria Teste Ltda',
      cnpj: '12.345.678/0001-90',
      regimeAtual: 'Lucro Presumido',
      segmento: 'Comércio',
      uf: 'SP',
      anosFaturamento: [
        { ano: 2021, faturamento: 1200000, fatorSelicAcumulado: FATOR_SELIC_PADRAO },
      ],
      numeroMedioEmpregados: 10,
      percentualRotatividadeAnual: 15,
      massaSalarialMensal: 60000,
      aliquotaPatronalComposta: 26.8,
      aliquotaPisCofinsPadrao: 3.65,
    },
    teses,
  }
}

const gerarParecerComEstesAtivos = (idsAtivos: string[]): FakeDocJsPdf => {
  docPendente.doc = null
  const parametros = montarParametros(idsAtivos)
  gerarParecerRecuperadorPDF({
    nomeAnalise: 'Análise EST-04',
    parametros,
    resultados: calcularRecuperadorCreditos(parametros, { filtrarPorSetor: false }),
    clienteNome: 'Cliente Teste',
    empresa: 'Indústria Teste Ltda',
    cnpj: '12.345.678/0001-90',
    dataGeracao: '05/02/2026 10:00',
  })
  if (!docPendente.doc) throw new Error('Documento fake não foi criado pelo gerador de PDF')
  return docPendente.doc
}

const textosDoParecer = (doc: FakeDocJsPdf): string[] =>
  doc.calls
    .filter((c) => c.kind === 'text')
    .flatMap((c) => (Array.isArray(c.args[0]) ? (c.args[0] as unknown[]) : [c.args[0]]))
    .map((t) => String(t))

const contemTexto = (doc: FakeDocJsPdf, trecho: string): boolean =>
  textosDoParecer(doc).some((t) => t.includes(trecho))

describe('pdfRecuperadorCreditos — bloco "Interação com demais teses" (EST-04)', () => {
  beforeEach(() => {
    docPendente.doc = null
  })

  it('EST-04 + teses relacionadas ativas ⇒ bloco presente com nota por tese (inclui as 5 específicas)', () => {
    const doc = gerarParecerComEstesAtivos([
      TESE_CANCELAMENTO_ID,
      'tese_pis_icms_base', // Tema 69/STF
      'tese_pis_iss_servicos', // Tema 118/STF
      'tese_pis_insumos_presumido', // Tema 329/STJ
      'tese_icms_st_restituicao_base_efetiva', // Tema 201/STF
      'tese_icms_energia_eletrica_comunicacao', // LC 87/96, art. 33, II
      'tese_folha_inss_verbas_indenizatorias', // nota genérica de módulo (folha)
    ])

    // Título do bloco presente
    expect(contemTexto(doc, 'INTERAÇÃO COM DEMAIS TESES SELECIONADAS • EST-04')).toBe(true)

    // Nota técnica por tese: cabeçalho de cada tese relacionada presente
    const textos = textosDoParecer(doc)
    expect(textos.some((t) => t.startsWith('EST-04 • '))).toBe(false) // a própria EST-04 não se lista
    expect(textos.some((t) => t.startsWith('PIS-'))).toBe(true)
    expect(textos.some((t) => t.startsWith('FOLHA-'))).toBe(true)

    // Notas ESPECÍFICAS presentes no conteúdo do parecer (fragmentos únicos)
    const fragmentosEspecificos = [
      'Tema 69/STF',
      'Tema 118/STF',
      'Tema 329/STJ',
      'Tema 201/STF',
      'LC 87/96, art. 33, II',
    ]
    fragmentosEspecificos.forEach((frag) => {
      expect(contemTexto(doc, frag)).toBe(true)
    })

    // Nota genérica de módulo (folha) presente
    expect(contemTexto(doc, 'A recuperação previdenciária desta tese')).toBe(true)

    // Sem risco de nota de módulo PIS/COFINS nas teses com nota específica
    expect(contemTexto(doc, 'A recuperação de PIS/COFINS desta tese')).toBe(false)
  })

  it('EST-04 ativa SOZINHA (nenhuma relacionada ativa) ⇒ bloco AUSENTE', () => {
    const doc = gerarParecerComEstesAtivos([TESE_CANCELAMENTO_ID])

    expect(contemTexto(doc, 'INTERAÇÃO COM DEMAIS TESES')).toBe(false)
    // E nenhuma nota de interação é impressa
    expect(contemTexto(doc, 'Tema 69/STF')).toBe(false)
    expect(contemTexto(doc, 'A recuperação previdenciária desta tese')).toBe(false)
  })

  it('EST-04 desmarcada ⇒ bloco AUSENTE e nenhum badge "Relacionada à EST-04"', () => {
    const doc = gerarParecerComEstesAtivos([
      'tese_pis_icms_base',
      'tese_folha_inss_verbas_indenizatorias',
    ])

    expect(contemTexto(doc, 'INTERAÇÃO COM DEMAIS TESES')).toBe(false)
    expect(contemTexto(doc, 'Tema 69/STF')).toBe(false)
    expect(contemTexto(doc, 'Relacionada à EST-04')).toBe(false)
  })

  it('lista de teses do parecer permanece COMPLETA (todas as teses do motor são impressas nos 4 blocos)', () => {
    const doc = gerarParecerComEstesAtivos([
      TESE_CANCELAMENTO_ID,
      'tese_pis_icms_base',
      'tese_folha_inss_verbas_indenizatorias',
    ])

    const textos = textosDoParecer(doc)
    // TODAS as teses do motor aparecem nos 4 blocos (linhas de tabela), ativas ou não
    TESES_RECUPERADOR.forEach((tese) => {
      const esperado = tese.titulo.length > 46 ? tese.titulo.slice(0, 44) + '...' : tese.titulo
      expect(textos).toContain(esperado)
    })
    // Badges só fazem sentido na UI — o parecer não os imprime
    expect(textos.filter((t) => t === 'Relacionada à EST-04')).toHaveLength(0)
  })
})
