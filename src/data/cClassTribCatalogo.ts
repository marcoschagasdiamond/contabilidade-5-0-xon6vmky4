/**
 * Catálogo curado de cClassTrib (classificação tributária oficial — LC 214/2025).
 *
 * ESCOPO PRAGMÁTICO: apenas os códigos das teses/hipóteses que o sistema já usa
 * (não é o catálogo completo da Receita). Valores conferidos nos exemplos-oficiais
 * do repo ReceitaFederal/calculadora-rtc-regime-regular v1.6.1 (exemplos.md),
 * conforme mapeado em src/lib/casosOficiaisRtc.ts — NENHUMA fórmula alterada.
 *
 * AMPLIAÇÃO v2: entradas adicionais com benefício fiscal real (redução 100% cesta,
 * redução 60% saúde/educação/dispositivos/agro, isenção e suspensão) extraídas das
 * cargas SQL oficiais do mesmo repo (flyway/sql — Informe Técnico 2025.002,
 * tabela cClassTrib v1.6.1+) com as vinculações NCM/NBS dos Anexos da LC 214/2025.
 * Apenas dados: os badges do Recuperador (obterCClasTribPorNcmNbs) e as citações
 * da Calculadora (obterCClasTribPorRegime) passam a cobrir os novos códigos
 * automaticamente — nenhuma lógica nova.
 *
 * Fontes citáveis: LC 214/2025 (arts. 8º, 43, 82, 128–134, 137–142, 146, 157;
 * Anexos I–XII).
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

  // -------------------------------------------------------------------------
  // AMPLIAÇÃO v2 — benefício fiscal real (redução 100%, redução 60%, isenção,
  // suspensão), extraído das cargas SQL oficiais do repo ReceitaFederal/
  // calculadora-rtc-regime-regular (Informe Técnico 2025.002, cClassTrib v1.6.1+),
  // com as vinculações NCM/NBS dos Anexos da LC 214/2025.
  // -------------------------------------------------------------------------

  // --- CST 200 · REDUÇÃO DE 100% (alíquota zero — Cesta Básica Nacional) ---
  {
    codigo: '200004',
    descricao:
      'Fornecimento de dispositivos e materiais médicos hospitalares — redução de 100% da alíquota de IBS/CBS (Anexo XII)',
    teseRelacionada: 'Dispositivos Médicos Anvisa (Anexo XII, desoneração integral)',
    regimeOperacaoVinculado: 'dispositivos_medicos_anvisa',
    subatividadeVinculada: 'dispositivos_medicos',
    fundamentacaoLegal:
      'LC 214/2025, art. 131 e art. 146 (Anexo XII — reduzido de 100% / alíquota zero)',
    codigosNcmNbs: ['90189099'],
    nota: 'NCM 90189099 (instrumentos e aparelhos para medicina) conforme tabela curada da Calculadora',
  },

  // --- CST 200 · REDUÇÃO DE 60% (arts. 128–134 LC 214/2025) ---
  {
    codigo: '200029',
    descricao: 'Serviços de saúde humana (Anexo III) — redução de 60% da alíquota de IBS/CBS',
    teseRelacionada: 'Saúde — serviços hospitalares, clínicas e diagnóstico (-60%)',
    regimeOperacaoVinculado: 'saude_servicos',
    subatividadeVinculada: 'saude_humana',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, I–II e 130 (Anexo III — reduzido de 60%)',
    codigosNcmNbs: ['30049099', '30024180'],
    nota: 'NBS 1.1401 e serviços de saúde humana; produtos correlatos NCM cap. 30',
  },
  {
    codigo: '200032',
    descricao:
      'Medicamentos registrados na Anvisa ou produzidos por farmácias de manipulação, ressalvados os de alíquota zero (art. 146) — redução de 60%',
    teseRelacionada: 'Medicamentos — produtos farmacêuticos registrados (-60%)',
    regimeOperacaoVinculado: 'medicamentos_60',
    subatividadeVinculada: 'medicamentos',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, V e 133 (Anexo VII — reduzido de 60%)',
    codigosNcmNbs: ['30049099'],
    nota: 'Ressalvados os medicamentos sujeitos à alíquota zero do art. 146 (Anexo XII)',
  },
  {
    codigo: '200033',
    descricao:
      'Composições para nutrição enteral e parenteral e fórmulas nutricionais especiais — redução de 60% (Anexo VI)',
    teseRelacionada: 'Nutrição enteral/parenteral e fórmulas especiais (-60%)',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, V–VI e 133 (Anexo VI — reduzido de 60%)',
    codigosNcmNbs: ['21061010', '21069090'],
    nota: 'Fórmulas nutricionais para erros inatos do metabolismo e dietas enterais',
  },
  {
    codigo: '200034',
    descricao:
      'Alimentos destinados ao consumo humano (Anexo VII) — redução de 60% da alíquota de IBS/CBS',
    teseRelacionada: 'Alimentação Humana — produtos agropecuários e alimentos (-60%)',
    regimeOperacaoVinculado: 'alimentacao_humana',
    subatividadeVinculada: 'alimentos_consumo_humano',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, VI e 129 (Anexo VII — reduzido de 60%)',
    codigosNcmNbs: ['07020000', '07019000', '07031019', '08051000', '08081000'],
    nota: 'Hortícolas e frutas frescas fora da Cesta Básica Nacional',
  },
  {
    codigo: '200036',
    descricao:
      'Produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura — redução de 60% (art. 137)',
    teseRelacionada: 'Agropecuária — produtos in natura (-60%)',
    regimeOperacaoVinculado: 'insumos_agropecuarios',
    subatividadeVinculada: 'agro_in_natura',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, VIII e 137',
    codigosNcmNbs: ['12011000', '10051000'],
    nota: 'Sementes e grãos in natura; desoneração parcial com crédito ao produtor',
  },
  {
    codigo: '200038',
    descricao:
      'Insumos agropecuários e aquícolas (Anexo IX) — redução de 60% da alíquota de IBS/CBS',
    teseRelacionada: 'Insumos Agropecuários e Aquícolas (-60%)',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, IX e 138 (Anexo IX — reduzido de 60%)',
    codigosNcmNbs: ['31021010', '31022100', '31042090', '31052000', '38089119', '23099010'],
    nota: 'Fertilizantes, defensivos, sementes e rações com crédito assegurado ao produtor',
  },
  {
    codigo: '200039',
    descricao:
      'Produções nacionais artísticas, culturais, de eventos, jornalísticas e audiovisuais (Anexo X) — redução de 60%',
    teseRelacionada: 'Produções Artísticas, Culturais e Desportivas (-60%)',
    regimeOperacaoVinculado: 'producoes_artisticas_culturais',
    subatividadeVinculada: 'cultura_desporto',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, X e 139 (Anexo X — reduzido de 60%)',
    codigosNcmNbs: [],
    nota: 'Vínculo NBS (1.0901 e seguintes) — sem NCM dedicada nesta curadoria',
  },
  {
    codigo: '200041',
    descricao: 'Serviço de educação desportiva (NBS 1.2205.12.00) — redução de 60% (art. 141, I)',
    teseRelacionada: 'Educação Desportiva (-60%)',
    subatividadeVinculada: 'educacao_desportiva',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, XII e 141, I (reduzido de 60%)',
    codigosNcmNbs: ['122051200'],
    nota: 'NBS 1.2205.12.00 referida expressamente na tabela oficial',
  },
  {
    codigo: '200043',
    descricao:
      'Fornecimento à administração pública de serviços e bens de soberania e segurança nacional (Anexo XI) — redução de 60%',
    teseRelacionada: 'Segurança e Soberania Nacional (-60%)',
    regimeOperacaoVinculado: 'seguranca_nacional',
    subatividadeVinculada: 'soberania_seguranca',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, XIII e 142 (Anexo XI — reduzido de 60%)',
    codigosNcmNbs: [],
    nota: 'Vínculo NBS/NCM do Anexo XI — sem código dedicado nesta curadoria',
  },
  {
    codigo: '200044',
    descricao:
      'Segurança da informação e segurança cibernética por sociedade com sócio brasileiro ≥ 20% do capital (Anexo XI) — redução de 60%',
    teseRelacionada: 'Segurança da Informação e Cibernética (-60%)',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, XIII e 142 (Anexo XI — reduzido de 60%)',
    codigosNcmNbs: [],
    nota: 'Requer sócio brasileiro com mínimo de 20% do capital social (Anexo XI)',
  },
  {
    codigo: '200030',
    descricao: 'Venda de dispositivos médicos (Anexo IV) — redução de 60% da alíquota de IBS/CBS',
    teseRelacionada: 'Dispositivos Médicos Anvisa (-60%)',
    regimeOperacaoVinculado: 'dispositivos_medicos_60',
    subatividadeVinculada: 'dispositivos_medicos_60',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, III e 131 (Anexo IV — reduzido de 60%)',
    codigosNcmNbs: ['90189099'],
    nota: 'Operações de venda (NF-e) com especificação NCM/SH do Anexo IV',
  },
  {
    codigo: '200031',
    descricao:
      'Dispositivos de acessibilidade próprios para pessoas com deficiência (Anexo V) — redução de 60%',
    teseRelacionada: 'Dispositivos de Acessibilidade PcD — redução de 60% (art. 131)',
    regimeOperacaoVinculado: 'dispositivos_acessibilidade_pcd_60',
    subatividadeVinculada: 'dispositivos_acessibilidade_60',
    fundamentacaoLegal: 'LC 214/2025, arts. 128, IV e 131 (Anexo V — reduzido de 60%)',
    codigosNcmNbs: ['90214000'],
    nota: 'Próteses, órteses e tecnologias assistivas com registro Anvisa',
  },

  // --- CST 200 · REDUÇÃO DE 30% (art. 132 — profissões intelectuais) ---
  {
    codigo: '200054',
    descricao:
      'Serviços de profissões intelectuais regulamentadas (advogados, contadores, engenheiros, economistas, jornalistas e demais conselhos) — redução de 30% (art. 132)',
    teseRelacionada: 'Profissões Intelectuais Regulamentadas (OAB/CRC/CREA/CORECON) (-30%)',
    regimeOperacaoVinculado: 'profissoes_intelectuais_advogados',
    subatividadeVinculada: 'profissoes_intelectuais',
    fundamentacaoLegal: 'LC 214/2025, art. 132 (reduzido de 30%)',
    codigosNcmNbs: [],
    nota: 'Cobertura consolidada das profissões do art. 132 no bloco de serviços NBS',
  },

  // --- CST 400 · ISENÇÃO (art. 157 LC 214/2025) ---
  {
    codigo: '400001',
    descricao:
      'Fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário (urbano, semiurbano e metropolitano) — ISENÇÃO de IBS/CBS',
    teseRelacionada: 'Transporte Público Coletivo — isenção (art. 157)',
    regimeOperacaoVinculado: 'transporte',
    subatividadeVinculada: 'transporte_coletivo',
    fundamentacaoLegal: 'LC 214/2025, art. 157, I (isenção — CST 400)',
    codigosNcmNbs: [],
    nota: 'CST 400; sob regime de autorização, permissão ou concessão pública',
  },

  // --- CST 550 · SUSPENSÃO ---
  {
    codigo: '550001',
    descricao: 'Exportações de bens materiais — SUSPENSÃO de IBS/CBS (art. 82)',
    teseRelacionada: 'Exportações — suspensão do lançamento (art. 82)',
    regimeOperacaoVinculado: 'exportacao_suspensao',
    subatividadeVinculada: 'exportacao_bens_materiais',
    fundamentacaoLegal: 'LC 214/2025, art. 82 (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; exportação com suspensão integral do lançamento',
  },
  {
    codigo: '550002',
    descricao: 'Regime de Trânsito — SUSPENSÃO de IBS/CBS (art. 84)',
    teseRelacionada: 'Regime de Trânsito aduaneiro — suspensão (art. 84)',
    regimeOperacaoVinculado: 'regime_transito',
    subatividadeVinculada: 'transito_aduaneiro',
    fundamentacaoLegal: 'LC 214/2025, art. 84 (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; regime especial de trânsito',
  },
  {
    codigo: '550003',
    descricao:
      'Regimes de Depósito (DAE — depósito alfandegário certificado) — SUSPENSÃO (art. 85)',
    teseRelacionada: 'Regimes de Depósito — suspensão (art. 85)',
    regimeOperacaoVinculado: 'regime_deposito',
    subatividadeVinculada: 'deposito_alfandegario',
    fundamentacaoLegal: 'LC 214/2025, art. 85 (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; regimes de depósito certificado (DAE)',
  },
  {
    codigo: '550004',
    descricao: 'Regimes de Depósito (art. 87) — SUSPENSÃO de IBS/CBS',
    teseRelacionada: 'Regimes de Depósito — suspensão (art. 87)',
    regimeOperacaoVinculado: 'regime_deposito_87',
    subatividadeVinculada: 'deposito_art87',
    fundamentacaoLegal: 'LC 214/2025, art. 87 (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; regime de depósito do art. 87 da LC 214/2025',
  },
  {
    codigo: '550005',
    descricao: 'Regimes de Depósito (art. 87, parágrafo único) — SUSPENSÃO de IBS/CBS',
    teseRelacionada: 'Regimes de Depósito — suspensão (art. 87, § único)',
    regimeOperacaoVinculado: 'regime_deposito_87_pu',
    subatividadeVinculada: 'deposito_art87_pu',
    fundamentacaoLegal: 'LC 214/2025, art. 87, parágrafo único (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; regime de depósito do art. 87, § único, da LC 214/2025',
  },
  {
    codigo: '550007',
    descricao: 'Regimes de Aperfeiçoamento Ativo (Recof) — SUSPENSÃO de IBS/CBS',
    teseRelacionada: 'Recof (admissão temporária para aperfeiçoamento) — suspensão',
    regimeOperacaoVinculado: 'regime_recof',
    subatividadeVinculada: 'recof_aperfeicoamento',
    fundamentacaoLegal: 'LC 214/2025, arts. 84 a 87 (suspensão — CST 550)',
    codigosNcmNbs: [],
    nota: 'CST 550; regime especial de admissão temporária para aperfeiçoamento ativo',
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
