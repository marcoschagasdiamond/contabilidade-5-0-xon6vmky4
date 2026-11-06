import React from 'react'
import { BookOpen, Sparkles, Lightbulb, Zap, HelpCircle } from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { DICIONARIO_MNEMONICOS_COMPLETO } from '@/data/reformaDicionarioExpansao'

export default function SubpageDicionario() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 3 • TRUQUES DE MEMÓRIA"
        titulo="Dicionário Rápido da Reforma"
        subtitulo="As principais siglas e termos explicados com gatilhos mentais e truques mnemônicos para você nunca mais esquecer nem confundir."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#07132B] text-white p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 mb-10 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            <Lightbulb className="w-4 h-4" />
            Por que mnemônicos funcionam?
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Chega de 'sopa de letrinhas' tributária
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-3xl">
            A nova tributação brasileira trouxe conceitos e siglas fundamentais (IBS, CBS, IS, Split
            Payment, DeRE, IVA Dual, Não Cumulativo e Crédito). Associamos cada conceito a uma
            imagem mental simples para facilitar conversas com sua equipe, clientes e parceiros de
            negócio.
          </p>
        </div>

        {/* LISTAGEM DOS MNEMÔNICOS EM CARDS RÍGIDOS E ELEGANTES */}
        <div className="space-y-6 mb-12">
          {DICIONARIO_MNEMONICOS_COMPLETO.map((item) => (
            <div
              key={item.sigla}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:border-[#D4AF37] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#07132B] font-heading bg-slate-100 px-3.5 py-1 rounded-xl">
                    {item.sigla}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#07132B]">
                      {item.nomeOficial}
                    </h3>
                  </div>
                </div>

                {/* TRUQUE DE MEMÓRIA EM DESTAQUE DOURADO */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {item.truqueMemoria}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Significado Simples:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {item.definicaoSimples}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Exemplo Prático do Dia a Dia:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {item.exemploPratico}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DICA DE BOLSO */}
        <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Precisa explicar isso para seus sócios ou equipe?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Compartilhe este link ou use os truques mnemônicos na sua próxima reunião de
              alinhamento fiscal.
            </p>
          </div>
          <span className="text-xs font-bold text-[#07132B] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
            Metodologia Diamond Group
          </span>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
