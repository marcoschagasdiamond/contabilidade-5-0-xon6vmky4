import React, { useState } from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  TipoAtividade,
  AnoTransicaoIbsCbs,
  LISTA_ANOS_TRANSICAO,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
} from '@/types/calculadoraIbsCbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { ModalSalvarSimulacao } from '@/components/calculadora/ModalSalvarSimulacao'
import { ModalCompartilharLink } from '@/components/calculadora/ModalCompartilharLink'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  LayoutDashboard,
  Percent,
  Wallet,
  TrendingUp,
  Filter,
  ArrowRight,
  ShieldAlert,
  BookmarkPlus,
  FileDown,
  Share2,
  Zap,
} from 'lucide-react'
import { FarolLimitesSimples } from '@/components/calculadora/FarolLimitesSimples'
import { BlocoSplitPayment } from '@/components/calculadora/BlocoSplitPayment'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'

const CORES_PIZZA = ['#07132B', '#D4AF37', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6']

export default function Modulo6Dashboard() {
  const {
    config,
    faturamentoMensal,
    setFaturamentoMensal,
    tipoAtividade,
    setTipoAtividade,
    percentualComprasVendasComparativo,
    setPercentualComprasVendasComparativo,
    periodoDashboard,
    setPeriodoDashboard,
    regimeAtualFiltro,
    anoTransicaoDashboard,
    setAnoTransicaoDashboard,
    origensPropagadas,
    resultadoDashboard,
    resultadoComparativo,
    resultadoCreditos,
    resultadoTransicao,
    alertaLimitesSimples,
    resultadoSplitPayment,
    resultadoEstoque,
    taxaMensalCapitalGiro,
    setTaxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    setDiasAntecipacaoSplit,
    despesasCreditos,
    obterSnapshotParametros,
    obterSnapshotResultados,
  } = useCalculadoraIbsCbs()

  const { toast } = useToast()
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const handleBaixarPdfDashboard = () => {
    try {
      setGerandoPdf(true)
      const params = obterSnapshotParametros()
      const res = obterSnapshotResultados()
      gerarRelatorioSimulacaoPDF({
        nomeSimulacao: 'Simulação Executiva - Dashboard',
        parametros: params,
        resultados: res,
        empresa: params.empresa,
        cnpj: params.cnpj,
      })
      toast({
        title: 'Relatório PDF gerado!',
        description: 'Download do relatório completo com a identidade Diamond Group iniciado.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao compilar relatório.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  const {
    aliquotaEfetivaAtual,
    aliquotaEfetivaNova,
    economiaMensalProjetada,
    economiaAnualProjetada,
    regimeRecomendado,
  } = resultadoDashboard

  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFaturamentoMensal(valor)
  }

  // Multiplicador mensal vs anual para visualização no dashboard
  const mult = periodoDashboard === 'anual' ? 12 : 1

  // Ano selecionado no Dashboard (espelhado do Módulo 1 com prevalência local)
  const anoSimulacaoSelecionado = anoTransicaoDashboard ?? config.anoTransicao ?? 2033

  // ==========================================
  // CÁLCULOS DINÂMICOS DO IBS/CBS PARA O ANO SELECIONADO NO DASHBOARD
  // Fonte da verdade oficial da transição (LC 214/2025): mesma lógica do quadro comparativo e do cronograma
  // ==========================================
  const dadosFaseAnoDashboard =
    anoSimulacaoSelecionado === 'atual'
      ? CRONOGRAMA_FASES_TRANSICAO['atual']
      : CRONOGRAMA_FASES_TRANSICAO[anoSimulacaoSelecionado] || CRONOGRAMA_FASES_TRANSICAO[2033]

  const ehMesmoAnoDoModulo1 =
    config.anoTransicao !== undefined &&
    String(config.anoTransicao) === String(anoSimulacaoSelecionado)

  // Alíquotas nominais e de referência da fase selecionada no Dashboard
  const totalIvaFaseDashboard =
    anoSimulacaoSelecionado === 'atual'
      ? 0
      : ehMesmoAnoDoModulo1
        ? config.totalIvaDual
        : dadosFaseAnoDashboard.totalIvaDual

  const cbsFaseDashboard =
    anoSimulacaoSelecionado === 'atual'
      ? 0
      : ehMesmoAnoDoModulo1
        ? config.cbsPadrao
        : dadosFaseAnoDashboard.aliquotaCbs

  const ibsFaseDashboard =
    anoSimulacaoSelecionado === 'atual'
      ? 0
      : ehMesmoAnoDoModulo1
        ? config.ibsPadrao
        : dadosFaseAnoDashboard.aliquotaIbs

  // Apuração do IBS/CBS para o ano selecionado no Dashboard
  const ibsCbsAnoDashboard = React.useMemo(() => {
    const fatBruto = Math.max(0, faturamentoMensal)
    const fatInterno = resultadoComparativo.dadosAdicionais?.receitaTributavelInterna ?? fatBruto
    const comprasValor = (fatBruto * Math.max(0, percentualComprasVendasComparativo)) / 100
    const reducaoPct = resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0
    const fatorReducao = Math.max(0, 1 - reducaoPct / 100)

    if (anoSimulacaoSelecionado === 'atual') {
      // No ano atual (pré-reforma), não há incidência de CBS/IBS
      return {
        totalNominal: 0,
        cbsNominal: 0,
        ibsNominal: 0,
        impostoSeletivo: 0,
        creditosTotal: 0,
        creditosCompras: 0,
        creditosDespesas: 0,
        totalEfetivo: 0,
        aliquotaEfetiva: 0,
        aliquotaReferenciaFase: 0,
      }
    }

    if (ehMesmoAnoDoModulo1) {
      // Quando coincide com o ano do Módulo 1, mantém a sincronia com os valores do Módulo 3
      return {
        totalNominal: resultadoComparativo.ibsCbs.totalNominal,
        cbsNominal: resultadoComparativo.ibsCbs.pisOuCbs,
        ibsNominal: resultadoComparativo.ibsCbs.cofinsOuIbs,
        impostoSeletivo: resultadoComparativo.ibsCbs.impostoSeletivo,
        creditosTotal: resultadoComparativo.ibsCbs.creditos,
        creditosCompras: (comprasValor * config.totalIvaDual) / 100,
        creditosDespesas: resultadoComparativo.dadosAdicionais?.creditosDespesasIbsCbs ?? 0,
        totalEfetivo: resultadoComparativo.ibsCbs.totalEfetivo,
        aliquotaEfetiva: resultadoComparativo.ibsCbs.aliquotaEfetiva,
        aliquotaReferenciaFase: config.totalIvaDual,
      }
    }

    // Para qualquer outro ano selecionado no Dashboard (2026 a 2033):
    const cbsNominal = (fatInterno * cbsFaseDashboard * fatorReducao) / 100
    const ibsNominal = (fatInterno * ibsFaseDashboard * fatorReducao) / 100

    const aliqIsEfetiva = resultadoComparativo.dadosAdicionais?.sujeitoImpostoSeletivo
      ? resultadoComparativo.ibsCbs.impostoSeletivo > 0 && fatInterno > 0
        ? (resultadoComparativo.ibsCbs.impostoSeletivo / fatInterno) * 100
        : 0
      : 0
    const valorIS = (fatInterno * aliqIsEfetiva) / 100
    const totalNominal = cbsNominal + ibsNominal + valorIS

    // Créditos da fase: compras e despesas proporcionais à alíquota total da fase
    const creditosCompras = (comprasValor * totalIvaFaseDashboard) / 100
    const despesasValor =
      config.totalIvaDual > 0 && resultadoComparativo.dadosAdicionais?.creditosDespesasIbsCbs
        ? (resultadoComparativo.dadosAdicionais.creditosDespesasIbsCbs * 100) / config.totalIvaDual
        : (resultadoComparativo.dadosAdicionais?.creditosDespesasIbsCbs ?? 0)
    const creditosDespesas = (despesasValor * totalIvaFaseDashboard) / 100
    const creditosTotal = creditosCompras + creditosDespesas

    const totalEfetivo = Math.max(0, totalNominal - creditosTotal)
    const aliquotaEfetiva = fatBruto > 0 ? (totalEfetivo / fatBruto) * 100 : 0

    return {
      totalNominal,
      cbsNominal,
      ibsNominal,
      impostoSeletivo: valorIS,
      creditosTotal,
      creditosCompras,
      creditosDespesas,
      totalEfetivo,
      aliquotaEfetiva,
      aliquotaReferenciaFase: totalIvaFaseDashboard,
    }
  }, [
    anoSimulacaoSelecionado,
    ehMesmoAnoDoModulo1,
    faturamentoMensal,
    percentualComprasVendasComparativo,
    resultadoComparativo,
    cbsFaseDashboard,
    ibsFaseDashboard,
    totalIvaFaseDashboard,
    config.totalIvaDual,
  ])

  // KPIs dinâmicos refletindo o ano selecionado no Dashboard
  const {
    aliquotaEfetivaAtual,
    aliquotaEfetivaNova,
    economiaMensalProjetada,
    economiaAnualProjetada,
    regimeRecomendado,
  } = React.useMemo(() => {
    let aliqAtual = 0
    let cargaAtualMensal = 0

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

    const aliqNova = ibsCbsAnoDashboard.aliquotaEfetiva
    const cargaNovaMensal = ibsCbsAnoDashboard.totalEfetivo

    const economiaMensal = cargaAtualMensal - cargaNovaMensal
    const economiaAnual = economiaMensal * 12

    // Determina o regime recomendado para o ano selecionado no Dashboard
    const cenarios = [
      { nome: 'Lucro Real', total: resultadoComparativo.lucroReal.totalEfetivo },
      { nome: 'Lucro Presumido', total: resultadoComparativo.lucroPresumido.totalEfetivo },
      { nome: 'Simples Nacional', total: resultadoComparativo.simplesNacional.totalEfetivo },
      ...(anoSimulacaoSelecionado === 'atual'
        ? []
        : [{ nome: 'IBS/CBS', total: ibsCbsAnoDashboard.totalEfetivo }]),
    ].sort((a, b) => a.total - b.total)

    return {
      aliquotaEfetivaAtual: aliqAtual,
      aliquotaEfetivaNova: aliqNova,
      economiaMensalProjetada: economiaMensal,
      economiaAnualProjetada: economiaAnual,
      regimeRecomendado: cenarios[0]?.nome || resultadoComparativo.regimeMaisVantajoso,
    }
  }, [regimeAtualFiltro, resultadoComparativo, ibsCbsAnoDashboard, anoSimulacaoSelecionado])

  // Split Payment dinâmico baseado no ano selecionado no Dashboard
  const resultadoSplitPaymentDinamico = React.useMemo(() => {
    const fatInterno =
      resultadoComparativo.dadosAdicionais?.receitaTributavelInterna ?? faturamentoMensal

    // Retenção imediata no momento da venda com base na fase do ano do Dashboard
    const reducaoPct = resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0
    const fatorReducao = Math.max(0, 1 - reducaoPct / 100)
    const aliquotaSaidaEfetiva = totalIvaFaseDashboard * fatorReducao

    const retencaoMensalNota = (fatInterno * aliquotaSaidaEfetiva) / 100

    let recolhimentoAtualMensal = resultadoComparativo.simplesNacional.totalEfetivo
    if (regimeAtualFiltro === 'Lucro Real') {
      recolhimentoAtualMensal = resultadoComparativo.lucroReal.totalEfetivo
    } else if (regimeAtualFiltro === 'Lucro Presumido') {
      recolhimentoAtualMensal = resultadoComparativo.lucroPresumido.totalEfetivo
    }

    const diferencaFluxoCaixa = retencaoMensalNota - recolhimentoAtualMensal

    const taxaDecimal = Math.max(0, taxaMensalCapitalGiro) / 100
    const fatorTempo = Math.max(1, diasAntecipacaoSplit) / 30
    const custoCapitalMensal = retencaoMensalNota * taxaDecimal * fatorTempo
    const custoCapitalAnual = custoCapitalMensal * 12

    return {
      ...resultadoSplitPayment,
      retencaoMensalNota,
      recolhimentoAtualMensal,
      diferencaFluxoCaixa,
      custoCapitalMensal,
      custoCapitalAnual,
    }
  }, [
    faturamentoMensal,
    resultadoComparativo,
    totalIvaFaseDashboard,
    regimeAtualFiltro,
    taxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    resultadoSplitPayment,
  ])

  // 1. DADOS GRÁFICO 1: BARRAS - Comparativo dos 4 regimes (com IBS/CBS da fase do Dashboard)
  const dadosGraficoBarras = [
    {
      regime: 'Lucro Real',
      carga: resultadoComparativo.lucroReal.totalEfetivo * mult,
      aliquota: resultadoComparativo.lucroReal.aliquotaEfetiva,
      fill: '#1E293B',
    },
    {
      regime: 'Lucro Presumido',
      carga: resultadoComparativo.lucroPresumido.totalEfetivo * mult,
      aliquota: resultadoComparativo.lucroPresumido.aliquotaEfetiva,
      fill: '#475569',
    },
    {
      regime: 'Simples Nacional',
      carga: resultadoComparativo.simplesNacional.totalEfetivo * mult,
      aliquota: resultadoComparativo.simplesNacional.aliquotaEfetiva,
      fill: '#0284C7',
    },
    {
      regime:
        anoSimulacaoSelecionado === 'atual'
          ? 'IBS / CBS (Ano Atual)'
          : `IBS / CBS (${anoSimulacaoSelecionado})`,
      carga: ibsCbsAnoDashboard.totalEfetivo * mult,
      aliquota: ibsCbsAnoDashboard.aliquotaEfetiva,
      fill: '#D4AF37',
    },
  ]

  // 2. DADOS GRÁFICO 2: LINHA - Evolução Atual + 2026-2033
  const dadosGraficoLinha = resultadoTransicao.map((item) => ({
    ano: item.ano === 'atual' ? 'Atual' : String(item.ano),
    aliquota: item.aliquotaEfetivaTotal,
    imposto: item.impostoEstimado / (periodoDashboard === 'mensal' ? 12 : 1),
  }))

  // Alíquota de referência efetiva dinâmica para apuração de créditos do Gráfico 3
  // Respeita a fase da transição selecionada no Dashboard
  const aliqRefCreditos =
    anoSimulacaoSelecionado === 'atual'
      ? 0
      : ehMesmoAnoDoModulo1 && resultadoCreditos?.aliquotaReferencia !== undefined
        ? resultadoCreditos.aliquotaReferencia
        : totalIvaFaseDashboard
  const isAliquotaZeroCreditos =
    anoSimulacaoSelecionado === 'atual' || Boolean(resultadoCreditos?.isAliquotaZero)

  // 3. DADOS GRÁFICO 3: PIZZA - Composição dos Créditos Antigos versus Novos (sincronizado com o ano do Dashboard)
  const dadosPizzaCreditos = despesasCreditos.slice(0, 5).map((item) => {
    const aliqNova = isAliquotaZeroCreditos
      ? 0
      : item.aliquotaNova !== undefined
        ? item.aliquotaNova
        : aliqRefCreditos

    return {
      name: item.nome,
      antigo: (item.valorMensal * item.aliquotaAntiga) / 100,
      novo: (item.valorMensal * aliqNova) / 100,
      aliquotaNovaAplicada: aliqNova,
    }
  })

  // Totais de créditos do Gráfico 3 dinâmicos
  const totalCreditosGrafico3 = React.useMemo(() => {
    let antigo = 0
    let novo = 0
    despesasCreditos.forEach((item) => {
      const v = Math.max(0, item.valorMensal)
      const cAntigo = (v * item.aliquotaAntiga) / 100
      const aliqNova = isAliquotaZeroCreditos
        ? 0
        : item.aliquotaNova !== undefined
          ? item.aliquotaNova
          : aliqRefCreditos
      const cNovo = (v * aliqNova) / 100
      antigo += cAntigo
      novo += cNovo
    })
    return { antigo, novo }
  }, [despesasCreditos, isAliquotaZeroCreditos, aliqRefCreditos])

  // Cálculo do regime mais econômico para cada linha/ano da transição completa (Quadro Comparativo)
  const regimesMaisEconomicosPorAno = React.useMemo(() => {
    const lrTotal = resultadoComparativo.lucroReal.totalEfetivo
    const lpTotal = resultadoComparativo.lucroPresumido.totalEfetivo
    const snTotal = resultadoComparativo.simplesNacional.totalEfetivo

    const mapa: Record<string, string> = {}

    resultadoTransicao.forEach((item) => {
      const ano = item.ano

      if (ano === 'atual') {
        // No sistema atual pré-reforma, concorrem os 3 regimes vigentes (Lucro Real, Lucro Presumido, Simples Nacional)
        const cenarios = [
          { nome: 'Lucro Real', total: lrTotal },
          { nome: 'Lucro Presumido', total: lpTotal },
          { nome: 'Simples Nacional', total: snTotal },
        ].sort((a, b) => a.total - b.total)
        mapa[String(ano)] = cenarios[0].nome
        return
      }

      // Para os anos de 2026 a 2033:
      // Alíquotas oficiais da fase daquele ano (LC 214/2025)
      const faseAno = CRONOGRAMA_FASES_TRANSICAO[ano] || CRONOGRAMA_FASES_TRANSICAO[2033]
      const cbsAno = faseAno.aliquotaCbs
      const ibsAno = faseAno.aliquotaIbs
      const totalIvaDualAno = faseAno.totalIvaDual

      let ibsCbsTotalAno = resultadoComparativo.ibsCbs.totalEfetivo

      if (ano !== config.anoTransicao) {
        const fatInterno =
          resultadoComparativo.dadosAdicionais?.receitaTributavelInterna ?? faturamentoMensal
        const comprasValor = (faturamentoMensal * percentualComprasVendasComparativo) / 100
        const reducaoPct = resultadoComparativo.ibsCbs.reducaoAplicadaPercentual || 0
        const fatorReducao = Math.max(0, 1 - reducaoPct / 100)

        const cbsNominal = (fatInterno * cbsAno * fatorReducao) / 100
        const ibsNominal = (fatInterno * ibsAno * fatorReducao) / 100

        const aliqIsEfetiva = resultadoComparativo.dadosAdicionais?.sujeitoImpostoSeletivo
          ? resultadoComparativo.ibsCbs.impostoSeletivo > 0 && fatInterno > 0
            ? (resultadoComparativo.ibsCbs.impostoSeletivo / fatInterno) * 100
            : 0
          : 0
        const valorIS = (fatInterno * aliqIsEfetiva) / 100

        const debitoTotal = cbsNominal + ibsNominal + valorIS

        // Créditos da fase: compras e despesas operacionais proporcionais à alíquota total da fase
        const creditosCompras = (comprasValor * totalIvaDualAno) / 100
        const despesasValor =
          config.totalIvaDual > 0 && resultadoComparativo.dadosAdicionais?.creditosDespesasIbsCbs
            ? (resultadoComparativo.dadosAdicionais.creditosDespesasIbsCbs * 100) /
              config.totalIvaDual
            : (resultadoComparativo.dadosAdicionais?.creditosDespesasIbsCbs ?? 0)
        const creditosDespesas = (despesasValor * totalIvaDualAno) / 100
        const creditosTotal = creditosCompras + creditosDespesas

        ibsCbsTotalAno = Math.max(0, debitoTotal - creditosTotal)
      }

      const cenarios = [
        { nome: 'Lucro Real', total: lrTotal },
        { nome: 'Lucro Presumido', total: lpTotal },
        { nome: 'Simples Nacional', total: snTotal },
        { nome: 'IBS/CBS', total: ibsCbsTotalAno },
      ].sort((a, b) => a.total - b.total)

      mapa[String(ano)] = cenarios[0].nome
    })

    return mapa
  }, [
    resultadoComparativo,
    resultadoTransicao,
    config.anoTransicao,
    config.totalIvaDual,
    faturamentoMensal,
    percentualComprasVendasComparativo,
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Módulo 6 • Painel Executivo Integrado
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                Dashboard Executivo da Reforma Tributária
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mt-1">
                Visão gerencial consolidada que consome todos os módulos anteriores. Visualize KPIs
                de impacto, gráficos comparativos de regimes e evolução temporal das obrigações
                fiscais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCompartilharAberto(true)}
                className="bg-white/10 hover:bg-white/20 text-[#D4AF37] border-[#D4AF37]/50 font-bold text-xs h-9 shadow-md flex items-center gap-1.5"
                title="Compartilhar link da simulação"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
              <Button
                type="button"
                onClick={() => setModalSalvarAberto(true)}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#07132B] font-bold text-xs h-9 shadow-md flex items-center gap-1.5"
              >
                <BookmarkPlus className="w-4 h-4" />
                Salvar Simulação
              </Button>
              <Button
                type="button"
                onClick={handleBaixarPdfDashboard}
                disabled={gerandoPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 shadow-md flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                {gerandoPdf ? 'Gerando...' : 'Baixar Relatório PDF'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Globais Conforme Especificação */}
      <Card className="border-slate-200/80 bg-slate-50/90 shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-slate-200/60 flex flex-row items-center gap-2">
          <Filter className="w-4 h-4 text-[#D4AF37]" />
          <CardTitle className="text-sm font-bold text-[#07132B]">
            Filtros do Dashboard (Sincronização em Tempo Real)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Informação do Preset Ativo e Ano da Transição da Simulação */}
          {config.presetSetor && config.presetSetor !== 'nenhum' && (
            <div className="mb-4 p-3 bg-amber-50/80 border border-[#D4AF37]/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#07132B]">Preset Setorial LC 214/2025:</span>
                <span className="text-slate-700">
                  {PRESETS_SETORES_LC214.find((p) => p.id === config.presetSetor)?.titulo ||
                    config.presetSetor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#07132B] text-[#D4AF37] font-mono font-bold text-[11px]">
                  {config.anoTransicao === 'atual'
                    ? 'Ano atual (sistema atual)'
                    : `Fase ${config.anoTransicao || 2033}`}
                </span>
                <span className="text-slate-500 font-medium text-[11px]">
                  {PRESETS_SETORES_LC214.find((p) => p.id === config.presetSetor)?.baseLegal}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro: Período (mantido intacto — visualização mensal/anual) */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 block mb-1.5">Período</Label>
              <Select
                value={periodoDashboard}
                onValueChange={(val) => setPeriodoDashboard(val as 'mensal' | 'anual')}
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Visão Mensal</SelectItem>
                  <SelectItem value="anual">Visão Anual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Alterna os valores em R$ entre mensal e anual — afeta o Quadro Comparativo e os
                gráficos
              </p>
            </div>

            {/* Filtro: Ano da Transição (espelhado do Módulo 1 com BadgeOrigemPropagada e prevalência local) */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                <Label className="text-xs font-semibold text-slate-600">Ano da Transição</Label>
                {origensPropagadas?.dashboardAnoTransicao && (
                  <BadgeOrigemPropagada texto="vindo das configurações — editável aqui" />
                )}
              </div>
              <Select
                value={String(anoTransicaoDashboard)}
                onValueChange={(val) => {
                  const ano = val === 'atual' ? 'atual' : (Number(val) as AnoTransicaoIbsCbs)
                  setAnoTransicaoDashboard(ano)
                }}
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {LISTA_ANOS_TRANSICAO.map((ano) => {
                    const dados = CRONOGRAMA_FASES_TRANSICAO[ano]
                    const rotuloPrincipal =
                      ano === 'atual' ? 'Ano atual (sistema atual)' : `${ano} • ${dados.fase}`
                    return (
                      <SelectItem key={String(ano)} value={String(ano)} className="py-1.5">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-xs">
                            {rotuloPrincipal}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight">
                            {ano === 'atual'
                              ? 'Pré-reforma · CBS e IBS 0,00%'
                              : `${dados.aliquotaCbs.toFixed(2)}% CBS + ${dados.aliquotaIbs.toFixed(2)}% IBS (${dados.totalIvaDual.toFixed(2)}%)`}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Define a fase da transição usada nos KPIs, gráficos e Split Payment
              </p>
            </div>

            {/* Filtro: Setor (com BadgeOrigemPropagada quando propagado) */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                <Label className="text-xs font-semibold text-slate-600">Setor</Label>
                {origensPropagadas?.dashboardSetor && (
                  <BadgeOrigemPropagada texto="vindo das configurações — editável aqui" />
                )}
              </div>
              <Select
                value={tipoAtividade}
                onValueChange={(val) => setTipoAtividade(val as TipoAtividade)}
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="comercio">Comércio</SelectItem>
                  <SelectItem value="industria">Indústria</SelectItem>
                  <SelectItem value="agronegocio">Agronegócio / Produtor rural</SelectItem>
                  <SelectItem value="construcao_civil">Construção civil e engenharia</SelectItem>
                  <SelectItem value="locacao_bens">Aluguel / Locação de bens</SelectItem>
                  <SelectItem value="food_service">Bares / Restaurantes e food service</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Define a atividade para as alíquotas — afeta os KPIs, o Gráfico 1 e o Quadro
                Comparativo
              </p>
            </div>

            {/* Filtro: Faturamento Mensal (com BadgeOrigemPropagada quando propagado) */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                <Label className="text-xs font-semibold text-slate-600">Faturamento Mensal</Label>
                {origensPropagadas?.dashboardFaturamento && (
                  <BadgeOrigemPropagada texto="vindo das configurações — editável aqui" />
                )}
              </div>
              <Input
                type="text"
                value={faturamentoMensal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={handleFaturamentoChange}
                className="h-10 bg-white font-mono font-bold text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Base de todos os cálculos — afeta KPIs, quadro, gráficos e Split Payment
              </p>
            </div>

            {/* Filtro: % Compras s/ Vendas (com BadgeOrigemPropagada quando propagado) */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                <Label className="text-xs font-semibold text-slate-600">% Compras s/ Vendas</Label>
                {origensPropagadas?.dashboardPercentualCompras && (
                  <BadgeOrigemPropagada texto="vindo das configurações — editável aqui" />
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={percentualComprasVendasComparativo}
                  onChange={(e) => setPercentualComprasVendasComparativo(Number(e.target.value))}
                  className="h-10 bg-white font-mono font-bold text-xs pr-7"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Define o abatimento de créditos — afeta KPIs 2 a 4, quadro, gráficos e Split Payment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ETAPA 3: FARÓIS DO SIMPLES NACIONAL (RESUMO EXECUTIVO NO DASHBOARD) */}
      <FarolLimitesSimples alerta={alertaLimitesSimples} compacto={false} />

      {/* Cards de KPI no Topo Conforme Especificação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Alíquota Efetiva Atual */}
        <Card className="border-slate-200/80 shadow hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Alíquota Efetiva Atual</span>
              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                {regimeAtualFiltro}
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-slate-800">
              {formatarPorcentagem(aliquotaEfetivaAtual)}
            </p>
            <p className="text-[11px] text-slate-400">
              Carga efetiva nominal suportada no regime vigente
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Alíquota Efetiva Nova */}
        <Card className="border-[#D4AF37]/50 bg-gradient-to-br from-amber-50/40 to-white shadow hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-900">
                Alíquota Efetiva Nova
              </span>
              <span className="font-mono text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded text-[10px] font-bold">
                IBS / CBS
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-[#07132B]">
              {formatarPorcentagem(aliquotaEfetivaNova)}
            </p>
            <p className="text-[11px] text-slate-500">
              Considerando débitos com abatimento de compras ({percentualComprasVendasComparativo}%)
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Economia Mensal Projetada */}
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow hover:shadow-md transition-all">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-800">
                Economia Mensal Projetada
              </span>
              <span className="font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                {economiaMensalProjetada >= 0 ? 'Redução' : 'Acréscimo'}
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-emerald-700">
              {formatarMoeda(Math.abs(economiaMensalProjetada))}
            </p>
            <p className="text-[11px] text-slate-500">
              {economiaMensalProjetada >= 0
                ? 'Economia líquida estimada por competência mensal'
                : 'Necessidade de ajuste via tomada de créditos adicionais'}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Economia Anual Projetada */}
        <Card className="bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-5 space-y-1.5 relative">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#D4AF37]">
                Economia Anual Projetada
              </span>
              <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-bold">
                12 meses
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-white">
              {formatarMoeda(Math.abs(economiaAnualProjetada))}
            </p>
            <p className="text-[11px] text-slate-300">
              Impacto no fluxo de caixa anualizado da companhia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MUDANÇA 1: QUADRO COMPARATIVO DA TRANSIÇÃO COMPLETA (ATUAL + 2026 A 2033) */}
      <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
        <div className="p-5 bg-[#07132B] text-white border-b border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <h3 className="font-heading font-bold text-lg text-white">
                Quadro Comparativo da Transição Completa (LC 214/2025)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Comparativo de todos os anos da reforma tributária (
              {periodoDashboard === 'mensal' ? 'Valores Mensais' : 'Valores Anualizados'}),
              independente do ano da simulação escolhido.
            </p>
          </div>
          <div className="text-xs font-mono text-[#D4AF37] bg-white/10 px-3 py-1 rounded-lg border border-[#D4AF37]/40">
            Ano selecionado na simulação:{' '}
            <span className="font-bold text-white">
              {anoSimulacaoSelecionado === 'atual' ? 'Ano Atual' : anoSimulacaoSelecionado}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Ano</th>
                <th className="px-5 py-3.5">Fase da Transição (LC 214/2025)</th>
                <th className="px-5 py-3.5 text-center">Alíquota IBS/CBS do Ano</th>
                <th className="px-5 py-3.5 text-center">Alíquota Efetiva da Empresa</th>
                <th className="px-5 py-3.5 text-center">
                  Carga Tributária ({periodoDashboard === 'mensal' ? 'R$/mês' : 'R$/ano'})
                </th>
                <th className="px-5 py-3.5 text-center">Diferença vs. Sistema Atual</th>
                <th className="px-5 py-3.5 text-center">Regime Mais Econômico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {resultadoTransicao.map((item) => {
                const isSelected = String(item.ano) === String(anoSimulacaoSelecionado)
                const aliqTotalIbsCbs = Number((item.aliquotaCbs + item.aliquotaIbs).toFixed(2))

                // Carga no período filtrado (mensal ou anual)
                const cargaPeriodo =
                  periodoDashboard === 'mensal' ? item.impostoEstimado / 12 : item.impostoEstimado

                const cargaAtualPeriodo =
                  periodoDashboard === 'mensal'
                    ? item.impostoCenarioAtual / 12
                    : item.impostoCenarioAtual

                // Diferença: Imposto Carga Atual - Imposto Novo Carga (Economia positiva, Perda negativa)
                // Se diferencaPeriodo > 0: economia (paga menos no novo sistema)
                // Se diferencaPeriodo < 0: aumento de carga / perda
                const diferencaPeriodo = item.ano === 'atual' ? 0 : cargaAtualPeriodo - cargaPeriodo

                const regimeMaisEconomico =
                  regimesMaisEconomicosPorAno[String(item.ano)] || 'IBS/CBS'

                return (
                  <tr
                    key={item.ano}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 border-l-4 border-l-[#D4AF37] font-semibold text-slate-900 shadow-sm'
                        : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    {/* Ano */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#07132B]">
                          {item.ano === 'atual' ? 'Ano Atual' : item.ano}
                        </span>
                        {isSelected && (
                          <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] text-[#07132B] font-bold text-[10px] px-2 py-0.5 border-none shadow-sm">
                            Ano da Simulação
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Fase da Transição */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{item.fase}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.ano === 'atual'
                          ? 'PIS, COFINS, IPI, ICMS e ISS vigentes'
                          : item.ano === 2026
                            ? 'CBS 0,90% + IBS 0,10% (ensaio compensável)'
                            : item.ano === 2027
                              ? 'CBS plena 8,70% e extinção definitiva de PIS/COFINS'
                              : item.ano === 2028
                                ? 'CBS plena consolidada e homologação CGIBS'
                                : typeof item.ano === 'number' &&
                                    item.ano >= 2029 &&
                                    item.ano <= 2032
                                  ? `IBS ${(item.ano - 2028) * 10}% da referência + ICMS/ISS ${(10 - (item.ano - 2028)) * 10}%`
                                  : 'IVA Dual pleno (CBS 8,80% + IBS 17,70%), ICMS/ISS extintos'}
                      </div>
                    </td>

                    {/* Alíquota IBS/CBS do Ano */}
                    <td className="px-5 py-3.5 text-center font-mono">
                      <span className="font-semibold text-slate-700">
                        {formatarPorcentagem(aliqTotalIbsCbs)}
                      </span>
                      {item.ano !== 'atual' && (
                        <div className="text-[10px] text-slate-400">
                          (CBS {formatarPorcentagem(item.aliquotaCbs, 1)} + IBS{' '}
                          {formatarPorcentagem(item.aliquotaIbs, 2)})
                        </div>
                      )}
                    </td>

                    {/* Alíquota Efetiva da Empresa */}
                    <td className="px-5 py-3.5 text-center font-mono">
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-[#07132B] text-base' : 'text-slate-800'
                        }`}
                      >
                        {formatarPorcentagem(item.aliquotaEfetivaTotal)}
                      </span>
                    </td>

                    {/* Carga Tributária em R$ */}
                    <td className="px-5 py-3.5 text-center font-mono">
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-[#07132B] text-base' : 'text-slate-800'
                        }`}
                      >
                        {formatarMoeda(cargaPeriodo)}
                      </span>
                    </td>

                    {/* Diferença vs. Sistema Atual */}
                    <td className="px-5 py-3.5 text-center font-mono font-bold whitespace-nowrap">
                      {item.ano === 'atual' ? (
                        <span className="text-slate-400 font-medium text-xs">— (Referência)</span>
                      ) : diferencaPeriodo > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          + {formatarMoeda(diferencaPeriodo)} (Economia)
                        </span>
                      ) : diferencaPeriodo < 0 ? (
                        <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                          − {formatarMoeda(Math.abs(diferencaPeriodo))}
                        </span>
                      ) : (
                        <span className="text-slate-500">R$ 0,00</span>
                      )}
                    </td>

                    {/* Regime Mais Econômico */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {regimeMaisEconomico === 'Lucro Presumido' ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-900 border border-[#D4AF37] shadow-sm">
                          Lucro Presumido
                        </span>
                      ) : regimeMaisEconomico === 'IBS/CBS' ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                          IBS/CBS
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md">
                          {regimeMaisEconomico}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ETAPA 4: BLOCO IMPACTO DO SPLIT PAYMENT NO FLUXO DE CAIXA NO DASHBOARD (Sincronizado com ano do Dashboard) */}
      <BlocoSplitPayment
        resultadoSplitPayment={resultadoSplitPaymentDinamico}
        taxaMensalCapitalGiro={taxaMensalCapitalGiro}
        setTaxaMensalCapitalGiro={setTaxaMensalCapitalGiro}
        diasAntecipacaoSplit={diasAntecipacaoSplit}
        setDiasAntecipacaoSplit={setDiasAntecipacaoSplit}
        regimeAtualNome={regimeAtualFiltro}
        origemPropagada={origensPropagadas?.dashboardRegimeAtual}
      />

      {/* 3 Gráficos Conforme Especificação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1 em Barras: Comparativo dos 4 Regimes */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                Gráfico 1: Comparativo por Regime (
                {periodoDashboard === 'mensal' ? 'Mensal' : 'Anual'})
              </CardTitle>
              <span className="text-xs text-slate-500 font-mono">Valores em R$</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoBarras}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="regime" stroke="#64748B" fontSize={11} interval={0} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatarMoeda(Number(val)), 'Carga Total']}
                    contentStyle={{
                      backgroundColor: '#07132B',
                      borderColor: '#D4AF37',
                      color: '#fff',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="carga" radius={[6, 6, 0, 0]}>
                    {dadosGraficoBarras.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2 em Linha: Evolução 2026-2033 (Eixo duplo: Alíquota e Imposto Estimado) */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                Gráfico 2: Evolução da Alíquota & Imposto (
                {periodoDashboard === 'mensal' ? 'Mensal' : 'Anual'})
              </CardTitle>
              <span className="text-xs text-slate-500 font-mono">Curva de Transição</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosGraficoLinha}
                  margin={{ top: 10, right: 25, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="ano" stroke="#64748B" fontSize={11} />
                  {/* Eixo Primário (Esquerda): Alíquota Efetiva (%) */}
                  <YAxis
                    yAxisId="left"
                    stroke="#D4AF37"
                    fontSize={11}
                    unit="%"
                    tickFormatter={(val) => `${val}%`}
                  />
                  {/* Eixo Secundário (Direita): Imposto Estimado em R$ */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#38BDF8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => {
                      if (name === 'Imposto Estimado') {
                        return [formatarMoeda(Number(val)), 'Imposto Estimado']
                      }
                      return [`${Number(val).toFixed(2)}%`, 'Alíquota Efetiva Total']
                    }}
                    labelFormatter={(label) => `Ano ${label}`}
                    contentStyle={{
                      backgroundColor: '#07132B',
                      borderColor: '#D4AF37',
                      color: '#fff',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">{value}</span>
                    )}
                  />
                  {/* Traço 1: Alíquota Efetiva Total (Dourado #D4AF37) no eixo primário */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="aliquota"
                    name="Alíquota Efetiva Total"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#07132B', stroke: '#D4AF37', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                  {/* Traço 2: Imposto Estimado em R$ (Azul #38BDF8) no eixo secundário */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="imposto"
                    name="Imposto Estimado"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3.5, fill: '#07132B', stroke: '#38BDF8', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 3 em Pizza: Composição de Créditos Antigos vs Novos (Sincronizado dinamicamente) */}
        <Card className="border-slate-200 shadow-md lg:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                  Gráfico 3: Comparação da Apropriação de Créditos por Categoria
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Créditos gerados no antigo regime vs créditos ampliados no IVA Dual (
                  {isAliquotaZeroCreditos
                    ? '0,00% — Regime de Alíquota Zero'
                    : formatarPorcentagem(aliqRefCreditos)}
                  ).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  Total Antigo: {formatarMoeda(totalCreditosGrafico3.antigo)}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Total Novo: {formatarMoeda(totalCreditosGrafico3.novo)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h5 className="text-xs font-bold uppercase text-slate-500 text-center mb-2">
                  Distribuição de Créditos Novos (Top 5 Despesas)
                </h5>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPizzaCreditos}
                        dataKey="novo"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) =>
                          `${name.slice(0, 10)}... (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {dadosPizzaCreditos.map((entry, index) => (
                          <Cell
                            key={`cell-pie-${index}`}
                            fill={CORES_PIZZA[index % CORES_PIZZA.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatarMoeda(Number(val)), 'Crédito Novo']}
                        contentStyle={{
                          backgroundColor: '#07132B',
                          borderColor: '#D4AF37',
                          color: '#fff',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparativo de Barras Horizontais das Categorias */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Ganho Efetivo por Despesa
                </h5>
                {dadosPizzaCreditos.map((cat, idx) => {
                  const ganho = cat.novo - cat.antigo
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          +{formatarMoeda(ganho)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-slate-400 h-full"
                          style={{ width: `${(cat.antigo / (cat.novo || 1)) * 100}%` }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(Math.max(0, ganho) / (cat.novo || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Resumo Conforme Especificação */}
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#07132B]">
              Tabela Resumo Executiva dos Regimes
            </h3>
            <p className="text-xs text-slate-500">
              Carga tributária mensal, créditos recuperáveis, alíquota efetiva e o regime
              recomendado.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#07132B] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            {anoSimulacaoSelecionado === 'atual'
              ? 'Regime Recomendado para o ano atual:'
              : `Regime Recomendado para ${anoSimulacaoSelecionado}:`}{' '}
            <span className="text-[#D4AF37] uppercase">{regimeRecomendado}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Regime Tributário</th>
                <th className="px-6 py-3.5 text-center">Carga Tributária Mensal</th>
                <th className="px-6 py-3.5 text-center">Créditos Recuperáveis</th>
                <th className="px-6 py-3.5 text-center">Alíquota Efetiva</th>
                <th className="px-6 py-3.5 text-center">Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Linha 1: Lucro Real */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">Lucro Real</td>
                <td className="px-6 py-4 text-center font-mono text-slate-700">
                  {formatarMoeda(resultadoComparativo.lucroReal.totalEfetivo)}
                </td>
                <td className="px-6 py-4 text-center font-mono text-emerald-700">
                  {formatarMoeda(resultadoComparativo.lucroReal.creditos)}
                </td>
                <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                  {formatarPorcentagem(resultadoComparativo.lucroReal.aliquotaEfetiva)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      regimeRecomendado === 'Lucro Real'
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {regimeRecomendado === 'Lucro Real' ? '★ Recomendado' : 'Alternativo'}
                  </span>
                </td>
              </tr>

              {/* Linha 2: Lucro Presumido */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">Lucro Presumido</td>
                <td className="px-6 py-4 text-center font-mono text-slate-700">
                  {formatarMoeda(resultadoComparativo.lucroPresumido.totalEfetivo)}
                </td>
                <td className="px-6 py-4 text-center font-mono text-slate-400">
                  R$ 0,00 (Cumulativo)
                </td>
                <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                  {formatarPorcentagem(resultadoComparativo.lucroPresumido.aliquotaEfetiva)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      regimeRecomendado === 'Lucro Presumido'
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {regimeRecomendado === 'Lucro Presumido' ? '★ Recomendado' : 'Alternativo'}
                  </span>
                </td>
              </tr>

              {/* Linha 3: Simples Nacional */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">Simples Nacional</td>
                <td className="px-6 py-4 text-center font-mono text-slate-700">
                  {formatarMoeda(resultadoComparativo.simplesNacional.totalEfetivo)}
                </td>
                <td className="px-6 py-4 text-center font-mono text-slate-400">
                  R$ 0,00 (Guia Única)
                </td>
                <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                  {formatarPorcentagem(resultadoComparativo.simplesNacional.aliquotaEfetiva)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      regimeRecomendado === 'Simples Nacional'
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {regimeRecomendado === 'Simples Nacional' ? '★ Recomendado' : 'Alternativo'}
                  </span>
                </td>
              </tr>

              {/* Linha 4: IBS / CBS (Novo) */}
              <tr className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 font-bold">
                <td className="px-6 py-4 text-[#07132B] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  {anoSimulacaoSelecionado === 'atual'
                    ? 'IBS / CBS (Ano Atual)'
                    : `IBS / CBS (${anoSimulacaoSelecionado})`}
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-[#07132B]">
                  {formatarMoeda(ibsCbsAnoDashboard.totalEfetivo)}
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-emerald-800">
                  {formatarMoeda(ibsCbsAnoDashboard.creditosTotal)}
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-[#07132B]">
                  {formatarPorcentagem(ibsCbsAnoDashboard.aliquotaEfetiva)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      regimeRecomendado === 'IBS/CBS'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-[#D4AF37]/30 text-amber-950 font-bold'
                    }`}
                  >
                    {regimeRecomendado === 'IBS/CBS' ? '★ Mais Econômico' : 'Novo Modelo Legal'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Salvar Simulação invocado a partir do Dashboard */}
      <ModalSalvarSimulacao
        open={modalSalvarAberto}
        onOpenChange={setModalSalvarAberto}
        parametros={obterSnapshotParametros()}
        resultados={obterSnapshotResultados()}
        onSalvoComSucesso={() => {}}
      />

      {/* Modal Compartilhar Simulação */}
      <ModalCompartilharLink
        open={modalCompartilharAberto}
        onOpenChange={setModalCompartilharAberto}
        parametros={obterSnapshotParametros()}
      />
    </div>
  )
}
