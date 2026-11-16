import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SecaoDuplaAcaoFinal from '@/components/common/SecaoDuplaAcaoFinal'
import {
  Calculator,
  Receipt,
  Users,
  PieChart,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Building2,
  BookOpen,
  Layers,
  Briefcase,
  Compass,
  FileText,
  BadgeDollarSign,
  TrendingUp,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react'
import QualServicoParaMim from '@/components/servicos/QualServicoParaMim'
import { buildWhatsAppLink, TELEFONE_EMPRESA_FORMATADO } from '@/config/empresa'

export default function Servicos() {
  const [servicoContratar, setServicoContratar] = useState<string>('')
  const [modoAcao, setModoAcao] = useState<'nenhuma' | 'proposta' | 'agendamento'>('nenhuma')

  const handleContratarServico = (e: React.MouseEvent, nomeServico: string) => {
    e.preventDefault()
    setServicoContratar(nomeServico)
    setModoAcao('proposta')

    // Rolar suavemente até a seção de contato sem recarregar a página
    const el = document.getElementById('servicos-acoes-finais')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleRolarAteServico = (e?: React.MouseEvent, idServico?: string) => {
    e?.preventDefault()
    if (!idServico) return
    const el = document.getElementById(idServico)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  interface DeliveryFormatItem {
    title: string
    description: string
    icon?: React.ComponentType<{ className?: string }>
  }

  interface ServiceDetailItem {
    id: string
    icon: React.ComponentType<{ className?: string }>
    category: string
    title: string
    subtitle: string
    description: string
    features: string[]
    image: string
    reverse: boolean
    badgeIncluso?: string
    deliveryFormatsTitle?: string
    deliveryFormats?: DeliveryFormatItem[]
    provaSocial: string
  }

  const categories = [
    'Diagnóstico & Estratégia',
    'Wealth & Governance',
    'Operação & BPO',
    'Finanças & Estruturação de Fluxo',
    'Tributário, Créditos & Recuperação',
  ]

  const serviceDetails: ServiceDetailItem[] = [
    {
      id: 'diagnostico-360',
      icon: Compass,
      category: 'Diagnóstico & Estratégia',
      title: 'Diagnóstico 360°',
      subtitle: 'Matriz Semáforo de Riscos e Oportunidades & Plano de Ação 30-60-90',
      description:
        'Avaliação corporativa integral para mapear e estancar as vulnerabilidades do seu negócio. Nossa metodologia audita as 7 novas frentes estratégicas — Financeiro & Crédito, Investimentos & Wealth, Societário & Parcerias (Risco Hub), Fiscal & Contábil, Tributário, Jurídico e Operacional, Humano & Cultura — gerando a Matriz Semáforo de Riscos e Oportunidades e o Plano de Ação 30-60-90 para proteger o patrimônio e preparar a operação para a Reforma Tributária.',
      features: [
        'Matriz Semáforo de Riscos e Oportunidades nas 7 novas frentes estratégicas',
        'Plano de Ação 30-60-90 (liquidez rápida, governança societária e transição contínua)',
        'Análise de liquidez, capacidade de pagamento mensal e due diligence de sócios (Risco Hub)',
        'Base técnica e modelagem de cenários para a Reforma Tributária (IBS/CBS e LC 214/2025)',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=business%20diagnostic%20strategy%20executive%20meeting&color=emerald',
      reverse: false,
      provaSocial:
        'Indústria metalúrgica, 85 funcionários: 23 riscos mapeados e plano 30-60-90 ativo',
    },
    {
      id: 'planejamento-sucessorio-patrimonial',
      icon: ShieldCheck,
      category: 'Wealth & Governance',
      title: 'Planejamento Sucessório e Estruturação Patrimonial',
      subtitle: 'Proteção patrimonial, governança societária e sucessão entre gerações',
      description:
        'Estruturação de empresas nacionais e internacionais para proteger seu patrimônio e garantir a continuidade do negócio entre gerações, com foco em soluções sob medida para empresários com famílias complexas, planejamento de residência no exterior ou expansão internacional.',
      features: [
        'Holding familiar e acordo de sócios — governança, separação entre patrimônio pessoal e empresarial e regras claras de sucessão',
        'Sucessão familiar com famílias complexas — filhos de diferentes uniões, herdeiros com papéis distintos no negócio, proteção do cônjuge e step-down planejado',
        'Estruturas internacionais — empresa fora do país, residência no exterior, repatriamento e conformidade fiscal em dupla jurisdição',
        'Blindagem patrimonial — proteção do patrimônio pessoal contra risco da operação, com planejamento tributário lícito e contínuo',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=wealth%20management%20family%20office%20estate%20planning&color=emerald',
      reverse: true,
      provaSocial:
        'Família empresária, 3 gerações: holding familiar estruturada e sucessão blindada',
    },
    {
      id: 'contabilidade-digital',
      icon: Calculator,
      category: 'Operação & BPO',
      title: 'Contabilidade Digital',
      subtitle: 'Escrituração contábil inteligente e relatórios em tempo real',
      description:
        'A escrituração contábil moderna vai muito além do cumprimento de obrigações legais. Nossa equipe processa seus dados com inteligência analítica, entregando balanços, DREs e relatórios de fluxo de caixa que oferecem clareza imediata sobre a saúde financeira do seu negócio.',
      features: [
        'Balanço Patrimonial e DRE mensais digitalizados',
        'Conciliação bancária automatizada e sem papéis',
        'Dashboard gerencial com indicadores-chave (KPIs)',
        'Controle patrimonial e depreciação de ativos',
        'Emissão de relatórios em conformidade com as normas IFRS',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=digital%20accounting%20dashboard%20laptop&color=emerald',
      reverse: true,
      provaSocial:
        'Comércio eletrônico, 12 funcionários: fechamento mensal entregue em 5 dias úteis',
    },
    {
      id: 'gestao-fiscal',
      icon: Receipt,
      category: 'Operação & BPO',
      title: 'Gestão Fiscal & Tributária',
      subtitle: 'Conformidade absoluta com eSocial, SPED e planejamento tributário',
      description:
        'O sistema tributário nacional é dinâmico e complexo. Cuidamos de toda a apuração de tributos diretos e indiretos (Simples Nacional, Lucro Presumido e Lucro Real), mantendo sua empresa protegida contra multas e selecionando o regime com menor custo fiscal legal.',
      features: [
        'Apuração rigorosa de tributos federais, estaduais e municipais',
        'Planejamento tributário anual para redução lícita de impostos',
        'Transmissão ágil do SPED Fiscal, EFD-Contribuições e DCTFWeb',
        'Monitoramento de certidões negativas (CND) de forma contínua',
        'Adequação preventiva à Reforma Tributária',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=tax%20compliance%20documents%20calculator&color=emerald',
      reverse: false,
      provaSocial:
        'Clínica médica, 25 funcionários: R$ 38 mil/ano de economia com planejamento de regime',
    },
    {
      id: 'departamento-pessoal',
      icon: Users,
      category: 'Operação & BPO',
      title: 'Departamento Pessoal',
      subtitle: 'Gestão de folha, eSocial e conformidade trabalhista com pontualidade',
      description:
        'Gerenciamos toda a rotina de recursos humanos e departamento pessoal com precisão cirúrgica: admissões, rescisões, férias, folhas de pagamento, encargos sociais e cálculo de benefícios, tudo em perfeita integração com o eSocial.',
      features: [
        'Processamento pontual da folha de pagamento e pró-labore',
        'Cálculo e emissão de guias de FGTS, INSS e IRRF',
        'Gestão de admissões, rescisões e homologações',
        'Controle de férias, afastamentos e atestados médicos',
        'Atendimento dedicado a dúvidas de colaboradores e RH',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=human%20resources%20team%20payroll&color=emerald',
      reverse: true,
      provaSocial:
        'Rede de varejo, 60 colaboradores: zero passivo trabalhista em 18 meses de gestão',
    },
    {
      id: 'bpo-contabil',
      icon: Briefcase,
      category: 'Operação & BPO',
      title: 'BPO Contábil 5.0',
      subtitle: 'Delegue a operação. Mantenha o controle.',
      description:
        'O BPO (Business Process Outsourcing) transfere para a nossa equipe a rotina operacional — fiscal, folha, contas a pagar/receber e faturamento — enquanto você acompanha tudo em tempo real pelo painel. O diferencial 5.0: operação rodando sobre tecnologia com indicadores e alertas preditivos.',
      features: [
        'Redução de custo fixo sem contratar ou gerenciar equipe operacional interna',
        'Zero risco de esquecer obrigação com calendário fiscal e trabalhista sob nosso controle',
        'Dados sempre prontos para decisão com fechamento mensal garantido',
        'Escala sem dor de cabeça: a operação cresce sem precisar contratar',
        'Foco total do empresário no core business e nas vendas',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=business%20process%20outsourcing%20team%20operations&color=emerald',
      reverse: false,
      provaSocial:
        'Indústria de embalagens, 45 funcionários: R$ 52 mil/ano reduzidos do custo operacional',
    },
    {
      id: 'consultoria-financeira',
      icon: PieChart,
      category: 'Finanças & Estruturação de Fluxo',
      title: 'Consultoria Financeira Estratégica',
      subtitle: 'BPO Financeiro completo, modelagem preditiva e captação de crédito',
      description:
        'Consultoria financeira completa de ponta a ponta: assumimos a rotina diária de contas a pagar, a receber e conciliação bancária, construímos modelos orçamentários dinâmicos, monitoramos pontos críticos de caixa, orientamos a captação estruturada de recursos e realizamos reuniões mensais com consultor sênior para apoiar a tomada de decisão.',
      features: [
        'BPO Financeiro completo (contas a pagar, a receber e conciliação bancária)',
        'Projeções orçamentárias e fluxo de caixa projetado contínuo',
        'Margem de contribuição e apuração do ponto de equilíbrio',
        'Controle dos índices financeiros e pontos críticos da empresa',
        'Orientação para captação de recursos e crédito bancário',
        'Reuniões mensais com consultor sênior para alinhamento estratégico',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=financial%20analytics%20dashboard%20growth&color=emerald',
      reverse: false,
      provaSocial:
        'Empresa de TI, 40 funcionários: R$ 84 mil recuperados em créditos de PIS/Cofins',
    },
    {
      id: 'gestao-recebiveis',
      icon: TrendingUp,
      category: 'Finanças & Estruturação de Fluxo',
      title: 'Estruturação de Recebimentos & Gestão de Fluxo',
      subtitle: 'Mantenha as vendas ativas, folha em dia e operação protegida.',
      description:
        'Estruturação especializada para empresas com restrições ou contingências em contas bancárias. Garantimos a proteção do fluxo de recebimentos contra bloqueios e contingências em bancos por meio de meios de pagamento inteligentes, esteiras de fomento lícitas (Lei 14.463/2022) e governança na aplicação de recursos para honrar folha e fornecedores.',
      features: [
        'Continuidade imediata das vendas e cobranças sem travar a esteira comercial',
        'Estrutura montada com base legal, contratos e assessoria dedicada',
        'Priorização rigorosa de recursos para folha salarial e fornecedores vitais',
        'Diversificação de meios de pagamento homologados (cartões, Pix e boletos)',
        'Relatórios de conciliação diária e preparação técnica para regularizar passivos',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=financial%20operations%20corporate%20cashflow%20technology&color=blue',
      reverse: true,
      provaSocial:
        'Distribuidora, 30 funcionários: folha e fornecedores honrados mesmo com contas bloqueadas',
    },
    {
      id: 'assessoria-tributaria',
      icon: ShieldAlert,
      category: 'Tributário, Créditos & Recuperação',
      title: 'Assessoria Tributária Especializada',
      subtitle: 'Recuperação de créditos, defesa fiscal e auditoria preventiva',
      description:
        'Identificamos oportunidades de recuperação de impostos pagos indevidamente ou a maior nos últimos 5 anos, além de defender sua empresa em autos de infração e realizar auditorias fiscais para blindar a sua operação contra fiscalizações.',
      features: [
        'Levantamento e recuperação de créditos de PIS, COFINS, ICMS, IPI e IRPJ',
        'Revisão fiscal dos últimos 60 meses com cruzamento eletrônico',
        'Elaboração de defesas e recursos administrativos fiscais',
        'Auditoria preventiva de arquivos SPED antes do envio ao Fisco',
        'Regimes tributários especiais e benefícios fiscais setoriais',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=legal%20tax%20audit%20compliance&color=emerald',
      reverse: false,
      provaSocial: 'Transportadora, 55 funcionários: R$ 120 mil/ano de economia na troca de regime',
    },
    {
      id: 'negociacao-creditos-precatorios',
      icon: BadgeDollarSign,
      category: 'Tributário, Créditos & Recuperação',
      title: 'Negociação de Créditos Tributários, Direitos Creditórios e Precatórios',
      subtitle:
        'Ativos federais, estaduais e municipais com due diligence pericial e segurança jurídica.',
      description:
        'Intermediação institucional para compra e venda de precatórios, RPVs e saldos credores homologados (IBS/CBS, PIS/Cofins, ICMS incentivos e dívida ativa securitizada). Permitimos que empresas compensem passivos tributários com deságio atrativo e credores obtenham liquidez imediata à vista.',
      features: [
        'Ativos em todas as esferas: Federal (TRFs), Estadual (TJs) e Municipal',
        'Due diligence pericial e checagem de trânsito em julgado e penhoras',
        'Conformidade estrita: vedação a créditos previdenciários (art. 114, Lei 8.213)',
        'Cessionário ciente de que não herda superpreferência constitutional',
        'Cessão lavrada por escritura pública, habilitação judicial e sigilo total',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=legal%20financial%20documents%20court%20credits&color=blue',
      reverse: true,
      provaSocial:
        'Construtora, 70 funcionários: R$ 310 mil em precatórios negociados com segurança',
    },
    {
      id: 'recuperacao-empresas-dividas',
      icon: FileSpreadsheet,
      category: 'Tributário, Créditos & Recuperação',
      title: 'Recuperação de Empresas & Gestão de Dívidas',
      subtitle:
        'Assessoria completa em negociação de dívidas ou aquisição direta por investidores da rede.',
      description:
        'Duas frentes para empresas asfixiadas por dívidas tributárias, bancárias e trabalhistas: (1) Assessoria de Recuperação com transação tributária, repactuação com credores e uso do ativo fiscal (créditos tributários identificados pelo Recuperador reduzem a dívida na negociação); e (2) Aquisição com Investidores da Rede, onde fundos e investidores parceiros adquirem a operação e assumem a reestruturação.',
      features: [
        'Duas frentes estruturadas: Assessoria sob gestão atual OU Aquisição por investidores',
        'Aquisição com investidores: a rede assume o controle ou minoritário e reestrutura o passivo',
        'Ativo fiscal estratégico: créditos de PIS/Cofins, ICMS e teses abatem o valor na negociação',
        'Transação tributária individual na PGFN/SEFAZ com até 70% de desconto e 145 parcelas',
        'Acordo de Confidencialidade (NDA) rigoroso e proteção patrimonial dos sócios',
      ],
      image:
        'https://img.usecurling.com/p/700/500?q=business%20recovery%20corporate%20handshake%20investors&color=blue',
      reverse: false,
      provaSocial: 'Supermercado, 90 funcionários: R$ 260 mil de dívida tributária renegociada',
    },
  ]

  return (
    <div className="pt-24 pb-20">
      {/* 1. HEADER COM GRADIENTE VERDE */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            Nossos Serviços
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6">
            Soluções completas com excelência técnica e agilidade
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Do operacional ao estratégico, cobrimos todas as áreas essenciais para sua empresa
            operar com segurança, economizar tributos e acelerar seu crescimento.
          </p>
        </div>
      </section>

      {/* 2. ÍNDICE VISUAL DE SERVIÇOS (GRID DE MINI-CARDS NO TOPO) */}
      <section className="py-12 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-300 mb-2">
              Índice de Serviços
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Acesso Rápido às Nossas Soluções
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Selecione um serviço abaixo para navegar diretamente até sua apresentação completa e
              pilares operacionais.
            </p>
          </div>

          <div
            data-testid="indice-servicos-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
          >
            {serviceDetails.map((serv) => {
              const IconComp = serv.icon || Compass
              return (
                <button
                  key={serv.id}
                  type="button"
                  onClick={(e) => handleRolarAteServico(e, serv.id)}
                  className="group text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex items-start gap-3.5 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[#145A32] group-hover:bg-[#145A32] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 truncate mb-0.5">
                      {serv.category}
                    </span>
                    <h3 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-[#145A32] transition-colors leading-snug line-clamp-2">
                      {serv.title}
                    </h3>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 2.1 QUIZ ORIENTADOR: QUAL SERVIÇO É PARA MIM? */}
      <QualServicoParaMim
        aoRecomendar={(idServico) => handleRolarAteServico(undefined, idServico)}
      />

      {/* 3. SEÇÕES DETALHADAS DOS SERVIÇOS AGRUPADAS POR CATEGORIA */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-24">
          {categories.map((catName) => {
            const servicosDoGrupo = serviceDetails.filter((s) => s.category === catName)
            if (servicosDoGrupo.length === 0) return null

            return (
              <div key={catName} className="space-y-12">
                {/* Cabeçalho do Grupo de Categoria */}
                <div className="pb-4 border-b-2 border-emerald-600/30 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#145A32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Grupo Especializado
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-2">
                      {catName}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {servicosDoGrupo.length} {servicosDoGrupo.length === 1 ? 'serviço' : 'serviços'}
                  </span>
                </div>

                <div className="space-y-20">
                  {servicosDoGrupo.map((service) => {
                    const IconComp = service.icon
                    return (
                      <div
                        id={service.id}
                        key={service.id}
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-8 border-t border-slate-100 first:border-t-0 first:pt-0 ${
                          service.reverse ? 'lg:grid-flow-dense' : ''
                        }`}
                      >
                        {/* Imagem */}
                        <div className={service.reverse ? 'lg:col-start-2' : ''}>
                          <div className="rounded-[24px] overflow-hidden shadow-xl border border-slate-200 relative group">
                            <img
                              src={service.image}
                              alt={service.title}
                              className="w-full h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            {IconComp ? (
                              <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-white/40 text-[#145A32]">
                                <IconComp className="w-6 h-6 stroke-[2.5]" />
                              </div>
                            ) : (
                              <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#0A1A13]/90 backdrop-blur-md rounded-xl shadow-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
                                <span>Diamond Group</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Texto */}
                        <div className={service.reverse ? 'lg:col-start-1' : ''}>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200">
                              {IconComp && <IconComp className="w-3.5 h-3.5" />}
                              <span>{service.category || 'Especialidade Contábil'}</span>
                            </div>

                            {service.badgeIncluso && (
                              <span
                                data-testid="badge-incluso-gestao-fiscal"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37] border border-[#D4AF37]/50 shadow-sm"
                              >
                                <Sparkles className="w-3 h-3 text-[#07132B]" />
                                {service.badgeIncluso}
                              </span>
                            )}
                          </div>

                          <h3 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-2">
                            {service.title}
                          </h3>

                          <p className="text-sm font-medium text-[#145A32] mb-4">
                            {service.subtitle}
                          </p>

                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-6">
                            {service.description}
                          </p>

                          {/* Prova social — 1 linha discreta no estilo dos resultados da home */}
                          <div
                            data-testid={`prova-social-${service.id}`}
                            className="mb-6 inline-flex items-start gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-[#145A32] shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-[#145A32] leading-relaxed">
                              {service.provaSocial}
                            </span>
                          </div>

                          {/* Formatos de entrega destacados quando presentes */}
                          {service.deliveryFormats && service.deliveryFormats.length > 0 && (
                            <div className="mb-6 space-y-3">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                                {service.deliveryFormatsTitle || 'Formatos de entrega:'}
                              </p>
                              <div className="grid grid-cols-1 gap-2.5">
                                {service.deliveryFormats.map((format, fIdx) => {
                                  const FIcon = format.icon || CheckCircle2
                                  return (
                                    <div
                                      key={fIdx}
                                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#2ECC71]/40 hover:bg-emerald-50/40 transition-all flex items-start gap-3"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#145A32] flex items-center justify-center shrink-0 mt-0.5">
                                        <FIcon className="w-4 h-4 stroke-[2.2]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900">
                                          {format.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                          {format.description}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Lista de recursos */}
                          <div className="space-y-2.5 mb-8">
                            {service.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 text-sm text-slate-700"
                              >
                                <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5 stroke-[2.5]" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleContratarServico(e, service.title)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 btn-press cursor-pointer"
                            >
                              Contratar este Serviço
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            {service.id === 'diagnostico-360' && (
                              <Link
                                to="/servicos/diagnostico-360"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'contabilidade-digital' && (
                              <Link
                                to="/servicos/contabilidade-digital"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'gestao-fiscal' && (
                              <Link
                                to="/servicos/gestao-fiscal-tributaria"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'assessoria-tributaria' && (
                              <Link
                                to="/servicos/assessoria-tributaria"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'departamento-pessoal' && (
                              <Link
                                to="/servicos/departamento-pessoal"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'consultoria-financeira' && (
                              <Link
                                to="/servicos/consultoria-financeira"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'planejamento-sucessorio-patrimonial' && (
                              <Link
                                to="/servicos/planejamento-sucessorio"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'treinamento-capacitacao' && (
                              <Link
                                to="/servicos/treinamento"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'bpo-contabil' && (
                              <Link
                                to="/servicos/bpo-contabil"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#145A32]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'gestao-recebiveis' && (
                              <Link
                                to="/servicos/gestao-recebiveis"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07132B] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#07132B]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'back-office-50' && (
                              <Link
                                to="/servicos/back-office-50"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07132B] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 transition-all duration-200 hover:-translate-y-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-[#07132B]" />
                                Ver Página Completa & Pilares 5.0
                              </Link>
                            )}

                            {service.id === 'negociacao-creditos-precatorios' && (
                              <Link
                                to="/servicos/negociacao-creditos-precatorios"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] border border-[#D4AF37] transition-all duration-200 hover:-translate-y-0.5 shadow-sm font-bold"
                              >
                                <span>Ver Página Completa & Pilares 5.0</span>
                              </Link>
                            )}

                            {service.id === 'recuperacao-empresas-dividas' && (
                              <Link
                                to="/servicos/recuperacao-empresas-dividas"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] border border-[#D4AF37] transition-all duration-200 hover:-translate-y-0.5 shadow-sm font-bold"
                              >
                                <Sparkles className="w-4 h-4 text-[#07132B]" />
                                <span>Ver Página Completa & Pilares 5.0</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3.1 CTA WHATSAPP: FALE COM UM ESPECIALISTA AGORA */}
      <section
        data-testid="secao-whatsapp-servicos"
        className="py-14 bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white"
        aria-label="Falar com especialista no WhatsApp"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight mb-1.5">
              Prefere conversar agora? Fale no WhatsApp
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto sm:mx-0 leading-relaxed">
              Tire dúvidas sobre qualquer serviço direto com nossa equipe de especialistas —
              resposta rápida, sem robô e sem compromisso ({TELEFONE_EMPRESA_FORMATADO}).
            </p>
          </div>
          <a
            href={buildWhatsAppLink(
              'Olá! Vim pela página de Serviços da Contabilidade 5.0 e quero falar com um especialista.',
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com especialista no WhatsApp"
            data-testid="botao-whatsapp-servicos"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-lg transition-all duration-200 hover:-translate-y-0.5 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </a>
        </div>
      </section>

      {/* 4. OPÇÕES FINAIS: PROPOSTA PERSONALIZADA & AGENDE COM ESPECIALISTA */}
      <SecaoDuplaAcaoFinal
        id="servicos-acoes-finais"
        titulo="Precisa de um pacote sob medida para sua operação?"
        subtitulo="Nossos consultores montam uma proposta que integra exatamente as soluções que o seu negócio precisa hoje, ou conduzem um alinhamento individual com um especialista."
        servicoPreselecionado={servicoContratar}
        modoInicial={modoAcao}
      />
    </div>
  )
}
