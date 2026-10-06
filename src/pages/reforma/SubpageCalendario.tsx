import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { CALENDARIO_DETALHADO } from '@/data/reformaTributariaData'

export default function SubpageCalendario() {
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2026)

  const faseAtiva =
    CALENDARIO_DETALHADO.find((item) => item.ano === anoSelecionado) || CALENDARIO_DETALHADO[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 2 • CRONOGRAMA OFICIAL"
        titulo="Calendário de Transição (2026 a 2033)"
        subtitulo="Linha do tempo interativa com as datas-chave da reforma, alíquotas vigentes e impacto no Simples Nacional."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SELETOR INTERATIVO DE ANOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selecione o ano para ver os impactos:
            </span>
            <span className="text-xs text-[#D4AF37] font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Transição de 8 anos (ADCT 125-130)
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {CALENDARIO_DETALHADO.map((item) => {
              const isSelected = item.ano === anoSelecionado
              return (
                <button
                  key={item.ano}
                  type="button"
                  onClick={() => setAnoSelecionado(item.ano)}
                  className={`py-3 px-2 rounded-xl text-center font-bold text-sm transition-all duration-200 border ${
                    isSelected
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] shadow-lg scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="block text-base">{item.ano}</span>
                  <span
                    className={`block text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-[#D4AF37]' : 'text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* DETALHE DO ANO SELECIONADO */}
        <div className="bg-white rounded-2xl border-2 border-[#D4AF37]/50 p-6 sm:p-8 shadow-md mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] uppercase mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Ano em Foco: {faseAtiva.ano}
              </div>
              <h2 className="text-2xl font-heading font-black text-[#07132B]">
                {faseAtiva.titulo}
              </h2>
            </div>
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">
              {faseAtiva.status}
            </span>
          </div>

          <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-8">
            {faseAtiva.detalhes}
          </p>

          {/* QUADRO DE ALÍQUOTAS E IMPACTOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                CBS (Federal):
              </span>
              <p className="text-sm font-semibold text-[#07132B]">{faseAtiva.cbsAliquota}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                IBS (Estados e Municípios):
              </span>
              <p className="text-sm font-semibold text-[#07132B]">{faseAtiva.ibsAliquota}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Tributos Antigos (PIS, COFINS, IPI, ICMS, ISS):
              </span>
              <p className="text-sm font-semibold text-rose-700">{faseAtiva.tributosAntigos}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Simples Nacional:
              </span>
              <p className="text-sm font-semibold text-emerald-700">{faseAtiva.simplesNacional}</p>
            </div>
          </div>

          {/* MARCOS CHAVE DESTE ANO */}
          <div>
            <h3 className="text-base font-heading font-bold text-[#07132B] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              Principais Acontecimentos de {faseAtiva.ano}:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {faseAtiva.marcos.map((marco, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-slate-200"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 leading-snug">{marco}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LINHA DO TEMPO COMPLETA EM CARD COMPACTO */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30">
          <h3 className="text-xl font-heading font-bold text-white mb-2">
            Resumo Cronológico 2026 - 2033
          </h3>
          <p className="text-xs text-slate-300 mb-6">
            Acompanhe o ritmo gradual de substituição tributária. Clique em qualquer ano no topo
            para detalhar.
          </p>

          <div className="space-y-4">
            {CALENDARIO_DETALHADO.map((item) => (
              <div
                key={item.ano}
                onClick={() => setAnoSelecionado(item.ano)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  item.ano === anoSelecionado
                    ? 'bg-white/10 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-[#D4AF37] text-base w-12">
                    {item.ano}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{item.titulo}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.cbsAliquota} • {item.ibsAliquota}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
