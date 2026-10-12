import React from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
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
  PieChart,
  Users,
  ShieldCheck,
  Building2,
  BookOpen,
  Layers,
  Compass,
  FileCheck2,
  Scale,
  BrainCircuit,
  BarChart3,
  ShieldAlert,
} from 'lucide-react'

export default function TreinamentoCapacitacao() {
  const pilaresTreinamento5 = [
    {
      id: 'trilha-aprendizagem-sob-medida',
      icon: Compass,
      badge: 'Design Instrucional 5.0',
      title: '1. Trilha de aprendizagem sob medida 5.0',
      description:
        'Construção de matriz curricular única para a realidade do cliente: programas modulares desenhados a partir do diagnóstico de maturidade da equipe, cruzando gaps técnicos imediatos com as metas estratégicas de crescimento da empresa.',
    },
    {
      id: 'capacitacao-preditiva-reforma',
      icon: Scale,
      badge: 'Transição 2026–2033',
      title: '2. Capacitação preditiva na Reforma Tributária',
      description:
        'Imersões práticas profundas no novo sistema constitucional do IBS, CBS e Imposto Seletivo (EC 132/2023 e LC 214/2025): split payment, não cumulatividade plena, crédito financeiro e impactos contratuais e de precificação aplicados ao segmento da empresa.',
    },
    {
      id: 'academia-fiscal-contabil-continua',
      icon: BrainCircuit,
      badge: 'Formação Contínua',
      title: '3. Academia fiscal e contábil contínua',
      description:
        'Atualização permanente e estruturada em SPED Fiscal, EFD-Reinf, DCTFWeb, ECD/ECF e conciliação em nuvem. A equipe interna ganha autonomia técnica para antecipar malhas finas, eliminar multas acessórias e auditar dados antes do Fisco.',
    },
    {
      id: 'formacao-dados-reais',
      icon: BarChart3,
      badge: 'Hands-on com Dados Reais',
      title: '4. Formação baseada nos dados reais da empresa',
      description:
        'Metodologia prática sem teoria genérica: oficinas e estudos de caso executados sobre as notas fiscais, balancetes, rubricas e operações reais do negócio. Os colaboradores aprendem a resolver os problemas diários da sua própria esteira de trabalho.',
    },
    {
      id: 'certificacao-mapa-competencias',
      icon: FileCheck2,
      badge: 'Governança & People Analytics',
      title: '5. Certificação e mapa de competências',
      description:
        'Avaliação prévia e pós-treinamento com emissão de certificados oficiais, mapa vivo de competências técnicas dos colaboradores e relatório gerencial de impacto para a diretoria acompanhar o ROI educacional e a evolução da maturidade corporativa.',
    },
  ]

  const beneficios = [
    {
      icon: TrendingUp,
      title: 'Time preparado para o presente e o futuro',
      desc: 'Capacitação ágil nas mudanças tributárias (IBS/CBS) e trabalhistas mais urgentes, garantindo segurança operacional antes dos novos prazos legais.',
    },
    {
      icon: Zap,
      title: 'Educação alinhada à estratégia',
      desc: 'Treinamentos construídos para resolver gargalos reais da sua operação, alinhando a produtividade do time financeiro às metas do negócio.',
    },
    {
      icon: Building2,
      title: 'Conteúdo aplicado à realidade da empresa',
      desc: 'Sem aulas genéricas: metodologia hands-on que analisa XMLs, rotinas contábeis e regimes tributários específicos do segmento da sua organização.',
    },
    {
      icon: Clock,
      title: 'Impacto mensurável para pessoas e organização',
      desc: 'Redução drástica de retrabalho e dúvidas internas, com mapa de competências e relatórios claros de aproveitamento para o RH e diretoria.',
    },
  ]

  const formatosEntrega = [
    {
      titulo: 'Treinamentos in company (sob medida)',
      descricao:
        'Programas desenhados para o contexto, setor e desafios operacionais específicos da sua empresa.',
      icon: Building2,
      tag: 'Customizado',
    },
    {
      titulo: 'Workshops sobre a Reforma Tributária (IBS/CBS)',
      descricao:
        'Imersões práticas sobre as novas regras, transição tributária, split payment e impactos no seu modelo de negócio.',
      icon: BookOpen,
      tag: 'Estratégico',
    },
    {
      titulo: 'Capacitação da equipe fiscal e contábil',
      descricao:
        'Atualização técnica contínua em SPED, eSocial, conciliação e melhores práticas de governança fiscal.',
      icon: Layers,
      tag: 'Operação & Compliance',
    },
  ]

  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico de competências e necessidades',
      texto:
        'Mapeamento dos desafios operacionais, nível técnico atual da equipe e objetivos estratégicos da diretoria para delimitar o escopo exato do programa.',
    },
    {
      passo: '02',
      titulo: 'Desenho do programa sob medida',
      texto:
        'Estruturação da trilha pedagógica, cronograma de encontros, seleção de cases práticos do setor e personalização do material didático exclusivo.',
    },
    {
      passo: '03',
      titulo: 'Execução in company ou workshop ao vivo',
      texto:
        'Aulas interativas presenciais ou online com instrutores seniores, dinâmicas aplicadas com dados do setor e resolução de dúvidas em tempo real.',
    },
    {
      passo: '04',
      titulo: 'Medição de impacto e trilha contínua',
      texto:
        'Aplicação de avaliação prática, emissão de certificados, entrega do relatório de competências para a liderança e suporte pós-treinamento.',
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
                <GraduationCap className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Educação Corporativa • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Treinamento e Capacitação Corporativa 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Para cada cliente, criamos um projeto único, personalizado e diferenciado. Não
                apenas entendemos a realidade e as necessidades específicas da empresa, como também
                desenvolvemos soluções educacionais alinhadas à sua estratégia, com o objetivo de
                atender às necessidades presentes e futuras, proporcionando impactos positivos para
                os profissionais e para as organizações.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Solicitar Treinamento sob Medida
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-treinamento-capacitacao"
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
                  src="https://img.usecurling.com/p/700/500?q=corporate%20training%20workshop%20classroom&color=emerald"
                  alt="Painel de Treinamento e Educação Corporativa 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">Educação Corporativa 5.0</span>
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
              Por que treinar sua equipe conosco
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Uma abordagem consultiva para transformar conhecimento técnico em segurança e
              produtividade
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Elimine o custo invisível do retrabalho e o medo das autuações por desconhecimento da
              legislação. Tenha consultores seniores capacitando seu time com foco na prática do seu
              negócio.
            </p>
          </div>

          {/* 3 Formatos de Entrega em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {formatosEntrega.map((fmt, idx) => {
              const FIcon = fmt.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#145A32] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] transition-all flex items-center justify-center">
                        <FIcon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#145A32] bg-white px-2.5 py-1 rounded-full border border-emerald-200/80">
                        {fmt.tag}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-2 group-hover:text-[#145A32] transition-colors">
                      {fmt.titulo}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {fmt.descricao}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-[#145A32] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                    <span>Disponível presencial ou online ao vivo</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 4 Cards de Benefícios Estratégicos */}
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

          {/* Comparativo: Treinamento Tradicional vs Educação Corporativa 5.0 */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  Treinamento Tradicional × Educação Corporativa 5.0
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto cursos tradicionais oferecem palestras avulsas, genéricas e teóricas —
                  esquecidas na semana seguinte sem alterar a rotina da empresa —, a Educação
                  Corporativa 5.0 desenha trilhas sob medida sobre os dados e sistemas reais do
                  cliente, com impacto mensurável e acompanhamento contínuo.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De palestra avulsa e genérica para programa desenhado sob medida para o setor
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De conteúdo teórico desconectado para aplicação direta na rotina fiscal e
                      contábil
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De evento único sem feedback para trilha contínua com mapa de competências
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-heading font-bold text-base text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  O que está incluso em cada projeto educacional:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Diagnóstico prévio das necessidades e nivelamento da equipe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Material didático exclusivo, prático e sem juridiquês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Instrutores seniores com vivência prática de mercado e cases reais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Certificado de conclusão oficial para todos os participantes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Suporte pós-treinamento para esclarecimento de dúvidas da rotina</span>
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
              Como funciona o processo de capacitação corporativa
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Método ágil em 4 etapas, desenhado para maximizar a retenção do conhecimento e gerar
              resultados imediatos na operação do cliente.
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

      {/* 4. SEÇÃO NO FINAL DA PÁGINA: OS 5 PILARES (TÓPICO PRÓPRIO DEDICADO) */}
      <section
        id="pilares-treinamento-capacitacao"
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
              <span>Educação Corporativa 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do Treinamento e Capacitação 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que transmitir teorias fiscais: uma arquitetura de aprendizagem contínua,
              orientada a dados reais, capacitação preditiva na Reforma Tributária e certificação de
              competências.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresTreinamento5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresTreinamento5.length === 5

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
                      Incluso na Educação Corporativa 5.0
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
                <GraduationCap className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para capacitar sua equipe com o Treinamento 5.0?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Projetos customizados, workshops na Reforma Tributária e instrutores seniores.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Especialistas em Educação
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
                Conheça Mais Soluções Dedicadas
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Precisa de outras especialidades contábeis ou corporativas?
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
              Nossa equipe dimensiona o programa de capacitação ideal para o porte da sua equipe, os
              sistemas operacionais utilizados e os desafios tributários imediatos da sua empresa.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor de Capacitação
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
