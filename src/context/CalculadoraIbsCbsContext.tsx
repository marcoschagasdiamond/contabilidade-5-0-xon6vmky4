import React, { createContext, useContext, useState, useMemo } from 'react'
import {
  ConfiguracoesGerais,
  CONFIGURACOES_PADRAO,
  RegimeDiferenciadoTipo,
  TipoAtividade,
  CategoriaDespesaCredito,
  CATEGORIAS_CREDITO_PADRAO,
} from '@/types/calculadoraIbsCbs'
import { TABELAS_SIMPLES } from '@/lib/regimes'

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
  proporcaoServicoMisto: number // % serviço no misto (restante comércio)
  setProporcaoServicoMisto: (p: number) => void
  percentualComprasVendasComparativo: number
  setPercentualComprasVendasComparativo: (p: number) => void

  // Módulo 4 - Simulador de Créditos
  despesasCreditos: CategoriaDespesaCredito[]
  updateDespesaCredito: (id: string, updates: Partial<CategoriaDespesaCredito>) => void
  resetDespesasCreditos: () => void

  // Módulo 5 - Transição 2026 a 2033
  faturamentoAnualProjetado: number
  setFaturamentoAnualProjetado: (v: number) => void
  setorTransicao: TipoAtividade
  setSetorTransicao: (s: TipoAtividade) => void

  // Módulo 6 - Filtros Dashboard
  periodoDashboard: 'mensal' | 'anual'
  setPeriodoDashboard: (p: 'mensal' | 'anual') => void
  regimeAtualFiltro: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  setRegimeAtualFiltro: (r: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') => void

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
    }
    ibsCbs: {
      pisOuCbs: number // CBS
      cofinsOuIbs: number // IBS
      ipiOuIcmsOuIss: number // 0
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos: string
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
    alertaCritico?: string
  }>

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

  // Módulo 2: Calculadora Simples
  const [valorOperacao, setValorOperacao] = useState<number>(50000)
  const [regimeOperacao, setRegimeOperacao] = useState<RegimeDiferenciadoTipo>('padrao')
  const [percentualComprasVendasSimples, setPercentualComprasVendasSimples] = useState<number>(40)

  // Módulo 3: Comparativo por Regime
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(200000)
  const [tipoAtividade, setTipoAtividade] = useState<TipoAtividade>('servico')
  const [proporcaoServicoMisto, setProporcaoServicoMisto] = useState<number>(50)
  const [percentualComprasVendasComparativo, setPercentualComprasVendasComparativo] =
    useState<number>(40)

  // Módulo 4: Simulador de Créditos
  const [despesasCreditos, setDespesasCreditos] =
    useState<CategoriaDespesaCredito[]>(CATEGORIAS_CREDITO_PADRAO)

  const updateDespesaCredito = (id: string, updates: Partial<CategoriaDespesaCredito>) => {
    setDespesasCreditos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
  }

  const resetDespesasCreditos = () => setDespesasCreditos(CATEGORIAS_CREDITO_PADRAO)

  // Módulo 5: Transição
  const [faturamentoAnualProjetado, setFaturamentoAnualProjetado] = useState<number>(2400000)
  const [setorTransicao, setSetorTransicao] = useState<TipoAtividade>('servico')

  // Módulo 6: Dashboard filtros
  const [periodoDashboard, setPeriodoDashboard] = useState<'mensal' | 'anual'>('mensal')
  const [regimeAtualFiltro, setRegimeAtualFiltro] = useState<
    'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional'
  >('Lucro Presumido')

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
    const faturamento = Math.max(0, faturamentoMensal)
    const pctCompras = Math.max(0, percentualComprasVendasComparativo) / 100
    const comprasValor = faturamento * pctCompras

    // Alíquotas do Antigo conforme tipo de atividade:
    // Serviço: ISS (Módulo 1: config.lucroRealIss / config.lucroPresumidoIss)
    // Indústria: IPI (config.lucroRealIpi / config.lucroPresumidoIpi)
    // Comércio: ICMS (config.lucroRealIcms / config.lucroPresumidoIcms)
    // Misto: proporção configurável entre Serviço e Comércio
    let taxaIpiIcmsIssReal = 0
    let taxaIpiIcmsIssPresumido = 0
    let nomeImpostoIndireto = ''

    if (tipoAtividade === 'servico') {
      taxaIpiIcmsIssReal = config.lucroRealIss
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss
      nomeImpostoIndireto = 'ISS'
    } else if (tipoAtividade === 'industria') {
      taxaIpiIcmsIssReal = config.lucroRealIpi
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIpi
      nomeImpostoIndireto = 'IPI'
    } else if (tipoAtividade === 'comercio') {
      taxaIpiIcmsIssReal = config.lucroRealIcms
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIcms
      nomeImpostoIndireto = 'ICMS'
    } else {
      // Misto: Serviço + Comércio
      const pServ = Math.max(0, Math.min(100, proporcaoServicoMisto)) / 100
      const pCom = 1 - pServ
      taxaIpiIcmsIssReal = config.lucroRealIss * pServ + config.lucroRealIcms * pCom
      taxaIpiIcmsIssPresumido = config.lucroPresumidoIss * pServ + config.lucroPresumidoIcms * pCom
      nomeImpostoIndireto = `ISS (${Math.round(pServ * 100)}%) + ICMS (${Math.round(pCom * 100)}%)`
    }

    // 1. LUCRO REAL
    const lrPisNominal = (faturamento * config.lucroRealPis) / 100
    const lrCofinsNominal = (faturamento * config.lucroRealCofins) / 100
    const lrIndiretoNominal = (faturamento * taxaIpiIcmsIssReal) / 100
    const lrTotalNominal = lrPisNominal + lrCofinsNominal + lrIndiretoNominal

    // Créditos Lucro Real: compras geram PIS (1,65%), COFINS (7,60%) e ICMS/IPI conforme a atividade
    const aliqCreditoReal =
      tipoAtividade === 'servico'
        ? config.lucroRealPis + config.lucroRealCofins // Serviços não tomam crédito de ISS
        : config.lucroRealPis + config.lucroRealCofins + taxaIpiIcmsIssReal
    const lrCreditos = (comprasValor * aliqCreditoReal) / 100
    const lrTotalEfetivo = Math.max(0, lrTotalNominal - lrCreditos)
    const lrAliqEfetiva = faturamento > 0 ? (lrTotalEfetivo / faturamento) * 100 : 0

    // 2. LUCRO PRESUMIDO (regime cumulativo - PIS 0,65% + COFINS 3% sem direito a crédito)
    const lpPisNominal = (faturamento * config.lucroPresumidoPis) / 100
    const lpCofinsNominal = (faturamento * config.lucroPresumidoCofins) / 100
    const lpIndiretoNominal = (faturamento * taxaIpiIcmsIssPresumido) / 100
    const lpTotalNominal = lpPisNominal + lpCofinsNominal + lpIndiretoNominal
    const lpCreditos = 0 // Cumulativo: não gera créditos
    const lpTotalEfetivo = lpTotalNominal
    const lpAliqEfetiva = faturamento > 0 ? (lpTotalEfetivo / faturamento) * 100 : 0

    // 3. SIMPLES NACIONAL (tabela por faturamento anual = faturamentoMensal * 12)
    const rbt12 = faturamento * 12
    let tabelaSimples = TABELAS_SIMPLES.anexoIII // Serviços padrão
    let faixaNome = 'Anexo III'

    if (tipoAtividade === 'comercio') {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I (Comércio)'
    } else if (tipoAtividade === 'industria') {
      tabelaSimples = TABELAS_SIMPLES.anexoII
      faixaNome = 'Anexo II (Indústria)'
    } else if (tipoAtividade === 'misto') {
      tabelaSimples = TABELAS_SIMPLES.anexoI
      faixaNome = 'Anexo I / III (Misto Ponderado)'
    }

    let snAliqEfetiva = 0
    if (rbt12 <= 4800000 && rbt12 > 0) {
      const faixa =
        tabelaSimples.find((f) => rbt12 <= f.max) || tabelaSimples[tabelaSimples.length - 1]
      snAliqEfetiva = Math.max(0, ((rbt12 * (faixa.aliq / 100) - faixa.deducao) / rbt12) * 100)
    } else if (rbt12 > 4800000) {
      // Excedente ao Simples Nacional
      snAliqEfetiva = 19.0 // Estimativa de teto
      faixaNome = 'Excede sublimite de R$ 4,8M'
    }

    const snTotalEfetivo = (faturamento * snAliqEfetiva) / 100
    // No Simples, estimativa de distribuição dos tributos de consumo dentro do DAS
    const snPis = snTotalEfetivo * 0.05
    const snCofins = snTotalEfetivo * 0.15
    const snIndireto = snTotalEfetivo * 0.35 // ICMS ou ISS dentro do DAS
    const snCreditos = 0 // Optante do Simples não apropria crédito amplo

    // 4. IBS / CBS (Novo IVA Dual)
    const ibsCbsTotalNominal = (faturamento * config.totalIvaDual) / 100
    const cbsNominal = (faturamento * config.cbsPadrao) / 100
    const ibsNominal = (faturamento * config.ibsPadrao) / 100
    // Créditos amplos sobre todas as compras no IVA Dual (26,50%)
    const ibsCbsCreditos = (comprasValor * config.totalIvaDual) / 100
    const ibsCbsTotalEfetivo = Math.max(0, ibsCbsTotalNominal - ibsCbsCreditos)
    const ibsCbsAliqEfetiva = faturamento > 0 ? (ibsCbsTotalEfetivo / faturamento) * 100 : 0

    // Comparativo e ranking
    const cenarios = [
      { nome: 'Lucro Real', total: lrTotalEfetivo, aliq: lrAliqEfetiva },
      { nome: 'Lucro Presumido', total: lpTotalEfetivo, aliq: lpAliqEfetiva },
      { nome: 'Simples Nacional', total: snTotalEfetivo, aliq: snAliqEfetiva },
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
        creditos: lrCreditos,
        totalEfetivo: lrTotalEfetivo,
        aliquotaEfetiva: lrAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroRealPis}% + COFINS ${config.lucroRealCofins}% + ${nomeImpostoIndireto} ${taxaIpiIcmsIssReal.toFixed(2)}%`,
      },
      lucroPresumido: {
        pisOuCbs: lpPisNominal,
        cofinsOuIbs: lpCofinsNominal,
        ipiOuIcmsOuIss: lpIndiretoNominal,
        totalNominal: lpTotalNominal,
        creditos: lpCreditos,
        totalEfetivo: lpTotalEfetivo,
        aliquotaEfetiva: lpAliqEfetiva,
        detalheImpostos: `PIS ${config.lucroPresumidoPis}% + COFINS ${config.lucroPresumidoCofins}% + ${nomeImpostoIndireto} ${taxaIpiIcmsIssPresumido.toFixed(2)}% (Sem créditos)`,
      },
      simplesNacional: {
        pisOuCbs: snPis,
        cofinsOuIbs: snCofins,
        ipiOuIcmsOuIss: snIndireto,
        totalNominal: snTotalEfetivo,
        creditos: snCreditos,
        totalEfetivo: snTotalEfetivo,
        aliquotaEfetiva: snAliqEfetiva,
        detalheImpostos: `Guia única DAS (${faixaNome})`,
        faixaEncontrada: faixaNome,
      },
      ibsCbs: {
        pisOuCbs: cbsNominal,
        cofinsOuIbs: ibsNominal,
        ipiOuIcmsOuIss: 0,
        totalNominal: ibsCbsTotalNominal,
        creditos: ibsCbsCreditos,
        totalEfetivo: ibsCbsTotalEfetivo,
        aliquotaEfetiva: ibsCbsAliqEfetiva,
        detalheImpostos: `CBS ${config.cbsPadrao}% + IBS ${config.ibsPadrao}% (Não-cumulativo pleno)`,
      },
      regimeMaisVantajoso: melhor.nome,
      piorCenario: pior.nome,
      economiaVersusPior: economia,
      economiaPercentual: economiaPct,
    }
  }, [
    config,
    faturamentoMensal,
    tipoAtividade,
    proporcaoServicoMisto,
    percentualComprasVendasComparativo,
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
  // CÁLCULO MÓDULO 5 (Transição 2026 a 2033)
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
        alertaCritico,
      }
    })
  }, [config, faturamentoAnualProjetado, setorTransicao])

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
        proporcaoServicoMisto,
        setProporcaoServicoMisto,
        percentualComprasVendasComparativo,
        setPercentualComprasVendasComparativo,

        despesasCreditos,
        updateDespesaCredito,
        resetDespesasCreditos,

        faturamentoAnualProjetado,
        setFaturamentoAnualProjetado,
        setorTransicao,
        setSetorTransicao,

        periodoDashboard,
        setPeriodoDashboard,
        regimeAtualFiltro,
        setRegimeAtualFiltro,

        resultadoSimples,
        resultadoComparativo,
        resultadoCreditos,
        resultadoTransicao,
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
