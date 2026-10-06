import React from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Building2,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { VISAO_GERAL_DATA } from '@/data/reformaTributariaData'

export default function SubpageVisaoGeral() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 1 • FUNDAMENTOS TRIBUTÁRIOS"
        titulo="Visão Geral da Reforma Tributária"
        subtitulo="O que é, por que existe, os 3 novos tributos e a unificação da tributação sobre o consumo no Brasil."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* BLOCO 1: O QUE É E POR QUE EXISTE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <Globe className="w-3.5 h-3.5" />
            Entenda o Contexto
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-4">
            O que é a Reforma Tributária?
          </h2>
          <p className="text-slate-700 text-base leading-relaxed mb-6">{VISAO_GERAL_DATA.oQueE}</p>

          <h3 className="text-lg font-heading font-bold text-[#07132B] mb-3">
            Por que essa mudança foi aprovada?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VISAO_GERAL_DATA.porQueExiste.map((motivo, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
              >
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 leading-snug">{motivo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCO 2: OS 3 NOVOS TRIBUTOS */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-extrabold text-[#07132B]">
              Os 3 Novos Tributos do Consumo
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Conheça os três pilares que substituem PIS, COFINS, IPI, ICMS e ISS.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {VISAO_GERAL_DATA.tributosNovos.map((trib) => (
              <div
                key={trib.sigla}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#D4AF37] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#07132B] font-heading bg-slate-100 px-3 py-1 rounded-lg">
                      {trib.sigla}
                    </span>
                    {trib.sigla === 'IBS' && <Building2 className="w-6 h-6 text-[#D4AF37]" />}
                    {trib.sigla === 'CBS' && <Landmark className="w-6 h-6 text-[#1A365D]" />}
                    {trib.sigla === 'IS' && <Flame className="w-6 h-6 text-amber-600" />}
                  </div>

                  <h3 className="font-heading font-bold text-lg text-[#07132B] mb-1">
                    {trib.nome}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">Competência:</span>
                      <span className="text-right">{trib.competencia}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">Gestão:</span>
                      <span className="text-right">{trib.gestao}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">Substitui:</span>
                      <span className="text-right font-medium text-slate-900">
                        {trib.substitui}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">Alíquota Padrão:</span>
                      <span className="text-right font-bold text-[#07132B]">
                        {trib.aliquotaPadrao}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {trib.papel}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#07132B] font-semibold">
                  <span>IVA Dual Brasileiro</span>
                  <span className="text-[#D4AF37] font-bold">LC 214/2025</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCO 3: RESUMO DO CRONOGRAMA 2026 - 2033 */}
        <div className="bg-[#07132B] text-white rounded-2xl p-8 border border-[#D4AF37]/30 shadow-xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-heading font-extrabold text-white">
              Cronograma de Transição em Síntese (2026 a 2033)
            </h3>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            A migração do modelo antigo para o novo será suave e progressiva ao longo de 8 anos:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-xs font-bold text-[#D4AF37] uppercase">2026</span>
              <h4 className="font-bold text-white text-sm mt-1">Ensaio Operacional</h4>
              <p className="text-xs text-slate-300 mt-2">
                CBS 0,9% e IBS 0,1% com dispensa de recolhimento para testes de emissão de NF-e.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-xs font-bold text-[#D4AF37] uppercase">2027</span>
              <h4 className="font-bold text-white text-sm mt-1">CBS Cheia + IS</h4>
              <p className="text-xs text-slate-300 mt-2">
                PIS e COFINS extintos. CBS entra em vigor a 8,7% e Imposto Seletivo passa a incidir.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-xs font-bold text-[#D4AF37] uppercase">2029–2032</span>
              <h4 className="font-bold text-white text-sm mt-1">ICMS/ISS Saindo</h4>
              <p className="text-xs text-slate-300 mt-2">
                ICMS e ISS diminuem 10% ao ano, enquanto o IBS assume gradualmente de 10% a 40%.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-xs font-bold text-[#D4AF37] uppercase">2033</span>
              <h4 className="font-bold text-white text-sm mt-1">Modelo Pleno</h4>
              <p className="text-xs text-slate-300 mt-2">
                Extinção total de ICMS e ISS. IVA Dual opera com IBS e CBS plenos e split payment.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to="/reforma-tributaria/calendario"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:underline"
            >
              Ver linha do tempo interativa completa
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
