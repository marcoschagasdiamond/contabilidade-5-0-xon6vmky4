import { describe, it, expect } from 'vitest'
import {
  mapearColunasIbsCbs,
  planilhaTemColunasIbsCbs,
  extrairIbsCbsDePlanilha,
} from '../lib/parseIbsCbsPlanilha'
import type { LinhaPlanilhaBruta } from '../lib/importacaoFaturamento'

/** Helper: monta linhas a partir de cabeçalho + matriz de valores. */
function montarLinhas(
  colunas: string[],
  valores: (string | number | null)[][],
): LinhaPlanilhaBruta[] {
  return valores.map((vals) => {
    const linha: LinhaPlanilhaBruta = {}
    colunas.forEach((c, i) => {
      const v = vals[i]
      if (v !== null && v !== undefined) linha[c] = String(v)
    })
    return linha
  })
}

describe('parseIbsCbsPlanilha - Extração IBS/CBS de planilhas (CSV/XLSX)', () => {
  describe('mapearColunasIbsCbs - variações de cabeçalho reconhecidas', () => {
    it('deve reconhecer cabeçalhos canônicos (IBS, CBS, vIBS, vCBS, cClassTrib, CST IBS/CBS, Crédito IBS/CBS)', () => {
      const colunas = [
        'Data',
        'IBS',
        'CBS',
        'vIBS',
        'vCBS',
        'cClassTrib',
        'CST IBS/CBS',
        'Crédito IBS/CBS',
      ]
      const m = mapearColunasIbsCbs(colunas)
      // mapearColunasIbsCbs retorna a PRIMEIRA coluna que casa cada papel
      expect(m.colIbs).toBe('IBS')
      expect(m.colCbs).toBe('CBS')
      expect(m.colCClassTrib).toBe('cClassTrib')
      expect(m.colCst).toBe('CST IBS/CBS')
      expect(m.colCreditoIbsCbs).toBe('Crédito IBS/CBS')
    })

    it('deve reconhecer variações de caixa, espaços e acentos', () => {
      const m = mapearColunasIbsCbs([
        'VALOR IBS ',
        'valor cbs',
        'IBS_Destacado',
        'CBS_Total',
        'Classificação Tributária',
        'CST IBS',
        'Credito IBS/CBS Apurado',
      ])
      expect(m.colIbs).toBe('VALOR IBS ')
      expect(m.colCbs).toBe('valor cbs')
      expect(m.colCClassTrib).toBe('Classificação Tributária')
      expect(m.colCst).toBe('CST IBS')
      expect(m.colCreditoIbsCbs).toBe('Credito IBS/CBS Apurado')
    })

    it('deve reconhecer formatos alternativos com underline, total e vírgula no crédito', () => {
      const m = mapearColunasIbsCbs([
        'ibs_total',
        'cbs_total',
        'credito_ibs_cbs_apurado',
        'CST do IBS',
      ])
      expect(m.colIbs).toBe('ibs_total')
      expect(m.colCbs).toBe('cbs_total')
      expect(m.colCreditoIbsCbs).toBe('credito_ibs_cbs_apurado')
      expect(m.colCst).toBe('CST do IBS')
    })

    it('NÃO deve reconhecer cabeçalhos que só lembram IBS/CBS sem casar os termos (ex.: CST puro, Impostos)', () => {
      const m = mapearColunasIbsCbs(['CST', 'Impostos', 'Valor Total', 'Data'])
      expect(Object.keys(m)).toHaveLength(0)
    })
  })

  describe('planilha SEM colunas de IBS/CBS - saída idêntica à anterior', () => {
    it('mapearColunasIbsCbs e planilhaTemColunasIbsCbs indicam ausência', () => {
      const colunas = ['Data', 'Faturamento', 'Compras', 'Folha']
      expect(mapearColunasIbsCbs(colunas)).toEqual({})
      expect(planilhaTemColunasIbsCbs(colunas)).toBe(false)
    })

    it('extrairIbsCbsDePlanilha retorna objeto vazio (sem campos, sem erro) mesmo com linhas de dados', () => {
      const colunas = ['Data', 'Faturamento', 'Compras']
      const linhas = montarLinhas(colunas, [
        ['2026-01-31', '100000,00', '40000,00'],
        ['2026-02-28', '120000,00', '45000,00'],
      ])
      expect(() => extrairIbsCbsDePlanilha(linhas, colunas)).not.toThrow()
      expect(extrairIbsCbsDePlanilha(linhas, colunas)).toEqual({})
    })

    it('extrairIbsCbsDePlanilha com linhas vazias também retorna objeto vazio', () => {
      const colunas = ['IBS', 'CBS']
      expect(extrairIbsCbsDePlanilha([], colunas)).toEqual({})
    })
  })

  describe('extração completa - todos os campos presentes', () => {
    const colunas = ['Mês', 'IBS', 'CBS', 'CST IBS/CBS', 'cClassTrib', 'Crédito IBS/CBS']
    const linhas = montarLinhas(colunas, [
      ['2026-01', '1.234,56', '567,89', '000', '000001', '100,00'],
      ['2026-02', '2000,00', '900,00', '411', '000002', '150,50'],
      ['2026-03', '765,44', '532,11', '000', '000001', '49,50'],
    ])

    it('deve somar IBS e CBS destacados com arredondamento a 2 casas', () => {
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(4000)
      expect(r.cbsDestacado).toBe(2000)
    })

    it('deve coletar CST e cClassTrib distintos, sem duplicar, preservando ordem de aparição', () => {
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.cstIbsCbsDetectados).toEqual(['000', '411'])
      expect(r.cClassTribDetectados).toEqual(['000001', '000002'])
    })

    it('deve somar o crédito apurado e arredondar', () => {
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.creditoIbsCbsApurado).toBe(300)
    })

    it('deve arredondar somas com ruído de ponto flutuante (0,1 + 0,2)', () => {
      const colunasFloat = ['IBS']
      const linhasFloat = montarLinhas(colunasFloat, [['0,1'], ['0,2']])
      expect(extrairIbsCbsDePlanilha(linhasFloat, colunasFloat).ibsDestacado).toBe(0.3)
    })
  })

  describe('valores sujos - célula vazia, texto, vírgula/ponto e negativos', () => {
    const colunas = ['IBS', 'CBS', 'CST IBS/CBS', 'cClassTrib']

    it('deve ignorar células vazias e texto sem número (não soma, não lança erro)', () => {
      const linhas = montarLinhas(colunas, [
        ['100,00', '', '000', ''],
        ['isento', 'N/A', '', 'sem classe'],
        ['R$ 50,00', '---', '000', '000001'],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(150)
      expect(r.cbsDestacado).toBeUndefined()
      expect(r.cstIbsCbsDetectados).toEqual(['000'])
      // Corrigido: texto livre ("sem classe") NÃO entra como código detectado
      expect(r.cClassTribDetectados).toEqual(['000001'])
    })

    it('cClassTrib aceita códigos com separadores típicos (ponto/hífen) e descarta texto alfabético', () => {
      const linhas = montarLinhas(colunas, [
        ['100,00', '', '000', '000.001'],
        ['100,00', '', '000', '000-002'],
        ['100,00', '', '000', 'isento'],
        ['100,00', '', '000', '000003'],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.cClassTribDetectados).toEqual(['000.001', '000-002', '000003'])
      expect(r.ibsDestacado).toBe(400)
    })

    it('deve aceitar vírgula decimal BR (1.234,56) e ponto decimal (1234.56)', () => {
      const linhas = montarLinhas(colunas, [
        ['1.234,56', '1234.56', '', ''],
        ['0,44', '0,44', '', ''],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(1235)
      expect(r.cbsDestacado).toBe(1235)
    })

    it('deve tratar negativos com hífen e com parênteses (estornos) e mantê-los na soma', () => {
      const linhas = montarLinhas(colunas, [
        ['500,00', '300,00', '', ''],
        ['-150,25', '(50,00)', '', ''],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(349.75)
      expect(r.cbsDestacado).toBe(250)
    })

    it('planilha cuja soma final é zero (ex.: +100 e -100) grava ibsDestacado = 0 (corrigido)', () => {
      const linhas = montarLinhas(colunas, [
        ['100,00', '', '', ''],
        ['-100,00', '', '', ''],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      // Corrigido: valor zerado é diferente de "coluna ausente/sem valor válido"
      expect(r.ibsDestacado).toBe(0)
      expect(r.cbsDestacado).toBeUndefined()
      expect(Object.keys(r)).toEqual(['ibsDestacado'])
    })

    it('células com número negativo puro (número real do XLSX, negativo) entram na soma', () => {
      // XLSX real pode entregar a célula como número nativo (não string)
      const linhas = [{ IBS: -75.5 }, { IBS: '300,00' }] as unknown as LinhaPlanilhaBruta[]
      expect(extrairIbsCbsDePlanilha(linhas, colunas).ibsDestacado).toBe(224.5)
    })
  })

  describe('planilha parcial - só IBS preenchido (sem CBS)', () => {
    const colunas = ['Mês', 'IBS', 'CBS', 'CST IBS/CBS', 'cClassTrib', 'Crédito IBS/CBS']

    it('deve retornar apenas ibsDestacado quando só a coluna IBS tem valores', () => {
      const linhas = montarLinhas(colunas, [
        ['2026-01', '1000,00', '', '', '', ''],
        ['2026-02', '250,50', '', '', '', ''],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(1250.5)
      expect(r.cbsDestacado).toBeUndefined()
      expect(r.cstIbsCbsDetectados).toBeUndefined()
      expect(r.cClassTribDetectados).toBeUndefined()
      expect(r.creditoIbsCbsApurado).toBeUndefined()
      expect(Object.keys(r)).toEqual(['ibsDestacado'])
    })

    it('coluna CST presente mas com valores só em algumas linhas: coleta apenas os preenchidos', () => {
      const linhas = montarLinhas(colunas, [
        ['2026-01', '100,00', '', '200', '', ''],
        ['2026-02', '100,00', '', '', '', ''],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.cstIbsCbsDetectados).toEqual(['200'])
      expect(r.ibsDestacado).toBe(200)
      expect(r.cbsDestacado).toBeUndefined()
    })

    it('coluna de crédito preenchida e coluna CBS vazia: creditoIbsCbsApurado presente, cbsDestacado ausente', () => {
      const linhas = montarLinhas(colunas, [
        ['2026-01', '100,00', '', '', '', '30,00'],
        ['2026-02', '100,00', '', '', '', '20,00'],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(200)
      expect(r.cbsDestacado).toBeUndefined()
      expect(r.creditoIbsCbsApurado).toBe(50)
    })

    it('crédito apurado zerado (células vazias) não gera campo creditoIbsCbsApurado', () => {
      const linhas = montarLinhas(colunas, [['2026-01', '100,00', '', '', '', '']])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.creditoIbsCbsApurado).toBeUndefined()
      expect(r.ibsDestacado).toBe(100)
    })
  })

  describe('créditos separados (Crédito IBS + Crédito CBS) e colisões de cabeçalho - comportamento corrigido', () => {
    it('deve somar créditos separados de IBS e CBS quando não há coluna combinada', () => {
      const colunas = ['IBS', 'CBS', 'Crédito de IBS', 'Crédito de CBS']
      const linhas = montarLinhas(colunas, [
        ['1000,00', '500,00', '80,00', '40,00'],
        ['1000,00', '500,00', '70,00', '60,00'],
      ])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(2000)
      expect(r.cbsDestacado).toBe(1000)
      expect(r.creditoIbsCbsApurado).toBe(250)
    })

    it('colunas "Crédito IBS"/"Crédito CBS" sem coluna dedicada gravam SÓ o crédito (corrigido)', () => {
      // "Crédito IBS" contém "ibs" e "Crédito CBS" contém "cbs" — corrigido: os
      // papéis de crédito reivindicam a coluna primeiro e os valores destacados
      // NÃO são poluídos pelo crédito.
      const colunas = ['Crédito IBS', 'Crédito CBS']
      const linhas = montarLinhas(colunas, [['100,00', '50,00']])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBeUndefined()
      expect(r.cbsDestacado).toBeUndefined()
      expect(r.creditoIbsCbsApurado).toBe(150)
      expect(Object.keys(r)).toEqual(['creditoIbsCbsApurado'])
    })

    it('coluna CST listada ANTES da coluna IBS é reconhecida como CST e NÃO soma códigos nos destacados (corrigido)', () => {
      // Corrigido: papéis mais específicos (CST, crédito, cClassTrib) reivindicam
      // suas colunas antes dos de valor; "CST IBS/CBS" não vira coluna de IBS.
      const colunas = ['CST IBS/CBS', 'IBS', 'CBS']
      const linhas = montarLinhas(colunas, [['900', '10,00', '5,00']])
      const m = mapearColunasIbsCbs(colunas)
      expect(m.colCst).toBe('CST IBS/CBS')
      expect(m.colIbs).toBe('IBS')
      expect(m.colCbs).toBe('CBS')
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(10)
      expect(r.cbsDestacado).toBe(5)
      expect(r.cstIbsCbsDetectados).toEqual(['900'])
    })

    it('com coluna IBS dedicada antes do crédito, não há colisão (cada papel pega sua coluna)', () => {
      const colunas = ['IBS', 'Crédito IBS', 'CBS', 'Crédito CBS']
      const linhas = montarLinhas(colunas, [['1000,00', '80,00', '500,00', '40,00']])
      const r = extrairIbsCbsDePlanilha(linhas, colunas)
      expect(r.ibsDestacado).toBe(1000)
      expect(r.cbsDestacado).toBe(500)
      expect(r.creditoIbsCbsApurado).toBe(120)
    })
  })
})
