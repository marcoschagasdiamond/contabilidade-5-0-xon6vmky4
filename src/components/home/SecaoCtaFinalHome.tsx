import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/config/empresa'

export const SecaoCtaFinalHome = memo(function SecaoCtaFinalHome() {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-[#0A1A13] via-[#145A32] to-[#0A1A13] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px] opacity-10"
        aria-hidden="true"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-white/10 px-3.5 py-1.5 rounded-full inline-block mb-4 border border-[#2ECC71]/30">
          Transformação Contábil
        </span>
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Pronto para ter a contabilidade que o seu negócio realmente merece?
        </h2>
        <p className="mt-5 text-slate-200 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Migre sua empresa para a Contabilidade 5.0 com transição suave, suporte dedicado e sem
          interrupção nas suas operações diárias.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/servicos"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#145A32] font-heading font-bold text-base hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl"
          >
            <span>Conhecer Nossos Planos</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href={buildWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#25D366] text-slate-950 font-heading font-bold text-base hover:bg-[#20ba59] transition-all shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Falar com Contador no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
})

export default SecaoCtaFinalHome
