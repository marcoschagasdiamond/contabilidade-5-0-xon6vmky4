import React from 'react'
import type { LeadProcessado } from '@/types/pipelineLead'

interface AlertaLeadsQuentesProps {
  leads: LeadProcessado[]
  onSelecionarLead: (lead: LeadProcessado) => void
}

export function AlertaLeadsQuentes({ leads, onSelecionarLead }: AlertaLeadsQuentesProps) {
  const leadsQuentesEsquecidos = leads.filter((l) => l.isQuenteEsquecido)

  if (leadsQuentesEsquecidos.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping inline-block" />
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
            Alerta Crítico de Conversão
          </span>
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-rose-950">
            {leadsQuentesEsquecidos.length}{' '}
            {leadsQuentesEsquecidos.length === 1
              ? 'Lead Quente Esquecido'
              : 'Leads Quentes Esquecidos'}
          </h3>
        </div>
        <span className="text-xs text-rose-800 font-semibold">
          Score alto sem interação recente — risco iminente de esfriar!
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {leadsQuentesEsquecidos.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onSelecionarLead(lead)}
            className="bg-white/95 hover:bg-white rounded-2xl p-3.5 border border-rose-200 hover:border-rose-400 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  Score: {lead.score} pts
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {lead.diasSemInteracao === 0
                    ? 'Aguardando 1º contato'
                    : `${lead.diasSemInteracao} dias sem contato`}
                </span>
              </div>

              <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                {lead.nome}
              </h4>
              <p className="text-[11px] text-slate-600 line-clamp-1 font-medium mt-0.5">
                {lead.empresa || 'Empresa não informada'} •{' '}
                {lead.telefone || lead.email || 'Sem contato'}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">
                Origem: <strong className="text-slate-800">{lead.fonte}</strong>
              </span>
              <button
                type="button"
                className="text-[11px] font-extrabold text-rose-700 hover:text-rose-900 underline"
              >
                Atender agora →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
