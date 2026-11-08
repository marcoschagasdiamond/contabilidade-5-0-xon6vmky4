import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingDown,
  Building2,
  Scale,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Coins,
  Briefcase,
  Users,
  Search,
  Handshake,
  FileCheck,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import LeadForm from '@/components/LeadForm'
import {
  WHATSAPP_EMPRESA_NUMERO,
  TELEFONE_EMPRESA_FORMATADO,
  WHATSAPP_MENSAGEM_PADRAO_HOME,
} from '@/config/empresa'
export default function RecuperacaoEmpresasDividas() {
  const mensagemWhatsApp = encodeURIComponent(
    'Olá! Tenho interesse no serviço de Recuperação de Empresas & Gestão de Passivos da Contabilidade 5.0. Gostaria de uma avaliação preliminar confidencial.',
  )
  const linkWhatsApp = `https://wa.me/${WHATSAPP_EMPRESA_NUMERO}?text=${mensagemWhatsApp}`

  // 5 Pilares 5.0 da Recuperação de Empresas
  const pilaresRecuperacao50 = [
    {
      id: 'diagnostico-360-passivo',
      badge: 'Pilar 01 • Rigor Pericial',
      title: 'Diagnóstico 360° do Passivo & Raio-X de Liquidez',
      description:
        'Auditoria completa de dívidas tributárias (PGFN, Receita Federal, SEFAZ e Prefeituras), bancárias, trabalhistas e com fornecedores. Classificação por ordem de preferência legal, risco de constrição patrimonial e juros embutidos.',
    },
    {
      id: 'ativo-fiscal-compensacao',
      badge: 'Pilar 02 • Ativo Fiscal Estratégico',
      title: 'Compensação Tributária com Ativo Fiscal Homologado',
      description:
        'Mapeamento de créditos tributários acumulados (PIS/Cofins, ICMS, IBS/CBS, teses homologadas e precatórios) via Recuperador de Créditos e Mesa de Negociação para abater até 70% da dívida consolidada antes de qualquer desembolso de caixa.',
    },
    {
      id: 'renegociacao-transacao-tributaria',
      badge: 'Pilar 03 • Negociação Qualificada',
      title: 'Transação Tributária Individual & Acordos Qualificados',
      description:
        'Adesão estratégica a editais e transações individuais da PGFN (Portaria PGFN nº 6.757) e programas estaduais, obtendo deságios sobre multas e juros, carências estendidas e parcelamentos de até 145 meses com capacidade de pagamento (CAPAG) revisada.',
    },
    {
      id: 'aquisicao-investidores-rede',
      badge: 'Pilar 04 • Reestruturação Societária',
      title: 'Aquisição com Investidores da Rede Diamond Group',
      description:
        'Para empresas com operações viáveis mas asfixiadas pelo passivo financeiro, nossa rede de fundos e investidores parceiros assume o controle societário ou minoritário, injetando capital novo e assumindo a reestruturação da dívida.',
    },
    {
      id: 'blindagem-sigilo-absoluto',
      badge: 'Pilar 05 • Governança & Sigilo',
      title: 'Acordo de Confidencialidade (NDA) & Proteção Patrimonial',
      description:
        'Tratamento sob sigilo corporativo estrito desde o primeiro contato. Definição de estratégia jurídica e societária para salvaguardar a continuidade operacional, os empregos e o patrimônio dos sócios de forma estritamente legal.',
    },
  ]

  // 4 Etapas do Processo
  const etapasProcesso = [
    {
      numero: '01',
      titulo: 'Diagnóstico Confidencial & Auditoria do Passivo',
      descricao:
        'Assinatura do NDA (acordo de não divulgação). Levantamento detalhado de débitos tributários, execuções fiscais, contingências trabalhistas, dívidas bancárias e contratos de fornecedores.',
    },
    {
      numero: '02',
      titulo: 'Mapeamento do Ativo Fiscal & Capacidade de Caixa',
      descricao:
        'Processamento no Recuperador de Créditos 5.0 e cruzamento com teses tributárias. Apuração do ativo fiscal real para compensação imediata ou cessão de créditos via mesa especializada.',
    },
    {
      numero: '03',
      titulo: 'Plano de Ação: Negociação ou Aquisição por Investidores',
      descricao:
        'Apresentação de dois caminhos estruturados: (A) Assessoria com credores, transação tributária e reestruturação operacional; ou (B) Entrada de investidores da rede para compra, aporte de liquidez e absorção do passivo.',
    },
    {
      numero: '04',
      titulo: 'Execução, Homologação & Retomada da CND',
      descricao:
        'Formalização dos acordos, suspensão de execuções fiscais, emissão de Certidão Positiva com Efeitos de Negativa (CPEN) e retomada da capacidade plena de faturamento e crédito da empresa.',
    },
  ]

  return (
    <div className="pt-24 pb-20 bg-white text-slate-800">
      {/* 1. HERO COM GRADIENTE INSTITUCIONAL E CALL TO ACTIONS */}
      <section className="bg-gradient-to-r from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white py-20 px-4 sm:px-6 relative overflow-hidden border-b border-[#D4AF37]/30">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="mb-6">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-white transition-colors"
            >
              ← Voltar para Todos os Serviços
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 mb-5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Reestruturação Corporativa • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight text-white">
                Recuperação de Empresas, Gestão de Passivos & Aquisição Estratégica
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#D4AF37] mb-6 tracking-tight">
                Duas frentes para salvar e reerguer negócios com passivo tributário, bancário e
                operacional.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-3xl">
                Soluções reais para empresários asfixiados por execuções fiscais e juros abusivos.
                Atuamos na <strong className="text-white">Assessoria de Recuperação</strong>{' '}
                (negociação qualificada, transação tributária e ativo fiscal) e na{' '}
                <strong className="text-[#D4AF37]">Aquisição com Investidores da Rede</strong>, onde
                fundos parceiros adquirem a operação e assumem a dívida.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#formulario-recuperacao"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base text-[#07132B] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.35)] transition-all duration-200 hover:-translate-y-0.5 text-center btn-press"
                >
                  Solicitar Avaliação Confidencial
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </a>

                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-[#2ECC71]/40 bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20 transition-all duration-200 text-center"
                >
                  <PhoneCall className="w-4 h-4 text-[#2ECC71]" />
                  <span>WhatsApp: {TELEFONE_EMPRESA_FORMATADO}</span>
                </a>

                <a
                  href="#pilares-recuperacao-50"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-slate-300 border border-white/20 hover:border-white hover:bg-white/10 transition-all duration-200 text-center"
                >
                  Ver Pilares 5.0
                </a>
              </div>
            </div>

            {/* Card lateral do Hero: Resumo Rápido */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl p-6 bg-white/[0.05] border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    100% Confidencial • Sigilo Rígido
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-white mb-3">
                  Quando acionar este serviço?
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2 pb-2 border-b border-white/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>Execuções fiscais ativas da PGFN, SEFAZ ou Prefeitura</span>
                  </li>
                  <li className="flex items-start gap-2 pb-2 border-b border-white/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>Dívidas bancárias asfixiando o fluxo de caixa diário</span>
                  </li>
                  <li className="flex items-start gap-2 pb-2 border-b border-white/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>Inviabilidade de emitir CND para fechar novos contratos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span>Sócios que desejam sair do negócio sem carregar a dívida</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER DE SIGILO E CONFIDENCIALIDADE */}
      <section className="bg-[#0A1A13] border-b border-[#2ECC71]/30 py-5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.04] border border-[#2ECC71]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/20 text-[#2ECC71] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-white">
                  Garantia de Sigilo & Não Divulgação (NDA)
                </h4>
                <p className="text-xs text-slate-300">
                  Todas as tratativas são resguardadas por sigilo corporativo absoluto antes mesmo
                  do envio de balancetes.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#2ECC71] px-3 py-1 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 shrink-0">
              Proteção Jurídica para os Sócios
            </span>
          </div>
        </div>
      </section>

      {/* 2. AS DUAS FRENTES DE ATUAÇÃO (DESTAQUE MÁXIMO) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Estratégias de Resolução
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Duas frentes estruturadas para o futuro da sua empresa
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Dependendo do apetite dos sócios e da saúde operacional do negócio, desenhamos o plano
              sob medida: recuperação sob a gestão atual ou venda para investidores da rede.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* FRENTE 1: ASSESSORIA DE RECUPERAÇÃO */}
            <div className="rounded-3xl p-8 sm:p-10 bg-white border-2 border-emerald-500/30 hover:border-[#2ECC71] shadow-xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#145A32] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    Frente 01 • Gestão Atual Mantida
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#145A32] flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-heading font-extrabold text-2xl text-slate-900 mb-3">
                  Assessoria de Recuperação & Reestruturação
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Para o empresário que deseja continuar no comando do negócio, recuperar o fôlego
                  de caixa, estancar execuções e recolocar a operação em crescimento sustentável.
                </p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm block">
                        Diagnóstico Completo da Dívida:
                      </strong>
                      <span className="text-xs text-slate-600">
                        Mapeamento de contingências fiscais, bancárias, trabalhistas e contratos com
                        fornecedores essenciais.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm block">
                        Negociação Qualificada com Credores:
                      </strong>
                      <span className="text-xs text-slate-600">
                        Intermediação com bancos, desconto de juros abusivos, repactuação de prazos
                        e transações tributárias com deságio histórico na PGFN/SEFAZ.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm block">
                        Reestruturação Operacional & Fiscal:
                      </strong>
                      <span className="text-xs text-slate-600">
                        Adequação de custos fixos, revisão de margens e migração para o regime
                        tributário mais econômico (Simples, Presumido ou Real).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 text-sm block">
                        Planejamento de Fluxo de Caixa:
                      </strong>
                      <span className="text-xs text-slate-600">
                        Previsibilidade de receitas e despesas com governança 5.0 e conciliação
                        bancária contínua para evitar nova inadimplência.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Resultado para o empresário:
                </span>
                <p className="text-xs text-[#145A32] font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  Manutenção do controle do negócio, redução expressiva do passivo e retorno da CND.
                </p>
              </div>
            </div>

            {/* FRENTE 2: AQUISIÇÃO COM INVESTIDORES */}
            <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-[#07132B] to-[#0B1E3F] text-white border-2 border-[#D4AF37] shadow-2xl flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-[#D4AF37] text-[#07132B] text-xs font-bold uppercase tracking-wider shadow-md">
                Oportunidade Estratégica
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] px-3 py-1 rounded-full bg-white/10 border border-[#D4AF37]/40">
                    Frente 02 • Saída Honrosa dos Sócios
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-heading font-extrabold text-2xl text-white mb-3">
                  Aquisição com Investidores da Rede
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  A empresa endividada é <strong className="text-white">adquirida</strong> por
                  investidores e fundos da nossa rede, que assumem a reestruturação e a liquidação
                  do passivo, liberando os sócios fundadores.
                </p>

                <div className="space-y-3.5 pt-4 border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm block">
                        Assunção e Renegociação do Passivo:
                      </strong>
                      <span className="text-xs text-slate-300">
                        O grupo adquirente assume a responsabilidade de renegociação das dívidas
                        bancárias, trabalhistas e tributárias com capacidade financeira de aporte.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm block">
                        Injeção de Capital Novo & Turnaround:
                      </strong>
                      <span className="text-xs text-slate-300">
                        Aporte imediato de capital de giro para honrar folha, recuperar fornecedores
                        estratégicos e reativar a capacidade produtiva da empresa.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm block">
                        Desvinculação Segura dos Sócios:
                      </strong>
                      <span className="text-xs text-slate-300">
                        Estruturação societária e contratual para retirar garantias pessoais e
                        avales bancários dos antigos proprietários dentro da estrita legalidade.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-sm block">
                        Preservação da Operação & Empregos:
                      </strong>
                      <span className="text-xs text-slate-300">
                        A marca, clientes e postos de trabalho continuam ativos, evitando o processo
                        doloroso e custoso de falência judicial.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Resultado para o empresário:
                </span>
                <p className="text-xs text-[#D4AF37] font-semibold bg-white/5 p-3 rounded-xl border border-[#D4AF37]/30">
                  Fim do desgaste pessoal com credores, preservação do patrimônio familiar e
                  recomeço limpo no mercado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. O GRANDE DIFERENCIAL: O "ATIVO FISCAL" COMO MOEDA DE TROCA */}
      <section className="py-20 bg-gradient-to-r from-[#0A1A13] via-[#0E2E1E] to-[#0A1A13] text-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
                Diferencial Exclusivo Contabilidade 5.0
              </span>

              <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
                O Ativo Fiscal: como créditos tributários reduzem sua dívida
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-6">
                A maioria das empresas endividadas desconhece que pagou tributos a maior nos últimos
                5 anos ou possui créditos acumulados. Na esteira 5.0, conectamos o{' '}
                <strong className="text-[#2ECC71]">Recuperador de Créditos</strong> e a{' '}
                <strong className="text-[#D4AF37]">Mesa de Negociação de Precatórios</strong> para
                transformar teses jurídicas e saldos fiscais em poder de barganha contra a dívida.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                  <Coins className="w-5 h-5 text-[#2ECC71] mb-2" />
                  <h4 className="font-heading font-bold text-sm text-white mb-1">
                    Compensação Cruzada
                  </h4>
                  <p className="text-xs text-slate-300">
                    Créditos homologados de PIS/Cofins, INSS (folha) e ICMS abatem débitos
                    tributários correntes ou parcelados.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                  <Handshake className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h4 className="font-heading font-bold text-sm text-white mb-1">
                    Aquisição de Títulos com Deságio
                  </h4>
                  <p className="text-xs text-slate-300">
                    Utilização de precatórios e direitos creditórios adquiridos com deságio para
                    quitar dívida ativa na PGFN/SEFAZ (ECs 113 e 114).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/recuperador-creditos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                >
                  Conhecer o Recuperador de Créditos
                  <ExternalLink className="w-3.5 h-3.5 text-[#2ECC71]" />
                </Link>
                <Link
                  to="/servicos/negociacao-creditos-precatorios"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 transition-all"
                >
                  Mesa de Negociação de Créditos
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.06] border border-emerald-400/30 backdrop-blur-md">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] block mb-2">
                  Exemplo de Impacto no Caixa
                </span>
                <h3 className="font-heading font-bold text-lg text-white mb-4">
                  Redução Real da Dívida Consolidada
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-300">Passivo Fiscal Original:</span>
                    <span className="font-mono font-bold text-rose-300">R$ 2.400.000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-300">Ativo Fiscal Mapeado (Créditos):</span>
                    <span className="font-mono font-bold text-[#2ECC71]">- R$ 780.000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-300">Deságio em Transação (Multas/Juros):</span>
                    <span className="font-mono font-bold text-[#2ECC71]">- R$ 650.000</span>
                  </div>
                  <div className="flex justify-between py-2.5 pt-3 text-white font-bold text-sm bg-white/5 px-3 rounded-lg border border-white/10">
                    <span>Saldo Efetivo a Parcelar:</span>
                    <span className="font-mono text-[#D4AF37]">R$ 970.000</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 mt-4 leading-relaxed">
                  * Economia de até 60% com amortização em até 145 parcelas acessíveis ao fluxo de
                  caixa do negócio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROCESSO EM 4 ETAPAS */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Fluxo Estruturado
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Como funciona o processo de recuperação
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Trabalho linear, auditado e com cronograma bem definido para blindar sua operação o
              mais rápido possível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasProcesso.map((etapa, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#2ECC71]/60 hover:bg-slate-50/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="font-heading font-extrabold text-3xl text-[#2ECC71] block mb-3">
                    {etapa.numero}
                  </span>
                  <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{etapa.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. OS 5 PILARES 5.0 (PADRÃO DIAMOND GROUP NO FINAL DA PÁGINA) */}
      <section
        id="pilares-recuperacao-50"
        className="py-20 bg-gradient-to-b from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white relative overflow-hidden border-t-2 border-[#D4AF37]/40"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/40 mb-4 backdrop-blur-sm">
              Metodologia de Governança
            </span>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 Pilares da Recuperação de Empresas 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Estrutura técnica que une inteligência tributária, peritos contábeis, fundos parceiros
              e governança rígida para reerguer negócios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresRecuperacao50.map((item, idx) => {
              const isSpanAcross = idx === 3 && pilaresRecuperacao50.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanAcross ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-bold text-[#D4AF37]/80">5.0</span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white mb-3 group-hover:text-[#D4AF37] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[#D4AF37] font-medium">Incluso na Esteira 5.0</span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. FORMULÁRIO DE CONTATO (LEAD tipo_solicitacao='recuperacao-empresas') E CTA DUPLO */}
      <section id="formulario-recuperacao" className="py-20 bg-slate-100 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Coluna da Esquerda: Explicações e CTA WhatsApp */}
            <div className="lg:col-span-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#145A32] bg-emerald-100 border border-emerald-200 mb-3">
                Atendimento Imediato
              </span>

              <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
                Fale com a nossa equipe de reestruturação
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                Quanto mais rápido agirmos, menores serão as custas judiciais, penhoras e juros
                sobre o seu passivo. Fale com um especialista sênior em recuperação corporativa sob
                sigilo completo.
              </p>

              {/* Card WhatsApp */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2ECC71] flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-500">
                      Canal Direto de Urgência
                    </span>
                    <h4 className="font-heading font-bold text-slate-900 text-base">
                      Atendimento via WhatsApp
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Envie sua mensagem diretamente para nosso plantão de reestruturação corporativa.
                </p>
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center btn-press"
                >
                  <PhoneCall className="w-4 h-4" />
                  Abrir WhatsApp: {TELEFONE_EMPRESA_FORMATADO}
                </a>
              </div>

              {/* Garantias */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Acordo de Confidencialidade (NDA) garantido</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Pontuação prioritária de atendimento no CRM da mesa técnica</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  <span>Análise inicial sem custo e sem compromisso</span>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Formulário de Contato com LeadForm e tipo_solicitacao='recuperacao-empresas' */}
            <div className="lg:col-span-7">
              <LeadForm
                tipoSolicitacao="recuperacao-empresas"
                titulo="Solicitar Avaliação Confidencial"
                subtitulo="Preencha os dados da sua empresa para diagnóstico imediato do passivo"
                sucessoTitulo="Solicitação de Recuperação Recebida!"
                sucessoMensagem="Seus dados foram encaminhados diretamente para a mesa de Reestruturação Corporativa sob estrito sigilo. Nosso especialista entrará em contato em poucas horas."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
