import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react'
import { createLead } from '@/services/leads'
import { formatarCNPJ, limparCNPJ, validarCNPJ } from '@/lib/cnpj'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FormErrors {
  nome?: string
  email?: string
  telefone?: string
  empresa?: string
  cnpj?: string
  segmento?: string
  funcionarios?: string
  mensagem?: string
}

export default function GestaoRecebiveis() {
  // Os 5 Pilares 5.0 (sem ícones nos cards conforme padrão Diamond Group)
  const pilaresRecebiveis5 = [
    {
      id: 'segregacao-origem-recebiveis',
      badge: 'Blindagem Operacional',
      title: 'Segregação de recebíveis e esteira de liquidação direta',
      description:
        'Desenho de contas gráficas, subcontas e arranjos de pagamento homologados que desvinculam o recebimento das vendas de contas bancárias tradicionais expostas a constrições judiciais ou penhoras fiscais.',
    },
    {
      id: 'conformidade-fomento-14463',
      badge: 'Base Legal Estrita',
      title: 'Estrutura montada com base legal, contratos e assessoria dedicada',
      description:
        'Operação pautada na legislação de duplicatas e títulos de crédito, contratos de cessão civil, fomento mercantil e na regulamentação dos arranjos de recebíveis (Lei 14.463/2022), com parecer técnico e compliance documental irrefutável.',
    },
    {
      id: 'diversificacao-meios-pagamento',
      badge: 'Continuidade de Vendas',
      title: 'Diversificação inteligente de canais de liquidação',
      description:
        'Habilitação de múltiplos gateways, split de pagamento inteligente, emissão de boletos via instituições de pagamento autorizadas e conciliação em tempo real para que o cliente pague sem qualquer atrito comercial.',
    },
    {
      id: 'governanca-aplicacao-recursos',
      badge: 'Preservação de Ativos',
      title: 'Gestão orientada à priorização de folha e fornecedores',
      description:
        'Direcionamento rigoroso dos recursos entrantes para os compromissos inadiáveis da operação: salários de colaboradores, fornecedores estratégicos de insumos e despesas de sobrevivência corporativa.',
    },
    {
      id: 'auditoria-relatorios-regularizacao',
      badge: 'Tranquilidade Fiscal',
      title: 'Relatórios de conciliação e plano de regularização de passivos',
      description:
        'Demonstrativos diários e mensais 100% conciliados, fornecendo base contábil confiável para que a empresa possa negociar transações tributárias, parcelamentos especiais e recompor sua capacidade financeira gradualmente.',
    },
  ]

  // Benefícios em cards (sem ícones externos nos cards)
  const beneficios = [
    {
      badge: 'Continuidade',
      title: 'Continuidade integral da operação',
      desc: 'Sua empresa segue vendendo, emitindo cobranças e faturando normalmente, mesmo durante períodos em que contas bancárias tradicionais enfrentam contingências.',
    },
    {
      badge: 'Compromissos',
      title: 'Folha e fornecedores rigorosamente em dia',
      desc: 'Os recebíveis gerados pela atividade econômica são direcionados prioritariamente ao pagamento da folha de colaboradores e parceiros de fornecimento vitais.',
    },
    {
      badge: 'Estratégia',
      title: 'Poder de negociação sem asfixia de caixa',
      desc: 'Negocie débitos fiscais, passivos bancários ou acordos judiciais com calma e estratégia, sem a pressão insuportável de estar com o caixa 100% paralisado.',
    },
    {
      badge: 'Governança',
      title: 'Organização sólida para regularizar débitos',
      desc: 'Fluxo documentado e auditável que permite estruturar planos de regularização fiscal e financeira de forma planejada, segura e definitiva.',
    },
  ]

  // Como funciona em 4 etapas
  const etapas = [
    {
      passo: '01',
      titulo: 'Diagnóstico aprofundado do fluxo',
      texto:
        'Mapeamento completo dos canais de entrada (cartões, boletos, Pix, faturamento faturado), identificação dos bloqueios e dimensionamento dos passivos existentes.',
    },
    {
      passo: '02',
      titulo: 'Desenho da estrutura jurídica e financeira',
      texto:
        'Elaboração dos instrumentos contratuais adequados, termos de cessão e seleção das plataformas homologadas de recebimento sob a Lei 14.463/2022.',
    },
    {
      passo: '03',
      titulo: 'Implantação dos meios de pagamento',
      texto:
        'Parametrização ágil dos novos meios de liquidação, garantindo que o faturamento diário continue entrando sem interrupção para o cliente final.',
    },
    {
      passo: '04',
      titulo: 'Gestão contínua com relatórios e conciliação',
      texto:
        'Acompanhamento diário das entradas e saídas, prestação de contas com relatórios de liquidez e direcionamento estratégico para a regularização do negócio.',
    },
  ]

  // Estado do formulário de contato / lead
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cnpj: '',
    segmento: '',
    funcionarios: '',
    mensagem: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Máscara de telefone BR
  const formatPhoneBR = (value: string) => {
    let digits = value.replace(/\D/g, '')
    if (digits.startsWith('55') && digits.length > 2) {
      digits = digits.slice(2)
    }
    digits = digits.slice(0, 11)
    if (digits.length === 0) return ''
    if (digits.length <= 2) return `+55 (${digits}`
    if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const formatted = formatPhoneBR(raw)
    setFormData((prev) => ({ ...prev, telefone: formatted }))
    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: undefined }))
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const formatted = formatarCNPJ(raw)
    setFormData((prev) => ({ ...prev, cnpj: formatted }))
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: undefined }))
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do responsável é obrigatório'
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Informe um e-mail válido'
    }

    const digitsOnly = formData.telefone.replace(/\D/g, '')
    const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone / WhatsApp é obrigatório'
    } else if (cleanDigits.length < 10) {
      newErrors.telefone = 'Informe um telefone válido com DDD'
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'Nome da empresa é obrigatório'
    }

    if (formData.cnpj.trim()) {
      const cleanCnpj = limparCNPJ(formData.cnpj)
      if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) {
        newErrors.cnpj = 'CNPJ inválido — confira os 14 dígitos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const payloadMensagem = [
        '[LEAD SERVIÇO - ESTRUTURAÇÃO DE RECEBÍVEIS & GESTÃO DE FLUXO]',
        `Tipo de solicitação: gestao-recebiveis`,
        formData.segmento ? `Segmento informado: ${formData.segmento}` : null,
        formData.funcionarios ? `Porte informado: ${formData.funcionarios}` : null,
        formData.mensagem.trim() ? `Mensagem do cliente: ${formData.mensagem.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      await createLead({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        empresa: formData.empresa.trim(),
        cnpj: formData.cnpj.trim() || undefined,
        segmento: formData.segmento || 'Serviços',
        funcionarios: formData.funcionarios || '1–5',
        mensagem: payloadMensagem,
      })

      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        cnpj: '',
        segmento: '',
        funcionarios: '',
        mensagem: '',
      })
      setErrors({})
      setIsSuccessOpen(true)
    } catch (err: unknown) {
      console.error('Erro ao enviar lead de gestão de recebíveis:', err)
      setServerError(
        'Não foi possível registrar seu contato no momento. Verifique sua conexão ou tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      {/* 1. HERO COM PADRÃO VISUAL DIAMOND GROUP (#07132B + DOURADO #D4AF37) */}
      <section className="bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white py-20 px-4 sm:px-6 relative overflow-hidden border-b border-[#D4AF37]/20">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#07132B]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* Navegação de retorno */}
          <div className="mb-6">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar para Todos os Serviços
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/40 mb-5 backdrop-blur-sm">
                <span>Proteção Operacional & Continuidade • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight">
                Estruturação de Recebimentos & Gestão de Fluxo
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#D4AF37] mb-6 tracking-tight">
                Mantenha as vendas ativas, folha em dia e operação protegida.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Solução técnica especializada para empresas que enfrentam contingências ou
                restrições em contas bancárias tradicionais. Atuamos com a{' '}
                <strong className="text-white">
                  proteção do fluxo de recebimentos contra bloqueios e contingências em bancos
                </strong>
                , empregando meios de pagamento inteligentes, estruturas lícitas de fomento
                mercantil e gestão do caixa com estrita conformidade legal (Lei 14.463/2022).
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#formulario-recebiveis"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Solicitar Estruturação de Recebíveis
                </a>

                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  Fale com um Especialista
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-[#D4AF37]/30 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=financial%20operations%20corporate%20cashflow%20technology&color=blue"
                  alt="Estruturação de Recebimentos e Gestão de Fluxo"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#07132B]/90 backdrop-blur-md rounded-xl shadow-lg border border-[#D4AF37]/30 text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    Estrutura Lícita de Recebíveis Ativa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO DO PROBLEMA */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              O Cenário Crítico
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Vender bem, mas ter o caixa paralisado por contingências bancárias
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Muitas empresas saudáveis operacionalmente têm seu fluxo de recebimentos travado por
              constrições bancárias, ordens inesperadas ou discussões de passivos. O resultado é o
              asfixiamento da rotina mesmo em negócios que faturam alto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Impacto 01
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Fluxo de recebimentos travado e retenção em conta
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Os valores pagos por cartões, Pix ou boletos caem em contas bancárias
                  convencionais e ficam retidos antes mesmo de serem movimentados, impedindo a
                  compra de novos insumos ou reposição de estoque.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Consequência: paralisia da esteira comercial
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Impacto 02
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Folha de colaboradores e fornecedores vitais em risco
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sem previsibilidade para liquidar salários, rescisões e obrigações básicas de
                  trabalho, a empresa enfrenta risco iminente de paralisação da equipe, perda de
                  talentos essenciais e quebra da cadeia de suprimentos.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Consequência: perda de confiança e descontinuidade
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Impacto 03
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Perda de poder de negociação perante credores
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Com o caixa bloqueado, o empresário perde a capacidade de negociar com serenidade,
                  sendo obrigado a aceitar condições desfavoráveis ou juros extorsivos simplesmente
                  para conseguir manter a porta aberta amanhã.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Consequência: espiral de endividamento descontrolado
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md"
            >
              Fale com um Especialista sobre sua Operação
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DA SOLUÇÃO */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                Engenharia Financeira & Legal
              </span>

              <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                Estrutura dedicada de gestão de recebíveis para garantir a vida do negócio
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                Nossa atuação não promete contornar decisões judiciais nem ocultar patrimônio:
                desenhamos uma infraestrutura corporativa séria que utiliza meios de pagamento
                inteligentes e diversificados para receber os valores gerados pela operação, gerir o
                fluxo de caixa com governança e aplicar os recursos diretamente na liquidação de
                compromissos essenciais e débitos, preservando a continuidade do negócio.
              </p>

              <div className="p-5 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 shadow-md">
                <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-1">
                  Princípio Institucional Diamond Group
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Operamos com a{' '}
                  <strong className="text-white">
                    proteção do fluxo de recebimentos contra bloqueios e contingências em bancos
                  </strong>{' '}
                  por meio de uma{' '}
                  <strong className="text-[#D4AF37]">
                    estrutura montada com base legal, contratos e assessoria dedicada
                  </strong>
                  . Tudo fundamentado na legislação de fomento mercantil e duplicatas estruturadas
                  (Lei 14.463/2022).
                </p>
              </div>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <span>
                    <strong>Meios de pagamento inteligentes:</strong> arranjos e subcontas
                    segregadas para emissão de Pix, boletos registrados e maquininhas de cartão sem
                    travamento.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <span>
                    <strong>Gestão direcionada do fluxo:</strong> aplicação prioritária na folha
                    salarial de colaboradores e insumos críticos para manter a produção rodando.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <span>
                    <strong>Transparência e conformidade:</strong> conciliação diária com relatórios
                    gerenciais auditáveis para negociação e liquidação planejada dos débitos.
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl p-8 bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white border border-[#D4AF37]/40 shadow-2xl relative">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
                  Arquitetura de Continuidade
                </div>
                <h3 className="font-heading font-bold text-2xl text-white mb-6">
                  Como os recursos circulam de forma regular e protegida
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      1. Recebimento da Venda pelo Cliente Final
                    </strong>
                    <p className="text-xs text-slate-300">
                      O cliente da sua empresa compra e liquida via Pix, cartão ou boleto com
                      emissão regular e sem qualquer fricção na ponta comercial.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      2. Segregação e Liquidação em Meios Homologados
                    </strong>
                    <p className="text-xs text-slate-300">
                      Os recebíveis são processados em estruturas contratuais de fomento e arranjos
                      dedicados, com esteira de conciliação diária.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      3. Pagamento de Folha, Fornecedores e Regularização
                    </strong>
                    <p className="text-xs text-slate-300">
                      O saldo líquido é alocado no pagamento dos compromissos operacionais vitais e
                      na constituição de reservas para a liquidação gradual de débitos.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-300">
                    Consulte um especialista para desenhar o arranjo da sua operação.
                  </span>
                  <a
                    href="/#contato"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all whitespace-nowrap shrink-0"
                  >
                    Fale com um Especialista
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENEFÍCIOS EM CARDS (SEM ÍCONES EXTERNOS NOS CARDS) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Vantagens Corporativas
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Benefícios diretos para a sustentabilidade do seu negócio
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Recupere a tranquilidade para liderar sua empresa enquanto o fluxo financeiro segue
              operando com segurança jurídica e rigor contábil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50/10 transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-md mb-4">
                    {b.badge}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-2.5 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-[#07132B]">Padrão Diamond Group</span>
                  <span className="font-mono text-slate-400">0{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMPARATIVO EM TABELA / DUAS COLUNAS */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 mb-3">
              Análise Comparativa
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Sem estrutura (tradicional) × Com Estruturação de Recebimentos
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Veja a diferença entre depender passivamente de contas vulneráveis e contar com um
              arranjo profissional e lícito de continuidade de fluxo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Coluna Sem estrutura */}
            <div className="rounded-2xl p-8 bg-white/[0.03] border border-rose-500/20 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400 block mb-1">
                    Vulnerabilidade Diária
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Sem Estrutura (Tradicional)
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Caixa em risco permanente:</strong> qualquer
                      bloqueio judicial ou contingência fiscal paralisa 100% dos saldos e entradas
                      do dia.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Atraso de salários e fornecedores:</strong>{' '}
                      falta de recursos imediatos para pagar quem faz a empresa funcionar no dia a
                      dia.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Improvisos perigosos:</strong> uso desordenado
                      de contas de terceiros ou sócios, gerando confusão patrimonial e riscos
                      fiscais graves.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Falta de horizonte para negociar:</strong>{' '}
                      negociação forçada sob desespero, sem tempo hábil para organizar defesas ou
                      parcelamentos.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-rose-300/80">
                Resultado: risco iminente de colapso operacional e encerramento desordenado da
                atividade.
              </div>
            </div>

            {/* Coluna Com Estruturação */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-2 border-[#D4AF37]/60 backdrop-blur-sm flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#07132B] text-[11px] font-bold uppercase tracking-wider shadow">
                Continuidade Garantida
              </div>

              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-1">
                    Proteção & Governança
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Com Estruturação de Recebimentos
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Fluxo de vendas preservado:</strong> clientes
                      pagam por canais modernos e homologados sem interrupção comercial.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Folha salarial e insumos priorizados:</strong>{' '}
                      governança financeira que aloca receitas na subsistência da atividade
                      econômica.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Conformidade com a Lei 14.463/2022:</strong>{' '}
                      operação amparada em contratos formais de fomento, cessão e arranjos
                      homologados.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Organização para regularização:</strong>{' '}
                      relatórios contínuos para adesão a transações fiscais e regularização gradual
                      de passivos.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-[#D4AF37]">
                Resultado: fôlego financeiro, segurança jurídica e preservação dos empregos e do
                patrimônio.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMO FUNCIONA EM 4 ETAPAS (SEM ÍCONES) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Metodologia de Implantação
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona o processo em 4 etapas
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Da avaliação inicial do fluxo à gestão mensal continuada, cada etapa é executada sob
              sigilo e rigor técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapas.map((etapa, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group hover:border-[#D4AF37] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-extrabold font-heading text-[#D4AF37] mb-3">
                    {etapa.passo}
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{etapa.texto}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#07132B] font-semibold">
                  <span>Etapa homologada</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-sm text-white bg-[#07132B] hover:bg-[#0E2442] border border-[#D4AF37]/40 transition-all shadow-md"
            >
              Fale com um Especialista sobre sua Empresa
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </a>
          </div>
        </div>
      </section>

      {/* 7. OS 5 PILARES 5.0 (NO FINAL DA PÁGINA, PADRÃO DAS DEMAIS — SEM ÍCONES) */}
      <section
        id="pilares-gestao-recebiveis"
        className="py-20 bg-gradient-to-b from-[#07132B] via-[#0E2442] to-[#07132B] text-white relative overflow-hidden border-t-2 border-[#D4AF37]/40"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 mb-4 backdrop-blur-sm">
              <span>Metodologia Diamond Group</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares da Gestão de Recebíveis 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Uma abordagem robusta que une tecnologia de pagamentos, governança de caixa e estrita
              conformidade legal para garantir a sustentabilidade do seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresRecebiveis5.map((item, idx) => {
              const isSpanAcross = idx === 3 && pilaresRecebiveis5.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37]/60 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanAcross ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    {/* Topo do card: Badge e número (SEM ÍCONES) */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37]">Pilar 0{idx + 1}</span>
                    </div>

                    {/* Título do Card */}
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-3 group-hover:text-[#D4AF37] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Texto completo VISÍVEL */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Detalhe de acabamento inferior */}
                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[#D4AF37] font-medium">
                      Incluso na Gestão de Recebíveis 5.0
                    </span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8. FORMULÁRIO DE CONTATO (COLEÇÃO LEADS COM TIPO GESTAO-RECEBIVEIS) */}
      <section id="formulario-recebiveis" className="py-20 bg-slate-100">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-[0_25px_50px_rgba(7,19,43,0.12)] border border-slate-200 text-slate-800">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
                Atendimento Reservado & Confidencial
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-2">
                Solicite uma análise confidencial da sua operação
              </h2>
              <p className="text-sm text-slate-600">
                Preencha os dados abaixo para que nossos consultores seniores façam um diagnóstico
                prévio das contingências da sua empresa sob sigilo absoluto.
              </p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Responsável */}
                <div>
                  <label
                    htmlFor="nome"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nome do Responsável *
                  </label>
                  <input
                    id="nome"
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.nome
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.nome && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.nome}</p>
                  )}
                </div>

                {/* E-mail Corporativo */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    E-mail Corporativo *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seuemail@empresa.com.br"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.email
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telefone / WhatsApp */}
                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    placeholder="+55 (11) 99999-9999"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.telefone
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.telefone && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.telefone}</p>
                  )}
                </div>

                {/* Nome da Empresa */}
                <div>
                  <label
                    htmlFor="empresa"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nome da Empresa *
                  </label>
                  <input
                    id="empresa"
                    type="text"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    placeholder="Razão Social ou Nome Fantasia"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.empresa
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.empresa && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.empresa}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CNPJ (Opcional) */}
                <div>
                  <label
                    htmlFor="cnpj"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    CNPJ (Opcional)
                  </label>
                  <input
                    id="cnpj"
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.cnpj
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.cnpj && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.cnpj}</p>
                  )}
                </div>

                {/* Segmento */}
                <div>
                  <label
                    htmlFor="segmento"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Segmento
                  </label>
                  <select
                    id="segmento"
                    name="segmento"
                    value={formData.segmento}
                    onChange={handleChange}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring"
                  >
                    <option value="">Selecione...</option>
                    <option value="Comércio">Comércio</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Agro">Agro</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Construção Civil">Construção Civil</option>
                    <option value="Bares e Restaurantes">Bares e Restaurantes</option>
                  </select>
                </div>

                {/* Porte */}
                <div>
                  <label
                    htmlFor="funcionarios"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Funcionários
                  </label>
                  <select
                    id="funcionarios"
                    name="funcionarios"
                    value={formData.funcionarios}
                    onChange={handleChange}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring"
                  >
                    <option value="">Selecione...</option>
                    <option value="1–5">1–5 colaboradores</option>
                    <option value="6–20">6–20 colaboradores</option>
                    <option value="21–50">21–50 colaboradores</option>
                    <option value="51–200">51–200 colaboradores</option>
                    <option value="Mais de 200">Mais de 200 colaboradores</option>
                  </select>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label
                  htmlFor="mensagem"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Mensagem / Resumo da Situação
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows={3}
                  value={formData.mensagem}
                  onChange={handleChange}
                  placeholder="Conte-nos brevemente o principal desafio de fluxo da sua empresa (ex: recebíveis travados em banco, risco na folha, necessidade de novos meios de pagamento)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring resize-none"
                />
              </div>

              {/* Botão de Envio */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl font-heading font-bold text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#07132B]" />
                      <span>Processando solicitação segura...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Solicitação de Estruturação</span>
                    </>
                  )}
                </button>
              </div>

              {/* LGPD e Sigilo */}
              <p className="text-center text-xs text-slate-500 pt-2 leading-relaxed">
                Garantia de confidencialidade estrita. Seus dados estão seguros sob a LGPD (Lei nº
                13.709/2018) e jamais serão compartilhados com terceiros. Ao enviar, você concorda
                com nossa{' '}
                <Link
                  to="/politica-de-privacidade"
                  className="text-[#07132B] font-semibold underline hover:text-[#D4AF37]"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* 9. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Ecossistema Contabilidade 5.0
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Conheça outras especialidades complementares da nossa assessoria
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/servicos/consultoria-financeira"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <PieChart className="w-4 h-4 text-[#D4AF37]" />
                Consultoria Financeira 5.0
              </Link>
              <Link
                to="/servicos/back-office-50"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Back Office 5.0
              </Link>
              <Link
                to="/servicos/bpo-contabil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                BPO Contábil 5.0
              </Link>
              <Link
                to="/servicos/assessoria-tributaria"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                Assessoria Tributária
              </Link>
              <Link
                to="/servicos/planejamento-sucessorio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Planejamento Sucessório
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
              Precisa de orientação imediata para o fluxo da sua empresa?
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Nosso time sênior Diamond Group atende com sigilo absoluto para avaliar sua operação e
              desenhar uma estrutura lícita sob medida.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-bold text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Fale com um Especialista
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </section>

      {/* DIÁLOGO DE SUCESSO */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-[#07132B]">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5] text-[#D4AF37]" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-2xl text-slate-900 text-center">
              Solicitação Recebida com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2 text-center leading-relaxed">
              Recebemos suas informações com estrita confidencialidade. Nosso time de especialistas
              em gestão de recebíveis entrará em contato em até 24 horas úteis para um alinhamento
              reservado.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="px-8 py-2.5 rounded-xl bg-[#07132B] hover:bg-[#0E2442] text-[#D4AF37] font-bold"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
