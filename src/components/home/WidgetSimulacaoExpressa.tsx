import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, TrendingUp, CheckCircle, Calculator, Info } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export type FaixaFaturamento = 'ate_4_8m' | '4_8m_50m' | 'acima_50m'
export type RegimeAtual = 'simples' | 'presumido' | 'real'
export type NivelDespesasCredito = 'baixa' | 'media' | 'alta'

interface ResultadoEstimativa {
  minimo: number
  maximo: number
  descricao: string
}

export function calcularEstimativaExpressa(
  faturamento: FaixaFaturamento,
  regime: RegimeAtual,
  despesas: NivelDespesasCredito,
): ResultadoEstimativa {
  // Valores anuais de faturamento aproximado de referência para cálculo ilustrativo
  const fatRef =
    faturamento === 'ate_4_8m' ? 2_400_000 : faturamento === '4_8m_50m' ? 18_000_000 : 80_000_000

  // Multiplicador do regime tributário atual
  let fatorRegime = 1.0
  let baseDescricao = ''

  if (regime === 'simples') {
    // No Simples, a oportunidade vem do creditamento na cadeia B2B ou opção híbrida
    fatorRegime = 0.008
    baseDescricao = 'Oportunidade na transferência de créditos IBS/CBS e otimização híbrida'
  } else if (regime === 'presumido') {
    // No Presumido, a transição para IBS/CBS com aproveitamento amplo de créditos de insumos/serviços
    fatorRegime = 0.018
    baseDescricao = 'Ganhos com creditamento financeiro integral e eliminação de cumulatividade'
  } else {
    // No Lucro Real, ganho via créditos amplos da Reforma LC 214/2025 e split payment
    fatorRegime = 0.015
    baseDescricao = 'Eficiência de créditos sobre insumos, split payment e Selic de créditos'
  }

  // Multiplicador do nível de despesas com crédito
  const fatorDespesa = despesas === 'baixa' ? 0.7 : despesas === 'media' ? 1.0 : 1.45

  const valorBase = fatRef * fatorRegime * fatorDespesa
  const minimo = Math.round((valorBase * 0.75) / 1000) * 1000
  const maximo = Math.round((valorBase * 1.35) / 1000) * 1000

  return {
    minimo: Math.max(minimo, 12_000),
    maximo: Math.max(maximo, 38_000),
    descricao: baseDescricao,
  }
}

export function formatarValorK(val: number): string {
  if (val >= 1_000_000) {
    const milhoes = (val / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')
    return `R$ ${milhoes} mi`
  }
  const milhares = Math.round(val / 1000)
  return `R$ ${milhares} mil`
}

export default function WidgetSimulacaoExpressa({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [faturamento, setFaturamento] = useState<FaixaFaturamento>('ate_4_8m')
  const [regime, setRegime] = useState<RegimeAtual>('simples')
  const [despesas, setDespesas] = useState<NivelDespesasCredito>('media')

  const estimativa = useMemo(() => {
    return calcularEstimativaExpressa(faturamento, regime, despesas)
  }, [faturamento, regime, despesas])

  const handleCta = () => {
    if (isAuthenticated) {
      navigate('/dados-empresa')
    } else {
      navigate('/cadastro?redirect=%2Fdados-empresa')
    }
  }

  return (
    <div
      data-testid="widget-simulacao-expressa"
      className={`bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-100/60 transition-all ${className}`}
    >
      {/* Cabeçalho do Widget */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#145A32]">
            <Calculator className="w-5 h-5 text-[#2ECC71]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base text-[#07132B] tracking-tight">
                Simulação Expressa
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#916b0d] border border-[#D4AF37]/30">
                IBS / CBS
              </span>
            </div>
            <p className="text-xs text-slate-500">3 respostas • resultado imediato</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span>Grátis</span>
        </div>
      </div>

      {/* Pergunta 1: Faturamento Anual */}
      <div className="space-y-1.5 mb-3.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>1. Faturamento anual da empresa</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFaturamento('ate_4_8m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === 'ate_4_8m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Até R$ 4,8 mi
          </button>
          <button
            type="button"
            onClick={() => setFaturamento('4_8m_50m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === '4_8m_50m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            R$ 4,8 a 50 mi
          </button>
          <button
            type="button"
            onClick={() => setFaturamento('acima_50m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === 'acima_50m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Acima de 50 mi
          </button>
        </div>
      </div>

      {/* Pergunta 2: Regime Atual */}
      <div className="space-y-1.5 mb-3.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>2. Regime tributário atual</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setRegime('simples')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'simples'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Simples Nac.
          </button>
          <button
            type="button"
            onClick={() => setRegime('presumido')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'presumido'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Lucro Presumido
          </button>
          <button
            type="button"
            onClick={() => setRegime('real')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'real'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Lucro Real
          </button>
        </div>
      </div>

      {/* Pergunta 3: % Despesas com Crédito */}
      <div className="space-y-1.5 mb-4">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>3. Despesas com compras, insumos e serviços</span>
          <span className="text-[11px] font-normal text-slate-500">com direito a crédito</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setDespesas('baixa')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'baixa'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Baixa (&lt;25%)
          </button>
          <button
            type="button"
            onClick={() => setDespesas('media')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'media'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Média (25% a 50%)
          </button>
          <button
            type="button"
            onClick={() => setDespesas('alta')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'alta'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Alta (&gt;50%)
          </button>
        </div>
      </div>

      {/* Card do Resultado na hora */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50/40 border border-emerald-200/80 mb-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Economia potencial estimada com IBS/CBS:</span>
        </div>
        <div
          data-testid="estimativa-faixa-resultado"
          className="text-lg sm:text-2xl font-heading font-extrabold text-[#0E3520] tracking-tight"
        >
          {formatarValorK(estimativa.minimo)} a {formatarValorK(estimativa.maximo)}
          <span className="text-xs font-semibold text-slate-600 ml-1.5">/ ano</span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{estimativa.descricao}</p>
      </div>

      {/* CTA para o relatório completo */}
      <button
        type="button"
        onClick={handleCta}
        data-testid="cta-simulacao-expressa"
        className="w-full py-3.5 px-4 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.45)] transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer btn-press"
      >
        <span>Quero o relatório completo</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Disclaimer */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3 h-3 shrink-0" />
        <span className="text-center">
          Estimativa ilustrativa — a análise completa considera seu caso real.
        </span>
      </div>
    </div>
  )
}
