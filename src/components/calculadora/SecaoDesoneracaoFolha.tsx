import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingDown, TrendingUp, Scale, Calendar } from 'lucide-react'
import { formatarMoeda } from '@/lib/calculadoraUtils'

export interface CalculoFolhaProps {
  cppSobreFolhaAnual: number
  cppSobreFolhaMensal: number
  cprbSobreReceitaAnual: number
  cprbSobreReceitaMensal: number
  economiaAnual: number
  economiaMensal: number
  percentualReducao: number
  fatorRPct: number
  vantajoso: boolean
}

interface SecaoDesoneracaoFolhaProps {
  desoneracaoFolhaAtiva: boolean
  setDesoneracaoFolhaAtiva: (ativa: boolean) => void
  folhaPagamentoMensal: number
  setFolhaPagamentoMensal: (val: number) => void
  folhaAnualEfetiva: number
  aliquotaCprb: number
  setAliquotaCprb: (val: number) => void
  receitaBrutaAnual: number
  calculoFolha: CalculoFolhaProps
}

export function SecaoDesoneracaoFolha({
  desoneracaoFolhaAtiva,
  setDesoneracaoFolhaAtiva,
  folhaPagamentoMensal,
  setFolhaPagamentoMensal,
  folhaAnualEfetiva,
  aliquotaCprb,
  setAliquotaCprb,
  receitaBrutaAnual,
  calculoFolha,
}: SecaoDesoneracaoFolhaProps) {
  return (
    <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#07132B]" />
              <CardTitle className="text-lg font-bold text-[#07132B]">
                1. Desoneração da Folha de Pagamento (CPRB - Lei 12.546/2011)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Substituição da Contribuição Previdenciária Patronal (CPP de 20% sobre salários) por
              alíquota sobre a receita bruta (1% a 4,5% conforme setor).
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <Label
              htmlFor="toggle-desoneracao-folha"
              className="text-xs sm:text-sm font-bold text-[#07132B] cursor-pointer"
            >
              {desoneracaoFolhaAtiva ? 'Desoneração ATIVA' : 'Ativar Desoneração'}
            </Label>
            <Switch
              id="toggle-desoneracao-folha"
              checked={desoneracaoFolhaAtiva}
              onCheckedChange={setDesoneracaoFolhaAtiva}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Inputs de parametrização da Folha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
          <div className="space-y-2">
            <Label htmlFor="folhaMensalDesoneracao" className="text-xs font-bold text-[#07132B]">
              Folha de Pagamento Mensal (R$)
            </Label>
            <Input
              id="folhaMensalDesoneracao"
              type="number"
              min="0"
              step="1000"
              value={folhaPagamentoMensal}
              onChange={(e) => setFolhaPagamentoMensal(Math.max(0, Number(e.target.value)))}
              className="font-mono font-bold text-sm bg-white"
            />
            <span className="text-[11px] text-slate-500 block">
              Salários e pró-labore ({formatarMoeda(folhaAnualEfetiva)}/ano)
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="aliqCprbInput" className="text-xs font-bold text-[#07132B]">
                Alíquota CPRB sobre Receita Bruta (%)
              </Label>
              <span className="text-xs font-mono font-bold text-[#07132B] bg-slate-200 px-2 py-0.5 rounded">
                {aliquotaCprb}%
              </span>
            </div>
            <Input
              id="aliqCprbInput"
              type="number"
              min="1.0"
              max="4.5"
              step="0.5"
              value={aliquotaCprb}
              onChange={(e) => setAliquotaCprb(Math.max(1, Math.min(4.5, Number(e.target.value))))}
              className="font-mono font-bold text-sm bg-white"
            />
            <span className="text-[11px] text-slate-500 block">
              Default 4,5% (TI / Serviços de Segurança da Informação)
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#07132B]">Receita Bruta Anual Base</Label>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
              {formatarMoeda(receitaBrutaAnual)}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Conforme faturamento parametrizado na Calculadora
            </span>
          </div>
        </div>

        {/* Comparativo Lado a Lado: CPP 20% vs CPRB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lado A: Regime Tradicional (20% sobre Folha) */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cenário Atual • Sem Desoneração
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Regra Geral
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500">CPP Patronal (20% sobre Folha)</span>
              <p className="text-2xl font-bold font-mono text-[#07132B]">
                {formatarMoeda(calculoFolha.cppSobreFolhaAnual)}
                <span className="text-xs font-normal text-slate-500 font-sans"> /ano</span>
              </p>
              <span className="text-xs font-mono text-slate-500 block">
                {formatarMoeda(calculoFolha.cppSobreFolhaMensal)}/mês
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Base de Cálculo (Folha Anual):</span>
                <strong className="font-mono text-slate-900">
                  {formatarMoeda(folhaAnualEfetiva)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Alíquota Patronal:</span>
                <strong className="font-mono text-slate-900">20,00%</strong>
              </div>
            </div>
          </div>

          {/* Lado B: Regime Desonerado (CPRB sobre Receita Bruta) */}
          <div
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              desoneracaoFolhaAtiva
                ? 'border-emerald-400 bg-emerald-50/40 shadow-sm'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    desoneracaoFolhaAtiva ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#07132B]">
                  Cenário CPRB • Com Desoneração
                </span>
              </div>
              <Badge
                className={
                  desoneracaoFolhaAtiva
                    ? 'bg-emerald-600 text-white text-[10px]'
                    : 'bg-slate-200 text-slate-700 text-[10px]'
                }
              >
                {desoneracaoFolhaAtiva ? 'Ativo na Análise' : 'Desativado'}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500">
                CPRB ({aliquotaCprb}% sobre Receita Bruta)
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-800">
                {formatarMoeda(calculoFolha.cprbSobreReceitaAnual)}
                <span className="text-xs font-normal text-slate-500 font-sans"> /ano</span>
              </p>
              <span className="text-xs font-mono text-slate-500 block">
                {formatarMoeda(calculoFolha.cprbSobreReceitaMensal)}/mês
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Base de Cálculo (Receita Anual):</span>
                <strong className="font-mono text-slate-900">
                  {formatarMoeda(receitaBrutaAnual)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Alíquota Aplicada:</span>
                <strong className="font-mono text-slate-900">{aliquotaCprb}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Destaque do Resultado da Folha */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            calculoFolha.vantajoso
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {calculoFolha.vantajoso ? (
              <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <strong className="text-sm font-bold block">
                {calculoFolha.vantajoso
                  ? 'A Desoneração da Folha (CPRB) é VANTAJOSA para a empresa'
                  : 'A Desoneração da Folha (CPRB) É DESVANTAJOSA neste perfil de faturamento'}
              </strong>
              <p className="text-xs leading-relaxed opacity-90">
                {calculoFolha.vantajoso ? (
                  <>
                    Ao optar pela CPRB a {aliquotaCprb}% sobre a receita, a empresa economiza{' '}
                    <strong>{formatarMoeda(calculoFolha.economiaAnual)}/ano</strong> (redução de{' '}
                    <strong>{calculoFolha.percentualReducao.toFixed(1)}%</strong> no desembolso
                    previdenciário patronal).
                  </>
                ) : (
                  <>
                    A alíquota de {aliquotaCprb}% sobre a receita bruta geraria um custo patronal
                    maior em{' '}
                    <strong>{formatarMoeda(Math.abs(calculoFolha.economiaAnual))}/ano</strong> do
                    que recolher os 20% sobre a folha salarial informada.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
              Diferença em R$
            </span>
            <span className="text-xl font-bold font-mono">
              {calculoFolha.economiaAnual >= 0 ? '+' : '-'}
              {formatarMoeda(Math.abs(calculoFolha.economiaAnual))}
            </span>
          </div>
        </div>

        {/* NOTAS TÉCNICAS E LEGAIS: FATOR R E LEI 14.973/2024 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2 text-[#07132B] font-bold">
              <Scale className="w-4 h-4 text-[#D4AF37]" />
              Impacto no Fator R do Simples Nacional
            </div>
            <p className="text-slate-600 leading-relaxed">
              O Fator R da LC 123/2006 continua sendo apurado com base na folha real de salários e
              pró-labore ({calculoFolha.fatorRPct.toFixed(1)}% do faturamento).
            </p>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
              <strong>Aviso Normativo:</strong> A opção pela CPRB substitui a CPP patronal, mas{' '}
              <span className="underline font-semibold">NÃO altera a fórmula do Fator R</span> para
              fins de enquadramento entre os Anexos III e V do Simples Nacional.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Calendar className="w-4 h-4 text-amber-600" />
              Cronograma de Reoneração Gradual (Lei 14.973/2024)
            </div>
            <p className="text-amber-950/80 leading-relaxed">
              Pela Lei 14.973/2024, a desoneração da folha segue vigente até 2027 com reoneração
              progressiva:
            </p>
            <ul className="text-[11px] text-amber-950/90 space-y-1 list-disc pl-4">
              <li>
                <strong>2024:</strong> 100% CPRB (desoneração integral vigente).
              </li>
              <li>
                <strong>2025–2027:</strong> Transição com recolhimento misto escalonado (faseamento
                da folha).
              </li>
              <li>
                <strong>A partir de 2028:</strong> Extinção definitiva da CPRB; retorno integral ao
                regime padrão de 20% sobre a folha.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
