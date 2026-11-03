/**
 * Suíte de testes da camada de relacionamento da tese EST-04
 * "Cancelamento de NF-e e Devoluções (Estornos)" do Recuperador de Créditos.
 *
 * Nenhum comportamento do app é alterado — aqui apenas se PROVA que:
 * 1. marcarTesesRelacionadasEst04 anota a lista COMPLETA (nunca filtra);
 * 2. só as teses != EST-04 recebem relacionadaEst04=true e apenas com EST-04 ativa;
 * 3. obterRelacaoComCancelamento devolve a nota ESPECÍFICA da tese quando
 *    registrada (Temas 69, 118, 329, 201 e LC 87 art. 33, II) e a nota do
 *    módulo nas demais — as específicas sobrescrevem as de módulo;
 * 4. listarTesesRelacionadasEst04 só retorna teses quando EST-04 está ativa.
 */
import { describe, it, expect } from 'vitest'
import {
  TESE_CANCELAMENTO_ID,
  marcarTesesRelacionadasEst04,
  listarTesesRelacionadasEst04,
  obterRelacaoComCancelamento,
  isTeseCancelamentoAtiva,
  type TeseResumoInteracao,
} from '@/lib/relacionamentoEst04'
import { TESES_RECUPERADOR } from '@/lib/recuperadorCreditosCalculo'
import type { TeseRecuperacaoDefinicao, TeseSelecaoUsuario } from '@/types/recuperadorCreditos'

const teseReal = (id: string): TeseRecuperacaoDefinicao => {
  const tese = TESES_RECUPERADOR.find((t) => t.id === id)
  if (!tese) throw new Error(`Tese real não encontrada no motor: ${id}`)
  return tese
}

/** Lista COMPLETA (24 teses do motor), na ordem do checklist do Recuperador. */
const listaCompletaReal = (): TeseRecuperacaoDefinicao[] => TESES_RECUPERADOR.map((t) => ({ ...t }))

const resumoReal = (id: string): TeseResumoInteracao => {
  const tese = teseReal(id)
  return { id: tese.id, modulo: tese.modulo, codigo: tese.codigo, titulo: tese.titulo }
}

/** Monta uma seleção completa (todas as teses) com ativação apenas nos ids informados. */
const selecaoComAtivas = (idsAtivos: string[]): Record<string, { ativa: boolean }> => {
  const map: Record<string, { ativa: boolean }> = {}
  TESES_RECUPERADOR.forEach((t) => {
    map[t.id] = { ativa: idsAtivos.includes(t.id) }
  })
  return map
}

describe('relacionamentoEst04 — marcarTesesRelacionadasEst04 (anotação sem filtro)', () => {
  it('anota a lista COMPLETA: nenhuma tese sai da lista (mesma quantidade, mesmos ids, mesma ordem)', () => {
    const original = listaCompletaReal()
    const anotada = marcarTesesRelacionadasEst04(original, true)

    expect(anotada).toHaveLength(original.length)
    expect(anotada.map((t) => t.id)).toEqual(original.map((t) => t.id))
  })

  it('com EST-04 ativa, apenas as teses != EST-04 recebem relacionadaEst04=true', () => {
    const anotada = marcarTesesRelacionadasEst04(listaCompletaReal(), true)

    const marcadas = anotada.filter((t) => t.relacionadaEst04 === true)
    const naoMarcadas = anotada.filter((t) => t.relacionadaEst04 !== true)

    // O motor tem 24 teses: 1 é a própria EST-04 → 23 relacionadas
    expect(anotada).toHaveLength(24)
    expect(marcadas).toHaveLength(23)
    expect(naoMarcadas).toHaveLength(1)
    expect(naoMarcadas[0].id).toBe(TESE_CANCELAMENTO_ID)
    // A própria EST-04 nunca é marcada como relacionada a si mesma
    const est04 = anotada.find((t) => t.id === TESE_CANCELAMENTO_ID)!
    expect(est04.relacionadaEst04).toBe(false)
  })

  it('com EST-04 inativa, NENHUMA tese recebe relacionadaEst04=true', () => {
    const anotada = marcarTesesRelacionadasEst04(listaCompletaReal(), false)
    expect(anotada.some((t) => t.relacionadaEst04 === true)).toBe(false)
    expect(anotada.every((t) => t.relacionadaEst04 === false)).toBe(true)
  })

  it('não muta a lista original (map puro) e preserva os demais campos da tese', () => {
    const original = listaCompletaReal()
    const copiaDefesa = JSON.stringify(original)
    const anotada = marcarTesesRelacionadasEst04(original, true)

    expect(JSON.stringify(original)).toBe(copiaDefesa)
    const teseAnotada = anotada.find((t) => t.id === 'tese_pis_icms_base')!
    expect(teseAnotada.titulo).toBe(teseReal('tese_pis_icms_base').titulo)
    expect(teseAnotada.codigo).toBe(teseReal('tese_pis_icms_base').codigo)
    expect(teseAnotada.modulo).toBe(teseReal('tese_pis_icms_base').modulo)
  })
})

