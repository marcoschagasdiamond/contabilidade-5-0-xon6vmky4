import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
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
  PieChart,
  ShieldCheck,
  GraduationCap,
  Coins,
  FileSpreadsheet,
  Handshake,
  FileSearch,
  Scale,
  SearchCheck,
  FileCheck2,
  BarChart3,
  Cpu,
  Briefcase,
} from 'lucide-react'

export default function AssessoriaTributaria() {
  // Os 5 Pilares 5.0 da Assessoria Tributária Especializada (texto integralmente visível — sem tooltips)
  const pilaresAssessoriaTributaria5 = [
    {
      id: 'varredura-quinquenal',
      icon: SearchCheck,
      badge: 'Auditoria Retrospectiva',
      title: 'Varredura quinquenal contínua',
      description:
        'Auditoria fiscal e contábil retrospectiva dos últimos 60 meses, examinando minunciosamente cada fato gerador, recolhimento a maior ou indevido e oportunidades lícitas não aproveitadas pelo negócio dentro do prazo prescricional legal.',
    },
    {
      id: 'inteligencia-cruzamento',
      icon: Cpu,
      badge: 'Malha Preditiva',
      title: 'Inteligência de cruzamento de declarações (ECF/ECD/DCTF/EFD/eSocial)',
      description:
        'Algoritmos de conciliação analítica cruzando obrigações federais, estaduais e trabalhistas exatamente como os robôs de fiscalização da Receita Federal e SEFAZ operam, eliminando assimetrias antes do Fisco emitir qualquer notificação.',
    },
    {
      id: 'laudo-capag',
      icon: BarChart3,
      badge: 'Transação Tributária',
      title: 'Laudo técnico-econômico e rating CAPAG',
      description:
        'Modelagem contábil, financeira e jurídica da capacidade de pagamento real da empresa perante a PGFN e RFB, fundamentando a defesa estratégica do rating CAPAG para alcançar os maiores descontos legais e prazos estendidos de amortização.',
    },
    {
      id: 'auditoria-preventiva-sped',
      icon: FileSearch,
      badge: 'Zero Autuação',
      title: 'Auditoria preventiva de SPED',
      description:
        'Validação cirúrgica de inconsistências entre ECD, ECF, EFD Contribuições, EFD ICMS/IPI e DCTFWeb antes da transmissão oficial ao Fisco, assegurando conciliação rigorosa com a escrituração contábil e saneamento no prazo legal.',
    },
    {
      id: 'dossie-defesa-fiscal',
      icon: ShieldCheck,
      badge: 'Blindagem Ativa',
      title: 'Dossiê de defesa fiscal sempre pronto',
      description:
        'Estruturação contínua de arquivo comprobatório, memórias de cálculo, notas fiscais, contratos e laudos técnicos prontos para subsidiar impugnações, recursos voluntários e respostas tempestivas, convertendo passivos iminentes em segurança jurídica.',
    },
  ]

  // 4 Benefícios Estratégicos
  const beneficios = [
    {
      icon: Coins,
      title: 'Créditos que a empresa já tem e não usa',
      desc: 'Levantamento minucioso de tributos recolhidos a maior ou indevidamente nos últimos 5 anos, convertidos em caixa real por restituição ou compensação administrativa homologada.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Folha revisada com base legal',
      desc: 'Saneamento da incidência de encargos previdenciários e IRRF sobre verbas indenizatórias na folha, fundamentado no Art. 34 da IN RFB nº 2110/2022 e na Reforma Trabalhista.',
    },
    {
      icon: Handshake,
      title: 'Passivo tributário negociado com estratégia',
      desc: 'Atuação do desbloqueio de contas à aprovação de transações junto à PGFN/RFB, com laudos técnico-econômicos para obter descontos máximos em juros e multas.',
    },
    {
      icon: ShieldAlert,
      title: 'Defesa que nasce antes da fiscalização',
      desc: 'Auditoria prévia de declarações SPED e cruzamento eletrônico contínuo: quando a intimação chega, o dossiê probatório e a impugnação técnica já estão estruturados.',
    },
  ]

  // Passo a passo de atuação em 4 etapas
  const etapasImplantacao = [
    {
      passo: '01',
      titulo: 'Diagnóstico & varredura de 5 anos',
      texto:
        'Exame aprofundado dos registros fiscais, contábeis, trabalhistas e bancários dos últimos 60 meses, mapeando riscos latentes, inconformidades e potenciais ativos ocultos.',
    },
    {
      passo: '02',
      titulo: 'Cruzamento de declarações & quantificação',
      texto:
        'Confronto automatizado entre ECF, ECD, DCTF, EFD Contribuições, EFD ICMS/IPI e eSocial, apurando com exatidão matemática cada crédito, tese cabível ou assimetria fiscal.',
    },
    {
      passo: '03',
      titulo: 'Estratégia: crédito, folha e dívida',
      texto:
        'Estruturação do plano consultivo: protocolo de compensações administrativas, retificação das rubricas da folha de pagamento e montagem de laudo CAPAG para dívidas ativas.',
    },
    {
      passo: '04',
      titulo: 'Execução, homologação & defesa contínua',
      texto:
        'Acompanhamento processual até a homologação final perante a RFB/PGFN, defesas administrativas robustas e monitoramento preventivo de novas entregas de SPED.',
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
                <ShieldAlert className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Serviço Especializado • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6 leading-tight">
                Assessoria Tributária Especializada 5.0
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Assessoria tributária de alta complexidade: recuperação de créditos fiscais
                estratégicos, saneamento de tributos da folha de pagamento, negociação estruturada
                de passivos com a PGFN e defesa fiscal preventiva via auditoria de SPED dos últimos
                5 anos.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Contratar Assessoria Tributária 5.0
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href="#pilares-assessoria-tributaria"
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
                  src="https://img.usecurling.com/p/700/500?q=tax%20audit%20legal%20compliance%20court&color=emerald"
                  alt="Painel de Assessoria Tributária Especializada 5.0"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#0A1A13]/85 backdrop-blur-md rounded-xl shadow-lg border border-white/15 text-[#2ECC71] flex items-center gap-2.5">
                  <Scale className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-xs font-semibold text-white">
                    Auditoria Quinquenal & Defesa Fiscal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. APRESENTAÇÃO CONSULTIVA & VISÃO GERAL */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-3">
              Abordagem Consultiva de Alta Complexidade
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Inteligência tributária de ponta a ponta para proteger o caixa e blindar o patrimônio
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              O sistema tributário brasileiro penaliza empresas que não auditam suas próprias
              declarações. Nossa equipe combina juristas, auditores e contadores sênior para
              resgatar valores pagos a maior, renegociar passivos paralisantes e construir defesas
              fiscais antes mesmo da intimação formal.
            </p>
          </div>

          {/* 4 Benefícios Estratégicos */}
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
        </div>
      </section>

      {/* 3. OS 4 BLOCOS DE CONTEÚDO PRINCIPAIS (DIFERENCIAL DA PÁGINA) */}
      <section className="py-20 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Frentes de Atuação Técnica
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Os 4 grandes eixos da nossa Assessoria Tributária
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Cada linha de atuação conta com metodologia própria de exame documental, cruzamento
              algorítmico de declarações e fundamentação jurídica consolidada nos tribunais e na
              Receita Federal.
            </p>
          </div>

          <div className="space-y-10">
            {/* BLOCO 1: RECUPERAÇÃO DE CRÉDITOS TRIBUTÁRIOS */}
            <div className="p-8 sm:p-10 rounded-[24px] bg-white border border-slate-200 shadow-sm hover:border-[#2ECC71]/50 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-[#145A32] flex items-center justify-center shrink-0">
                  <Coins className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200/80 mb-2">
                    Eixo 01 • Ativo Financeiro
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-slate-900 mb-3">
                    Recuperação de Créditos Tributários
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                    A grande maioria das médias e grandes empresas recolhe impostos a maior sem
                    perceber, seja por interpretação conservadora da legislação ou por falhas nos
                    sistemas de escrita. Realizamos o levantamento integral e o creditamento lícito
                    nos termos da lei.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-slate-900 mb-1">
                          Créditos de PIS e COFINS
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Revisão minuciosa da apuração e do aproveitamento de insumos essenciais de
                          acordo com a legislação, jurisprudência do STJ/STF e soluções de consulta
                          vinculantes da Receita Federal do Brasil.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-slate-900 mb-1">
                          Apuração do IRPJ e da CSLL (Lalur)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Revisão da apuração através das declarações, centros de custos e do Livro
                          de Apuração do Lucro Real (Lalur), identificando exclusões, adições
                          indevidas e incentivos fiscais não aplicados.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-slate-900 mb-1">
                          Cruzamento das Obrigações Acessórias Federais
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Revisão e cruzamento profundo de dados contidos na ECF, ECD, DCTF, EFD
                          Contribuições e demais controles operacionais da empresa, saneando
                          divergências que geram glosas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-slate-900 mb-1">
                          Exame dos Últimos 5 Anos (60 Meses)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Exame minucioso e criterioso dos registros fiscais e contábeis de 5 anos
                          entregues ao Fisco, buscando plena conformidade legal e mensuração exata
                          do montante financeiro passível de recuperação.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 2: REVISÃO TRIBUTÁRIA DA FOLHA DE PAGAMENTO */}
            <div className="p-8 sm:p-10 rounded-[24px] bg-white border border-slate-200 shadow-sm hover:border-[#2ECC71]/50 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-[#145A32] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200/80 mb-2">
                    Eixo 02 • Encargos Trabalhistas & Previdenciários
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-slate-900 mb-3">
                    Revisão Tributária da Folha de Pagamento
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                    Muitos softwares de folha mantêm parâmetros genéricos que tributam indevidamente
                    verbas de natureza indenizatória. Auditamos evento por evento com base na
                    legislação atualizada para reduzir o custo mensal e recuperar o recolhimento
                    passado.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">
                          Análise da base de cálculo das rubricas/eventos:
                        </strong>{' '}
                        Auditoria de cada código de provento e desconto configurado no sistema de
                        processamento da empresa à luz da legislação previdenciária e trabalhista
                        vigente.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">
                          Conformidade com a IN RFB nº 2110/2022 (Art. 34) e Convenções Coletivas:
                        </strong>{' '}
                        Revisão de parâmetros fundamentada no artigo que define expressamente as
                        verbas imunes à incidência de contribuição previdenciária (INSS patronal e
                        RAT/FAP) e retenção de IRRF.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">
                          Impactos da Lei nº 13.467/2017 (Reforma Trabalhista):
                        </strong>{' '}
                        Enquadramento seguro das verbas alteradas pela reforma (como diárias,
                        prêmios por desempenho e abonos) que passaram a não sofrer incidência de
                        contribuições sociais e previdenciárias.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">
                          Cruzamento eSocial e resumos mês a mês dos últimos 5 anos:
                        </strong>{' '}
                        Levantamento dos créditos tributários da folha através do cruzamento
                        analítico com eventos periódicos do eSocial e resumos contábeis, habilitando
                        a compensação na DCTFWeb.
                      </div>
                    </div>
                  </div>

                  {/* Link / Atalho de conexão com o Departamento Pessoal */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#145A32] shrink-0" />
                      <div className="text-xs sm:text-sm text-slate-700">
                        <span className="font-semibold text-[#145A32]">Conexão Estratégica:</span>{' '}
                        Conheça também nossa rotina completa de fechamento de folha e eSocial
                        contínuo.
                      </div>
                    </div>
                    <Link
                      to="/servicos/departamento-pessoal"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#145A32] hover:text-[#2ECC71] transition-colors whitespace-nowrap"
                    >
                      Ver Departamento Pessoal 5.0
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 3: NEGOCIAÇÃO DE DÍVIDA TRIBUTÁRIA */}
            <div className="p-8 sm:p-10 rounded-[24px] bg-white border border-slate-200 shadow-sm hover:border-[#2ECC71]/50 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-[#145A32] flex items-center justify-center shrink-0">
                  <Handshake className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200/80 mb-2">
                    Eixo 03 • Transação Tributária & Recuperação
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-slate-900 mb-3">
                    Negociação de Dívida Tributária
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                    O passivo tributário acumulado cria riscos severos: bloqueio judicial de contas
                    bancárias, inscrição no Cadin, restrição de crédito e paralisia do crescimento
                    empresarial. Atuamos estrategicamente com a metodologia{' '}
                    <strong>"do desbloqueio à aprovação"</strong>:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#145A32] font-bold text-xs flex items-center justify-center mb-3">
                          Etapa A
                        </div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 mb-2">
                          Diagnóstico & Simulação da Dívida
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Mapeamento completo das CDAs (Certidões de Dívida Ativa) e débitos em
                          cobrança, com defesa estratégica contra travas de faturamento, cautelares
                          fiscais e imputações indevidas para habilitar a empresa à negociação.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#145A32] font-bold text-xs flex items-center justify-center mb-3">
                          Etapa B
                        </div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 mb-2">
                          Laudo Técnico & Rating CAPAG
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Elaboração de laudo pericial técnico-econômico demonstrando a real
                          Capacidade de Pagamento (CAPAG) do contribuinte perante o Fisco, focando
                          estrategicamente na maximização dos descontos legais sobre juros, multas e
                          encargos.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#145A32] font-bold text-xs flex items-center justify-center mb-3">
                          Etapa C
                        </div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 mb-2">
                          Proposta, Negociação & Homologação
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Estruturação da proposta ideal via Transação Individual ou por Adesão
                          (Edital PGFN/RFB), conduzindo tratativas formais até a homologação
                          definitiva, emissão de CND e liberação de garantias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 4: DEFESA FISCAL E AUDITORIA PREVENTIVA DE SPED */}
            <div className="p-8 sm:p-10 rounded-[24px] bg-gradient-to-br from-slate-900 to-[#0A1A13] text-white border border-white/10 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30 flex items-center justify-center shrink-0">
                  <FileSearch className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-2">
                    Eixo 04 • Blindagem de Declarações
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-white mb-3">
                    Defesa Fiscal e Auditoria Preventiva de SPED
                  </h3>

                  {/* Texto aprovado como base */}
                  <blockquote className="p-4 sm:p-5 rounded-xl bg-white/[0.05] border-l-4 border-[#2ECC71] text-sm sm:text-base text-slate-200 leading-relaxed mb-6 italic">
                    "Defesa fiscal que começa antes do envio. Toda autuação nasce de uma declaração
                    enviada com erro. Por isso, auditamos preventivamente os arquivos SPED (ECD,
                    ECF, EFD ICMS/IPI e EFD Contribuições) antes do envio ao Fisco: validação de
                    consistência entre declarações, conciliação com a contabilidade e correção
                    dentro do prazo. Quando a intimação chega, a empresa já chega defendida — com
                    dossiê documental organizado, parecer técnico e resposta no tempo legal,
                    transformando risco em tranquilidade."
                  </blockquote>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                      <span>
                        Validação de consistência entre arquivos SPED e DCTFWeb antes do envio
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                      <span>Conciliação analítica com os balancetes e lançamentos contábeis</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                      <span>
                        Dossiê probatório e parecer técnico pré-estruturados para impugnação
                        tempestiva
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPARATIVO: ASSESSORIA TRADICIONAL × ASSESSORIA TRIBUTÁRIA 5.0 */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A13] text-white border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Evolução do Modelo
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-3">
                  Assessoria Tradicional × Assessoria Tributária 5.0
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Enquanto a assessoria convencional atua de forma puramente reativa — aguardando a
                  notificação do fiscal para começar a procurar documentos desordenados e oferecendo
                  parcelamentos padrão sem desconto —, a Assessoria Tributária 5.0 cruza os dados
                  previamente com os mesmos critérios da malha da Receita, gerando caixa por
                  recuperação e solvência por negociação fundamentada.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De esperar a autuação para auditar o SPED antes de qualquer transmissão
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De parcelamentos caros para transação estratégica com laudo CAPAG e desconto
                      máximo
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>
                      De créditos esquecidos no passado para varredura algorítmica dos últimos 60
                      meses
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-heading font-bold text-base text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  Diferenciais de entrega da Contabilidade 5.0:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Cruzamento ECF × ECD × DCTF × EFD com tecnologia própria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Revisão de verbas indenizatórias na folha (IN RFB 2110/2022)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Defesa estratégica do rating CAPAG perante a PGFN/RFB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>Auditoria preventiva de arquivos SPED antes da entrega</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2ECC71] font-bold">•</span>
                    <span>
                      Atuação multidisciplinar: tributaristas, contadores e advogados seniores
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMO FUNCIONA O PASSO A PASSO DE ATUAÇÃO */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-100/70 border border-emerald-200 mb-3">
              Passo a Passo
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona o ciclo da Assessoria Tributária 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Metodologia transparente e segura, desde a varredura inicial até a compensação
              financeira homologada ou resolução definitiva da pendência fiscal.
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

      {/* 6. SEÇÃO NO FINAL DA PÁGINA: OS 5 PILARES DA ASSESSORIA TRIBUTÁRIA 5.0 (TÓPICO PRÓPRIO DEDICADO, TEXTO VISÍVEL — NUNCA TOOLTIPS) */}
      <section
        id="pilares-assessoria-tributaria"
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
              <span>Assessoria Tributária 5.0</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares da Assessoria Tributária 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mais do que atuar após a notificação: conheça os 5 pilares que unem varredura contínua
              de 5 anos, cruzamento inteligente de obrigações, laudo técnico-econômico e blindagem
              ativa de declarações SPED.
            </p>
          </div>

          {/* Grade de 5 cards compactos com texto integralmente visível (sem tooltip) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresAssessoriaTributaria5.map((item, idx) => {
              const ItemIcon = item.icon
              const isSpanTwo = idx === 3 && pilaresAssessoriaTributaria5.length === 5

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
                      Incluso na Assessoria Tributária 5.0
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
                <ShieldAlert className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                  Sua empresa possui passivos fiscais ou dúvidas sobre créditos tributários?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Converse com nossos tributaristas seniores para uma avaliação inicial sem
                  compromisso.
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

      {/* 7. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL (ATALHOS CRUZADOS) */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">
                Conheça Mais Soluções
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Precisa de outras especialidades contábeis ou financeiras?
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
              Nossa equipe dimensiona o escopo ideal de assessoria tributária com base no perfil de
              obrigações, volume de faturamento e passivos acumulados da sua empresa.
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
