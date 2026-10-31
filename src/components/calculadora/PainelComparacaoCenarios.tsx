import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { ItemSimulacaoUnificado } from '@/services/dashboardSimulacoes'
import {
  extrairDadosCenario,
  baixarCsvComparacaoCenarios,
  type CenarioComparadoExtraido,
} from '@/lib/exportacaoComparacaoCenarios'
import { gerarRelatorioComparativoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PainelComparacaoCenariosProps {
  itensSelecionados: ItemSimulacaoUnificado[]
  onLimparSelecao: () => void
  onRemoverItem: (id: string) => void
  onAbrirSimulacao?: (item: ItemSimulacaoUnificado) => void
}

function formatarMoeda(val?: number): string {
  if (typeof val !== 'number' || isNaN(val)) return 'R$ 0,00'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

// Paleta Diamond Group para as linhas de cada cenário no gráfico
const CORES_CENARIOS = [
  '#D4AF37', // Dourado Diamond
  '#2563EB', // Azul Safira
  '#059669', // Esmeralda
  '#DC2626', // Rubi / Coral
]

export function PainelComparacaoCenarios({
  itensSelecionados,
  onLimparSelecao,
  onRemoverItem,
  onAbrirSimulacao,
}: PainelComparacaoCenariosProps) {
  const { toast } = useToast()
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Extrai dados estruturados de cada cenário selecionado
  const cenarios = useMemo<CenarioComparadoExtraido[]>(() => {
    return itensSelecionados.map(extrairDadosCenario)
  }, [itensSelecionados])

  // Identifica o melhor cenário (menor carga anual projetada no IBS/CBS entre os da Calculadora, ou maior economia)
  const idMelhorCenario = useMemo<string | null>(() => {
    if (cenarios.length === 0) return null
    const calcCenarios = cenarios.filter((c) => c.tipo === 'calculadora')
    if (calcCenarios.length > 0) {
      const ordenados = [...calcCenarios].sort(
        (a, b) => a.impostoProjetadoAnual - b.impostoProjetadoAnual,
      )
      return ordenados[0].id
    }
    const ordenados = [...cenarios].sort((a, b) => b.economiaAnual - a.economiaAnual)
    return ordenados[0].id
  }, [cenarios])

  const melhorCenario = useMemo(() => {
    return cenarios.find((c) => c.id === idMelhorCenario) || null
  }, [cenarios, idMelhorCenario])

  // Monta os pontos para o gráfico sobreposto (uma linha por cenário, anos de 'atual' e 2026 a 2033)
  const dadosGraficoSobreposto = useMemo(() => {
    const anos: { chave: string; label: string }[] = [
      { chave: 'atual', label: 'Atual' },
      { chave: '2026', label: '2026' },
      { chave: '2027', label: '2027' },
      { chave: '2028', label: '2028' },
      { chave: '2029', label: '2029' },
      { chave: '2030', label: '2030' },
      { chave: '2031', label: '2031' },
      { chave: '2032', label: '2032' },
      { chave: '2033', label: '2033' },
    ]

    return anos.map(({ chave, label }) => {
      const ponto: Record<string, any> = { anoLabel: label, anoChave: chave }
      cenarios.forEach((c) => {
        if (c.tipo === 'calculadora') {
          ponto[c.id] = Math.round(c.evolucaoPorAno[chave] || 0)
        }
      })
      return ponto
    })
  }, [cenarios])

  // Verifica se há ao menos um cenário da calculadora com evolução
  const temEvolucaoGrafico = useMemo(() => {
    return cenarios.some(
      (c) => c.tipo === 'calculadora' && Object.keys(c.evolucaoPorAno).length > 0,
    )
  }, [cenarios])

  // Exportação CSV
  const handleExportarCsv = () => {
    try {
      baixarCsvComparacaoCenarios(cenarios)
      toast({
        title: 'Planilha exportada com sucesso',
        description: 'O arquivo CSV comparativo foi baixado com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao exportar CSV comparativo:', err)
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar a planilha de comparação.',
        variant: 'destructive',
      })
    }
  }

  // Exportação PDF
  const handleExportarPdf = () => {
    try {
      setGerandoPdf(true)
      // O gerador de PDF existente espera objetos SimulacaoCalculadora
      const calcItens = itensSelecionados
        .filter((i) => i.tipo === 'calculadora' && i.rawCalculadora)
        .map((i) => i.rawCalculadora!)

      if (calcItens.length < 2) {
        // Se temos menos de 2 simulações da calculadora pura, avisa que o PDF é voltado para a Calculadora
        // e exporta a planilha CSV completa
        toast({
          title: 'Exportação em Planilha recomendada',
          description:
            'O dossiê PDF executivo detalhado requer ao menos 2 simulações completas da Calculadora IBS/CBS. Baixando planilha CSV.',
        })
        handleExportarCsv()
        return
      }

      gerarRelatorioComparativoPDF({
        simulacoes: calcItens,
        clienteNome: melhorCenario?.empresa || 'Empresa Comparada',
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
      })

      toast({
        title: 'Dossiê PDF gerado com sucesso',
        description: 'O download do relatório comparativo foi iniciado.',
      })
    } catch (err) {
      console.error('Erro ao gerar PDF comparativo:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Houve uma falha ao compilar o PDF comparativo.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de contexto da comparação */}
      <div className="bg-[#07132B] text-white p-5 sm:p-6 rounded-2xl border border-[#D4AF37]/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase mb-2">
              COMPARAÇÃO LADO A LADO ATIVA
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
              Comparativo de {cenarios.length} Cenários Salvos
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal">
              Análise comparativa direta entre as simulações selecionadas. Avalie carga no sistema
              atual, projeção IBS/CBS e a evolução ano a ano do período de transição 2026–2033.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold"
              onClick={handleExportarCsv}
            >
              Exportar Planilha (CSV)
            </Button>
            <Button
              size="sm"
              className="text-xs font-bold bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B]"
              onClick={handleExportarPdf}
              disabled={gerandoPdf}
            >
              {gerandoPdf ? 'Gerando Dossiê...' : 'Exportar Dossiê (PDF)'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-300 hover:text-white hover:bg-white/10"
              onClick={onLimparSelecao}
            >
              Fechar Comparação
            </Button>
          </div>
        </div>

        {/* Chips dos cenários selecionados */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Cenários:</span>
          {cenarios.map((c, idx) => {
            const cor = CORES_CENARIOS[idx % CORES_CENARIOS.length]
            const isMelhor = c.id === idMelhorCenario
            return (
              <div
                key={c.id}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs text-white transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cor }}
                />
                <span className="font-semibold truncate max-w-[160px]">{c.nome}</span>
                {isMelhor && (
                  <span className="bg-[#D4AF37] text-[#07132B] font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                    MELHOR
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoverItem(c.id)}
                  className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-sm leading-none"
                  title="Remover da comparação"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Destaque do Melhor Cenário (Menor Carga Projetada) */}
      {melhorCenario && (
        <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-base shrink-0">
                  ★
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider bg-[#07132B] px-2.5 py-0.5 rounded-full">
                      RECOMENDAÇÃO TÉCNICA • MELHOR CENÁRIO
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] border-amber-300 text-amber-900"
                    >
                      Menor Carga Projetada
                    </Badge>
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-heading font-extrabold text-[#07132B] mt-1">
                    {melhorCenario.nome}
                  </CardTitle>
                </div>
              </div>

              {melhorCenario.tipo === 'calculadora' && (
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                    Carga Anual IBS/CBS (2033)
                  </span>
                  <span className="text-2xl font-heading font-black text-emerald-700">
                    {formatarMoeda(melhorCenario.impostoProjetadoAnual)}
                  </span>
                </div>
              )}
            </div>
            <CardDescription className="text-xs text-slate-600 mt-2">
              Empresa: <strong className="text-slate-900">{melhorCenario.empresa}</strong> • Regime:{' '}
              <strong className="text-slate-900">{melhorCenario.regime}</strong>
              {melhorCenario.aliquotaEfetiva !== undefined && (
                <>
                  {' '}
                  • Alíquota Efetiva Nova:{' '}
                  <strong className="text-[#07132B]">
                    {melhorCenario.aliquotaEfetiva.toFixed(2)}%
                  </strong>
                </>
              )}
              {melhorCenario.economiaAnual > 0 && (
                <>
                  {' '}
                  • Economia Anual:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {formatarMoeda(melhorCenario.economiaAnual)}
                  </strong>
                </>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Gráfico Sobreposto da Evolução 2026–2033 */}
      {temEvolucaoGrafico && (
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-heading font-bold text-[#07132B]">
                  Evolução Comparativa da Carga Anual na Transição (2026 a 2033)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Linhas sobrepostas mostrando a curva de imposto de cada cenário selecionado ao
                  longo de cada fase constitucional.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {cenarios.filter((c) => c.tipo === 'calculadora').length} curvas sobrepostas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosGraficoSobreposto}
                  margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="anoLabel" stroke="#64748B" fontSize={12} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const cenarioEncontrado = cenarios.find((c) => c.id === name)
                      const rotulo = cenarioEncontrado?.nome || name
                      return [formatarMoeda(Number(value)), rotulo]
                    }}
                    labelFormatter={(label) => `Período: ${label}`}
                    contentStyle={{
                      backgroundColor: '#07132B',
                      borderColor: '#D4AF37',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const c = cenarios.find((item) => item.id === value)
                      return (
                        <span className="text-xs font-semibold text-slate-700">
                          {c ? c.nome : value}
                        </span>
                      )
                    }}
                  />
                  {cenarios.map((c, idx) => {
                    if (c.tipo !== 'calculadora') return null
                    const cor = CORES_CENARIOS[idx % CORES_CENARIOS.length]
                    const isMelhor = c.id === idMelhorCenario
                    return (
                      <Line
                        key={c.id}
                        type="monotone"
                        dataKey={c.id}
                        name={c.id}
                        stroke={cor}
                        strokeWidth={isMelhor ? 3.5 : 2}
                        strokeDasharray={isMelhor ? undefined : '3 3'}
                        dot={{ r: isMelhor ? 5 : 4, fill: cor }}
                        activeDot={{ r: 8 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Comparativa Lado a Lado */}
      <Card className="border-slate-200 shadow-md bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base sm:text-lg font-heading font-bold text-[#07132B]">
            Matriz Comparativa de Resultados Lado a Lado
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Compare diretamente impostos anuais, economia, alíquotas e o impacto no modelo IBS/CBS.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#07132B] text-white">
                  <th className="p-3 w-52 font-semibold text-[#D4AF37]">Métrica / Informação</th>
                  {cenarios.map((c, idx) => {
                    const isMelhor = c.id === idMelhorCenario
                    const cor = CORES_CENARIOS[idx % CORES_CENARIOS.length]
                    return (
                      <th
                        key={c.id}
                        className={`p-3 border-l border-slate-700 min-w-[210px] ${
                          isMelhor ? 'bg-[#102445]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cor }}
                            />
                            <span className="font-bold text-white truncate block">{c.nome}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-slate-800 text-slate-300 border-slate-600 shrink-0"
                          >
                            #{idx + 1}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate">
                          {c.empresa || 'Empresa Geral'}
                        </div>
                        {isMelhor && (
                          <div className="mt-1.5">
                            <span className="bg-[#D4AF37] text-[#07132B] text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block">
                              ★ MELHOR CENÁRIO
                            </span>
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {/* 1. SEÇÃO DE CARGA E RESULTADOS */}
                <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <td colSpan={cenarios.length + 1} className="px-3 py-2 uppercase tracking-wide">
                    Resultados Principais & Carga Anual
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Imposto Sistema Atual (Anual)
                  </td>
                  {cenarios.map((c) => (
                    <td
                      key={c.id}
                      className="p-3 border-l border-slate-100 font-mono text-slate-700"
                    >
                      {c.tipo === 'calculadora' ? formatarMoeda(c.impostoAtualAnual) : '-'}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Imposto Projetado IBS/CBS (2033 Anual)
                  </td>
                  {cenarios.map((c) => {
                    const isMelhor = c.id === idMelhorCenario
                    return (
                      <td
                        key={c.id}
                        className={`p-3 border-l border-slate-100 font-mono font-bold ${
                          isMelhor ? 'bg-amber-50/60 text-emerald-800' : 'text-[#07132B]'
                        }`}
                      >
                        {c.tipo === 'calculadora' ? (
                          <>
                            <span className="text-sm block">
                              {formatarMoeda(c.impostoProjetadoAnual)}
                            </span>
                            {isMelhor && (
                              <span className="text-[10px] text-emerald-700 block font-normal">
                                (Menor carga entre os cenários)
                              </span>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    )
                  })}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Diferença Anual (IBS/CBS - Atual)
                  </td>
                  {cenarios.map((c) => {
                    if (c.tipo !== 'calculadora') {
                      return (
                        <td key={c.id} className="p-3 border-l border-slate-100 text-slate-400">
                          -
                        </td>
                      )
                    }
                    const dif = c.impostoProjetadoAnual - c.impostoAtualAnual
                    const isReducao = dif <= 0
                    return (
                      <td key={c.id} className="p-3 border-l border-slate-100 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isReducao
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {dif > 0 ? '+' : ''}
                          {formatarMoeda(dif)}
                        </span>
                      </td>
                    )
                  })}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Economia Anual Projetada / Créditos
                  </td>
                  {cenarios.map((c) => (
                    <td
                      key={c.id}
                      className="p-3 border-l border-slate-100 font-mono font-extrabold text-blue-900 text-sm"
                    >
                      {formatarMoeda(c.economiaAnual)}
                      {c.tipo === 'recuperador' && (
                        <span className="text-[10px] text-slate-500 block font-normal">
                          (Levantamento de Créditos)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Alíquota Efetiva Nova (%)
                  </td>
                  {cenarios.map((c) => (
                    <td
                      key={c.id}
                      className="p-3 border-l border-slate-100 font-mono font-semibold"
                    >
                      {c.aliquotaEfetiva !== undefined ? `${c.aliquotaEfetiva.toFixed(2)}%` : '-'}
                    </td>
                  ))}
                </tr>

                {/* 2. SEÇÃO DE PARÂMETROS OPERACIONAIS */}
                <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <td colSpan={cenarios.length + 1} className="px-3 py-2 uppercase tracking-wide">
                    Parâmetros Operacionais da Empresa
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">Regime Fiscal</td>
                  {cenarios.map((c) => (
                    <td key={c.id} className="p-3 border-l border-slate-100">
                      <Badge variant="outline" className="font-semibold text-slate-700">
                        {c.regime}
                      </Badge>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Faturamento Mensal
                  </td>
                  {cenarios.map((c) => (
                    <td
                      key={c.id}
                      className="p-3 border-l border-slate-100 font-mono text-slate-700"
                    >
                      {c.faturamentoMensal ? formatarMoeda(c.faturamentoMensal) : '-'}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    CNPJ Cadastrado
                  </td>
                  {cenarios.map((c) => (
                    <td
                      key={c.id}
                      className="p-3 border-l border-slate-100 text-slate-600 font-mono"
                    >
                      {c.cnpj || '-'}
                    </td>
                  ))}
                </tr>

                {/* 3. EVOLUÇÃO ANO A ANO (2026–2033) */}
                {temEvolucaoGrafico && (
                  <>
                    <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                      <td
                        colSpan={cenarios.length + 1}
                        className="px-3 py-2 uppercase tracking-wide"
                      >
                        Evolução Ano a Ano da Transição (R$ / ano)
                      </td>
                    </tr>

                    {[
                      { ano: 'atual', label: 'Sistema Atual' },
                      { ano: '2026', label: '2026 (Teste)' },
                      { ano: '2027', label: '2027 (CBS)' },
                      { ano: '2028', label: '2028' },
                      { ano: '2029', label: '2029' },
                      { ano: '2030', label: '2030' },
                      { ano: '2031', label: '2031' },
                      { ano: '2032', label: '2032' },
                      { ano: '2033', label: '2033 (Pleno)' },
                    ].map(({ ano, label }) => (
                      <tr key={ano}>
                        <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">{label}</td>
                        {cenarios.map((c) => {
                          const val = c.evolucaoPorAno[ano]
                          return (
                            <td
                              key={c.id}
                              className="p-3 border-l border-slate-100 font-mono text-slate-700"
                            >
                              {val !== undefined ? formatarMoeda(val) : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {/* AÇÕES */}
                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">Ação</td>
                  {cenarios.map((c) => {
                    const original = itensSelecionados.find((i) => i.id === c.id)
                    return (
                      <td key={c.id} className="p-3 border-l border-slate-100">
                        {original && onAbrirSimulacao && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs border-slate-300 font-semibold"
                            onClick={() => onAbrirSimulacao(original)}
                          >
                            Abrir Simulação
                          </Button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
