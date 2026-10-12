import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Percent,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { MAPA_EXCECOES } from '@/data/reformaTributariaData'

export default function SubpageExcecoes() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 5 • REGIMES DIFERENCIADOS"
        titulo="Mapa de Exceções e Alíquotas"
        subtitulo="O que foge da regra geral do IVA de ~26,5%: cesta básica com alíquota zero, reduções de 60%, regimes especiais e Simples Híbrido."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#07132B] text-white p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 mb-10 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            <Percent className="w-4 h-4" />
            Tratamento Constitucional Diferenciado
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Quem tem direito a pagar menos impostos?
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            A Emenda Constitucional nº 132/2023 e a Lei Complementar nº 214/2025 estabeleceram trava
            para proteger serviços essenciais e preservar a justiça fiscal. Conheça as principais
            categorias desoneradas.
          </p>
        </div>

        {/* LISTAGEM DAS EXCEÇÕES */}
        <div className="space-y-6 mb-12">
          {MAPA_EXCECOES.map((exc) => (
            <div
              key={exc.categoria}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:border-[#D4AF37] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {exc.baseLegal}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#07132B] mt-0.5">
                    {exc.categoria}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-lg text-xs font-extrabold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                    {exc.reducao}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-black text-white bg-[#07132B]">
                    Alíq. Est.: {exc.aliquotaEfetivaAprox}
                  </span>
                </div>
              </div>

              {/* ITENS INCLUSOS */}
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-600 block mb-2">
                  Exemplos e Operações Inclusas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exc.itensInclusos.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGRA PRÁTICA */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#07132B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Regra Prática e Impacto:</strong>
                  {exc.regraPratica}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOX DESTACADO: O SIMPLES HÍBRIDO */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#07132B] to-[#0E2442] text-white border border-[#D4AF37]/40 shadow-xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-2">
            <Sparkles className="w-4 h-4" />
            Destaque Estratégico
          </div>
          <h3 className="text-xl font-heading font-black text-white mb-2">
            A Opção pelo Simples Híbrido (Art. 41, §3º da LC 214/2025)
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
            Optantes pelo Simples Nacional que vendem para médias e grandes empresas não precisam
            abandonar o regime para transferir créditos completos. A lei autoriza recolher IBS e CBS
            pela regra geral do IVA Dual (com débito e crédito) e manter os tributos federais (IRPJ,
            CSLL, INSS Patronal) dentro da guia do DAS.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/diagnostico-regimes"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors"
            >
              Testar se o Simples Híbrido vale a pena no Comparador de Regimes
              <ArrowRight className="w-4 h-4 text-[#07132B]" />
            </Link>
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
