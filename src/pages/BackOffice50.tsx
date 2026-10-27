import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Receipt,
  Users,
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
  nomeEscritorio?: string
  cnpj?: string
  cidadeUf?: string
  clientesCarteira?: string
  modeloInteresse?: string
}

export default function BackOffice50() {
  // 5 Pilares 5.0 do Back Office (SEM ícones nos cards)
  const pilaresBackOffice5 = [
    {
      id: 'fabrica-tecnica-white-label',
      badge: 'Marca 100% Preservada',
      title: 'Fábrica técnica white-label especializada',
      description:
        'Toda a produção contábil, fiscal, tributária e de folha de pagamento é gerada com o logotipo, as cores e a identidade visual do parceiro. O cliente final nunca descobre que há um hub técnico por trás.',
    },
    {
      id: 'tecnologia-esteira-diagnosticos',
      badge: 'Inteligência Analítica',
      title: 'Esteira de Diagnóstico 360° e Calculadora IBS/CBS',
      description:
        'Acesso imediato às ferramentas proprietárias Diamond Group: Matriz Semáforo dos 7 Riscos, simuladores de impacto da Reforma Tributária (LC 214/2025) e recuperador de créditos administrativos para gerar vendas imediatas.',
    },
    {
      id: 'regra-ouro-rosto-cliente',
      badge: 'Relacionamento Intocável',
      title: 'Regra de ouro: o parceiro é sempre o rosto do cliente',
      description:
        'Nosso time técnico nunca contata o seu cliente diretamente sem autorização prévia. Você mantém a liderança comercial, os contratos assinados, as reuniões de relacionamento e colhe os louros da entrega de alto padrão.',
    },
    {
      id: 'seguranca-juridica-sla',
      badge: 'Compliance & Sigilo',
      title: 'Acordo de confidencialidade e não-concorrência estrita',
      description:
        'Contrato corporativo blindado com cláusulas expressas de não-aliciamento da carteira, responsabilidade técnica compartilhada (CRC ativo), prazos de entrega com SLA rígido e indenização contratual por descumprimento.',
    },
    {
      id: 'participacao-recorrente-escala',
      badge: 'Monetização Inteligente',
      title: 'Participação recorrente e margem comercial previsível',
      description:
        'Receba mensalidades consistentes sobre os clientes atendidos ou liquide o valor patrimonial da carteira com liquidez à vista e parcelamento amparado pela taxa de retenção dos clientes.',
    },
  ]

  // Benefícios para o parceiro (SEM ícones nos cards)
  const beneficios = [
    {
      badge: 'Vantagem 01',
      title: 'Tempo recuperado para prospectar e vender',
      desc: 'Livre-se da sobrecarga operacional de conciliações manuais, fechamentos estressantes de guias e rotinas de folha. Foque 100% em visitas, networking e relacionamento comercial.',
    },
    {
      badge: 'Vantagem 02',
      title: 'Eliminação imediata de custos fixos internos',
      desc: 'Reduza a necessidade de manter analistas seniores em regime CLT, licenças caras de sistemas de processamento contábil e espaço físico ocioso na sua estrutura.',
    },
    {
      badge: 'Vantagem 03',
      title: 'Esteira de produtos de alto valor agregado',
      desc: 'Ofereça aos seus clientes da carteira Diagnóstico 360°, planejamento sucessório, holding familiar e recuperação tributária sem precisar estudar cada tese do zero.',
    },
    {
      badge: 'Vantagem 04',
      title: 'Prontidão instantânea para a Reforma Tributária',
      desc: 'Esteja blindado e à frente da concorrência na transição do IBS, CBS e split payment (EC 132/2023 e LC 214/2025) utilizando nossos simuladores analíticos prontos.',
    },
    {
      badge: 'Vantagem 05',
      title: 'Relatórios executivos white-label de alto padrão',
      desc: 'Entregue balancetes analíticos, DREs gerenciais e laudos conclusivos com a sua marca, encantando clientes com um nível de entrega que nenhum escritório tradicional possui.',
    },
    {
      badge: 'Vantagem 06',
      title: 'Suporte técnico sênior e retaguarda jurídica',
      desc: 'Tenha à sua disposição uma célula multidisciplinar de contadores seniores, tributaristas e advogados corporativos para validar teses complexas do seu cliente.',
    },
  ]

  // 4 Etapas da Parceria (SEM ícones nos cards)
  const etapasParceria = [
    {
      passo: '01',
      titulo: 'Conversa inicial e diagnóstico do escritório',
      texto:
        'Reunião reservada para entender o perfil da sua carteira, sistemas atuais, gargalos técnicos e objetivos (seja terceirizar a produção ou monetizar a carteira de clientes).',
    },
    {
      passo: '02',
      titulo: 'Definição do modelo e contrato com sigilo',
      texto:
        'Escolha entre o modelo de prestação de serviços mensal ou compra estruturada de carteira, formalizado com termo de não-concorrência e acordo de confidencialidade (NDA).',
    },
    {
      passo: '03',
      titulo: 'Onboarding técnico e migração segura',
      texto:
        'Nossa equipe de transição assume a importação das bases fiscais, contábeis e de folha, parametrizando as integrações sem interromper as entregas aos clientes.',
    },
    {
      passo: '04',
      titulo: 'Operação contínua e distribuição de margem',
      texto:
        'A fábrica 5.0 processa todas as rotinas em conformidade rigorosa com a legislação, enquanto você recebe sua margem/participação recorrente todo mês.',
    },
  ]

  // Estado do formulário de cadastro de parceiro
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    nomeEscritorio: '',
    cidadeUf: '',
    clientesCarteira: '',
    modeloInteresse: '',
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
      newErrors.email = 'E-mail corporativo é obrigatório'
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

    if (!formData.nomeEscritorio.trim()) {
      newErrors.nomeEscritorio = 'Nome do escritório contábil é obrigatório'
    }

    const cleanCnpj = limparCNPJ(formData.cnpj)
    if (!cleanCnpj) {
      newErrors.cnpj = 'Informe o CNPJ do escritório'
    } else if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) {
      newErrors.cnpj = 'CNPJ inválido — confira os 14 dígitos'
    }

    if (!formData.cidadeUf.trim()) {
      newErrors.cidadeUf = 'Cidade / UF é obrigatório'
    }

    if (!formData.clientesCarteira) {
      newErrors.clientesCarteira = 'Selecione a faixa de clientes'
    }

    if (!formData.modeloInteresse) {
      newErrors.modeloInteresse = 'Selecione o modelo de interesse'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Mapeamento sem perda de dados para a coleção de leads do PocketBase
  const mapClientesParaFuncionarios = (faixa: string) => {
    switch (faixa) {
      case 'Até 20 clientes':
        return '1–5'
      case '21 a 50 clientes':
        return '6–20'
      case '51 a 100 clientes':
        return '21–50'
      case '101 a 200 clientes':
        return '51–200'
      case 'Mais de 200 clientes':
        return 'Mais de 200'
      default:
        return '1–5'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      // Montar mensagem rica consolidando os detalhes específicos de parceria
      const payloadMensagem = [
        '[LEAD DE PARCERIA - BACK OFFICE 5.0]',
        `Modelo de interesse: ${formData.modeloInteresse}`,
        `Carteira aproximada: ${formData.clientesCarteira}`,
        `Localização: ${formData.cidadeUf.trim()}`,
        `Escritório: ${formData.nomeEscritorio.trim()}`,
        formData.mensagem.trim() ? `Mensagem do parceiro: ${formData.mensagem.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      await createLead({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        empresa: formData.nomeEscritorio.trim(),
        cnpj: formData.cnpj.trim(),
        segmento: 'Serviços',
        funcionarios: mapClientesParaFuncionarios(formData.clientesCarteira),
        mensagem: payloadMensagem,
      })

      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cnpj: '',
        nomeEscritorio: '',
        cidadeUf: '',
        clientesCarteira: '',
        modeloInteresse: '',
        mensagem: '',
      })
      setErrors({})
      setIsSuccessOpen(true)
    } catch (err: unknown) {
      console.error('Erro ao enviar lead de parceria:', err)
      setServerError(
        'Não foi possível registrar seu interesse no momento. Por favor, verifique sua conexão ou tente novamente.',
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
                <span>Parceria Estratégica para Escritórios Contábeis • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight">
                Back Office 5.0
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#D4AF37] mb-6 tracking-tight">
                Sua firma mantém o cliente. Nós fazemos toda a parte técnica.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-2xl">
                Transforme seu escritório contábil em uma potência comercial. Nós assumimos toda a
                fábrica técnica em regime 100% white-label — fiscal, contábil, tributária e folha de
                pagamento — com a esteira do Diagnóstico 360° e Calculadora IBS/CBS. Sua equipe
                mantém o relacionamento, atrai novos clientes e garante margem líquida recorrente,
                sem dor de cabeça de rotinas operacionais ou risco de multas.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#formulario-parceria"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
                >
                  Quero ser Parceiro Back Office 5.0
                </a>

                <a
                  href="/#contato"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  Falar com um Consultor
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] overflow-hidden shadow-2xl border border-[#D4AF37]/30 relative group bg-white/[0.04] p-3 backdrop-blur-sm">
                <img
                  src="https://img.usecurling.com/p/700/500?q=executive%20accounting%20firm%20partnership%20office&color=blue"
                  alt="Back Office 5.0 para Escritórios Contábeis"
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-[18px] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-7 left-7 p-3 bg-[#07132B]/90 backdrop-blur-md rounded-xl shadow-lg border border-[#D4AF37]/30 text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    Fábrica Técnica White-Label Ativa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. O PROBLEMA: CONTADORES DARFEIROS & A PRESSÃO DA REFORMA TRIBUTÁRIA */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Diagnóstico do Mercado
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              O modelo tradicional de "contador darfeiro" está com os dias contados
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Escritórios que operam apenas enviando guias de impostos enfrentam desvalorização
              contínua, fuga de clientes para plataformas de preço baixo e o risco existencial
              trazido pela nova Reforma Tributária.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Gargalo 01
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Mero emissor de DARF sem valor consultivo
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O cliente enxerga o contador como um custo obrigatório e não como um parceiro de
                  negócios. Ao menor sinal de crise, exige redução de honorários ou migra para
                  soluções massificadas de contabilidade online.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Sintoma: honorários defasados e churn recorrente
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Gargalo 02
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Pressão irreversível da Reforma Tributária (IBS/CBS)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A Lei Complementar 214/2025 e o mecanismo de split payment vão exigir cruzamento
                  em tempo real, parametrização avançada de créditos e revisão de regimes.
                  Escritórios sem tecnologia ficarão incapazes de atender às novas exigências.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Sintoma: defasagem técnica e perda de competitividade
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mb-4">
                  Gargalo 03
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2.5 leading-snug">
                  Multas por omissão e risco operacional constante
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Equipes internas sobrecarregadas com rotinas manuais acabam perdendo prazos de
                  obrigações acessórias (DCTFWeb, SPED, eSocial), gerando atritos desgastantes e
                  multas desnecessárias que minam a reputação do escritório.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 text-xs font-medium text-rose-600">
                Sintoma: estresse operacional e passivos desnecessários
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA A PARCERIA (A REGRA DE OURO) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                Divisão Estratégica de Papéis
              </span>

              <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                Você cuida do cliente e das vendas. Nós operamos a fábrica técnica.
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                A Contabilidade 5.0 opera como a infraestrutura técnica invisível do seu escritório.
                Executamos toda a apuração fiscal, escrituração contábil societária, departamento
                pessoal e teses tributárias com o mais rigoroso controle de qualidade do mercado.
              </p>

              <div className="p-5 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 shadow-md">
                <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-1">
                  Regra de Ouro da Parceria
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong>O parceiro nunca deixa de ser o rosto do cliente.</strong> Seu escritório
                  é a autoridade local reconhecida: você assina os contratos, comparece às reuniões,
                  apresenta os relatórios com a sua marca e lidera o relacionamento de longo prazo.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <span>
                    <strong>Seu papel (Parceiro Comercial):</strong> prospecção ativa, visitas a
                    empresários, relacionamento próximo, negociação de honorários e expansão local
                    da carteira.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <span>
                    <strong>Nosso papel (Fábrica Técnica):</strong> execução fiscal, folha de
                    pagamento, contabilidade societária, auditorias de SPED, geração de relatórios
                    executivos white-label e simulações na Calculadora IBS/CBS.
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl p-8 bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white border border-[#D4AF37]/40 shadow-2xl relative">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
                  Ecossistema White-Label Integrado
                </div>
                <h3 className="font-heading font-bold text-2xl text-white mb-6">
                  Toda a tecnologia Contabilidade 5.0 à sua disposição
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      Esteira do Diagnóstico 360° Completa
                    </strong>
                    <p className="text-xs text-slate-300">
                      Aplique nos clientes a Matriz Semáforo dos 7 Riscos e o Plano 30-60-90,
                      gerando oportunidades imediatas de vendas adicionais de alto valor.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      Calculadora IBS/CBS (LC 214/2025)
                    </strong>
                    <p className="text-xs text-slate-300">
                      Simule cenários comparativos da Reforma Tributária em poucos minutos e
                      entregue ao empresário respostas concretas sobre seu custo fiscal futuro.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
                    <strong className="text-white block text-sm mb-1">
                      Relatórios e DREs White-Label
                    </strong>
                    <p className="text-xs text-slate-300">
                      Documentos com design executivo profissional, logotipo e padrão visual do seu
                      escritório contábil para encantar seus clientes em todas as reuniões.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DOIS MODELOS DE PARCERIA */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 mb-3">
              Formatos Flexíveis de Parceria
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Dois modelos sob medida para a realidade do seu escritório
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Escolha a modalidade que melhor se alinha à sua estratégia: mantenha a titularidade da
              carteira terceirizando a produção técnica ou monetize o ativo conquistado com liquidez
              e segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* MODELO 1 */}
            <div className="rounded-3xl p-8 sm:p-10 bg-white/[0.04] border border-[#D4AF37]/50 backdrop-blur-sm flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[#D4AF37] text-[#07132B] text-xs font-bold uppercase tracking-wider shadow">
                Modelo 01 • Mais Procurado
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-2">
                  Terceirização Operacional White-Label
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-4">
                  Prestação de Serviço por Cliente/Mês
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Você mantém 100% da propriedade da carteira de clientes e contrata a Contabilidade
                  5.0 como sua retaguarda técnica. Cobramos um valor fixo por cliente/mês de acordo
                  com o escopo contratado, e você define livremente o honorário final, ficando com a
                  margem líquida.
                </p>

                <div className="space-y-3 pt-2 mb-6">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <strong className="text-white text-xs block mb-0.5">
                      Opção A: Módulo Especializado (só Folha ou só Fiscal)
                    </strong>
                    <span className="text-xs text-slate-400">
                      Ideal para escritórios com gargalo específico em departamento pessoal ou
                      apuração fiscal complexa.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <strong className="text-white text-xs block mb-0.5">
                      Opção B: Fiscal + Departamento Pessoal Integrado
                    </strong>
                    <span className="text-xs text-slate-400">
                      Rotina rotineira e obrigações do eSocial e SPED 100% sob nossa gestão técnica.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[#D4AF37]/30">
                    <strong className="text-[#D4AF37] text-xs block mb-0.5">
                      Opção C: Back Office Completo (Fiscal, Contábil, DP e Tributário)
                    </strong>
                    <span className="text-xs text-slate-300">
                      Produção integral de ponta a ponta com relatórios executivos e balancetes
                      auditáveis.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-300">
                  Ideal para contadores que querem crescer sem contratar equipe interna.
                </span>
                <a
                  href="#formulario-parceria"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all whitespace-nowrap shrink-0"
                >
                  Quero este Modelo
                </a>
              </div>
            </div>

            {/* MODELO 2 */}
            <div className="rounded-3xl p-8 sm:p-10 bg-white/[0.04] border border-white/20 backdrop-blur-sm flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Liquidez & Transição Suave
                </span>
                <h3 className="font-heading font-bold text-2xl text-white mb-4">
                  Compra Estruturada de Carteira de Clientes
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Se você deseja se aposentar, mudar de área ou monetizar o valor construído ao
                  longo de anos de dedicação, compramos sua carteira de clientes de forma segura e
                  ética, garantindo atendimento impecável para as empresas atendidas e participação
                  recorrente para você.
                </p>

                <div className="space-y-3 pt-2 mb-6">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <strong className="text-white text-xs block mb-0.5">
                      Valor à Vista + Parcelamento Atrelado à Retenção
                    </strong>
                    <span className="text-xs text-slate-400">
                      Estrutura contratual segura que protege ambas as partes e premia a
                      continuidade dos clientes.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <strong className="text-white text-xs block mb-0.5">
                      Participação Recorrente por Cliente Mantido
                    </strong>
                    <span className="text-xs text-slate-400">
                      Você segue recebendo um percentual mensal garantido de cada cliente que
                      permanecer na carteira.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <strong className="text-white text-xs block mb-0.5">
                      Transição Assistida sem Ruído com os Clientes
                    </strong>
                    <span className="text-xs text-slate-400">
                      Processo gradual e transparente: o cliente percebe melhoria tecnológica sem
                      sensação de abandono.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-300">
                  Ideal para contadores em fase de sucessão ou monetização de ativos.
                </span>
                <a
                  href="#formulario-parceria"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-heading font-semibold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all whitespace-nowrap shrink-0"
                >
                  Avaliar Minha Carteira
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFÍCIOS PARA O PARCEIRO (SEM ÍCONES) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Por que ser Parceiro
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Vantagens competitivas imediatas para o seu escritório
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Conquiste escala, tecnologia de ponta e rentabilidade sem precisar investir milhões em
              software ou passar noites em claro fechando obrigações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficios.map((b, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50/20 transition-all duration-300 flex flex-col justify-between"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMPARATIVO "ESCRITÓRIO TRADICIONAL × COM BACK OFFICE 5.0" */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 mb-3">
              Transformação do Modelo
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Escritório Tradicional × Escritório com Back Office 5.0
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Compare o desgaste da rotina convencional com a eficiência e previsibilidade de uma
              operação apoiada na fábrica técnica Contabilidade 5.0.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Coluna Tradicional */}
            <div className="rounded-2xl p-8 bg-white/[0.03] border border-rose-500/20 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400 block mb-1">
                    Operação Sufocada
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Escritório Tradicional
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Preso ao operacional:</strong> o titular do
                      escritório gasta 80% do dia conferindo guias, fechando folha e apagando
                      incêndios fiscais.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Custo fixo alto e rígido:</strong> equipe
                      interna CLT, licenças caras de software contábil e espaço físico ocioso
                      corroendo a margem.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">
                        Dificuldade para atrair novos clientes:
                      </strong>{' '}
                      sem tempo para fazer prospecção ativa e sem produtos diferenciados para
                      oferecer.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Insegurança na Reforma Tributária:</strong> sem
                      simuladores e sem suporte técnico para orientar clientes na transição do
                      IBS/CBS.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-rose-300/80">
                Resultado: estagnação comercial, margens comprimidas e dependência de pessoas-chave.
              </div>
            </div>

            {/* Coluna com Back Office 5.0 */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-2 border-[#D4AF37]/60 backdrop-blur-sm flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#07132B] text-[11px] font-bold uppercase tracking-wider shadow">
                Modelo Recomendado
              </div>

              <div>
                <div className="mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-1">
                    Crescimento Acelerado
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Escritório com Back Office 5.0
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Foco total em vendas e relacionamento:</strong>{' '}
                      tempo livre para visitar empresários, participar de eventos e fechar contratos
                      de alto ticket.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Custo variável e margem previsível:</strong>{' '}
                      pague apenas pelo que utilizar, escalando sua carteira sem precisar contratar
                      funcionários internos.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Portfólio 5.0 imediato:</strong> ofereça
                      Diagnóstico 360°, recuperação de créditos e planejamento sucessório desde o
                      primeiro dia.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D4AF37] font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      <strong className="text-white">Liderança na Reforma Tributária:</strong> use a
                      Calculadora IBS/CBS proprietária para posicionar seu escritório como
                      referência local.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-[#D4AF37]">
                Resultado: escala sem dor de cabeça, valorização da marca e honorários mais altos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMO FUNCIONA EM 4 ETAPAS (SEM ÍCONES) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Jornada do Parceiro
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
              Como funciona em 4 etapas estruturadas
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Da conversa inicial à distribuição mensal de resultados, nossa esteira é desenhada
              para proteger o seu relacionamento e seus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapasParceria.map((etapa, idx) => (
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
                  <span>Etapa estruturada</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. OS 5 PILARES 5.0 (NO FINAL DA PÁGINA, PADRÃO DAS DEMAIS — SEM ÍCONES) */}
      <section
        id="pilares-back-office-50"
        className="py-20 bg-gradient-to-b from-[#07132B] via-[#0E2442] to-[#07132B] text-white relative overflow-hidden border-t-2 border-[#D4AF37]/40"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 mb-4 backdrop-blur-sm">
              <span>Metodologia Diamond Group</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 pilares do Back Office 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Estrutura corporativa blindada para garantir excelência operacional, sigilo absoluto e
              escala comercial sem precedentes para o seu escritório.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresBackOffice5.map((item, idx) => {
              const isSpanAcross = idx === 3 && pilaresBackOffice5.length === 5

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
                    <span className="text-[#D4AF37] font-medium">Incluso no Back Office 5.0</span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 9. FORMULÁRIO DE CADASTRO DE PARCEIRO (SEÇÃO FINAL ANTES DO RODAPÉ) */}
      <section id="formulario-parceria" className="py-20 bg-slate-100">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-[0_25px_50px_rgba(7,19,43,0.12)] border border-slate-200 text-slate-800">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
                Cadastro de Escritório Parceiro
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-2">
                Dê o primeiro passo para a parceria Back Office 5.0
              </h2>
              <p className="text-sm text-slate-600">
                Preencha as informações do seu escritório para agendarmos uma conversa reservada sob
                sigilo mútuo.
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
                    Nome do Titular / Sócio *
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
                    E-mail de Contato *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seuemail@seuescritorio.com.br"
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

                {/* CNPJ do Escritório */}
                <div>
                  <label
                    htmlFor="cnpj"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    CNPJ do Escritório Contábil *
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Escritório */}
                <div>
                  <label
                    htmlFor="nomeEscritorio"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nome do Escritório / Razão Social *
                  </label>
                  <input
                    id="nomeEscritorio"
                    type="text"
                    name="nomeEscritorio"
                    value={formData.nomeEscritorio}
                    onChange={handleChange}
                    placeholder="Ex: Alfa Contabilidade e Assessoria"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.nomeEscritorio
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.nomeEscritorio && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">
                      {errors.nomeEscritorio}
                    </p>
                  )}
                </div>

                {/* Cidade / UF */}
                <div>
                  <label
                    htmlFor="cidadeUf"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Cidade / UF *
                  </label>
                  <input
                    id="cidadeUf"
                    type="text"
                    name="cidadeUf"
                    value={formData.cidadeUf}
                    onChange={handleChange}
                    placeholder="Ex: São Paulo / SP"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.cidadeUf
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.cidadeUf && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.cidadeUf}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nº Aproximado de Clientes na Carteira */}
                <div>
                  <label
                    htmlFor="clientesCarteira"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nº de Clientes Ativos *
                  </label>
                  <select
                    id="clientesCarteira"
                    name="clientesCarteira"
                    value={formData.clientesCarteira}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.clientesCarteira
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    <option value="Até 20 clientes">Até 20 clientes</option>
                    <option value="21 a 50 clientes">21 a 50 clientes</option>
                    <option value="51 a 100 clientes">51 a 100 clientes</option>
                    <option value="101 a 200 clientes">101 a 200 clientes</option>
                    <option value="Mais de 200 clientes">Mais de 200 clientes</option>
                  </select>
                  {errors.clientesCarteira && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">
                      {errors.clientesCarteira}
                    </p>
                  )}
                </div>

                {/* Modelo de Interesse */}
                <div>
                  <label
                    htmlFor="modeloInteresse"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Modelo de Interesse Principal *
                  </label>
                  <select
                    id="modeloInteresse"
                    name="modeloInteresse"
                    value={formData.modeloInteresse}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                      errors.modeloInteresse
                        ? 'border-[#E74C3C] bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    <option value="Prestação de Serviço (por cliente/mês)">
                      Prestação de Serviço (por cliente/mês)
                    </option>
                    <option value="Compra de Carteira (com participação recorrente)">
                      Compra de Carteira (com participação recorrente)
                    </option>
                    <option value="Ainda não sei (quero avaliar ambos)">
                      Ainda não sei (quero avaliar ambos)
                    </option>
                  </select>
                  {errors.modeloInteresse && (
                    <p className="mt-1 text-xs text-[#E74C3C] font-medium">
                      {errors.modeloInteresse}
                    </p>
                  )}
                </div>
              </div>

              {/* Mensagem / Contexto Adicional */}
              <div>
                <label
                  htmlFor="mensagem"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Mensagem Adicional (opcional)
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows={3}
                  value={formData.mensagem}
                  onChange={handleChange}
                  placeholder="Conte-nos brevemente o principal objetivo do seu escritório (ex: diminuir custos fixos, focar em vendas ou transição de aposentadoria)"
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
                      <span>Processando cadastro seguro...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Solicitação de Parceria</span>
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

      {/* 10. NAVEGAÇÃO DE OUTROS SERVIÇOS & CTA FINAL */}
      <section className="py-16 bg-slate-900 text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Ecossistema Contabilidade 5.0
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Conheça as especialidades executadas pela nossa fábrica técnica
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/servicos/diagnostico-360"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Diagnóstico 360°
              </Link>
              <Link
                to="/servicos/bpo-contabil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                BPO Contábil 5.0
              </Link>
              <Link
                to="/servicos/contabilidade-digital"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Calculator className="w-4 h-4 text-[#D4AF37]" />
                Contabilidade Digital
              </Link>
              <Link
                to="/servicos/gestao-fiscal-tributaria"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Receipt className="w-4 h-4 text-[#D4AF37]" />
                Gestão Fiscal
              </Link>
              <Link
                to="/servicos/departamento-pessoal"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <Users className="w-4 h-4 text-[#D4AF37]" />
                Departamento Pessoal
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
                to="/servicos/consultoria-financeira"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <PieChart className="w-4 h-4 text-[#D4AF37]" />
                Consultoria Financeira
              </Link>
              <Link
                to="/servicos/treinamento"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                Treinamento Corporativo
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
              Prefere agendar uma reunião direta com a liderança técnica?
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Nosso time de expansão Diamond Group atende sob sigilo e sem compromisso para modelar
              uma proposta sob medida para sua carteira de clientes.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-bold text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all duration-200 hover:-translate-y-1 btn-press"
            >
              Falar com um Consultor de Parcerias
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
              Solicitação de Parceria Recebida!
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2 text-center leading-relaxed">
              Recebemos os dados do seu escritório. Nossa equipe de parcerias estratégicas entrará
              em contato em até 24 horas úteis para uma conversa confidencial de alinhamento.
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
