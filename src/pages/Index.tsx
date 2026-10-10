import React from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  Users,
  PieChart,
  FolderOpen,
  ShieldAlert,
  Star,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import LeadForm from '@/components/LeadForm'

export default function Index() {
  const partners = [
    'TechCorp',
    'InovaSoft',
    'GreenFarm',
    'LogiPrime',
    'VarejoMax',
    'AlphaFin',
    'Biotech Brasil',
    'UrbanLog',
  ]

  const monthlyBars = [
    { m: 'Jan', h: 45 },
    { m: 'Fev', h: 52 },
    { m: 'Mar', h: 58 },
    { m: 'Abr', h: 63 },
    { m: 'Mai', h: 70 },
    { m: 'Jun', h: 68 },
    { m: 'Jul', h: 76 },
    { m: 'Ago', h: 82 },
    { m: 'Set', h: 85 },
    { m: 'Out', h: 89 },
    { m: 'Nov', h: 94 },
    { m: 'Dez', h: 100 },
  ]

  const services = [
    {
      icon: Calculator,
      title: 'Contabilidade Digital',
      description:
        'Escrituração contábil completa, demonstrações financeiras e relatórios gerenciais inteligentes.',
      link: '/servicos#contabilidade-digital',
    },
    {
      icon: Receipt,
      title: 'Gestão Fiscal',
      description:
        'Apuração de impostos, planejamento tributário e conformidade com o eSocial e SPED.',
      link: '/servicos#gestao-fiscal',
    },
    {
      icon: Users,
      title: 'Departamento Pessoal',
      description:
        'Folha de pagamento, admissões, demissões e gestão de benefícios com pontualidade.',
      link: '/servicos#departamento-pessoal',
    },
    {
      icon: PieChart,
      title: 'Consultoria Financeira',
      description:
        'Análise de indicadores, fluxo de caixa e planejamento financeiro estratégico para tomada de decisão.',
      link: '/servicos#consultoria-financeira',
    },
    {
      icon: FolderOpen,
      title: 'Abertura de Empresa',
      description:
        'Abertura, alteração e regularização de empresas com agilidade, sem burocracia e com segurança jurídica.',
      link: '/servicos#abertura-de-empresa',
    },
    {
      icon: ShieldAlert,
      title: 'Assessoria Tributária',
      description:
        'Defesa em processos fiscais, recuperação de créditos tributários e auditoria preventiva.',
      link: '/servicos#assessoria-tributaria',
    },
  ]

  const testimonials = [
    {
      quote:
        'A Contabilidade 5.0 simplificou nossa rotina fiscal. Economizamos horas de trabalho e temos certeza de que estamos 100% dentro da lei.',
      author: 'Ana Beatriz',
      role: 'CEO da TechCorp',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=12',
    },
    {
      quote:
        'A equipe é incrivelmente atenciosa. Sempre disponível para tirar dúvidas e oferecer as melhores soluções.',
      author: 'Carlos Mendes',
      role: 'Diretor Financeiro da LogiPrime',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=34',
    },
    {
      quote:
        'O dashboard em tempo real mudou a forma como gerenciamos o financeiro. Recomendo a todo empresário que quer crescer com segurança.',
      author: 'Juliana Costa',
      role: 'Fundadora da GreenFarm',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=56',
    },
  ]

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="overflow-hidden">
      {/* 1. SEÇÃO HERO */}
      <section
        id="inicio"
        className="relative min-h-screen pt-28 pb-20 md:py-36 flex items-center bg-gradient-to-r from-[#0A1A13] via-[#0D2A1C] to-[#145A32] text-white"
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        {/* Ambient glow */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#145A32]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Coluna Esquerda: Conteúdo */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Badge com efeito de brilho */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2ECC71]/40 bg-[#145A32]/50 text-xs sm:text-sm font-medium text-emerald-300 mb-6 backdrop-blur-md shadow-sm relative overflow-hidden group">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-ping" />
                <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span className="relative z-10">Contabilidade 5.0 para o seu negócio digital</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* H1 */}
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[48px] leading-[1.15] text-white tracking-tight mb-6">
                Contabilidade que{' '}
                <span className="text-[#2ECC71] underline decoration-[#2ECC71]/30 underline-offset-4">
                  impulsiona
                </span>{' '}
                a era{' '}
                <span className="text-[#2ECC71] underline decoration-[#2ECC71]/30 underline-offset-4">
                  digital
                </span>{' '}
                do seu negócio
              </h1>

              {/* Subtítulo */}
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-xl">
                Soluções completas em gestão contábil, fiscal e trabalhista com tecnologia avançada,
                automação e atendimento humano de verdade.
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-6">
                <Link
                  to="/diagnostico"
                  className="px-7 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] hover:shadow-[0_10px_30px_rgba(46,204,113,0.55)] transition-all duration-200 hover:-translate-y-1 btn-press flex items-center justify-center gap-2"
                >
                  Fazer Diagnóstico Tributário
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('servicos')}
                  className="px-7 py-4 rounded-xl font-heading font-medium text-base text-white border border-white/30 hover:border-white hover:bg-white hover:text-[#145A32] transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  Conhecer Serviços
                </button>
              </div>

              {/* Chamada sutil para a série do blog e calculadora */}
              <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Reforma 2026:
                </span>
                <Link
                  to="/blog/apresentamos-a-calculadora-ibs-cbs-simule-o-impacto"
                  className="hover:text-white underline underline-offset-2 decoration-[#D4AF37]/50"
                >
                  Conheça a Calculadora IBS/CBS no Blog
                </Link>
                <span>•</span>
                <Link
                  to="/blog"
                  className="text-emerald-300 hover:text-white underline underline-offset-2"
                >
                  Ver série completa (5 partes) →
                </Link>
              </div>

              {/* Barra de Confiança */}
              <div className="pt-6 border-t border-white/10 w-full flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  </div>
                  <span>Proteção de dados LGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  </div>
                  <span>Certificação Digital</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  </div>
                  <span>Atendimento em até 24h</span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Card de Projeção / Mini Dashboard */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-[24px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)] animate-float">
                {/* Header do Card */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Painel Contábil 5.0
                    </span>
                    <h3 className="font-heading font-bold text-lg text-white">
                      Resumo Financeiro de Dezembro
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30">
                    Ao Vivo
                  </span>
                </div>

                {/* Três Métricas Principais */}
                <div className="space-y-3 mb-6">
                  {/* Receita */}
                  <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 block">Receita Bruta</span>
                      <span className="font-heading font-bold text-xl text-white">R$ 320.500</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#2ECC71] bg-[#2ECC71]/15 px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+12,5% vs. Nov</span>
                    </div>
                  </div>

                  {/* Despesas */}
                  <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 block">Despesas Operacionais</span>
                      <span className="font-heading font-bold text-xl text-white">R$ 145.200</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-3,2% economia</span>
                    </div>
                  </div>

                  {/* Lucro Líquido */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#2ECC71]/20 to-transparent border border-[#2ECC71]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-200 block">Lucro Líquido Real</span>
                      <span className="font-heading font-bold text-xl text-[#2ECC71]">
                        R$ 175.300
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#2ECC71] bg-[#2ECC71]/20 px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+28,4% YTD</span>
                    </div>
                  </div>
                </div>

                {/* Mini Gráfico de Barras (12 barras de Jan a Dez) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Evolução de Faturamento Anual</span>
                    <span className="text-emerald-400 font-medium">Jan — Dez</span>
                  </div>
                  <div className="h-24 flex items-end justify-between gap-1.5 pt-2 border-b border-white/10 pb-1">
                    {monthlyBars.map((bar) => (
                      <div key={bar.m} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t transition-all duration-300 bg-gradient-to-t from-[#145A32] to-[#2ECC71] group-hover:brightness-125"
                          style={{ height: `${bar.h}%` }}
                          title={`${bar.m}: ${bar.h}%`}
                        />
                        <span className="text-[9px] text-slate-400 uppercase">{bar.m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
                    Conformidade Fiscal 100%
                  </span>
                  <span>SPED & eSocial Ok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FAIXA DE PARCEIROS (MARQUEE) */}
      <section
        className="py-8 bg-[#0D2218] border-y border-white/10 overflow-hidden"
        aria-label="Empresas parceiras e clientes atendidos"
      >
        <div className="max-w-[1200px] mx-auto px-4 mb-3 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Empresas que confiam na Contabilidade 5.0
          </p>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="animate-marquee flex items-center gap-16 text-slate-400 font-heading font-semibold text-xl tracking-wider select-none">
            {/* Primeira lista */}
            {partners.map((partner, index) => (
              <span
                key={`p1-${index}`}
                className="hover:text-[#2ECC71] transition-colors cursor-default"
              >
                {partner}
              </span>
            ))}
            {/* Duplicata para loop contínuo */}
            {partners.map((partner, index) => (
              <span
                key={`p2-${index}`}
                className="hover:text-[#2ECC71] transition-colors cursor-default"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE SERVIÇOS (#servicos) */}
      <section id="servicos" className="py-24 bg-white text-slate-900">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-3">
              Nossos Serviços
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-[32px] tracking-tight text-slate-900 mb-4">
              Soluções Completas para o seu Negócio
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Combinamos tecnologia de ponta e especialistas dedicados para descomplicar todas as
              frentes contábeis, tributárias e operacionais da sua empresa.
            </p>
          </div>

          {/* Grid de 6 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, idx) => {
              const IconComp = srv.icon
              return (
                <div
                  key={srv.title}
                  className="group relative p-8 rounded-[16px] bg-white border border-[#E5E7EB] hover:border-[#2ECC71]/50 hover:shadow-[0_20px_40px_rgba(16,53,31,0.1)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div>
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] group-hover:shadow-md">
                      <IconComp className="w-7 h-7 stroke-[2]" />
                    </div>

                    <h3 className="font-heading font-bold text-xl text-slate-900 mb-3 group-hover:text-[#145A32] transition-colors">
                      {srv.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{srv.description}</p>
                  </div>

                  <Link
                    to={srv.link}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#145A32] group-hover:text-[#2ECC71] transition-colors mt-auto"
                  >
                    Saiba mais detalhes
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Link para página completa */}
          <div className="text-center mt-12">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#145A32] hover:text-[#2ECC71] underline underline-offset-4 transition-colors"
            >
              Ver todos os detalhes e recursos de cada serviço
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO SOBRE NÓS (#sobre) */}
      <section
        id="sobre"
        className="py-24 bg-gradient-to-b from-[#F3F4F6] via-white to-white text-slate-900"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Coluna Esquerda: Imagem com moldura decorativa */}
            <div className="lg:col-span-5 relative">
              {/* Moldura absoluta verde decorativa */}
              <div
                className="absolute -top-4 -left-4 w-full h-full rounded-[28px] border-2 border-[#2ECC71] pointer-events-none -z-0 opacity-80"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#A3E4D7]/40 rounded-full blur-2xl -z-0 pointer-events-none"
                aria-hidden="true"
              />

              {/* Card de Imagem */}
              <div className="relative z-10 rounded-[24px] overflow-hidden shadow-2xl border border-slate-200 bg-white">
                <img
                  src="https://img.usecurling.com/p/800/900?q=modern%20accounting%20team%20office&color=emerald"
                  alt="Equipe da Contabilidade 5.0 em escritório moderno"
                  className="w-full h-[420px] object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A13]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <span className="text-xs font-semibold text-[#2ECC71] uppercase tracking-wider block">
                      Autoridade e Confiança
                    </span>
                    <p className="font-heading font-bold text-lg">
                      15+ anos transformando a contabilidade de empresas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Informações */}
            <div className="lg:col-span-7">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-3">
                Sobre a Contabilidade 5.0
              </span>

              <h2 className="font-heading font-bold text-3xl sm:text-[32px] leading-tight text-slate-900 tracking-tight mb-6">
                Mais de 15 anos de experiência, agora com a tecnologia do futuro
              </h2>

              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Nascemos para romper com a contabilidade tradicional, burocrática e lenta. Unimos a
                segurança jurídica e fiscal acumulada em mais de uma década à agilidade da automação
                de dados e dashboards em tempo real.
              </p>

              {/* 4 Diferenciais com Check verde */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Time multidisciplinar qualificado
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contadores, tributaristas e analistas dedicados.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Processos otimizados por automação
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Zero retrabalho e integração bancária ágil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Atendimento próximo e consultivo
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sem robôs frios: atendimento humano de verdade.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Relatórios em tempo real
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Indicadores claros para sua tomada de decisão.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Saiba Mais */}
              <div>
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Saiba Mais Sobre a Empresa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE DEPOIMENTOS (#depoimentos) */}
      <section id="depoimentos" className="py-24 bg-white text-slate-900">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-3">
              Depoimentos
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-[32px] tracking-tight text-slate-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Descubra por que mais de 500 empresas confiam na nossa equipe para gerenciar sua
              contabilidade e impulsionar seus resultados.
            </p>
          </div>

          {/* Grade 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item) => (
              <div
                key={item.author}
                className="p-8 rounded-[16px] bg-white border border-[#E5E7EB] hover:border-[#2ECC71]/50 hover:shadow-[0_20px_40px_rgba(16,53,31,0.08)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div>
                  {/* Avatar + Estrelas */}
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#2ECC71]"
                      loading="lazy"
                    />
                    <div>
                      {/* 5 Estrelas #F1C40F */}
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#F1C40F] text-[#F1C40F]" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Cliente Verificado
                      </span>
                    </div>
                  </div>

                  {/* Texto do Depoimento */}
                  <p className="text-slate-700 text-sm leading-relaxed italic mb-6">
                    "{item.quote}"
                  </p>
                </div>

                {/* Autoria */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-heading font-bold text-base text-slate-900">{item.author}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER CTA: DIAGNÓSTICO TRIBUTÁRIO */}
      <section className="py-14 bg-gradient-to-r from-[#0D2A1C] via-[#145A32] to-[#0A1A13] text-white relative overflow-hidden border-y border-white/10">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-white/[0.08] backdrop-blur-md rounded-[24px] p-8 sm:p-12 border border-white/15 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71]/30 text-xs font-bold text-[#2ECC71] uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Simulador Gratuito 2025
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                Descubra o melhor regime tributário para sua empresa
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                Simule em 4 etapas se o <strong>Simples Nacional</strong>,{' '}
                <strong>Lucro Presumido</strong> ou <strong>Lucro Real</strong> proporciona a menor
                carga fiscal e maior economia para o seu negócio.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-heading font-bold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] hover:shadow-[0_10px_30px_rgba(46,204,113,0.55)] transition-all duration-200 hover:-translate-y-0.5 btn-press whitespace-nowrap"
              >
                <span>Fazer Diagnóstico Agora</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA + FORMULÁRIO DE LEADS (#contato) */}
      <section
        id="contato"
        className="py-24 bg-gradient-to-br from-[#145A32] to-[#0A1A13] text-white relative overflow-hidden"
      >
        {/* Decorative blur spots */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#145A32]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Coluna Esquerda: Texto + Benefícios + Prova Social */}
            <div className="lg:col-span-6">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
                Fale com um Especialista
              </span>

              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[40px] leading-tight text-white tracking-tight mb-6">
                Pronto para modernizar sua contabilidade?
              </h2>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8">
                Preencha o formulário ao lado e um de nossos especialistas entrará em contato em até
                24 horas úteis.
              </p>

              {/* Benefícios com check */}
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <span className="text-slate-200 font-medium text-base">
                    Diagnóstico fiscal gratuito
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <span className="text-slate-200 font-medium text-base">
                    Proposta personalizada sem compromisso
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <span className="text-slate-200 font-medium text-base">
                    Acesso a um painel de indicadores
                  </span>
                </div>
              </div>

              {/* Prova Social */}
              <div className="pt-8 border-t border-white/15 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img
                    src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=77"
                    alt="Cliente 1"
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=88"
                    alt="Cliente 2"
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=99"
                    alt="Cliente 3"
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#F1C40F] text-[#F1C40F]" />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    +500 empresas atendidas em todo o Brasil
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formulário LeadForm */}
            <div className="lg:col-span-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
