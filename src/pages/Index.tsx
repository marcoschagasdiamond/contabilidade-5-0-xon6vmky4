import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ArrowRight, ShieldCheck, CheckCircle2, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import WidgetSimulacaoExpressa from '@/components/home/WidgetSimulacaoExpressa'
const BannerOnboardingHome = lazy(() => import('@/components/home/BannerOnboardingHome'))

// Code splitting de componentes abaixo da dobra para otimizar First Contentful Paint / TBT da Home
const SecaoServicosHome = lazy(() => import('@/components/home/SecaoServicosHome'))
const SecaoDiferenciaisHome = lazy(() => import('@/components/home/SecaoDiferenciaisHome'))
const SecaoDepoimentosHome = lazy(() => import('@/components/home/SecaoDepoimentosHome'))
const SecaoFunilJornadaHome = lazy(() => import('@/components/home/SecaoFunilJornadaHome'))
const SecaoBannerDiagnosticoHome = lazy(
  () => import('@/components/home/SecaoBannerDiagnosticoHome'),
)
const SecaoContatoHome = lazy(() => import('@/components/home/SecaoContatoHome'))
const SecaoCtaFinalHome = lazy(() => import('@/components/home/SecaoCtaFinalHome'))
const BotaoWhatsAppFlutuante = lazy(() => import('@/components/home/BotaoWhatsAppFlutuante'))

export default function Index() {
  const { isAuthenticated } = useAuth()

  // Se o usuário já estiver logado, vai direto ao formulário dos dados da empresa;
  // se estiver deslogado, vai para a tela de cadastro com redirect para manter a promessa em 4 etapas
  const bannerDiagnosticoHref = useMemo(
    () => (isAuthenticated ? '/dados-empresa' : '/cadastro?redirect=%2Fdados-empresa'),
    [isAuthenticated],
  )

  return (
    <div className="w-full">
      {/* BANNER DISCRETO DE ONBOARDING (só logado sem empresa e sem onboarding concluído/dispensado) */}
      <Suspense fallback={null}>
        <BannerOnboardingHome />
      </Suspense>

      {/* HERO SECTION — CARREGAMENTO IMEDIATO */}
      <section className="relative bg-[#0A1A13] text-white pt-24 pb-16 md:py-24 overflow-hidden border-b border-white/10">
        {/* Background glow effects */}
        <div
          className="absolute top-1/4 -left-48 w-96 h-96 bg-[#145A32]/40 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#2ECC71]/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#145A32]/60 border border-[#2ECC71]/30 text-[#2ECC71] text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse"></span>
                <span>A Nova Era da Gestão Fiscal & Contábil</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] text-white tracking-tight leading-[1.15]">
                Muito além de guias de impostos:{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECC71] via-emerald-300 to-[#2ECC71]">
                  Inteligência Tributária
                </span>{' '}
                que protege o seu lucro.
              </h1>

              {/* Subheadline */}
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                Atendimento consultivo, tecnologia em nuvem, diagnóstico prévio da Reforma
                Tributária e recuperação de créditos fiscais para empresas que querem crescer com
                segurança jurídica.
              </p>

              {/* Highlights list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200 text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Enquadramento tributário otimizado</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Auditoria e recuperação de créditos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Fechamento contábil e BPO financeiro</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Contador sênior dedicado à sua conta</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/servicos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all backdrop-blur-sm"
                >
                  <span>Conhecer Nossos Serviços</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/reforma-tributaria"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#2ECC71]/20 hover:bg-[#2ECC71]/30 text-[#2ECC71] font-semibold text-sm border border-[#2ECC71]/40 transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Guia da Reforma Tributária</span>
                </Link>
              </div>

              {/* Social Proof Mini Bar */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
                  <span>100% de Conformidade Fiscal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#2ECC71]" />
                  <span>Sigilo Absoluto dos Dados</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Interactive Widget — CARREGAMENTO IMEDIATO */}
            <div className="lg:col-span-5">
              <WidgetSimulacaoExpressa />
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÕES ABAIXO DA DOBRA COM SUSPENSE E CODE SPLITTING */}
      <Suspense fallback={<div className="min-h-[400px] bg-slate-50/70" />}>
        <SecaoServicosHome />
      </Suspense>

      <Suspense fallback={<div className="min-h-[300px] bg-white" />}>
        <SecaoDiferenciaisHome />
      </Suspense>

      <Suspense fallback={<div className="min-h-[400px] bg-slate-900" />}>
        <SecaoDepoimentosHome />
      </Suspense>

      {/* FUNIL NARRATIVO DE 6 ETAPAS — JORNADA DE CONVERSÃO COM CTA POR ETAPA */}
      <Suspense fallback={<div className="min-h-[500px] bg-[#0A1A13]" />}>
        <SecaoFunilJornadaHome cadastroHref={bannerDiagnosticoHref} />
      </Suspense>

      <Suspense fallback={<div className="min-h-[220px] bg-[#0A1A13]" />}>
        <SecaoBannerDiagnosticoHome bannerDiagnosticoHref={bannerDiagnosticoHref} />
      </Suspense>

      <Suspense fallback={<div className="min-h-[500px] bg-slate-50/70" />}>
        <SecaoContatoHome />
      </Suspense>

      <Suspense fallback={<div className="min-h-[300px] bg-[#0A1A13]" />}>
        <SecaoCtaFinalHome />
      </Suspense>

      {/* BOTÃO FLUTUANTE DE WHATSAPP (CARREGADO VIA LAZY SUSPENSE) */}
      <Suspense fallback={null}>
        <BotaoWhatsAppFlutuante />
      </Suspense>
    </div>
  )
}
