// ============================================================================
// MATRIZ COMPLETA DE VEDAÇÕES LEGAIS POR REGIME — LUCRO PRESUMIDO (Lei 9.718/98)
// e MEI (Resolução CGSN 140/2018). Complementa o catálogo do Simples Nacional
// (vedacoesSimples.ts). Indicativa apenas: não altera nenhuma fórmula de cálculo.
// ============================================================================

import {
  BASE_LEGAL_VEDACOES_SIMPLES,
  ROTULO_INDISPONIVEL_VEDACAO,
  construirMotivoVedacao,
  temVedacaoSimples,
  extrairVedacoesSimplesMarcadas,
} from './vedacoesSimples'

export {
  BASE_LEGAL_VEDACOES_SIMPLES,
  ROTULO_INDISPONIVEL_VEDACAO,
  construirMotivoVedacao,
  temVedacaoSimples,
  extrairVedacoesSimplesMarcadas,
}

// ---------------------------------------------------------------------------
// LUCRO PRESUMIDO — Lei 9.718/98, c/ restrições da LC 214/2025 (importadoras)
// ---------------------------------------------------------------------------

export type IdVedacaoPresumido =
  | 'presumido_receita_acima_78m'
  | 'presumido_atividades_financeiras'
  | 'presumido_importadora_ibs_cbs'

export interface ItemVedacaoPresumido {
  id: IdVedacaoPresumido
  inciso: string
  rotulo: string
  /** Rótulo curto (ex.: "Receita > R$ 78 mi") para motivos compactos e relatórios. */
  rotuloCurto: string
  descricao: string
}

export const VEDACOES_PRESUMIDO: ItemVedacaoPresumido[] = [
  {
    id: 'presumido_receita_acima_78m',
    inciso: 'art. 14',
    rotulo: 'Receita bruta anual acima de R$ 78 milhões',
    rotuloCurto: 'Receita > R$ 78 mi',
    descricao:
      'O Lucro Presumido é vedado a pessoas jurídicas cuja receita bruta total anual ultrapassa R$ 78.000.000,00 (Lei 9.718/98, art. 14).',
  },
  {
    id: 'presumido_atividades_financeiras',
    inciso: 'art. 14, § 1º, III',
    rotulo: 'Atividades financeiras, factoring e assemelhadas',
    rotuloCurto: 'Atividades financeiras/factoring',
    descricao:
      'Bancos comerciais, financeiras, seguradoras, previdência, capitalização, arrendamento mercantil e entidades que prestam serviços de assessoria creditícia, gestão de crédito, seleção e riscos, administração de contas a pagar/receber e factoring não podem optar pelo Lucro Presumido (Lei 9.718/98, art. 14, § 1º, III).',
  },
  {
    id: 'presumido_importadora_ibs_cbs',
    inciso: 'art. 348 (LC 214/2025)',
    rotulo: 'Importadora no novo sistema de IBS/CBS (regime especial)',
    rotuloCurto: 'Importadora IBS/CBS',
    descricao:
      'Com a LC 214/2025 (art. 348), empresas importadoras e adquirentes de bens de não contribuintes ficam sujeitas ao Lucro Real a partir de 2027 no novo sistema de IBS/CBS, afastando o Lucro Presumido para esse perfil (base adicional: Lei 9.718/98).',
  },
]

/** Texto base legal citado no rodapé do bloco Presumido e nos relatórios. */
export const BASE_LEGAL_VEDACOES_PRESUMIDO =
  'Base legal: Lei 9.718/98 (art. 14), com as restrições da LC 214/2025 (art. 348) para empresas importadoras no novo sistema de IBS/CBS.'

/** Rótulo exibido para o Lucro Presumido indisponível nas comparações de regimes. */
export const ROTULO_INDISPONIVEL_VEDACAO_PRESUMIDO = 'Indisponível — vedação legal (Lei 9.718/98)'

/** Limite anual de receita bruta do Lucro Presumido. */
export const LIMITE_RECEITA_ANUAL_PRESUMIDO = 78000000

/** Constrói o motivo de indisponibilidade do Presumido, citando os itens marcados. */
export function construirMotivoVedacaoPresumido(idsMarcados: string[]): string {
  const itens = idsMarcados
    .map((id) => VEDACOES_PRESUMIDO.find((v) => v.id === id)?.rotuloCurto || id)
    .filter(Boolean)
    .join(', ')
  return `${ROTULO_INDISPONIVEL_VEDACAO_PRESUMIDO}${itens ? ` — ${itens}` : ''}`
}

