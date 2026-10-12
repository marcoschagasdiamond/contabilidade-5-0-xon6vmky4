import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Award, Sparkles, Layers, HelpCircle, FileText } from 'lucide-react'
import { MODULOS_REFORMA } from '@/data/reformaTributariaData'
import {
  DiamondHeader,
  DiamondFooterCTA,
  getIconComponent,
} from '@/components/reforma/DiamondLayout'

export default function ReformaTributariaHub() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* CABEÇALHO DA PÁGINA */}
      <DiamondHeader
        badge="IDENTIDADE DIAMOND GROUP • REFORMA DO CONSUMO"
        titulo="Reforma Tributária: o que muda para sua empresa"
        subtitulo="Entenda a nova tributação do consumo em linguagem simples, sem juridiquês"
        mostrarVoltar={false}
        mostrarDiagnosticoBtn={true}
      />

      {/* BANNER DESTAQUE CALCULADORA IBS/CBS */}
      <div className="bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/30 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 uppercase mb-1">
                Nova Ferramenta Interativa
              </div>
              <h3 className="text-lg font-heading font-bold text-white">
                Calculadora IBS / CBS com 6 Módulos Interligados
              </h3>
              <p className="text-xs text-slate-300">
                Simule alíquotas oficiais (26,50%), comparativo dos 4 regimes, créditos e cronograma
                2026-2033.
              </p>
            </div>
          </div>
          <Link
            to="/calculadora-ibs-cbs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-md transition-all shrink-0"
          >
            Abrir Calculadora IBS/CBS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* BARRA DE DESTAQUES RÁPIDOS */}
      <div className="bg-[#0E2442] text-white py-5 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/20 shadow-inner">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2 border-r border-white/10 last:border-none">
            <span className="block text-xl sm:text-2xl font-black text-[#D4AF37]">3 Tributos</span>
            <span className="text-xs text-slate-300">IBS + CBS + Imposto Seletivo</span>
          </div>
          <div className="p-2 border-r border-white/10 last:border-none">
            <span className="block text-xl sm:text-2xl font-black text-[#D4AF37]">2026 a 2033</span>
            <span className="text-xs text-slate-300">Cronograma de Transição</span>
          </div>
          <div className="p-2 border-r border-white/10 last:border-none">
            <span className="block text-xl sm:text-2xl font-black text-[#D4AF37]">
              Split Payment
            </span>
            <span className="text-xs text-slate-300">Retenção no Pagamento</span>
          </div>
          <div className="p-2">
            <span className="block text-xl sm:text-2xl font-black text-[#D4AF37]">
              100% Crédito
            </span>
            <span className="text-xs text-slate-300">Não-Cumulatividade Plena</span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: OS 9 MÓDULOS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#07132B] mb-2 bg-[#D4AF37]/20 px-3 py-1 rounded-md border border-[#D4AF37]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#07132B]" />
              Guia Completo Diamond Group
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              Selecione o tema para aprofundar
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Navegue pelos 9 módulos temáticos para orientar seu planejamento e tirar dúvidas com
              clareza.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07132B] hover:text-[#D4AF37] bg-white border border-[#D4AF37]/50 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Série de Artigos no Blog (5 partes)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <div className="text-xs text-slate-500 font-medium bg-slate-200/60 px-3 py-1.5 rounded-lg">
              Atualizado conforme <strong className="text-slate-800">LC 214/2025</strong>
            </div>
          </div>
        </div>
        {/* GRID RESPONSIVO: DESKTOP GRID, MOBILE EMPILHADO */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULOS_REFORMA.map((modulo) => (
            <Link
              key={modulo.id}
              to={`/reforma-tributaria/${modulo.slug}`}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:to-[#07132B] transition-all" />

              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#07132B] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {getIconComponent(modulo.icone)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider bg-[#07132B] px-2.5 py-0.5 rounded-md">
                      Módulo {modulo.numero}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium mt-1">
                      {modulo.tag}
                    </span>
                  </div>
                </div>

                {/* Título e Subtítulo */}
                <h3 className="text-lg font-heading font-extrabold text-[#07132B] group-hover:text-[#1A365D] transition-colors leading-snug">
                  {modulo.titulo}
                </h3>
                <p className="text-xs font-semibold text-[#D4AF37] mt-1 mb-3">{modulo.subtitulo}</p>

                {/* Descrição resumida */}
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{modulo.descricao}</p>
              </div>

              {/* Rodapé do Card com CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 group-hover:text-[#07132B] transition-colors">
                  {modulo.destaque}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#07132B] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all">
                  Acessar
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SEÇÃO INFORMATIVA COMPLEMENTAR */}
      <div className="bg-[#07132B] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-[#D4AF37]/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Award className="w-8 h-8 text-[#D4AF37] mb-4" />
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                Identidade Diamond Group
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rigor analítico e clareza executiva para transformar uma mudança tributária complexa
                em uma vantagem estratégica para a sua carteira e clientes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Layers className="w-8 h-8 text-[#D4AF37] mb-4" />
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                Legislação Consolidada
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Total conformidade com o texto aprovado da LC 214/2025, cronograma do ADCT arts. 125
                a 130 e orientações preliminares do Comitê Gestor.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <HelpCircle className="w-8 h-8 text-[#D4AF37] mb-4" />
              <h4 className="font-heading font-bold text-lg text-white mb-2">
                Suporte Especializado
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dúvidas sobre sublimite estadual de R$ 3,6M, opção anual pelo Simples Híbrido até
                30/09 ou alíquotas de teste? Nossa equipe responde.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA FINAL PARA O DIAGNÓSTICO GRATUITO */}
      <DiamondFooterCTA />
    </div>
  )
}
