import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calculator,
  UserCheck,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PhoneCall,
} from 'lucide-react'
import { buildWhatsAppLink } from '@/config/empresa'

export interface SecaoFunilJornadaHomeProps {
  cadastroHref: string
}

export interface EtapaFunil {
  numero: number
  fase: string
  titulo: string
  subtitulo: string
  descricao: string
  icone: React.ComponentType<{ className?: string }>
  ctaTexto: string
  ctaTipo: 'link-interno' | 'link-externo' | 'scroll'
  ctaDestino: string
  ctaIcone: React.ComponentType<{ className?: string }>
  badgeCor: string
  destaqueBadge?: string
}

export const SecaoFunilJornadaHome = memo(function SecaoFunilJornadaHome({
  cadastroHref,
}: SecaoFunilJornadaHomeProps) {
  const etapas: EtapaFunil[] = [
    {
      numero: 1,
      fase: 'Problema',
      titulo: 'Descobriu o gargalo fiscal',
      subtitulo: 'A dor da contabilidade tradicional e impostos invisíveis',
      descricao:
        'Sua empresa paga guias todo mês sem saber se está no regime certo, acumula risco de autuação e perde créditos fiscais por falta de planejamento ativo e inteligência contábil.',
      icone: AlertTriangle,
      ctaTexto: 'Conhecer as Dores que Resolvemos',
      ctaTipo: 'scroll',
      ctaDestino: '#servicos',
      ctaIcone: ArrowRight,
      badgeCor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      destaqueBadge: 'Ponto de Partida',
    },
    {
      numero: 2,
      fase: 'Solução',
      titulo: 'Conheceu a Contabilidade 5.0',
      subtitulo: 'Consultoria estratégica + tecnologia + Reforma Tributária',
      descricao:
        'Muito além do DARF: contador sênior dedicado, plataforma em nuvem, diagnóstico comparativo Simples vs. Presumido vs. Real e adaptação imediata à LC 214/2025 (IBS/CBS/IS).',
      icone: Lightbulb,
      ctaTexto: 'Explorar Nossas Soluções',
      ctaTipo: 'link-interno',
      ctaDestino: '/servicos',
      ctaIcone: ArrowRight,
      badgeCor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      destaqueBadge: 'Evolução Contábil',
    },
    {
      numero: 3,
      fase: 'Provas',
      titulo: 'Viu resultados concretos',
      subtitulo: 'Mais de R$ 18,4 milhões mapeados e +450 empresas atendidas',
      descricao:
        'Casos reais auditados nos setores de tecnologia, indústria e atacado, com recuperação de créditos administrativos homologados e redução estrutural da carga tributária.',
      icone: CheckCircle2,
      ctaTexto: 'Ver Casos e Métricas Reais',
      ctaTipo: 'scroll',
      ctaDestino: '#depoimentos',
      ctaIcone: ArrowRight,
      badgeCor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      destaqueBadge: 'Comprovação',
    },
    {
      numero: 4,
      fase: 'Simulação',
      titulo: 'Simulou o impacto em segundos',
      subtitulo: 'Simulação Expressa e Calculadora IBS/CBS 2026–2033',
      descricao:
        'Estime imediatamente a faixa de economia anual da sua empresa na Simulação Expressa do topo da página ou aprofunde no simulador de regimes e transição.',
      icone: Calculator,
      ctaTexto: 'Acessar Calculadora IBS/CBS',
      ctaTipo: 'link-interno',
      ctaDestino: '/calculadora-ibs-cbs',
      ctaIcone: TrendingUp,
      badgeCor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      destaqueBadge: 'Resultado Imediato',
    },
    {
      numero: 5,
      fase: 'Cadastro',
      titulo: 'Cadastrou seus dados fiscais',
      subtitulo: 'Diagnóstico Tributário em 4 etapas guiadas',
      descricao:
        'Insira CNPJ ou faturamento em Dados da Empresa para cruzar CNAEs, anexos, alíquotas efetivas e gerar um parecer executivo consolidado da sua operação.',
      icone: UserCheck,
      ctaTexto: 'Iniciar Diagnóstico Tributário',
      ctaTipo: 'link-interno',
      ctaDestino: cadastroHref,
      ctaIcone: ArrowRight,
      badgeCor: 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/30',
      destaqueBadge: 'Diagnóstico 360°',
    },
    {
      numero: 6,
      fase: 'Especialista',
      titulo: 'Falou com o especialista sênior',
      subtitulo: 'Atendimento direto via WhatsApp e reunião técnica',
      descricao:
        'Conecte-se em minutos com nossos contadores e analistas pelo WhatsApp oficial (+55 41 97400-6290) ou envie os dados da sua empresa pelo formulário de contato.',
      icone: PhoneCall,
      ctaTexto: 'Falar no WhatsApp Agora',
      ctaTipo: 'link-externo',
      ctaDestino: buildWhatsAppLink(
        'Olá! Conheci o funil de 6 etapas da Contabilidade 5.0 e quero falar com um especialista sobre o enquadramento da minha empresa.',
      ),
      ctaIcone: MessageCircle,
      badgeCor: 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30',
      destaqueBadge: 'Canal Direto',
    },
  ]

  const handleScrollTo = (id: string) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      id="jornada-conversao"
      data-testid="secao-funil-jornada-home"
      className="py-20 md:py-28 bg-gradient-to-b from-[#0A1A13] via-[#0E281C] to-[#0A1A13] text-white relative overflow-hidden border-t border-white/10"
    >
      {/* Background glow decorativo */}
      <div
        className="absolute top-1/3 -left-48 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/3 -right-48 w-96 h-96 bg-[#145A32]/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#2ECC71]/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jornada de Transformação Contábil</span>
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
            O caminho claro para proteger o seu lucro em{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECC71] via-emerald-300 to-[#2ECC71]">
              6 etapas
            </span>
          </h2>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            Do diagnóstico das dores tributárias até a conversa com um contador consultor: veja como
            construímos a segurança fiscal e a economia contínua do seu negócio.
          </p>
        </div>

        {/* Grade do Funil: 6 Cards Conectados com Numeração Visual de Alto Impacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {etapas.map((etapa) => {
            const Icone = etapa.icone
            const CtaIcone = etapa.ctaIcone

            return (
              <div
                key={etapa.numero}
                data-testid={`etapa-funil-${etapa.numero}`}
                className="group relative bg-white/5 hover:bg-white/[0.08] backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-[#2ECC71]/50 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Linha superior: Marcador de Etapa + Badge de Fase */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#145A32] to-[#0A1A13] text-[#2ECC71] border border-[#2ECC71]/40 flex items-center justify-center font-heading font-black text-lg shadow-inner">
                        {etapa.numero}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                          Etapa {etapa.numero} de 6
                        </span>
                        <span className="text-xs font-bold text-[#2ECC71] uppercase tracking-wider">
                          {etapa.fase}
                        </span>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-[#2ECC71] group-hover:border-[#2ECC71]/30 transition-colors">
                      <Icone className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Título & Subtítulo */}
                  <h3 className="font-heading font-bold text-xl text-white mb-1.5 group-hover:text-[#2ECC71] transition-colors leading-snug">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs font-medium text-emerald-300/80 mb-3.5 leading-relaxed">
                    {etapa.subtitulo}
                  </p>

                  {/* Descrição Narrativa */}
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">{etapa.descricao}</p>
                </div>

                {/* Bloco do CTA da Etapa */}
                <div className="pt-4 border-t border-white/10">
                  {etapa.ctaTipo === 'link-interno' && (
                    <Link
                      to={etapa.ctaDestino}
                      data-testid={`cta-etapa-${etapa.numero}`}
                      className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 hover:bg-[#2ECC71] text-white hover:text-slate-950 font-heading font-bold text-xs uppercase tracking-wider border border-white/15 hover:border-[#2ECC71] transition-all group/btn shadow-sm"
                    >
                      <span>{etapa.ctaTexto}</span>
                      <CtaIcone className="w-4 h-4 text-[#2ECC71] group-hover/btn:text-slate-950 transition-colors group-hover/btn:translate-x-1" />
                    </Link>
                  )}

                  {etapa.ctaTipo === 'link-externo' && (
                    <a
                      href={etapa.ctaDestino}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`cta-etapa-${etapa.numero}`}
                      className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-heading font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all group/btn"
                    >
                      <span>{etapa.ctaTexto}</span>
                      <CtaIcone className="w-4 h-4 text-slate-950 transition-transform group-hover/btn:scale-110" />
                    </a>
                  )}

                  {etapa.ctaTipo === 'scroll' && (
                    <button
                      type="button"
                      onClick={() => handleScrollTo(etapa.ctaDestino)}
                      data-testid={`cta-etapa-${etapa.numero}`}
                      className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 hover:bg-[#2ECC71] text-white hover:text-slate-950 font-heading font-bold text-xs uppercase tracking-wider border border-white/15 hover:border-[#2ECC71] transition-all group/btn cursor-pointer shadow-sm"
                    >
                      <span>{etapa.ctaTexto}</span>
                      <CtaIcone className="w-4 h-4 text-[#2ECC71] group-hover/btn:text-slate-950 transition-colors group-hover/btn:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Rodapé integrador da jornada: ponte para o formulário de contato e WhatsApp */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white/5 via-[#145A32]/40 to-white/5 border border-white/15 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-bold text-[#2ECC71] uppercase tracking-wider">
              Pronto para iniciar a sua jornada?
            </span>
            <p className="text-sm sm:text-base font-medium text-white">
              Em qualquer etapa, nossos contadores sêniores estão prontos para analisar o seu caso
              individual sem custos iniciais.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleScrollTo('#contato')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0A1A13] hover:bg-slate-100 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <span>Solicitar Análise no Formulário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={buildWhatsAppLink(
                'Olá! Gostaria de conversar com um especialista sobre a jornada tributária da minha empresa.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-slate-950 hover:bg-[#20ba59] font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SecaoFunilJornadaHome
