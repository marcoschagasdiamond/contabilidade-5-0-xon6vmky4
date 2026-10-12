import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Clock,
  Award,
  ArrowUpRight,
  Calculator,
  Receipt,
  PieChart,
  GraduationCap,
  FileCheck2,
  ShieldAlert,
  Smartphone,
  CalendarClock,
  BarChart3,
  Cpu,
} from 'lucide-react'

export default function DepartamentoPessoal() {
  const pilaresDepartamentoPessoal5 = [
    {
      id: 'folha-digital-auditavel',
      icon: FileCheck2,
      badge: 'Fechamento 100% Digital',
      title: 'Folha 100% digital e auditável',
      description:
        'Fechamento com conferência automática, sem planilhas paralelas: cada rubrica rastreável, pronta para auditoria e para o holerite autoatendimento do colaborador. Precisão absoluta no cálculo de proventos, descontos e tributos sem retrabalho manual.',
    },
    {
      id: 'compliance-trabalhista-preditivo',
      icon: ShieldAlert,
      badge: 'eSocial Contínuo',
      title: 'Compliance trabalhista preditivo (eSocial contínuo)',
      description:
        'Envios eSocial, CTPS digital e DCTFWeb monitorados continuamente, com alerta antes do erro acontecer — não depois da notificação. Auditoria preventiva de eventos não periódicos, afastamentos, desligamentos e segurança da informação trabalhista.',
    },
    {
      id: 'portal-colaborador-admissao',
      icon: Smartphone,
      badge: 'Admissão sem Papel',
      title: 'Portal do colaborador e admissão sem papel',
      description:
        'Admissão, férias, atestados e alterações cadastrais resolvidos em fluxo digital com assinatura eletrônica, reduzindo e-mails e retrabalho do RH. O colaborador acessa comprovantes, informes de rendimentos e solicitações direto na palma da mão.',
    },
    {
      id: 'radar-prazos-obrigacoes',
      icon: CalendarClock,
      badge: 'Conformidade de Prazos',
      title: 'Radar de prazos e obrigações de pessoal',
      description:
        'Mapa vivo de FGTS, INSS, IRRF, férias vencidas e obrigações anuais (DIRF, RAIS/EFD-Reinf, CAGED), com faróis de vencimento — fim do "esquecemos a obrigação" e das multas por atraso nas guias e comunicações trabalhistas.',
    },
    {
      id: 'inteligencia-custo-folha',
      icon: BarChart3,
      badge: 'People Analytics',
      title: 'Inteligência de custo de folha (People Analytics)',
      description:
        'Dashboard com custo por headcount, horas extras, absenteísmo e provisões: o DP deixa de ser centro de custo opaco e vira área de decisão com números. Visão preditiva para contratações, reajustes coletivos e orçamento de pessoal.',
    },
  ]

  const beneficios = [
    {
      icon: Zap,
      title: 'Folha precisa e no prazo',
      desc: 'Cálculo automatizado e rigoroso de proventos, descontos, benefícios e guias trabalhistas (FGTS Digital, DCTFWeb e INSS), sem atrasos no fechamento.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero risco trabalhista',
      desc: 'Blindagem jurídica preventiva em convenções coletivas (CCT), banco de horas, intervalos e conformidade contínua com as normas do eSocial.',
    },
    {
      icon: TrendingUp,
      title: 'Autonomia para o colaborador',
      desc: 'Portal digital para consulta de holerites, informes de rendimento, marcação de férias e envio de atestados sem sobrecarregar o RH interno.',
    },
    {
      icon: Clock,
      title: 'Visão gerencial do custo de pessoal',
      desc: 'Relatórios claros de provisão de 13º e férias, turn-over, absenteísmo e People Analytics que ajudam a diretoria a tomar decisões com base em dados.',
    },
  ]

  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico da rotina de pessoal',
      texto:
        'Mapeamento completo dos contratos ativos, sindicatos de classe (CCT/ACT), plano de benefícios e histórico de eventos para sanear pendências anteriores.',
    },
    {
      passo: '02',
      titulo: 'Parametrização e migração da folha',
      texto:
        'Importação segura dos cadastros e tabelas de rubricas para nossa plataforma em nuvem, com validação de certificados digitais e histórico do eSocial.',
    },
    {
      passo: '03',
      titulo: 'Rotina digital e eSocial contínuo',
      texto:
        'Fechamento mensal automatizado, envio contínuo dos eventos ao eSocial, liberação do portal do colaborador e emissão rápida das guias de recolhimento.',
    },
    {
      passo: '04',
      titulo: 'Comitê e inteligência de custo',
      texto:
        'Apresentação de relatórios gerenciais periódicos, análises de headcount, acompanhamento de provisões trabalhistas e consultoria preventiva em legislação.',
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
                <Users className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Departamento Pessoal Estratégico 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Mais do que rodar folha de pagamento: uma infraestrutura digital de relações
                trabalhistas que zera multas do eSocial, automatiza a admissão à rescisão e
                transforma dados de pessoal em inteligência financeira para a gestão.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Departamento Pessoal 5.0
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-departamento-pessoal"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-medium text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  Ver Departamento Pessoal 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-white/20 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=human%20resources%20payroll%20analytics&color=emerald"
                  alt="Painel de Departamento Pessoal 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">
                    Rotina 100% Digital & eSocial
                  </span>
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
              Por que escolher nossa rotina de DP
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Uma abordagem consultiva para transformar a gestão de pessoas em tranquilidade
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Elimine o retrabalho de planilhas paralelas, o medo de passivos trabalhistas e as
              dúvidas recorrentes de colaboradores. Tenha uma equipe especializada operando ao lado
              do seu RH.
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

          {/* Comparativo: DP Tradicional vs DP 5.0 */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  DP Tradicional × Departamento Pessoal 5.0
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto o departamento pessoal tradicional opera no improviso — cobrando pontos
                  manuais, trocando planilhas inseguras por e-mail e respondendo a fiscalizações de
                  surpresa —, o DP 5.0 estabelece uma rotina sincronizada em nuvem, preditiva e com
                  autoatendimento inteligente para o colaborador.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De folha fechada no improviso para rotina-calendário com conferência
                      automática
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De colaborador ligando para saber de férias para portal digital self-service
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De multa descoberta na fiscalização para risco sinalizado e blindado antes
                    </span>
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
                    <span>
                      Processamento pontual da folha de pagamento, pró-labore e 13º salário
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Transmissão rigorosa de eventos ao eSocial, FGTS Digital e DCTFWeb</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Gestão completa de admissões, rescisões e homologações trabalhistas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Controle de períodos aquisitivos de férias e provisões contábeis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Portal do colaborador web e mobile para holerites e informes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA O PASSO A PASSO DE IMPLANTAÇÃO */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona a implantação do Departamento Pessoal 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Migração segura, sem qualquer interrupção no pagamento dos seus colaboradores e com
              auditoria prévia para blindar a sua empresa desde o primeiro mês.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasImplantacao.map((etapa, idx) => (
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

      {/* 4. SEÇÃO NO FINAL DA PÁGINA: OS 5 PILARES DO DEPARTAMENTO PESSOAL 5.0 (TÓPICO PRÓPRIO DEDICADO) */}
      <section
        id="pilares-departamento-pessoal"
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
              <span>Departamento Pessoal 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do Departamento Pessoal 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que processar holerites e apurar encargos: conheça os 5 pilares que integram
              compliance trabalhista preditivo, autosserviço moderno e controle estratégico do custo
              de pessoal.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresDepartamentoPessoal5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresDepartamentoPessoal5.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2ECC71]/60 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanTwo ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    {/* Topo do card: Ícone verde temático + Badge compacto */}
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
                      Incluso no Departamento Pessoal 5.0
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
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para migrar sua empresa para o Departamento Pessoal 5.0?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Conformidade trabalhista preditiva, admissão sem papel e suporte consultivo
                  especializado.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Especialistas em DP
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
                to="/servicos/contabilidade-digital"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Calculator className="w-4 h-4 text-[#2ECC71]" />
                Contabilidade Digital 5.0
              </Link>
              <Link
                to="/servicos/gestao-fiscal-tributaria"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Receipt className="w-4 h-4 text-[#2ECC71]" />
                Gestão Fiscal 5.0
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
              Nossa equipe dimensiona o escopo de departamento pessoal sob medida para o número de
              colaboradores, regime de contratação e particularidades sindicais da sua empresa.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor de DP
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
