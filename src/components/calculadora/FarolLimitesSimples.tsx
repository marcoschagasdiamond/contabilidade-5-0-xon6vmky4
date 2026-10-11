import React from 'react'
import { AlertTriangle, ShieldCheck, AlertCircle, Info, ExternalLink } from 'lucide-react'
import { formatarMoeda } from '@/lib/calculadoraUtils'

export interface AlertaLimitesSimplesProps {
  alerta: {
    faturamentoAnualProjetado: number
    statusTeto: 'verde' | 'amarelo' | 'vermelho'
    statusSublimite: 'verde' | 'amarelo' | 'vermelho'
    tetoMaximo: number
    sublimiteMaximo: number
    margemRestanteTeto: number
    margemRestanteSublimite: number
    percentualAtingidoTeto: number
    percentualAtingidoSublimite: number
    mensagemTeto: string
    mensagemSublimite: string
    isHibrido: boolean
    isDesenquadrado: boolean
  }
  compacto?: boolean
}

export function FarolLimitesSimples({ alerta, compacto = false }: AlertaLimitesSimplesProps) {
  const getCorBadge = (status: 'verde' | 'amarelo' | 'vermelho') => {
    switch (status) {
      case 'verde':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300'
      case 'amarelo':
        return 'bg-amber-50 text-amber-900 border-amber-300'
      case 'vermelho':
        return 'bg-rose-50 text-rose-900 border-rose-300'
    }
  }

  const getPontoCor = (status: 'verde' | 'amarelo' | 'vermelho') => {
    switch (status) {
      case 'verde':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      case 'amarelo':
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse'
      case 'vermelho':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse'
    }
  }

  if (compacto) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#07132B] flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${getPontoCor(alerta.statusTeto)}`} />
            Faróis do Simples Nacional (Anual: {formatarMoeda(alerta.faturamentoAnualProjetado)})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Fat. Mensal × 12</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Sublimite R$ 3,6M */}
          <div className={`p-2 rounded-lg border ${getCorBadge(alerta.statusSublimite)}`}>
            <div className="flex items-center justify-between font-bold">
              <span>Sublimite R$ 3,6M (ICMS/ISS)</span>
              <span className="font-mono">{alerta.percentualAtingidoSublimite}%</span>
            </div>
            <p className="text-[11px] mt-0.5 leading-snug">
              {alerta.statusSublimite === 'vermelho'
                ? 'Simples Híbrido: ICMS/ISS recolhidos por fora.'
                : alerta.statusSublimite === 'amarelo'
                  ? `Restam ${formatarMoeda(alerta.margemRestanteSublimite)} até o Simples Híbrido.`
                  : 'Recolhimento 100% unificado na guia DAS.'}
            </p>
          </div>

          {/* Teto R$ 4,8M */}
          <div className={`p-2 rounded-lg border ${getCorBadge(alerta.statusTeto)}`}>
            <div className="flex items-center justify-between font-bold">
              <span>Teto Nacional R$ 4,8M</span>
              <span className="font-mono">{alerta.percentualAtingidoTeto}%</span>
            </div>
            <p className="text-[11px] mt-0.5 leading-snug">
              {alerta.statusTeto === 'vermelho'
                ? 'Desenquadramento obrigatório da empresa.'
                : alerta.statusTeto === 'amarelo'
                  ? `Margem de segurança: ${formatarMoeda(alerta.margemRestanteTeto)}.`
                  : 'Empresa dentro do limite do Simples.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#07132B] flex items-center gap-2">
              Faróis de Enquadramento Legal no Simples Nacional
              {alerta.isDesenquadrado ? (
                <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  Excedido
                </span>
              ) : alerta.isHibrido ? (
                <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  Simples Híbrido
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Enquadrado
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              Projeção anualizada baseada no faturamento mensal informado (R${' '}
              {alerta.faturamentoAnualProjetado.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}{' '}
              ao ano)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
            Base: {formatarMoeda(alerta.faturamentoAnualProjetado)}/ano
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BLOCO 1: SUBLIMITE DE R$ 3.600.000 (ICMS / ISS) */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            alerta.statusSublimite === 'vermelho'
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : alerta.statusSublimite === 'amarelo'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${getPontoCor(alerta.statusSublimite)}`} />
              <strong className="text-xs uppercase tracking-wider font-bold">
                1. Sublimite Estadual/Municipal: R$ 3,6M
              </strong>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200">
              {alerta.percentualAtingidoSublimite}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2.5">
            <div
              className={`h-full transition-all duration-500 ${
                alerta.statusSublimite === 'vermelho'
                  ? 'bg-rose-600'
                  : alerta.statusSublimite === 'amarelo'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, alerta.percentualAtingidoSublimite)}%` }}
            />
          </div>

          <p className="text-xs leading-relaxed font-medium">{alerta.mensagemSublimite}</p>

          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] flex justify-between">
            <span className="text-slate-600">Margem até Sublimite:</span>
            <strong className="font-mono">
              {alerta.margemRestanteSublimite > 0
                ? formatarMoeda(alerta.margemRestanteSublimite)
                : 'Sublimite Ultrapassado'}
            </strong>
          </div>
        </div>

        {/* BLOCO 2: TETO NACIONAL DE R$ 4.800.000 */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            alerta.statusTeto === 'vermelho'
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : alerta.statusTeto === 'amarelo'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${getPontoCor(alerta.statusTeto)}`} />
              <strong className="text-xs uppercase tracking-wider font-bold">
                2. Teto Geral do Simples Nacional: R$ 4,8M
              </strong>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200">
              {alerta.percentualAtingidoTeto}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2.5">
            <div
              className={`h-full transition-all duration-500 ${
                alerta.statusTeto === 'vermelho'
                  ? 'bg-rose-600'
                  : alerta.statusTeto === 'amarelo'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, alerta.percentualAtingidoTeto)}%` }}
            />
          </div>

          <p className="text-xs leading-relaxed font-medium">{alerta.mensagemTeto}</p>

          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] flex justify-between">
            <span className="text-slate-600">Margem até o Teto:</span>
            <strong className="font-mono">
              {alerta.margemRestanteTeto > 0
                ? formatarMoeda(alerta.margemRestanteTeto)
                : 'Teto Ultrapassado'}
            </strong>
          </div>
        </div>
      </div>

      {/* EXPLICAÇÃO SEM JURIDIQUÊS CONFORME ESPECIFICAÇÃO */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-[#07132B] block">
            Impacto no comparativo com o novo IBS/CBS (Sem Juridiquês):
          </strong>
          <p className="leading-relaxed">
            Se a empresa fatura mais de <strong>R$ 3,6 milhões/ano</strong>, ela vira um{' '}
            <em>"Simples Híbrido"</em>: a guia DAS cobre apenas impostos federais, e o ICMS ou ISS é
            recolhido pelo sistema normal débito/crédito. Isso elimina grande parte da simplicidade
            e da vantagem fiscal do Simples, tornando a migração para o novo modelo de{' '}
            <strong>IBS/CBS pleno</strong> muito mais competitiva, já que clientes PJ preferem
            comprar de empresas com crédito integral de 26,50%.
          </p>
        </div>
      </div>
    </div>
  )
}
