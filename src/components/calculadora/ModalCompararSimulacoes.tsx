import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { Scale, Trophy, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react'

interface ModalCompararSimulacoesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  simulacoes: SimulacaoCalculadora[]
  onCarregarSimulacao: (simulacao: SimulacaoCalculadora) => void
}

export function ModalCompararSimulacoes({
  open,
  onOpenChange,
  simulacoes,
  onCarregarSimulacao,
}: ModalCompararSimulacoesProps) {
  if (simulacoes.length < 2) return null

  // Identifica o cenário mais vantajoso (maior economia anual ou menor imposto efetivo)
  const menorImpostoTotal = Math.min(
    ...simulacoes.map(
      (s) =>
        s.resultados.resultadoComparativo[
          s.resultados.resultadoDashboard.regimeRecomendado === 'Lucro Real'
            ? 'lucroReal'
            : s.resultados.resultadoDashboard.regimeRecomendado === 'Lucro Presumido'
              ? 'lucroPresumido'
              : s.resultados.resultadoDashboard.regimeRecomendado === 'Simples Nacional'
                ? 'simplesNacional'
                : 'ibsCbs'
        ]?.totalEfetivo || 999999999,
    ),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#07132B]">
            <div className="w-9 h-9 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#07132B]">
                Comparativo Lado a Lado de Cenários
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Análise direta entre {simulacoes.length} simulações selecionadas (parâmetros vs.
                resultados tributários).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-3 space-y-6">
          {/* TABELA COMPARATIVA DE CABEÇALHOS E RESULTADOS EXECUTIVOS */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#07132B] text-white">
                  <th className="p-3 w-44 font-semibold text-[#D4AF37]">Métrica / Parâmetro</th>
                  {simulacoes.map((sim, idx) => (
                    <th key={sim.id} className="p-3 border-l border-slate-700 min-w-[200px]">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-white truncate block">{sim.nome}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-800 text-slate-300 border-slate-600 shrink-0"
                        >
                          Cenário #{idx + 1}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                        {sim.empresa || 'Empresa Geral'} •{' '}
                        {new Date(sim.created).toLocaleDateString('pt-BR')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {/* 1. SEÇÃO DE RESULTADOS & RECOMENDAÇÃO */}
                <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <td colSpan={simulacoes.length + 1} className="px-3 py-2 uppercase tracking-wide">
                    🏆 Diagnóstico & Carga Recomendada
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Regime Recomendado
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <strong className="text-emerald-700 font-bold">
                          {sim.resultados.resultadoDashboard.regimeRecomendado}
                        </strong>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Alíquota Efetiva Nova
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100 font-mono">
                      <span className="font-bold text-[#07132B] text-sm">
                        {sim.resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        (Antes: {sim.resultados.resultadoDashboard.aliquotaEfetivaAtual.toFixed(2)}
                        %)
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Economia Anual Projetada
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-sm">
                        <TrendingDown className="w-4 h-4" />
                        {formatarMoeda(sim.resultados.resultadoDashboard.economiaAnualProjetada)}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {formatarMoeda(sim.resultados.resultadoDashboard.economiaMensalProjetada)}
                        /mês
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 2. SEÇÃO DE CARGA POR REGIME */}
                <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <td colSpan={simulacoes.length + 1} className="px-3 py-2 uppercase tracking-wide">
                    📊 Comparativo por Regime (Mês)
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Simples Nacional
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100 font-mono">
                      <span className="block font-semibold text-slate-800">
                        {formatarMoeda(
                          sim.resultados.resultadoComparativo.simplesNacional.totalEfetivo,
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Alíq.{' '}
                        {sim.resultados.resultadoComparativo.simplesNacional.aliquotaEfetiva.toFixed(
                          2,
                        )}
                        %
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Lucro Presumido
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100 font-mono">
                      <span className="block font-semibold text-slate-800">
                        {formatarMoeda(
                          sim.resultados.resultadoComparativo.lucroPresumido.totalEfetivo,
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Alíq.{' '}
                        {sim.resultados.resultadoComparativo.lucroPresumido.aliquotaEfetiva.toFixed(
                          2,
                        )}
                        %
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">Lucro Real</td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100 font-mono">
                      <span className="block font-semibold text-slate-800">
                        {formatarMoeda(sim.resultados.resultadoComparativo.lucroReal.totalEfetivo)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Alíq.{' '}
                        {sim.resultados.resultadoComparativo.lucroReal.aliquotaEfetiva.toFixed(2)}%
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    IBS / CBS (Reforma)
                  </td>
                  {simulacoes.map((sim) => (
                    <td
                      key={sim.id}
                      className="p-3 border-l border-slate-100 font-mono bg-emerald-50/30"
                    >
                      <span className="block font-bold text-emerald-800">
                        {formatarMoeda(sim.resultados.resultadoComparativo.ibsCbs.totalEfetivo)}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Alíq.{' '}
                        {sim.resultados.resultadoComparativo.ibsCbs.aliquotaEfetiva.toFixed(2)}%
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 3. SEÇÃO DE PARÂMETROS OPERACIONAIS */}
                <tr className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <td colSpan={simulacoes.length + 1} className="px-3 py-2 uppercase tracking-wide">
                    ⚙️ Parâmetros Operacionais de Entrada
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Faturamento Mensal
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      {formatarMoeda(sim.parametros.faturamentoMensal)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Fase da Transição (LC 214)
                  </td>
                  {simulacoes.map((sim) => (
                    <td
                      key={sim.id}
                      className="p-3 border-l border-slate-100 font-mono font-medium"
                    >
                      {sim.parametros.config?.anoTransicao === 'atual' ||
                      sim.parametros.anoTransicao === 'atual'
                        ? 'Ano atual (sistema atual)'
                        : sim.parametros.config?.anoTransicao || sim.parametros.anoTransicao
                          ? `Ano ${sim.parametros.config?.anoTransicao || sim.parametros.anoTransicao}`
                          : '2033 (Pleno)'}
                      <span className="text-[10px] text-slate-500 block">
                        CBS: {sim.parametros.config?.cbsPadrao ?? 8.8}% / IBS:{' '}
                        {sim.parametros.config?.ibsPadrao ?? 17.7}%
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Ramo / Subatividade
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100 capitalize">
                      {sim.parametros.tipoAtividade === 'agronegocio'
                        ? 'Agronegócio (Legado)'
                        : sim.parametros.tipoAtividade === 'construcao_civil'
                          ? 'Construção Civil (Legado)'
                          : sim.parametros.tipoAtividade === 'locacao_bens'
                            ? 'Locação de Bens (Legado)'
                            : sim.parametros.tipoAtividade === 'food_service'
                              ? 'Bares / Food (Legado)'
                              : sim.parametros.tipoAtividade}
                      <span className="text-[10px] text-slate-500 block">
                        UF: {sim.parametros.ufOrigem || 'SP'}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Compras (% Vendas)
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      {sim.parametros.percentualComprasVendasComparativo}% (
                      {formatarMoeda(
                        (sim.parametros.faturamentoMensal *
                          sim.parametros.percentualComprasVendasComparativo) /
                          100,
                      )}
                      )
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Folha de Pagamento
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      {formatarMoeda(sim.parametros.folhaPagamentoMensal)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">
                    Margem / Créditos
                  </td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      Margem {sim.parametros.margemLucroEstimada}% | Créditos:{' '}
                      {formatarMoeda(sim.parametros.despesasComCreditosMensais)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">Ação</td>
                  {simulacoes.map((sim) => (
                    <td key={sim.id} className="p-3 border-l border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onCarregarSimulacao(sim)
                          onOpenChange(false)
                        }}
                        className="w-full text-xs bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] flex items-center justify-center gap-1.5"
                      >
                        Carregar na Tela
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
