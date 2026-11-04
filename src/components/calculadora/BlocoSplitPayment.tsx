import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TEXTO_FASE_TESTE_2026,
  isAno2026OuAtual,
  AnoTransicaoIbsCbs,
} from '@/types/calculadoraIbsCbs'
import type { PerfilRetencaoSplit } from '@/types/dadosEmpresa'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'

interface BlocoSplitPaymentProps {
  resultadoSplitPayment: {
    retencaoMensalNota: number
    recolhimentoAtualMensal: number
    diferencaFluxoCaixa: number
    taxaMensalCapital: number
    diasAntecipacao: number
    custoCapitalMensal: number
    custoCapitalAnual: number
    explicacaoSimples: string
  }
  taxaMensalCapitalGiro: number
  setTaxaMensalCapitalGiro: (v: number) => void
  diasAntecipacaoSplit: number
  setDiasAntecipacaoSplit: (v: number) => void
  regimeAtualNome: string
  onRegimeAtualChange?: (regime: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') => void
  origemPropagada?: boolean
  anoTransicao?: AnoTransicaoIbsCbs
  perfilRetencaoSplit?: PerfilRetencaoSplit
  setPerfilRetencaoSplit?: (val: PerfilRetencaoSplit) => void
  percentualRetencaoSplit?: number
  setPercentualRetencaoSplit?: (val: number) => void
  onRestaurarDadosIniciais?: () => void
}

export function BlocoSplitPayment({
  resultadoSplitPayment,
  taxaMensalCapitalGiro,
  setTaxaMensalCapitalGiro,
  diasAntecipacaoSplit,
  setDiasAntecipacaoSplit,
  regimeAtualNome,
  onRegimeAtualChange,
  origemPropagada,
  anoTransicao: anoTransicaoProp,
  perfilRetencaoSplit: perfilRetencaoSplitProp,
  setPerfilRetencaoSplit: setPerfilRetencaoSplitProp,
  percentualRetencaoSplit: percentualRetencaoSplitProp,
  setPercentualRetencaoSplit: setPercentualRetencaoSplitProp,
  onRestaurarDadosIniciais,
}: BlocoSplitPaymentProps) {
  let ctxCalculadora: ReturnType<typeof useCalculadoraIbsCbs> | undefined
  try {
    ctxCalculadora = useCalculadoraIbsCbs()
  } catch {
    ctxCalculadora = undefined
  }

  const perfilRetencaoEfetivo =
    perfilRetencaoSplitProp ?? ctxCalculadora?.perfilRetencaoSplit ?? 'nao'
  const setPerfilRetencaoEfetivo =
    setPerfilRetencaoSplitProp ?? ctxCalculadora?.setPerfilRetencaoSplit
  const pctRetencaoEfetivo =
    percentualRetencaoSplitProp ?? ctxCalculadora?.percentualRetencaoSplit ?? 0
  const setPctRetencaoEfetivo =
    setPercentualRetencaoSplitProp ?? ctxCalculadora?.setPercentualRetencaoSplit
  const handleRestaurar =
    onRestaurarDadosIniciais ??
    (ctxCalculadora ? () => ctxCalculadora.restaurarDadosEmpresaNoModulo('split') : undefined)
  // Se anoTransicao não foi passado explicitamente via prop, consulta o contexto
  let anoDoContexto: AnoTransicaoIbsCbs | undefined
  try {
    const ctx = useCalculadoraIbsCbs()
    anoDoContexto = ctx.anoTransicaoDashboard ?? ctx.config.anoTransicao
  } catch {
    anoDoContexto = undefined
  }

  const anoEfetivo = anoTransicaoProp ?? anoDoContexto ?? 2033
  const ehFaseTeste2026 = String(anoEfetivo) === '2026'
  const ehAnoAtual = anoEfetivo === 'atual'
  const ehTesteOuAtual = ehFaseTeste2026 || ehAnoAtual
  const {
    retencaoMensalNota,
    recolhimentoAtualMensal,
    diferencaFluxoCaixa,
    custoCapitalMensal,
    custoCapitalAnual,
    explicacaoSimples,
  } = resultadoSplitPayment

  return (
    <Card className="border border-[#D4AF37]/40 shadow-lg overflow-hidden bg-white">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-[#07132B] via-[#0E1F3D] to-[#07132B] text-white p-5 sm:p-6 border-b border-[#D4AF37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-wider">
              Etapa 4 • Liquidação Financeira
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
              Impacto do Split Payment no Fluxo de Caixa
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              No IBS/CBS o tributo é retido na fonte no momento em que o cliente paga a nota fiscal,
              antecipando a saída de caixa em comparação ao vencimento da guia única no dia 20 do
              mês seguinte.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
              Custo de Capital da Antecipação
            </span>
            <span className="text-xl font-mono font-extrabold text-[#D4AF37]">
              {ehTesteOuAtual ? 'R$ 0,00' : formatarMoeda(custoCapitalAnual)}
              <span className="text-xs font-normal text-slate-300 ml-1">/ano</span>
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Comparativo de Desembolso Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Caixa Sistema Atual */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs gap-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  1. Sistema Atual
                </span>
                {origemPropagada && <BadgeOrigemPropagada origem="modulo1" />}
              </div>
              <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Dia 20 do mês seguinte
              </span>
            </div>

            {onRegimeAtualChange ? (
              <div className="space-y-1">
                <Select
                  value={
                    regimeAtualNome === 'Lucro Real' ||
                    regimeAtualNome === 'Lucro Presumido' ||
                    regimeAtualNome === 'Simples Nacional'
                      ? regimeAtualNome
                      : 'Lucro Presumido'
                  }
                  onValueChange={(val: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') =>
                    onRegimeAtualChange(val)
                  }
                >
                  <SelectTrigger className="h-8 text-xs font-semibold bg-white border-slate-300">
                    <SelectValue placeholder="Regime Atual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lucro Real" className="text-xs">
                      Lucro Real
                    </SelectItem>
                    <SelectItem value="Lucro Presumido" className="text-xs">
                      Lucro Presumido
                    </SelectItem>
                    <SelectItem value="Simples Nacional" className="text-xs">
                      Simples Nacional
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-600">
                Regime: <strong className="text-slate-800">{regimeAtualNome}</strong>
              </div>
            )}

            <p className="text-2xl font-mono font-bold text-slate-800">
              {formatarMoeda(recolhimentoAtualMensal)}
              <span className="text-xs text-slate-500 font-normal">/mês</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              A empresa recebe 100% do dinheiro do cliente e guarda o valor do imposto em caixa por
              até 30 a 50 dias antes de recolher a guia ({regimeAtualNome}).
            </p>
          </div>

          {/* Retenção Split Payment (IBS/CBS) */}
          <div className="p-4 rounded-xl border border-[#D4AF37]/50 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 uppercase tracking-wide">
                2. Novo Sistema (Split Payment)
              </span>
              <span className="text-[10px] font-bold bg-[#D4AF37] text-[#07132B] px-2 py-0.5 rounded">
                {ehTesteOuAtual ? 'Fase de Teste (2026)' : 'No ato do pagamento'}
              </span>
            </div>
            {ehFaseTeste2026 ? (
              <>
                <p className="text-xl font-mono font-bold text-amber-900">
                  R$ 0,00
                  <span className="text-xs text-slate-600 font-normal ml-1">/mês</span>
                </p>
                <div className="p-2 rounded bg-amber-100/70 border border-amber-300/80 text-[11px] font-semibold text-amber-950 leading-snug">
                  {TEXTO_FASE_TESTE_2026}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Em 2026, a apuração de teste da CBS (0,9%) e IBS (0,1%) não gera retenção no ato
                  do pagamento: sem impacto sobre o fluxo de recebimento.
                </p>
              </>
            ) : ehAnoAtual ? (
              <>
                <p className="text-xl font-mono font-bold text-slate-700">
                  R$ 0,00
                  <span className="text-xs text-slate-500 font-normal ml-1">/mês</span>
                </p>
                <div className="p-2 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 leading-snug">
                  Sistema Atual pré-reforma (split payment não aplicável)
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  No ano atual, o split payment não existe na legislação vigente.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-mono font-bold text-[#07132B]">
                  {formatarMoeda(retencaoMensalNota)}
                  <span className="text-xs text-slate-600 font-normal">/mês</span>
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  O banco/adquirente retém o imposto na liquidação da fatura. A empresa só recebe em
                  conta o valor líquido da nota fiscal.
                </p>
              </>
            )}
          </div>

          {/* Diferença e Custo Financeiro */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-950 uppercase tracking-wide">
                3. Custo de Capital da Antecipação
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                {ehTesteOuAtual ? 'Isento em 2026' : `${taxaMensalCapitalGiro}% a.m.`}
              </span>
            </div>
            {ehFaseTeste2026 ? (
              <>
                <p className="text-xl font-mono font-bold text-emerald-700">
                  R$ 0,00
                  <span className="text-xs text-emerald-600 font-normal ml-1">/mês</span>
                </p>
                <div className="p-2 rounded bg-emerald-100/70 border border-emerald-300/80 text-[11px] font-semibold text-emerald-950 leading-snug">
                  {TEXTO_FASE_TESTE_2026}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Sem custo financeiro adicional em 2026: ensaio operacional sem antecipação de
                  caixa do contribuinte.
                </p>
              </>
            ) : ehAnoAtual ? (
              <>
                <p className="text-xl font-mono font-bold text-slate-600">
                  R$ 0,00
                  <span className="text-xs text-slate-500 font-normal ml-1">/mês</span>
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Sem custo financeiro de antecipação no sistema vigente.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-mono font-bold text-rose-700">
                  {formatarMoeda(custoCapitalMensal)}
                  <span className="text-xs text-rose-500 font-normal">/mês</span>
                </p>
                <p className="text-[11px] text-rose-800 leading-snug">
                  Custo de oportunidade do capital de giro adiantado (
                  <strong className="font-mono">{formatarMoeda(custoCapitalAnual)}</strong> por ano
                  a menos rendendo ou juros adicionais).
                </p>
              </>
            )}
          </div>
        </div>

        {/* Controles Editáveis de Simulação Financeira */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider flex items-center gap-1.5">
              Calibração Financeira da Sua Empresa (Parâmetros Editáveis)
            </span>
            <span className="text-[11px] text-slate-500">
              Simule com a taxa do seu capital de giro ou CDI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Taxa Mensal de Remuneração / Custo de Capital */}
            <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <Label htmlFor="taxaCapital" className="text-xs font-bold text-slate-800">
                  Taxa Mensal de Remuneração do Capital (% a.m.)
                </Label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#07132B] text-[#D4AF37]">
                  {taxaMensalCapitalGiro.toFixed(2)}% a.m. (~
                  {(taxaMensalCapitalGiro * 12).toFixed(1)}% a.a.)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[taxaMensalCapitalGiro]}
                  min={0.2}
                  max={3.0}
                  step={0.05}
                  onValueChange={(val) => setTaxaMensalCapitalGiro(val[0])}
                  className="flex-1 py-1"
                />
                <div className="relative w-24 shrink-0">
                  <Input
                    id="taxaCapital"
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={taxaMensalCapitalGiro}
                    onChange={(e) => setTaxaMensalCapitalGiro(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold pr-7"
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Padrão 1,00% a.m. (aproximado ao CDI / Selic líquida ou empréstimo de capital de
                giro).
              </span>
            </div>

            {/* Dias Médios de Antecipação */}
            <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <Label htmlFor="diasAntecipacao" className="text-xs font-bold text-slate-800">
                  Prazo Médio de Antecipação do Desembolso (Dias)
                </Label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {diasAntecipacaoSplit} dias
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[diasAntecipacaoSplit]}
                  min={10}
                  max={60}
                  step={5}
                  onValueChange={(val) => setDiasAntecipacaoSplit(val[0])}
                  className="flex-1 py-1"
                />
                <div className="relative w-24 shrink-0">
                  <Input
                    id="diasAntecipacao"
                    type="number"
                    step="1"
                    min="1"
                    max="90"
                    value={diasAntecipacaoSplit}
                    onChange={(e) => setDiasAntecipacaoSplit(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold pr-9"
                  />
                  <span className="absolute right-2 top-2 text-[11px] text-slate-400 font-bold">
                    dias
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Intervalo entre a emissão/recebimento da nota e o vencimento regular da guia no dia
                20.
              </span>
            </div>
          </div>
        </div>

        {/* Bloco em Linguagem Simples "Sem Juridiquês" Conforme Especificação */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-950">
              O que o Split Payment Significa para o Bolso da Sua Empresa (Sem Juridiquês)
            </span>
          </div>
          {ehFaseTeste2026 && (
            <div className="p-2.5 rounded-lg bg-amber-100/90 border border-amber-300 text-xs font-semibold text-amber-950">
              {TEXTO_FASE_TESTE_2026}
            </div>
          )}
          <p className="text-xs text-amber-950 leading-relaxed">{explicacaoSimples}</p>
          <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
              <span>
                <strong>Como se preparar:</strong> revisar fluxo de caixa projetado, pois a empresa
                precisará de um colchão de capital de giro maior no primeiro mês de implantação
                plena (a partir de 2027).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
              <span>
                <strong>Vantagem colateral:</strong> elimina o risco de inadimplência fiscal e
                multas por atraso de guia, já que o imposto é pago na liquidação bancária.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
