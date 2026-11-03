import type {
  ModuloTributo,
  TeseRecuperacaoDefinicao,
  TeseSelecaoUsuario,
} from '@/types/recuperadorCreditos'

/**
 * Camada de relacionamento da tese EST-04 "Cancelamento de NF-e e Devoluções (Estornos)"
 * com as demais teses do Recuperador de Créditos.
 *
 * IMPORTANTE: esta camada é EXCLUSIVAMENTE textual/orientativa (UI + parecer PDF).
 * NENHUMA função de cálculo do Recuperador é alterada ou lida por este módulo.
 */

export const TESE_CANCELAMENTO_ID = 'tese_cancelamento_nf_devolucoes_estornos'
export const TESE_CANCELAMENTO_CODIGO = 'EST-04'

/**
 * Nota técnica de interação por MÓDULO da tese relacionada (mapeamento genérico).
 * Redigida em linguagem técnico-contábil/tributária consistente com o parecer.
 */
const NOTAS_INTERACAO_POR_MODULO: Record<string, string> = {
  pis_cofins:
    'A recuperação de PIS/COFINS desta tese considera a base de cálculo apurada sobre as receitas escrituradas; cancelamentos de NF-e e devoluções (estornos de receita) reduzem a base efetivamente tributada e devem ser conciliados com os estornos de crédito correspondentes (art. 45, § 13, da LC 214/2025, incluído pela LC 227/2026), sem alterar o valor apurado por parâmetro nesta estimativa.',
  folha:
    'A recuperação previdenciária desta tese incide sobre folha de pagamento e verbas remuneratórias, não se confundindo com a receita de vendas; ainda assim, as devoluções e cancelamentos de NF-e auditados pela tese EST-04 devem ser conciliados com as receitas líquidas que balizam o enquadramento setorial (CPRB/FAP) informado nesta apuração, sem alterar o valor apurado por parâmetro nesta estimativa.',
  irpj_csll:
    'A recuperação de IRPJ/CSLL desta tese parte da receita bruta e das presunções legais; cancelamentos de NF-e e devoluções reduzem a receita bruta efetiva do período e devem ser conciliados com os ajustes fiscais correspondentes (art. 45, § 13, da LC 214/2025, incluído pela LC 227/2026), sem alterar o valor apurado por parâmetro nesta estimativa.',
  outros_tributos:
    'A recuperação estadual/municipal desta tese (ICMS, ISS ou ITCMD) utiliza bases que também são afetadas por cancelamentos de NF-e e devoluções; os estornos de débito e as notas devolutivas devem ser conciliados com a escrita fiscal que sustenta a apuração desta tese, nos termos do art. 10 e do art. 45, § 13, da LC 214/2025, sem alterar o valor apurado por parâmetro nesta estimativa.',
}

/** Notas específicas por tese (sobrepõem a nota genérica do módulo quando existentes). */
const NOTAS_INTERACAO_POR_TESE: Record<string, string> = {
  tese_pis_icms_base:
    'A exclusão do ICMS da base de cálculo do PIS/COFINS (Tema 69/STF) é apurada sobre o ICMS destacado nas notas de saída; cancelamentos extemporâneos e devoluções reduzem tanto a receita quanto o ICMS destacado do período e, portanto, os dois levantamentos devem ser conciliados na mesma escrita fiscal, sem alterar o valor apurado por parâmetro nesta estimativa.',
  tese_pis_iss_servicos:
    'A exclusão do ISS da base de cálculo do PIS/COFINS (Tema 118/STF) considera as notas de prestação de serviços; cancelamentos e devoluções dessas notas reduzem a base efetivamente faturada e devem ser conciliados com os estornos correspondentes (art. 45, § 13, da LC 214/2025), sem alterar o valor apurado por parâmetro nesta estimativa.',
  tese_pis_insumos_presumido:
    'A recuperação de insumos essenciais e de produtos sujeitos ao regime monofásico (Tema 329/STJ) considera o crédito presumido destacado pelo fabricante; cancelamentos e devoluções das operações de venda reduzem a base da apuração e devem ser conciliados com os estornos previstos no art. 45, § 13, da LC 214/2025, sem alterar o valor apurado por parâmetro nesta estimativa.',
  tese_icms_st_restituicao_base_efetiva:
    'A restituição da diferença de ICMS-ST paga a maior (Tema 201/STF) compara a base presuntivamente estimada com a efetiva; devoluções e cancelamentos de NF-e reduzem a base efetiva ao consumidor final e reforçam a necessidade de conciliação com os estornos da tese EST-04, sem alterar o valor apurado por parâmetro nesta estimativa.',
  tese_icms_energia_eletrica_comunicacao:
    'O creditamento de ICMS sobre energia elétrica e telecomunicações (LC 87/96, art. 33, II) incide sobre insumos/serviços de entrada e não sobre a receita de saída; ainda assim, as notas de devolução auditadas pela tese EST-04 podem carregar créditos vinculados às mesmas operações e devem ser conciliadas na mesma escrita fiscal, sem alterar o valor apurado por parâmetro nesta estimativa.',
}

