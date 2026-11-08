import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react'
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

export const OPCOES_SERVICOS_CONTATO = [
  'Diagnóstico 360°',
  'Contabilidade Digital',
  'Gestão Fiscal & Tributária',
  'Departamento Pessoal',
  'Consultoria Financeira Estratégica',
  'Planejamento Sucessório e Estruturação Patrimonial',
  'Assessoria Tributária Especializada',
  'Treinamento e Capacitação',
  'BPO Contábil 5.0',
  'Estruturação de Recebimentos & Gestão de Fluxo',
  'Back Office 5.0',
  'Negociação de Créditos Tributários, Direitos Creditórios e Precatórios',
  'Recuperação de Empresas & Gestão de Dívidas',
  'Cancelamento de NF no IBS/CBS',
  'Outro / Solução Integrada',
]

interface FormErrors {
  nome?: string
  email?: string
  telefone?: string
  empresa?: string
  cnpj?: string
  segmento?: string
  funcionarios?: string
}

export default function LeadForm({
  className = '',
  onVoltar,
  tipoSolicitacao = 'proposta',
  servicoPreselecionado = '',
  titulo,
  subtitulo,
  sucessoTitulo,
  sucessoMensagem,
}: {
  className?: string
  onVoltar?: () => void
  tipoSolicitacao?: string
  servicoPreselecionado?: string
  titulo?: string
  subtitulo?: string
  sucessoTitulo?: string
  sucessoMensagem?: string
}) {
  const [searchParams] = useSearchParams()
  const servicoUrl = searchParams.get('servico') || searchParams.get('service') || ''

  const [servicoInteresse, setServicoInteresse] = useState<string>(() => {
    return servicoPreselecionado || servicoUrl || ''
  })

  useEffect(() => {
    if (servicoPreselecionado) {
      setServicoInteresse(servicoPreselecionado)
    } else if (servicoUrl) {
      setServicoInteresse(servicoUrl)
    }
  }, [servicoPreselecionado, servicoUrl])

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

  // Máscara brasileira para telefone/whatsapp: +55 (11) 99999-9999 ou +55 (11) 9999-9999
  const formatPhoneBR = (value: string) => {
    // Manter apenas dígitos
    let digits = value.replace(/\D/g, '')

    // Se começar com 55 e tiver mais de 2 dígitos, preserva
    if (digits.startsWith('55') && digits.length > 2) {
      digits = digits.slice(2)
    }

    // Limita a 11 dígitos (DDD + 9 dígitos)
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
      newErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail corporativo é obrigatório'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Formato de e-mail inválido'
    }

    const digitsOnly = formData.telefone.replace(/\D/g, '')
    // Deve ter pelo menos 10 dígitos (DDD + 8 ou 9 dígitos) além do 55
    const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone / WhatsApp é obrigatório'
    } else if (cleanDigits.length < 10) {
      newErrors.telefone = 'Informe um telefone válido com DDD'
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'Nome da empresa é obrigatório'
    }

    const cleanCnpj = limparCNPJ(formData.cnpj)
    if (!cleanCnpj) {
      newErrors.cnpj = 'Informe um CNPJ válido'
    } else if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) {
      newErrors.cnpj = 'CNPJ inválido — verifique os 14 dígitos'
    }

    if (!formData.segmento) {
      newErrors.segmento = 'Selecione o segmento da empresa'
    }

    if (!formData.funcionarios) {
      newErrors.funcionarios = 'Selecione o número de funcionários'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const fonteFinal = servicoInteresse
        ? `Serviço: ${servicoInteresse}`
        : tipoSolicitacao === 'proposta'
          ? 'Formulário da Home (Proposta)'
          : tipoSolicitacao === 'agendamento'
            ? 'Agendamento'
            : 'Formulário do Site'

      const mensagemComOrigem = servicoInteresse
        ? `${formData.mensagem.trim() ? `${formData.mensagem.trim()}\n\n` : ''}[Origem: Serviço - ${servicoInteresse}]`
        : formData.mensagem.trim() || undefined

      await createLead({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        empresa: formData.empresa.trim(),
        cnpj: formData.cnpj.trim(),
        segmento: formData.segmento,
        funcionarios: formData.funcionarios,
        mensagem: mensagemComOrigem,
        tipo_solicitacao: tipoSolicitacao,
        fonte: fonteFinal,
      })

      // Limpar formulário
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
      console.error('Erro ao enviar lead:', err)
      setServerError(
        'Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className={`bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.2)] text-slate-800 ${className}`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-2xl text-slate-900 tracking-tight">
              {titulo || 'Receba uma Proposta Personalizada'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {subtitulo || 'Preencha seus dados e fale com um especialista'}
            </p>
          </div>
          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              aria-label="Voltar para a página anterior"
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] border border-[#07132B]/10 shadow-sm transition-all duration-150 hover:-translate-y-0.5 btn-press cursor-pointer"
            >
              Voltar
            </button>
          )}
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nome Completo */}
          <div>
            <label
              htmlFor="nome"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nome Completo *
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
              placeholder="voce@empresa.com.br"
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
              placeholder="Sua empresa"
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

          {/* CNPJ */}
          <div>
            <label
              htmlFor="cnpj"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              CNPJ *
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

          {/* Serviço de Interesse */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="servico_interesse"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Serviço de Interesse
              </label>
              {servicoInteresse && (
                <span className="text-[11px] font-bold text-[#145A32] bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/50">
                  Pré-selecionado
                </span>
              )}
            </div>
            <select
              id="servico_interesse"
              name="servico_interesse"
              value={servicoInteresse}
              onChange={(e) => setServicoInteresse(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring"
            >
              <option value="">Selecione o serviço desejado (opcional)...</option>
              {OPCOES_SERVICOS_CONTATO.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
              {servicoInteresse && !OPCOES_SERVICOS_CONTATO.includes(servicoInteresse) && (
                <option value={servicoInteresse}>{servicoInteresse}</option>
              )}
            </select>
          </div>

          {/* Duas colunas para selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Segmento */}
            <div>
              <label
                htmlFor="segmento"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Segmento *
              </label>
              <select
                id="segmento"
                name="segmento"
                value={formData.segmento}
                onChange={handleChange}
                className={`w-full px-3 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                  errors.segmento
                    ? 'border-[#E74C3C] bg-red-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
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
              {errors.segmento && (
                <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.segmento}</p>
              )}
            </div>

            {/* Número de Funcionários */}
            <div>
              <label
                htmlFor="funcionarios"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Funcionários *
              </label>
              <select
                id="funcionarios"
                name="funcionarios"
                value={formData.funcionarios}
                onChange={handleChange}
                className={`w-full px-3 py-3 rounded-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring ${
                  errors.funcionarios
                    ? 'border-[#E74C3C] bg-red-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="">Selecione...</option>
                <option value="1–5">1–5</option>
                <option value="6–20">6–20</option>
                <option value="21–50">21–50</option>
                <option value="51–200">51–200</option>
                <option value="Mais de 200">Mais de 200</option>
              </select>
              {errors.funcionarios && (
                <p className="mt-1 text-xs text-[#E74C3C] font-medium">{errors.funcionarios}</p>
              )}
            </div>
          </div>

          {/* Mensagem (opcional) */}
          <div>
            <label
              htmlFor="mensagem"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mensagem (opcional)
            </label>
            <textarea
              id="mensagem"
              name="mensagem"
              rows={3}
              value={formData.mensagem}
              onChange={handleChange}
              placeholder="Conte-nos sobre a sua necessidade (opcional)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-900 bg-slate-50/50 transition-colors input-focus-ring resize-none"
            />
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_6px_20px_rgba(46,204,113,0.35)] hover:shadow-[0_8px_25px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A1A13]" />
                  <span>Enviando solicitação...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar Solicitação</span>
                </>
              )}
            </button>
          </div>

          {/* Política de Privacidade aviso */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Ao enviar, você concorda com a nossa{' '}
            <Link
              to="/politica-de-privacidade"
              className="text-[#145A32] underline hover:text-[#2ECC71] font-medium"
            >
              Política de Privacidade
            </Link>
            .
          </p>

          {/* Botão Voltar secundário no rodapé do formulário */}
          {onVoltar && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onVoltar}
                aria-label="Voltar para a página anterior"
                className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-1 underline-offset-4 transition-colors cursor-pointer py-1"
              >
                Voltar
              </button>
            </div>
          )}
        </form>
      </div>

      {/* DIÁLOGO DE SUCESSO */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-[#2ECC71]">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-2xl text-slate-900 text-center">
              {sucessoTitulo || 'Solicitação recebida!'}
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2 text-center">
              {sucessoMensagem ||
                'Nossa equipe entrará em contato em até 24 horas úteis com uma proposta personalizada para sua empresa.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="px-8 py-2.5 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-[#0A1A13] font-semibold"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
