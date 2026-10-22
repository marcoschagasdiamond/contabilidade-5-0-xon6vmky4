import React, { useState } from 'react'
import {
  ShoppingBag,
  Briefcase,
  Factory,
  HeartPulse,
  GraduationCap,
  Wheat,
  Truck,
  Cpu,
  HardHat,
  Utensils,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { MAPA_SETORES } from '@/data/reformaTributariaData'

function getSetorIcon(setor: string) {
  switch (setor) {
    case 'Comércio':
      return <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
    case 'Serviços':
      return <Briefcase className="w-5 h-5 text-[#D4AF37]" />
    case 'Indústria':
      return <Factory className="w-5 h-5 text-[#D4AF37]" />
    case 'Saúde':
      return <HeartPulse className="w-5 h-5 text-[#D4AF37]" />
    case 'Educação':
      return <GraduationCap className="w-5 h-5 text-[#D4AF37]" />
    case 'Agro':
      return <Wheat className="w-5 h-5 text-[#D4AF37]" />
    case 'Transporte':
      return <Truck className="w-5 h-5 text-[#D4AF37]" />
    case 'Tecnologia':
      return <Cpu className="w-5 h-5 text-[#D4AF37]" />
    case 'Construção':
      return <HardHat className="w-5 h-5 text-[#D4AF37]" />
    case 'Bares e Restaurantes':
      return <Utensils className="w-5 h-5 text-[#D4AF37]" />
    default:
      return <Briefcase className="w-5 h-5 text-[#D4AF37]" />
  }
}

export default function SubpageImpactoSetor() {
  const [filtroSetor, setFiltroSetor] = useState<string>('todos')

  const setoresFiltrados =
    filtroSetor === 'todos'
      ? MAPA_SETORES
      : MAPA_SETORES.filter((s) => s.setor.toLowerCase() === filtroSetor.toLowerCase())

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 4 • ANÁLISE SETORIAL"
        titulo="Mapa de Impacto por Setor"
        subtitulo="10 segmentos econômicos mapeados detalhadamente: o que muda, alíquotas aplicáveis, sistema de crédito, pontos de atenção e respostas prontas para clientes."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FILTROS RÁPIDOS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 text-xs font-semibold scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltroSetor('todos')}
            className={`px-4 py-2 rounded-xl shrink-0 transition-all ${
              filtroSetor === 'todos'
                ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todos os 10 Setores
          </button>
          {MAPA_SETORES.map((s) => (
            <button
              key={s.setor}
              type="button"
              onClick={() => setFiltroSetor(s.setor)}
              className={`px-3.5 py-2 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                filtroSetor === s.setor
                  ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {getSetorIcon(s.setor)}
              {s.setor}
            </button>
          ))}
        </div>

        {/* LISTA DE CARDS SETORIAIS */}
        <div className="space-y-8 mb-12">
          {setoresFiltrados.map((item) => (
            <div
              key={item.setor}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:border-[#D4AF37] transition-all"
            >
              {/* CABEÇALHO DO SETOR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#07132B] flex items-center justify-center">
                    {getSetorIcon(item.setor)}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-black text-[#07132B]">{item.setor}</h3>
                    <span className="text-xs text-slate-500">
                      Análise técnica conforme regras da LC 214/2025
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      item.resumoRisco === 'alto'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.resumoRisco === 'medio'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Atenção: {item.resumoRisco}
                  </span>
                </div>
              </div>

              {/* 4 QUADROS DE INFORMAÇÕES TÉCNICAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    O que muda:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.oQueMuda}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Alíquota que se aplica:
                  </span>
                  <p className="text-xs font-bold text-[#07132B] leading-relaxed">
                    {item.aliquotaAplica}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Como fica o crédito:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.comoFicaCredito}</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Ponto de atenção:
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed">{item.pontoAtencao}</p>
                </div>
              </div>

              {/* PERGUNTA COMUM DO CLIENTE E RESPOSTA PRONTA */}
              <div className="p-5 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/30">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-1.5">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                  Pergunta frequente do cliente:
                </div>
                <h4 className="text-sm font-bold text-white mb-3">"{item.perguntaCliente}"</h4>

                <div className="pt-3 border-t border-white/10 text-xs text-slate-200 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#D4AF37] font-semibold block mb-0.5">
                      Resposta sugerida pelo analista:
                    </strong>
                    {item.respostaPronta}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