/** Extrai as vedações do Presumido marcadas (tolerante a dados antigos). */
export function extrairVedacoesPresumidoMarcadas(perfil?: {
  vedacoesPresumido?: string[]
  vedacaoPresumidoOutra?: string
}): string[] {
  return (
    perfil?.vedacoesPresumido?.filter((id) => VEDACOES_PRESUMIDO.some((v) => v.id === id)) || []
  )
}

/** Há alguma vedação do Presumido marcada (checkbox ou texto livre)? */
export function temVedacaoPresumido(perfil?: {
  vedacoesPresumido?: string[]
  vedacaoPresumidoOutra?: string
}): boolean {
  return (
    extrairVedacoesPresumidoMarcadas(perfil).length > 0 ||
    Boolean(perfil?.vedacaoPresumidoOutra?.trim())
  )
}

// ---------------------------------------------------------------------------
// MEI — Resolução CGSN 140/2018 (art. 3º)
// ---------------------------------------------------------------------------

export type IdVedacaoMei =
  | 'mei_atividade_nao_permitida'
  | 'mei_socio'
  | 'mei_participacao_outra_empresa'
  | 'mei_faturamento_81k'

export interface ItemVedacaoMei {
  id: IdVedacaoMei
  inciso: string
  rotulo: string
  /** Rótulo curto (ex.: "Sócio") para motivos compactos e relatórios. */
  rotuloCurto: string
  descricao: string
}

export const VEDACOES_MEI: ItemVedacaoMei[] = [
  {
    id: 'mei_atividade_nao_permitida',
    inciso: 'art. 3º',
    rotulo: 'Atividade fora da lista de ocupações permitidas ao MEI',
    rotuloCurto: 'Atividade não permitida',
    descricao:
      'A atividade exercida não consta da lista de ocupações permitidas ao Microempreendedor Individual da Resolução CGSN 140/2018 (art. 3º).',
  },
  {
    id: 'mei_socio',
    inciso: 'art. 3º',
    rotulo: 'Empresa com sócio (MEI admite apenas titular único)',
    rotuloCurto: 'Sócio',
    descricao:
      'O MEI somente pode ser exercido por empresário individual com titular único — a existência de sócio impede a condição de MEI (Resolução CGSN 140/2018, art. 3º).',
  },
  {
    id: 'mei_participacao_outra_empresa',
    inciso: 'art. 3º',
    rotulo: 'Titular com participação em outra empresa como sócio ou titular',
    rotuloCurto: 'Participação em outra empresa',
    descricao:
      'O titular do MEI não pode ter participação em outra empresa como sócio ou titular (Resolução CGSN 140/2018, art. 3º).',
  },
  {
    id: 'mei_faturamento_81k',
    inciso: 'art. 3º',
    rotulo: 'Receita bruta acima do limite de R$ 81 mil por ano',
    rotuloCurto: 'Receita > R$ 81 mil/ano',
    descricao:
      'A receita bruta acumulada do ano-calendário não pode ultrapassar R$ 81.000,00 (limite proporcional no ano de início de atividade) (Resolução CGSN 140/2018, art. 3º).',
  },
]

/** Texto base legal citado no rodapé do bloco MEI e nos relatórios. */
export const BASE_LEGAL_VEDACOES_MEI =
  'Base legal: Resolução CGSN 140/2018 (art. 3º) — condições para ser Microempreendedor Individual.'

/** Rótulo exibido para o MEI indisponível nas comparações de regimes. */
export const ROTULO_INDISPONIVEL_VEDACAO_MEI =
  'Indisponível — vedação legal (Resolução CGSN 140/2018)'

/** Limite anual de receita bruta do MEI. */
export const LIMITE_RECEITA_ANUAL_MEI = 81000

/** Constrói o motivo de indisponibilidade do MEI, citando os itens marcados. */
export function construirMotivoVedacaoMei(idsMarcados: string[]): string {
  const itens = idsMarcados
    .map((id) => VEDACOES_MEI.find((v) => v.id === id)?.rotuloCurto || id)
    .filter(Boolean)
    .join(', ')
  return `${ROTULO_INDISPONIVEL_VEDACAO_MEI}${itens ? ` — ${itens}` : ''}`
}

/** Extrai as vedações do MEI marcadas (tolerante a dados antigos). */
export function extrairVedacoesMeiMarcadas(perfil?: {
  vedacoesMei?: string[]
  vedacaoMeiOutra?: string
}): string[] {
  return perfil?.vedacoesMei?.filter((id) => VEDACOES_MEI.some((v) => v.id === id)) || []
}

/** Há alguma vedação do MEI marcada (checkbox ou texto livre)? */
export function temVedacaoMei(perfil?: {
  vedacoesMei?: string[]
  vedacaoMeiOutra?: string
}): boolean {
  return extrairVedacoesMeiMarcadas(perfil).length > 0 || Boolean(perfil?.vedacaoMeiOutra?.trim())
}
