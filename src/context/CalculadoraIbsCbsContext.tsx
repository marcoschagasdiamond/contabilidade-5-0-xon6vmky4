import React, { createContext, useContext, useState, useMemo } from 'react'
import {
  ConfiguracoesGerais,
  CONFIGURACOES_PADRAO,
  RegimeDiferenciadoTipo,
  TipoAtividade,
  CategoriaDespesaCredito,
  CATEGORIAS_CREDITO_PADRAO,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_COMERCIO,
  InfoSubatividade,
} from '@/types/calculadoraIbsCbs'
import { TABELAS_SIMPLES } from '@/lib/regimes'
import {
  carregarDadosEmpresa,
  salvarDadosEmpresa,
  existeDadosEmpresaSalvos,
  DadosEmpresaPerfil,
  STORAGE_EVENT,
} from '@/types/dadosEmpresa'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'

interface CalculadoraContextType {
  // Módulo 1 - Configurações Gerais
  config: ConfiguracoesGerais
  updateConfig: (novasConfigs: Partial<ConfiguracoesGerais>) => void
  resetConfig: () => void

  // Módulo 2 - Calculadora Simples
  valorOperacao: number
  setValorOperacao: (v: number) => void
  regimeOperacao: RegimeDiferenciadoTipo
  setRegimeOperacao: (r: RegimeDiferenciadoTipo) => void
  percentualComprasVendasSimples: number
  setPercentualComprasVendasSimples: (p: number) => void

  // Módulo 3 - Comparativo por Regime
  faturamentoMensal: number
  setFaturamentoMensal: (v: number) => void
  tipoAtividade: TipoAtividade
  setTipoAtividade: (t: TipoAtividade) => void
  // Subatividades por ramo
  subatividadeServico: SubatividadeServico
  setSubatividadeServico: (s: SubatividadeServico) => void
  subatividadeIndustria: SubatividadeIndustria
  setSubatividadeIndustria: (s: SubatividadeIndustria) => void
  subatividadeComercio: SubatividadeComercio
  setSubatividadeComercio: (s: SubatividadeComercio) => void
  // Alíquota de Imposto Seletivo customizada (padrão 10%)
  aliquotaImpostoSeletivo: number
  setAliquotaImpostoSeletivo: (v: number) => void
  proporcaoServicoMisto: number // % serviço no misto (restante comércio)
  setProporcaoServicoMisto: (p: number) => void
  percentualComprasVendasComparativo: number
  setPercentualComprasVendasComparativo: (p: number) => void
  // Novos campos do Módulo 3
  folhaPagamentoMensal: number
  setFolhaPagamentoMensal: (v: number) => void
  margemLucroEstimada: number
  setMargemLucroEstimada: (v: number) => void
  despesasComCreditosMensais: number
  setDespesasComCreditosMensais: (v: number) => void
  percentualExportacao: number
  setPercentualExportacao: (v: number) => void
  ufOrigem: string
  setUfOrigem: (v: string) => void

  // Módulo 4 - Simulador de Créditos
  despesasCreditos: CategoriaDespesaCredito[]
  updateDespesaCredito: (id: string, updates: Partial<CategoriaDespesaCredito>) => void
  resetDespesasCreditos: () => void

  // Módulo 5 - Transição 2026 a 2033
  faturamentoAnualProjetado: number
  setFaturamentoAnualProjetado: (v: number) => void
  setorTransicao: TipoAtividade
  setSetorTransicao: (s: TipoAtividade) => void
  valorEstoqueVirada: number
  setValorEstoqueVirada: (v: number) => void

  // Etapa 4 - Split Payment
  taxaMensalCapitalGiro: number
  setTaxaMensalCapitalGiro: (v: number) => void
  diasAntecipacaoSplit: number
  setDiasAntecipacaoSplit: (v: number) => void

  // Módulo 6 - Filtros Dashboard
  periodoDashboard: 'mensal' | 'anual'
  setPeriodoDashboard: (p: 'mensal' | 'anual') => void
  regimeAtualFiltro: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  setRegimeAtualFiltro: (r: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') => void

  // Integração Dados da Empresa
  origemDadosEmpresa: boolean
  restaurarDadosEmpresaNoModulo: (modulo: 2 | 3 | 4 | 5) => void

  // Salvar / Restaurar Simulação Completa
  obterSnapshotParametros: () => ParametrosSimulacaoCalculadora
  obterSnapshotResultados: () => ResultadosSimulacaoCalculadora
  restaurarSimulacao: (parametros: ParametrosSimulacaoCalculadora) => void

  // Resultados calculados derivados
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
  }

  resultadoComparativo: {
    lucroReal: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
    }
    lucroPresumido: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
    }
    simplesNacional: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
      faixaEncontrada: string
      fatorR: number
      anexoUtilizado: string
    }
    ibsCbs: {
      pisOuCbs: number // CBS
      cofinsOuIbs: number // IBS
      ipiOuIcmsOuIss: number // 0 (ou Imposto Seletivo se aplicável)
      impostoSeletivo: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
      reducaoAplicadaPercentual: number
    }
    regimeMaisVantajoso: string
    piorCenario: string
    economiaVersusPior: number
    economiaPercentual: number
    dadosAdicionais: {
      fatorR: number
      fatorRPercent: number
      fatorRQualificaAnexoIII: boolean
      margemLucroEfetiva: number
      creditosDespesasReal: number
      creditosDespesasIbsCbs: number
      aliquotaIcmsAplicada: number
      origemIcms: string
      receitaExportacaoIsenta: number
      receitaTributavelInterna: number
      subatividadeAtivaNome: string
      presuncaoIrpjAplicada: number
      presuncaoCsllAplicada: number
      irpjCsllPresumidoEstimado: number
      irpjCsllRealEstimado: number
      sujeitoImpostoSeletivo: boolean
      isIcmsSubstituicaoTributaria: boolean
      impactosDidaticosSubatividade: string[]
    }
  }

  resultadoCreditos: {
    totalAntigo: number
    totalNovo: number
    adicionalGanho: number
    aumentoPercentual: number
    economiaAnual: number
  }

  resultadoTransicao: Array<{
    ano: number
    fase: string
    aliquotaCbs: number
    aliquotaIbs: number
    statusIcms: string
    statusIss: string
    statusIpi: string
    statusPisCofins: string
    impostoEstimado: number
    aliquotaEfetivaTotal: number
    impostoCenarioAtual: number
    diferencaAno: number
    creditoEstoqueAno: number
    impostoComCreditoEstoque: number
    alertaCritico?: string
  }>

  // Etapa 3: Alertas dos Limites do Simples
  alertaLimitesSimples: {
    faturamentoAnualProjetado: number
    statusTeto: 'verde' | 'amarelo' | 'vermelho'
    statusSublimite: 'verde' | 'amarelo' | 'vermelho'
    tetoMaximo: number // 4.800.000
    sublimiteMaximo: number // 3.600.000
    margemRestanteTeto: number
    margemRestanteSublimite: number
    percentualAtingidoTeto: number
    percentualAtingidoSublimite: number
    mensagemTeto: string
    mensagemSublimite: string
    isHibrido: boolean // Entre 3.6M e 4.8M
    isDesenquadrado: boolean // > 4.8M
  }

  // Etapa 4: Impacto do Split Payment no Fluxo de Caixa
  resultadoSplitPayment: {
    retencaoMensalNota: number // CBS + IBS retidos no ato da nota fiscal
    recolhimentoAtualMensal: number // Guia DAS / DARF recolhida no dia 20 do mês seguinte
    diferencaFluxoCaixa: number
    taxaMensalCapital: number
    diasAntecipacao: number
    custoCapitalMensal: number
    custoCapitalAnual: number
    explicacaoSimples: string
  }

  // Etapa 5: Crédito Presumido de Estoque na Transição
  resultadoEstoque: {
    valorEstoqueVirada: number
    aliquotaCreditoPresumido: number
    creditoTotalEstoque: number
    economiaAno1: number
    explicacaoSimples: string
  }

  resultadoDashboard: {
    aliquotaEfetivaAtual: number
    aliquotaEfetivaNova: number
    economiaMensalProjetada: number
    economiaAnualProjetada: number
    regimeRecomendado: string
  }
}

const CalculadoraContext = createContext<CalculadoraContextType | undefined>(undefined)

