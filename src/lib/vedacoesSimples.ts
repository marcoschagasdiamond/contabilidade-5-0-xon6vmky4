// ============================================================================
// VEDAÇÕES LEGAIS AO SIMPLES NACIONAL — ART. 17 DA LC 123/2006 (c/ LC 214/2025)
// Lista curada usada em /dados-empresa, comparações de regimes e Relatório Consolidado.
// Indicativa apenas: não altera nenhuma fórmula de cálculo.
// ============================================================================

export type IdVedacaoSimples =
  | 'inc1_factoring'
  | 'inc2_domiciliado_exterior'
  | 'inc3_capital_publico'
  | 'inc5_debitos_inss_fazenda'
  | 'inc6_transporte_passageiros'
  | 'inc10a_cigarros_armas'
  | 'inc10c_bebidas_alcoolicas'

export interface ItemVedacaoSimples {
  id: IdVedacaoSimples
  inciso: string
  rotulo: string
  /** Rótulo curto (ex.: "Factoring") para motivos compactos e relatórios. */
  rotuloCurto: string
  descricao: string
}

export const VEDACOES_SIMPLES_ART17: ItemVedacaoSimples[] = [
  {
    id: 'inc1_factoring',
    inciso: 'inc. I',
    rotulo: 'Factoring / serviços de crédito com recursos próprios',
    rotuloCurto: 'Factoring',
    descricao:
      'Prestação de serviços de factoring ou atividades que impliquem cobrança, desconto de títulos ou crédito com recursos próprios (art. 17, I).',
  },
  {
    id: 'inc2_domiciliado_exterior',
    inciso: 'inc. II',
    rotulo: 'Titular ou sócio domiciliado no exterior',
    rotuloCurto: 'Sócio no exterior',
    descricao:
      'Sócio ou titular com domicílio no exterior ou constituída sob qualquer tipo de sociedade estrangeira (art. 17, II).',
  },
  {
    id: 'inc3_capital_publico',
    inciso: 'inc. III',
    rotulo: 'Capital com participação de entidade da administração pública',
    rotuloCurto: 'Capital público',
    descricao:
      'Capital social integrado por participação de entidade da administração pública direta ou indireta (art. 17, III).',
  },
  {
    id: 'inc5_debitos_inss_fazenda',
    inciso: 'inc. V',
    rotulo: 'Débito com INSS ou Fazendas Públicas sem exigibilidade suspensa',
    rotuloCurto: 'Débito INSS/Fazenda',
    descricao:
      'Débito junto ao INSS ou às Fazendas Públicas Federal, Estadual ou Municipal (certidão positiva não suspensa, sem parcelamento ou decisão judicial) (art. 17, V).',
  },
  {
    id: 'inc6_transporte_passageiros',
    inciso: 'inc. VI',
    rotulo: 'Transporte intermunicipal/interestadual de passageiros (exceto fluvial ou urbano)',
    rotuloCurto: 'Transporte de passageiros',
    descricao:
      'Transporte intermunicipal e interestadual de passageiros, exceto na modalidade fluvial ou quando caracterizado transporte metropolitano/urbano (art. 17, VI).',
  },
  {
    id: 'inc10a_cigarros_armas',
    inciso: 'inc. X, "a"',
    rotulo: 'Produção/venda no atacado de cigarros, armas e explosivos',
    rotuloCurto: 'Cigarros/armas/explosivos',
    descricao:
      'Produção, venda no atacado ou distribuição de cigarros, bebidas alcoólicas (exceto exceções do X, "c"), armas de fogo, munições, pólvoras, explosivos etc. — parcela produtor/varejista de armas e munições (art. 17, X, "a").',
  },
  {
    id: 'inc10c_bebidas_alcoolicas',
    inciso: 'inc. X, "c"',
    rotulo: 'Bebidas alcoólicas, exceto micro cervejarias/vinícolas/licores/destilarias',
    rotuloCurto: 'Bebidas alcoólicas',
    descricao:
      'Bebidas alcoólicas com produção/venda no atacado, exceto micro e pequenas cervejarias, vinícolas, produtores de licores e destilarias de pequeno porte (art. 17, X, "c").',
  },
]

/** Texto base legal citado no rodapé do bloco e nos relatórios. */
export const BASE_LEGAL_VEDACOES_SIMPLES =
  'Base legal: art. 17 da LC 123/2006, com as alterações da LC 214/2025 (vedações à opção pelo Simples Nacional).'

/** Rótulo exibido para o regime indisponível nas comparações de regimes. */
export const ROTULO_INDISPONIVEL_VEDACAO = 'Indisponível — vedação legal (art. 17, LC 123/2006)'

/** Constrói o motivo de inelegibilidade por vedação, citando os incisos marcados e, se houver, o texto livre "Outra". */
export function construirMotivoVedacao(idsMarcados: string[], outraTexto?: string): string {
  const partes = idsMarcados
    .map((id) => VEDACOES_SIMPLES_ART17.find((v) => v.id === id)?.rotuloCurto || id)
    .filter(Boolean)
  if (outraTexto?.trim()) partes.push(`Outra: ${outraTexto.trim()}`)
  const incisos = partes.join(', ')
  return `${ROTULO_INDISPONIVEL_VEDACAO}${incisos ? ` — ${incisos}` : ''}`
}

/** Extraí as vedações marcadas de um perfil parcial da fonte mestra (tolerante a dados antigos). */
export function extrairVedacoesSimplesMarcadas(perfil?: {
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
}): string[] {
  return (
    perfil?.vedacoesSimplesArt17?.filter((id) => VEDACOES_SIMPLES_ART17.some((v) => v.id === id)) ||
    []
  )
}

/** Há alguma vedação marcada (checkbox curado ou texto livre preenchido)? */
export function temVedacaoSimples(perfil?: {
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
}): boolean {
  return (
    extrairVedacoesSimplesMarcadas(perfil).length > 0 ||
    Boolean(perfil?.vedacaoSimplesArt17Outra?.trim())
  )
}
