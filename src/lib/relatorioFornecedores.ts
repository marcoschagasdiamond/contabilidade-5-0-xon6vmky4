// ============================================================================
// RELATÓRIO DE FORNECEDORES — visão de carteira acessível de /dados-empresa
// e da Etapa 06 (Análise de Fornecedores). Indicativo apenas: NÃO altera
// cálculos fiscais existentes (calculoFornecedores.ts é reaproveitado).
// ============================================================================

import type {
  ResultadoCalculoFornecedor,
  ResumoCarteiraFornecedores,
} from '@/lib/calculoFornecedores'
import { VEDACOES_SIMPLES_ART17, extrairVedacoesSimplesMarcadas } from '@/lib/vedacoesSimples'
import { type FornecedorDiagnostico, type RegimeFornecedor } from '@/services/fornecedores'

/** Rótulos de exibição por regime. */
export const ROTULO_REGIME_FORNECEDOR: Record<RegimeFornecedor, string> = {
  lucro_real: 'Lucro Real',
  lucro_presumido: 'Lucro Presumido',
  simples_nacional: 'Simples Nacional',
  misto: 'Misto (Real + Simples)',
}

export interface ResumoPorRegimeRelatorio {
  rotulo: string
  quantidade: number
  volume: number
}

export interface FornecedorChaveRelatorio {
  fornecedor: FornecedorDiagnostico
  volume: number
  /** % da carteira que este fornecedor representa. */
  pesoPercentual: number
  /** True quando impactado por vedação do Simples (art. 17, LC 123/2006). */
  riscoVedacao: boolean
  rotulosVedacao: string[]
}

export interface RelatorioFornecedoresDados {
  /** Nome da empresa analisada (quando disponível). */
  nomeEmpresa: string
  /** % configurado em /dados-empresa (campo porcentagem_compras_simples_nacional). */
  pctConfigurado: number
  /** % calculado pela carteira (volume dos optantes ÷ total). */
  pctCarteira: number | null
  /** True quando |pctConfigurado − pctCarteira| > tolerância. */
  divergenciaAviso: boolean
  totalFornecedores: number
  volumeTotalCompras: number
  porRegime: ResumoPorRegimeRelatorio[]
  fornecedoresChave: FornecedorChaveRelatorio[]
  /** Ano da transição em foco (2026–2033), herdado da Etapa 06 quando disponível. */
  anoTransicao: number | null
  /** Comparativo 2026–2033 já calculado pela Etapa 06 (reaproveitado). */
  evolucaoAnos: ResumoCarteiraFornecedores['evolucaoAnos']
  /** Lista completa de detalhamento calculada por calcularResumoCarteiraFornecedores. */
  detalhamento: ResultadoCalculoFornecedor[]
}

const TOLERANCIA_DIVERGENCIA_PP = 3 // pontos percentuais

/**
 * Monta o relatório de carteira de fornecedores a partir da lista crua e do
 * resumo já calculado pela Etapa 06 (calcularResumoCarteiraFornecedores).
 * Sem cálculo fiscal novo — apenas agregação de volumes.
 */
