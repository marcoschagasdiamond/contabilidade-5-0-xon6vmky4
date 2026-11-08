import { memo } from 'react'
import { CheckCircle2, Phone, Mail, Clock, MapPin } from 'lucide-react'
import LeadForm from '@/components/LeadForm'
import {
  TELEFONE_EMPRESA_FORMATADO,
  TELEFONE_EMPRESA_LINK,
  EMAIL_EMPRESA_CONTATO,
  EMAIL_EMPRESA_LINK,
  ENDERECO_EMPRESA,
  HORARIO_ATENDIMENTO_EMPRESA,
} from '@/config/empresa'

export const SecaoContatoHome = memo(function SecaoContatoHome() {
  return (
    <section id="contato" className="py-20 md:py-28 bg-slate-50/70 relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Context & Direct Contact */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#2ECC71]/10 px-3 py-1.5 rounded-full inline-block mb-3">
                Vamos conversar
              </span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                Dê o próximo passo para blindar e otimizar sua empresa
              </h2>
              <p className="mt-4 text-slate-600 text-base leading-relaxed">
                Preencha o formulário ao lado para receber um diagnóstico preliminar gratuito do seu
                enquadramento fiscal e das oportunidades de economia para o seu negócio.
              </p>
            </div>

            {/* Guarantees */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
                <span className="text-sm text-slate-700 font-medium">
                  Análise preliminar sem custo e sem compromisso
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
                <span className="text-sm text-slate-700 font-medium">
                  Atendimento em até 2 horas úteis por contador sênior
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
                <span className="text-sm text-slate-700 font-medium">
                  Total confidencialidade dos dados sob sigilo profissional
                </span>
              </div>
            </div>

            {/* Direct contact info card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
                Canais de Atendimento Direto
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-[#145A32] shrink-0" />
                  <a
                    href={TELEFONE_EMPRESA_LINK}
                    className="hover:text-[#145A32] font-medium transition-colors"
                  >
                    {TELEFONE_EMPRESA_FORMATADO}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-[#145A32] shrink-0" />
                  <a
                    href={EMAIL_EMPRESA_LINK}
                    className="hover:text-[#145A32] font-medium transition-colors"
                  >
                    {EMAIL_EMPRESA_CONTATO}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-4 h-4 text-[#145A32] shrink-0" />
                  <span>{HORARIO_ATENDIMENTO_EMPRESA}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#145A32] shrink-0" />
                  <span>{ENDERECO_EMPRESA}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Lead Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl relative">
              <div className="mb-6">
                <h3 className="font-heading font-extrabold text-2xl text-slate-900">
                  Solicite seu Diagnóstico Gratuito
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  Leva menos de 1 minuto. Nossa equipe técnica entrará em contato com uma análise
                  preliminar.
                </p>
              </div>

              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SecaoContatoHome
