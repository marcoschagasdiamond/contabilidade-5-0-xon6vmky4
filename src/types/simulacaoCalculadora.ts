import type {
  ConfiguracoesGerais,
  RegimeDiferenciadoTipo,
  TipoAtividade,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeAgronegocio,
  SubatividadeConstrucao,
  SubatividadeLocacao,
  SubatividadeFoodService,
  CategoriaDespesaCredito,
} from './calculadoraIbsCbs'

/**
 * Snapshot completo dos parâmetros de entrada da Calculadora IBS/CBS
 */
export interface ParametrosSimulacaoCalculadora {
  // Módulo 1 - Configurações Gerais
  config: ConfiguracoesGerais

  // Preenchimento Assistido do Módulo 1
  anoTransicao?: 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033
  presetSetor?: string

  // Módulo 2 - Calculadora Simples
  valorOperacao: number
  regimeOperacao: RegimeDiferenciadoTipo
  anoOperacao?: 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033
  percentualComprasVendasSimples: number

  // Módulo 3 - Comparativo por Regime
  faturamentoMensal: number
  tipoAtividade: TipoAtividade
  subatividadeServico: SubatividadeServico
  subatividadeIndustria: SubatividadeIndustria
  subatividadeComercio: SubatividadeComercio
  subatividadeAgro?: SubatividadeAgronegocio
  subatividadeConstrucao?: SubatividadeConstrucao
  subatividadeLocacao?: SubatividadeLocacao
  subatividadeFoodService?: SubatividadeFoodService
  aliquotaImpostoSeletivo: number
  proporcaoServicoMisto: number
  percentualComprasVendasComparativo: number
  folhaPagamentoMensal: number
  margemLucroEstimada: number
  despesasComCreditosMensais: number
  percentualExportacao: number
  ufOrigem: string

  // Módulo 4 - Simulador de Créditos
  despesasCreditos: CategoriaDespesaCredito[]

  // Módulo 5 - Transição 2026-2033
  faturamentoAnualProjetado: number
  setorTransicao: TipoAtividade
  valorEstoqueVirada?: number // Etapa 5: Crédito presumido de estoque

  // Parâmetros de Split Payment (Etapa 4)
  taxaMensalCapitalGiro?: number // % a.m. (padrão 1,0%)
  diasAntecipacaoSplit?: number // dias médios de antecipação (padrão 30 dias)

  // Módulo 6 - Dashboard
  periodoDashboard: 'mensal' | 'anual'
  regimeAtualFiltro: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  regimeAtualEmpresa?: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  anoTransicaoDashboard?: 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033

  // Metadados opcionais da empresa
  empresa?: string
  cnpj?: string
  nomeContato?: string
}

/**
 * Resumo dos resultados dos 6 módulos salvos na simulação
 */
export interface ResultadosSimulacaoCalculadora {
  resultadoSimples: {
    aliquotaCbsAplicada: number
    aliquotaIbsAplicada: number
    aliquotaTotalAplicada: number
    debitoCbs: number
    debitoIbs: number
    totalDebito: number
    valorCreditos: number
    valorARecolher: number
    aliquotaEfetiva: number
    valorTotalNotaFiscal: number
    anoOperacao?: 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033
    etiquetaLegalExibida?: string
  }
  resultadoComparativo: {
    lucroReal: {
      totalEfetivo: number
      aliquotaEfetiva: number
      totalNominal: number
      creditos: number
    }
    lucroPresumido: {
      totalEfetivo: number
      aliquotaEfetiva: number
      totalNominal: number
      creditos: number
    }
    simplesNacional: {
      totalEfetivo: number
      aliquotaEfetiva: number
      totalNominal: number
      creditos: number
      anexoUtilizado: string
      faixaEncontrada: string
    }
    ibsCbs: {
      totalEfetivo: number
      aliquotaEfetiva: number
      totalNominal: number
      creditos: number
      impostoSeletivo: number
    }
    regimeMaisVantajoso: string
    piorCenario: string
    economiaVersusPior: number
    economiaPercentual: number
  }
  resultadoCreditos: {
    totalAntigo: number
    totalNovo: number
    adicionalGanho: number
    aumentoPercentual: number
    economiaAnual: number
    anoOperacao?: 'atual' | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033
    aliquotaReferencia?: number
    regimeOperacao?: RegimeDiferenciadoTipo
    grupoRegime?: string
    isAliquotaZero?: boolean
  }
  resultadoTransicao: Array<{
    ano: number | 'atual'
    fase: string
    aliquotaCbs: number
    aliquotaIbs: number
    impostoEstimado: number
    aliquotaEfetivaTotal: number
    creditoEstoqueAno?: number
  }>
  resultadoEstoque?: {
    valorEstoqueVirada: number
    aliquotaCreditoPresumido: number
    creditoTotalEstoque: number
    economiaAno1: number
  }
  resultadoSplitPayment?: {
    retencaoMensalNota: number
    recolhimentoAtualMensal: number
    diferencaFluxoCaixa: number
    taxaMensalCapital: number
    custoCapitalMensal: number
    custoCapitalAnual: number
    diasAntecipacao: number
  }
  resultadoDashboard: {
    aliquotaEfetivaAtual: number
    aliquotaEfetivaNova: number
    economiaMensalProjetada: number
    economiaAnualProjetada: number
    regimeRecomendado: string
  }
}

/**
 * Modelo de uma simulação salva (PocketBase ou LocalStorage)
 */
export interface SimulacaoCalculadora {
  id: string
  user_id?: string
  nome: string
  empresa?: string
  cnpj?: string
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
  regime_recomendado?: string
  economia_anual?: number
  aliquota_efetiva?: number
  faturamento_mensal?: number
  ano_base?: number
  created: string
  updated?: string
  origem: 'nuvem' | 'local'
}