export function montarRelatorioFornecedores(params: {
  fornecedores: FornecedorDiagnostico[]
  resumo: Pick<ResumoCarteiraFornecedores, 'evolucaoAnos' | 'detalhamentoPorFornecedor'>
  nomeEmpresa?: string
  pctConfigurado: number
  anoTransicao?: number | null
  /** Quantos fornecedores-chave exibir (padrão 5). */
  topN?: number
}): RelatorioFornecedoresDados {
  const {
    fornecedores,
    resumo,
    nomeEmpresa = '',
    pctConfigurado,
    anoTransicao = null,
    topN = 5,
  } = params

  const comRegime = fornecedores.filter((f) => !!f.regime)
  const total = comRegime.reduce((acc, f) => acc + (Number(f.volume_compras) || 0), 0)

  const pctCarteira =
    comRegime.length === 0 || total <= 0
      ? null
      : Math.round(
          (comRegime
            .filter((f) => f.regime === 'simples_nacional')
            .reduce((acc, f) => acc + (Number(f.volume_compras) || 0), 0) /
            total) *
            100,
        )

  const divergenciaAviso =
    pctCarteira !== null &&
    Math.abs(pctCarteira - Number(pctConfigurado || 0)) > TOLERANCIA_DIVERGENCIA_PP

  // Totais por regime
  const mapa = new Map<RegimeFornecedor, { quantidade: number; volume: number }>()
  comRegime.forEach((f) => {
    const atual = mapa.get(f.regime) || { quantidade: 0, volume: 0 }
    atual.quantidade += 1
    atual.volume += Number(f.volume_compras) || 0
    mapa.set(f.regime, atual)
  })
  const porRegime: ResumoPorRegimeRelatorio[] = Array.from(mapa.entries())
    .map(([regime, d]) => ({
      rotulo: ROTULO_REGIME_FORNECEDOR[regime] || regime,
      quantidade: d.quantidade,
      volume: d.volume,
    }))
    .sort((a, b) => b.volume - a.volume)

  // Fornecedores-chave: top N por volume (>= 10% da carteira OU top N puro)
  const ordenados = [...comRegime].sort(
    (a, b) => (Number(b.volume_compras) || 0) - (Number(a.volume_compras) || 0),
  )
  const fornecedoresChave: FornecedorChaveRelatorio[] = ordenados.slice(0, topN).map((f) => {
    const volume = Number(f.volume_compras) || 0
    const peso = total > 0 ? Math.round((volume / total) * 100) : 0
    return {
      fornecedor: f,
      volume,
      pesoPercentual: peso,
      riscoVedacao: false, // preenchido via marcarRiscoVedacaoSimples
      rotulosVedacao: [],
    }
  })

  return {
    nomeEmpresa,
    pctConfigurado: Number(pctConfigurado || 0),
    pctCarteira,
    divergenciaAviso,
    totalFornecedores: comRegime.length,
    volumeTotalCompras: total,
    porRegime,
    fornecedoresChave,
    anoTransicao: anoTransicao ?? null,
    evolucaoAnos: resumo.evolucaoAnos || [],
    detalhamento: resumo.detalhamentoPorFornecedor || [],
  }
}

/**
 * Marca o risco de vedação do Simples (LC 123/2006, art. 17, com LC 214/2025)
 * nos fornecedores-chave, usando as regras existentes em vedacoesRegimes.ts.
 */
export function marcarRiscoVedacaoSimples(
  relatorio: RelatorioFornecedoresDados,
  perfilVedacoes?: {
    vedacoesSimplesArt17?: string[]
    vedacaoSimplesArt17Outra?: string
    regimeAtual?: string
  },
): RelatorioFornecedoresDados {
  const marcas = extrairRotulosVedacao(perfilVedacoes)
  const fornecedoresChave = relatorio.fornecedoresChave.map((fc) => {
    // Um fornecedor optante do Simples é impactado pela vedação quando a
    // própria empresa analisada marca incisos do art. 17 — risco de troca de
    // regime na cadeia: perda de crédito de transferência e ajuste de preços.
    const isSimples = fc.fornecedor.regime === 'simples_nacional'
    return {
      ...fc,
      riscoVedacao: isSimples && marcas.length > 0,
      rotulosVedacao: isSimples ? marcas : [],
    }
  })
  return { ...relatorio, fornecedoresChave }
}

function extrairRotulosVedacao(perfil?: {
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
}): string[] {
  const rotulos: string[] = []
  extrairVedacoesSimplesMarcadas(perfil).forEach((id) => {
    const item = VEDACOES_SIMPLES_ART17.find((v) => v.id === id)
    if (item) rotulos.push(`${item.rotuloCurto} (${item.inciso})`)
  })
  if (perfil?.vedacaoSimplesArt17Outra?.trim()) {
    rotulos.push(`Outra: ${perfil.vedacaoSimplesArt17Outra.trim()}`)
  }
  return rotulos
}
