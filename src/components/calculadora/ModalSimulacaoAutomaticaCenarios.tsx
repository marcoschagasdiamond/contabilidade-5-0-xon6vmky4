import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { ItemSimulacaoUnificado } from '@/services/dashboardSimulacoes'
import {
  gerarVariaveisCenariosAutomaticos,
  type VariacaoCenarioAutomatico,
} from '@/services/simulacaoAutomaticaCenarios'
import { salvarSimulacao } from '@/services/simulacoesCalculadora'

interface ModalSimulacaoAutomaticaCenariosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  simulacoesCalculadoraDisponiveis: ItemSimulacaoUnificado[]
  onSimulacaoSalva?: () => void
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(valor || 0)
}

export function ModalSimulacaoAutomaticaCenarios({
  open,
  onOpenChange,
  simulacoesCalculadoraDisponiveis,
  onSimulacaoSalva,
}: ModalSimulacaoAutomaticaCenariosProps) {
  const { toast } = useToast()

  // Seleção da simulação base
  const [baseSelecionadaId, setBaseSelecionadaId] = useState<string>('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)
  const [salvasIds, setSalvasIds] = useState<string[]>([])

  // Se nenhuma estiver selecionada e houver disponíveis, seleciona a primeira ao abrir
  const idAtivo = useMemo(() => {
    if (
      baseSelecionadaId &&
      simulacoesCalculadoraDisponiveis.some((s) => s.id === baseSelecionadaId)
    ) {
      return baseSelecionadaId
    }
    return simulacoesCalculadoraDisponiveis[0]?.id || ''
  }, [baseSelecionadaId, simulacoesCalculadoraDisponiveis])

  const simulacaoBase = useMemo(() => {
    return simulacoesCalculadoraDisponiveis.find((s) => s.id === idAtivo) || null
  }, [idAtivo, simulacoesCalculadoraDisponiveis])

  // GERAÇÃO AUTOMÁTICA DE ATÉ 8 CENÁRIOS A PARTIR DA BASE SELECIONADA
  const cenariosGerados = useMemo<VariacaoCenarioAutomatico[]>(() => {
    if (!simulacaoBase || !simulacaoBase.rawCalculadora) return []
    return gerarVariaveisCenariosAutomaticos(simulacaoBase.rawCalculadora)
  }, [simulacaoBase])

  // Salvar uma variação como simulação normal na coleção existente
  const handleSalvarVariacao = async (variacao: VariacaoCenarioAutomatico) => {
    if (!simulacaoBase) return
    setSalvandoId(variacao.id)

    try {
      const nomeFinal = `${simulacaoBase.nome} [Cenário: ${variacao.regimeTributario} · ${variacao.anoTransicao}]`
      const empresaFinal = simulacaoBase.empresa
      const cnpjFinal = simulacaoBase.cnpj
      const clienteIdFinal = simulacaoBase.cliente_id || null

      await salvarSimulacao({
        nome: nomeFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        clienteId: clienteIdFinal,
        userId: simulacaoBase.user_id || undefined,
        parametros: variacao.parametrosSnapshot,
        resultados: variacao.resultadosSnapshot,
      })

      setSalvasIds((prev) => [...prev, variacao.id])

      toast({
        title: 'Cenário salvo com sucesso',
        description: `O cenário "${variacao.titulo}" foi adicionado às simulações e já está disponível para visualização e comparação.`,
      })

      if (onSimulacaoSalva) {
        onSimulacaoSalva()
      }
    } catch (err) {
      console.error('Erro ao salvar variação:', err)
      toast({
        title: 'Erro ao salvar cenário',
        description: 'Não foi possível gravar a variação na base de simulações.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 text-slate-900 p-6 sm:p-8">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest text-[#D4AF37] bg-[#07132B] uppercase mb-1.5">
                AUTOMAÇÃO TRIBUTÁRIA · LC 214/2025
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold text-[#07132B]">
                Simulação Automática de Cenários
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                Gere e compare automaticamente até 8 variações estratégicas (regimes, alíquotas da
                LC 214 e anos da transição) a partir de uma simulação base, sem digitar nada.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {simulacoesCalculadoraDisponiveis.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-800">
              Nenhuma simulação da Calculadora IBS/CBS encontrada
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Para gerar variações automáticas, crie e salve previamente pelo menos uma simulação na
              Calculadora IBS/CBS com os dados fiscais da empresa.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                className="text-xs font-semibold"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Seletor de Simulação Base */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Simulação Base Selecionada
                </label>
                <p className="text-xs text-slate-500">
                  Os faturamentos, custos, ramos e despesas desta simulação servirão de base para as
                  projeções automáticas.
                </p>
              </div>

              <div className="w-full sm:w-80">
                <Select value={idAtivo} onValueChange={setBaseSelecionadaId}>
                  <SelectTrigger className="w-full h-10 text-xs bg-white border-slate-300 font-medium">
                    <SelectValue placeholder="Selecione a simulação base" />
                  </SelectTrigger>
                  <SelectContent>
                    {simulacoesCalculadoraDisponiveis.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <span className="font-bold text-slate-900">{item.nome}</span>
                        {item.empresa && (
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            ({item.empresa})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo da Base Escolhida */}
            {simulacaoBase && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-100/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Empresa / CNPJ:</span>
                  <strong className="text-slate-800 truncate block">
                    {simulacaoBase.empresa} {simulacaoBase.cnpj ? `· ${simulacaoBase.cnpj}` : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Faturamento Mensal:</span>
                  <strong className="text-slate-800 block">
                    {formatarMoeda(simulacaoBase.faturamentoMensal || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Regime Base:</span>
                  <strong className="text-slate-800 block">{simulacaoBase.regime}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cenários Automáticos:</span>
                  <strong className="text-[#07132B] block">
                    {cenariosGerados.length} variações calculadas
                  </strong>
                </div>
              </div>
            )}

            {/* Cabeçalho da Lista Ordenada */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#07132B]">
                  Cenários Ordenados por Economia Anual (Maior Otimização Primeiro)
                </h4>
                <p className="text-xs text-slate-500">
                  Cálculo realizado reutilizando rigorosamente as regras da Calculadora IBS/CBS e da
                  LC 214/2025.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-slate-700 bg-white">
                {cenariosGerados.length} variações
              </Badge>
            </div>

            {/* Grid dos Cenários Gerados */}
            <div className="space-y-3">
              {cenariosGerados.map((cenario, idx) => {
                const jaSalvo = salvasIds.includes(cenario.id)
                const isSalvando = salvandoId === cenario.id
                const isPositivo = cenario.economiaAnualEstimada > 0

                return (
                  <Card
                    key={cenario.id}
                    className={`transition-all border shadow-sm ${
                      cenario.recomendado
                        ? 'border-[#D4AF37] bg-amber-50/30 ring-1 ring-[#D4AF37]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Identificação e Descrição */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-[#07132B] text-[#D4AF37] text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            {cenario.recomendado && (
                              <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] text-[10px] font-extrabold uppercase tracking-wider">
                                Cenário Recomendado
                              </Badge>
                            )}

                            <Badge
                              variant="outline"
                              className="text-[11px] font-bold text-slate-800 bg-white"
                            >
                              {cenario.regimeTributario}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="text-[11px] text-slate-600 bg-white"
                            >
                              {cenario.anoTransicaoRotulo}
                            </Badge>

                            <span className="text-[11px] text-slate-500 font-medium">
                              Preset: {cenario.presetSetorNome}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base text-[#07132B]">
                            {cenario.titulo}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {cenario.descricao}
                          </p>
                        </div>

                        {/* Indicadores Numéricos */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                              Imposto Atual
                            </span>
                            <span className="font-mono text-xs sm:text-sm text-slate-600 font-semibold block">
                              {formatarMoeda(cenario.impostoAtualAnual)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({cenario.aliquotaEfetivaAtual.toFixed(2)}% efetivo)
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                              Imposto Projetado
                            </span>
                            <span className="font-mono text-xs sm:text-sm text-[#07132B] font-bold block">
                              {formatarMoeda(cenario.impostoProjetadoAnual)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({cenario.aliquotaEfetivaProjetada.toFixed(2)}% efetivo)
                            </span>
                          </div>

                          <div className="text-left sm:text-right min-w-[130px]">
                            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                              Economia Anual Estimada
                            </span>
                            <span
                              className={`font-mono text-base sm:text-lg font-extrabold block ${
                                isPositivo ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isPositivo ? '+' : ''}
                              {formatarMoeda(cenario.economiaAnualEstimada)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {isPositivo ? 'Redução de carga' : 'Acréscimo de carga'}
                            </span>
                          </div>

                          {/* Ação: Salvar como simulação (sem ícone) */}
                          <div className="w-full sm:w-auto">
                            <Button
                              size="sm"
                              className={`w-full sm:w-auto text-xs font-bold transition-colors ${
                                jaSalvo
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-[#07132B] text-white hover:bg-[#152e59]'
                              }`}
                              onClick={() => handleSalvarVariacao(cenario)}
                              disabled={isSalvando || jaSalvo}
                            >
                              {isSalvando
                                ? 'Salvando...'
                                : jaSalvo
                                  ? 'Salvo na Lista'
                                  : 'Salvar como simulação'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Rodapé explicativo */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                As variações salvas aparecem instantaneamente na lista principal de simulações do
                Dashboard e podem ser selecionadas para comparação detalhada lado a lado.
              </p>
              <Button
                variant="outline"
                className="text-xs font-semibold shrink-0"
                onClick={() => onOpenChange(false)}
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
