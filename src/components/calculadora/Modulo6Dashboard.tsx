import React, { useState } from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { TipoAtividade } from '@/types/calculadoraIbsCbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { ModalSalvarSimulacao } from '@/components/calculadora/ModalSalvarSimulacao'
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
  Award,
  Filter,
  ArrowRight,
  ShieldAlert,
  BookmarkPlus,
  FileDown,
} from 'lucide-react'

const CORES_PIZZA = ['#07132B', '#D4AF37', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6']

export default function Modulo6Dashboard() {
  const {
    faturamentoMensal,
    setFaturamentoMensal,
    tipoAtividade,
    setTipoAtividade,
    percentualComprasVendasComparativo,
    setPercentualComprasVendasComparativo,
    periodoDashboard,
    setPeriodoDashboard,
    regimeAtualFiltro,
    setRegimeAtualFiltro,
    resultadoDashboard,
    resultadoComparativo,
    resultadoCreditos,
    resultadoTransicao,
    despesasCreditos,
    obterSnapshotParametros,
    obterSnapshotResultados,
  } = useCalculadoraIbsCbs()

  const { toast } = useToast()
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
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

  // 1. DADOS GRÁFICO 1: BARRAS - Comparativo dos 4 regimes
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
      regime: 'IBS / CBS (Novo)',
      carga: resultadoComparativo.ibsCbs.totalEfetivo * mult,
      aliquota: resultadoComparativo.ibsCbs.aliquotaEfetiva,
      fill: '#D4AF37',
    },
  ]

  // 2. DADOS GRÁFICO 2: LINHA - Evolução 2026-2033
  const dadosGraficoLinha = resultadoTransicao.map((item) => ({
    ano: String(item.ano),
    aliquota: item.aliquotaEfetivaTotal,
    imposto: item.impostoEstimado / (periodoDashboard === 'mensal' ? 12 : 1),
  }))

  // 3. DADOS GRÁFICO 3: PIZZA - Composição dos Créditos Antigos versus Novos
  // Agrupa as principais fontes de crédito da lista de despesas
  const dadosPizzaCreditos = despesasCreditos.slice(0, 5).map((item) => ({
    name: item.nome,
    antigo: (item.valorMensal * item.aliquotaAntiga) / 100,
    novo: (item.valorMensal * 26.5) / 100,
  }))

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro: Período */}
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
            </div>

            {/* Filtro: Setor */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 block mb-1.5">Setor</Label>
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
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Regime Atual */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Regime Atual da Empresa
              </Label>
              <Select
                value={regimeAtualFiltro}
                onValueChange={(val) =>
                  setRegimeAtualFiltro(val as 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional')
                }
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro: Faturamento */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Faturamento Mensal
              </Label>
              <Input
                type="text"
                value={faturamentoMensal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={handleFaturamentoChange}
                className="h-10 bg-white font-mono font-bold text-xs"
              />
            </div>

            {/* Filtro: % Compras */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 block mb-1.5">
                % Compras s/ Vendas
              </Label>
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
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Gráfico 2 em Linha: Evolução 2026-2033 */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                Gráfico 2: Evolução da Alíquota Efetiva (2026 a 2033)
              </CardTitle>
              <span className="text-xs text-slate-500 font-mono">Curva de Transição</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosGraficoLinha}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="ano" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Alíquota Efetiva']}
                    labelFormatter={(label) => `Ano ${label}`}
                    contentStyle={{
                      backgroundColor: '#07132B',
                      borderColor: '#D4AF37',
                      color: '#fff',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aliquota"
                    name="Alíquota Efetiva Total"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#07132B', stroke: '#D4AF37', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 3 em Pizza: Composição de Créditos Antigos vs Novos */}
        <Card className="border-slate-200 shadow-md lg:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-heading font-bold text-[#07132B]">
                  Gráfico 3: Comparação da Apropriação de Créditos por Categoria
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Créditos gerados no antigo regime vs créditos ampliados no IVA Dual (26,50%).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  Total Antigo: {formatarMoeda(resultadoCreditos.totalAntigo)}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Total Novo: {formatarMoeda(resultadoCreditos.totalNovo)}
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
            <Award className="w-4 h-4 text-[#D4AF37]" />
            Regime Recomendado:{' '}
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
                  IBS / CBS (Novo Sistema)
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-[#07132B]">
                  {formatarMoeda(resultadoComparativo.ibsCbs.totalEfetivo)}
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-emerald-800">
                  {formatarMoeda(resultadoComparativo.ibsCbs.creditos)}
                </td>
                <td className="px-6 py-4 text-center font-mono font-extrabold text-[#07132B]">
                  {formatarPorcentagem(resultadoComparativo.ibsCbs.aliquotaEfetiva)}
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
    </div>
  )
}
