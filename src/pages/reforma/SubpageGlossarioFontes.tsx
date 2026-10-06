import React from 'react'
import {
  FileText,
  AlertCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { CONFUSOES_COMUNS, FONTES_OFICIAIS } from '@/data/reformaTributariaData'

export default function SubpageGlossarioFontes() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 9 • LEGISLAÇÃO & FAQ"
        titulo="Glossário e Fontes Oficiais"
        subtitulo="Quadro comparativo das confusões mais comuns (IBS vs CBS, IS vs ISS, IBS vs IPI, CBS vs PIS/COFINS) e links para a LC 214/2025."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* PARTE 1: QUADRO DE CONFUSÕES MAIS COMUNS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-[#07132B] uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            Quadro Descomplicado
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#07132B] mb-2">
            As Confusões Mais Comuns Desfeitas
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6">
            Compare lado a lado as siglas e tributos que costumam gerar maiores dúvidas no mercado:
          </p>

          <div className="space-y-6">
            {CONFUSOES_COMUNS.map((item) => (
              <div
                key={item.comparativo}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 mb-4">
                  <h3 className="font-heading font-black text-base sm:text-lg text-[#07132B]">
                    {item.comparativo}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#07132B]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {item.termoA}
                    </span>
                    <span>vs</span>
                    <span className="bg-[#07132B] text-[#D4AF37] px-2.5 py-1 rounded-md">
                      {item.termoB}
                    </span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  <strong className="text-slate-900 block mb-1">Diferença na Prática:</strong>
                  {item.diferencaPratica}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
                  <strong className="text-amber-950 font-bold block mb-0.5">Truque mental:</strong>
                  {item.dicaMnemônica}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PARTE 2: LINKS PARA FONTES OFICIAIS */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            Bases Legais e Portais Oficiais
          </div>
          <h3 className="text-xl font-heading font-black text-white mb-2">
            Fontes Oficiais da Reforma Tributária
          </h3>
          <p className="text-xs text-slate-300 mb-6">
            Acesse as fontes governamentais e normativas originais com validade jurídica:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FONTES_OFICIAIS.map((fonte) => (
              <a
                key={fonte.titulo}
                href={fonte.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:bg-white/10 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded">
                      {fonte.badge}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white group-hover:text-[#D4AF37] transition-colors">
                    {fonte.titulo}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{fonte.descricao}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 group-hover:text-white flex items-center gap-1 font-semibold">
                  Acessar documento oficial
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
