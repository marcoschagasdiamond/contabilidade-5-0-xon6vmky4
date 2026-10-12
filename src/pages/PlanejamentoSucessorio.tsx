import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
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
  GraduationCap,
  Building2,
  GitFork,
  Globe2,
  Shield,
  FileCheck2,
  Landmark,
} from 'lucide-react'

export default function PlanejamentoSucessorio() {
  const pilaresSucessorio5 = [
    {
      id: 'holding-sob-medida',
      icon: Building2,
      badge: 'Governança Societária',
      title: '1. Holding sob medida 5.0',
      description:
        'Desenho e constituição de holding familiar pura, mista ou patrimonial alinhada à realidade dos negócios: blindagem do patrimônio pessoal, centralização da administração, eliminação de inventário oneroso e redução legítima da carga tributária sobre locações e ganho de capital.',
    },
    {
      id: 'sucessao-preditiva',
      icon: GitFork,
      badge: 'Harmonia & Continuidade',
      title: '2. Sucessão preditiva',
      description:
        'Mapeamento preditivo de cenários para famílias complexas — filhos de diferentes uniões, herdeiros com papéis distintos na operação e proteção do cônjuge. Acordos de sócios com cláusulas de step-down planejado, regras de voto e protocolo familiar que evitam litígios futuros.',
    },
    {
      id: 'radar-estruturas-internacionais',
      icon: Globe2,
      badge: 'Cross-Border Compliance',
      title: '3. Radar de estruturas internacionais',
      description:
        'Arquitetura cross-border para empresários com planos de residência no exterior, abertura de offshore, subsidiárias estrangeiras ou repatriamento de recursos. Total conformidade tributária em dupla jurisdição com a Lei de Offshore (Lei 14.754/2023) e tratados contra bitributação.',
    },
    {
      id: 'blindagem-patrimonial-continua',
      icon: Shield,
      badge: 'Proteção Preventiva',
      title: '4. Blindagem patrimonial contínua',
      description:
        'Segregação jurídica rigorosa entre os riscos da atividade operacional das empresas e os bens da família. Planejamento tributário lícito e contínuo, com doação com reserva de usufruto, cláusulas de inalienabilidade, impenhorabilidade, incomunicabilidade e reversão.',
    },
    {
      id: 'dossie-investibilidade-sucessao',
      icon: FileCheck2,
      badge: 'Prontidão Sucessória',
      title: '5. Dossiê de investibilidade e sucessão',
      description:
        'Acervo documental técnico completo, padronizado e auditável contendo atos constitutivos, certidões negativas, valuation preliminar e matriz de sucessão. Uma estrutura que confere máxima transparência para investidores, bancos de atacado e herdeiros com governança corporativa viva.',
    },
  ]

  const beneficios = [
    {
      icon: ShieldCheck,
      title: 'Proteção que atravessa gerações',
      desc: 'Segregação inequívoca entre o patrimônio familiar e os riscos operacionais das empresas operacionais, garantindo preservação perpétua dos bens construídos.',
    },
    {
      icon: Zap,
      title: 'Governança que evita conflito',
      desc: 'Acordo de sócios, protocolo familiar e regras claras de convivência societária para famílias complexas, eliminando discussões e inventários desgastantes.',
    },
    {
      icon: Globe2,
      title: 'Conformidade em dupla jurisdição',
      desc: 'Segurança fiscal internacional para quem quer morar fora, abrir empresa no exterior ou repatriar dividendos, plenamente alinhada às regras da Receita Federal.',
    },
    {
      icon: TrendingUp,
      title: 'Planejamento tributário lícito e contínuo',
      desc: 'Otimização rigorosa do ITCMD, redução de ganho de capital na transmissão de cotas e economia substancial de IRPF na gestão de aluguéis e dividendos.',
    },
  ]

  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico patrimonial e societário',
      texto:
        'Levantamento completo de todos os bens físicos, cotas empresariais, investimentos nacionais e internacionais, composição familiar e objetivos do empresário.',
    },
    {
      passo: '02',
      titulo: 'Desenho da estrutura sob medida',
      texto:
        'Elaboração da arquitetura societária ideal: definição do tipo de holding (patrimonial, pura ou de participações), minuta de acordo de sócios e regras de governança.',
    },
    {
      passo: '03',
      titulo: 'Implantação e regularização registral',
      texto:
        'Execução completa perante JUCESP, cartórios de registro de imóveis, órgãos fiscais (RFB/SEFAZ) e estruturas internacionais (quando aplicável à estratégia).',
    },
    {
      passo: '04',
      titulo: 'Governança contínua e revisão preditiva',
      texto:
        'Acompanhamento anual das regras familiares, adequação a mudanças legislativas (como ITCMD e Reforma Tributária) e manutenção permanente da blindagem.',
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
                <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Wealth & Governance • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Planejamento Sucessório e Estruturação Patrimonial 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Estruturação de empresas nacionais e internacionais para proteger seu patrimônio e
                garantir a continuidade do negócio entre gerações — soluções sofisticadas para
                empresários com filhos fora do casamento, que querem morar fora do país ou criar
                empresa no exterior.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Planejamento Sucessório
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-planejamento-sucessorio"
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
                  src="https://img.usecurling.com/p/700/500?q=wealth%20management%20family%20office%20estate%20planning&color=emerald"
                  alt="Painel de Planejamento Sucessório e Estruturação Patrimonial 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Landmark className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">Wealth & Governance 5.0</span>
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
              Por que estruturar o seu patrimônio conosco
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Uma abordagem consultiva e segura para perpetuar o patrimônio da sua família
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Elimine o risco de travar o patrimônio em inventários demorados e custos tributários
              excessivos. Conte com especialistas seniores em direito societário, tributação e
              governança familiar.
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

          {/* Comparativo: Planejamento Tradicional vs Wealth & Governance 5.0 */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  Planejamento Tradicional × Wealth & Governance 5.0
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto o modelo tradicional se limita a testamentos isolados ou escrituras de
                  doação incompletas — deixando a família desprotegida contra disputas judiciais e
                  riscos de mercado —, o Wealth & Governance 5.0 constrói uma arquitetura societária
                  viva, com governança, blindagem contínua e estruturas nacionais e internacionais
                  integradas.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De testamento isolado para arquitetura societária completa e dinâmica
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De sucessão que explode em conflito judicial para sucessão preditiva com
                      regras claras
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De risco patrimonial descoberto na crise para blindagem estruturada antes
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-heading font-bold text-base text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  Itens do serviço incluídos no escopo:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Holding familiar e acordo de sócios: governança, separação patrimonial e
                      regras claras
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Sucessão familiar com famílias complexas: uniões estáveis, filhos de outras
                      relações e herdeiros com papéis distintos
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Estruturas internacionais: offshore, residência no exterior, repatriamento e
                      dupla jurisdição
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Blindagem patrimonial: proteção de bens pessoais contra risco operacional
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Planejamento tributário lícito e contínuo (otimização de ITCMD e ganho de
                      capital)
                    </span>
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
              Como funciona a implantação do Planejamento Sucessório 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Metodologia consultiva e sigilosa em 4 etapas, desenhada para garantir harmonia
              familiar, otimização fiscal e segurança patrimonial perpétua.
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
        id="pilares-planejamento-sucessorio"
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
              <span>Wealth & Governance 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do Planejamento Sucessório e Patrimonial 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que abrir uma empresa ou fazer uma doação: conheça os 5 pilares técnicos que
              integram holding sob medida, sucessão preditiva, estruturas internacionais e
              governança permanente.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresSucessorio5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresSucessorio5.length === 5

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
                      Incluso no Wealth & Governance 5.0
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
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para proteger seu patrimônio com o Planejamento Sucessório 5.0?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Holding sob medida, sucessão preditiva, conformidade internacional e sigilo
                  absoluto.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Especialistas em Wealth
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
              Nossa equipe sênior dimensiona a estrutura societária ideal de acordo com a composição
              familiar, localização dos bens e complexidade da sua operação empresarial.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor de Wealth
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
