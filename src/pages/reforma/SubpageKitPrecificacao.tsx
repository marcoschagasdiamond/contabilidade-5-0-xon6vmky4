import React, { useState } from 'react'
import {
  Coins,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Edit3,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import {
  SCRIPT_OFERTA_4_PASSOS,
  SERVICOS_PRECIFICACAO_REFERENCIA,
  ServicoPrecificacao,
} from '@/data/reformaTributariaData'

export default function SubpageKitPrecificacao() {
  const [servicos, setServicos] = useState<ServicoPrecificacao[]>(SERVICOS_PRECIFICACAO_REFERENCIA)
  const [modoEdicao, setModoEdicao] = useState(false)

  const handleUpdatePreco = (
    id: string,
    campo: 'faixaSugeridaMin' | 'faixaSugeridaMax',
    valor: number,
  ) => {
    setServicos((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [campo]: Number.isNaN(valor) ? 0 : valor } : s)),
    )
  }

  const formatMoney = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 9 • COMERCIAL & PROPOSTAS"
        titulo="Kit de Precificação da Reforma"
        subtitulo="Script de oferta em 4 passos (Gancho, Autoridade, Oferta, Fechamento) e faixas de preço de referência de mercado em R$."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* PARTE 1: SCRIPT DE OFERTA EM 4 PASSOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-[#07132B] uppercase tracking-wider mb-2">
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
            Script de Proposta Comercial
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#07132B] mb-2">
            Script de Abordagem em 4 Passos
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6">
            Use esta estrutura validada para apresentar a necessidade de adequação tributária aos
            seus clientes sem parecer oportunista, evidenciando o valor e a proteção de patrimônio:
          </p>

          <div className="space-y-4">
            {/* PASSO 1 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  {SCRIPT_OFERTA_4_PASSOS.passo1_gancho.titulo}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed pl-8">
                {SCRIPT_OFERTA_4_PASSOS.passo1_gancho.texto}
              </p>
            </div>

            {/* PASSO 2 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  {SCRIPT_OFERTA_4_PASSOS.passo2_autoridade.titulo}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed pl-8">
                {SCRIPT_OFERTA_4_PASSOS.passo2_autoridade.texto}
              </p>
            </div>

            {/* PASSO 3 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  {SCRIPT_OFERTA_4_PASSOS.passo3_oferta.titulo}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed pl-8">
                {SCRIPT_OFERTA_4_PASSOS.passo3_oferta.texto}
              </p>
            </div>

            {/* PASSO 4 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  {SCRIPT_OFERTA_4_PASSOS.passo4_fechamento.titulo}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed pl-8">
                {SCRIPT_OFERTA_4_PASSOS.passo4_fechamento.texto}
              </p>
            </div>
          </div>
        </div>

        {/* PARTE 2: FAIXAS DE PREÇO DE REFERÊNCIA (EDITÁVEIS) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-1">
                <Coins className="w-3.5 h-3.5" />
                Tabela Sugerida de Honorários
              </div>
              <h3 className="text-xl font-heading font-black text-[#07132B]">
                Faixas de Preço de Referência
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores médios praticados por consultorias contábeis no Brasil (personalizáveis pelo
                usuário).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModoEdicao(!modoEdicao)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoEdicao
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {modoEdicao ? 'Concluir Edição de Valores' : 'Ajustar Valores em R$'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicos.map((srv) => (
              <div
                key={srv.id}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-[#D4AF37] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-heading font-extrabold text-base text-[#07132B]">
                      {srv.titulo}
                    </h4>
                    {srv.destaqueBadge && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-[#07132B] bg-[#D4AF37]">
                        {srv.destaqueBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{srv.descricao}</p>

                  <div className="space-y-1.5 mb-6">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Entregáveis inclusos:
                    </span>
                    {srv.entregaveis.map((ent, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{ent}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAIXA DE PREÇO */}
                <div className="pt-4 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Faixa sugerida de mercado:
                  </span>

                  {modoEdicao ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">R$</span>
                      <input
                        type="number"
                        value={srv.faixaSugeridaMin}
                        onChange={(e) =>
                          handleUpdatePreco(srv.id, 'faixaSugeridaMin', Number(e.target.value))
                        }
                        className="w-24 p-1.5 text-xs rounded border border-slate-300 font-bold"
                      />
                      <span className="text-xs text-slate-400">até</span>
                      <input
                        type="number"
                        value={srv.faixaSugeridaMax}
                        onChange={(e) =>
                          handleUpdatePreco(srv.id, 'faixaSugeridaMax', Number(e.target.value))
                        }
                        className="w-24 p-1.5 text-xs rounded border border-slate-300 font-bold"
                      />
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-heading font-black text-[#07132B]">
                        {formatMoney(srv.faixaSugeridaMin)} a {formatMoney(srv.faixaSugeridaMax)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({srv.unidade})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Nota comercial:</strong> Os valores acima são referências sugeridas de mercado e
            variam conforme o porte do cliente, complexidade das filiais, número de notas emitidas e
            volume de operações interestaduais.
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
