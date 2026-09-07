import React from 'react'
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react'

export default function PoliticaPrivacidade() {
  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-14 px-4 sm:px-6 relative">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-[#2ECC71] mx-auto flex items-center justify-center mb-4 border border-emerald-400/30">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight mb-3">
            Política de Privacidade
          </h1>
          <p className="text-slate-300 text-sm">
            Última atualização: 10 de Janeiro de 2025 • Em conformidade com a LGPD (Lei nº
            13.709/2018)
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-slate-700 leading-relaxed space-y-8">
          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              1. Visão Geral e Compromisso
            </h2>
            <p className="text-sm sm:text-base">
              A <strong>Contabilidade 5.0</strong> (doravante "nós", "nosso" ou "empresa") valoriza
              a privacidade e o sigilo das informações de seus clientes, parceiros e visitantes
              deste site. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos
              e protegemos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (Lei
              nº 13.709/2018 – LGPD).
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              2. Dados que Coletamos
            </h2>
            <p className="text-sm sm:text-base mb-3">
              Coletamos as informações fornecidas voluntariamente por você ao preencher nossos
              formulários de contato, solicitar propostas ou contratar serviços contábeis:
            </p>
            <ul className="space-y-2 text-sm sm:text-base list-disc list-inside text-slate-600 pl-2">
              <li>Nome completo e identificadores profissionais</li>
              <li>Endereço de e-mail corporativo</li>
              <li>Número de telefone celular ou WhatsApp</li>
              <li>Nome da pessoa jurídica, segmento de atuação e faixa de colaboradores</li>
              <li>Mensagens complementares e eventuais dados cadastrais fiscais</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              3. Finalidade do Tratamento dos Dados
            </h2>
            <p className="text-sm sm:text-base mb-3">Utilizamos seus dados para:</p>
            <ul className="space-y-2 text-sm sm:text-base list-disc list-inside text-slate-600 pl-2">
              <li>
                Entrar em contato para apresentação de propostas comerciais e diagnósticos fiscais
              </li>
              <li>Executar contratos de prestação de serviços contábeis, tributários e de folha</li>
              <li>
                Cumprir obrigações legais perante a Receita Federal, Prefeituras e órgãos fiscais
              </li>
              <li>
                Enviar comunicações de valor sobre prazos e reformas legislativas, mediante
                consentimento
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              4. Segurança da Informação
            </h2>
            <p className="text-sm sm:text-base">
              Adotamos práticas avançadas de segurança cibernética, incluindo criptografia de dados
              em trânsito (TLS/SSL), controle de acesso restrito e autenticação segura. Nossos
              bancos de dados são hospedados em ambientes em nuvem com conformidade ISO 27001 e SOC
              2.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              5. Compartilhamento de Dados com Terceiros
            </h2>
            <p className="text-sm sm:text-base">
              Não comercializamos nem compartilhamos dados pessoais com fins publicitários de
              terceiros. O compartilhamento ocorre unicamente com órgãos oficiais do governo para
              cumprimento de obrigações acessórias do cliente ou provedores de infraestrutura
              estritamente necessários à execução do serviço contábil.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
              6. Seus Direitos como Titular
            </h2>
            <p className="text-sm sm:text-base">
              Você tem direito de solicitar a qualquer momento a confirmação de tratamento, acesso
              aos seus dados, correção de inconsistências, eliminação de dados tratados com base no
              consentimento ou revogação de permissões através do nosso canal oficial:
              <strong className="text-slate-900 block mt-1">contato@contabilidade5.com.br</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