describe('relacionamentoEst04 — isTeseCancelamentoAtiva', () => {
  it('reconhece EST-04 ativa e rejeita ausência/desmarcada', () => {
    const selecaoAtiva: Record<string, TeseSelecaoUsuario> = {
      [TESE_CANCELAMENTO_ID]: { teseId: TESE_CANCELAMENTO_ID, ativa: true, farol: 'verde' },
    }
    expect(isTeseCancelamentoAtiva(selecaoAtiva)).toBe(true)

    const selecaoInativa: Record<string, TeseSelecaoUsuario> = {
      [TESE_CANCELAMENTO_ID]: { teseId: TESE_CANCELAMENTO_ID, ativa: false, farol: 'verde' },
    }
    expect(isTeseCancelamentoAtiva(selecaoInativa)).toBe(false)
    expect(isTeseCancelamentoAtiva({})).toBe(false)
  })
})

describe('relacionamentoEst04 — obterRelacaoComCancelamento (notas por tese e por módulo)', () => {
  it('EST-04 nunca tem relação com si mesma (retorna null)', () => {
    expect(obterRelacaoComCancelamento(resumoReal(TESE_CANCELAMENTO_ID))).toBeNull()
  })

  it('devolve a nota ESPECÍFICA do Tema 69 (tese_pis_icms_base), não a genérica do módulo', () => {
    const rel = obterRelacaoComCancelamento(resumoReal('tese_pis_icms_base'))
    expect(rel).not.toBeNull()
    expect(rel!.notaInteracao).toContain('Tema 69/STF')
    expect(rel!.notaInteracao).not.toContain('A recuperação de PIS/COFINS desta tese')
  })

  it('devolve a nota ESPECÍFICA do Tema 118 (tese_pis_iss_servicos), não a genérica do módulo', () => {
    const rel = obterRelacaoComCancelamento(resumoReal('tese_pis_iss_servicos'))
    expect(rel).not.toBeNull()
    expect(rel!.notaInteracao).toContain('Tema 118/STF')
    expect(rel!.notaInteracao).not.toContain('A recuperação de PIS/COFINS desta tese')
  })

  it('devolve a nota ESPECÍFICA do Tema 329 (tese_pis_insumos_presumido), não a genérica do módulo', () => {
    const rel = obterRelacaoComCancelamento(resumoReal('tese_pis_insumos_presumido'))
    expect(rel).not.toBeNull()
    expect(rel!.notaInteracao).toContain('Tema 329/STJ')
    expect(rel!.notaInteracao).not.toContain('A recuperação de PIS/COFINS desta tese')
  })

  it('devolve a nota ESPECÍFICA do Tema 201 (tese_icms_st_restituicao_base_efetiva)', () => {
    const rel = obterRelacaoComCancelamento(resumoReal('tese_icms_st_restituicao_base_efetiva'))
    expect(rel).not.toBeNull()
    expect(rel!.notaInteracao).toContain('Tema 201/STF')
    expect(rel!.notaInteracao).not.toContain('A recuperação estadual/municipal desta tese')
  })

  it('devolve a nota ESPECÍFICA da LC 87 art. 33, II (tese_icms_energia_eletrica_comunicacao)', () => {
    const rel = obterRelacaoComCancelamento(resumoReal('tese_icms_energia_eletrica_comunicacao'))
    expect(rel).not.toBeNull()
    expect(rel!.notaInteracao).toContain('LC 87/96, art. 33, II')
    expect(rel!.notaInteracao).not.toContain('A recuperação estadual/municipal desta tese')
  })

  it('devolve nota de MÓDULO para tese sem nota específica (folha e pis_cofins genérica)', () => {
    const relFolha = obterRelacaoComCancelamento(
      resumoReal('tese_folha_inss_verbas_indenizatorias'),
    )
    expect(relFolha).not.toBeNull()
    expect(relFolha!.notaInteracao).toContain('A recuperação previdenciária desta tese')
    expect(relFolha!.notaInteracao).not.toContain('Tema 69/STF')

    const relPisGenerica = obterRelacaoComCancelamento(resumoReal('tese_pis_subvencao_icms'))
    expect(relPisGenerica).not.toBeNull()
    expect(relPisGenerica!.notaInteracao).toContain('A recuperação de PIS/COFINS desta tese')
  })

  it('as notas específicas SOBREPÕEM a nota de módulo nas 5 teses registradas', () => {
    // Marcador inicial da nota genérica de cada módulo (NOTAS_INTERACAO_POR_MODULO)
    const marcadorModulo: Record<string, string> = {
      pis_cofins: 'A recuperação de PIS/COFINS desta tese',
      folha: 'A recuperação previdenciária desta tese',
      irpj_csll: 'A recuperação de IRPJ/CSLL desta tese',
      outros_tributos: 'A recuperação estadual/municipal desta tese',
    }
    // Marcador distinto da nota ESPECÍFICA de cada tese (NOTAS_INTERACAO_POR_TESE)
    const marcadorEspecifico: Record<string, string> = {
      tese_pis_icms_base: 'Tema 69/STF',
      tese_pis_iss_servicos: 'Tema 118/STF',
      tese_pis_insumos_presumido: 'Tema 329/STJ',
      tese_icms_st_restituicao_base_efetiva: 'Tema 201/STF',
      tese_icms_energia_eletrica_comunicacao: 'LC 87/96, art. 33, II',
    }

    Object.keys(marcadorEspecifico).forEach((id) => {
      const rel = obterRelacaoComCancelamento(resumoReal(id))
      expect(rel).not.toBeNull()
      const modulo = teseReal(id).modulo
      // Nota ESPECÍFICA presente e nota de módulo AUSENTE = sobreposição efetiva
      expect(rel!.notaInteracao).toContain(marcadorEspecifico[id])
      expect(rel!.notaInteracao).not.toContain(marcadorModulo[modulo])
    })
  })
})

