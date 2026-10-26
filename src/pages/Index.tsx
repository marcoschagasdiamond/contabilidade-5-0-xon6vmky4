import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  Calculator,
  Receipt,
  Users,
  PieChart,
  ShieldAlert,
  Star,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Award,
  Headphones,
  GraduationCap,
  Briefcase,
} from 'lucide-react'
import LeadForm from '@/components/LeadForm'

export default function Index() {
  const navigate = useNavigate()

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

  const services = [
    {
      icon: Calculator,
      title: 'Contabilidade Digital',
      description:
        'Escrituração contábil completa, demonstrações financeiras e relatórios gerenciais inteligentes.',
      link: '/servicos/contabilidade-digital',
    },
    {
      icon: Receipt,
      title: 'Gestão Fiscal & Tributária',
      description:
        'Apuração de impostos, planejamento tributário e conformidade com o eSocial e SPED.',
      link: '/servicos/gestao-fiscal-tributaria',
    },
    {
      icon: Users,
      title: 'Departamento Pessoal',
      description:
        'Folha de pagamento, admissões, demissões e gestão de benefícios com pontualidade.',
      link: '/servicos/departamento-pessoal',
    },
    {
      icon: PieChart,
      title: 'Consultoria Financeira',
      description:
        'BPO financeiro completo, projeções orçamentárias, controle de índices vitais e orientação para captação de recursos.',
      link: '/servicos/consultoria-financeira',
    },
    {
      icon: ShieldCheck,
      title: 'Planejamento Sucessório e Estruturação Patrimonial',
      description:
        'Estruturação de empresas nacionais e internacionais para proteger seu patrimônio e garantir a continuidade do negócio entre gerações.',
      link: '/servicos/planejamento-sucessorio',
    },
    {
      icon: ShieldAlert,
      title: 'Assessoria Tributária Especializada',
      description:
        'Recuperação de créditos tributários, revisão de folha, negociação de dívida PGFN e defesa fiscal com auditoria de SPED.',
      link: '/servicos/assessoria-tributaria',
    },
    {
      icon: GraduationCap,
      title: 'Treinamento e Capacitação',
      description:
        'Projetos educacionais únicos sob medida, workshops sobre a Reforma Tributária e capacitação contábil e fiscal.',
      link: '/servicos/treinamento',
    },
    {
      icon: Briefcase,
      title: 'BPO Contábil 5.0',
      description:
        'Delegue a operação fiscal, folha, contas e faturamento para especialistas com tecnologia, alertas preditivos e painel em tempo real.',
      link: '/servicos/bpo-contabil',
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
          <div className="max-w-3xl flex flex-col items-start">
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
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl">
              Soluções completas em gestão contábil, fiscal e trabalhista com tecnologia avançada,
              automação e atendimento humano de verdade.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-6">
              <Link
                to="/diagnostico-configuracoes"
                className="px-7 py-4 rounded-xl font-heading font-bold text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_10px_30px_rgba(212,175,55,0.5)] transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center text-center cursor-pointer"
              >
                Fazer Diagnóstico Gratuito
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

      {/* NOVA SEÇÃO: SOBRE NÓS (#sobre) — Posicionada após a hero e parceiros, antes dos Serviços */}
      <section
        id="sobre"
        className="py-20 md:py-24 bg-gradient-to-b from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white relative overflow-hidden border-b border-[#D4AF37]/20"
      >
        {/* Glow de fundo Diamond Group (dourado e azul profundo) */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#1A365D] blur-3xl opacity-50 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#D4AF37] blur-3xl opacity-20 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:28px_28px]"
          aria-hidden="true"
        />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Coluna Esquerda: Apresentação da empresa e credenciais */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Diamond Group • Sobre Nós
              </div>

              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight mb-5">
                Inteligência contábil de vanguarda e rigor técnico para o seu negócio
              </h2>

              <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-6 font-normal">
                Com mais de 15 anos de atuação sólida e credenciamento ativo no CRC/CFC, a
                Contabilidade 5.0 une o rigor técnico da legislação brasileira à velocidade de
                automações inteligentes e análise de dados em tempo real. Nosso propósito é
                descomplicar a rotina fiscal e transformar a contabilidade de empresas em um motor
                estratégico de rentabilidade e governança.
              </p>

              {/* Grid dos 3 Diferenciais Diamond Group em destaque visual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Diferencial 1: Tecnologia */}
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3 group-hover:scale-110 transition-transform">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-white mb-1">
                    Tecnologia Avançada
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Integração bancária via API, leitura automatizada de XMLs e painéis financeiros
                    em tempo real.
                  </p>
                </div>

                {/* Diferencial 2: Conformidade Fiscal */}
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#2ECC71]/50 hover:bg-white/[0.08] transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/15 border border-[#2ECC71]/30 flex items-center justify-center text-[#2ECC71] mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-white mb-1">
                    Conformidade Fiscal
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Preparação total para a Reforma Tributária (IBS/CBS), SPED, eSocial e blindagem
                    jurídica.
                  </p>
                </div>

                {/* Diferencial 3: Atendimento Digital Humanizado */}
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3 group-hover:scale-110 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-white mb-1">
                    Atendimento Consultivo
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sem robôs impessoais: analistas e tributaristas seniores dedicados ao dia a dia
                    da sua empresa.
                  </p>
                </div>
              </div>

              {/* Botões de Ação na seção */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('servicos')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  Conhecer Nossos Serviços
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('contato')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-medium text-sm text-white border border-white/20 hover:border-white/50 hover:bg-white/10 transition-all duration-200"
                >
                  Falar com um Especialista
                </button>
              </div>
            </div>

            {/* Coluna Direita: Card de Credenciais Diamond Group */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.09] via-white/[0.05] to-white/[0.02] border border-[#D4AF37]/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
                {/* Header do Card */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                        Credenciais Diamond
                      </span>
                      <span className="font-heading font-bold text-base text-white">
                        Solidez & Reconhecimento
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30">
                    Ativo
                  </span>
                </div>

                {/* Lista de Credenciais */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        Registro CRC / CFC Regularizado
                      </span>
                      <span className="text-xs text-slate-300">
                        Responsáveis técnicos certificados pelo Conselho Regional de Contabilidade e
                        normas IFRS.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        15+ Anos de Experiência Corporativa
                      </span>
                      <span className="text-xs text-slate-300">
                        Histórico comprovado em reestruturações tributárias, defesas fiscais e
                        auditorias.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        +500 Empresas Atendidas em todo o Brasil
                      </span>
                      <span className="text-xs text-slate-300">
                        De scale-ups de tecnologia a indústrias, serviços e comércio de médio e
                        grande porte.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        100% de Sigilo e Conformidade LGPD
                      </span>
                      <span className="text-xs text-slate-300">
                        Criptografia de ponta a ponta e governança avançada na custódia de dados
                        fiscais.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selo inferior */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-[#D4AF37] font-semibold">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    Padrão de Excelência Diamond
                  </span>
                  <span className="text-slate-400">Desde 2010</span>
                </div>
              </div>
            </div>
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

          {/* Grid de 8 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                to="/diagnostico-configuracoes"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-heading font-bold text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_10px_30px_rgba(212,175,55,0.5)] transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer text-center"
              >
                <span>Fazer Diagnóstico Gratuito</span>
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

              {/* Prova Social / Depoimentos e Avaliações */}
              <div
                id="depoimentos"
                className="pt-8 border-t border-white/15 flex items-center gap-4 scroll-mt-24"
              >
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
