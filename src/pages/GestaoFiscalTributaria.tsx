import React from 'react'
import { Link } from 'react-router-dom'
import {
  Receipt,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Radar,
  FileArchive,
  Coins,
  Scale,
  ShieldAlert,
  Zap,
  TrendingUp,
  Cpu,
  Clock,
  Award,
  ArrowUpRight,
  Calculator,
  Users,
  PieChart,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react'

export default function GestaoFiscalTributaria() {
  const pilaresGestaoFiscal5 = [
    {
      id: 'radar-obrigacoes',
      icon: Radar,
      badge: 'Conformidade Preditiva',
      title: 'Radar de obrigações acessórias inteligente',
      description:
        'Mapa vivo de todas as entregas (SPED Fiscal, EFD-Contribuições, DCTFWeb, eSocial, PerDCom) monitoradas por prazo e responsabilidade técnica, com alerta antes do vencimento — fim definitivo da era do "esquecemos a obrigação" e das multas por atraso.',
    },
    {
      id: 'guarda-fiscal-ia',
      icon: FileArchive,
      badge: 'Custódia Inteligente',
      title: 'Guarda fiscal digital com IA',
      description:
        'Arquivo digital unificado e estruturado de XMLs de NFe, NFCe, CTe, NFS-e, comprovantes e livros fiscais, consultável em segundos via busca inteligente e pronto para fiscalizações, due diligences de M&A ou auditorias bancárias.',
    },
    {
      id: 'creditos-tributarios',
      icon: Coins,
      badge: 'Recuperação Ativa',
      title: 'Monitoramento contínuo de créditos tributários',
      description:
        'Varredura algorítmica periódica do fluxo operacional da empresa para capturar e escriturar créditos recuperáveis de PIS, COFINS, ICMS, IPI e IRPJ no exato momento em que nascem, evitando acúmulo de perdas financeiras ao longo dos anos.',
    },
    {
      id: 'compliance-reforma',
      icon: Scale,
      badge: 'Transição 2026–2033',
      title: 'Compliance preditivo na Reforma Tributária',
      description:
        'Acompanhamento automático da transição do IBS e da CBS aplicado diretamente aos dados reais da sua empresa: simulações de impacto de carga, previsão de trava no caixa pelo split payment e plano de readequação de preços antes da cobrança.',
    },
    {
      id: 'dossie-risco-passivo',
      icon: ShieldAlert,
      badge: 'Blindagem Preventiva',
      title: 'Dossiê de risco e passivo fiscal',
      description:
        'Radiografia contínua de potenciais assimetrias entre declarações, inconsistências de CFOP/CST e gargalos de escrita fiscal, antecipando malhas finas eletrônicas da Receita Federal e dos estados antes de qualquer intimação oficial.',
    },
  ]

  const beneficios = [
    {
      icon: Zap,
      title: 'Automação & Velocidade',
      desc: 'Captura automática de documentos fiscais direto da SEFAZ e prefeituras, cruzamento de dados em tempo real e eliminação de retrabalho com lançamentos manuais.',
    },
    {
      icon: ShieldAlert,
      title: 'Blindagem Antirrisco & CND',
      desc: 'Varredura diária da situação cadastral e fiscal nos âmbitos federal, estadual e municipal, garantindo Certidões Negativas (CNDs) sempre ativas e disponíveis.',
    },
    {
      icon: TrendingUp,
      title: 'Economia Tributária Lícita',
      desc: 'Revisão periódica do melhor regime (Simples Nacional, Lucro Presumido ou Lucro Real) com planejamento tributário consultivo que maximiza sua margem de lucro.',
    },
    {
      icon: Clock,
      title: 'Consultoria Especializada',
      desc: 'Tributaristas e contadores seniores dedicados ao seu negócio, com suporte ágil por WhatsApp, videochamadas e relatórios mensais sem juridiquês.',
    },
  ]

  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico & Varredura Inicial',
      texto:
        'Mapeamento completo do CNAE, enquadramento atual, cadeia de fornecedores e auditoria retrospectiva dos últimos 60 meses.',
    },
    {
      passo: '02',
      titulo: 'Parametrização & Automação',
      texto:
        'Conexão com certificados digitais, sistemas emissores e parametrização das regras fiscais específicas do seu setor.',
    },
    {
      passo: '03',
      titulo: 'Apuração & Rotina Preditiva',
      texto:
        'Cálculo mensal de tributos, transmissão ágil do SPED, validação de créditos e conferência antes de qualquer envio ao Fisco.',
    },
    {
      passo: '04',
      titulo: 'Comitê Estratégico Tributário',
      texto:
        'Reunião periódica para apresentação de KPIs fiscais, simulações de cenários e adequação contínua à Reforma Tributária.',
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
                <Receipt className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Gestão Fiscal e Tributária Estratégica 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Muito além de gerar guias de impostos em cima da hora: uma estrutura fiscal
                inteligente e preventiva que reduz custos tributários, blinda sua operação contra
                autuações e prepara sua empresa para a nova era do IBS, CBS e Split Payment.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Gestão Fiscal 5.0
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-gestao-fiscal"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-medium text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                  Ver Gestão Fiscal 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-white/20 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=tax%20compliance%20analytics%20dashboard&color=emerald"
                  alt="Painel de Gestão Fiscal e Tributária 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">
                    Compliance Fiscal Preditivo
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
              Por que escolher nossa gestão fiscal
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Uma abordagem consultiva para transformar obrigações em vantagem competitiva
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Elimine o medo de notificações da Receita Federal, o estresse com guias de última hora
              e o pagamento excessivo de tributos. Tenha um time focado em inteligência fiscal
              ativa.
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

          {/* Comparativo: Tradicional vs Gestão Fiscal 5.0 */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  A gestão fiscal como motor de rentabilidade e segurança jurídica
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto o setor fiscal tradicional atua como mero "gerador de guias" que apenas
                  repassa o valor informado, a Gestão Fiscal 5.0 audita eletronicamente cada entrada
                  e saída, recupera créditos legítimos e simula cenários antes de cada recolhimento.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>Auditoria prévia de arquivos SPED e DCTFWeb antes do envio</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      Identificação e compensação contínua de créditos tributários legítimos
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      Preparação sob medida para a Reforma Tributária (IBS/CBS e Split Payment)
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
                    <span>Apuração completa em Simples Nacional, Lucro Presumido e Lucro Real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Transmissão rigorosa de SPED Fiscal, EFD-Contribuições e DCTFWeb</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Planejamento tributário anual comparativo de regimes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Monitoramento contínuo de CNDs e situação fiscal no e-CAC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Suporte consultivo para emissão correta de NFe, NFCe e NFS-e</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA O PROCESSO DE IMPLANTAÇÃO */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona a implantação da Gestão Fiscal 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Processo de transição estruturado, sem risco de descontinuidade operacional e com
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

      {/* 4. SEÇÃO NO FINAL DA PÁGINA: OS 5 PILARES DA GESTÃO FISCAL PREDITIVA (TÓPICO PRÓPRIO DEDICADO) */}
      <section
        id="pilares-gestao-fiscal"
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
              <span>Gestão Fiscal 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares da gestão fiscal preditiva
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que calcular guias e transmitir declarações obrigatórias: uma arquitetura
              tecnológica e preventiva que transforma o setor fiscal em inteligência de fluxo de
              caixa, segurança jurídica e recuperação constante de valor.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresGestaoFiscal5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresGestaoFiscal5.length === 5

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
                      Incluso na Gestão Fiscal 5.0
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
                <Receipt className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para migrar sua empresa para a Gestão Fiscal 5.0?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Conformidade preditiva, redução lícita de carga tributária e suporte consultivo
                  especializado.
                </p>
              </div>
            </div>

            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press shrink-0"
            >
              Falar com Nossos Tributaristas
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
              Nossa equipe dimensiona o escopo fiscal ideal de acordo com o porte, regime tributário
              e complexidade operacional da sua empresa.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor Tributário
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
