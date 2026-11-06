import React, { useState } from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  TipoAtividade,
  AnoTransicaoIbsCbs,
  LISTA_ANOS_TRANSICAO,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
} from '@/types/calculadoraIbsCbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuadroAssistenteAnalise } from '@/components/calculadora/QuadroAssistenteAnalise'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  gerarRelatorioSimulacaoPDF,
  gerarRelatorioComparativoPDF,
} from '@/lib/pdfSimulacaoCalculadora'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import { ModalSalvarSimulacao } from '@/components/calculadora/ModalSalvarSimulacao'
import { ModalCompartilharLink } from '@/components/calculadora/ModalCompartilharLink'
import { ModalLimparDashboard } from '@/components/common/ModalLimparDashboard'
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
  ArrowRight,
  ShieldAlert,
  BookmarkPlus,
  FileDown,
  Share2,
} from 'lucide-react'
import { FarolLimitesSimples } from '@/components/calculadora/FarolLimitesSimples'
import { BlocoSplitPayment } from '@/components/calculadora/BlocoSplitPayment'
import { QuadroLegislacaoContextualCalculadora } from '@/components/calculadora/QuadroLegislacaoContextualCalculadora'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { construirConclusaoAnalitica } from '@/lib/conclusaoAnalitica'
import {
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_AGRO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_FOOD_SERVICE,
} from '@/types/calculadoraIbsCbs'