describe('relacionamentoEst04 — listarTesesRelacionadasEst04 (exige EST-04 ativa)', () => {
  it('EST-04 inativa ⇒ lista vazia, mesmo com outras teses ativas', () => {
    const lista = listarTesesRelacionadasEst04(
      TESES_RECUPERADOR.map((t) => resumoReal(t.id)),
      selecaoComAtivas(['tese_pis_icms_base', 'tese_folha_inss_verbas_indenizatorias']),
    )
    expect(lista).toHaveLength(0)
  })

  it('EST-04 ativa ⇒ lista apenas com relacionadas ATIVAS (nunca a própria EST-04), com nota por tese', () => {
    const lista = listarTesesRelacionadasEst04(
      TESES_RECUPERADOR.map((t) => resumoReal(t.id)),
      selecaoComAtivas([
        TESE_CANCELAMENTO_ID,
        'tese_pis_icms_base',
        'tese_folha_inss_verbas_indenizatorias',
      ]),
    )
    expect(lista).toHaveLength(2)
    expect(lista.map((r) => r.teseId).sort()).toEqual([
      'tese_folha_inss_verbas_indenizatorias',
      'tese_pis_icms_base',
    ])
    expect(lista.find((r) => r.teseId === 'tese_pis_icms_base')!.notaInteracao).toContain(
      'Tema 69/STF',
    )
  })
})
