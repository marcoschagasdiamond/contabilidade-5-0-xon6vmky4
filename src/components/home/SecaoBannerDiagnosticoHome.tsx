import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react'

export interface SecaoBannerDiagnosticoHomeProps {
  bannerDiagnosticoHref: string
}

export const SecaoBannerDiagnosticoHome = memo(function SecaoBannerDiagnosticoHome({
  bannerDiagnosticoHref,
}: SecaoBannerDiagnosticoHomeProps) {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-[#07132B] via-[#0A1A13] to-[#145A32] text-white relative overflow-hidden border-y border-[#2ECC71]/20">
      {/* Glow decorativo de fundo */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Coluna de texto e chamada */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 text-[#2ECC71] text-xs font-semibold uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Simulador Gratuito</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
              Descubra o melhor regime tributário para o seu negócio
            </h2>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl">
              Simule em 4 etapas o impacto real do Simples Nacional, Lucro Presumido e Lucro Real na
              sua operação, com projeções da Reforma Tributária (IBS/CBS) até 2033.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                <span>Simulação comparativa completa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                <span>Projeção da Reforma até 2033</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                <span>Parecer executivo em PDF</span>
              </div>
            </div>
          </div>

          {/* Coluna com Botão CTA em destaque */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3">
            <Link
              to={bannerDiagnosticoHref}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-heading font-bold text-base shadow-[0_10px_25px_rgba(46,204,113,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
            >
              <span>Fazer Diagnóstico Tributário</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-[11px] text-slate-300 text-center lg:text-right flex items-center justify-center lg:justify-end gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
              Sem compromisso • Diagnóstico preliminar imediato
            </p>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SecaoBannerDiagnosticoHome