const CORES_PIZZA = ['#07132B', '#D4AF37', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6']

import {
  PainelProximosPassosCalculadora,
  ModuloCalculadoraId,
} from '@/components/calculadora/PainelProximosPassosCalculadora'
import { BarraAcoesSimulacao } from '@/components/calculadora/BarraAcoesSimulacao'
import { ModalExportarDadosSimulacao } from '@/components/calculadora/ModalExportarDadosSimulacao'
import { AvisoOrientativo } from '@/components/common/AvisoOrientativo'

interface Modulo6DashboardProps {
  simulacoesComparar?: SimulacaoCalculadora[]
  onAbrirPdfComparativo?: () => void
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  onSalvarSimulacao?: () => void
  onBaixarPdf?: () => void
  onExportarDados?: () => void
  onImportarFaturamento?: () => void
  gerandoPdf?: boolean
}

export default function Modulo6Dashboard({
  simulacoesComparar = [],
  onAbrirPdfComparativo,
  onNavegarModulo,
  onSalvarSimulacao,
  onBaixarPdf,
  onExportarDados,
  onImportarFaturamento,
  gerandoPdf: gerandoPdfProp,
}: Modulo6DashboardProps) {
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
    margemLucroEstimada,
    percentualExportacao,
    subatividadeServico,
    subatividadeComercio,
    subatividadeIndustria,
    subatividadeAgro,
    subatividadeConstrucao,
    subatividadeLocacao,
    subatividadeFoodService,
    obterSnapshotParametros,
    obterSnapshotResultados,
    parametroCbsAtivo,
    parametrosRadar,
    limparDashboard,
  } = useCalculadoraIbsCbs()

  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false)
  const [modalGerarPdfAberto, setModalGerarPdfAberto] = useState(false)
  const [modalExportarDadosAberto, setModalExportarDadosAberto] = useState(false)
  const [modalLimparAberto, setModalLimparAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const temComparativoDisponivel = simulacoesComparar.length >= 2 && simulacoesComparar.length <= 3

  const handleAbrirModalPdfDashboard = () => {
    setModalGerarPdfAberto(true)
  }

  const handleAbrirExportarDados = () => {
    if (onExportarDados) {
      onExportarDados()
    } else {
      setModalExportarDadosAberto(true)
    }
  }

  const handleConfirmarPdf = (
    dadosTecnico: ResponsavelTecnicoDados,
    escolha?: 'atual' | 'comparativo',
  ) => {
    try {
      setGerandoPdf(true)

      if (escolha === 'comparativo' && temComparativoDisponivel) {
        gerarRelatorioComparativoPDF({
          simulacoes: simulacoesComparar,
          clienteNome: clienteAtivo ? clienteAtivo.nome : undefined,
          responsavelTecnico: dadosTecnico,
          observacoesContador: dadosTecnico.observacoes,
        })
        toast({
          title: 'PDF Comparativo gerado!',
          description: `Dossiê comparativo com ${simulacoesComparar.length} cenários baixado com sucesso.`,
        })
      } else {
        const params = obterSnapshotParametros()
        const res = obterSnapshotResultados()
        gerarRelatorioSimulacaoPDF({
          nomeSimulacao: 'Simulação Executiva - Dashboard',
          parametros: params,
          resultados: res,
          empresa: clienteAtivo ? clienteAtivo.nome : params.empresa,
          cnpj: clienteAtivo ? clienteAtivo.cnpj_cpf : params.cnpj,
          clienteNome: clienteAtivo ? clienteAtivo.nome : undefined,
          responsavelTecnico: dadosTecnico,
          observacoesContador: dadosTecnico.observacoes,
        })
        toast({
          title: 'Relatório PDF gerado!',
          description: 'Download do relatório individual completo iniciado com sucesso.',
        })
      }
      setModalGerarPdfAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao compilar relatório em PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

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

    if (String(anoSimulacaoSelecionado) === '2026') {
      // Em 2026 (art. 348 da LC 214/2025), a CBS (0,9%) e o IBS (0,1%) são em fase de teste,
      // compensáveis integralmente com PIS/COFINS, gerando custo líquido / carga líquida zero
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
        aliquotaReferenciaFase: totalIvaFaseDashboard,
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

  // Presunção legal do segmento para alimentar a análise comparativa de lucro
  const presuncaoSegmentoCalculada = React.useMemo(() => {
    let pres = 32
    if (tipoAtividade === 'comercio') {
      const sub = SUBATIVIDADES_COMERCIO.find((s) => s.id === subatividadeComercio)
      pres = sub?.presuncaoIrpj ?? 8
    } else if (tipoAtividade === 'industria') {
      const sub = SUBATIVIDADES_INDUSTRIA.find((s) => s.id === subatividadeIndustria)
      pres = sub?.presuncaoIrpj ?? 8
    } else if (tipoAtividade === 'agronegocio') {
      const sub = SUBATIVIDADES_AGRO.find((s) => s.id === subatividadeAgro)
      pres = sub?.presuncaoIrpj ?? 8
    } else if (tipoAtividade === 'construcao_civil') {
      const sub = SUBATIVIDADES_CONSTRUCAO.find((s) => s.id === subatividadeConstrucao)
      pres = sub?.presuncaoIrpj ?? 32
    } else if (tipoAtividade === 'locacao_bens') {
      const sub = SUBATIVIDADES_LOCACAO.find((s) => s.id === subatividadeLocacao)
      pres = sub?.presuncaoIrpj ?? 32
    } else if (tipoAtividade === 'food_service') {
      const sub = SUBATIVIDADES_FOOD_SERVICE.find((s) => s.id === subatividadeFoodService)
      pres = sub?.presuncaoIrpj ?? 8
    } else if (tipoAtividade === 'servico') {
      const sub = SUBATIVIDADES_SERVICO.find((s) => s.id === subatividadeServico)
      pres = sub?.presuncaoIrpj ?? 32
    }
    return pres
  }, [
    tipoAtividade,
    subatividadeServico,
    subatividadeComercio,
    subatividadeIndustria,
    subatividadeAgro,
    subatividadeConstrucao,
    subatividadeLocacao,
    subatividadeFoodService,
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

    const is2026OuAtual =
      anoSimulacaoSelecionado === 'atual' || String(anoSimulacaoSelecionado) === '2026'

    // Determina o regime recomendado para o ano selecionado no Dashboard:
    // Para 2026 e atual, IBS/CBS NÃO concorre (sai apenas entre Lucro Real, Lucro Presumido e Simples Nacional)
    const cenarios = [
      { nome: 'Lucro Real', total: resultadoComparativo.lucroReal.totalEfetivo },
      { nome: 'Lucro Presumido', total: resultadoComparativo.lucroPresumido.totalEfetivo },
      { nome: 'Simples Nacional', total: resultadoComparativo.simplesNacional.totalEfetivo },
      ...(is2026OuAtual ? [] : [{ nome: 'IBS/CBS', total: ibsCbsAnoDashboard.totalEfetivo }]),
    ].sort((a, b) => a.total - b.total)

    return {
      aliquotaEfetivaAtual: aliqAtual,
      aliquotaEfetivaNova: aliqNova,
      economiaMensalProjetada: economiaMensal,
      economiaAnualProjetada: economiaAnual,
      regimeRecomendado: cenarios[0]?.nome || resultadoComparativo.regimeMaisVantajoso,
    }
  }, [regimeAtualFiltro, resultadoComparativo, ibsCbsAnoDashboard, anoSimulacaoSelecionado])

  // KPIs adicionais do Dashboard (APENAS APRESENTAÇÃO): derivados dos mesmos valores
  // já calculados acima — nenhuma fórmula de apuração é alterada ou duplicada aqui.
  const kpisAdicionais = React.useMemo(() => {
    const cargaAtualMensal =
      regimeAtualFiltro === 'Lucro Real'
        ? resultadoComparativo.lucroReal.totalEfetivo
        : regimeAtualFiltro === 'Lucro Presumido'
          ? resultadoComparativo.lucroPresumido.totalEfetivo
          : resultadoComparativo.simplesNacional.totalEfetivo
    const cargaNovaMensal = ibsCbsAnoDashboard.totalEfetivo

    // Fases sem incidência plena de IBS/CBS: ano atual (pré-reforma) e 2026 (ensaio art. 348)
    const isFaseSemIbsCbs =
      anoSimulacaoSelecionado === 'atual' || String(anoSimulacaoSelecionado) === '2026'

    const variacaoPercentual =
      !isFaseSemIbsCbs && cargaAtualMensal > 0
        ? ((cargaAtualMensal - cargaNovaMensal) / cargaAtualMensal) * 100
        : null

    return {
      cargaAtualPeriodo: cargaAtualMensal * mult,
      cargaNovaPeriodo: cargaNovaMensal * mult,
      creditosPeriodo: ibsCbsAnoDashboard.creditosTotal * mult,
      variacaoPercentual,
      isFaseSemIbsCbs,
    }
  }, [regimeAtualFiltro, resultadoComparativo, ibsCbsAnoDashboard, anoSimulacaoSelecionado, mult])

  // Dados consolidados da Conclusão Analítica do cenário selecionado
  const conclusaoAnalitica = React.useMemo(() => {
    return construirConclusaoAnalitica({
      anoSelecionado: anoSimulacaoSelecionado,
      regimeAtualFiltro,
      regimeRecomendado,
      economiaMensalProjetada,
      economiaAnualProjetada,
      aliquotaEfetivaAtual,
      aliquotaEfetivaNova,
      faturamentoMensal,
      percentualComprasVendas: percentualComprasVendasComparativo,
      percentualExportacao,
      margemLucroEstimada,
      tipoAtividade,
      presuncaoSegmento: presuncaoSegmentoCalculada,
      alertaLimitesSimples,
    })
  }, [
    anoSimulacaoSelecionado,
    regimeAtualFiltro,
    regimeRecomendado,
    economiaMensalProjetada,
    economiaAnualProjetada,
    aliquotaEfetivaAtual,
    aliquotaEfetivaNova,
    faturamentoMensal,
    percentualComprasVendasComparativo,
    percentualExportacao,
    margemLucroEstimada,
    tipoAtividade,
    presuncaoSegmentoCalculada,
    alertaLimitesSimples,
  ])

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
    const is2026OuAtual =
      anoSimulacaoSelecionado === 'atual' || String(anoSimulacaoSelecionado) === '2026'

    const custoCapitalMensal = is2026OuAtual ? 0 : retencaoMensalNota * taxaDecimal * fatorTempo
    const custoCapitalAnual = custoCapitalMensal * 12

    const retencaoFinal = is2026OuAtual ? 0 : retencaoMensalNota
    const diferencaFinal = is2026OuAtual ? 0 : diferencaFluxoCaixa

    const explicacaoSimples = is2026OuAtual
      ? 'Em 2026 (art. 348 da LC 214/2025), a CBS (0,9%) e o IBS (0,1%) atuam em fase de teste piloto compensável integralmente com PIS/COFINS. Não há retenção antecipada nem impacto de custo financeiro no capital de giro nesta fase.'
      : resultadoSplitPayment.explicacaoSimples

    return {
      ...resultadoSplitPayment,
      retencaoMensalNota: retencaoFinal,
      recolhimentoAtualMensal,
      diferencaFluxoCaixa: diferencaFinal,
      custoCapitalMensal,
      custoCapitalAnual,
      explicacaoSimples,
    }
  }, [
    faturamentoMensal,
    resultadoComparativo,
    totalIvaFaseDashboard,
    regimeAtualFiltro,
    taxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    resultadoSplitPayment,
    anoSimulacaoSelecionado,
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

  // 3. DADOS GRÁFICO 3: PIZZA - Composição dos Créditos Antigos versus Novos (sincronizado com o ano do Dashboard e filtro mensal/anual)
  const dadosPizzaCreditos = despesasCreditos.slice(0, 5).map((item) => {
    const aliqNova = isAliquotaZeroCreditos
      ? 0
      : item.aliquotaNova !== undefined
        ? item.aliquotaNova
        : aliqRefCreditos

    return {
      name: item.nome,
      antigo: (item.valorMensal * mult * item.aliquotaAntiga) / 100,
      novo: (item.valorMensal * mult * aliqNova) / 100,
      aliquotaNovaAplicada: aliqNova,
    }
  })

  // Totais de créditos do Gráfico 3 dinâmicos (seguindo o multiplicador mensal/anual)
  const totalCreditosGrafico3 = React.useMemo(() => {
    let antigo = 0
    let novo = 0
    despesasCreditos.forEach((item) => {
      const v = Math.max(0, item.valorMensal * mult)
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
  }, [despesasCreditos, isAliquotaZeroCreditos, aliqRefCreditos, mult])

  // Cálculo do regime mais econômico para cada linha/ano da transição completa (Quadro Comparativo)
  const regimesMaisEconomicosPorAno = React.useMemo(() => {
    const lrTotal = resultadoComparativo.lucroReal.totalEfetivo
    const lpTotal = resultadoComparativo.lucroPresumido.totalEfetivo
    const snTotal = resultadoComparativo.simplesNacional.totalEfetivo

    const mapa: Record<string, string> = {}

    resultadoTransicao.forEach((item) => {
      const ano = item.ano

      if (ano === 'atual' || String(ano) === '2026') {
        // No sistema atual e em 2026 (fase de teste art. 348 LC 214/2025),
        // concorrem apenas os 3 regimes vigentes (Lucro Real, Lucro Presumido, Simples Nacional)
        const cenarios = [
          { nome: 'Lucro Real', total: lrTotal },
          { nome: 'Lucro Presumido', total: lpTotal },
          { nome: 'Simples Nacional', total: snTotal },
        ].sort((a, b) => a.total - b.total)
        mapa[String(ano)] = cenarios[0].nome
        return
      }

      // Para os anos de 2027 a 2033:
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
    <div id="modulo6-dashboard-painel" className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo com hierarquia visual destacada para os 3 botões */}
      <div className="bg-[#07132B]/95 backdrop-blur-md border-2 border-[#D4AF37]/50 rounded-2xl p-5 sm:p-6 text-white relative shadow-2xl transition-all overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3 min-w-0">
          <div className="inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 tracking-wider uppercase">
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Módulo 6 • Painel Executivo Integrado</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-white tracking-tight leading-tight break-words">
                Dashboard Executivo da Reforma Tributária
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-snug break-words">
                Visão gerencial consolidada que consome todos os módulos anteriores. Visualize KPIs
                de impacto, gráficos comparativos de regimes e evolução temporal das obrigações
                fiscais.
              </p>
            </div>

            {/* Grupo de Botões de Ação com Destaque e Hierarquia Visual Clara (flex-wrap: nunca escapa do card) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0 max-w-full bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-inner">
              {/* Botão Limpar Dashboard (outline Dourado/Navy, sem ícones) */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalLimparAberto(true)}
                className="bg-[#07132B] hover:bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/70 font-bold text-xs h-10 px-3.5 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Limpar todos os dados e resultados do Dashboard"
              >
                <span>Limpar Dashboard</span>
              </Button>

              {/* Botão Exportar dados: Padrão Diamond Group, sem ícones */}
              <Button
                type="button"
                onClick={handleAbrirExportarDados}
                className="bg-[#07132B] hover:bg-[#0d224d] text-white border-2 border-[#D4AF37]/80 font-extrabold text-xs h-10 px-3.5 shadow-md transition-colors"
                title="Exportar planilha (CSV/Excel) e relatório com todos os parâmetros e resultados"
              >
                <span>Exportar dados</span>
              </Button>

              {/* Botão Secundário 1: Compartilhar */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCompartilharAberto(true)}
                className="bg-[#07132B] hover:bg-white/15 text-[#D4AF37] border-2 border-[#D4AF37]/60 font-bold text-xs h-10 px-3.5 shadow-md flex items-center gap-1.5 transition-colors"
                title="Compartilhar link da simulação"
              >
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Compartilhar</span>
              </Button>

              {/* Botão Secundário 2: Salvar Simulação */}
              <Button
                type="button"
                onClick={() => setModalSalvarAberto(true)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#c49f2e] hover:to-[#D4AF37] text-[#07132B] font-extrabold text-xs h-10 px-4 shadow-lg border border-[#D4AF37] flex items-center gap-1.5 transition-colors"
                title="Salvar esta simulação na sua conta"
              >
                <BookmarkPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Simulação</span>
              </Button>

              {/* Botão Primário em Destaque: Gerar parecer da calculadora (sem ícones — apenas texto e cores) */}
              <Button
                type="button"
                onClick={handleAbrirModalPdfDashboard}
                disabled={gerandoPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-10 px-4 shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400 transition-colors"
                title="Gerar parecer da calculadora em PDF"
              >
                <span>{gerandoPdf ? 'Gerando...' : 'Gerar parecer da calculadora'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Oficial do Radar Tributário: Alíquota Vigente / Proposta e Fonte (visível apenas com análise ativa) */}
      {faturamentoMensal > 0 && parametroCbsAtivo && (
        <div className="rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#07132B] via-[#0B1E45] to-[#07132B] p-4 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                  Radar Tributário • Parâmetro Oficial
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40">
                  {parametroCbsAtivo.tributo} {parametroCbsAtivo.ano}:{' '}
                  {parametroCbsAtivo.aliquota.toFixed(4)}% (
                  {parametroCbsAtivo.situacao === 'proposta' ? 'Proposta' : 'Fixada'})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                {parametroCbsAtivo.detalhes ||
                  `Alíquota de referência da ${parametroCbsAtivo.tributo} aprovada para ${parametroCbsAtivo.ano}.`}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Fonte oficial: <span className="text-[#D4AF37]">{parametroCbsAtivo.fonte}</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <a
                href="/legislacao"
                className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 transition-colors"
              >
                Consultar Legislação
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Rasante de Legislação Contextual: normas e teses aplicáveis ao perfil e enquadramento simulado (visível apenas com análise ativa) */}
      {faturamentoMensal > 0 && (
        <QuadroLegislacaoContextualCalculadora
          segmentoSimulado={
            tipoAtividade === 'industria'
              ? 'Indústria'
              : tipoAtividade === 'comercio'
                ? 'Comércio'
                : tipoAtividade === 'servico'
                  ? 'Serviços'
                  : tipoAtividade === 'agronegocio'
                    ? 'Agro'
                    : tipoAtividade === 'construcao_civil'
                      ? 'Construção Civil'
                      : undefined
          }
          regimeSimulado={regimeAtualFiltro}
          ramoSimulado={tipoAtividade}
          faturamentoMensalSimulado={faturamentoMensal}
        />
      )}

      {/* Barra de Filtros Globais Conforme Especificação - Fixo (sticky) logo abaixo da navbar */}
      <Card className="border-slate-200/80 bg-slate-50/95 backdrop-blur-md shadow-md sticky top-16 sm:top-[68px] z-20 transition-all">
        <CardHeader className="py-3 px-5 sm:px-6 border-b border-slate-200/60 flex flex-row items-center gap-2">
          <CardTitle className="text-sm font-bold text-[#07132B]">
            Filtros do Dashboard (Sincronização em Tempo Real)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
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

      {/* Estado Vazio: Sem Análise Realizada quando faturamentoMensal for 0 */}
      {faturamentoMensal === 0 ? (
        <Card className="border-2 border-dashed border-[#D4AF37]/50 bg-gradient-to-br from-[#07132B]/5 via-white to-amber-50/20 shadow-lg text-center py-12 px-6 rounded-2xl">
          <CardContent className="max-w-xl mx-auto space-y-4">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40">
              MÓDULO 6 • SEM ANÁLISE REALIZADA
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#07132B] tracking-tight">
              Nenhuma análise tributária calculada
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Os dados de faturamento estão zerados ou foram limpos. Para visualizar os KPIs
              executivos, gráficos comparativos de regimes, split payment e créditos, informe o
              faturamento no campo acima ou preencha as configurações nos módulos 1 a 3.
            </p>
            {onNavegarModulo && (
              <div className="pt-2 flex justify-center">
                <Button
                  type="button"
                  onClick={() => onNavegarModulo('modulo1')}
                  className="bg-[#07132B] hover:bg-[#0c224a] text-[#D4AF37] font-bold text-xs h-10 px-5 border border-[#D4AF37]/60 shadow-md"
                >
                  Ir para Módulo 1 (Configurações)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ETAPA 3: FARÓIS DO SIMPLES NACIONAL (RESUMO EXECUTIVO NO DASHBOARD) */}
          <FarolLimitesSimples alerta={alertaLimitesSimples} compacto={false} />

          {/* Cards de KPI no Topo Conforme Especificação */}
          {(() => {
            const atual = formatarPorcentagem(aliquotaEfetivaAtual)
            const nova = formatarPorcentagem(aliquotaEfetivaNova)

            // Fonte adaptativa baseada no comprimento do valor percentual formatado
            const tamanhoFonteAliquota = (valor: string) =>
              valor.length > 9
                ? 'text-lg sm:text-xl'
                : valor.length > 7
                  ? 'text-xl sm:text-2xl'
                  : 'text-2xl sm:text-3xl'

            // Fonte adaptativa genérica para valores monetários/textos longos (KPIs adicionais)
            const tamanhoFonteValor = (valor: string) =>
              valor.length > 14
                ? 'text-base sm:text-lg'
                : valor.length > 11
                  ? 'text-lg sm:text-xl'
                  : valor.length > 8
                    ? 'text-xl sm:text-2xl'
                    : 'text-2xl sm:text-3xl'

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Alíquota Efetiva Atual */}
                <Card className="border-slate-200/80 shadow hover:shadow-md transition-all">
                  <CardContent className="p-5 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-500 gap-1 min-w-0">
                      <span className="font-semibold uppercase tracking-wider truncate min-w-0">
                        {regimeAtualFiltro === 'Simples Nacional'
                          ? 'DAS Atual'
                          : 'Alíquota Efetiva Atual'}
                      </span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] shrink-0 whitespace-nowrap">
                        {regimeAtualFiltro}
                      </span>
                    </div>
                    <div className="py-0.5 min-w-0 overflow-hidden">
                      <p
                        className={`${tamanhoFonteAliquota(atual)} font-mono font-extrabold text-slate-800 truncate tracking-tight`}
                        title={atual}
                      >
                        {atual}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {regimeAtualFiltro === 'Simples Nacional'
                        ? 'Alíquota efetiva atual da guia DAS tradicional'
                        : 'Carga efetiva nominal suportada no regime vigente'}
                    </p>
                  </CardContent>
                </Card>

                {/* KPI 2: Alíquota Efetiva Nova / Cenário da Transição */}
                <Card className="border-[#D4AF37]/50 bg-gradient-to-br from-amber-50/40 to-white shadow hover:shadow-md transition-all">
                  <CardContent className="p-5 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs gap-1 min-w-0">
                      <span className="font-bold uppercase tracking-wider text-amber-900 truncate min-w-0">
                        {regimeAtualFiltro === 'Simples Nacional'
                          ? 'Cenário da Transição'
                          : 'Alíquota Efetiva Nova'}
                      </span>
                      <span className="font-mono text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">
                        {regimeAtualFiltro === 'Simples Nacional'
                          ? 'CBS no DAS + IBS'
                          : 'IBS / CBS'}
                      </span>
                    </div>
                    <div className="py-0.5 min-w-0 overflow-hidden">
                      <p
                        className={`${tamanhoFonteAliquota(nova)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                        title={nova}
                      >
                        {nova}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {regimeAtualFiltro === 'Simples Nacional'
                        ? 'CBS no DAS a partir de 2027 e IBS por fora com créditos'
                        : `Considerando débitos com abatimento de compras (${percentualComprasVendasComparativo}%)`}
                    </p>
                  </CardContent>
                </Card>

                {/* KPI 3: Economia Mensal Projetada */}
                {(() => {
                  const temEconomiaMensal = economiaMensalProjetada >= 0
                  const strValorMensal = temEconomiaMensal
                    ? formatarMoeda(economiaMensalProjetada)
                    : 'Sem economia neste cenário'

                  // Fonte adaptativa baseada no comprimento do valor formatado ou texto
                  const tamanhoFonteMensal = !temEconomiaMensal
                    ? 'text-lg sm:text-xl font-sans'
                    : strValorMensal.length > 18
                      ? 'text-base sm:text-lg'
                      : strValorMensal.length > 15
                        ? 'text-lg sm:text-xl'
                        : strValorMensal.length > 12
                          ? 'text-xl sm:text-2xl'
                          : 'text-2xl sm:text-3xl'

                  return (
                    <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                      <CardContent className="p-5 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 truncate">
                            Economia Mensal Projetada
                          </span>
                          <span className="font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                            {temEconomiaMensal ? 'Redução' : 'Acréscimo'}
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${tamanhoFonteMensal} ${temEconomiaMensal ? 'font-mono' : 'font-semibold'} font-extrabold text-emerald-700 truncate tracking-tight`}
                            title={strValorMensal}
                          >
                            {strValorMensal}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {temEconomiaMensal
                            ? 'Economia líquida estimada por competência mensal'
                            : 'Necessidade de ajuste via tomada de créditos adicionais'}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* KPI 4: Economia Anual Projetada */}
                {(() => {
                  const temEconomiaAnual = economiaAnualProjetada >= 0
                  const strValorAnual = temEconomiaAnual
                    ? formatarMoeda(economiaAnualProjetada)
                    : 'Sem economia neste cenário'

                  // Fonte adaptativa baseada no comprimento do valor formatado ou texto
                  const tamanhoFonteAnual = !temEconomiaAnual
                    ? 'text-lg sm:text-xl font-sans'
                    : strValorAnual.length > 18
                      ? 'text-base sm:text-lg'
                      : strValorAnual.length > 15
                        ? 'text-lg sm:text-xl'
                        : strValorAnual.length > 12
                          ? 'text-xl sm:text-2xl'
                          : 'text-2xl sm:text-3xl'

                  return (
                    <Card className="bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
                      <CardContent className="p-5 space-y-1.5 relative min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1">
                          <span className="font-bold uppercase tracking-wider text-[#D4AF37] truncate">
                            Economia Anual Projetada
                          </span>
                          <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                            12 meses
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${tamanhoFonteAnual} ${temEconomiaAnual ? 'font-mono' : 'font-semibold'} font-extrabold text-white truncate tracking-tight`}
                            title={strValorAnual}
                          >
                            {strValorAnual}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2">
                          Impacto no fluxo de caixa anualizado da companhia
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* KPI 5: Carga Tributária Total no Regime Atual */}
                {(() => {
                  const valorAtual = formatarMoeda(kpisAdicionais.cargaAtualPeriodo)
                  return (
                    <Card className="border-slate-200/80 bg-white shadow hover:shadow-md transition-all">
                      <CardContent className="p-5 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1 min-w-0">
                          <span className="font-semibold uppercase tracking-wider text-slate-600 truncate min-w-0">
                            Carga Total Atual
                          </span>
                          <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] shrink-0 whitespace-nowrap">
                            {periodoDashboard === 'mensal' ? 'R$/mês' : 'R$/ano'}
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${tamanhoFonteValor(valorAtual)} font-mono font-extrabold text-slate-800 truncate tracking-tight`}
                            title={valorAtual}
                          >
                            {valorAtual}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {`Carga efetiva total estimada no ${regimeAtualFiltro} (${
                            periodoDashboard === 'mensal' ? 'base mensal' : 'x12'
                          })`}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* KPI 6: Carga Tributária Total no IBS/CBS */}
                {(() => {
                  const valorNovo = formatarMoeda(kpisAdicionais.cargaNovaPeriodo)
                  return (
                    <Card className="border-[#D4AF37]/50 bg-gradient-to-br from-amber-50/40 to-white shadow hover:shadow-md transition-all">
                      <CardContent className="p-5 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1 min-w-0">
                          <span className="font-bold uppercase tracking-wider text-amber-900 truncate min-w-0">
                            Carga Total IBS/CBS
                          </span>
                          <span className="font-mono text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">
                            {anoSimulacaoSelecionado === 'atual'
                              ? 'Ano Atual'
                              : String(anoSimulacaoSelecionado)}
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${tamanhoFonteValor(valorNovo)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                            title={valorNovo}
                          >
                            {valorNovo}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {kpisAdicionais.isFaseSemIbsCbs
                            ? 'Fase sem incidência plena de IBS/CBS — carga zero neste ano'
                            : `IVA Dual da fase selecionada com abatimento de créditos (${
                                periodoDashboard === 'mensal' ? 'base mensal' : 'x12'
                              })`}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* KPI 7: Variação Percentual da Carga (Atual → IBS/CBS) */}
                {(() => {
                  const temVariacao = kpisAdicionais.variacaoPercentual !== null
                  const strVariacao = temVariacao
                    ? formatarPorcentagem(kpisAdicionais.variacaoPercentual as number)
                    : 'N/D'
                  const reduzindo =
                    temVariacao && (kpisAdicionais.variacaoPercentual as number) >= 0

                  return (
                    <Card
                      className={`shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                        temVariacao
                          ? 'border-slate-200/80 bg-gradient-to-br from-slate-50 to-white'
                          : 'border-dashed border-slate-200/80 bg-slate-50'
                      }`}
                    >
                      <CardContent className="p-5 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1 min-w-0">
                          <span className="font-bold uppercase tracking-wider text-slate-700 truncate min-w-0">
                            Variação de Carga
                          </span>
                          <span
                            className={`font-medium px-2 py-0.5 rounded text-[10px] shrink-0 ${
                              temVariacao
                                ? reduzindo
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : 'text-red-700 bg-red-100'
                                : 'text-slate-500 bg-slate-200'
                            }`}
                          >
                            {temVariacao ? (reduzindo ? 'Redução' : 'Aumento') : 'Sem dado'}
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${temVariacao ? tamanhoFonteValor(strVariacao) : 'text-xl sm:text-2xl'} ${
                              temVariacao ? 'font-mono' : 'font-semibold'
                            } font-extrabold ${
                              temVariacao
                                ? reduzindo
                                  ? 'text-emerald-700'
                                  : 'text-red-600'
                                : 'text-slate-400'
                            } truncate tracking-tight`}
                            title={strVariacao}
                          >
                            {strVariacao}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {kpisAdicionais.isFaseSemIbsCbs
                            ? 'Indisponível: fase sem incidência plena de IBS/CBS'
                            : 'Percentual de variação da carga no regime atual vs IBS/CBS'}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* KPI 8: Créditos Aproveitáveis Estimados (IBS/CBS) */}
                {(() => {
                  const temCreditos = kpisAdicionais.creditosPeriodo > 0
                  const strCreditos = temCreditos
                    ? formatarMoeda(kpisAdicionais.creditosPeriodo)
                    : '—'

                  return (
                    <Card
                      className={`shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                        temCreditos
                          ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white'
                          : 'border-dashed border-slate-200/80 bg-slate-50'
                      }`}
                    >
                      <CardContent className="p-5 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs gap-1 min-w-0">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 truncate min-w-0">
                            Créditos Aproveitáveis
                          </span>
                          <span
                            className={`font-medium px-2 py-0.5 rounded text-[10px] shrink-0 ${
                              temCreditos
                                ? 'text-emerald-700 bg-emerald-100'
                                : 'text-slate-500 bg-slate-200'
                            }`}
                          >
                            {temCreditos
                              ? periodoDashboard === 'mensal'
                                ? 'R$/mês'
                                : 'R$/ano'
                              : 'N/D'}
                          </span>
                        </div>
                        <div className="py-0.5 min-w-0 overflow-hidden">
                          <p
                            className={`${temCreditos ? tamanhoFonteValor(strCreditos) : 'text-xl sm:text-2xl'} ${
                              temCreditos ? 'font-mono' : 'font-semibold'
                            } font-extrabold ${
                              temCreditos ? 'text-emerald-700' : 'text-slate-400'
                            } truncate tracking-tight`}
                            title={
                              temCreditos ? strCreditos : 'Sem créditos aproveitáveis nesta fase'
                            }
                          >
                            {strCreditos}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {kpisAdicionais.isFaseSemIbsCbs
                            ? 'Fase sem créditos IBS/CBS a apropriar'
                            : 'Total de créditos (compras + despesas) abatidos no IVA Dual'}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}
              </div>
            )
          })()}

          {/* BLOCO: CONCLUSÃO ANALÍTICA (ENTRE OS KPIS E O QUADRO/GRÁFICOS) */}
          {/* Padrão Visual Diamond Group: verde escuro/dourado, cards escuros, SEM ícones */}
          <Card className="bg-[#07132B] text-white border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <CardContent className="p-6 sm:p-7 space-y-5 relative">
              {/* Cabeçalho do Bloco Analítico */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/30">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 mb-1.5">
                    Parecer Técnico Integrado • Diamond Group
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-extrabold text-white tracking-tight">
                    Conclusão Analítica do Cenário
                  </h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="text-slate-300">Ano da Transição:</span>
                  <span className="bg-white/10 text-[#D4AF37] font-bold px-3 py-1 rounded border border-[#D4AF37]/40">
                    {conclusaoAnalitica.isAtual ? 'Ano Atual' : conclusaoAnalitica.anoSelecionado}
                  </span>
                </div>
              </div>

              {/* Veredito em Texto do Cenário */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-[#D4AF37]/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
                    Veredito Técnico do Ano Selecionado
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded font-bold bg-[#D4AF37] text-[#07132B]">
                    Recomendado: {conclusaoAnalitica.regimeRecomendado}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                  {conclusaoAnalitica.vereditoTexto}
                </p>

                {/* Resumo Numérico em Pílulas Textuais (Sem Ícones) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="p-2.5 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] font-sans">Regime Atual Base</span>
                    <span className="font-bold text-white text-sm mt-0.5">
                      {conclusaoAnalitica.regimeAtualReferencia}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatarPorcentagem(conclusaoAnalitica.aliquotaAtual)} de carga
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] font-sans">
                      Economia Mensal Projetada
                    </span>
                    <span
                      className={`font-bold text-sm mt-0.5 ${
                        conclusaoAnalitica.temEconomia ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {conclusaoAnalitica.economiaMensalStr}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {conclusaoAnalitica.temEconomia
                        ? 'Redução por competência'
                        : 'Regra de corte aplicada'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px] font-sans">
                      Economia Anual Projetada
                    </span>
                    <span
                      className={`font-bold text-sm mt-0.5 ${
                        conclusaoAnalitica.temEconomia ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {conclusaoAnalitica.economiaAnualStr}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {conclusaoAnalitica.temEconomia
                        ? 'Impacto no fluxo de caixa anual'
                        : 'Regra de corte aplicada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fatores Explicativos do Resultado */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
                    Fatores Determinantes do Resultado ({conclusaoAnalitica.fatores.length} Fatores)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Derivados dos parâmetros da sua empresa
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {conclusaoAnalitica.fatores.map((fator, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-white/5 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-[#D4AF37] font-bold block">
                          FATOR 0{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {fator.titulo}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                          {fator.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

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
                      periodoDashboard === 'mensal'
                        ? item.impostoEstimado / 12
                        : item.impostoEstimado

                    const cargaAtualPeriodo =
                      periodoDashboard === 'mensal'
                        ? item.impostoCenarioAtual / 12
                        : item.impostoCenarioAtual

                    // Diferença: Imposto Carga Atual - Imposto Novo Carga (Economia positiva, Perda negativa)
                    // Se diferencaPeriodo > 0: economia (paga menos no novo sistema)
                    // Se diferencaPeriodo < 0: aumento de carga / perda
                    const diferencaPeriodo =
                      item.ano === 'atual' ? 0 : cargaAtualPeriodo - cargaPeriodo

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
                            <span className="text-slate-400 font-medium text-xs">
                              — (Referência)
                            </span>
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
            anoTransicao={anoSimulacaoSelecionado}
          />

          {/* 3 Gráficos Conforme Especificação */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1 em Barras: Comparativo dos 4 Regimes */}
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                      Gráfico 1: Comparativo por Regime (
                      {periodoDashboard === 'mensal' ? 'Mensal' : 'Anual'})
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Carga tributária nos 4 cenários fiscais (
                      {periodoDashboard === 'mensal' ? 'R$/mês' : 'R$/ano'})
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono self-start sm:self-auto bg-slate-100 px-2 py-0.5 rounded">
                    Valores em R$
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosGraficoBarras}
                      margin={{ top: 20, right: 15, left: 10, bottom: 45 }}
                      barCategoryGap="22%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="regime"
                        stroke="#64748B"
                        interval={0}
                        height={40}
                        tick={(tickProps: any) => {
                          const { x, y, payload } = tickProps
                          const texto = String(payload.value || '')
                          // Identifica o regime para cor específica do pill
                          const isIbs = texto.includes('IBS')
                          const isSimples = texto.includes('Simples')
                          const isReal = texto.includes('Real')

                          let pillBg = '#F1F5F9'
                          let pillStroke = '#CBD5E1'
                          let textColor = '#334155'

                          if (isIbs) {
                            pillBg = '#FEF3C7'
                            pillStroke = '#D4AF37'
                            textColor = '#78350F'
                          } else if (isSimples) {
                            pillBg = '#E0F2FE'
                            pillStroke = '#7DD3FC'
                            textColor = '#0369A1'
                          } else if (isReal) {
                            pillBg = '#F8FAFC'
                            pillStroke = '#94A3B8'
                            textColor = '#0F172A'
                          }

                          // Largura dinâmica estimada baseada no comprimento do texto
                          const pillWidth = Math.max(76, texto.length * 6.5 + 14)

                          return (
                            <g transform={`translate(${x},${y})`}>
                              <rect
                                x={-pillWidth / 2}
                                y={6}
                                width={pillWidth}
                                height={22}
                                rx={11}
                                fill={pillBg}
                                stroke={pillStroke}
                                strokeWidth={1}
                              />
                              <text
                                x={0}
                                y={21}
                                textAnchor="middle"
                                fill={textColor}
                                fontSize={10.5}
                                fontWeight={600}
                                fontFamily="inherit"
                              >
                                {texto}
                              </text>
                            </g>
                          )
                        }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: any, _name: any, item: any) => [
                          `${formatarMoeda(Number(val))} (${item?.payload?.aliquota ? formatarPorcentagem(item.payload.aliquota) : ''})`,
                          'Carga Efetiva',
                        ]}
                        contentStyle={{
                          backgroundColor: '#07132B',
                          borderColor: '#D4AF37',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px',
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

                {/* Legenda do Gráfico 1: Coluna única vertical com marcador colorido, nome, carga, alíquota e ano do cálculo */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                  {dadosGraficoBarras.map((entry) => {
                    const rotuloAnoLegenda =
                      anoSimulacaoSelecionado === 'atual'
                        ? 'Ano atual'
                        : String(anoSimulacaoSelecionado)

                    return (
                      <div
                        key={entry.regime}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Marcador colorido pequeno (quadradinho) com a mesma cor da barra no gráfico */}
                          <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ backgroundColor: entry.fill }}
                            aria-hidden="true"
                          />
                          <span className="font-bold text-slate-800 text-xs" title={entry.regime}>
                            {entry.regime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                          <span className="font-extrabold text-[#07132B]">
                            {formatarMoeda(entry.carga)}
                            <span className="text-[11px] font-normal text-slate-500 ml-0.5">
                              /{periodoDashboard === 'mensal' ? 'mês' : 'ano'}
                            </span>
                          </span>
                          <span className="text-slate-400 select-none">·</span>
                          <span className="font-semibold text-slate-700">
                            {formatarPorcentagem(entry.aliquota)}
                          </span>
                          <span className="text-slate-400 select-none">·</span>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold">
                            Ano: {rotuloAnoLegenda}
                          </span>
                        </div>
                      </div>
                    )
                  })}
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
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                      Gráfico 3: Comparação da Apropriação de Créditos por Categoria (
                      {periodoDashboard === 'mensal' ? 'Mensal' : 'Anual'})
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Créditos gerados no antigo regime vs créditos ampliados no IVA Dual (
                      {isAliquotaZeroCreditos
                        ? '0,00% — Regime de Alíquota Zero'
                        : formatarPorcentagem(aliqRefCreditos)}
                      ) • Valores em {periodoDashboard === 'mensal' ? 'R$/mês' : 'R$/ano'}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Total Antigo: {formatarMoeda(totalCreditosGrafico3.antigo)}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Total Novo: {formatarMoeda(totalCreditosGrafico3.novo)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Pizza com Raio Otimizado e Margens Aumentadas */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-2">
                      Distribuição de Créditos Novos (Top 5 Despesas)
                    </h5>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                          <Pie
                            data={dadosPizzaCreditos}
                            dataKey="novo"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={68}
                            paddingAngle={3}
                            isAnimationActive={false}
                          >
                            {dadosPizzaCreditos.map((entry, index) => (
                              <Cell
                                key={`cell-pie-${index}`}
                                fill={CORES_PIZZA[index % CORES_PIZZA.length]}
                                stroke="#ffffff"
                                strokeWidth={2}
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
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[11px] text-slate-500 text-center font-medium">
                      Total de Créditos Novos ({periodoDashboard === 'mensal' ? 'mês' : 'ano'}):{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatarMoeda(
                          dadosPizzaCreditos.reduce((acc, curr) => acc + curr.novo, 0),
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* LEGENDA LATERAL LEGÍVEL: Nome da categoria, valor em R$ e percentual */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Legenda de Categorias & Ganho de Créditos
                      </h5>
                      <span className="text-[11px] font-mono text-slate-400">
                        Visão {periodoDashboard === 'mensal' ? 'Mensal' : 'Anual'}
                      </span>
                    </div>

                    {/* Lista da Legenda com Nome, Valor R$, Percentual e barra de progresso */}
                    <div className="space-y-2.5">
                      {(() => {
                        const somaNovos =
                          dadosPizzaCreditos.reduce((acc, curr) => acc + curr.novo, 0) || 1
                        return dadosPizzaCreditos.map((cat, idx) => {
                          const ganho = cat.novo - cat.antigo
                          const cor = CORES_PIZZA[idx % CORES_PIZZA.length]
                          const percentual = ((cat.novo / somaNovos) * 100).toFixed(1)

                          return (
                            <div
                              key={cat.name}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-3.5 h-3.5 rounded-md shrink-0 border border-black/10"
                                    style={{ backgroundColor: cor }}
                                  />
                                  <span
                                    className="font-bold text-slate-800 truncate"
                                    title={cat.name}
                                  >
                                    {cat.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                                  <span className="font-bold text-[#07132B]">
                                    {formatarMoeda(cat.novo)}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                                    {percentual}%
                                  </span>
                                  <span
                                    className={`font-bold text-[11px] ${
                                      ganho >= 0 ? 'text-emerald-700' : 'text-red-600'
                                    }`}
                                  >
                                    {ganho >= 0
                                      ? `+${formatarMoeda(ganho)}`
                                      : `−${formatarMoeda(Math.abs(ganho))}`}
                                  </span>
                                </div>
                              </div>

                              {/* Comparativo visual: Antigo x Novo */}
                              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden flex">
                                <div
                                  className="bg-slate-400 h-full"
                                  style={{ width: `${(cat.antigo / (cat.novo || 1)) * 100}%` }}
                                  title={`Crédito antigo: ${formatarMoeda(cat.antigo)}`}
                                />
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{
                                    width: `${(Math.max(0, ganho) / (cat.novo || 1)) * 100}%`,
                                  }}
                                  title={`Ganho com reforma: +${formatarMoeda(Math.max(0, ganho))}`}
                                />
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
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

            {/* NOTA ORIENTATIVA NO RODAPÉ DO QUADRO DE RESULTADOS DO DASHBOARD */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200">
              <AvisoOrientativo variante="curta" tema="claro" />
            </div>
          </Card>

          {/* QUADRO DO ASSISTENTE DE ANÁLISE — CALCULADORA IBS/CBS (AGENTE NATIVO SKIP CLOUD) */}
          {/* Posicionado ao final da página do Dashboard — após Conclusão Analítica e Split Payment, como última seção */}
          <QuadroAssistenteAnalise abertoInicial={false} />
        </>
      )}

      {/* BARRA DE AÇÕES DA SIMULAÇÃO (DUPLICAÇÃO DOS BOTÕES IMPORTAR FATURAMENTO, EXPORTAR DADOS, SALVAR E BAIXAR PDF) */}
      {/* No Dashboard Executivo: duplicação no fim + barra fixa (sticky no rodapé) em telas pequenas para acompanhar a rolagem */}
      <BarraAcoesSimulacao
        onSalvar={onSalvarSimulacao ?? (() => setModalSalvarAberto(true))}
        onBaixarPdf={onBaixarPdf ?? handleAbrirModalPdfDashboard}
        onExportarDados={handleAbrirExportarDados}
        onImportarFaturamento={onImportarFaturamento}
        gerandoPdf={gerandoPdfProp ?? gerandoPdf}
        stickyMobile={true}
      />

      {/* PAINEL PRÓXIMOS PASSOS (ORIENTAÇÃO DO NOVO USUÁRIO) */}
      {onNavegarModulo && (
        <PainelProximosPassosCalculadora moduloAtual="modulo6" onNavegarModulo={onNavegarModulo} />
      )}

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

      {/* Modal Exportar Dados (Planilha CSV/Excel + Relatório Técnico PDF) */}
      <ModalExportarDadosSimulacao
        open={modalExportarDadosAberto}
        onOpenChange={setModalExportarDadosAberto}
        dadosSimulacao={{
          nomeSimulacao: 'Simulação Executiva - Dashboard',
          empresa: clienteAtivo?.nome,
          cnpj: clienteAtivo?.cnpj_cpf,
          parametros: obterSnapshotParametros(),
          resultados: obterSnapshotResultados(),
        }}
      />

      {/* Modal Gerar Relatório Técnico em PDF */}
      <ModalGerarPdf
        open={modalGerarPdfAberto}
        onOpenChange={setModalGerarPdfAberto}
        titulo="Emitir Relatório Executivo em PDF"
        descricao="Preencha os dados do Responsável Técnico para inclusão formal no cabeçalho e parecer do dossiê."
        modo={temComparativoDisponivel ? 'escolha' : 'individual'}
        quantidadeSimulacoesComparar={simulacoesComparar.length}
        onConfirmar={handleConfirmarPdf}
        gerando={gerandoPdf}
      />

      {/* Modal de Confirmação de Limpeza do Dashboard */}
      <ModalLimparDashboard
        open={modalLimparAberto}
        onOpenChange={setModalLimparAberto}
        onConfirmar={() => {
          limparDashboard()
          toast({
            title: 'Dashboard limpo!',
            description:
              'Todos os parâmetros e dados de simulação foram redefinidos para o estado inicial.',
          })
        }}
        titulo="Limpar Dashboard IBS/CBS"
        descricao="Isso apagará todos os dados de entrada e resultados da simulação da Calculadora IBS/CBS. Deseja continuar?"
        avisoDestaque="Faturamento, compras, despesas, enquadramentos e dados da empresa serão zerados, retornando o painel ao estado 'Sem Análise Realizada'."
      />
    </div>
  )
}
