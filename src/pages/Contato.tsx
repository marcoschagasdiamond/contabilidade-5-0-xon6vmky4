import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react'
import LeadForm from '@/components/LeadForm'

export default function Contato() {
  const navigate = useNavigate()

  const handleVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/legislacao')
    }
  }

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      {/* 1. HEADER */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            Fale Conosco
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Entre em Contato
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Estamos prontos para atender as demandas contábeis e fiscais da sua empresa. Agende uma
            conversa com nossos consultores especializados.
          </p>
        </div>
      </section>

      {/* 2. CONTEÚDO PRINCIPAL: FORMULÁRIO + INFO DE CONTATO + MAPA */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Coluna Esquerda: Informações + Google Maps Embutido */}
            <div className="lg:col-span-6 space-y-8">
              {/* Card de Informações */}
              <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm">
                <h2 className="font-heading font-bold text-2xl text-slate-900 tracking-tight mb-6">
                  Nossos Canais de Atendimento
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Endereço Principal</h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Av. Paulista, 1000 — Bela Vista
                      </p>
                      <p className="text-xs text-slate-500">São Paulo — SP, CEP 01310-100</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Telefone & WhatsApp</h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        <a
                          href="tel:+551140028922"
                          className="hover:text-[#145A32] font-medium transition-colors"
                        >
                          +55 (11) 4002-8922
                        </a>
                      </p>
                      <p className="text-xs text-slate-500">Atendimento imediato via WhatsApp</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">E-mail Corporativo</h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        <a
                          href="mailto:contato@contabilidade5.com.br"
                          className="hover:text-[#145A32] font-medium transition-colors"
                        >
                          contato@contabilidade5.com.br
                        </a>
                      </p>
                      <p className="text-xs text-slate-500">Resposta em até 24h úteis</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        Horário de Funcionamento
                      </h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Segunda a Sexta-feira: 08h às 18h
                      </p>
                      <p className="text-xs text-slate-500">
                        Plantão fiscal em períodos de fechamento
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                  <ShieldCheck className="w-5 h-5 text-[#2ECC71] shrink-0" />
                  <span>
                    Todos os atendimentos seguem rigoroso padrão de sigilo e conformidade LGPD.
                  </span>
                </div>
              </div>

              {/* Mapa Embutido do Google Maps */}
              <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-sm">
                <div className="mb-3 px-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Localização no mapa
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    Av. Paulista, 1000 — São Paulo/SP
                  </p>
                </div>
                <div className="overflow-hidden rounded-[16px] border border-slate-200">
                  <iframe
                    title="Localização da Contabilidade 5.0 na Avenida Paulista"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1065934522434!2d-46.65390548440786!3d-23.564616284681695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%201000%20-%20Bela%20Vista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2001310-100!5e0!3m2!1spt-BR!2sbr!4v1690000000000!5m2!1spt-BR!2sbr"
                    width="100%"
                    height="320"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita: Card Entre em Contato com LeadForm e botão Voltar */}
            <div className="lg:col-span-6">
              <LeadForm onVoltar={handleVoltar} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
