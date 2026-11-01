import React from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  CalendarCheck2,
  BarChart3,
  Rocket,
  Target,
  ArrowUpRight,
  Calculator,
  Receipt,
  Users,
  PieChart,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Layers,
  Cpu,
  MonitorCheck,
  AlertTriangle,
  XCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react'

export default function BpoContabil() {
  // 5 Pilares 5.0 do BPO Contábil
  const pilaresBpoContabil5 = [
    {
      id: 'processo-padronizado',
      icon: Layers,
      badge: 'Eficiência Operacional',
      title: 'Processo padronizado',
      description:
        'Fluxos de trabalho estruturados e validados com manuais de rotina, rotulagem contábil uniforme e procedimentos operacionais padrão (SOP) que eliminam gargalos, retrabalho e dependência de pessoas-chave.',
    },
    {
      id: 'tecnologia-ponta-a-ponta',
      icon: Cpu,
      badge: 'Automação Integral',
      title: 'Tecnologia de ponta a ponta',
      description:
        'Infraestrutura conectada via APIs diretas aos bancos, ERPs, emissores de documentos fiscais e plataformas de pagamento, capturando e processando dados em tempo real sem digitação manual.',
    },
    {
      id: 'calendario-obrigacional',
      icon: CalendarCheck2,
      badge: 'Risco Fiscal Zero',
      title: 'Calendário obrigacional sempre em dia',
      description:
        'Gestão centralizada de todas as obrigações principais e acessórias nos âmbitos federal, estadual e municipal. Cada guia, apuração e declaração é auditada e liquidada rigorosamente antes do vencimento.',
    },
    {
      id: 'transparencia-total',
      icon: MonitorCheck,
      badge: 'Visibilidade em Tempo Real',
      title: 'Transparência total (painel do cliente)',
      description:
        'Visão 360° em painel digital exclusivo: acompanhe status de entregas, movimentação financeira conciliada, solicitações em andamento e indicadores de performance gerencial na palma da mão.',
    },
    {
      id: 'time-especialista-multidisciplinar',
      icon: BadgeCheck,
      badge: 'Corpo Técnico Sênior',
      title: 'Time especialista multidisciplinar',
      description:
        'Célula dedicada de especialistas seniores em contabilidade societária, legislação fiscal, departamento pessoal e controladoria, prontos para orientar decisões com rigor técnico e rapidez de resposta.',
    },
  ]

  // 5 Benefícios Aprovados
  const beneficios = [
    {
      icon: TrendingDown,
      title: 'Redução de custo fixo',
      desc: 'Elimine os custos de contratação, encargos trabalhistas, benefícios, softwares de nicho e estrutura física para manter uma equipe contábil e operacional interna.',
    },
    {
      icon: CalendarCheck2,
      title: 'Zero risco de esquecer obrigação',
      desc: 'Calendário fiscal, contábil e trabalhista gerido ativamente por nós, com alertas preventivos e garantia total de cumprimento rigoroso de todos os prazos legais.',
    },
    {
      icon: BarChart3,
      title: 'Dados sempre prontos para decisão',
      desc: 'Fechamento mensal consistente e garantido: balancetes, relatórios de fluxo e DRE analítica entregues com agilidade para embasar as decisões estratégicas dos sócios.',
    },
    {
      icon: Rocket,
      title: 'Escala sem dor de cabeça',
      desc: 'Sua operação cresce em faturamento, filiais e volume de transações sem que você precise abrir processos seletivos ou reorganizar a estrutura interna de suporte.',
    },
    {
      icon: Target,
      title: 'Foco do empresário no que vende',
      desc: 'Libere seu tempo e energia da rotina burocrática de notas, conciliações e guias para concentrar 100% da sua liderança em produto, expansão comercial e clientes.',
    },
  ]

  // 4 Etapas de Implantação Aprovadas
  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico da operação',
      texto:
        'Mapeamento completo dos processos atuais, sistemas de gestão (ERP), fontes de dados bancários, rotinas fiscais e plano de contas da sua empresa.',
    },
    {
      passo: '02',
      titulo: 'Transição assistida',
      texto:
        'Migração estruturada de dados, parametrização de integrações automatizadas, alinhamento de cronogramas e transição de rotinas sem ruídos ou pausas.',
    },
    {
      passo: '03',
      titulo: 'Operação contínua',
      texto:
        'Rotina mensal integralmente sob nosso controle: fiscal, folha, contas a pagar/receber, conciliação diária e faturamento rodando com máxima precisão.',
    },
    {
      passo: '04',
      titulo: 'Acompanhamento',
      texto:
        'Reunião mensal de indicadores e fechamento: análise de resultados, métricas de eficiência operacional e recomendações consultivas para os líderes.',
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
                <Briefcase className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight">
                BPO Contábil 5.0
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#2ECC71] mb-6 tracking-tight">
                Delegue a operação. Mantenha o controle.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Operação fiscal, departamento pessoal, faturamento e contas a pagar/receber
                executadas por especialistas com monitoramento em tempo real, automação e
                indicadores gerenciais.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar BPO Contábil 5.0
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-bpo-contabil"
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
                  src="https://img.usecurling.com/p/700/500?q=business%20process%20outsourcing%20team%20operations&color=emerald"
                  alt="Painel de BPO Contábil 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <MonitorCheck className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">
                    Operação Rodando em Tempo Real
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFÍCIOS (5) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-3">
              Vantagens Competitivas
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Por que migrar sua rotina operacional para o BPO Contábil 5.0
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Substitua custos fixos elevados e preocupações com atrasos fiscais por um modelo
              operacional ágil, auditável e orientado a resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficios.map((b, idx) => {
              const BIcon = b.icon
              const isSpanAcross = idx === 3 && beneficios.length === 5

              return (
                <div
                  key={idx}
                  className={`p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col justify-between ${
                    isSpanAcross ? 'md:col-span-1 lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#145A32] flex items-center justify-center mb-5">
                      <BIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      Benefício 0{idx + 1}
                    </div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900 mb-2.5">
                      {b.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              )
            })}

            {/* Card complementar de suporte consultivo no grid para preencher o 6º espaço */}
            <div className="p-7 rounded-2xl bg-gradient-to-br from-[#0A1A13] to-[#145A32] text-white border border-white/10 flex flex-col justify-between shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/20 text-[#2ECC71] flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
                  Padrão Diamond Group
                </div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-2.5">
                  Segurança, CRC & SLA Garantido
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Contrato transparente de nível de serviço (SLA), com equipe sênior responsável e
                  atendimento ágil via WhatsApp, vídeo ou canal direto corporativo.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-300 mt-4">
                <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>100% integrado ao seu ecossistema</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPARATIVO TRADICIONAL × CONTABILIDADE 5.0 */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30 mb-3">
              Evolução do Modelo
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Tradicional × Contabilidade 5.0
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Compare a terceirização convencional com a metodologia orientada por tecnologia,
              conciliação contínua e controle total do empresário.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Coluna Modelo Tradicional */}
            <div className="rounded-2xl p-8 bg-white/[0.03] border border-rose-500/20 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-400 block">
                      Modelo Passado
                    </span>
                    <h3 className="font-heading font-bold text-xl text-white">
                      Terceirização Tradicional
                    </h3>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Envio caótico de documentos:</strong> cliente
                      precisa separar malotes, imprimir papéis e enviar recibos e notas fiscais
                      soltos no fim do mês.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Comunicação truncada:</strong> o empresário
                      corre atrás do escritório para pedir guias, tirar dúvidas e implorar retorno
                      de mensagens.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Gestão reativa e tardia:</strong> descobre
                      inconsistências, juros, multas ou tributos recolhidos a mais semanas após o
                      fato gerador.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Caixa cego:</strong> sem relatórios gerenciais
                      tempestivos, o empresário opera o negócio sem saber o resultado econômico
                      real.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-rose-300/80">
                Resultado: estresse operacional, retrabalho contínuo e riscos fiscais ocultos.
              </div>
            </div>

            {/* Coluna Modelo Contabilidade 5.0 */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-2 border-[#2ECC71]/50 backdrop-blur-sm flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#2ECC71] text-[#0A1A13] text-[11px] font-bold uppercase tracking-wider shadow">
                Recomendado
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/20 border border-[#2ECC71]/40 flex items-center justify-center text-[#2ECC71]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#2ECC71] block">
                      Operação Inteligente
                    </span>
                    <h3 className="font-heading font-bold text-xl text-white">
                      BPO Contábil 5.0 (Diamond Group)
                    </h3>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Coleta 100% automatizada:</strong> integração
                      direta com extratos bancários (OFX/API), emissores e faturamento sem papelada.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Conciliação contínua:</strong> movimento
                      operacional conferido diariamente, garantindo escrituração atualizada e sem
                      acúmulos.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Alertas preventivos de pendência:</strong>{' '}
                      aviso de certidões, prazos e impostos antes da data de vencimento, com tempo
                      hábil de planejamento.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Painel executivo de indicadores:</strong>{' '}
                      acesso em tempo real a gráficos de margem, caixa, impostos e obrigações no
                      celular ou computador.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-emerald-300">
                Resultado: economia real de tempo, segurança jurídica absoluta e clareza para
                crescer.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PASSO A PASSO (4 ETAPAS DE IMPLANTAÇÃO) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona a implantação do BPO Contábil 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Transição assistida e estruturada em 4 etapas, planejada para que a sua empresa nunca
              sofra parada ou retrabalho no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasImplantacao.map((etapa, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group hover:border-[#2ECC71]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-extrabold font-heading text-[#2ECC71] mb-3">
                    {etapa.passo}
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 mb-2">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{etapa.texto}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#145A32] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span>Etapa estruturada</span>
                </div>
              </div>
            ))}
          </div>

          {/* Destaque das rotinas operacionais assumidas */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#145A32] flex items-center justify-center">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                  Escopo abrangente de operações assumidas pela nossa equipe:
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Integração vertical de todas as áreas de suporte que tomam tempo do seu negócio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Rotina Fiscal & Tributária</strong>
                Emissão, validação de notas fiscais, apuração de impostos e entrega de obrigações do
                SPED.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Departamento Pessoal</strong>
                Folha de pagamento, pró-labore, eSocial, controle de férias, admissões e rescisões.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Contas a Pagar & Receber</strong>
                Agendamento bancário sob aprovação dos sócios, emissão de boletos e conciliação
                diária.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Faturamento & Cobrança</strong>
                Processamento tempestivo de faturamento, conciliação de cartões e monitoramento de
                recebíveis.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OS 5 PILARES 5.0 (NO FINAL DA PÁGINA, COMO NAS DEMAIS) */}
      <section
        id="pilares-bpo-contabil"
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
              <span>BPO Contábil 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do BPO Contábil 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Estrutura corporativa desenhada para garantir excelência operacional, dados sempre
              auditáveis e autonomia total para o crescimento da sua empresa.
            </p>
          </div>

          {/* Grade de 5 cards com texto 100% visível */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresBpoContabil5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanAcross = idx === 3 && pilaresBpoContabil5.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2ECC71]/60 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanAcross ? 'lg:col-span-1' : ''
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
                      Incluso no BPO Contábil 5.0
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
                <Briefcase className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Pronto para delegar a rotina e manter o controle total do seu negócio?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Processo de transição 100% assistido, sem risco operacional e com equipe sênior
                  dedicada.
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

      {/* 6. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL */}
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
                to="/servicos/bpo-contabil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-white/5 hover:bg-white/10 border border-emerald-400/20 transition-all"
              >
                <Briefcase className="w-4 h-4 text-[#2ECC71]" />
                BPO Contábil 5.0
              </Link>
              <Link
                to="/servicos/back-office-50"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Back Office 5.0
              </Link>
              <Link
                to="/servicos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
              >
                Ver Todos os Serviços
                <ArrowUpRight className="w-4 h-4" />
              </Link>{' '}
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
              Solicite uma proposta personalizada de BPO
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Nossa equipe dimensiona a célula de atendimento e as rotinas ideais para o tamanho,
              volume transacional e particularidades do seu segmento.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor de BPO
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
