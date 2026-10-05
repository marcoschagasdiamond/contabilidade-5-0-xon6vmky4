import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  DollarSign,
  Users2,
  Percent,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Info,
  Send,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Building,
  HelpCircle,
  FileCheck2,
  ShoppingCart,
  Briefcase,
  Factory,
  HeartPulse,
  GraduationCap,
  Sprout,
  Truck,
  Cpu,
  Hammer,
  UtensilsCrossed,
} from 'lucide-react'
import {
  executarDiagnosticoTributario,
  type SegmentoEmpresa,
  type ResultadoDiagnosticoCompleto,
  LISTA_SEGMENTOS,
  LIMITE_SIMPLES,
  LIMITE_PRESUMIDO,
} from '@/lib/regimes'
import { createDiagnostico } from '@/services/diagnosticos'
import { createLead } from '@/services/leads'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FormErrors {
  nome?: string
  email?: string
  telefone?: string
  empresa?: string
  segmento?: string
  rbt12?: string
  folha12?: string
  margemLucro?: string
}

export default function Diagnostico() {
  const navigate = useNavigate()

  // Wizard state (etapa 1 a 4; etapa 5 = resultado)
  const [etapa, setEtapa] = useState<number>(1)
  const [isCalculando, setIsCalculando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoDiagnosticoCompleto | null>(null)

  // Formulário
  const [formData, setFormData] = useState<{
    nome: string
    email: string
    telefone: string
    empresa: string
    segmento: SegmentoEmpresa
    rbt12: number
    folha12: number
    margemLucro: number
  }>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    segmento: 'Comércio',
    rbt12: 600000,
    folha12: 120000,
    margemLucro: 25,
  })

  // Inputs raw em string para facilitar digitação com formatação
  const [rbt12Input, setRbt12Input] = useState('600.000,00')
  const [folha12Input, setFolha12Input] = useState('120.000,00')
  const [margemInput, setMargemInput] = useState('25')

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [leadEnviado, setLeadEnviado] = useState(false)
  const [isEspecialistaModalOpen, setIsEspecialistaModalOpen] = useState(false)

  // Formatador de telefone idêntico ao LeadForm
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

  // Parse de moeda brasileira para número
  const parseMoeda = (val: string): number => {
    if (!val) return 0
    const limpo = val.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(limpo)
    return isNaN(num) ? 0 : num
  }

  // Formatação de número para moeda pt-BR sem R$
  const formatMoedaInput = (num: number): string => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value)
    setFormData((prev) => ({ ...prev, telefone: formatted }))
    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: undefined }))
    }
  }

  const handleRbt12Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d,.]/g, '')
    setRbt12Input(val)
    const num = parseMoeda(val)
    setFormData((prev) => ({ ...prev, rbt12: num }))
    if (errors.rbt12) setErrors((prev) => ({ ...prev, rbt12: undefined }))
  }

  const handleFolha12Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d,.]/g, '')
    setFolha12Input(val)
    const num = parseMoeda(val)
    setFormData((prev) => ({ ...prev, folha12: num }))
    if (errors.folha12) setErrors((prev) => ({ ...prev, folha12: undefined }))
  }

  const handleMargemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d,.]/g, '')
    setMargemInput(val)
    const num = parseFloat(val.replace(',', '.')) || 0
    setFormData((prev) => ({ ...prev, margemLucro: num }))
    if (errors.margemLucro) setErrors((prev) => ({ ...prev, margemLucro: undefined }))
  }

  // Validação por etapa
  const validarEtapa = (step: number): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.email.trim()) newErrors.email = 'E-mail corporativo é obrigatório'
      else if (!emailRegex.test(formData.email.trim())) newErrors.email = 'E-mail inválido'

      const digitsOnly = formData.telefone.replace(/\D/g, '')
      const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
      if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório'
      else if (cleanDigits.length < 10) newErrors.telefone = 'Informe um telefone com DDD'

      if (!formData.empresa.trim()) newErrors.empresa = 'Nome da empresa é obrigatório'
      if (!formData.segmento) newErrors.segmento = 'Selecione o segmento'
    }

    if (step === 2) {
      if (formData.rbt12 <= 0) {
        newErrors.rbt12 = 'Informe a receita bruta anual (maior que zero)'
      }
    }

    if (step === 3) {
      if (formData.folha12 < 0) {
        newErrors.folha12 = 'A folha não pode ser negativa'
      }
      if (formData.folha12 > formData.rbt12 * 1.5 && formData.rbt12 > 0) {
        newErrors.folha12 =
          'A folha anual parece muito superior à receita bruta. Verifique o valor.'
      }
    }

    if (step === 4) {
      if (formData.margemLucro < 0 || formData.margemLucro > 100) {
        newErrors.margemLucro = 'A margem deve estar entre 0% e 100%'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const avancarEtapa = async () => {
    if (!validarEtapa(etapa)) return

    if (etapa < 4) {
      setEtapa((prev) => prev + 1)
      window.scrollTo({ top: 150, behavior: 'smooth' })
    } else {
      // Finalizar wizard: calcular diagnóstico e persistir no PocketBase
      setIsCalculando(true)
      try {
        const diagResult = executarDiagnosticoTributario({
          segmento: formData.segmento,
          rbt12: formData.rbt12,
          folha12: formData.folha12,
          margemLucro: formData.margemLucro,
        })

        // Persistir na coleção 'diagnosticos'
        try {
          await createDiagnostico({
            nome: formData.nome.trim(),
            email: formData.email.trim().toLowerCase(),
            telefone: formData.telefone.trim(),
            empresa: formData.empresa.trim(),
            segmento: formData.segmento,
            rbt12: formData.rbt12,
            folha12: formData.folha12,
            margem_lucro: formData.margemLucro,
            regime_recomendado: diagResult.regimeRecomendado,
            carga_simples: diagResult.simples.cargaAnual,
            carga_presumido: diagResult.presumido.cargaAnual,
            carga_real: diagResult.real.cargaAnual,
            economia_anual: diagResult.economiaAnual,
          })
        } catch (dbErr) {
          console.error('Aviso: diagnóstico gerado, mas falha ao salvar no banco:', dbErr)
        }

        setResultado(diagResult)
        setEtapa(5)
        window.scrollTo({ top: 120, behavior: 'smooth' })
      } catch (err) {
        console.error('Erro ao calcular diagnóstico:', err)
      } finally {
        setIsCalculando(false)
      }
    }
  }

  const voltarEtapa = () => {
    if (etapa > 1) {
      setEtapa((prev) => prev - 1)
      window.scrollTo({ top: 150, behavior: 'smooth' })
    }
  }

  const reiniciarDiagnostico = () => {
    setResultado(null)
    setEtapa(1)
    setLeadEnviado(false)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Falar com especialista: cria um lead na coleção 'leads' citando o diagnóstico
  const handleFalarEspecialista = async () => {
    if (!resultado) return
    setIsLeadSubmitting(true)
    try {
      const mensagemPreenchida = `Solicitei diagnóstico tributário no simulador.
Empresa: ${formData.empresa} (${formData.segmento})
RBT12: R$ ${formData.rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Folha 12m: R$ ${formData.folha12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Fator R: ${resultado.fatorR}%)
Margem Lucro: ${formData.margemLucro}%
Regime recomendado: ${resultado.regimeRecomendado}
Economia estimada: R$ ${resultado.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano.`

      await createLead({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        empresa: formData.empresa.trim(),
        segmento: formData.segmento,
        funcionarios: formData.folha12 > 500000 ? '21–50' : '6–20',
        mensagem: mensagemPreenchida,
      })

      setLeadEnviado(true)
      setIsEspecialistaModalOpen(true)
    } catch (err) {
      console.error('Erro ao gravar lead do diagnóstico:', err)
      setIsEspecialistaModalOpen(true)
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  // Atalhos rápidos para faturamento e folha
  const preencherPreset = (rbt: number, folha: number, margem: number) => {
    setFormData((prev) => ({ ...prev, rbt12: rbt, folha12: folha, margemLucro: margem }))
    setRbt12Input(formatMoedaInput(rbt))
    setFolha12Input(formatMoedaInput(folha))
    setMargemInput(margem.toString())
  }

  // Calcular proporções para o gráfico de barras comparativo
  const maxCarga = resultado
    ? Math.max(
        resultado.simples.elegivel ? resultado.simples.cargaAnual : 0,
        resultado.presumido.elegivel ? resultado.presumido.cargaAnual : 0,
        resultado.real.cargaAnual,
        1,
      )
    : 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-24 pb-20">
      {/* HERO SECTION DA FERRAMENTA */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#0A1A13] via-[#0D2A1C] to-[#145A32] text-white border-b border-white/10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2ECC71]/40 bg-[#145A32]/60 text-xs sm:text-sm font-medium text-emerald-300 mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#2ECC71]" />
            <span>Simulador Tributário 2025 • Inteligência Fiscal</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white mb-4">
            Diagnóstico de Enquadramento{' '}
            <span className="text-[#2ECC71] underline decoration-[#2ECC71]/30 underline-offset-4">
              Tributário
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Descubra em menos de 2 minutos se o <strong>Simples Nacional</strong>,{' '}
            <strong>Lucro Presumido</strong> ou <strong>Lucro Real</strong> é a opção que gera maior
            economia líquida e segurança fiscal para a sua empresa.
          </p>
        </div>
      </section>

      {/* CONTAINER PRINCIPAL DO WIZARD / RESULTADO */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 -mt-6">
        {/* BARRA DE PROGRESSO DO WIZARD (se etapa <= 4) */}
        {etapa <= 4 && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-[#145A32] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
                Etapa {etapa} de 4
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {etapa === 1 && 'Sobre a Empresa'}
                {etapa === 2 && 'Faturamento Anual (RBT12)'}
                {etapa === 3 && 'Folha de Pagamento (Fator R)'}
                {etapa === 4 && 'Rentabilidade e Margem'}
              </span>
            </div>

            {/* Barra linear */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#145A32] to-[#2ECC71] h-full transition-all duration-500 rounded-full"
                style={{ width: `${(etapa / 4) * 100}%` }}
              />
            </div>

            {/* Marcadores das 4 etapas */}
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              {[
                { n: 1, label: 'Empresa', icon: Building2 },
                { n: 2, label: 'Faturamento', icon: DollarSign },
                { n: 3, label: 'Folha 12m', icon: Users2 },
                { n: 4, label: 'Margem', icon: Percent },
              ].map((step) => {
                const IconComp = step.icon
                const isActive = etapa === step.n
                const isDone = etapa > step.n
                return (
                  <div key={step.n} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone
                          ? 'bg-[#2ECC71] text-[#0A1A13]'
                          : isActive
                            ? 'bg-[#145A32] text-white ring-4 ring-[#2ECC71]/20'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <IconComp className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                        isActive
                          ? 'text-slate-900 font-bold'
                          : isDone
                            ? 'text-[#145A32]'
                            : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 1: SOBRE A EMPRESA */}
        {/* ========================================================= */}
        {etapa === 1 && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-xl border border-slate-200">
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#145A32] uppercase tracking-wider block mb-1">
                Passo 1 • Identificação
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Conte-nos sobre a sua empresa
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Os dados de contato serão utilizados para enviar o relatório detalhado do seu
                diagnóstico.
              </p>
            </div>

            <div className="space-y-5">
              {/* Nome do Contato */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    if (errors.nome) setErrors((prev) => ({ ...prev, nome: undefined }))
                  }}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 input-focus-ring ${
                    errors.nome ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.nome && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.nome}</p>
                )}
              </div>

              {/* Razão Social / Nome da Empresa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, empresa: e.target.value }))
                    if (errors.empresa) setErrors((prev) => ({ ...prev, empresa: undefined }))
                  }}
                  placeholder="Ex: Inova Tecnologia & Consultoria Ltda"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 input-focus-ring ${
                    errors.empresa ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.empresa && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.empresa}</p>
                )}
              </div>

              {/* Segmento de Atuação (Grade responsiva com 10 opções) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Segmento Principal de Atividade *
                  </label>
                  <span className="text-[11px] text-slate-400">Selecione 1 das 10 opções</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: 'Comércio' as SegmentoEmpresa,
                      icon: ShoppingCart,
                      desc: 'Varejo e atacado de mercadorias (Anexo I / ICMS)',
                    },
                    {
                      id: 'Serviços' as SegmentoEmpresa,
                      icon: Briefcase,
                      desc: 'Prestação de serviços e consultoria (ISS / Fator R)',
                    },
                    {
                      id: 'Indústria' as SegmentoEmpresa,
                      icon: Factory,
                      desc: 'Fabricação e transformação fabril (Anexo II / ICMS)',
                    },
                    {
                      id: 'Saúde' as SegmentoEmpresa,
                      icon: HeartPulse,
                      desc: 'Clínicas, consultórios e laboratórios (ISS)',
                    },
                    {
                      id: 'Educação' as SegmentoEmpresa,
                      icon: GraduationCap,
                      desc: 'Escolas, faculdades e cursos livres (ISS)',
                    },
                    {
                      id: 'Agro' as SegmentoEmpresa,
                      icon: Sprout,
                      desc: 'Produção rural e agronegócio (Base 8%)',
                    },
                    {
                      id: 'Transporte' as SegmentoEmpresa,
                      icon: Truck,
                      desc: 'Cargas e passageiros (Presunção 16% IRPJ)',
                    },
                    {
                      id: 'Tecnologia' as SegmentoEmpresa,
                      icon: Cpu,
                      desc: 'Software, SaaS e TI (ISS / Fator R)',
                    },
                    {
                      id: 'Construção Civil' as SegmentoEmpresa,
                      icon: Hammer,
                      desc: 'Obras, reformas e engenharia civil (ISS)',
                    },
                    {
                      id: 'Bares e Restaurantes' as SegmentoEmpresa,
                      icon: UtensilsCrossed,
                      desc: 'Alimentação e bebidas (Presunção 8% / ICMS)',
                    },
                  ].map((item) => {
                    const isSelected = formData.segmento === item.id
                    const IconComponent = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, segmento: item.id }))}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#2ECC71] bg-emerald-50/70 ring-2 ring-[#2ECC71]/30 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[#2ECC71] text-[#0A1A13]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />}
                          </div>
                          <span
                            className={`font-heading font-bold text-xs sm:text-sm block leading-tight ${
                              isSelected ? 'text-[#145A32]' : 'text-slate-800'
                            }`}
                          >
                            {item.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug mt-1.5">
                          {item.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Contatos em 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    placeholder="carlos@empresa.com.br"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 input-focus-ring ${
                      errors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    placeholder="+55 (11) 99999-9999"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 input-focus-ring ${
                      errors.telefone ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.telefone && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.telefone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={avancarEtapa}
                className="px-8 py-3.5 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center gap-2"
              >
                <span>Próximo: Faturamento</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 2: FATURAMENTO (RBT12) */}
        {/* ========================================================= */}
        {etapa === 2 && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-xl border border-slate-200">
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#145A32] uppercase tracking-wider block mb-1">
                Passo 2 • Receita
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Qual foi a Receita Bruta dos últimos 12 meses (RBT12)?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                A soma de todo o faturamento bruto faturado pela empresa nos últimos 12 meses
                consecutivos.
              </p>
            </div>

            <div className="space-y-6">
              {/* Campo monetário de destaque */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Receita Bruta Acumulada (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-extrabold text-xl text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    value={rbt12Input}
                    onChange={handleRbt12Change}
                    placeholder="0,00"
                    className="w-full pl-14 pr-4 py-4 rounded-xl border border-slate-200 bg-white font-heading font-bold text-2xl sm:text-3xl text-slate-900 input-focus-ring"
                  />
                </div>
                {errors.rbt12 && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{errors.rbt12}</p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-[#145A32] shrink-0" />
                  <span>
                    Média mensal aproximada:{' '}
                    <strong className="text-slate-800">
                      R${' '}
                      {(formData.rbt12 / 12).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      /mês
                    </strong>
                  </span>
                </div>
              </div>

              {/* Botões de presets rápidos */}
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-2">
                  Exemplos comuns de faturamento anual:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'R$ 180 mil', rbt: 180000, folha: 36000, margem: 30 },
                    { label: 'R$ 600 mil', rbt: 600000, folha: 120000, margem: 25 },
                    { label: 'R$ 1,8 milhão', rbt: 1800000, folha: 450000, margem: 20 },
                    { label: 'R$ 5,5 milhões', rbt: 5500000, folha: 1100000, margem: 15 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => preencherPreset(p.rbt, p.folha, p.margem)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:border-[#2ECC71] bg-white hover:bg-emerald-50 text-xs font-semibold text-slate-700 hover:text-[#145A32] transition-colors text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avisos de limites */}
              {formData.rbt12 > LIMITE_SIMPLES && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <strong>Atenção:</strong> O faturamento informado ultrapassa{' '}
                    <strong>R$ 4.800.000,00</strong>. Sua empresa{' '}
                    <strong>não é elegível ao Simples Nacional</strong> e o comparativo focará entre{' '}
                    <strong>Lucro Presumido</strong> e <strong>Lucro Real</strong>.
                  </div>
                </div>
              )}

              {formData.rbt12 > LIMITE_PRESUMIDO && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3">
                  <Building className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-purple-900 leading-relaxed">
                    <strong>Obrigatoriedade Legal:</strong> Faturamentos acima de R$ 78 milhões
                    estão legalmente obrigados ao regime de <strong>Lucro Real</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={voltarEtapa}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={avancarEtapa}
                className="px-8 py-3.5 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center gap-2"
              >
                <span>Próximo: Folha de Pagamento</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 3: FOLHA DE PAGAMENTO (FATOR R) */}
        {/* ========================================================= */}
        {etapa === 3 && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-xl border border-slate-200">
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#145A32] uppercase tracking-wider block mb-1">
                Passo 3 • Folha Salarial & Pró-labore
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Folha de Pagamento dos últimos 12 meses
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Inclui salários de colaboradores, pró-labore dos sócios e encargos sociais (INSS,
                FGTS).
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Folha Anual Acumulada (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-extrabold text-xl text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    value={folha12Input}
                    onChange={handleFolha12Change}
                    placeholder="0,00"
                    className="w-full pl-14 pr-4 py-4 rounded-xl border border-slate-200 bg-white font-heading font-bold text-2xl sm:text-3xl text-slate-900 input-focus-ring"
                  />
                </div>
                {errors.folha12 && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{errors.folha12}</p>
                )}

                {/* Exibição do Fator R calculado dinamicamente */}
                {formData.rbt12 > 0 && (
                  <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        Indicador Fator R (Folha / Receita)
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          (formData.folha12 / formData.rbt12) * 100 >= 28
                            ? 'bg-emerald-100 text-[#145A32] border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {((formData.folha12 / formData.rbt12) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${
                          (formData.folha12 / formData.rbt12) * 100 >= 28
                            ? 'bg-[#2ECC71]'
                            : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${Math.min(100, (formData.folha12 / formData.rbt12) * 100)}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-600">
                      {(formData.folha12 / formData.rbt12) * 100 >= 28 ? (
                        <span className="text-[#145A32] font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                          Excelente! Seu Fator R é igual ou superior a 28%, permitindo tributar
                          serviços no <strong>Anexo III</strong> do Simples (alíquotas a partir de
                          6%) em vez do Anexo V (15,5%).
                        </span>
                      ) : (
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-500 shrink-0" />
                          Fator R abaixo de 28%. Para empresas de serviços, a tributação no Simples
                          fica no <strong>Anexo V</strong> (alíquotas mais altas). Nossos
                          consultores podem sugerir estratégias de pró-labore para atingir os 28%.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Botões para preenchimento rápido da folha */}
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-2">
                  Atalhos de percentual sobre o faturamento:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '15% da receita', perc: 0.15 },
                    { label: '28% (Fator R)', perc: 0.28 },
                    { label: '40% da receita', perc: 0.4 },
                  ].map((at) => (
                    <button
                      key={at.label}
                      type="button"
                      onClick={() => {
                        const folha = Math.round(formData.rbt12 * at.perc)
                        setFormData((prev) => ({ ...prev, folha12: folha }))
                        setFolha12Input(formatMoedaInput(folha))
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:border-[#2ECC71] bg-white hover:bg-emerald-50 text-xs font-semibold text-slate-700 hover:text-[#145A32] transition-colors text-center"
                    >
                      {at.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={voltarEtapa}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={avancarEtapa}
                className="px-8 py-3.5 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center gap-2"
              >
                <span>Próximo: Rentabilidade</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 4: RENTABILIDADE / MARGEM DE LUCRO */}
        {/* ========================================================= */}
        {etapa === 4 && (
          <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-xl border border-slate-200">
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#145A32] uppercase tracking-wider block mb-1">
                Passo 4 • Rentabilidade
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Qual é a margem de lucro líquida estimada da sua empresa?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                A margem de lucro define se o <strong>Lucro Real</strong> (que tributa o lucro
                efetivo) compensa frente ao <strong>Lucro Presumido</strong> (que tributa uma margem
                pré-definida).
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Margem de Lucro Líquida (% sobre a receita)
                  </label>
                  <span className="font-heading font-extrabold text-2xl text-[#145A32] bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
                    {formData.margemLucro}%
                  </span>
                </div>

                {/* Slider visual */}
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={formData.margemLucro}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setFormData((prev) => ({ ...prev, margemLucro: val }))
                    setMargemInput(val.toString())
                  }}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2ECC71]"
                />

                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>0% (Empresa no ponto de equilíbrio)</span>
                  <span>15%–25% (Média brasileira)</span>
                  <span>60%+ (Alta rentabilidade)</span>
                </div>

                {/* Input numérico direto */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-medium">
                    Ou digite o valor exato:
                  </span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      value={margemInput}
                      onChange={handleMargemChange}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 bg-white input-focus-ring"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
                {errors.margemLucro && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{errors.margemLucro}</p>
                )}

                {/* Lucro em R$ estimado */}
                <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                  Lucro anual estimado em R$:{' '}
                  <strong className="text-slate-900 font-bold">
                    R${' '}
                    {(formData.rbt12 * (formData.margemLucro / 100)).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>

              {/* Botões rápidos de margens comuns */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '5% (Margem baixa)', val: 5 },
                  { label: '15% (Comércio)', val: 15 },
                  { label: '30% (Serviços)', val: 30 },
                  { label: '45% (Alta margem)', val: 45 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, margemLucro: item.val }))
                      setMargemInput(item.val.toString())
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      formData.margemLucro === item.val
                        ? 'border-[#2ECC71] bg-emerald-50 text-[#145A32] font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium'
                    }`}
                  >
                    <span className="text-xs block font-bold">{item.val}%</span>
                    <span className="text-[10px] text-slate-400 block truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={voltarEtapa}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={avancarEtapa}
                disabled={isCalculando}
                className="px-8 py-3.5 rounded-xl font-heading font-semibold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center gap-2 disabled:opacity-75"
              >
                {isCalculando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A1A13]" />
                    <span>Calculando Cenários...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Diagnóstico Tributário</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 5: TELA DE RESULTADO DO DIAGNÓSTICO */}
        {/* ========================================================= */}
        {etapa === 5 && resultado && (
          <div className="space-y-8 animate-fade-in">
            {/* CARD DE DESTAQUE: REGIME RECOMENDADO */}
            <div className="rounded-[28px] p-6 sm:p-10 bg-gradient-to-br from-[#0A1A13] via-[#0E2E1E] to-[#145A32] text-white shadow-2xl border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#2ECC71]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71]/40 text-[#2ECC71] text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Melhor Enquadramento Identificado
                  </div>
                  <span className="text-xs text-slate-300">
                    Empresa: <strong className="text-white">{formData.empresa}</strong> •{' '}
                    {formData.segmento}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8">
                    <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block mb-1">
                      Regime mais vantajoso para 2025
                    </span>
                    <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight mb-4">
                      {resultado.regimeRecomendado}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl mb-6">
                      {resultado.explicacaoRecomendacao}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-emerald-200">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
                        <span>100% de conformidade com a legislação</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-[#2ECC71]" />
                        <span>Fórmula apurada com base no SPED/DAS 2025</span>
                      </div>
                    </div>
                  </div>

                  {/* Card com a economia estimada em R$ */}
                  <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                    <span className="text-xs text-slate-300 uppercase tracking-wider block mb-1">
                      Economia Estimada vs. 2º Colocado
                    </span>
                    <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#2ECC71] my-2">
                      R${' '}
                      {resultado.economiaAnual.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-xs text-emerald-300 block">por ano em caixa livre</span>

                    {resultado.segundoMaisVantajoso && (
                      <p className="text-[11px] text-slate-300 mt-3 pt-3 border-t border-white/10">
                        Comparado a escolher <strong>{resultado.segundoMaisVantajoso}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* GRÁFICO COMPARATIVO DE BARRAS DOS 3 REGIMES */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                    Comparativo Anual de Carga Tributária
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Projeção anual de impostos e alíquotas efetivas sobre R${' '}
                    {formData.rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2ECC71]" />
                  <span className="text-xs font-semibold text-slate-600">Recomendado</span>
                </div>
              </div>

              {/* Grid das barras */}
              <div className="space-y-6">
                {[resultado.simples, resultado.presumido, resultado.real].map((regime) => {
                  const isRecomendado = regime.nome === resultado.regimeRecomendado
                  const percentLargura = regime.elegivel
                    ? Math.max(12, Math.round((regime.cargaAnual / maxCarga) * 100))
                    : 100

                  return (
                    <div
                      key={regime.nome}
                      className={`p-5 rounded-2xl border transition-all ${
                        isRecomendado
                          ? 'border-[#2ECC71] bg-emerald-50/40 ring-2 ring-[#2ECC71]/30 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-heading font-bold text-base text-slate-900">
                            {regime.nome}
                          </h4>
                          {isRecomendado && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#2ECC71] text-[#0A1A13]">
                              Mais Econômico
                            </span>
                          )}
                          {!regime.elegivel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-300">
                              Não Elegível
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {regime.elegivel ? (
                            <div>
                              <span className="font-heading font-extrabold text-lg sm:text-xl text-slate-900">
                                R${' '}
                                {regime.cargaAnual.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-xs font-semibold text-slate-500 ml-2">
                                ({regime.aliquotaEfetiva}% efetivo)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-500 italic">
                              {regime.motivoInelegibilidade || 'Acima do limite legal'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra visual proporcional */}
                      {regime.elegivel ? (
                        <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-[11px] font-bold ${
                              isRecomendado
                                ? 'bg-gradient-to-r from-[#145A32] to-[#2ECC71] text-white shadow-sm'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                            style={{ width: `${percentLargura}%` }}
                          >
                            <span>{regime.aliquotaEfetiva}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden flex items-center px-3 text-[11px] text-slate-400">
                          Inelegível pela receita bruta anual informada
                        </div>
                      )}

                      {/* Descrição curta didática */}
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                        {regime.descricaoCurta}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* DETALHAMENTO DOS TRIBUTOS EM 3 COLUNAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Simples */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Simples Nacional
                  </h4>
                  <span className="text-xs text-slate-400">DAS Único</span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Engloba IRPJ, CSLL, PIS, COFINS, CPP e impostos de consumo (ICMS/ISS) em alíquota
                  progressiva.
                </p>
                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tabela aplicada:</span>
                    <strong className="text-slate-800">
                      {resultado.simples.detalhes.anexoUtilizado || 'Anexo padrão'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fator R apurado:</span>
                    <strong className="text-slate-800">{resultado.fatorR}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teto da receita:</span>
                    <span className="text-slate-800">R$ 4,8 milhões/ano</span>
                  </div>
                </div>
              </div>

              {/* Card Presumido */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Lucro Presumido
                  </h4>
                  <span className="text-xs text-slate-400">Cumulativo</span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  IRPJ e CSLL incidem sobre margem presumida fixada em lei (8% comércio ou 32%
                  serviços).
                </p>
                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PIS + COFINS:</span>
                    <strong className="text-slate-800">3,65% fixo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {formData.segmento === 'Comércio' ||
                      formData.segmento === 'Indústria' ||
                      formData.segmento === 'Agro' ||
                      formData.segmento === 'Bares e Restaurantes'
                        ? 'ICMS estadual:'
                        : 'ISS municipal:'}
                    </span>
                    <strong className="text-slate-800">
                      {formData.segmento === 'Comércio' ||
                      formData.segmento === 'Indústria' ||
                      formData.segmento === 'Agro' ||
                      formData.segmento === 'Bares e Restaurantes'
                        ? '12%'
                        : '2%'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teto da receita:</span>
                    <span className="text-slate-800">R$ 78 milhões/ano</span>
                  </div>
                </div>
              </div>

              {/* Card Real */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-base text-slate-900">Lucro Real</h4>
                  <span className="text-xs text-slate-400">Não Cumulativo</span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Impostos federais incidem estritamente sobre o lucro contábil auferido pela
                  empresa.
                </p>
                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IRPJ + CSLL:</span>
                    <strong className="text-slate-800">Sobre lucro contábil</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PIS + COFINS:</span>
                    <strong className="text-slate-800">9,25% (com créditos)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Obrigatório acima de:</span>
                    <span className="text-slate-800">R$ 78 milhões</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO CTA / BOTÃO FALAR COM ESPECIALISTA */}
            <div className="bg-gradient-to-r from-[#145A32] to-[#0A1A13] text-white rounded-[24px] p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-white/10 mb-2">
                  Próximo Passo Recomendado
                </span>
                <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  Valide este enquadramento com nossos contadores especialistas
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Nosso time realiza uma auditoria aprofundada das notas fiscais, despesas e folhas
                  da sua empresa para garantir a menor carga tributária com risco zero.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleFalarEspecialista}
                  disabled={isLeadSubmitting || leadEnviado}
                  className="px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] hover:shadow-[0_10px_30px_rgba(46,204,113,0.55)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-80"
                >
                  {isLeadSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enviando dados...</span>
                    </>
                  ) : leadEnviado ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Solicitação Enviada!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Falar com um Especialista</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={reiniciarDiagnostico}
                  className="px-5 py-4 rounded-xl border border-white/20 hover:border-white text-slate-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Novo Cálculo</span>
                </button>
              </div>
            </div>

            {/* DISCLAIMER OBRIGATÓRIO */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed">
              <strong>Aviso legal:</strong> Estimativa preliminar com base nas informações
              fornecidas. Não substitui análise contábil completa. A escolha definitiva de
              enquadramento deve considerar particularidades como CNAEs impeditivos, créditos de
              ICMS/PIS/COFINS e convenções coletivas da categoria.
            </div>
          </div>
        )}
      </div>

      {/* DIÁLOGO DE CONFIRMAÇÃO DO CONTATO COM ESPECIALISTA */}
      <Dialog open={isEspecialistaModalOpen} onOpenChange={setIsEspecialistaModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-[#2ECC71]">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-2xl text-slate-900 text-center">
              Diagnóstico registrado com sucesso!
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2 text-center">
              Nossa equipe tributária já recebeu os parâmetros da{' '}
              <strong>{formData.empresa}</strong> (regime sugerido:{' '}
              <strong className="text-[#145A32]">{resultado?.regimeRecomendado}</strong>).
              Entraremos em contato via WhatsApp ou e-mail com a validação completa.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setIsEspecialistaModalOpen(false)}
              className="rounded-xl"
            >
              Ver Resultado Novamente
            </Button>
            <a
              href={`https://wa.me/551140028922?text=${encodeURIComponent(
                `Olá, fiz o diagnóstico tributário para a empresa ${formData.empresa}. O resultado apontou ${resultado?.regimeRecomendado}. Gostaria de agendar uma consultoria.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] transition-colors"
            >
              Falar no WhatsApp Agora
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
