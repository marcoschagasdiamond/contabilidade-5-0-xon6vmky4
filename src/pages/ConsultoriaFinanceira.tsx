import React from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Award,
  ArrowUpRight,
  Calculator,
  Receipt,
  Users,
  Cpu,
  BarChart3,
  Landmark,
  Compass,
  FileCheck2,
  SlidersHorizontal,
  Wallet,
  Activity,
  CalendarCheck2,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Briefcase,
} from 'lucide-react'

export default function ConsultoriaFinanceira() {
  // Os 5 pilares exigidos pelo usuário (tópico próprio no final)
  const pilaresConsultoria5 = [
    {
      id: 'modelo-financeiro-dinamico',
      icon: SlidersHorizontal,
      badge: 'Modelagem 5.0',
      title: 'Modelo financeiro dinâmico 5.0',
      description:
        'Construção de arquitetura financeira integrada com DRE projetada, balanço projetado e simulação contínua de cenários (otimista, base e conservador). Premissas operacionais conectadas ao caixa em tempo real, permitindo simulações de sensibilidade imediatas para cada decisão de investimento ou expansão.',
    },
    {
      id: 'readiness-credito-continuo',
      icon: ShieldCheck,
      badge: 'Elegibilidade Bancária',
      title: 'Readiness de crédito contínuo',
      description:
        'Auditoria e preparação permanente da saúde cadastral, contábil e fiscal da sua empresa para linhas bancárias e institucionais. Eliminação prévia de restrições, monitoramento de ratings internos de risco e alinhamento de índices de liquidez e endividamento exigidos pelos comitês de crédito.',
    },
    {
      id: 'radar-linhas-incentivos',
      icon: Landmark,
      badge: 'Inteligência de Funding',
      title: 'Radar de linhas e incentivos',
      description:
        'Mapeamento ativo e contínuo de oportunidades de funding estruturado — BNDES, FINEP, Pronampe, fundos setoriais, linhas de fomento regional e crédito com taxas subsidiadas. Seleção da melhor estrutura de custo de capital (WACC) para o momento da sua empresa, reduzindo juros abusivos.',
    },
    {
      id: 'painel-indices-pontos-criticos',
      icon: Activity,
      badge: 'Alertas Antecipados',
      title: 'Painel de índices e pontos críticos preditivo',
      description:
        'Cockpit visual com métricas vitais da saúde corporativa: prazos médios de recebimento (PMR), pagamento (PMP) e renovação de estoques (PME), ciclo operacional e financeiro, necessidade de capital de giro (NCG) e margens operacionais com faróis de alerta antes que a escassez de caixa aconteça.',
    },
    {
      id: 'dossie-digital-investibilidade',
      icon: FileCheck2,
      badge: 'Pronto para Aprovação',
      title: 'Dossiê digital de investibilidade',
      description:
        'Acervo documental técnico completo, padronizado e auditável nos formatos exigidos por bancos de atacado, agentes de fomento, investidores e auditorias externas. Apresentação profissional que acelera o trâmite de esteiras bancárias e eleva drasticamente a taxa de aprovação.',
    },
  ]

  // Benefícios estratégicos com cards Diamond
  const beneficios = [
    {
      icon: Landmark,
      title: 'Acesso a capital sob medida',
      desc: 'Mapeamento inteligente das melhores linhas bancárias e de fomento para seu porte, sem aceitar taxas abusivas ou garantias excessivas.',
    },
    {
      icon: TrendingUp,
      title: 'Modelo financeiro que convence',
      desc: 'Projeções orçamentárias robustas, fluxo de caixa detalhado e DRE analítica construídos na linguagem que bancos e investidores exigem.',
    },
    {
      icon: ShieldCheck,
      title: 'Estruturação de garantias inteligente',
      desc: 'Blindagem patrimonial dos sócios e otimização de recebíveis, fiduciárias e aval com dimensionamento correto do risco de crédito.',
    },
    {
      icon: FileCheck2,
      title: 'Dossiê pronto para aprovação',
      desc: 'Documentação financeira, contábil e societária unificada e validada, encurtando semanas de idas e vindas com analistas de crédito.',
    },
  ]

  // As 6 entregas da Consultoria Financeira Completa listadas pelo usuário
  const entregasConsultoria = [
    {
      id: 'bpo-financeiro',
      titulo: 'BPO Financeiro Completo',
      subtitulo: 'Operação diária terceirizada e auditável',
      descricao:
        'Contas a pagar, contas a receber e conciliação bancária diária executadas com rigor técnico, garantindo saldos 100% conciliados e fechamento sem divergências.',
      icon: Wallet,
      tag: 'Operação Diária',
    },
    {
      id: 'projecoes-fluxo-caixa',
      titulo: 'Projeções Orçamentárias & Fluxo de Caixa Projetado',
      subtitulo: 'Visão de futuro para antecipar movimentos',
      descricao:
        'Planejamento orçamentário anual e fluxo de caixa projetado diário/semanal/mensal para prevenir gaps de liquidez e programar expansões com tranquilidade.',
      icon: BarChart3,
      tag: 'Planejamento Preditivo',
    },
    {
      id: 'margem-ponto-equilibrio',
      titulo: 'Margem de Contribuição & Ponto de Equilíbrio',
      subtitulo: 'Rentabilidade real por produto, serviço e canal',
      descricao:
        'Precificação precisa, identificação de produtos deficitários, apuração exata do ponto de equilíbrio contábil/financeiro e maximização do lucro operacional.',
      icon: TrendingUp,
      tag: 'Rentabilidade',
    },
    {
      id: 'indices-pontos-criticos',
      titulo: 'Controle dos Índices Financeiros & Pontos Críticos',
      subtitulo: 'Monitoramento contínuo dos sinais vitais',
      descricao:
        'Acompanhamento rigoroso de liquidez corrente e seca, endividamento, rentabilidade sobre o PL (ROE), ciclo financeiro e alertas imediatos para pontos de vulnerabilidade.',
      icon: Activity,
      tag: 'Gestão de Risco',
    },
    {
      id: 'captacao-recursos-credito',
      titulo: 'Orientação para Captação de Recursos & Crédito Bancário',
      subtitulo: 'Captação estruturada como etapa estratégica integrada',
      descricao:
        'Captação de recursos e crédito bancário tratada com visão técnica de longo prazo: seleção das linhas ideais, negociação de spreads e garantias, e interlocução direta com agentes financeiros.',
      icon: Landmark,
      tag: 'Funding Estratégico',
    },
    {
      id: 'reunioes-mensais-consultor',
      titulo: 'Reuniões Mensais com Consultor Sênior',
      subtitulo: 'Aconselhamento estratégico contínuo com sócios',
      descricao:
        'Encontros mensais de governança com especialista financeiro sênior para analisar resultados, calibrar metas, revisar decisões táticas e orientar os próximos passos do negócio.',
      icon: CalendarCheck2,
      tag: 'Governança & Estratégia',
    },
  ]

  // Passo a passo em 3 fases com o texto exato do usuário
  const etapasImplantacao = [
    {
      passo: '01',
      fase: 'Fase 1',
      titulo: 'Diagnóstico & Base',
      texto: 'Mapeamento de riscos, análise de viabilidade e definição de estratégia de captação.',
    },
    {
      passo: '02',
      fase: 'Fase 2',
      titulo: 'Modelagem & Estrutura',
      texto: 'Construção do modelo financeiro, projeções e estruturação de garantias.',
    },
    {
      passo: '03',
      fase: 'Fase 3',
      titulo: 'Dossiê & Condução',
      texto: 'Preparação de documentação completa e apresentação aos agentes financeiros.',
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
                <PieChart className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Consultoria Financeira Estratégica Completa 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Muito além de planilhas isoladas: uma consultoria financeira completa de ponta a
                ponta que assume o BPO operacional, controla indicadores vitais, projeta cenários de
                caixa, orienta captação de crédito sob medida e acompanha a tomada de decisão com
                reuniões mensais de sócios.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Consultoria Financeira
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-consultoria-financeira"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-medium text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  Ver Pilares 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-white/20 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=financial%20analytics%20dashboard%20growth&color=emerald"
                  alt="Painel de Consultoria Financeira 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">
                    Gestão Financeira & BPO 360°
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. APRESENTAÇÃO CONSULTIVA & AS 6 ENTREGAS COMPLETAS */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-3">
              Consultoria Financeira Completa de Ponta a Ponta
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Do operacional ao estratégico: a captação de recursos como parte de um ecossistema
              sólido
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Não atuamos apenas quando a empresa precisa de dinheiro. Estruturamos a rotina
              financeira diária, eliminamos vazamentos de caixa, projetamos o crescimento
              sustentável e garantimos que sua empresa esteja sempre com elegibilidade máxima diante
              de bancos, fornecedores e investidores.
            </p>
          </div>

          {/* Grid das 6 entregas exigidas pelo usuário */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {entregasConsultoria.map((entrega) => {
              const EIcon = entrega.icon
              return (
                <div
                  key={entrega.id}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#145A32] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] transition-all flex items-center justify-center">
                        <EIcon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#145A32] bg-white px-2.5 py-1 rounded-full border border-emerald-200/80">
                        {entrega.tag}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-[#145A32] transition-colors">
                      {entrega.titulo}
                    </h3>
                    <p className="text-xs font-medium text-[#2ECC71] mb-3">{entrega.subtitulo}</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {entrega.descricao}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-[#145A32] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                    <span>Entrega garantida no escopo</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 4 Cards de Diferenciais Estratégicos */}
          <div className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                Diferenciais Estratégicos
              </span>
              <h3 className="font-heading font-bold text-2xl text-slate-900">
                Por que nossa consultoria transforma a realidade do seu caixa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {beneficios.map((b, idx) => {
                const BIcon = b.icon
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#2ECC71]/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center mb-5">
                        <BIcon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <h4 className="font-heading font-bold text-lg text-slate-900 mb-2">
                        {b.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comparativo: Tradicional vs Consultoria Financeira 5.0 */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  Financeiro Tradicional × Consultoria Financeira 5.0
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto a gestão financeira tradicional se limita a pagar contas no susto,
                  depender de planilhas desatualizadas e só procurar crédito em momentos de aperto
                  crítico, a Consultoria Financeira 5.0 estabelece uma rotina contínua de controle,
                  modelagem preditiva e prontidão para captação planejada nos momentos de menor
                  custo de capital.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>De contas pagas no improviso para BPO auditado e conciliação diária</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De busca desesperada por crédito para readiness bancário e captação planejada
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De solidão nas decisões para aconselhamento mensal direto com consultor sênior
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
                      BPO Financeiro integral (contas a pagar, a receber e conciliação bancária)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Fluxo de caixa projetado e orçamento empresarial atualizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Relatório mensal de margem de contribuição e ponto de equilíbrio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Painel preditivo de índices de liquidez, prazos médios e ciclo financeiro
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Orientação completa para captação de recursos e estruturação de garantias
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Reunião mensal executiva com consultor sênior para alinhamento estratégico
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA O PASSO A PASSO EM 3 FASES (TEXTO EXATO DO USUÁRIO) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo em 3 Fases
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona o processo de implantação e condução
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Metodologia estruturada que transforma a desordem do caixa em previsibilidade
              financeira e investibilidade real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {etapasImplantacao.map((etapa, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm relative group hover:border-[#2ECC71]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-extrabold font-heading text-[#2ECC71]">
                      {etapa.passo}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {etapa.fase}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-3 group-hover:text-[#145A32] transition-colors">
                    {etapa.titulo}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{etapa.texto}</p>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-[#2ECC71] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fase validada pela governança</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO NO FINAL DA PÁGINA: OS 5 PILARES DA CONSULTORIA FINANCEIRA 5.0 (TÓPICO PRÓPRIO DEDICADO) */}
      <section
        id="pilares-consultoria-financeira"
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
              <span>Consultoria Financeira 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares da Consultoria Financeira 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que registrar contas passadas: uma arquitetura de inteligência financeira
              orientada a dados, previsibilidade de caixa, investibilidade contínua e prontidão
              diante dos agentes econômicos.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresConsultoria5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresConsultoria5.length === 5

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
                      Incluso na Consultoria Financeira 5.0
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
                <PieChart className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para estruturar a Consultoria Financeira 5.0 na sua empresa?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  BPO completo, modelagem orçamentária preditiva, captação estratégica e consultor
                  sênior dedicado.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Especialistas Financeiros
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>

      {/* 5. NAVEGAÇÃO DE OUTROS SERVIÇOS DEDICADOS & CTA FINAL (ATALHOS CRUZADOS) */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">
                Conheça Mais Soluções Dedicadas
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Explore outros serviços estruturados no padrão 5.0
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
                to="/servicos/departamento-pessoal"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Users className="w-4 h-4 text-[#2ECC71]" />
                Departamento Pessoal 5.0
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
              Nossa equipe dimensiona o escopo ideal de BPO e consultoria financeira de acordo com o
              faturamento, volume de transações e momento estratégico da sua empresa.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor Financeiro
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
