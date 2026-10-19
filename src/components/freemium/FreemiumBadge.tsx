import React, { useState } from 'react'
import { Crown, Sparkles, Lock, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { LIMITE_SIMULACOES_GRATUITO, LIMITE_DIAGNOSTICOS_GRATUITO } from '@/services/freemium'
import { PaywallModal } from './PaywallModal'

export interface FreemiumBadgeProps {
  tipo: 'simulacao' | 'diagnostico' | 'geral'
  className?: string
  variante?: 'compacto' | 'completo' | 'barra'
}

export function FreemiumBadge({ tipo, className = '', variante = 'compacto' }: FreemiumBadgeProps) {
  const {
    isPremium,
    simulacoesUsadas,
    diagnosticosUsados,
    simulacoesRestantes,
    diagnosticosRestantes,
  } = useAuth()
  const [paywallAberto, setPaywallAberto] = useState(false)

  if (isPremium) {
    if (variante === 'barra') return null
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold ${className}`}
      >
        <Crown className="w-3.5 h-3.5" />
        <span>Plano Premium (Ilimitado)</span>
      </div>
    )
  }

  const usadas = tipo === 'simulacao' ? simulacoesUsadas : diagnosticosUsados
  const limite = tipo === 'simulacao' ? LIMITE_SIMULACOES_GRATUITO : LIMITE_DIAGNOSTICOS_GRATUITO
  const restantes = tipo === 'simulacao' ? simulacoesRestantes : diagnosticosRestantes
  const atingiuLimite = restantes <= 0

  if (variante === 'barra') {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border text-xs ${
            atingiuLimite
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
          } ${className}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                atingiuLimite ? 'bg-rose-500 animate-pulse' : 'bg-[#2ECC71]'
              }`}
            />
            <span className="font-medium">
              {tipo === 'simulacao' ? 'Simulações gratuitas:' : 'Diagnósticos gratuitos:'}{' '}
              <strong>
                {restantes} de {limite} {restantes === 1 ? 'restante' : 'restantes'}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPaywallAberto(true)}
            className="text-[11px] font-bold text-[#145A32] hover:text-[#0A1A13] underline flex items-center gap-1"
          >
            <span>{atingiuLimite ? 'Desbloquear Ilimitado' : 'Fazer Upgrade'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <PaywallModal
          open={paywallAberto}
          onOpenChange={setPaywallAberto}
          motivo={tipo === 'simulacao' ? 'simulacao' : 'diagnostico'}
        />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPaywallAberto(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          atingiuLimite
            ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
        } ${className}`}
        title="Clique para ver detalhes do plano"
      >
        {atingiuLimite ? (
          <Lock className="w-3 h-3 text-rose-600" />
        ) : (
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
        )}
        <span>
          {atingiuLimite
            ? 'Limite atingido • Upgrade'
            : `${restantes} de ${limite} ${tipo === 'simulacao' ? 'simulações' : 'diagnósticos'}`}
        </span>
      </button>

      <PaywallModal
        open={paywallAberto}
        onOpenChange={setPaywallAberto}
        motivo={tipo === 'simulacao' ? 'simulacao' : 'diagnostico'}
      />
    </>
  )
}