/** Resumo mínimo de uma tese para a camada de relacionamento (UI e parecer). */
export interface TeseResumoInteracao {
  id: string
  modulo: ModuloTributo
  codigo?: string
  titulo?: string
}

export interface TeseRelacionadaEst04 {
  teseId: string
  codigo: string
  titulo: string
  notaInteracao: string
}

/**
 * Indica se a tese informada é afetada operacionalmente por cancelamentos/devoluções
 * (tese EST-04) e retorna o par "tese + nota técnica de interação".
 * Retorna null quando a tese não tem relação registrada.
 */
export function obterRelacaoComCancelamento(
  tese: TeseResumoInteracao,
): TeseRelacionadaEst04 | null {
  if (tese.id === TESE_CANCELAMENTO_ID) return null

  const nota = NOTAS_INTERACAO_POR_TESE[tese.id] || NOTAS_INTERACAO_POR_MODULO[tese.modulo] || null
  if (!nota) return null

  return {
    teseId: tese.id,
    codigo: tese.codigo || tese.id,
    titulo: tese.titulo || tese.id,
    notaInteracao: nota,
  }
}

/**
 * Lista as teses ATIVAS (exceto a própria EST-04) relacionadas a cancelamentos/devoluções,
 * na ordem em que aparecem no parecer. Exige que a própria EST-04 esteja ativa.
 */
export function listarTesesRelacionadasEst04(
  teses: TeseResumoInteracao[],
  selecao: Record<string, TeseSelecaoUsuario | { ativa?: boolean }>,
): TeseRelacionadaEst04[] {
  if (!isTeseCancelamentoAtiva(selecao as Record<string, TeseSelecaoUsuario>)) return []
  return teses
    .filter((t) => t.id !== TESE_CANCELAMENTO_ID)
    .filter((t) => (selecao[t.id]?.ativa ?? false) === true)
    .map((t) => obterRelacaoComCancelamento(t))
    .filter((r): r is TeseRelacionadaEst04 => r !== null)
}

/**
 * Indica se a tese EST-04 está ativa na seleção do usuário.
 */
export function isTeseCancelamentoAtiva(selecao: Record<string, TeseSelecaoUsuario>): boolean {
  return (selecao[TESE_CANCELAMENTO_ID]?.ativa ?? false) === true
}

/**
 * ANOTA (não filtra) a lista completa de teses elegíveis com a indicação
 * `relacionadaEst04`, preservando TODAS as teses do checklist.
 * Quando EST-04 não está ativa, todas ficam com `relacionadaEst04: false`.
 * A própria EST-04 nunca é marcada como relacionada a si mesma.
 */
export function marcarTesesRelacionadasEst04(
  teses: TeseRecuperacaoDefinicao[],
  est04Ativa: boolean,
): TeseRecuperacaoDefinicao[] {
  return teses.map((t) => ({
    ...t,
    relacionadaEst04: est04Ativa && t.id !== TESE_CANCELAMENTO_ID,
  }))
}
