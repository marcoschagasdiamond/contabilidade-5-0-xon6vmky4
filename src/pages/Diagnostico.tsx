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
  Scale,
  Zap,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  Download,
} from 'lucide-react'
import { gerarRelatorioDiagnosticoPDF } from '@/lib/pdfRelatorio'
import {
  executarDiagnosticoTributario,
  type SegmentoEmpresa,
  type ResultadoDiagnosticoCompleto,
  LISTA_SEGMENTOS,
  CIDADES_ISS_MAPA,
  obterAliquotaISS,
  LIMITE_SIMPLES,
  LIMITE_PRESUMIDO,
} from '@/lib/regimes'
import { createDiagnostico } from '@/services/diagnosticos'
import { createLead } from '@/services/leads'
import { formatarCNPJ, validarCNPJ, limparCNPJ } from '@/lib/cnpj'
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
  cnpj?: string
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
    cnpj: string
    cidade: string
    segmento: SegmentoEmpresa
    rbt12: number
    folha12: number
    margemLucro: number
    funcionarios: string
    emissaoNf: string
    atividadeMista: boolean
    regimeAtual: string
  }>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cnpj: '',
    cidade: 'sp-sao-paulo',
    segmento: 'Comércio',
    rbt12: 600000,
    folha12: 120000,
    margemLucro: 25,
    funcionarios: '1 a 5 funcionários',
    emissaoNf: 'Predominante para Pessoas Jurídicas (B2B)',
    atividadeMista: false,
    regimeAtual: 'Simples Nacional',
  })

  // Inputs raw em string para facilitar digitação com formatação
  const [rbt12Input, setRbt12Input] = useState('600.000,00')
  const [folha12Input, setFolha12Input] = useState('120.000,00')
  const [margemInput, setMargemInput] = useState('25')

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [leadEnviado, setLeadEnviado] = useState(false)
  const [isEspecialistaModalOpen, setIsEspecialistaModalOpen] = useState(false)
  const [mostrarDetalhesTecnicos, setMostrarDetalhesTecnicos] = useState(false)
  const [isGerandoPDF, setIsGerandoPDF] = useState(false)

  const handleBaixarPDF = async () => {
    if (!resultado) return
    setIsGerandoPDF(true)
    try {
      gerarRelatorioDiagnosticoPDF({
        dados: {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          empresa: formData.empresa,
          cnpj: formData.cnpj,
          segmento: formData.segmento,
          rbt12: formData.rbt12,
          folha12: formData.folha12,
          margemLucro: formData.margemLucro,
          funcionarios: formData.funcionarios,
          emissaoNf: formData.emissaoNf,
          atividadeMista: formData.atividadeMista,
          regimeAtual: formData.regimeAtual,
          cidade: formData.cidade,
        },
        resultado,
      })
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF:', err)
    } finally {
      setIsGerandoPDF(false)
    }
  }

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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: formatted }))
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: undefined }))
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
      if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório (mínimo 3 caracteres)'
      else if (formData.nome.trim().length < 3) newErrors.nome = 'Informe seu nome completo'

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.email.trim()) newErrors.email = 'E-mail corporativo é obrigatório'
      else if (!emailRegex.test(formData.email.trim()))
        newErrors.email = 'Informe um e-mail válido (ex: seu.nome@empresa.com.br)'

      const digitsOnly = formData.telefone.replace(/\D/g, '')
      const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
      if (!formData.telefone.trim()) newErrors.telefone = 'Telefone/WhatsApp é obrigatório'
      else if (cleanDigits.length < 10)
        newErrors.telefone = 'Informe um telefone válido com DDD (mínimo 10 dígitos)'

      if (!formData.empresa.trim()) newErrors.empresa = 'Nome da empresa é obrigatório'

      const cnpjDigits = limparCNPJ(formData.cnpj)
      if (!formData.cnpj.trim()) {
        newErrors.cnpj = 'Informe um CNPJ válido com 14 dígitos'
      } else if (cnpjDigits.length !== 14 || !validarCNPJ(formData.cnpj)) {
        newErrors.cnpj = 'Informe um CNPJ válido com 14 dígitos'
      }

      if (!formData.segmento) newErrors.segmento = 'Selecione o segmento principal de atuação'
    }

    if (step === 2) {
      if (formData.rbt12 <= 0) {
        newErrors.rbt12 = 'Informe a receita bruta dos últimos 12 meses (valor maior que zero)'
      }
    }

    if (step === 3) {
      if (formData.folha12 < 0) {
        newErrors.folha12 =
          'A folha não pode ser negativa (use 0 se não houver funcionários/pró-labore)'
      }
      if (formData.folha12 > formData.rbt12 * 1.5 && formData.rbt12 > 0) {
        newErrors.folha12 =
          'Atenção: a folha anual informada supera 150% do faturamento bruto. Verifique se o valor está correto.'
      }
    }

    if (step === 4) {
      if (formData.margemLucro < 0 || formData.margemLucro > 100) {
        newErrors.margemLucro = 'A margem de lucro estimada deve ficar entre 0% e 100%'
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
          funcionarios: formData.funcionarios,
          emissaoNf: formData.emissaoNf,
          atividadeMista: formData.atividadeMista,
          regimeAtual: formData.regimeAtual,
          cidade: formData.cidade,
        })

        // Persistir na coleção 'diagnosticos' incluindo novos campos, cidade, alíquota de ISS e ranking
        try {
          await createDiagnostico({
            nome: formData.nome.trim(),
            email: formData.email.trim().toLowerCase(),
            telefone: formData.telefone.trim(),
            empresa: formData.empresa.trim(),
            cnpj: formData.cnpj.trim(),
            cidade: diagResult.cidade,
            aliquota_iss: diagResult.aliquotaISS,
            segmento: formData.segmento,
            rbt12: formData.rbt12,
            folha12: formData.folha12,
            margem_lucro: formData.margemLucro,
            regime_recomendado: diagResult.regimeRecomendado,
            carga_simples: diagResult.simples.cargaAnual,
            carga_presumido: diagResult.presumido.cargaAnual,
            carga_real: diagResult.real.cargaAnual,
            economia_anual: diagResult.economiaAnual,
            funcionarios: formData.funcionarios,
            emissao_nf: formData.emissaoNf,
            atividade_mista: formData.atividadeMista,
            regime_atual: formData.regimeAtual,
            ranking_json: diagResult.ranking.map((item) => ({
              posicao: item.posicao,
              regime: item.regime,
              cargaAnual: item.cargaAnual,
              aliquotaEfetiva: item.aliquotaEfetiva,
              elegivel: item.elegivel,
              diferencaValor: item.diferencaValor,
              diferencaPercent: item.diferencaPercent,
            })),
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
Empresa: ${formData.empresa} (CNPJ: ${formData.cnpj || 'Não informado'}) (${formData.segmento})
Cidade/UF: ${resultado.cidade} (ISS: ${resultado.aliquotaISS}%)
Regime Atual: ${formData.regimeAtual}
Porte: ${formData.funcionarios}
Emissão de NF: ${formData.emissaoNf}
Operação Mista: ${formData.atividadeMista ? 'Sim (Comércio + Serviço)' : 'Não'}
RBT12: R$ ${formData.rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Folha 12m: R$ ${formData.folha12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Fator R: ${resultado.fatorR}%)
Margem Lucro: ${formData.margemLucro}%
Regime recomendado: ${resultado.regimeRecomendado} ${resultado.empateTecnico ? `(Empate técnico com ${resultado.regimeEmpatado})` : ''}
Economia estimada: R$ ${resultado.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano.`

      let leadFuncionario = '1–5'
      if (formData.funcionarios.includes('6 a 15')) leadFuncionario = '6–20'
      else if (formData.funcionarios.includes('16 a 50')) leadFuncionario = '21–50'
      else if (formData.funcionarios.includes('Mais de 50')) leadFuncionario = '51–200'

      await createLead({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        empresa: formData.empresa.trim(),
        segmento: formData.segmento,
        funcionarios: leadFuncionario as any,
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

              {/* Razão Social / Nome da Empresa e CNPJ da Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      CNPJ da Empresa *
                    </label>
                    <span className="text-[11px] text-slate-400">14 dígitos</span>
                  </div>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    placeholder="00.000.000/0000-00"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 input-focus-ring ${
                      errors.cnpj ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.cnpj && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.cnpj}</p>
                  )}
                  {!errors.cnpj && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Aceita com ou sem máscara (ex: 00.000.000/0000-00).
                    </p>
                  )}
                </div>
              </div>

              {/* Cidade/UF (ISS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Cidade / UF (Alíquota de ISS) *
                  </label>
                  <span className="text-[11px] font-semibold text-[#145A32]">
                    ISS: {obterAliquotaISS(formData.cidade).aliquota.toFixed(1)}%
                  </span>
                </div>
                <select
                  value={formData.cidade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                >
                  {CIDADES_ISS_MAPA.map((cid) => (
                    <option key={cid.id} value={cid.id}>
                      {cid.descricao || `${cid.nome}/${cid.uf} (${cid.aliquota.toFixed(1)}%)`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Define o ISS municipal aplicado aos cálculos de serviços e transporte.
                </p>
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

              {/* Novos Campos Estruturados da Empresa */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Perfil Operacional da Empresa
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Regime Atual */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Regime Tributário Atual
                      </label>
                      <span className="text-[11px] text-slate-400">Como tributa hoje</span>
                    </div>
                    <select
                      value={formData.regimeAtual}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, regimeAtual: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI (Microempreendedor)">MEI (Microempreendedor)</option>
                      <option value="Nova empresa / Ainda não optante">
                        Nova empresa / Ainda não optante
                      </option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Serve para compararmos o regime atual com a oportunidade identificada.
                    </p>
                  </div>

                  {/* Quantidade de funcionários */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Quadro de Colaboradores
                      </label>
                      <span className="text-[11px] text-slate-400">Equipe</span>
                    </div>
                    <select
                      value={formData.funcionarios}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, funcionarios: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                    >
                      <option value="Apenas sócios (sem funcionários)">
                        Apenas sócios (sem funcionários CLT)
                      </option>
                      <option value="1 a 5 funcionários">1 a 5 funcionários</option>
                      <option value="6 a 15 funcionários">6 a 15 funcionários</option>
                      <option value="16 a 50 funcionários">16 a 50 funcionários</option>
                      <option value="Mais de 50 funcionários">Mais de 50 funcionários</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Influencia o peso da CPP (contribuição patronal previdenciária de 20%).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Emissão de Nota Fiscal PF / PJ */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Perfil dos Clientes / Emissão de NF
                      </label>
                      <span className="text-[11px] text-slate-400">B2B ou B2C</span>
                    </div>
                    <select
                      value={formData.emissaoNf}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, emissaoNf: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                    >
                      <option value="Predominante para Pessoas Jurídicas (B2B)">
                        Predominante para Pessoas Jurídicas (B2B)
                      </option>
                      <option value="Predominante para Consumidor Final / PF (B2C)">
                        Predominante para Consumidor Final / PF (B2C)
                      </option>
                      <option value="Equilibrado (PF e PJ)">Equilibrado (PF e PJ)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Clientes PJ costumam exigir créditos fiscais ou reter impostos na fonte.
                    </p>
                  </div>

                  {/* Operação mista de comércio e serviço */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Atividade Mista (Comércio + Serviço)
                    </label>
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.atividadeMista}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, atividadeMista: e.target.checked }))
                        }
                        className="mt-1 w-4 h-4 rounded text-[#2ECC71] focus:ring-[#2ECC71] border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 block">
                          Minha empresa fatura tanto venda de mercadorias quanto serviços
                        </span>
                        <span className="text-slate-500 text-[11px] block mt-0.5">
                          Ex: oficina mecânica que vende autopeças, empresa de TI que comercializa
                          equipamentos.
                        </span>
                      </div>
                    </label>
                  </div>
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
              {/* Box explicativo didático: o que é RBT12 */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#145A32] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#145A32] block mb-0.5 font-bold">
                    O que é a RBT12?
                  </strong>
                  É a <strong>Receita Bruta Total acumulada nos últimos 12 meses</strong>. Esse é o
                  termômetro oficial usado pela Receita Federal para definir sua faixa de alíquota
                  no Simples Nacional e verificar se você respeita os limites legais de R$ 4,8
                  milhões (Simples) e R$ 78 milhões (Presumido).
                </div>
              </div>

              {/* Campo monetário de destaque */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Receita Bruta Acumulada em 12 Meses (R$) *
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Total faturado no último ano
                  </span>
                </div>
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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-3 border-t border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#145A32] shrink-0" />
                    <span>
                      Média mensal estimada:{' '}
                      <strong className="text-slate-900">
                        R${' '}
                        {(formData.rbt12 / 12).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        /mês
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {formData.rbt12 <= LIMITE_SIMPLES
                      ? `Faltam R$ ${(LIMITE_SIMPLES - formData.rbt12).toLocaleString('pt-BR')} para o teto do Simples`
                      : 'Acima do teto do Simples Nacional'}
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
              {/* Box explicativo didático: o que é Folha e Fator R */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#145A32] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#145A32] block mb-0.5 font-bold">
                    O que é a Folha 12m e o Fator R?
                  </strong>
                  É o total acumulado em 12 meses de salários de colaboradores, pró-labore retirado
                  pelos sócios, FGTS e INSS. O <strong>Fator R</strong> é a divisão desse valor pela
                  receita bruta: se o resultado for <strong>28% ou mais</strong>, atividades de
                  serviço tributam no <strong>Anexo III (a partir de 6%)</strong> em vez do pesado{' '}
                  <strong>Anexo V (a partir de 15,5%)</strong>.
                </div>
              </div>

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
              {/* Box explicativo didático: Margem de Lucro vs Regimes */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#145A32] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#145A32] block mb-0.5 font-bold">
                    Por que a Margem de Lucro é decisiva?
                  </strong>
                  No <strong>Lucro Presumido</strong>, a Receita Federal presume um lucro fixo (8%
                  no comércio ou 32% em serviços), não importando seus gastos. Já no{' '}
                  <strong>Lucro Real</strong>, o imposto incide estritamente sobre o que sobrar de
                  verdade no caixa após todas as despesas. Se seu lucro real for pequeno ou tiver
                  altos custos dedutíveis, o Lucro Real costuma bater os outros regimes.
                </div>
              </div>

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
            {/* 1. RESUMO DIRETO EM LINGUAGEM SIMPLES (2 A 3 FRASES SEM JARGÃO) */}
            <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-lg border-2 border-[#2ECC71]/30">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#145A32]">
                <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                <span>Resumo Executivo do Diagnóstico</span>
              </div>
              <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed">
                {resultado.resumoSimplesTexto}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>
                    Empresa: <strong className="text-slate-800">{formData.empresa}</strong>
                  </span>
                  {formData.cnpj && (
                    <span>
                      • CNPJ: <strong className="text-slate-800">{formData.cnpj}</strong>
                    </span>
                  )}
                  <span>
                    • Cidade: <strong className="text-slate-800">{resultado.cidade}</strong> (ISS:{' '}
                    <strong className="text-[#145A32]">{resultado.aliquotaISS.toFixed(1)}%</strong>)
                  </span>
                  <span>
                    • Segmento: <strong className="text-slate-800">{formData.segmento}</strong>
                  </span>
                  <span>
                    • Regime atual informado:{' '}
                    <strong className="text-slate-800">{formData.regimeAtual}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBaixarPDF}
                  disabled={isGerandoPDF}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#145A32] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isGerandoPDF ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar relatório em PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. CARD DE DESTAQUE: REGIME RECOMENDADO & ECONOMIA */}
            <div className="rounded-[28px] p-6 sm:p-10 bg-gradient-to-br from-[#0A1A13] via-[#0E2E1E] to-[#145A32] text-white shadow-2xl border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#2ECC71]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71]/40 text-[#2ECC71] text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Regime Recomendado para 2025
                  </div>
                  {resultado.empateTecnico && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                      <Scale className="w-3.5 h-3.5" />
                      Empate Técnico Detectado (&lt; 3% de diferença)
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8">
                    <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block mb-1">
                      Menor Carga Tributária Anual Global
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
                        <span>Conforme legislação federal 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-[#2ECC71]" />
                        <span>Cálculo com base no SPED, DAS e Lei 9.249/95</span>
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
                        Comparado a optar por <strong>{resultado.segundoMaisVantajoso}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RANKING COMPLETO DOS REGIMES (DO 1º AO 3º COLOCADO) */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#145A32]" />
                    <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                      Ranking dos Regimes Tributários
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Comparação ordenada da menor para a maior carga tributária calculada.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  3 regimes avaliados
                </span>
              </div>

              <div className="space-y-4">
                {resultado.ranking.map((item) => {
                  const ehPrimeiro = item.posicao === 1
                  const ehEmpate = item.empateTecnicoComPrimeiro

                  return (
                    <div
                      key={item.regime}
                      className={`p-5 rounded-2xl border transition-all ${
                        ehPrimeiro
                          ? 'border-[#2ECC71] bg-emerald-50/50 ring-2 ring-[#2ECC71]/30 shadow-sm'
                          : ehEmpate
                            ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300'
                            : item.elegivel
                              ? 'border-slate-200 bg-white hover:bg-slate-50/50'
                              : 'border-slate-200 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              ehPrimeiro
                                ? 'bg-[#2ECC71] text-[#0A1A13]'
                                : ehEmpate
                                  ? 'bg-amber-400 text-amber-950'
                                  : item.elegivel
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            #{item.posicao}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-heading font-bold text-base text-slate-900">
                                {item.regime}
                              </h4>
                              {ehPrimeiro && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#2ECC71] text-[#0A1A13]">
                                  Recomendado
                                </span>
                              )}
                              {ehEmpate && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                                  Empate Técnico Viável
                                </span>
                              )}
                              {!item.elegivel && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                  Inelegível por Lei
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {item.statusDescritivo}
                            </span>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          {item.elegivel ? (
                            <div>
                              <div className="font-heading font-extrabold text-xl text-slate-900">
                                R${' '}
                                {item.cargaAnual.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                <span className="text-xs font-semibold text-slate-500 ml-1.5">
                                  /ano
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                Alíquota efetiva: <strong>{item.aliquotaEfetiva}%</strong>
                                {!ehPrimeiro && item.diferencaValor > 0 && (
                                  <span className="text-[#C0392B] font-semibold ml-2">
                                    (+R${' '}
                                    {item.diferencaValor.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}
                                    )
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-red-700 font-medium">
                              {item.motivoInelegibilidade ||
                                'Ultrapassa os limites legais permitidos'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {resultado.empateTecnico && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong>Atenção ao Empate Técnico:</strong> A diferença financeira entre o{' '}
                    <strong>{resultado.regimeRecomendado}</strong> e o{' '}
                    <strong>{resultado.regimeEmpatado}</strong> é inferior a 3%. Nesses casos,
                    fatores operacionais como retenção de ISS na fonte, direito a créditos
                    tributários por clientes PJ e custo de emissão de declarações costumam
                    desempatar a decisão com mais relevância que a alíquota isolada.
                  </div>
                </div>
              )}
            </div>

            {/* 4. REGRAS DE ANÁLISE APLICADAS À EMPRESA */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#145A32]" />
                  <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                    Regras Fiscais Aplicadas à sua Empresa
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Itens da legislação tributária brasileira que influenciaram diretamente este
                  cálculo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resultado.regrasAplicadas.map((regra, i) => {
                  const borderCor =
                    regra.tipo === 'sucesso'
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : regra.tipo === 'alerta'
                        ? 'border-amber-200 bg-amber-50/40'
                        : regra.tipo === 'inelegivel'
                          ? 'border-red-200 bg-red-50/40'
                          : 'border-slate-200 bg-slate-50/60'

                  const iconeCor =
                    regra.tipo === 'sucesso'
                      ? 'text-[#2ECC71]'
                      : regra.tipo === 'alerta'
                        ? 'text-amber-500'
                        : regra.tipo === 'inelegivel'
                          ? 'text-red-500'
                          : 'text-[#145A32]'

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${borderCor} flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {regra.tipo === 'sucesso' ? (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${iconeCor}`} />
                          ) : regra.tipo === 'alerta' ? (
                            <AlertTriangle className={`w-4 h-4 shrink-0 ${iconeCor}`} />
                          ) : regra.tipo === 'inelegivel' ? (
                            <AlertCircle className={`w-4 h-4 shrink-0 ${iconeCor}`} />
                          ) : (
                            <Info className={`w-4 h-4 shrink-0 ${iconeCor}`} />
                          )}
                          <h4 className="font-heading font-bold text-sm text-slate-900">
                            {regra.titulo}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {regra.descricao}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] font-medium text-slate-700">
                        <strong className="text-slate-900">Impacto:</strong> {regra.impacto}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 5. SEÇÃO: POR QUE ESTE REGIME? (3 A 5 BULLETS DIDÁTICOS) */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
                  <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                    Por que o {resultado.regimeRecomendado} foi o escolhido?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Conexão direta entre as informações fornecidas por você e os impactos tributários
                  legais.
                </p>
              </div>

              <div className="space-y-3">
                {resultado.motivosRecomendacao.map((motivo, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#145A32] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{motivo}</p>
                  </div>
                ))}
              </div>

              {/* Quando as alternativas fariam sentido */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="font-heading font-bold text-base text-slate-900 mb-1">
                  Quando os outros regimes passariam a valer a pena?
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Condições de mercado e operação que justificariam mudar para as opções
                  alternativas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {resultado.alternativas.map((alt) => {
                    const isRecomendado = alt.regime === resultado.regimeRecomendado
                    return (
                      <div
                        key={alt.regime}
                        className={`p-4 rounded-xl border ${
                          isRecomendado
                            ? 'border-[#2ECC71] bg-emerald-50/40'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <strong className="font-heading font-bold text-sm text-slate-900">
                            {alt.regime}
                          </strong>
                          {isRecomendado && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2ECC71] text-[#0A1A13]">
                              Atual escolha
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          <strong className="text-slate-700">Quando vale a pena:</strong>{' '}
                          {alt.quandoValeAPena}
                        </p>
                        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                          <strong className="text-slate-700">Neste cenário:</strong>{' '}
                          {alt.statusNesteCenario}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 6. GATILHOS QUE PODEM MUDAR A RECOMENDAÇÃO */}
            {resultado.gatilhosMudanca.length > 0 && (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
                <div className="mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                      Gatilhos de Atenção que Podem Mudar a Recomendação
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Fatores dinâmicos na operação da sua empresa que devem ser monitorados
                    trimestralmente.
                  </p>
                </div>

                <div className="space-y-3">
                  {resultado.gatilhosMudanca.map((gatilho, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-heading font-bold text-sm text-slate-900">
                            {gatilho.titulo}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Condição: {gatilho.condicao}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {gatilho.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GRÁFICO COMPARATIVO DE BARRAS DOS 3 REGIMES */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 tracking-tight">
                    Comparativo Visual de Carga Tributária Anual
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

            {/* SEÇÃO RETRÁTIL: VER DETALHAMENTO TÉCNICO COMPLETO */}
            <div className="bg-white rounded-[24px] p-6 shadow-md border border-slate-200">
              <button
                type="button"
                onClick={() => setMostrarDetalhesTecnicos((prev) => !prev)}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-[#145A32] transition-colors">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base text-slate-900 group-hover:text-[#145A32] transition-colors">
                      {mostrarDetalhesTecnicos
                        ? 'Ocultar Detalhamento Técnico'
                        : 'Ver Detalhamento Técnico Completo dos Tributos'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Abra para conferir memória de cálculo de IRPJ, CSLL, PIS, COFINS, ISS/ICMS e
                      anexos do Simples.
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#2ECC71]/20 flex items-center justify-center text-slate-600 transition-colors">
                  {mostrarDetalhesTecnicos ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {mostrarDetalhesTecnicos && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card Simples */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-heading font-bold text-sm text-slate-900">
                          Simples Nacional (DAS)
                        </h5>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Unificado
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tabela aplicada:</span>
                          <strong className="text-slate-800 text-right">
                            {resultado.simples.detalhes.anexoUtilizado || 'Anexo padrão'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fator R apurado:</span>
                          <strong className="text-slate-800">{resultado.fatorR}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carga estimada anual:</span>
                          <strong className="text-slate-900">
                            {resultado.simples.elegivel
                              ? `R$ ${resultado.simples.cargaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'Inelegível'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Teto federal:</span>
                          <span className="text-slate-800">R$ 4,8 milhões/ano</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Presumido */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-heading font-bold text-sm text-slate-900">
                          Lucro Presumido
                        </h5>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                          Cumulativo
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">PIS + COFINS:</span>
                          <strong className="text-slate-800">3,65% fixo</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IRPJ estimado:</span>
                          <strong className="text-slate-800">
                            {resultado.presumido.detalhes.irpj
                              ? `R$ ${resultado.presumido.detalhes.irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">CSLL estimada:</span>
                          <strong className="text-slate-800">
                            {resultado.presumido.detalhes.csll
                              ? `R$ ${resultado.presumido.detalhes.csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ICMS ou ISS:</span>
                          <strong className="text-slate-800">
                            {resultado.presumido.detalhes.icmsOuIss
                              ? `R$ ${resultado.presumido.detalhes.icmsOuIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Teto federal:</span>
                          <span className="text-slate-800">R$ 78 milhões/ano</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Real */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-heading font-bold text-sm text-slate-900">
                          Lucro Real
                        </h5>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                          Não Cumulativo
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Margem aplicada:</span>
                          <strong className="text-slate-800">
                            {formData.margemLucro}% estimada
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IRPJ estimado:</span>
                          <strong className="text-slate-800">
                            {resultado.real.detalhes.irpj
                              ? `R$ ${resultado.real.detalhes.irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">CSLL estimada:</span>
                          <strong className="text-slate-800">
                            {resultado.real.detalhes.csll
                              ? `R$ ${resultado.real.detalhes.csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">PIS/COFINS (9,25%):</span>
                          <strong className="text-slate-800">
                            {resultado.real.detalhes.pisCofins
                              ? `R$ ${resultado.real.detalhes.pisCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Obrigatório acima de:</span>
                          <span className="text-slate-800">R$ 78 milhões</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  onClick={handleBaixarPDF}
                  disabled={isGerandoPDF}
                  className="px-6 py-4 rounded-xl font-heading font-semibold text-sm sm:text-base text-white bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/50 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-70"
                >
                  {isGerandoPDF ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#2ECC71]" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 text-[#2ECC71]" />
                      <span>Baixar relatório em PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFalarEspecialista}
                  disabled={isLeadSubmitting || leadEnviado}
                  className="px-7 py-4 rounded-xl font-heading font-semibold text-sm sm:text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.4)] hover:shadow-[0_10px_30px_rgba(46,204,113,0.55)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-80"
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
                  className="px-4 py-4 rounded-xl border border-white/20 hover:border-white text-slate-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  title="Reiniciar Simulação"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Novo Cálculo</span>
                </button>
              </div>
            </div>

            {/* LIMITAÇÕES E CUIDADOS NA ORIENTAÇÃO (OBRIGATÓRIO) */}
            <div className="p-6 rounded-[24px] bg-amber-50/80 border border-amber-300 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs text-amber-950 leading-relaxed">
                  <h4 className="font-heading font-bold text-sm text-amber-900">
                    Limitações e Cuidados na Orientação Tributária (Aviso Legal Obrigatório)
                  </h4>
                  <p>
                    <strong>Natureza Estimativa:</strong> Este diagnóstico é uma ferramenta de
                    simulação preliminar e comparativa baseada exclusivamente nos números declarados
                    pelo usuário e nas tabelas gerais da legislação brasileira vigente em 2025.{' '}
                    <strong>
                      Ele não substitui uma análise contábil personalizada nem dispensa o parecer
                      formal de um contador legalmente habilitado no CRC.
                    </strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
                    <li>
                      <strong>CNAEs impeditivos e vedações legais:</strong> Algumas atividades
                      específicas, composições societárias (sócio pessoa jurídica, sócio residente
                      no exterior) ou débitos com o fisco impedem o ingresso no Simples Nacional,
                      independentemente do faturamento.
                    </li>
                    <li>
                      <strong>Créditos e não cumulatividade:</strong> No Lucro Real, o PIS e a
                      COFINS (9,25%) podem ter seu impacto reduzido por créditos sobre insumos,
                      mercadorias revendidas, energia elétrica e aluguéis, o que exige auditoria
                      documental.
                    </li>
                    <li>
                      <strong>ISS municipal e ICMS estadual:</strong> As alíquotas de ISS variam de
                      2% a 5% conforme o município e podem sofrer retenção na fonte. No ICMS,
                      regimes de substituição tributária (ST) e benefícios fiscais estaduais podem
                      alterar a carga final.
                    </li>
                    <li>
                      <strong>Prazos legais de opção:</strong> A mudança de regime tributário só
                      pode ser realizada anualmente, no mês de <strong>janeiro</strong> de cada
                      ano-calendário, sendo irretratável para todo o exercício.
                    </li>
                  </ul>
                  <p className="pt-2 border-t border-amber-200/80 text-[11px] text-amber-800">
                    Para validar com total segurança jurídica e risco zero antes da virada do
                    exercício fiscal, consulte gratuitamente nosso time de especialistas através do
                    botão acima.
                  </p>
                </div>
              </div>
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
