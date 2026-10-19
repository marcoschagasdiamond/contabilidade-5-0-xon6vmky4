import React from 'react'
import { Link } from 'react-router-dom'
import {
  Calculator,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Repeat,
  BarChart3,
  Boxes,
  Globe2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Clock,
  Award,
  ArrowUpRight,
  Users,
  Receipt,
  PieChart,
  ShieldAlert,
  GraduationCap,
  Briefcase,
} from 'lucide-react'

export default function ContabilidadeDigital() {
  const pilaresContabilidade5 = [
    {
      id: 'balanco-dre',
      icon: FileSpreadsheet,
      badge: 'Fechamento Mensal',
      title: 'Balanço Patrimonial e DRE mensais digitalizados',
      description:
        'Demonstrações contábeis completas, geradas e entregues todos os meses em ambiente digital — sem papéis, sem retrabalho e sempre prontas para sócios, bancos e investidores. Sua empresa enxerga a própria saúde financeira com a regularidade que a decisão de negócio exige.',
    },
    {
      id: 'conciliacao-bancaria',
      icon: Repeat,
      badge: 'Automação Contábil',
      title: 'Conciliação bancária automatizada e sem papéis',
      description:
        'Movimento bancário e escrituração conversando automaticamente: cada entrada, saída e tarifa conferida por tecnologia, com divergências sinalizadas antes de virarem problema. O resultado é um fechamento mais rápido, confiável e auditável.',
    },
    {
      id: 'dashboard-kpis',
      icon: BarChart3,
      badge: 'Gestão em Tempo Real',
      title: 'Dashboard gerencial com indicadores-chave (KPIs)',
      description:
        'Os números que importam — margem, inadimplência, capital de giro, carga tributária — em um painel visual e atualizado, no computador ou no celular. Gestão que deixa de ser reativa: a informação chega antes da decisão, não depois.',
    },
    {
      id: 'controle-patrimonial',
      icon: Boxes,
      badge: 'Gestão de Ativos',
      title: 'Controle patrimonial e depreciação de ativos',
      description:
        'Registro e acompanhamento completo do acervo de ativos da empresa, com cálculo de depreciação em conformidade fiscal e contábil. Você sabe exatamente o que possui, quanto vale e quanto cada bem gera de benefício fiscal — evitando distorções no resultado e no imposto.',
    },
    {
      id: 'relatorios-ifrs',
      icon: Globe2,
      badge: 'Padrão Internacional',
      title: 'Emissão de relatórios em conformidade com as normas IFRS',
      description:
        'Relatórios elaborados segundo os padrões internacionais de contabilidade (IFRS), prontos para investidores, auditorias externas, créditos no exterior e estruturas societárias. Sua contabilidade fala o idioma do mercado global — sem precisar refazer nada depois.',
    },
  ]

  const beneficios = [
    {
      icon: Zap,
      title: 'Velocidade & Precisão',
      desc: 'Integração direta com extratos bancários e sistemas de gestão (ERP), eliminando digitações manuais e reduzindo o tempo de fechamento contábil a poucos dias.',
    },
    {
      icon: ShieldCheck,
      title: 'Rigor Técnico & CRC',
      desc: 'Equipe de contadores seniores com registro ativo no CRC/CFC, aplicando as normas contábeis brasileiras (NBC) e internacionais (IFRS) com total conformidade.',
    },
    {
      icon: TrendingUp,
      title: 'Inteligência Financeira',
      desc: 'Mais que guias de impostos: relatórios gerenciais, análise vertical e horizontal da DRE e balanços que apontam onde cortar custos e como elevar sua margem.',
    },
    {
      icon: Clock,
      title: 'Atendimento Consultivo',
      desc: 'Contador dedicado que conhece a fundo seu negócio, disponível por WhatsApp, videochamada e e-mail com resposta em até 24 horas úteis.',
    },
  ]

  const etapasMigracao = [
    {
      passo: '01',
      titulo: 'Diagnóstico & Onboarding',
      texto:
        'Mapeamos seus sistemas atuais, plano de contas e rotinas financeiras para construir uma integração sem atritos.',
    },
    {
      passo: '02',
      titulo: 'Integração de Dados',
      texto:
        'Conectamos extratos bancários em OFX/API, emissores de notas fiscais e sistemas de cobrança em nuvem.',
    },
    {
      passo: '03',
      titulo: 'Fechamento Contábil Regular',
      texto:
        'Todos os meses sua empresa recebe balancetes, DRE analítica e painel de indicadores sem atrasos.',
    },
    {
      passo: '04',
      titulo: 'Reunião Estratégica',
      texto:
        'Apresentação dos resultados trimestrais com recomendações de governança, tributação e saúde de caixa.',
    },
  ]

  return (
    <div className="pt-24 pb-20">
      {/* 1. HERO COM GRADIENTE DIAMOND GROUP */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#145A32]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* Navegação de retorno */}
          <div className="mb-6">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar para Todos os Serviços
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-5 backdrop-blur-sm">
                <Calculator className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Contabilidade Digital Inteligente para Empresas Modernas
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                A escrituração contábil moderna vai muito além do cumprimento de obrigações legais.
                Processamos seus dados com tecnologia analítica, entregando balanços, DREs e
                relatórios de fluxo de caixa que oferecem clareza imediata sobre a saúde financeira
                do seu negócio.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Contabilidade Digital
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-contabilidade-digital"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-medium text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  Ver Contabilidade Digital 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-white/20 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=digital%20accounting%20dashboard%20laptop&color=emerald"
                  alt="Painel de Contabilidade Digital 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">Integração 100% Digital</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VISÃO GERAL DO SERVIÇO & DIFERENCIAIS */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-3">
              Por que escolher nossa escrituração
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Uma abordagem consultiva para transformar seus números em resultado
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Elimine pilhas de papel, atrasos no envio de guias e demonstrativos confusos. Tenha
              uma equipe contábil focada em antecipar cenários e blindar sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, idx) => {
              const BIcon = b.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#145A32] flex items-center justify-center mb-5">
                      <BIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                      {b.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparativo: Tradicional vs Digital 5.0 */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  A contabilidade como parceira estratégica do seu crescimento
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto a contabilidade tradicional se limita a emitir guias tributárias dias
                  antes do vencimento, a Contabilidade Digital opera integrada à sua rotina,
                  fornecendo visão gerencial mensal para apoiar decisões operacionais e financeiras.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>Redução de até 80% do tempo gasto enviando documentos</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>Fechamento mensal consistente com conciliação bancária auditável</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>Conformidade com padrões internacionais de contabilidade (IFRS)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-heading font-bold text-base text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  O que está incluso no pacote mensal:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Escrituração Contábil Digital (ECD / ECF via SPED)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Demonstração do Resultado do Exercício (DRE) analítica e sintética</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Balanço Patrimonial completo e Demonstração de Fluxo de Caixa (DFC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Controle de Ativo Imobilizado e cálculo mensal de depreciação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Acompanhamento para obtenção e renovação de CNDs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA O PROCESSO DE MIGRAÇÃO */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona a transição para a nossa contabilidade
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Migração simples, sem risco de interrupção operacional e com suporte completo da nossa
              equipe em cada etapa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasMigracao.map((etapa, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group hover:border-[#2ECC71]/50 transition-all"
              >
                <div className="text-3xl font-extrabold font-heading text-[#2ECC71] mb-3">
                  {etapa.passo}
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                  {etapa.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{etapa.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO NO FINAL DA PÁGINA: CONTABILIDADE DIGITAL 5.0 (COMO OUTRO ASSUNTO / TÓPICO DEDICADO) */}
      <section
        id="pilares-contabilidade-digital"
        className="py-20 bg-gradient-to-b from-[#0A1A13] via-[#0E2E1E] to-[#0A1A13] text-white relative overflow-hidden border-t-2 border-[#2ECC71]/30"
      >
        {/* Efeitos de iluminação ambiente Diamond Group */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-10 w-96 h-96 bg-[#145A32]/30 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          {/* Cabeçalho da seção adicional */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Contabilidade Digital 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares da contabilidade moderna e orientada a dados
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que cumprir prazos fiscais: conheça a infraestrutura tecnológica que
              transforma dados bancários e contábeis em inteligência para a tomada de decisão em
              tempo real.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto visível */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresContabilidade5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresContabilidade5.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2ECC71]/60 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanTwo ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    {/* Topo do card: Ícone + Badge compacto */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/15 border border-[#2ECC71]/30 flex items-center justify-center text-[#2ECC71] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] transition-all duration-300 group-hover:scale-105 shadow-sm">
                        <ItemIcon className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                    </div>

                    {/* Título do Card */}
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-3 group-hover:text-[#2ECC71] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Texto completo VISÍVEL — sem tooltip */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Detalhe de acabamento inferior */}
                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#2ECC71] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Incluso na Contabilidade Digital
                    </span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Faixa complementar de chamada integrada */}
          <div className="mt-12 p-6 sm:p-8 rounded-[20px] bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/20 text-[#2ECC71] flex items-center justify-center shrink-0">
                <Calculator className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para migrar sua empresa para a Contabilidade 5.0?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Processo de transição 100% digital, sem interrupção na sua rotina e com suporte
                  dedicado.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Especialistas
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>

      {/* 5. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">
                Conheça Mais Soluções
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Precisa de outras especialidades contábeis ou tributárias?
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/servicos/gestao-fiscal-tributaria"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Receipt className="w-4 h-4 text-[#2ECC71]" />
                Gestão Fiscal 5.0
              </Link>
              <Link
                to="/servicos/departamento-pessoal"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Users className="w-4 h-4 text-[#2ECC71]" />
                Departamento Pessoal 5.0
              </Link>
              <Link
                to="/servicos/consultoria-financeira"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <PieChart className="w-4 h-4 text-[#2ECC71]" />
                Consultoria Financeira 5.0
              </Link>
              <Link
                to="/servicos/planejamento-sucessorio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
                Planejamento Sucessório 5.0
              </Link>
              <Link
                to="/servicos/assessoria-tributaria"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-[#2ECC71]" />
                Assessoria Tributária 5.0
              </Link>
              <Link
                to="/servicos/treinamento"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-[#2ECC71]" />
                Treinamento 5.0
              </Link>
              <Link
                to="/servicos/bpo-contabil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Briefcase className="w-4 h-4 text-[#2ECC71]" />
                BPO Contábil 5.0
              </Link>
              <Link
                to="/servicos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
              >
                Ver Todos os Serviços
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="text-center pt-12 max-w-xl mx-auto">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
              Solicite uma proposta personalizada
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Nossa equipe dimensiona o escopo ideal de acordo com o porte, faturamento e segmento
              da sua empresa.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
