export type FarolRisco = 'verde' | 'amarelo' | 'vermelho'

export type ModuloTributo = 'pis_cofins' | 'folha' | 'irpj_csll' | 'outros_tributos'

export interface TeseRecuperacaoDefinicao {
  id: string
  modulo: ModuloTributo
  codigo: string
  titulo: string
  fundamento: string
  descricao: string
  riscoPadrao: FarolRisco
  justificativaRisco: string
  percentualEstimadoPadrao: number // % sobre a base (faturamento ou folha)
  regimesElegiveis: ('Lucro Real' | 'Lucro Presumido' | 'Simples Nacional')[]
}

export interface FaturamentoAno {
  ano: number
  faturamento: number
  fatorSelicAcumulado: number // Ex: 1.45 (145% de correção até a presente data)
}

export interface ConfiguracoesRecuperador {
  clienteId: string | null
  empresa: string
  cnpj: string
  regimeAtual: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  segmento: string
  uf: string
  // Dados comuns de 60 meses
  anosFaturamento: FaturamentoAno[]
  // Massa salarial e colaboradores
  numeroMedioEmpregados: number
  percentualRotatividadeAnual: number
  massaSalarialMensal: number
  aliquotaPatronalComposta: number // ~26.8% (20% patronal + 5.8% terceiros + RAT)
  aliquotaPisCofinsPadrao: number // 9.25% no Real, 3.65% no Presumido
  // Parâmetros integrados da Carteira e da Calculadora IBS/CBS
  faturamentoMensal?: number
  percentualComprasVendas?: number
  anoTransicao?: string | number
  regimeAplicado?: string
  origemPreenchimento?: 'empresa_ativa' | 'calculadora_ibs_cbs' | 'dados_empresa' | 'manual'
  avisoOrigem?: string
  // NCM informado do produto/insumo principal da empresa (LC 214/2025)
  ncm?: string
  ncmDescricao?: string
  ncmCategoriaRotulo?: string
  ncmOrigemSugerida?: boolean
}

export interface TeseSelecaoUsuario {
  teseId: string
  ativa: boolean
  farol: FarolRisco
  percentualBaseCustomizado?: number
  observacaoAnalista?: string
  // Indicação de origem da seleção: manual ou sugerida via NCM
  origem?: 'manual' | 'ncm_sugerido'
  ncmReferencia?: string
}

export interface ParametrosRecuperador {
  configuracoes: ConfiguracoesRecuperador
  teses: Record<string, TeseSelecaoUsuario>
  cenarioSelecionado?: 'integral' | 'conservador'
}

export interface ApuracaoAnoTese {
  ano: number
  baseCalculo: number
  aliquotaOuPercentual: number
  valorOriginal: number
  fatorSelic: number
  correcaoSelic: number
  valorTotalCorrigido: number
}

export interface ResultadoTese {
  teseId: string
  modulo: ModuloTributo
  titulo: string
  fundamento: string
  farol: FarolRisco
  ativa: boolean
  valorOriginalTotal: number
  correcaoSelicTotal: number
  totalCorrigido: number
  apuracaoPorAno: ApuracaoAnoTese[]
  teseRecuperadorId?: string
  moduloRecuperador?: ModuloTributo
  dataJulgamento?: string
  linkOficial?: string
  origem?: 'manual' | 'ncm_sugerido'
  ncmReferencia?: string
  etiquetas?: {
    tributos?: string[]
    segmentos?: string[]
    regimes?: string[]
  }
}

export interface ResultadosRecuperador {
  totalIntegralOriginal: number
  totalIntegralSelic: number
  totalIntegralCorrigido: number

  // Cenário Conservador considera apenas teses com farol VERDE (jurisprudência pacificada)
  totalConservadorOriginal: number
  totalConservadorSelic: number
  totalConservadorCorrigido: number

  // Distribuição por Tributo
  totalPisCofinsCorrigido: number
  totalFolhaCorrigido: number
  totalIrpjCsllCorrigido?: number
  totalOutrosTributosCorrigido?: number

  // Distribuição por Farol
  totalVerdeCorrigido: number
  totalAmareloCorrigido: number
  totalVermelhoCorrigido: number

  // Distribuição por Ano
  totaisPorAno: {
    ano: number
    valorOriginal: number
    correcaoSelic: number
    totalCorrigido: number
  }[]

  resultadosTeses: ResultadoTese[]
  /** Atalho/alias para resultadosTeses para compatibilidade e consumo direto pelos blocos de tributos */
  porTese: ResultadoTese[]
}

export interface SimulacaoRecuperador {
  id: string
  user_id?: string
  cliente_id?: string | null
  nome: string
  empresa?: string
  cnpj?: string
  regime_atual?: string
  parametros: ParametrosRecuperador
  resultados: ResultadosRecuperador
  total_recuperavel_integral: number
  total_recuperavel_conservador: number
  total_pis_cofins: number
  total_folha: number
  total_irpj_csll?: number
  total_outros_tributos?: number
  created: string
  updated?: string
  origem: 'nuvem' | 'local'
}
