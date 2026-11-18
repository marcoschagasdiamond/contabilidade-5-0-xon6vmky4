/**
 * Catálogo curado de cClassTrib (classificação tributária oficial — LC 214/2025).
 *
 * ESCOPO PRAGMÁTICO: apenas os códigos das teses/hipóteses que o sistema já usa
 * (não é o catálogo completo da Receita). Valores conferidos nos exemplos-oficiais
 * do repo ReceitaFederal/calculadora-rtc-regime-regular v1.6.1 (exemplos.md),
 * conforme mapeados em src/lib/casosOficiaisRtc.ts — NENHUMA fórmula alterada.
 *
 * Fontes citáveis: LC 214/2025 (arts. 8º, 43, 128–134, 146; Anexo XII).
 */

export interface EntradaCClasTrib {
  /** Código oficial cClassTrib (6 dígitos). */
  codigo: string
  descricao: string
  /** Tese/hipótese do sistema a que o código se vincula. */
  teseRelacionada: string
  /** RegimeOperacao da Calculadora IBS/CBS correspondente, quando houver. */
  regimeOperacaoVinculado?: string
  /** Subatividade da Calculadora correspondente, quando houver. */
  subatividadeVinculada?: string
  /** Fundamentação legal citável (LC 214/2025, artigo correspondente). */
  fundamentacaoLegal: string
  /** NCM/NBS de referência vinculada ao código (quando aplicável). */
  codigosNcmNbs?: string[]
  /** Observação técnica (ex.: caso-oficial RTC que consagra o código). */
  nota?: string
}

export const CATALOGO_C_CLAS_TRIB: EntradaCClasTrib[] = [
  {
    codigo: '200003',
    descricao:
      'Cesta Básica Nacional — alíquota ZERO de IBS/CBS (redução de 100%), com manutenção integral dos créditos',
    teseRelacionada: 'Cesta Básica Nacional (zerança IBS/CBS)',
    regimeOperacaoVinculado: 'cesta_basica_nacional',
    subatividadeVinculada: 'hortifruti_cesta_basica',
    fundamentacaoLegal:
      'LC 214/2025, arts. 8º, 129 e 146 (Anexo XII — reduzido de 100% / alíquota zero)',
    codigosNcmNbs: ['10063021'],
    nota: 'Caso-oficial RTC 1 (arroz, NCM 10063021): vIBS 0,00 e vCBS 0,00',
  },
  {
    codigo: '200028',
    descricao: 'Serviços de educação e saúde — redução de 60% da alíquota de IBS/CBS',
    teseRelacionada: 'Educação/Saúde — redução de 60%',
    regimeOperacaoVinculado: 'educacao_ensino',
    subatividadeVinculada: 'saude_educacao',
    fundamentacaoLegal: 'LC 214/2025, arts. 128 a 134 (redução de 60%)',
    codigosNcmNbs: ['122011200'],
    nota: 'Caso-oficial RTC 3 (NBS 122011200): pRedAliq 60% → vIBS 0,48 e vCBS 42,24',
  },
  {
    codigo: '000001',
    descricao:
      'Regime regular/padrão (sem redução) — aplica-se a operações com Imposto Seletivo, ex. cervejas (NCM 22030000)',
    teseRelacionada: 'Imposto Seletivo (produto com IS, regime regular)',
    regimeOperacaoVinculado: 'padrao',
    subatividadeVinculada: 'produto_imposto_seletivo',
    fundamentacaoLegal:
      'LC 214/2025, art. 43 (alíquotas de referência do IBS/CBS) e arts. 217 e ss. (Imposto Seletivo)',
    codigosNcmNbs: ['22030000'],
    nota: 'Caso-oficial RTC 2 (cerveja): vIS 15,00 (base 150 × 10%); base IBS/CBS 165',
  },
  {
    codigo: '200035',
    descricao:
      'Código sem vínculo NCM/NBS esperado — usado na verificação de consistência de entrada (erro REG-011 quando a NCM informada não está vinculada)',
    teseRelacionada: 'Consistência NCM↔cClassTrib (REG-011)',
    fundamentacaoLegal:
      'LC 214/2025, art. 172, § 4º (vinculação NCM/NBS à classificação tributária)',
    codigosNcmNbs: [],
    nota: 'Caso-oficial RTC 4 (NCM 02013000 sem vínculo): estadoItem INCONSISTENCIA_ENTRADA',
  },
]

/** Busca uma entrada pelo código cClassTrib. */
export function obterCClasTribPorCodigo(codigo: string): EntradaCClasTrib | undefined {
  return CATALOGO_C_CLAS_TRIB.find((e) => e.codigo === codigo)
}

/** Busca uma entrada pelo regimeOperacao (e opcionalmente a subatividade) da Calculadora. */
export function obterCClasTribPorRegime(
  regimeOperacao?: string,
  subatividade?: string,
): EntradaCClasTrib | undefined {
  if (regimeOperacao) {
    const porRegime = CATALOGO_C_CLAS_TRIB.find((e) => e.regimeOperacaoVinculado === regimeOperacao)
    if (porRegime) return porRegime
  }
  if (subatividade) {
    return CATALOGO_C_CLAS_TRIB.find((e) => e.subatividadeVinculada === subatividade)
  }
  return undefined
}

/** Busca uma entrada por NCM/NBS de referência (código limpo, só dígitos). */
export function obterCClasTribPorNcmNbs(codigoNcmNbs: string): EntradaCClasTrib | undefined {
  const limpo = String(codigoNcmNbs || '').replace(/\D/g, '')
  if (!limpo) return undefined
  return CATALOGO_C_CLAS_TRIB.find((e) => (e.codigosNcmNbs || []).includes(limpo))
}

/** Citação curta e citável: "cClassTrib 200003 (LC 214/2025, arts. 8º, 129 e 146)". */
export function formatarCitacaoCClasTrib(entrada: EntradaCClasTrib): string {
  return `cClassTrib ${entrada.codigo} (${entrada.fundamentacaoLegal})`
}
