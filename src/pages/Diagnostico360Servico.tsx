import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowUpRight,
  Calculator,
  Receipt,
  Users,
  PieChart,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react'

export default function Diagnostico360Servico() {
  // Os 5 pilares 5.0 da metodologia Diagnóstico 360° (SEM ÍCONES nos cards de pilares/opções)
  const pilaresDiagnostico5 = [
    {
      id: 'matriz-7-riscos',
      badge: 'Visão Holística',
      title: 'Matriz dos 7 Riscos Integrados',
      description:
        'Auditoria profunda e simultânea das 7 dimensões críticas da empresa: tributária, fiscal, financeira, contábil, jurídica, operacional e humana, eliminando pontos cegos entre departamentos.',
    },
    {
      id: 'priorizacao-impacto-esforco',
      badge: 'Eficiência de Capital',
      title: 'Priorização por Impacto × Risco × Esforço',
      description:
        'Classificação analítica de cada vulnerabilidade mapeada, destacando intervenções de liberação imediata de liquidez (quick wins) para financiar com o próprio caixa as etapas de governança de médio prazo.',
    },
    {
      id: 'laudo-executivo-conclusivo',
      badge: 'Rigor Técnico & CRC',
      title: 'Laudo Executivo & Parecer Conclusivo',
      description:
        'Dossiê técnico com fundamentação legal, análise de balanços, memória de cálculo de créditos e contingências ocultas, pronto para deliberação da diretoria executiva, conselho e comitês.',
    },
    {
      id: 'base-reforma-tributaria',
      badge: 'Transição 2026–2033',
      title: 'Modelagem para o Novo Código (IBS/CBS/IS)',
      description:
        'Diagnóstico de aderência à Reforma Tributária (EC 132/2023 e LC 214/2025): simulação de impacto na cadeia de suprimentos, regras de split payment, não-cumulatividade e adequação de ERPs.',
    },
    {
      id: 'governanca-blindagem',
      badge: 'Perenidade & Valor',
      title: 'Roadmap de Governança e Blindagem Patrimonial',
      description:
        'Recomendações estruturais para segregação de riscos entre operação e patrimônio pessoal dos sócios, comitê permanente de transição fiscal e implementação de procedimentos padrão (POPs).',
    },
  ]

  // 4 Benefícios Estratégicos (SEM ÍCONES)
  const beneficios = [
    {
      badge: 'Benefício 01',
      title: 'Estancamento Imediato de Riscos Latentes',
      desc: 'Identificação prévia de passivos fiscais, tributários e trabalhistas antes de virarem autuações, execuções ou bloqueios operacionais.',
    },
    {
      badge: 'Benefício 02',
      title: 'Injeção Rápida de Liquidez e Caixa',
      desc: 'Mapeamento de créditos tributários pagos a maior nos últimos 60 meses e oportunidades legais de revisão de regimes que reduzem o custo fiscal.',
    },
    {
      badge: 'Benefício 03',
      title: 'Decisões Estratégicas Baseadas em Dados',
      desc: 'Substituição de achismos ou intuições por indicadores fidedignos de margem, endividamento, rentabilidade real e contingências corporativas.',
    },
    {
      badge: 'Benefício 04',
      title: 'Preparação Antecipada para a Reforma Tributária',
      desc: 'Simulação completa da transição do IBS, CBS e Imposto Seletivo sobre o modelo de negócio, evitando perda de competitividade e surpresas no caixa.',
    },
  ]

  // 4 Etapas da Aplicação da Metodologia
  const etapasAplicacao = [
    {
      passo: '01',
      titulo: 'Aplicação da Matriz dos 7 Riscos',
      texto:
        'Coleta de dados da empresa, análise de SPEDs, certidões, balanços, contratos e aplicação do questionário diagnóstico estruturado nas 7 frentes.',
    },
    {
      passo: '02',
      titulo: 'Análise Técnica & Cruzamento de Dados',
      texto:
        'Auditoria cruzada com os parâmetros da legislação tributária vigente, normas NBC/IFRS e simulações do novo sistema tributário (IBS/CBS).',
    },
    {
      passo: '03',
      titulo: 'Laudo Executivo & Dossiê Técnico',
      texto:
        'Consolidação do diagnóstico em relatório executivo com mapa de calor dos riscos, fundamentação jurídica e oportunidades de economia.',
    },
    {
      passo: '04',
      titulo: 'Plano de Ação Priorizado',
      texto:
        'Apresentação à diretoria de cronograma com ações divididas em Liquidez Rápida (30-60 dias), Governança (60-120 dias) e Transição Tributária.',
    },
  ]

  // As 7 frentes da matriz para destaque informativo
  const frentesMatriz = [
    {
      nome: 'Risco Tributário',
      foco: 'Regime vigente, créditos a recuperar e projeção do IBS/CBS/IS',
    },
    {
      nome: 'Risco Fiscal',
      foco: 'Conformidade de SPED, DCTFWeb, eSocial e malha fina digital',
    },
    {
      nome: 'Risco Financeiro',
      foco: 'Capital de giro, custos de dívida, margem e impacto de split payment',
    },
    {
      nome: 'Risco Contábil',
      foco: 'Fidedignidade de balanço, distribuição de lucros e IFRS',
    },
    {
      nome: 'Risco Jurídico / Cível',
      foco: 'Blindagem do patrimônio dos sócios, passivos e contratos',
    },
    {
      nome: 'Risco Trabalhista / Societário',
      foco: 'Governança societária, acordo de quotistas e contingências de RH',
    },
    {
      nome: 'Risco Regulatório / Humano',
      foco: 'Capacitação técnica das equipes, processos e POPs fiscais',
    },
  ]

  return (
    <div className="pt-24 pb-20">
      {/* 1. HERO COM GRADIENTE DIAMOND GROUP (#0A1A13 → #0E3520 → #145A32) */}
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
                <span>Diagnóstico & Estratégia • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight">
                Diagnóstico 360°
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#2ECC71] mb-6 tracking-tight">
                Mapeamento dos 7 riscos críticos para proteger e expandir seu negócio
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                O Diagnóstico 360° é a avaliação corporativa mais completa do mercado, concebida sob
                o padrão Diamond Intelligence. Mapeamos com precisão cirúrgica a matriz dos 7 riscos
                da empresa — fiscal, tributária, trabalhista, societária, financeira, cível e
                regulatória — entregando um laudo executivo e um plano de ação priorizado para
                estancar vazamentos de caixa, blindar o patrimônio e preparar a operação para a
                Reforma Tributária (IBS/CBS).
              </p>

              {/* CTA DUPLO SOLICITADO */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Fale com um Especialista
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <Link
                  to="/diagnostico-360"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  Fazer o Diagnóstico 360° na plataforma
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-white/20 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=business%20diagnostic%20strategy%20executive%20meeting&color=emerald"
                  alt="Painel do Diagnóstico 360° Diamond Group"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/90 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
                  <span className="text-xs font-semibold">Matriz dos 7 Riscos Integrada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VISÃO GERAL & BENEFÍCIOS (SEM ÍCONES) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-3">
              Inteligência Estratégica
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Por que sua empresa precisa do Diagnóstico 360°
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              O diagnóstico precede a intervenção. Antes de alterar regimes, renegociar contratos ou
              reestruturar societariamente a operação, é indispensável enxergar com clareza o
              cenário real do negócio.
            </p>
          </div>

          {/* Grade de Benefícios SEM ÍCONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md mb-4">
                    {b.badge}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-2.5 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Destaque das 7 frentes da matriz de riscos SEM ÍCONES */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0A1A13] to-slate-900 text-white border border-white/10">
            <div className="max-w-3xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                Escopo Técnico da Avaliação
              </span>
              <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">
                A Matriz dos 7 Riscos Mapeados pela Diamond Intelligence
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Nenhum departamento é analisado isoladamente. Os 7 riscos conversam entre si para
                garantir que a otimização tributária não gere vulnerabilidade trabalhista ou que a
                pressão de caixa não comprometa o balanço.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {frentesMatriz.map((frente, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#2ECC71]/40 transition-colors"
                >
                  <div className="text-[11px] font-bold text-[#2ECC71] uppercase tracking-wider mb-1">
                    Dimensão 0{fIdx + 1}
                  </div>
                  <h4 className="font-heading font-bold text-base text-white mb-1">
                    {frente.nome}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{frente.foco}</p>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/30 flex flex-col justify-center">
                <div className="text-[11px] font-bold text-[#2ECC71] uppercase tracking-wider mb-1">
                  Resultado Integrado
                </div>
                <h4 className="font-heading font-bold text-base text-white mb-1">
                  Laudo Executivo & Parecer
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Visão consolidada com mapa de calor, matriz de priorização e roadmap executivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPARATIVO "SEM DIAGNÓSTICO × COM DIAGNÓSTICO 360°" */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30 mb-3">
              Comparativo de Gestão
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Sem diagnóstico × Com Diagnóstico 360°
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Veja a diferença entre operar na defensiva reagindo a problemas e gerir o negócio com
              previsibilidade, compliance e dados estratégicos na mesa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Coluna Sem Diagnóstico */}
            <div className="rounded-2xl p-8 bg-white/[0.03] border border-rose-500/20 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400 block mb-1">
                    Cenário Reativo
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">Sem Diagnóstico</h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Apagar incêndios constantemente:</strong>{' '}
                      decisões tomadas sob pressão de fiscalizações, multas surpresa ou
                      estrangulamentos inesperados de caixa.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Créditos fiscais esquecidos:</strong> impostos
                      pagos a maior por anos prescrevendo mensalmente sem aproveitamento legal pela
                      empresa.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Patrimônio pessoal exposto:</strong> ausência
                      de blindagem societária e contratual separando o legado da família do risco do
                      CNPJ.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Cegueira na Reforma Tributária:</strong> sem
                      simulação prévia do impacto do IBS/CBS e do split payment nos preços e na
                      margem.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-rose-300/80">
                Resultado: insegurança jurídica, perda contínua de caixa e vulnerabilidade perante o
                Fisco.
              </div>
            </div>

            {/* Coluna Com Diagnóstico 360° */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-2 border-[#2ECC71]/50 backdrop-blur-sm flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#2ECC71] text-[#0A1A13] text-[11px] font-bold uppercase tracking-wider shadow">
                Padrão Diamond Group
              </div>

              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2ECC71] block mb-1">
                    Gestão 5.0 Estruturada
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Com Diagnóstico 360°
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="text-[#2ECC71] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Prevenção e controle absoluto:</strong>{' '}
                      mapeamento completo dos 7 riscos com plano de ação em 3 vias executivas
                      claras.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2ECC71] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Injeção rápida de liquidez:</strong>{' '}
                      recuperação administrativa dos últimos 60 meses para oxigenar o fluxo de caixa
                      no curto prazo.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2ECC71] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Governança e proteção patrimonial:</strong>{' '}
                      estruturas sólidas (Holdings, acordos de sócios) separando o patrimônio dos
                      riscos do negócio.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2ECC71] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Prontidão para o Novo Código:</strong>{' '}
                      cronograma 2026–2033 pronto, contratos adaptados e ERP configurado para o IVA
                      Dual.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-emerald-300">
                Resultado: paz de espírito para o empresário, conformidade total e decisões baseadas
                em dados.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ETAPAS DA APLICAÇÃO (SEM ÍCONES) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Metodologia de Aplicação
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              As 4 etapas do Diagnóstico 360°
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Da coleta inicial de dados à entrega do plano de ação priorizado, conheça cada fase do
              processo consultivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasAplicacao.map((etapa, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group hover:border-[#2ECC71]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-extrabold font-heading text-[#2ECC71] mb-3">
                    {etapa.passo}
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{etapa.texto}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#145A32] font-semibold">
                  <span>Etapa estruturada</span>
                </div>
              </div>
            ))}
          </div>

          {/* Dossiê Executivo em 3 frentes */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#145A32] block mb-1">
                Entregável Concreto
              </span>
              <h4 className="font-heading font-bold text-xl text-slate-900">
                O que a diretoria recebe ao final do Diagnóstico 360°
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Um laudo executivo e um plano de ação estruturado em três frentes complementares:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded mb-2">
                  Frente 1 • 30 a 60 dias
                </span>
                <strong className="text-slate-900 block font-heading font-bold mb-1">
                  Ações Rápidas de Liquidez
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recuperação tributária imediata de tributos pagos a maior e estancamento de
                  passivos urgentes para oxigenar o fluxo de caixa.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded mb-2">
                  Frente 2 • 60 a 120 dias
                </span>
                <strong className="text-slate-900 block font-heading font-bold mb-1">
                  Ações Estruturais de Governança
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Saneamento contábil, revisão de acordos societários, blindagem patrimonial dos
                  sócios e implementação de POPs operacionais.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-2 py-0.5 rounded mb-2">
                  Frente 3 • 2026 a 2033
                </span>
                <strong className="text-slate-900 block font-heading font-bold mb-1">
                  Comitê de Transição Tributária
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Acompanhamento contínuo da regulamentação da LC 214/2025, regras de split payment
                  e adequação da precificação de vendas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OS 5 PILARES 5.0 (NO FINAL DA PÁGINA, CONFORME MODELO DAS DEMAIS — SEM ÍCONES NOS CARDS) */}
      <section
        id="pilares-diagnostico-360"
        className="py-20 bg-gradient-to-b from-[#0A1A13] via-[#0E2E1E] to-[#0A1A13] text-white relative overflow-hidden border-t-2 border-[#2ECC71]/30"
      >
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
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Metodologia Diamond Group</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do Diagnóstico 360° na Contabilidade 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Infraestrutura analítica desenhada para transformar vulnerabilidades corporativas em
              liquidez imediata, segurança de longo prazo e liderança de mercado.
            </p>
          </div>

          {/* Grade de 5 cards com texto 100% visível — SEM ÍCONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresDiagnostico5.map((item, idx) => {
              const isSpanAcross = idx === 3 && pilaresDiagnostico5.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2ECC71]/60 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanAcross ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    {/* Topo do card: Badge compacto e número (SEM ÍCONES) */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-[#2ECC71]">Pilar 0{idx + 1}</span>
                    </div>

                    {/* Título do Card */}
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-3 group-hover:text-[#2ECC71] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Texto completo VISÍVEL */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Detalhe de acabamento inferior */}
                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#2ECC71] font-medium">
                      Incluso no Diagnóstico 360°
                    </span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Faixa complementar de chamada integrada com CTA DUPLO */}
          <div className="mt-12 p-6 sm:p-8 rounded-[20px] bg-white/[0.03] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                Pronto para mapear os 7 riscos e destravar o potencial da sua empresa?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Realize a autoavaliação interativa dos 7 riscos diretamente na plataforma ou agende
                uma reunião estratégica com nossos analistas seniores.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href="/#contato"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press"
              >
                Fale com um Especialista
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>

              <Link
                to="/diagnostico-360"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                Fazer o Diagnóstico 360° na plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">
                Conheça Mais Soluções
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Explore as outras especialidades da Contabilidade 5.0
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
              Solicite uma análise diagnóstica personalizada
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Nossa equipe de consultores seniores realiza a aplicação da matriz de riscos de forma
              confidencial, ágil e focada em resultados concretos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/#contato"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
              >
                Fale com um Especialista
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </a>
              <Link
                to="/diagnostico-360"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5 text-[#2ECC71]" />
                Fazer o Diagnóstico 360° na plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
