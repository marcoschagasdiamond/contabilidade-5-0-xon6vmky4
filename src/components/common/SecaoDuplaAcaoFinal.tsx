import React, { useState } from 'react'
import LeadForm from '@/components/LeadForm'
import AgendamentoReuniao from '@/pages/Agendamento'

export type ModalidadeAcaoFinal = 'nenhuma' | 'proposta' | 'agendamento'

interface SecaoDuplaAcaoFinalProps {
  id?: string
  className?: string
  titulo?: string
  subtitulo?: string
  servicoPreselecionado?: string
  modoInicial?: ModalidadeAcaoFinal
}

/**
 * Seção de fechamento padrão Diamond Group para o final das páginas principais.
 * Apresenta duas opções executivas sem ícones:
 * 1. "Solicitar Proposta Personalizada" -> abre o LeadForm existente
 * 2. "Agende com um Especialista" -> abre o formulário "Agendar Reunião" do módulo de Agendamento
 * Ambos possuem botão "Voltar" que retorna à escolha das duas opções.
 * Todos os envios salvam na coleção leads com o tipo de solicitação identificado.
 */
export default function SecaoDuplaAcaoFinal({
  id = 'contato-especialista',
  className = '',
  titulo = 'Pronto para dar o próximo passo com a Contabilidade 5.0?',
  subtitulo = 'Escolha como prefere iniciar o atendimento com a liderança técnica da Diamond Group.',
  servicoPreselecionado = '',
  modoInicial = 'nenhuma',
}: SecaoDuplaAcaoFinalProps) {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<ModalidadeAcaoFinal>(modoInicial)

  // Atualiza se modoInicial mudar (ex: ao clicar em Contratar Serviço)
  React.useEffect(() => {
    if (modoInicial !== 'nenhuma') {
      setOpcaoSelecionada(modoInicial)
    }
  }, [modoInicial])

  const handleVoltar = () => {
    setOpcaoSelecionada('nenhuma')
  }

  return (
    <section id={id} className={`py-16 sm:py-20 scroll-mt-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {opcaoSelecionada === 'nenhuma' && (
          <div className="rounded-3xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-8 sm:p-12 border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative text-center max-w-3xl mx-auto space-y-4 mb-10">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-wider">
                ATENDIMENTO EXECUTIVO DIAMOND GROUP
              </span>
              <h2 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight leading-tight">
                {titulo}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{subtitulo}</p>
            </div>

            {/* As duas opções executivas - Padrão Diamond Group sem ícones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Opção 1: Solicitar Proposta Personalizada */}
              <div className="rounded-2xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 hover:border-[#D4AF37] p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider block">
                    OPÇÃO 1 • PROPOSTA COMERCIAL
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
                    Solicitar Proposta Personalizada
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Receba um plano estruturado sob medida para a sua operação, com dimensionamento
                    de escopo, honorários e diagnóstico preliminar sem compromisso.
                  </p>
                  <ul className="pt-2 space-y-1.5 text-xs text-slate-300 font-medium">
                    <li>• Dimensionamento preciso para o seu segmento</li>
                    <li>• Retorno em até 24 horas úteis</li>
                    <li>• Análise de enquadramento sem custo inicial</li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpcaoSelecionada('proposta')}
                    className="w-full py-3.5 px-6 rounded-xl font-heading font-bold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-center"
                  >
                    Solicitar Proposta Personalizada
                  </button>
                </div>
              </div>

              {/* Opção 2: Agende com um Especialista */}
              <div className="rounded-2xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 hover:border-[#D4AF37] p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider block">
                    OPÇÃO 2 • REUNIÃO ESTRATÉGICA
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
                    Agende com um Especialista
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Reserve uma sessão consultiva individual de 50 minutos com a liderança técnica
                    da Contabilidade 5.0 para sanar dúvidas complexas e definir prioridades.
                  </p>
                  <ul className="pt-2 space-y-1.5 text-xs text-slate-300 font-medium">
                    <li>• Atendimento exclusivo e individual</li>
                    <li>• Escolha de data e horário em tempo real</li>
                    <li>• Pauta direcionada às metas da sua empresa</li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpcaoSelecionada('agendamento')}
                    className="w-full py-3.5 px-6 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-center"
                  >
                    Agende com um Especialista
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODO FORMULÁRIO 1: LEADFORM EXISTENTE */}
        {opcaoSelecionada === 'proposta' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                  Solicitação de Proposta Personalizada
                </span>
                {servicoPreselecionado && (
                  <span className="text-xs text-slate-600">
                    Serviço de interesse:{' '}
                    <strong className="text-[#145A32]">{servicoPreselecionado}</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleVoltar}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all cursor-pointer shadow-sm"
              >
                Voltar
              </button>
            </div>
            <LeadForm onVoltar={handleVoltar} servicoPreselecionado={servicoPreselecionado} />
          </div>
        )}

        {/* MODO FORMULÁRIO 2: AGENDAMENTO REUNIÃO EXISTENTE */}
        {opcaoSelecionada === 'agendamento' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider">
                Agendamento de Reunião com Especialista
              </span>
              <button
                type="button"
                onClick={handleVoltar}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all cursor-pointer shadow-sm"
              >
                Voltar
              </button>
            </div>
            <AgendamentoReuniao onVoltar={handleVoltar} embedded={true} />
          </div>
        )}
      </div>
    </section>
  )
}
