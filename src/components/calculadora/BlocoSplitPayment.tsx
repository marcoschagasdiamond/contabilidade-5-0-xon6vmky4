import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  Coins,
  ArrowRight,
  TrendingDown,
  Clock,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react'

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
}

export function BlocoSplitPayment({
  resultadoSplitPayment,
  taxaMensalCapitalGiro,
  setTaxaMensalCapitalGiro,
  diasAntecipacaoSplit,
  setDiasAntecipacaoSplit,
  regimeAtualNome,
}: BlocoSplitPaymentProps) {
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
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
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
              {formatarMoeda(custoCapitalAnual)}
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
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                1. Sistema Atual ({regimeAtualNome})
              </span>
              <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Dia 20 do mês seguinte
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-slate-800">
              {formatarMoeda(recolhimentoAtualMensal)}
              <span className="text-xs text-slate-500 font-normal">/mês</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              A empresa recebe 100% do dinheiro do cliente e guarda o valor do imposto em caixa por
              até 30 a 50 dias antes de recolher a guia.
            </p>
          </div>

          {/* Retenção Split Payment (IBS/CBS) */}
          <div className="p-4 rounded-xl border border-[#D4AF37]/50 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 uppercase tracking-wide">
                2. Novo Sistema (Split Payment)
              </span>
              <span className="text-[10px] font-bold bg-[#D4AF37] text-[#07132B] px-2 py-0.5 rounded">
                No ato do pagamento
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-[#07132B]">
              {formatarMoeda(retencaoMensalNota)}
              <span className="text-xs text-slate-600 font-normal">/mês</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-snug">
              O banco/adquirente retém o imposto na liquidação da fatura. A empresa só recebe em
              conta o valor líquido da nota fiscal.
            </p>
          </div>

          {/* Diferença e Custo Financeiro */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-950 uppercase tracking-wide">
                3. Custo de Capital da Antecipação
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                {taxaMensalCapitalGiro}% a.m.
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-rose-700">
              {formatarMoeda(custoCapitalMensal)}
              <span className="text-xs text-rose-500 font-normal">/mês</span>
            </p>
            <p className="text-[11px] text-rose-800 leading-snug">
              Custo de oportunidade do capital de giro adiantado (
              <strong className="font-mono">{formatarMoeda(custoCapitalAnual)}</strong> por ano a
              menos rendendo ou juros adicionais).
            </p>
          </div>
        </div>

        {/* Controles Editáveis de Simulação Financeira */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#D4AF37]" />
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
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-950">
              O que o Split Payment Significa para o Bolso da Sua Empresa (Sem Juridiquês)
            </span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed">{explicacaoSimples}</p>
          <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
              <span>
                <strong>Como se preparar:</strong> revisar fluxo de caixa projetado, pois a empresa
                precisará de um colchão de capital de giro maior no primeiro mês de implantação.
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