export function CalculadoraProvider({ children }: { children: React.ReactNode }) {
  // Carrega perfil inicial de Dados da Empresa
  const perfilInicial = useMemo(() => carregarDadosEmpresa(), [])
  const [origemDadosEmpresa, setOrigemDadosEmpresa] = useState<boolean>(() =>
    existeDadosEmpresaSalvos(),
  )

  // Módulo 1: Configurações Gerais
  const [config, setConfig] = useState<ConfiguracoesGerais>(CONFIGURACOES_PADRAO)

  const updateConfig = (novas: Partial<ConfiguracoesGerais>) => {
    setConfig((prev) => {
      const next = { ...prev, ...novas }
      // Recalcular soma IVA Dual se CBS ou IBS mudar isoladamente sem passar totalIvaDual
      if (novas.cbsPadrao !== undefined || novas.ibsPadrao !== undefined) {
        if (novas.totalIvaDual === undefined) {
          next.totalIvaDual = Number((next.cbsPadrao + next.ibsPadrao).toFixed(2))
        }
      }
      return next
    })
  }

  const resetConfig = () => setConfig(CONFIGURACOES_PADRAO)

  // Módulo 2: Calculadora Simples (inicializado a partir dos Dados da Empresa)
  const [valorOperacao, setValorOperacao] = useState<number>(
    () => perfilInicial.faturamentoMensal || 50000,
  )
  const [regimeOperacao, setRegimeOperacao] = useState<RegimeDiferenciadoTipo>('padrao')
  const [percentualComprasVendasSimples, setPercentualComprasVendasSimples] = useState<number>(
    () => perfilInicial.percentualComprasVendas ?? 40,
  )

  // Módulo 3: Comparativo por Regime (inicializado a partir dos Dados da Empresa)
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(
    () => perfilInicial.faturamentoMensal || 200000,
  )
  const [tipoAtividade, setTipoAtividade] = useState<TipoAtividade>(
    () => perfilInicial.tipoAtividade || 'servico',
  )
  // Subatividades por ramo
  const [subatividadeServico, setSubatividadeServico] = useState<SubatividadeServico>(
    () => perfilInicial.subatividadeServico || 'servico_comum',
  )
  const [subatividadeIndustria, setSubatividadeIndustria] = useState<SubatividadeIndustria>(
    () => perfilInicial.subatividadeIndustria || 'industria_comum',
  )
  const [subatividadeComercio, setSubatividadeComercio] = useState<SubatividadeComercio>(
    () => perfilInicial.subatividadeComercio || 'varejo_comum',
  )
  const [aliquotaImpostoSeletivo, setAliquotaImpostoSeletivo] = useState<number>(10)

  const [proporcaoServicoMisto, setProporcaoServicoMisto] = useState<number>(
    () => perfilInicial.proporcaoServicoMisto ?? 50,
  )
  const [percentualComprasVendasComparativo, setPercentualComprasVendasComparativo] =
    useState<number>(() => perfilInicial.percentualComprasVendas ?? 40)
  // Campos refinados do Módulo 3
  const [folhaPagamentoMensal, setFolhaPagamentoMensal] = useState<number>(
    () => perfilInicial.folhaPagamentoMensal || 50000,
  )
  const [margemLucroEstimada, setMargemLucroEstimada] = useState<number>(
    () => perfilInicial.margemLucroEstimada ?? 20,
  ) // %
  const [despesasComCreditosMensais, setDespesasComCreditosMensais] = useState<number>(
    () => perfilInicial.despesasComCreditosMensais || 30000,
  )
  const [percentualExportacao, setPercentualExportacao] = useState<number>(
    () => perfilInicial.percentualExportacao ?? 0,
  )
  const [ufOrigem, setUfOrigem] = useState<string>(() => perfilInicial.ufOrigem || 'SP')

  // Módulo 4: Simulador de Créditos (proporcionaliza categorias quando houver perfil)
  const gerarCategoriasIniciais = (): CategoriaDespesaCredito[] => {
    const despesaPerfil = perfilInicial.despesasComCreditosMensais || 30000
    // O padrão soma 33.000. Se o perfil tiver valor diferente, escala proporcionalmente
    const proporcao = despesaPerfil / 33000
    return CATEGORIAS_CREDITO_PADRAO.map((item) => ({
      ...item,
      valorMensal: Math.round(item.valorMensal * proporcao),
    }))
  }

  const [despesasCreditos, setDespesasCreditos] =
    useState<CategoriaDespesaCredito[]>(gerarCategoriasIniciais)

  const updateDespesaCredito = (id: string, updates: Partial<CategoriaDespesaCredito>) => {
    setDespesasCreditos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
  }

  const resetDespesasCreditos = () => setDespesasCreditos(CATEGORIAS_CREDITO_PADRAO)

  // Módulo 5: Transição (faturamento anual = faturamentoMensal * 12)
  const [faturamentoAnualProjetado, setFaturamentoAnualProjetado] = useState<number>(() =>
    perfilInicial.faturamentoMensal ? perfilInicial.faturamentoMensal * 12 : 2400000,
  )
  const [setorTransicao, setSetorTransicao] = useState<TipoAtividade>(
    () => perfilInicial.tipoAtividade || 'servico',
  )
  // Etapa 5: Valor do estoque na virada (padrão estimado em ~1 a 2 meses de compras da empresa)
  const [valorEstoqueVirada, setValorEstoqueVirada] = useState<number>(() => {
    const fat = perfilInicial.faturamentoMensal || 200000
    const pct = (perfilInicial.percentualComprasVendas ?? 40) / 100
    // Estimativa inicial: 1,5 meses de compras
    return Math.round(fat * pct * 1.5)
  })

  // Etapa 4: Split Payment parâmetros
  const [taxaMensalCapitalGiro, setTaxaMensalCapitalGiro] = useState<number>(1.0) // 1.0% a.m. (CDI aproximado)
  const [diasAntecipacaoSplit, setDiasAntecipacaoSplit] = useState<number>(30) // ~30 dias entre nota e guia dia 20

  // Módulo 6: Dashboard filtros
  const [periodoDashboard, setPeriodoDashboard] = useState<'mensal' | 'anual'>('mensal')
  const [regimeAtualFiltro, setRegimeAtualFiltro] = useState<
    'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  >(() => {
    if (perfilInicial.regimeAtual?.includes('Real')) return 'Lucro Real'
    if (perfilInicial.regimeAtual?.includes('Simples')) return 'Simples Nacional'
    return 'Lucro Presumido'
  })

  // Listener para sincronização automática se o usuário salvar dados em outra aba ou na página /dados-empresa
  React.useEffect(() => {
    const handleSync = () => {
      const p = carregarDadosEmpresa()
      setOrigemDadosEmpresa(existeDadosEmpresaSalvos())
    }
    window.addEventListener(STORAGE_EVENT, handleSync)
    return () => window.removeEventListener(STORAGE_EVENT, handleSync)
  }, [])

  // Função para obter o snapshot dos parâmetros de entrada atuais
  const obterSnapshotParametros = (): ParametrosSimulacaoCalculadora => {
    const perfil = carregarDadosEmpresa()
    return {
      config,
      valorOperacao,
      regimeOperacao,
      percentualComprasVendasSimples,
      faturamentoMensal,
      tipoAtividade,
      subatividadeServico,
      subatividadeIndustria,
      subatividadeComercio,
      aliquotaImpostoSeletivo,
      proporcaoServicoMisto,
      percentualComprasVendasComparativo,
      folhaPagamentoMensal,
      margemLucroEstimada,
      despesasComCreditosMensais,
      percentualExportacao,
      ufOrigem,
      despesasCreditos,
      faturamentoAnualProjetado,
      setorTransicao,
      valorEstoqueVirada,
      taxaMensalCapitalGiro,
      diasAntecipacaoSplit,
      periodoDashboard,
      regimeAtualFiltro,
      empresa: perfil.nomeEmpresa,
      cnpj: perfil.cnpj,
      nomeContato: perfil.nomeContato,
    }
  }

  // Função para restaurar integralmente o estado da calculadora a partir de uma simulação salva
  const restaurarSimulacao = (p: ParametrosSimulacaoCalculadora) => {
    if (p.config) setConfig(p.config)
    if (p.valorOperacao !== undefined) setValorOperacao(p.valorOperacao)
    if (p.regimeOperacao) setRegimeOperacao(p.regimeOperacao)
    if (p.percentualComprasVendasSimples !== undefined)
      setPercentualComprasVendasSimples(p.percentualComprasVendasSimples)

    if (p.faturamentoMensal !== undefined) setFaturamentoMensal(p.faturamentoMensal)
    if (p.tipoAtividade) setTipoAtividade(p.tipoAtividade)
    if (p.subatividadeServico) setSubatividadeServico(p.subatividadeServico)
    if (p.subatividadeIndustria) setSubatividadeIndustria(p.subatividadeIndustria)
    if (p.subatividadeComercio) setSubatividadeComercio(p.subatividadeComercio)
    if (p.aliquotaImpostoSeletivo !== undefined)
      setAliquotaImpostoSeletivo(p.aliquotaImpostoSeletivo)
    if (p.proporcaoServicoMisto !== undefined) setProporcaoServicoMisto(p.proporcaoServicoMisto)
    if (p.percentualComprasVendasComparativo !== undefined)
      setPercentualComprasVendasComparativo(p.percentualComprasVendasComparativo)
    if (p.folhaPagamentoMensal !== undefined) setFolhaPagamentoMensal(p.folhaPagamentoMensal)
    if (p.margemLucroEstimada !== undefined) setMargemLucroEstimada(p.margemLucroEstimada)
    if (p.despesasComCreditosMensais !== undefined)
      setDespesasComCreditosMensais(p.despesasComCreditosMensais)
    if (p.percentualExportacao !== undefined) setPercentualExportacao(p.percentualExportacao)
    if (p.ufOrigem) setUfOrigem(p.ufOrigem)

    if (p.despesasCreditos && Array.isArray(p.despesasCreditos)) {
      setDespesasCreditos(p.despesasCreditos)
    }

    if (p.faturamentoAnualProjetado !== undefined)
      setFaturamentoAnualProjetado(p.faturamentoAnualProjetado)
    if (p.setorTransicao) setSetorTransicao(p.setorTransicao)
    if (p.valorEstoqueVirada !== undefined) setValorEstoqueVirada(p.valorEstoqueVirada)
    if (p.taxaMensalCapitalGiro !== undefined) setTaxaMensalCapitalGiro(p.taxaMensalCapitalGiro)
    if (p.diasAntecipacaoSplit !== undefined) setDiasAntecipacaoSplit(p.diasAntecipacaoSplit)

    if (p.periodoDashboard) setPeriodoDashboard(p.periodoDashboard)
    if (p.regimeAtualFiltro) setRegimeAtualFiltro(p.regimeAtualFiltro)
  }

  // Função para restaurar os dados da empresa especificamente para um módulo
  const restaurarDadosEmpresaNoModulo = (modulo: 2 | 3 | 4 | 5) => {
    const p = carregarDadosEmpresa()
    if (modulo === 2) {
      setValorOperacao(p.faturamentoMensal || 50000)
      setPercentualComprasVendasSimples(p.percentualComprasVendas ?? 40)
    } else if (modulo === 3) {
      setFaturamentoMensal(p.faturamentoMensal || 200000)
      setTipoAtividade(p.tipoAtividade || 'servico')
      setSubatividadeServico(p.subatividadeServico || 'servico_comum')
      setSubatividadeIndustria(p.subatividadeIndustria || 'industria_comum')
      setSubatividadeComercio(p.subatividadeComercio || 'varejo_comum')
      setProporcaoServicoMisto(p.proporcaoServicoMisto ?? 50)
      setPercentualComprasVendasComparativo(p.percentualComprasVendas ?? 40)
      setFolhaPagamentoMensal(p.folhaPagamentoMensal || 50000)
      setMargemLucroEstimada(p.margemLucroEstimada ?? 20)
      setDespesasComCreditosMensais(p.despesasComCreditosMensais || 30000)
      setPercentualExportacao(p.percentualExportacao ?? 0)
      setUfOrigem(p.ufOrigem || 'SP')
    } else if (modulo === 4) {
      const despesaPerfil = p.despesasComCreditosMensais || 30000
      const proporcao = despesaPerfil / 33000
      setDespesasCreditos(
        CATEGORIAS_CREDITO_PADRAO.map((item) => ({
          ...item,
          valorMensal: Math.round(item.valorMensal * proporcao),
        })),
      )
    } else if (modulo === 5) {
      setFaturamentoAnualProjetado(p.faturamentoMensal ? p.faturamentoMensal * 12 : 2400000)
      setSetorTransicao(p.tipoAtividade || 'servico')
    }
  }

  // ==========================================
  // CÁLCULO MÓDULO 2 (Calculadora Simples)
  // ==========================================
  const resultadoSimples = useMemo(() => {
    let aliquotaTotal = config.totalIvaDual
    let aliqCbs = config.cbsPadrao
    let aliqIbs = config.ibsPadrao

    if (regimeOperacao === 'saude_educacao') {
      aliquotaTotal = config.saudeEducacaoAliquota // 10.60%
      // Rateio proporcional entre CBS e IBS (8.8 / 26.5 e 17.7 / 26.5)
      const ratioCbs = config.cbsPadrao / (config.totalIvaDual || 1)
      aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
      aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
    } else if (regimeOperacao === 'transporte') {
      aliquotaTotal = config.transporteAliquota // 18.55%
      const ratioCbs = config.cbsPadrao / (config.totalIvaDual || 1)
      aliqCbs = Number((aliquotaTotal * ratioCbs).toFixed(2))
      aliqIbs = Number((aliquotaTotal - aliqCbs).toFixed(2))
    } else if (regimeOperacao === 'cesta_basica') {
      aliquotaTotal = config.cestaBasicaIsencao // 0%
      aliqCbs = 0
      aliqIbs = 0
    }

    const valor = Math.max(0, valorOperacao)
    const debitoCbs = (valor * aliqCbs) / 100
    const debitoIbs = (valor * aliqIbs) / 100
    const totalDebito = debitoCbs + debitoIbs

    // Créditos = valor × percentual de compras × alíquota total
    const pctCompras = Math.max(0, percentualComprasVendasSimples) / 100
    // O crédito na aquisição ocorre na alíquota padrão plena (não-cumulatividade ampla)
    const valorCreditos = valor * pctCompras * (config.totalIvaDual / 100)

    // A recolher = débito - créditos
    const valorARecolher = Math.max(0, totalDebito - valorCreditos)
    const aliquotaEfetiva = valor > 0 ? (valorARecolher / valor) * 100 : 0
    const valorTotalNotaFiscal = valor // No IVA por fora com split payment, o valor bruto da operação é a base

    return {
      aliquotaCbsAplicada: aliqCbs,
      aliquotaIbsAplicada: aliqIbs,
      aliquotaTotalAplicada: aliquotaTotal,
      debitoCbs,
      debitoIbs,
      totalDebito,
      valorCreditos,
      valorARecolher,
      aliquotaEfetiva,
      valorTotalNotaFiscal,
    }
  }, [config, valorOperacao, regimeOperacao, percentualComprasVendasSimples])

  // ==========================================
  // CÁLCULO MÓDULO 3 (Comparativo por Regime)
  // ==========================================
  const resultadoComparativo = useMemo(() => {
    const faturamentoBruto = Math.max(0, faturamentoMensal)
    const pctExp = Math.max(0, Math.min(100, percentualExportacao || 0)) / 100
    const receitaExportacao = faturamentoBruto * pctExp
    // Receita tributável no mercado interno (desonerada de exportação)
    const faturamentoInternoTributavel = Math.max(0, faturamentoBruto - receitaExportacao)

    const pctCompras = Math.max(0, percentualComprasVendasComparativo) / 100
    // Compras proporcionais sobre o faturamento total da operação
    const comprasValor = faturamentoBruto * pctCompras
    const despesasCreditos = Math.max(0, despesasComCreditosMensais || 0)
    const folha = Math.max(0, folhaPagamentoMensal || 0)

    // Alíquota de ICMS: se UF for selecionada, usar a alíquota interna padrão da UF; senão usar a do Módulo 1 (config.lucroRealIcms / config.lucroPresumidoIcms)
    let aliqIcmsReal = config.lucroRealIcms
    let aliqIcmsPresumido = config.lucroPresumidoIcms
    let origemIcms = 'Módulo 1 (Configurações Gerais)'

    if (ufOrigem) {
      // Tabela de UFs
      const mapaUf: Record<string, number> = {
        AC: 19,
        AL: 19,
        AM: 20,
        AP: 18,
        BA: 20.5,
        CE: 20,
        DF: 20,
        ES: 17,
        GO: 19,
        MA: 22,
        MG: 18,
        MS: 17,
        MT: 17,
        PA: 19,
        PB: 20,
        PE: 20.5,
        PI: 21,
        PR: 19.5,
        RJ: 20,
        RN: 18,
        RO: 19.5,
        RR: 20,
        RS: 17,
        SC: 17,
        SE: 19,
        SP: 18,
        TO: 20,
      }
      if (mapaUf[ufOrigem]) {
        aliqIcmsReal = mapaUf[ufOrigem]
        aliqIcmsPresumido = mapaUf[ufOrigem]
        origemIcms = `UF de Origem: ${ufOrigem} (${mapaUf[ufOrigem]}%)`
      }
    }

    // Identificação das subatividades ativas
    const infoSubServico =
      SUBATIVIDADES_SERVICO.find((s) => s.id === subatividadeServico) || SUBATIVIDADES_SERVICO[0]
    const infoSubIndustria =
      SUBATIVIDADES_INDUSTRIA.find((s) => s.id === subatividadeIndustria) ||
      SUBATIVIDADES_INDUSTRIA[0]
    const infoSubComercio =
      SUBATIVIDADES_COMERCIO.find((s) => s.id === subatividadeComercio) || SUBATIVIDADES_COMERCIO[0]

    // Determinar dados conforme o ramo e a subatividade
    let subatividadeNome = ''
    let presuncaoIrpj = 32
    let presuncaoCsll = 32
    let taxaIpiIcmsIssReal = 0
    let taxaIpiIcmsIssPresumido = 0
    let nomeImpostoIndireto = ''
    let reducaoIbsCbsPct = 0
    let temImpostoSeletivo = false
    let isIcmsSt = false
    const impactosDidaticos: string[] = []

    if (tipoAtividade === 'servico') {
      subatividadeNome = infoSubServico.label
      presuncaoIrpj = infoSubServico.presuncaoIrpj
      presuncaoCsll = infoSubServico.presuncaoCsll
      reducaoIbsCbsPct = infoSubServico.reducaoIbsCbsPercentual || 0

      taxaIpiIcmsIssReal = config.lucroRealIss
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
      nomeImpostoIndireto = `ISS (${config.lucroPresumidoIss}%)`

      if (presuncaoIrpj === 16) {
        impactosDidaticos.push(
          'Transporte tem presunção de IRPJ favorecida de 16% (contra 32% dos serviços em geral) no Lucro Presumido.',
        )
      } else {
        impactosDidaticos.push('Presunção padrão de 32% para serviços em geral no Lucro Presumido.')
      }

      if (reducaoIbsCbsPct === 60) {
        impactosDidaticos.push(
          'Benefício do Regime Diferenciado no IBS/CBS: redução legal de 60% na alíquota padrão (EC 132/2023).',
        )
      } else if (reducaoIbsCbsPct === 30) {
        impactosDidaticos.push(
          'Benefício do Regime Diferenciado de Transporte no IBS/CBS: redução legal de 30% na alíquota padrão.',
        )
      }
    } else if (tipoAtividade === 'industria') {
      subatividadeNome = infoSubIndustria.label
      presuncaoIrpj = infoSubIndustria.presuncaoIrpj
      presuncaoCsll = infoSubIndustria.presuncaoCsll
      reducaoIbsCbsPct = infoSubIndustria.reducaoIbsCbsPercentual || 0
      temImpostoSeletivo = !!infoSubIndustria.sujeitoImpostoSeletivo

      const aliqIpi =
        infoSubIndustria.aliquotaIpi !== undefined
          ? infoSubIndustria.aliquotaIpi
          : config.lucroRealIpi
      taxaIpiIcmsIssReal = aliqIpi
      taxaIpiIcmsIssPresumido = aliqIpi
      nomeImpostoIndireto = `IPI (${aliqIpi}%)`

      impactosDidaticos.push(
        `Alíquota de IPI configurada em ${aliqIpi}% para o setor industrial (com crédito integral na compra de insumos no Lucro Real).`,
      )
      if (temImpostoSeletivo) {
        impactosDidaticos.push(
          `Produto sujeito ao Imposto Seletivo ("imposto do pecado" — ${aliquotaImpostoSeletivo}%), mantido no novo sistema sobre bens prejudiciais à saúde/ambiente.`,
        )
      }
    } else if (tipoAtividade === 'comercio') {
      subatividadeNome = infoSubComercio.label
      presuncaoIrpj = infoSubComercio.presuncaoIrpj
      presuncaoCsll = infoSubComercio.presuncaoCsll
      reducaoIbsCbsPct = infoSubComercio.reducaoIbsCbsPercentual || 0

      if (infoSubComercio.id === 'com_icms_st') {
        isIcmsSt = true
        // No ICMS-ST, o ICMS próprio da revenda é praticamente 0% (já recolhido na fonte pelo fabricante)
        taxaIpiIcmsIssReal = 0
        taxaIpiIcmsIssPresumido = 0
        nomeImpostoIndireto = 'ICMS Próprio ≈ 0% (ICMS-ST retido na origem)'
        impactosDidaticos.push(
          'Como sua atividade é comércio com ICMS-ST, o ICMS próprio no sistema antigo é praticamente zero — o imposto já foi pago antecipadamente pelo fabricante. No entanto, o custo vem embutido no preço de compra.',
        )
      } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
        taxaIpiIcmsIssReal = infoSubComercio.aliquotaIcmsOverride
        taxaIpiIcmsIssPresumido = infoSubComercio.aliquotaIcmsOverride
        nomeImpostoIndireto = `ICMS Atacado (${infoSubComercio.aliquotaIcmsOverride}%)`
        impactosDidaticos.push(
          `Atacado/Distribuição com alíquota interestadual/reduzida de ICMS (${infoSubComercio.aliquotaIcmsOverride}%).`,
        )
      } else {
        taxaIpiIcmsIssReal = aliqIcmsReal
        taxaIpiIcmsIssPresumido = aliqIcmsPresumido
        nomeImpostoIndireto = `ICMS Varejo (${aliqIcmsReal}%)`
        impactosDidaticos.push(
          `Comércio varejista com ICMS padrão de ${aliqIcmsReal}% (${origemIcms}) e presunção de 8% no Lucro Presumido.`,
        )
      }
    } else {
      // Misto: Serviço + Comércio ponderado pela proporção configurável
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const pCom = 1 - pServ

      subatividadeNome = `Misto: ${infoSubServico.label} (${Math.round(pServ * 100)}%) + ${infoSubComercio.label} (${Math.round(pCom * 100)}%)`
      presuncaoIrpj = Number(
        (infoSubServico.presuncaoIrpj * pServ + infoSubComercio.presuncaoIrpj * pCom).toFixed(2),
      )
      presuncaoCsll = Number(
        (infoSubServico.presuncaoCsll * pServ + infoSubComercio.presuncaoCsll * pCom).toFixed(2),
      )
      reducaoIbsCbsPct = Number(
        (
          (infoSubServico.reducaoIbsCbsPercentual || 0) * pServ +
          (infoSubComercio.reducaoIbsCbsPercentual || 0) * pCom
        ).toFixed(2),
      )

      let aliqComercioReal = aliqIcmsReal
      let aliqComercioPres = aliqIcmsPresumido
      if (infoSubComercio.id === 'com_icms_st') {
        aliqComercioReal = 0
        aliqComercioPres = 0
        isIcmsSt = true
      } else if (infoSubComercio.aliquotaIcmsOverride !== undefined) {
        aliqComercioReal = infoSubComercio.aliquotaIcmsOverride
        aliqComercioPres = infoSubComercio.aliquotaIcmsOverride
      }

      taxaIpiIcmsIssReal = config.lucroRealIss * pServ + aliqComercioReal * pCom
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss * pServ + aliqComercioPres * pCom
      nomeImpostoIndireto = `ISS (${Math.round(pServ * 100)}%) + ICMS (${Math.round(pCom * 100)}%)`

      impactosDidaticos.push(
        `Atividade mista calculada proporcionalmente: ${Math.round(pServ * 100)}% Serviço (presunção ${infoSubServico.presuncaoIrpj}%) e ${Math.round(pCom * 100)}% Comércio (presunção ${infoSubComercio.presuncaoIrpj}%).`,
      )
      if (reducaoIbsCbsPct > 0) {
        impactosDidaticos.push(
          `Redução ponderada do IBS/CBS na parte de serviço: ${reducaoIbsCbsPct}% de redução média sobre a receita.`,
        )
      }
      if (isIcmsSt) {
        impactosDidaticos.push(
          'A fração do comércio opera sob regime de ICMS-ST, reduzindo a incidência direta do ICMS próprio para ≈ 0%.',
        )
      }
    }

    // ----------------------------------------------------
    // 1. LUCRO REAL
    // ----------------------------------------------------
    // Margem de lucro: padrão 20% se não especificada
    const margemReal =
      margemLucroEstimada !== undefined && margemLucroEstimada !== null
        ? Math.max(0, margemLucroEstimada)
        : 20
    const margemDecimal = margemReal / 100
    // Lucro efetivo apurado (faturamento total × margem)
    const lucroOperacionalEfetivo = faturamentoBruto * margemDecimal

    // Débitos PIS, COFINS e Indireto sobre a receita tributável (excluindo exportação)
    const lrPisNominal = (faturamentoInternoTributavel * config.lucroRealPis) / 100
    const lrCofinsNominal = (faturamentoInternoTributavel * config.lucroRealCofins) / 100
    const lrIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssReal) / 100
    const lrTotalNominal = lrPisNominal + lrCofinsNominal + lrIndiretoNominal

    // Créditos Lucro Real:
    // a) Compras de insumos/mercadorias (PIS 1,65% + COFINS 7,60% + ICMS/IPI conforme atividade)
    // Se for ICMS-ST, as compras de revenda não geram crédito de ICMS próprio destacado
    const aliqCreditoRealCompras =
      tipoAtividade === 'servico'
        ? config.lucroRealPis + config.lucroRealCofins
        : isIcmsSt
          ? config.lucroRealPis + config.lucroRealCofins
          : config.lucroRealPis + config.lucroRealCofins + taxaIpiIcmsIssReal
    const creditosComprasReal = (comprasValor * aliqCreditoRealCompras) / 100

    // b) Despesas com créditos mensais (energia, aluguel, insumos operacionais - PIS 1,65% + COFINS 7,60% = 9,25%)
    const aliqPisCofinsReal = config.lucroRealPis + config.lucroRealCofins
    const creditosDespesasReal = (despesasCreditos * aliqPisCofinsReal) / 100

    const lrCreditosTotal = creditosComprasReal + creditosDespesasReal
    const lrTotalEfetivo = Math.max(0, lrTotalNominal - lrCreditosTotal)
    const lrAliqEfetiva = faturamentoBruto > 0 ? (lrTotalEfetivo / faturamentoBruto) * 100 : 0

    // IRPJ/CSLL no Lucro Real (alíquotas oficiais: IRPJ 15% + adicional 10% sobre excedente a 20k + CSLL 9% = ~24% sobre o lucro contábil)
    const irpjCsllRealEstimado =
      lucroOperacionalEfetivo > 0
        ? lucroOperacionalEfetivo * 0.15 +
          Math.max(0, lucroOperacionalEfetivo - 20000) * 0.1 +
          lucroOperacionalEfetivo * 0.09
        : 0

    // ----------------------------------------------------
    // 2. LUCRO PRESUMIDO (Regime cumulativo)
    // ----------------------------------------------------
    // Exportação desonera a base proporcionalmente
    const lpPisNominal = (faturamentoInternoTributavel * config.lucroPresumidoPis) / 100
    const lpCofinsNominal = (faturamentoInternoTributavel * config.lucroPresumidoCofins) / 100
    const lpIndiretoNominal = (faturamentoInternoTributavel * taxaIpiIcmsIssPresumido) / 100
    const lpTotalNominal = lpPisNominal + lpCofinsNominal + lpIndiretoNominal
    const lpCreditos = 0 // Cumulativo: não gera créditos
    const lpTotalEfetivo = lpTotalNominal
    const lpAliqEfetiva = faturamentoBruto > 0 ? (lpTotalEfetivo / faturamentoBruto) * 100 : 0

    // IRPJ e CSLL no Lucro Presumido com base na presunção da subatividade
    // Base IRPJ = Receita * presunção IRPJ %; IRPJ = 15% + 10% adicional
    // Base CSLL = Receita * presunção CSLL %; CSLL = 9%
    const basePresumidaIrpj = (faturamentoInternoTributavel * presuncaoIrpj) / 100
    const basePresumidaCsll = (faturamentoInternoTributavel * presuncaoCsll) / 100
    const irpjPresumido = basePresumidaIrpj * 0.15 + Math.max(0, basePresumidaIrpj - 20000) * 0.1
    const csllPresumido = basePresumidaCsll * 0.09
    const irpjCsllPresumidoEstimado = irpjPresumido + csllPresumido

    // ----------------------------------------------------
    // 3. SIMPLES NACIONAL (com Fator R real e Anexos III vs V)
    // ----------------------------------------------------
    const rbt12 = faturamentoBruto * 12
    const folha12 = folha * 12
    const fatorR = faturamentoBruto > 0 ? folha / faturamentoBruto : 0
    const fatorRPercent = Math.round(fatorR * 1000) / 10
    const qualificaAnexoIII = fatorR >= 0.28

    let tabelaSimples = TABELAS_SIMPLES.anexoIII
    let faixaNome = 'Anexo III'
    let anexoCod = 'Anexo III'

    if (tipoAtividade === 'comercio') {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I (Comércio)'
      anexoCod = 'Anexo I'
    } else if (tipoAtividade === 'industria') {
      tabelaSimples = TABELAS_SIMPLES.anexoII
      faixaNome = 'Anexo II (Indústria)'
      anexoCod = 'Anexo II'
    } else if (tipoAtividade === 'servico') {
      // Serviços gerais sujeitos ao Fator R (LC 123/2006)
      if (qualificaAnexoIII) {
        tabelaSimples = TABELAS_SIMPLES.anexoIII
        faixaNome = `Anexo III (Fator R = ${fatorRPercent}% ≥ 28%)`
        anexoCod = 'Anexo III'
      } else {
        tabelaSimples = TABELAS_SIMPLES.anexoV
        faixaNome = `Anexo V (Fator R = ${fatorRPercent}% < 28%)`
        anexoCod = 'Anexo V'
      }
    } else {
      // Misto: ponderação entre Comércio (Anexo I) e Serviço (Anexo III ou V conforme Fator R)
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const tabServico = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
      const anexoServNome = qualificaAnexoIII ? 'Anexo III' : 'Anexo V'
      tabelaSimples = tabServico
      faixaNome = `Misto: Anexo I (${Math.round((1 - pServ) * 100)}%) + ${anexoServNome} (${Math.round(pServ * 100)}%)`
      anexoCod = `Misto (I + ${anexoServNome})`
    }

    let snAliqEfetiva = 0
    if (rbt12 <= 4800000 && rbt12 > 0) {
      if (tipoAtividade === 'misto') {
        const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
        const pCom = 1 - pServ
        const tabServ = qualificaAnexoIII ? TABELAS_SIMPLES.anexoIII : TABELAS_SIMPLES.anexoV
        const fServ = tabServ.find((f) => rbt12 <= f.max) || tabServ[tabServ.length - 1]
        const fCom =
          TABELAS_SIMPLES.anexoI.find((f) => rbt12 <= f.max) ||
          TABELAS_SIMPLES.anexoI[TABELAS_SIMPLES.anexoI.length - 1]
        const aliqServ = Math.max(0, ((rbt12 * (fServ.aliq / 100) - fServ.deducao) / rbt12) * 100)
        const aliqCom = Math.max(0, ((rbt12 * (fCom.aliq / 100) - fCom.deducao) / rbt12) * 100)
        snAliqEfetiva = aliqServ * pServ + aliqCom * pCom
      } else {
        const faixa =
          tabelaSimples.find((f) => rbt12 <= f.max) || tabelaSimples[tabelaSimples.length - 1]
        snAliqEfetiva = Math.max(0, ((rbt12 * (faixa.aliq / 100) - faixa.deducao) / rbt12) * 100)
      }
    } else if (rbt12 > 4800000) {
      // Excedente ao teto do Simples Nacional
      snAliqEfetiva = 19.0
      faixaNome = 'Excede o sublimite/teto de R$ 4,8M/ano'
    }

    // A receita de exportação é imune no Simples Nacional (LC 123/2006 art. 18 § 4º-A)
    // Assim, a alíquota incide sobre o faturamento tributável no mercado interno
    const snTotalEfetivo = (faturamentoInternoTributavel * snAliqEfetiva) / 100
    const snPis = snTotalEfetivo * 0.05
    const snCofins = snTotalEfetivo * 0.15
    const snIndireto = snTotalEfetivo * 0.35
    const snCreditos = 0
    const snAliqEfetivaSobreTotal =
      faturamentoBruto > 0 ? (snTotalEfetivo / faturamentoBruto) * 100 : 0

    // ----------------------------------------------------
    // 4. IBS / CBS (Novo IVA Dual)
    // ----------------------------------------------------
    // Incide sobre o faturamento tributável interno (exportações são 100% imunes com manutenção plena de créditos)
    // Aplicar a redução legal do regime diferenciado se a subatividade tiver redução (ex: 60% saúde/educação/TI, 30% transporte)
    const fatorAliquotaIbsCbs = Math.max(0, 1 - reducaoIbsCbsPct / 100)
    const aliquotaCbsEfetivaSaida = config.cbsPadrao * fatorAliquotaIbsCbs
    const aliquotaIbsEfetivaSaida = config.ibsPadrao * fatorAliquotaIbsCbs
    const aliquotaIvaDualEfetivaSaida = config.totalIvaDual * fatorAliquotaIbsCbs

    const cbsNominal = (faturamentoInternoTributavel * aliquotaCbsEfetivaSaida) / 100
    const ibsNominal = (faturamentoInternoTributavel * aliquotaIbsEfetivaSaida) / 100

    // Imposto Seletivo: caso a subatividade seja produto com IS
    const aliqIsEfetiva = temImpostoSeletivo ? Math.max(0, aliquotaImpostoSeletivo) : 0
    const valorImpostoSeletivo = (faturamentoInternoTributavel * aliqIsEfetiva) / 100

    const ibsCbsTotalNominal = cbsNominal + ibsNominal + valorImpostoSeletivo

    // Créditos plenos do IVA Dual:
    // a) Compras sobre vendas (comprasValor × taxa total do IVA Dual padrão - creditamento amplo)
    const creditosComprasIbsCbs = (comprasValor * config.totalIvaDual) / 100
    // b) Despesas com créditos informadas (despesas × taxa total do IVA Dual padrão)
    const creditosDespesasIbsCbs = (despesasCreditos * config.totalIvaDual) / 100
    const ibsCbsCreditosTotal = creditosComprasIbsCbs + creditosDespesasIbsCbs

    const ibsCbsTotalEfetivo = Math.max(0, ibsCbsTotalNominal - ibsCbsCreditosTotal)
    const ibsCbsAliqEfetiva =
      faturamentoBruto > 0 ? (ibsCbsTotalEfetivo / faturamentoBruto) * 100 : 0

    // Comparativo e ranking
    const cenarios = [
      { nome: 'Lucro Real', total: lrTotalEfetivo, aliq: lrAliqEfetiva },
      { nome: 'Lucro Presumido', total: lpTotalEfetivo, aliq: lpAliqEfetiva },
      { nome: 'Simples Nacional', total: snTotalEfetivo, aliq: snAliqEfetivaSobreTotal },
      { nome: 'IBS/CBS', total: ibsCbsTotalEfetivo, aliq: ibsCbsAliqEfetiva },
    ]

    const cenariosOrdenados = [...cenarios].sort((a, b) => a.total - b.total)
    const melhor = cenariosOrdenados[0]
    const pior = cenariosOrdenados[cenariosOrdenados.length - 1]
    const economia = Math.max(0, pior.total - melhor.total)
    const economiaPct = pior.total > 0 ? (economia / pior.total) * 100 : 0

    return {
      lucroReal: {
        pisOuCbs: lrPisNominal,
        cofinsOuIbs: lrCofinsNominal,
        ipiOuIcmsOuIss: lrIndiretoNominal,
        totalNominal: lrTotalNominal,
        creditos: lrCreditosTotal,
        totalEfetivo: lrTotalEfetivo,
        aliquotaEfetiva: lrAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroRealPis}% + COFINS ${config.lucroRealCofins}% + ${nomeImpostoIndireto}`,
      },
      lucroPresumido: {
        pisOuCbs: lpPisNominal,
        cofinsOuIbs: lpCofinsNominal,
        ipiOuIcmsOuIss: lpIndiretoNominal,
        totalNominal: lpTotalNominal,
        creditos: lpCreditos,
        totalEfetivo: lpTotalEfetivo,
        aliquotaEfetiva: lpAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroPresumidoPis}% + COFINS ${config.lucroPresumidoCofins}% + ${nomeImpostoIndireto} (Sem créditos)`,
      },
      simplesNacional: {
        pisOuCbs: snPis,
        cofinsOuIbs: snCofins,
        ipiOuIcmsOuIss: snIndireto,
        totalNominal: snTotalEfetivo,
        creditos: snCreditos,
        totalEfetivo: snTotalEfetivo,
        aliquotaEfetiva: snAliqEfetivaSobreTotal,
        detalheImpostos: `Guia única DAS (${faixaNome})`,
        faixaEncontrada: faixaNome,
        fatorR: fatorRPercent,
        anexoUtilizado: anexoCod,
      },
      ibsCbs: {
        pisOuCbs: cbsNominal,
        cofinsOuIbs: ibsNominal,
        ipiOuIcmsOuIss: valorImpostoSeletivo,
        impostoSeletivo: valorImpostoSeletivo,
        totalNominal: ibsCbsTotalNominal,
        creditos: ibsCbsCreditosTotal,
        totalEfetivo: ibsCbsTotalEfetivo,
        aliquotaEfetiva: ibsCbsAliqEfetiva,
        reducaoAplicadaPercentual: reducaoIbsCbsPct,
        detalheImpostos:
          reducaoIbsCbsPct > 0
            ? `CBS (${aliquotaCbsEfetivaSaida.toFixed(2)}%) + IBS (${aliquotaIbsEfetivaSaida.toFixed(2)}%) com redução de ${reducaoIbsCbsPct}%${temImpostoSeletivo ? ` + IS (${aliqIsEfetiva}%)` : ''}`
            : `CBS ${config.cbsPadrao}% + IBS ${config.ibsPadrao}%${temImpostoSeletivo ? ` + IS (${aliqIsEfetiva}%)` : ''} (Crédito amplo)`,
      },
      regimeMaisVantajoso: melhor.nome,
      piorCenario: pior.nome,
      economiaVersusPior: economia,
      economiaPercentual: economiaPct,
      dadosAdicionais: {
        fatorR,
        fatorRPercent,
        fatorRQualificaAnexoIII: qualificaAnexoIII,
        margemLucroEfetiva: margemReal,
        creditosDespesasReal,
        creditosDespesasIbsCbs,
        aliquotaIcmsAplicada: aliqIcmsReal,
        origemIcms,
        receitaExportacaoIsenta: receitaExportacao,
        receitaTributavelInterna: faturamentoInternoTributavel,
        subatividadeAtivaNome: subatividadeNome,
        presuncaoIrpjAplicada: presuncaoIrpj,
        presuncaoCsllAplicada: presuncaoCsll,
        irpjCsllPresumidoEstimado,
        irpjCsllRealEstimado,
        sujeitoImpostoSeletivo: temImpostoSeletivo,
        isIcmsSubstituicaoTributaria: isIcmsSt,
        impactosDidaticosSubatividade: impactosDidaticos,
      },
    }
  }, [
    config,
    faturamentoMensal,
    tipoAtividade,
    subatividadeServico,
    subatividadeIndustria,
    subatividadeComercio,
    aliquotaImpostoSeletivo,
    proporcaoServicoMisto,
    percentualComprasVendasComparativo,
    folhaPagamentoMensal,
    margemLucroEstimada,
    despesasComCreditosMensais,
    percentualExportacao,
    ufOrigem,
  ])

  // ==========================================
  // CÁLCULO MÓDULO 4 (Simulador de Créditos)
  // ==========================================
  const resultadoCreditos = useMemo(() => {
    let totalAntigo = 0
    let totalNovo = 0

    despesasCreditos.forEach((item) => {
      const v = Math.max(0, item.valorMensal)
      const cAntigo = (v * item.aliquotaAntiga) / 100
      const cNovo = (v * config.totalIvaDual) / 100 // 26,50%
      totalAntigo += cAntigo
      totalNovo += cNovo
    })

    const adicionalGanho = Math.max(0, totalNovo - totalAntigo)
    const aumentoPercentual = totalAntigo > 0 ? (adicionalGanho / totalAntigo) * 100 : 0
    const economiaAnual = adicionalGanho * 12

    return {
      totalAntigo,
      totalNovo,
      adicionalGanho,
      aumentoPercentual,
      economiaAnual,
    }
  }, [despesasCreditos, config.totalIvaDual])

  // ==========================================
  // ETAPA 3: ALERTAS DE LIMITES DO SIMPLES NACIONAL
  // ==========================================
  const alertaLimitesSimples = useMemo(() => {
    // Considera o faturamento anual projetado (ou faturamentoMensal × 12)
    const fatAnual = Math.max(0, faturamentoMensal * 12)
    const TETO = 4800000 // R$ 4,8 milhões/ano
    const SUBLIMITE = 3600000 // R$ 3,6 milhões/ano

    const pctTeto = (fatAnual / TETO) * 100
    const pctSublimite = (fatAnual / SUBLIMITE) * 100

    const margemRestanteTeto = Math.max(0, TETO - fatAnual)
    const margemRestanteSublimite = Math.max(0, SUBLIMITE - fatAnual)

    // Status do Teto (R$ 4,8M):
    // Verde: < 90% (< 4.320.000)
    // Amarelo: >= 90% e <= 100% (4.320.000 a 4.800.000)
    // Vermelho: > 100% (> 4.800.000)
    let statusTeto: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    let mensagemTeto = 'Faturamento dentro do limite legal do Simples Nacional.'

    if (fatAnual > TETO) {
      statusTeto = 'vermelho'
      const excesso = fatAnual - TETO
      mensagemTeto = `Desenquadramento obrigatório do Simples Nacional! Faturamento anual projetado excede o teto de R$ 4.800.000 em R$ ${excesso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. A empresa deve migrar para o Lucro Presumido, Lucro Real ou IBS/CBS.`
    } else if (pctTeto >= 90) {
      statusTeto = 'amarelo'
      mensagemTeto = `Atenção: faturamento anual projetado atingiu ${pctTeto.toFixed(1)}% do teto do Simples (R$ 4.800.000). Margem restante de segurança de R$ ${margemRestanteTeto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} antes do desenquadramento obrigatório.`
    }

    // Status do Sublimite (R$ 3,6M):
    // Verde: < 90% (< 3.240.000)
    // Amarelo: >= 90% e <= 100%
    // Vermelho: > 100% (Simples Híbrido)
    let statusSublimite: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    let mensagemSublimite = 'ICMS e ISS recolhidos unificados na guia DAS do Simples.'

    const isHibrido = fatAnual > SUBLIMITE && fatAnual <= TETO
    const isDesenquadrado = fatAnual > TETO

    if (fatAnual > SUBLIMITE) {
      statusSublimite = 'vermelho'
      mensagemSublimite = `Empresa no "Simples Híbrido": faturamento anual supera o sublimite de R$ 3.600.000. O ICMS estadual e o ISS municipal deixam de ser recolhidos na guia DAS unificada e passam a ser apurados por fora (débito/crédito regular), o que altera a competitividade frente ao novo IBS/CBS.`
    } else if (pctSublimite >= 90) {
      statusSublimite = 'amarelo'
      mensagemSublimite = `Aproximando do sublimite de R$ 3.600.000 (${pctSublimite.toFixed(1)}%). Restam R$ ${margemRestanteSublimite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} antes de passar a recolher ICMS e ISS por fora da guia do Simples.`
    }

    return {
      faturamentoAnualProjetado: fatAnual,
      statusTeto,
      statusSublimite,
      tetoMaximo: TETO,
      sublimiteMaximo: SUBLIMITE,
      margemRestanteTeto,
      margemRestanteSublimite,
      percentualAtingidoTeto: Number(pctTeto.toFixed(1)),
      percentualAtingidoSublimite: Number(pctSublimite.toFixed(1)),
      mensagemTeto,
      mensagemSublimite,
      isHibrido,
      isDesenquadrado,
    }
  }, [faturamentoMensal])

  // ==========================================
  // ETAPA 4: SPLIT PAYMENT (IMPACTO NO FLUXO DE CAIXA)
  // ==========================================
  const resultadoSplitPayment = useMemo(() => {
    // No IBS/CBS, o imposto bruto é retido diretamente na liquidação da nota/pagamento bancário
    // Valor mensal retido na nota (split payment bruto da saída)
    const fatInterno =
      resultadoComparativo.dadosAdicionais?.receitaTributavelInterna ?? faturamentoMensal
    const aliqTotalIbsCbs = config.totalIvaDual // 26,50%
    const fatorReducao = Math.max(
      0,
      1 - (resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0) / 100,
    )
    const aliquotaSaidaEfetiva = aliqTotalIbsCbs * fatorReducao

    // Retenção imediata no momento da nota / recebimento
    // Na prática do split payment inteligente, o sistema retém o valor apurado ou o débito destacado da nota
    const retencaoMensalNota = (fatInterno * aliquotaSaidaEfetiva) / 100

    // No sistema atual, o recolhimento se dá pela guia mensal (DAS no Simples dia 20, DARF PIS/COFINS dia 25, etc.)
    // Usamos o total efetivo apurado do regime atual selecionado
    let recolhimentoAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
    if (regimeAtualFiltro === 'Lucro Real') {
      recolhimentoAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
    } else if (regimeAtualFiltro === 'Lucro Presumido') {
      recolhimentoAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
    }

    // Diferença imediata no caixa: no split payment o dinheiro nem cai na conta corrente da empresa
    const diferencaFluxoCaixa = retencaoMensalNota - recolhimentoAtualMensal

    // Custo de oportunidade / capital de giro da antecipação
    // A empresa deixa de rentabilizar esse valor durante a média de dias de antecipação (padrão 30 dias)
    // Custo capital mensal = valor retido antecipado × taxa mensal × (dias / 30)
    const taxaDecimal = Math.max(0, taxaMensalCapitalGiro) / 100
    const fatorTempo = Math.max(1, diasAntecipacaoSplit) / 30
    const custoCapitalMensal = retencaoMensalNota * taxaDecimal * fatorTempo
    const custoCapitalAnual = custoCapitalMensal * 12

    const explicacaoSimples =
      'No novo sistema (IBS/CBS), a retenção tributária ocorre automaticamente na conta bancária no instante em que o cliente paga a nota (split payment). No modelo atual, a empresa recebe 100% do valor da venda e só desembolsa o imposto por guia no dia 20 do mês seguinte, utilizando esse caixa como capital de giro sem juros por até 30 a 50 dias. Essa antecipação gera um custo financeiro invisível equivalente aos juros de capital de giro ou perda de rendimento no CDI.'

    return {
      retencaoMensalNota,
      recolhimentoAtualMensal,
      diferencaFluxoCaixa,
      taxaMensalCapital: taxaMensalCapitalGiro,
      diasAntecipacao: diasAntecipacaoSplit,
      custoCapitalMensal,
      custoCapitalAnual,
      explicacaoSimples,
    }
  }, [
    faturamentoMensal,
    config.totalIvaDual,
    resultadoComparativo,
    regimeAtualFiltro,
    taxaMensalCapitalGiro,
    diasAntecipacaoSplit,
  ])

  // ==========================================
  // ETAPA 5: CRÉDITO PRESUMIDO DE ESTOQUE NA TRANSIÇÃO
  // ==========================================
  const resultadoEstoque = useMemo(() => {
    // Alíquota de crédito presumido de abertura na virada (CBS 8,80% na entrada plena em 2027)
    // LC 214/2025 prevê apropriação de crédito sobre os estoques inventariados no encerramento do regime anterior
    const estoque = Math.max(0, valorEstoqueVirada)
    // Alíquota de crédito de abertura: alíquota de CBS vigente em 2027 (8,80% ou taxa configurada)
    const aliqCredito = config.cbsPadrao // 8,80%
    const creditoTotalEstoque = (estoque * aliqCredito) / 100
    // O crédito de estoque é apropriado ao longo do primeiro ano de vigência plena (2027)
    const economiaAno1 = creditoTotalEstoque

    const explicacaoSimples =
      'As mercadorias e insumos estocados no encerramento de 2026 foram adquiridos sob as regras antigas. A reforma permite calcular um crédito presumido de abertura sobre esse estoque (LC 214/2025), garantindo que a empresa abata até 8,80% (CBS) do imposto a pagar no primeiro ano de transição (2027), evitando bitributação na revenda.'

    return {
      valorEstoqueVirada: estoque,
      aliquotaCreditoPresumido: aliqCredito,
      creditoTotalEstoque,
      economiaAno1,
      explicacaoSimples,
    }
  }, [valorEstoqueVirada, config.cbsPadrao])

  // ==========================================
  // CÁLCULO MÓDULO 5 (Transição 2026 a 2033) COM CRÉDITO DE ESTOQUE
  // ==========================================
  const resultadoTransicao = useMemo(() => {
    const anos = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
    const fatAnual = Math.max(0, faturamentoAnualProjetado)

    // Carga atual estimada de referência para comparação
    const aliqAtualEstimada =
      setorTransicao === 'servico'
        ? config.lucroPresumidoPis + config.lucroPresumidoCofins + config.lucroPresumidoIss // ~6,65%
        : setorTransicao === 'industria'
          ? config.lucroRealPis + config.lucroRealCofins + config.lucroRealIpi // ~14,25%
          : config.lucroRealPis + config.lucroRealCofins + config.lucroRealIcms // ~27,25% nominal
    const impostoAtual = (fatAnual * aliqAtualEstimada) / 100

    return anos.map((ano) => {
      let fase = ''
      let aliqCbs = 0
      let aliqIbs = 0
      let statusIcms = ''
      let statusIss = ''
      let statusIpi = ''
      let statusPisCofins = ''
      let alertaCritico: string | undefined = undefined

      if (ano === 2026) {
        fase = 'Fase de Teste Operacional'
        aliqCbs = 0.9
        aliqIbs = 0.1
        statusIcms = '100% Vigente'
        statusIss = '100% Vigente'
        statusIpi = '100% Vigente'
        statusPisCofins = '100% Vigente (CBS compensável)'
      } else if (ano === 2027) {
        fase = 'CBS Plena + Fim do PIS/COFINS'
        aliqCbs = Number((config.cbsPadrao - 0.1).toFixed(2)) // 8,7% com desconto transitório de 0,1 p.p.
        aliqIbs = 0.1 // estadual/municipal compensável
        statusIcms = '100% Vigente'
        statusIss = '100% Vigente'
        statusIpi = 'Alíquota Zero (exceto ZFM)'
        statusPisCofins = 'EXTINTOS (Substituídos por CBS)'
        alertaCritico =
          'Ano Crítico: Extinção definitiva de PIS/COFINS e início da CBS com crédito amplo e Imposto Seletivo.'
      } else if (ano === 2028) {
        fase = 'Consolidação CBS'
        aliqCbs = Number((config.cbsPadrao - 0.1).toFixed(2)) // 8,7%
        aliqIbs = 0.1
        statusIcms = '100% Vigente'
        statusIss = '100% Vigente'
        statusIpi = 'Alíquota Zero'
        statusPisCofins = 'Extintos'
      } else if (ano === 2029) {
        fase = 'Transição ICMS/ISS (90%) → IBS (10%)'
        aliqCbs = config.cbsPadrao // 8,80%
        aliqIbs = Number((config.ibsPadrao * 0.1).toFixed(2)) // 1,77%
        statusIcms = 'Reduzido para 90%'
        statusIss = 'Reduzido para 90%'
        statusIpi = 'Extinto'
        statusPisCofins = 'Extintos'
      } else if (ano === 2030) {
        fase = 'Transição ICMS/ISS (80%) → IBS (20%)'
        aliqCbs = config.cbsPadrao
        aliqIbs = Number((config.ibsPadrao * 0.2).toFixed(2)) // 3,54%
        statusIcms = 'Reduzido para 80%'
        statusIss = 'Reduzido para 80%'
        statusIpi = 'Extinto'
        statusPisCofins = 'Extintos'
      } else if (ano === 2031) {
        fase = 'Transição ICMS/ISS (70%) → IBS (30%)'
        aliqCbs = config.cbsPadrao
        aliqIbs = Number((config.ibsPadrao * 0.3).toFixed(2)) // 5,31%
        statusIcms = 'Reduzido para 70%'
        statusIss = 'Reduzido para 70%'
        statusIpi = 'Extinto'
        statusPisCofins = 'Extintos'
      } else if (ano === 2032) {
        fase = 'Último Ano de Convivência (60% / 40%)'
        aliqCbs = config.cbsPadrao
        aliqIbs = Number((config.ibsPadrao * 0.4).toFixed(2)) // 7,08%
        statusIcms = 'Reduzido para 60%'
        statusIss = 'Reduzido para 60%'
        statusIpi = 'Extinto'
        statusPisCofins = 'Extintos'
      } else {
        // 2033
        fase = 'Sistema Pleno IVA Dual (IBS + CBS)'
        aliqCbs = config.cbsPadrao // 8,80%
        aliqIbs = config.ibsPadrao // 17,70%
        statusIcms = 'EXTINTO'
        statusIss = 'EXTINTO'
        statusIpi = 'EXTINTO'
        statusPisCofins = 'EXTINTOS'
        alertaCritico =
          'Ano Crítico: Modelo pleno definitivo. ICMS e ISS 100% extintos; apuração e split payment 100% unificados.'
      }

      // Cálculo de alíquota efetiva ponderada da transição
      let aliqEfetivaAno = aliqCbs + aliqIbs
      if (ano === 2026) {
        aliqEfetivaAno = aliqAtualEstimada // Em 2026 o teste é compensável sem ônus
      } else if (ano === 2027 || ano === 2028) {
        // CBS (8,7%) + ICMS/ISS integral remanescente
        const remanescente =
          setorTransicao === 'servico' ? config.lucroPresumidoIss : config.lucroRealIcms
        aliqEfetivaAno = aliqCbs + remanescente
      } else if (ano >= 2029 && ano <= 2032) {
        const fatorIbs = (ano - 2028) * 0.1 // 0.1, 0.2, 0.3, 0.4
        const fatorAntigo = 1 - fatorIbs
        const remanescente =
          (setorTransicao === 'servico' ? config.lucroPresumidoIss : config.lucroRealIcms) *
          fatorAntigo
        aliqEfetivaAno = aliqCbs + aliqIbs + remanescente
      } else {
        aliqEfetivaAno = config.totalIvaDual
      }

      const impostoEstimado = (fatAnual * aliqEfetivaAno) / 100
      const diferencaAno = impostoEstimado - impostoAtual

      // Etapa 5: Crédito presumido de estoque abatido no primeiro ano de CBS plena (2027)
      const creditoEstoqueAno = ano === 2027 ? resultadoEstoque.economiaAno1 : 0
      const impostoComCreditoEstoque = Math.max(0, impostoEstimado - creditoEstoqueAno)

      return {
        ano,
        fase,
        aliquotaCbs: aliqCbs,
        aliquotaIbs: aliqIbs,
        statusIcms,
        statusIss,
        statusIpi,
        statusPisCofins,
        impostoEstimado,
        aliquotaEfetivaTotal: Number(aliqEfetivaAno.toFixed(2)),
        impostoCenarioAtual: impostoAtual,
        diferencaAno,
        creditoEstoqueAno,
        impostoComCreditoEstoque,
        alertaCritico,
      }
    })
  }, [config, faturamentoAnualProjetado, setorTransicao, resultadoEstoque])

  // ==========================================
  // CÁLCULO MÓDULO 6 (Dashboard KPIs)
  // ==========================================
  const resultadoDashboard = useMemo(() => {
    // Alíquota atual baseada no regime selecionado no filtro
    let aliqAtual = 0
    let cargaAtualMensal = 0
    const fat = faturamentoMensal

    if (regimeAtualFiltro === 'Lucro Real') {
      aliqAtual = resultadoComparativo.lucroReal.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
    } else if (regimeAtualFiltro === 'Lucro Presumido') {
      aliqAtual = resultadoComparativo.lucroPresumido.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
    } else {
      aliqAtual = resultadoComparativo.simplesNacional.aliquotaEfetiva
      cargaAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
    }

    const aliqNova = resultadoComparativo.ibsCbs.aliquotaEfetiva
    const cargaNovaMensal = resultadoComparativo.ibsCbs.totalEfetivo

    // Economia = carga atual - carga nova
    const economiaMensal = cargaAtualMensal - cargaNovaMensal
    const economiaAnual = economiaMensal * 12

    return {
      aliquotaEfetivaAtual: aliqAtual,
      aliquotaEfetivaNova: aliqNova,
      economiaMensalProjetada: economiaMensal,
      economiaAnualProjetada: economiaAnual,
      regimeRecomendado: resultadoComparativo.regimeMaisVantajoso,
    }
  }, [faturamentoMensal, regimeAtualFiltro, resultadoComparativo])

  // Função para obter o snapshot dos resultados derivados atuais
  const obterSnapshotResultados = (): ResultadosSimulacaoCalculadora => {
    return {
      resultadoSimples,
      resultadoComparativo: {
        lucroReal: {
          totalEfetivo: resultadoComparativo.lucroReal.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.lucroReal.aliquotaEfetiva,
          totalNominal: resultadoComparativo.lucroReal.totalNominal,
          creditos: resultadoComparativo.lucroReal.creditos,
        },
        lucroPresumido: {
          totalEfetivo: resultadoComparativo.lucroPresumido.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.lucroPresumido.aliquotaEfetiva,
          totalNominal: resultadoComparativo.lucroPresumido.totalNominal,
          creditos: resultadoComparativo.lucroPresumido.creditos,
        },
        simplesNacional: {
          totalEfetivo: resultadoComparativo.simplesNacional.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.simplesNacional.aliquotaEfetiva,
          totalNominal: resultadoComparativo.simplesNacional.totalNominal,
          creditos: resultadoComparativo.simplesNacional.creditos,
          anexoUtilizado: resultadoComparativo.simplesNacional.anexoUtilizado,
          faixaEncontrada: resultadoComparativo.simplesNacional.faixaEncontrada,
        },
        ibsCbs: {
          totalEfetivo: resultadoComparativo.ibsCbs.totalEfetivo,
          aliquotaEfetiva: resultadoComparativo.ibsCbs.aliquotaEfetiva,
          totalNominal: resultadoComparativo.ibsCbs.totalNominal,
          creditos: resultadoComparativo.ibsCbs.creditos,
          impostoSeletivo: resultadoComparativo.ibsCbs.impostoSeletivo,
        },
        regimeMaisVantajoso: resultadoComparativo.regimeMaisVantajoso,
        piorCenario: resultadoComparativo.piorCenario,
        economiaVersusPior: resultadoComparativo.economiaVersusPior,
        economiaPercentual: resultadoComparativo.economiaPercentual,
      },
      resultadoCreditos,
      resultadoTransicao: resultadoTransicao.map((t) => ({
        ano: t.ano,
        fase: t.fase,
        aliquotaCbs: t.aliquotaCbs,
        aliquotaIbs: t.aliquotaIbs,
        impostoEstimado: t.impostoEstimado,
        aliquotaEfetivaTotal: t.aliquotaEfetivaTotal,
        creditoEstoqueAno: t.creditoEstoqueAno,
      })),
      resultadoEstoque: {
        valorEstoqueVirada: resultadoEstoque.valorEstoqueVirada,
        aliquotaCreditoPresumido: resultadoEstoque.aliquotaCreditoPresumido,
        creditoTotalEstoque: resultadoEstoque.creditoTotalEstoque,
        economiaAno1: resultadoEstoque.economiaAno1,
      },
      resultadoSplitPayment: {
        retencaoMensalNota: resultadoSplitPayment.retencaoMensalNota,
        recolhimentoAtualMensal: resultadoSplitPayment.recolhimentoAtualMensal,
        diferencaFluxoCaixa: resultadoSplitPayment.diferencaFluxoCaixa,
        taxaMensalCapital: resultadoSplitPayment.taxaMensalCapital,
        custoCapitalMensal: resultadoSplitPayment.custoCapitalMensal,
        custoCapitalAnual: resultadoSplitPayment.custoCapitalAnual,
        diasAntecipacao: resultadoSplitPayment.diasAntecipacao,
      },
      resultadoDashboard,
    }
  }

  return (
    <CalculadoraContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,

        valorOperacao,
        setValorOperacao,
        regimeOperacao,
        setRegimeOperacao,
        percentualComprasVendasSimples,
        setPercentualComprasVendasSimples,

        faturamentoMensal,
        setFaturamentoMensal,
        tipoAtividade,
        setTipoAtividade,
        subatividadeServico,
        setSubatividadeServico,
        subatividadeIndustria,
        setSubatividadeIndustria,
        subatividadeComercio,
        setSubatividadeComercio,
        aliquotaImpostoSeletivo,
        setAliquotaImpostoSeletivo,
        proporcaoServicoMisto,
        setProporcaoServicoMisto,
        percentualComprasVendasComparativo,
        setPercentualComprasVendasComparativo,
        folhaPagamentoMensal,
        setFolhaPagamentoMensal,
        margemLucroEstimada,
        setMargemLucroEstimada,
        despesasComCreditosMensais,
        setDespesasComCreditosMensais,
        percentualExportacao,
        setPercentualExportacao,
        ufOrigem,
        setUfOrigem,

        despesasCreditos,
        updateDespesaCredito,
        resetDespesasCreditos,

        faturamentoAnualProjetado,
        setFaturamentoAnualProjetado,
        setorTransicao,
        setSetorTransicao,
        valorEstoqueVirada,
        setValorEstoqueVirada,

        taxaMensalCapitalGiro,
        setTaxaMensalCapitalGiro,
        diasAntecipacaoSplit,
        setDiasAntecipacaoSplit,

        periodoDashboard,
        setPeriodoDashboard,
        regimeAtualFiltro,
        setRegimeAtualFiltro,

        origemDadosEmpresa,
        restaurarDadosEmpresaNoModulo,

        obterSnapshotParametros,
        obterSnapshotResultados,
        restaurarSimulacao,

        resultadoSimples,
        resultadoComparativo,
        resultadoCreditos,
        resultadoTransicao,
        alertaLimitesSimples,
        resultadoSplitPayment,
        resultadoEstoque,
        resultadoDashboard,
      }}
    >
      {children}
    </CalculadoraContext.Provider>
  )
}

export function useCalculadoraIbsCbs() {
  const context = useContext(CalculadoraContext)
  if (!context) {
    throw new Error('useCalculadoraIbsCbs deve ser usado dentro de CalculadoraProvider')
  }
  return context
}
