import React from 'react'
import { FileCheck, BookOpen, Scale } from 'lucide-react'

export default function TermosDeUso() {
  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-14 px-4 sm:px-6 relative">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-[#2ECC71] mx-auto flex items-center justify-center mb-4 border border-emerald-400/30">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight mb-3">
            Termos de Uso
          </h1>
          <p className="text-slate-300 text-sm">
            Condições gerais de navegação e contratação de serviços da Contabilidade 5.0
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-slate-700 leading-relaxed space-y-8">
          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              1. Aceitação dos Termos
            </h2>
            <p className="text-sm sm:text-base">
              Ao acessar ou utilizar o website da <strong>Contabilidade 5.0</strong> e seus
              formulários eletrônicos, você expressa concordância integral com estes Termos de Uso.
              Caso não concorde com quaisquer das disposições aqui contidas, solicitamos que não
              prossiga com a navegação ou envio de dados.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              2. Objeto e Natureza das Informações
            </h2>
            <p className="text-sm sm:text-base">
              O presente portal possui caráter institucional e informativo, visando apresentar as
              soluções de gestão contábil, fiscal, trabalhista e consultoria societária prestadas
              pela nossa sociedade de profissionais devidamente registrada perante o Conselho
              Regional de Contabilidade (CRC).
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              3. Prestação e Contratação Específica
            </h2>
            <p className="text-sm sm:text-base">
              O preenchimento de formulários de orçamento ou propostas neste site não configura, por
              si só, a contratação automática dos serviços contábeis. A prestação efetiva de
              serviços depende de celebração formal de Contrato de Prestação de Serviços Contábeis,
              onde serão estipulados escopo, prazos, honorários e responsabilidades recíprocas.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              4. Propriedade Intelectual
            </h2>
            <p className="text-sm sm:text-base">
              Todo o conteúdo deste portal, incluindo marcas, logotipos, textos explicativos,
              artigos de blog, fluxogramas e códigos de software são de propriedade exclusiva da
              Contabilidade 5.0 e protegidos pelas leis de direitos autorais e propriedade
              intelectual brasileiras. É proibida a reprodução sem prévia autorização.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              5. Foro e Legislação Aplicável
            </h2>
            <p className="text-sm sm:text-base">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
              Foro da Comarca de São Paulo/SP como o único competente para dirimir eventuais
              controvérsias oriundas da utilização deste portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
