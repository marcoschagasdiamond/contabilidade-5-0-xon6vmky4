import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import {
  carregarDadosDashboardSimulacoes,
  type ResumoDashboardSimulacoes,
  type ItemSimulacaoUnificado,
  type TipoItemSimulacao,
} from '@/services/dashboardSimulacoes'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { PainelComparacaoCenarios } from '@/components/calculadora/PainelComparacaoCenarios'
import { ModalSimulacaoAutomaticaCenarios } from '@/components/calculadora/ModalSimulacaoAutomaticaCenarios'

function formatarMoeda(val?: number): string {
  if (typeof val !== 'number' || isNaN(val)) return 'R$ 0,00'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

function formatarData(dataStr?: string): string {
  if (!dataStr) return '-'
  try {
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dataStr
  }
}

export default function DashboardSimulacoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<ResumoDashboardSimulacoes | null>(null)
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null)

  // Filtros da lista
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoItemSimulacao>('todos')
  const [filtroRegime, setFiltroRegime] = useState<string>('todos')
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos' | 'maior_valor'>('recentes')
  const [tabGrafico, setTabGrafico] = useState<'evolucao' | 'diferenca'>('evolucao')

  // Seleção para Comparação de Cenários (2 a 4 simulações)
  const [idsSelecionadosComparacao, setIdsSelecionadosComparacao] = useState<string[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<'geral' | 'comparacao'>('geral')
  const [modalSimularCenariosAberto, setModalSimularCenariosAberto] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await carregarDadosDashboardSimulacoes()
      setDados(res)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard de simulações:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar suas simulações salvas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Lista de regimes únicos para filtro
  const regimesDisponiveis = useMemo(() => {
    if (!dados) return []
    const setR = new Set<string>()
    dados.itens.forEach((item) => {
      if (item.regime) setR.add(item.regime)
    })
    return Array.from(setR)
  }, [dados])

  // Itens filtrados
  const itensFiltrados = useMemo(() => {
    if (!dados) return []
    return dados.itens
      .filter((item) => {
        if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false
        if (filtroRegime !== 'todos' && item.regime !== filtroRegime) return false
        if (busca.trim()) {
          const termo = busca.toLowerCase()
          const matchNome = item.nome?.toLowerCase().includes(termo)
          const matchEmpresa = item.empresa?.toLowerCase().includes(termo)
          const matchCnpj = item.cnpj?.toLowerCase().includes(termo)
          const matchRegime = item.regime?.toLowerCase().includes(termo)
          if (!matchNome && !matchEmpresa && !matchCnpj && !matchRegime) return false
        }
        return true
      })
      .sort((a, b) => {
        if (ordenacao === 'maior_valor') {
          return (b.economiaAnualOuTotal || 0) - (a.economiaAnualOuTotal || 0)
        }
        const timeA = new Date(a.updated || a.created).getTime()
        const timeB = new Date(b.updated || b.created).getTime()
        if (ordenacao === 'antigos') return timeA - timeB
        return timeB - timeA
      })
  }, [dados, busca, filtroTipo, filtroRegime, ordenacao])

  // Itens selecionados para comparação
  const itensSelecionadosParaComparar = useMemo(() => {
    if (!dados) return []
    return dados.itens.filter((i) => idsSelecionadosComparacao.includes(i.id))
  }, [dados, idsSelecionadosComparacao])

  // Alternar seleção de um item na comparação
  const handleToggleSelecao = (itemId: string) => {
    setIdsSelecionadosComparacao((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId)
      }
      if (prev.length >= 4) {
        toast({
          title: 'Limite de seleção atingido',
          description: 'Você pode comparar no máximo 4 simulações simultaneamente.',
          variant: 'destructive',
        })
        return prev
      }
      return [...prev, itemId]
    })
  }

  const handleRemoverItemComparacao = (itemId: string) => {
    setIdsSelecionadosComparacao((prev) => prev.filter((id) => id !== itemId))
  }

  const handleLimparComparacao = () => {
    setIdsSelecionadosComparacao([])
    setModoVisualizacao('geral')
  }

  const handleVerComparacao = () => {
    if (idsSelecionadosComparacao.length < 2) {
      toast({
        title: 'Selecione ao menos 2 simulações',
        description: 'Marque entre 2 e 4 simulações na lista para comparar lado a lado.',
        variant: 'destructive',
      })
      return
    }
    setModoVisualizacao('comparacao')
    window.scrollTo({ top: 380, behavior: 'smooth' })
  }

  // Abertura da simulação
  const handleAbrirSimulacao = (item: ItemSimulacaoUnificado) => {
    if (item.tipo === 'calculadora') {
      navigate(`/calculadora-ibs-cbs?simulacao=${encodeURIComponent(item.id)}`)
    } else {
      navigate(`/recuperador-creditos?simulacao=${encodeURIComponent(item.id)}`)
    }
  }

  // Exportação rápida de PDF
  const handleBaixarPdf = (item: ItemSimulacaoUnificado) => {
    try {
      setGerandoPdfId(item.id)
      if (item.tipo === 'calculadora') {
        const raw = item.rawCalculadora
        if (!raw || !raw.parametros || !raw.resultados) {
          toast({
            title: 'Dados incompletos',
            description: 'Abra a simulação na Calculadora para recalcular e gerar o PDF completo.',
            variant: 'destructive',
          })
          return
        }
        gerarRelatorioSimulacaoPDF({
          parametros: raw.parametros,
          resultados: raw.resultados,
          nomeSimulacao: raw.nome || item.nome,
        })
        toast({
          title: 'PDF gerado com sucesso',
          description: 'O download do relatório executivo da simulação foi iniciado.',
        })
      } else {
        const raw = item.rawRecuperador
        if (!raw || !raw.parametros || !raw.resultados) {
          toast({
            title: 'Dados incompletos',
            description: 'Abra a simulação no Recuperador para visualizar e exportar o parecer.',
            variant: 'destructive',
          })
          return
        }
        gerarParecerRecuperadorPDF({
          nomeAnalise: raw.nome || item.nome,
          parametros: raw.parametros,
          resultados: raw.resultados,
          empresa: raw.empresa || item.empresa,
          cnpj: raw.cnpj || item.cnpj,
        })
        toast({
          title: 'Parecer gerado com sucesso',
          description: 'O download do relatório do Recuperador foi iniciado.',
        })
      }
    } catch (err) {
      console.error('Erro ao gerar PDF da simulação:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Houve uma falha ao compilar o PDF desta simulação.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdfId(null)
    }
  }

  // Dados do gráfico de transição formatados
  const dadosGraficoEvolucao = useMemo(() => {
    if (!dados || !dados.pontosTransicao) return []
    return dados.pontosTransicao.map((p) => ({
      anoLabel: p.anoLabel,
      impostoNovoMedio: Math.round(p.impostoNovoMedio),
      impostoAtualMedio: Math.round(p.impostoAtualMedio),
      diferencaMedia: Math.round(p.diferencaMedia),
      aliquotaTotalMedia: Number(p.aliquotaTotalMedia.toFixed(2)),
      amostras: p.amostras,
    }))
  }, [dados])

  // Dados comparativos por simulação individual da Calculadora (Diferença entre sistema atual e novo)
  const comparativoPorSimulacao = useMemo(() => {
    if (!dados) return []
    return dados.itens
      .filter((i) => i.tipo === 'calculadora' && i.rawCalculadora?.resultados)
      .slice(0, 10)
      .map((item) => {
        const raw = item.rawCalculadora!
        const dash = raw.resultados.resultadoDashboard
        const transicao = raw.resultados.resultadoTransicao || []
        const pontoPleno = transicao.find((t) => t.ano === 2033) || transicao[transicao.length - 1]
        const pontoAtual = transicao.find((t) => t.ano === 'atual')

        const impostoAtual = pontoAtual?.impostoEstimado || 0
        const impostoNovo =
          pontoPleno?.impostoEstimado ||
          (dash?.economiaAnualProjetada !== undefined
            ? impostoAtual - dash.economiaAnualProjetada
            : 0)
        const economia =
          dash?.economiaAnualProjetada !== undefined
            ? dash.economiaAnualProjetada
            : impostoAtual - impostoNovo

        return {
          id: item.id,
          nome: item.nome,
          empresa: item.empresa,
          regime: item.regime,
          impostoAtual,
          impostoNovo,
          diferenca: impostoNovo - impostoAtual,
          economia,
        }
      })
  }, [dados])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Cabeçalho Diamond */}
      <div className="relative bg-[#07132B] text-white pt-24 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#1A365D] blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#D4AF37] blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                CENTRAL DE INTELIGÊNCIA TRIBUTÁRIA
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
                Dashboard de Simulações
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Consolidação executiva de todas as simulações salvas da Calculadora IBS/CBS e do
                Recuperador de Créditos. Acompanhe a curva de transição 2026–2033, comparativo entre
                regimes e histórico detalhado.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap gap-2.5">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold"
                onClick={carregar}
                disabled={loading}
              >
                Atualizar Dados
              </Button>
              <Button
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs sm:text-sm shadow-md"
                onClick={() => setModalSimularCenariosAberto(true)}
              >
                Simular cenários
              </Button>
              {idsSelecionadosComparacao.length >= 2 && (
                <Button
                  variant="outline"
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 font-bold text-xs sm:text-sm shadow-sm"
                  onClick={handleVerComparacao}
                >
                  Comparar Cenários ({idsSelecionadosComparacao.length})
                </Button>
              )}
              <Link to="/calculadora-ibs-cbs">
                <Button className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm">
                  Nova Calculadora IBS/CBS
                </Button>
              </Link>
              <Link to="/recuperador-creditos">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm">
                  Novo Levantamento de Créditos
                </Button>
              </Link>
            </div>
          </div>

          {/* Badge de contexto de perfil */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#D4AF37]">Modo de visualização:</span>
              {dados?.isVisaoCarteira ? (
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-0.5 rounded-full font-medium border border-[#D4AF37]/30">
                  Visão Carteira de Clientes (Analista / Administrativo)
                  {dados.totalClientesCarteira !== undefined && dados.totalClientesCarteira > 0 && (
                    <span className="ml-1 text-white">
                      ({dados.totalClientesCarteira} clientes)
                    </span>
                  )}
                </span>
              ) : (
                <span className="bg-blue-900/40 text-blue-200 px-2.5 py-0.5 rounded-full font-medium border border-blue-500/30">
                  Visão Empresário (Simulações da sua empresa)
                </span>
              )}
            </div>
            <div className="text-slate-400">
              Usuário logado: <strong className="text-white">{user?.name || user?.email}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Barra Flutuante de Seleção para Comparação */}
        {idsSelecionadosComparacao.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#07132B] font-extrabold flex items-center justify-center text-sm shrink-0">
                {idsSelecionadosComparacao.length}
              </div>
              <div>
                <strong className="block text-sm text-white font-bold">
                  {idsSelecionadosComparacao.length === 1
                    ? '1 simulação selecionada para comparar'
                    : `${idsSelecionadosComparacao.length} simulações selecionadas (máximo 4)`}
                </strong>
                <span className="text-xs text-slate-300">
                  {idsSelecionadosComparacao.length < 2
                    ? 'Marque mais 1 a 3 simulações para habilitar a comparação lado a lado.'
                    : 'Pronto para ver o comparativo lado a lado, gráfico sobreposto e exportações.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold"
                onClick={handleLimparComparacao}
              >
                Limpar Seleção
              </Button>
              <Button
                size="sm"
                className="text-xs font-extrabold bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B]"
                disabled={idsSelecionadosComparacao.length < 2}
                onClick={handleVerComparacao}
              >
                {modoVisualizacao === 'comparacao'
                  ? 'Atualizar Painel Comparativo'
                  : 'Ver Comparação de Cenários'}
              </Button>
            </div>
          </div>
        )}

        {/* MODO COMPARAÇÃO DE CENÁRIOS ATIVO */}
        {modoVisualizacao === 'comparacao' && itensSelecionadosParaComparar.length >= 2 && (
          <div className="mb-10">
            <PainelComparacaoCenarios
              itensSelecionados={itensSelecionadosParaComparar}
              onLimparSelecao={() => setModoVisualizacao('geral')}
              onRemoverItem={handleRemoverItemComparacao}
              onAbrirSimulacao={handleAbrirSimulacao}
            />
          </div>
        )}

        {/* Cartões Resumo (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Total de Simulações
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold text-[#07132B]">
                {loading ? '...' : dados?.totalSimulacoes || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                <span>Calculadora IBS/CBS:</span>
                <strong className="text-slate-900">{dados?.totalCalculadora || 0}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Recuperador:</span>
                <strong className="text-slate-900">{dados?.totalRecuperador || 0}</strong>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Economia Anual Projetada
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-blue-900">
                {loading ? '...' : formatarMoeda(dados?.somaEconomiaCalculadoraAnual || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                Soma da otimização anual das simulações da Calculadora IBS/CBS
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Créditos Identificados
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-700">
                {loading ? '...' : formatarMoeda(dados?.somaCreditosRecuperador || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                Total integral corrigido apurado no Recuperador de Créditos
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Empresas Mapeadas
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold text-[#D4AF37]">
                {loading ? '...' : dados?.totalEmpresasUnicas || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                CNPJs e empresas com estudos salvos e auditáveis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bloco de Gráficos e Comparativo 2026–2033 */}
        <Card className="border-slate-200 shadow-md bg-white mb-8">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl font-heading font-bold text-[#07132B]">
                  Evolução da Carga Tributária na Transição (2026 a 2033)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                  Comparação consolidada entre o sistema tributário atual e o cronograma escalonado
                  da Reforma (EC 132/2023 e LC 214/2025), calculado com base nas simulações salvas.
                </CardDescription>
              </div>
              <Tabs
                value={tabGrafico}
                onValueChange={(v) => setTabGrafico(v as any)}
                className="w-auto"
              >
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="evolucao" className="text-xs">
                    Carga Anual (R$)
                  </TabsTrigger>
                  <TabsTrigger value="diferenca" className="text-xs">
                    Diferença (Novo - Atual)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {dadosGraficoEvolucao.length === 0 || dados?.totalCalculadora === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-base font-semibold text-slate-700">
                  Nenhuma simulação da Calculadora IBS/CBS salva ainda
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Faça uma simulação na Calculadora IBS/CBS e salve-a para visualizar a curva de
                  transição agregada 2026–2033 neste painel.
                </p>
                <Link to="/calculadora-ibs-cbs" className="mt-4 inline-block">
                  <Button size="sm" className="bg-[#07132B] hover:bg-[#102445] text-white text-xs">
                    Fazer Simulação na Calculadora
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {tabGrafico === 'evolucao' ? (
                      <LineChart
                        data={dadosGraficoEvolucao}
                        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="anoLabel" stroke="#64748B" fontSize={12} />
                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                          tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            formatarMoeda(Number(value)),
                            name === 'impostoNovoMedio'
                              ? 'Novo Sistema (IBS/CBS)'
                              : 'Sistema Atual',
                          ]}
                          labelFormatter={(label) => `Período: ${label}`}
                          contentStyle={{
                            backgroundColor: '#07132B',
                            borderColor: '#D4AF37',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="impostoAtualMedio"
                          name="Sistema Atual"
                          stroke="#64748B"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="impostoNovoMedio"
                          name="Novo Sistema (IBS/CBS)"
                          stroke="#D4AF37"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#D4AF37' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={dadosGraficoEvolucao.filter((p) => p.anoLabel !== 'Sistema Atual')}
                        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="anoLabel" stroke="#64748B" fontSize={12} />
                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                          tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: any) => [
                            `${Number(value) >= 0 ? '+' : ''}${formatarMoeda(Number(value))}`,
                            'Diferença (Novo - Atual)',
                          ]}
                          labelFormatter={(label) => `Ano ${label}`}
                          contentStyle={{
                            backgroundColor: '#07132B',
                            borderColor: '#D4AF37',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="diferencaMedia"
                          name="Diferença Média de Imposto"
                          fill="#1E3A8A"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Tabela de valores do cronograma de transição */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200">Ano da Transição</th>
                        <th className="p-2.5 border-b border-slate-200">Sistema Atual (Médio)</th>
                        <th className="p-2.5 border-b border-slate-200">Reforma IBS/CBS (Médio)</th>
                        <th className="p-2.5 border-b border-slate-200">Diferença de Imposto</th>
                        <th className="p-2.5 border-b border-slate-200">Alíquota Média Total</th>
                        <th className="p-2.5 border-b border-slate-200">Fase da Legislação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {dadosGraficoEvolucao.map((p, idx) => {
                        let fase = 'Transição escalonada'
                        if (p.anoLabel === 'Sistema Atual') fase = 'Regra tributária vigente'
                        else if (p.anoLabel === '2026') fase = 'Teste CBS 0,9% + IBS 0,1%'
                        else if (p.anoLabel === '2027') fase = 'Extinção PIS/COFINS, vigência CBS'
                        else if (p.anoLabel === '2028') fase = 'Ajuste de CBS e compensação'
                        else if (p.anoLabel === '2029') fase = 'Início redução ICMS/ISS (10%)'
                        else if (p.anoLabel === '2030') fase = 'Redução ICMS/ISS (20%)'
                        else if (p.anoLabel === '2031') fase = 'Redução ICMS/ISS (30%)'
                        else if (p.anoLabel === '2032') fase = 'Redução ICMS/ISS (40%)'
                        else if (p.anoLabel === '2033') fase = 'Vigência Plena IBS/CBS'

                        const dif = p.diferencaMedia
                        const isPos = dif > 0

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-bold text-slate-800">{p.anoLabel}</td>
                            <td className="p-2.5 font-mono text-slate-600">
                              {formatarMoeda(p.impostoAtualMedio)}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-[#07132B]">
                              {formatarMoeda(p.impostoNovoMedio)}
                            </td>
                            <td className="p-2.5 font-mono font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  isPos
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isPos ? '+' : ''}
                                {formatarMoeda(dif)}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-700">
                              {p.aliquotaTotalMedia > 0 ? `${p.aliquotaTotalMedia}%` : '-'}
                            </td>
                            <td className="p-2.5 text-slate-500">{fase}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quadro Comparativo entre Cenários / Regimes por Simulação */}
        {comparativoPorSimulacao.length > 0 && (
          <Card className="border-slate-200 shadow-md bg-white mb-8">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg sm:text-xl font-heading font-bold text-[#07132B]">
                Comparativo entre Sistema Atual e Novo por Simulação Salva
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                Análise direta do impacto financeiro entre o sistema atual e o novo modelo (IBS/CBS)
                em cada simulação cadastrada.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">Simulação / Empresa</th>
                      <th className="p-2.5 border-b border-slate-200">Regime Recomendado</th>
                      <th className="p-2.5 border-b border-slate-200">Imposto Sistema Atual</th>
                      <th className="p-2.5 border-b border-slate-200">Imposto IBS/CBS (2033)</th>
                      <th className="p-2.5 border-b border-slate-200">Diferença de Imposto</th>
                      <th className="p-2.5 border-b border-slate-200">Economia Anual Projetada</th>
                      <th className="p-2.5 border-b border-slate-200 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {comparativoPorSimulacao.map((item) => {
                      const itemUnificado = dados?.itens.find((i) => i.id === item.id)
                      const isMenor = item.economia > 0
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5">
                            <strong className="text-slate-900 block text-sm">{item.nome}</strong>
                            <span className="text-slate-500 text-[11px]">{item.empresa}</span>
                          </td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="font-semibold text-slate-700">
                              {item.regime}
                            </Badge>
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">
                            {formatarMoeda(item.impostoAtual)}
                          </td>
                          <td className="p-2.5 font-mono font-semibold text-[#07132B]">
                            {formatarMoeda(item.impostoNovo)}
                          </td>
                          <td className="p-2.5 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                item.diferenca <= 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {item.diferenca > 0 ? '+' : ''}
                              {formatarMoeda(item.diferenca)}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-extrabold text-blue-900">
                            {formatarMoeda(item.economia)}
                          </td>
                          <td className="p-2.5 text-right">
                            {itemUnificado && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-slate-300"
                                onClick={() => handleAbrirSimulacao(itemUnificado)}
                              >
                                Abrir Simulação
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista Filtrável de Simulações */}
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl font-heading font-bold text-[#07132B]">
                    Simulações Salvas
                  </CardTitle>
                  <Badge variant="outline" className="text-xs text-slate-600 font-normal">
                    {itensFiltrados.length} encontradas
                  </Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                  Marque o checkbox de 2 a 4 simulações para comparar lado a lado, ou gerencie e
                  baixe relatórios individuais.
                </CardDescription>
              </div>

              {/* Controles de Filtro */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Input
                  type="text"
                  placeholder="Buscar por nome, empresa ou CNPJ..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full sm:w-64 h-9 text-xs"
                />

                <Select
                  value={filtroTipo}
                  onValueChange={(v) => setFiltroTipo(v as 'todos' | TipoItemSimulacao)}
                >
                  <SelectTrigger className="w-40 h-9 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="calculadora">Calculadora IBS/CBS</SelectItem>
                    <SelectItem value="recuperador">Recuperador Créditos</SelectItem>
                  </SelectContent>
                </Select>

                {regimesDisponiveis.length > 0 && (
                  <Select value={filtroRegime} onValueChange={setFiltroRegime}>
                    <SelectTrigger className="w-44 h-9 text-xs">
                      <SelectValue placeholder="Regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Regimes</SelectItem>
                      {regimesDisponiveis.map((reg) => (
                        <SelectItem key={reg} value={reg}>
                          {reg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={ordenacao}
                  onValueChange={(v) => setOrdenacao(v as 'recentes' | 'antigos' | 'maior_valor')}
                >
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais Recentes</SelectItem>
                    <SelectItem value="antigos">Mais Antigos</SelectItem>
                    <SelectItem value="maior_valor">Maior Impacto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm font-semibold">Carregando simulações...</p>
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-base font-semibold text-slate-700">
                  Nenhuma simulação encontrada com os filtros atuais
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Altere os termos de busca ou crie uma nova simulação na Calculadora ou
                  Recuperador.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setBusca('')
                      setFiltroTipo('todos')
                      setFiltroRegime('todos')
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {itensFiltrados.map((item) => {
                  const isCalculadora = item.tipo === 'calculadora'
                  const isGerando = gerandoPdfId === item.id
                  const isSelecionado = idsSelecionadosComparacao.includes(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm ${
                        isSelecionado
                          ? 'border-[#D4AF37] bg-amber-50/40 ring-1 ring-[#D4AF37]'
                          : 'border-slate-200 hover:border-[#D4AF37]/50 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="pt-1 sm:pt-0">
                          <Checkbox
                            checked={isSelecionado}
                            onCheckedChange={() => handleToggleSelecao(item.id)}
                            className="border-slate-400 data-[state=checked]:bg-[#07132B] data-[state=checked]:border-[#07132B]"
                            title="Marcar para comparar lado a lado (2 a 4 simulações)"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {isSelecionado && (
                              <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] text-[10px] font-extrabold">
                                Selecionado p/ Comparar
                              </Badge>
                            )}
                            {isCalculadora ? (
                              <Badge className="bg-[#07132B] text-white hover:bg-[#07132B] text-[11px] font-bold">
                                Calculadora IBS/CBS
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-700 text-white hover:bg-emerald-700 text-[11px] font-bold">
                                Recuperador de Créditos
                              </Badge>
                            )}

                            <Badge variant="outline" className="text-slate-600 text-[11px]">
                              {item.regime}
                            </Badge>

                            {item.origem === 'nuvem' ? (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                Nuvem
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono">
                                Local
                              </span>
                            )}

                            <span className="text-xs text-slate-400">
                              Salvo em: {formatarData(item.created)}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base sm:text-lg text-[#07132B] truncate">
                            {item.nome}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            <span>
                              Empresa: <strong className="text-slate-700">{item.empresa}</strong>
                            </span>
                            {item.cnpj && (
                              <span>
                                CNPJ: <strong className="text-slate-700">{item.cnpj}</strong>
                              </span>
                            )}
                            {isCalculadora && item.faturamentoMensal && (
                              <span>
                                Faturamento Mensal:{' '}
                                <strong className="text-slate-700">
                                  {formatarMoeda(item.faturamentoMensal)}
                                </strong>
                              </span>
                            )}
                            {isCalculadora && item.aliquotaEfetiva !== undefined && (
                              <span>
                                Alíquota Efetiva:{' '}
                                <strong className="text-slate-700">
                                  {item.aliquotaEfetiva.toFixed(2)}%
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Valores e Ações */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                            {isCalculadora ? 'Economia Anual Projetada' : 'Créditos Identificados'}
                          </span>
                          <span
                            className={`font-mono text-xl sm:text-2xl font-extrabold ${
                              isCalculadora ? 'text-blue-900' : 'text-emerald-700'
                            }`}
                          >
                            {formatarMoeda(item.economiaAnualOuTotal)}
                          </span>
                          {!isCalculadora &&
                            item.totalRecuperavelConservador !== undefined &&
                            item.totalRecuperavelConservador > 0 && (
                              <span className="text-[11px] text-slate-500 block">
                                Conservador: {formatarMoeda(item.totalRecuperavelConservador)}
                              </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-9 font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                            onClick={() => handleBaixarPdf(item)}
                            disabled={isGerando}
                          >
                            {isGerando ? 'Gerando...' : 'Baixar PDF'}
                          </Button>

                          <Button
                            size="sm"
                            className="text-xs h-9 font-bold bg-[#07132B] hover:bg-[#152e59] text-white"
                            onClick={() => handleAbrirSimulacao(item)}
                          >
                            Abrir Simulação
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Simulação Automática de Cenários */}
      <ModalSimulacaoAutomaticaCenarios
        open={modalSimularCenariosAberto}
        onOpenChange={setModalSimularCenariosAberto}
        simulacoesCalculadoraDisponiveis={
          dados?.itens.filter((i) => i.tipo === 'calculadora' && i.rawCalculadora?.parametros) || []
        }
        onSimulacaoSalva={carregar}
      />
    </div>
  )
}
