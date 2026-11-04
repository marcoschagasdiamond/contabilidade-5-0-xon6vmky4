import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import {
  calcularDiffDadosEmpresa,
  registrarAuditoriaDadosEmpresa,
  listarAuditoriaDadosEmpresa,
} from '@/services/historicoDadosEmpresa'
import { AbaHistoricoCadastral } from '@/components/crm/AbaHistoricoCadastral'
import type { HistoricoDadosEmpresaRegistro } from '@/types/historicoDadosEmpresa'
import { DadosEmpresaPerfil, DADOS_EMPRESA_PADRAO } from '@/types/dadosEmpresa'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import {
  SegmentoEmpresa,
  CIDADES_ISS_MAPA,
  obterAliquotaISS,
  obterAliquotaIcmsUf,
} from '@/lib/regimes'
import { CATEGORIAS_MONOFASICOS_OPCOES } from '@/types/dadosEmpresa'
import { Switch } from '@/components/ui/switch'
import { formatarCNPJ, limparCNPJ, validarCNPJ } from '@/lib/cnpj'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calculator,
  Scale,
  Coins,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  Users,
  ShieldCheck,
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
  Info,
  LogIn,
  UserPlus,
  Cloud,
  Lock,
} from 'lucide-react'

// Formatador de telefone brasileiro padrão (+55 XX XXXXX-XXXX)
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

export default function DadosEmpresa() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const {
    dadosEmpresa,
    temDadosSalvos,
    salvoNoBanco,
    isSalvando,
    salvar,
    restaurarPadrao,
    empresaVinculadaId,
  } = useDadosEmpresa()

  const [historicoAuditoria, setHistoricoAuditoria] = useState<HistoricoDadosEmpresaRegistro[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Estado local do formulário
  const CHAVE_RASCUNHO = 'contabilidade50_rascunho_dados_empresa'
  const [formData, setFormData] = useState<DadosEmpresaPerfil>(() => {
    // Restaura rascunho salvo caso os campos principais estejam vazios
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem(CHAVE_RASCUNHO)
        if (salvo) {
          const rascunho = JSON.parse(salvo)
          return { ...dadosEmpresa, ...rascunho }
        }
      } catch (err) {
        console.warn('Erro ao restaurar rascunho de dados da empresa:', err)
      }
    }
    return dadosEmpresa
  })

  const [searchParams] = useSearchParams()
  const destinoParam = searchParams.get('destino') || ''
  const destinoFinal =
    destinoParam === '/calculadora-ibs-cbs' || destinoParam === '/diagnostico' ? destinoParam : ''

  // URL atual completa com query parameters para retorno pós-login
  const currentPathWithSearch = `${location.pathname}${location.search}`

  const [salvoComSucesso, setSalvoComSucesso] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sincroniza quando os dados do contexto mudarem (ex: troca de cliente ativo ou carregamento do banco)
  useEffect(() => {
    setFormData(dadosEmpresa)
  }, [dadosEmpresa])

  // Auto-save com debounce de 600ms no localStorage dedicado
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(formData))
      } catch (err) {
        console.warn('Erro ao salvar rascunho no localStorage:', err)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [formData])

  // Handlers monetários
  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFormData((prev) => ({ ...prev, faturamentoMensal: valor }))
  }

  const handleFolhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFormData((prev) => ({ ...prev, folhaPagamentoMensal: valor }))
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: formatted }))
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: '' }))
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value)
    setFormData((prev) => ({ ...prev, telefone: formatted }))
    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: '' }))
    }
  }

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}

    // Nome Completo *
    if (!formData.nomeContato?.trim()) {
      novosErros.nomeContato = 'Nome é obrigatório (mínimo 3 caracteres)'
    } else if (formData.nomeContato.trim().length < 3) {
      novosErros.nomeContato = 'Informe seu nome completo'
    }

    // Nome da Empresa *
    if (!formData.nomeEmpresa?.trim()) {
      novosErros.nomeEmpresa = 'Nome da empresa é obrigatório'
    }

    // CNPJ da Empresa * (com validação real de dígitos)
    const cnpjLimpo = limparCNPJ(formData.cnpj || '')
    if (!formData.cnpj?.trim()) {
      novosErros.cnpj = 'Informe um CNPJ válido com 14 dígitos'
    } else if (cnpjLimpo.length !== 14 || !validarCNPJ(formData.cnpj)) {
      novosErros.cnpj = 'Informe um CNPJ válido com 14 dígitos'
    }

    // E-mail corporativo *
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email?.trim()) {
      novosErros.email = 'E-mail corporativo é obrigatório'
    } else if (!emailRegex.test(formData.email.trim())) {
      novosErros.email = 'Informe um e-mail válido (ex: seu.nome@empresa.com.br)'
    }

    // Telefone / WhatsApp *
    const digitsOnly = (formData.telefone || '').replace(/\D/g, '')
    const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
    if (!formData.telefone?.trim()) {
      novosErros.telefone = 'Telefone/WhatsApp é obrigatório'
    } else if (cleanDigits.length < 10) {
      novosErros.telefone = 'Informe um telefone válido com DDD (mínimo 10 dígitos)'
    }

    // Segmento *
    if (!formData.segmento) {
      novosErros.segmento = 'Selecione o segmento principal de atuação'
    }

    // UF de Origem *
    if (!formData.ufOrigem) {
      novosErros.ufOrigem = 'UF de origem é obrigatória'
    }

    // Cidade / ISS *
    if (!formData.cidade) {
      novosErros.cidade = 'Cidade para alíquota de ISS é obrigatória'
    }

    // Validação Fase 1: Perfil de Insumos deve somar exatamente 100%
    const cheia = Number(formData.perfilInsumosAliquotaCheia ?? 0)
    const mono = Number(formData.perfilInsumosMonofasicos ?? 0)
    const reduz = Number(formData.perfilInsumosAliquotaReduzida ?? 0)
    const somaPerfil = Math.round((cheia + mono + reduz) * 100) / 100

    if (somaPerfil !== 100) {
      novosErros.perfilInsumos = `A soma do perfil de insumos deve ser exatamente 100% (atual: ${somaPerfil}%). Ajuste as proporções.`
    }

    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) {
      // Scroll até o primeiro erro se houver
      const formTop = document.querySelector('form')
      if (formTop) {
        formTop.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    const alteracoes = calcularDiffDadosEmpresa(dadosEmpresa, formData)

    salvar(formData)
      .then(async (salvo) => {
        setSalvoComSucesso(true)

        // Se houve alterações reais, registra auditoria imutável
        if (alteracoes.length > 0) {
          try {
            await registrarAuditoriaDadosEmpresa({
              empresaId: empresaVinculadaId,
              userId: user?.id,
              origemAjuste: 'pagina_dados_empresa',
              nomeEmpresa: salvo.nomeEmpresa,
              cnpj: salvo.cnpj,
              alteracoes,
              snapshotAnterior: dadosEmpresa,
              snapshotNovo: salvo,
              descricao: `Ajuste cadastral realizado em Dados da Empresa (${alteracoes.length} campo(s) alterado(s))`,
            })
            // Recarrega rastro
            listarAuditoriaDadosEmpresa({
              empresaId: empresaVinculadaId || undefined,
              userId: user?.id || undefined,
            }).then((h) => setHistoricoAuditoria(h))
          } catch (e) {
            console.warn('Erro ao gravar auditoria na página Dados da Empresa:', e)
          }
        }
        // Se usuário veio do onboarding ou está no fluxo de onboarding, marca passo 1 como concluído
        if (user?.id) {
          import('@/services/onboarding').then(({ salvarProgressoOnboarding }) => {
            salvarProgressoOnboarding(user.id, { passo_empresa_concluido: true }).catch((e) =>
              console.warn('[Onboarding] Erro ao marcar passo empresa:', e),
            )
          })
        }
        try {
          localStorage.removeItem(CHAVE_RASCUNHO)
        } catch {
          /* ignore */
        }
        if (destinoFinal) {
          setTimeout(() => {
            navigate(destinoFinal)
          }, 1200)
        } else {
          setTimeout(() => setSalvoComSucesso(false), 4000)
        }
      })
      .catch((err) => {
        console.error('Erro ao salvar dados da empresa:', err)
        setSalvoComSucesso(true)
        try {
          localStorage.removeItem(CHAVE_RASCUNHO)
        } catch {
          /* ignore */
        }
        if (destinoFinal) {
          setTimeout(() => {
            navigate(destinoFinal)
          }, 1500)
        }
      })
  }

  const handleRestaurar = () => {
    if (window.confirm('Deseja restaurar os valores padrão sugeridos pela Contabilidade 5.0?')) {
      restaurarPadrao()
      try {
        localStorage.removeItem(CHAVE_RASCUNHO)
      } catch {
        /* ignore */
      }
      setFormData(DADOS_EMPRESA_PADRAO)
      setSalvoComSucesso(true)
      setTimeout(() => setSalvoComSucesso(false), 3000)
    }
  }

  // Cálculos rápidos informativos
  const faturamentoAnual = formData.faturamentoMensal * 12
  const folhaAnual = formData.folhaPagamentoMensal * 12
  const fatorR =
    formData.faturamentoMensal > 0
      ? (formData.folhaPagamentoMensal / formData.faturamentoMensal) * 100
      : 0
  const aliqIcmsUf = obterAliquotaIcmsUf(formData.ufOrigem)
  const infoCidade = obterAliquotaISS(formData.cidade)

  // ESTADO DE CARREGAMENTO DE AUTENTICAÇÃO
  if (authLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <DiamondHeader
          badge="DIAMOND GROUP • CADASTRO OPERACIONAL ÚNICO"
          titulo="Dados da Empresa"
          subtitulo="Preencha uma única vez os dados operacionais e parâmetros fiscais da sua empresa. Eles alimentam instantaneamente o Diagnóstico Tributário, a Calculadora Simples, o Comparativo de Regimes, o Simulador de Créditos e a Transição 2026–2033."
          mostrarVoltar={true}
          mostrarDiagnosticoBtn={true}
        />
        <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="w-10 h-10 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Verificando credenciais de acesso...</span>
          </div>
        </div>
      </div>
    )
  }

  // REQUISITO: Se NÃO autenticado, exibir tela de acesso (sem o formulário) convidando a entrar ou criar conta
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen">
        {/* HEADER DIAMOND GROUP */}
        <DiamondHeader
          badge="DIAMOND GROUP • ÁREA DO CLIENTE"
          titulo="Dados da Empresa"
          subtitulo="Acesse sua conta para cadastrar e gerenciar o perfil operacional e fiscal da sua empresa com sincronização direta em nuvem."
          mostrarVoltar={true}
          mostrarDiagnosticoBtn={false}
        />

        {/* AVISO DO GATE SE O USUÁRIO VEIO REDIRECIONADO DA CALCULADORA OU DIAGNÓSTICO */}
        {destinoFinal && (
          <div className="bg-gradient-to-r from-[#07132B] via-[#0D2A1C] to-[#07132B] text-white border-b border-[#D4AF37]/40 py-3.5 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping shrink-0" />
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  <strong className="text-[#D4AF37]">Etapa Inicial Obrigatória:</strong> Para
                  acessar o{' '}
                  <strong>
                    {destinoFinal === '/calculadora-ibs-cbs'
                      ? 'Calculadora IBS/CBS'
                      : 'Diagnóstico Tributário'}
                  </strong>
                  , faça login ou crie sua conta para preencher os dados da sua empresa.
                </span>
              </div>
              <span className="text-[11px] text-slate-400 bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Retorno automático garantido após login
              </span>
            </div>
          </div>
        )}

        {/* CONTAINER DA TELA DE ACESSO DIAMOND GROUP */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl overflow-hidden">
            {/* Header com estilo Diamond escuro */}
            <div className="bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] p-8 sm:p-10 text-white relative overflow-hidden border-b border-[#D4AF37]/30">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 mb-4 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Acesso Restrito • Área do Cliente
                </div>

                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  Acesse sua conta para preencher os dados da sua empresa
                </h2>

                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  Seus dados ficam 100% salvos com segurança na nuvem, vinculados à sua conta e
                  disponíveis em qualquer dispositivo — prontos para alimentar a Calculadora
                  IBS/CBS, o Diagnóstico Tributário e o acompanhamento do seu time contábil.
                </p>
              </div>
            </div>

            {/* Conteúdo: Benefícios e Botões de Ação */}
            <div className="p-8 sm:p-10 space-y-8 bg-slate-50/40">
              {/* Grid de 3 benefícios chave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#145A32] flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Armazenamento em Nuvem
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Nunca perca seus cálculos ao trocar de navegador ou fechar a aba.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#07132B]/5 text-[#07132B] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Multi-Módulos Integrados
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Alimenta simultaneamente Diagnóstico, Calculadora e Créditos.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#07132B] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#145A32]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Time Contábil Diamond
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Parâmetros revisados por nossos tributaristas credenciados.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Principais */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Escolha como deseja prosseguir
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    Entre com seu e-mail corporativo ou crie uma conta gratuita em 30 segundos
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <Link
                    to={`/login?redirect=${encodeURIComponent(currentPathWithSearch)}`}
                    className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-heading font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-slate-600" />
                    <span>Entrar</span>
                  </Link>

                  <Link
                    to={`/cadastro?redirect=${encodeURIComponent(currentPathWithSearch)}`}
                    className="flex-1 sm:flex-initial px-7 py-3.5 rounded-xl font-heading font-bold text-sm text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] transition-all duration-200 hover:-translate-y-0.5 btn-press text-center flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#0A1A13]" />
                    <span>Criar conta</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>

              {/* Nota sobre dados já preenchidos no navegador */}
              {temDadosSalvos && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-[#145A32]">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
                  <span>
                    <strong>Identificamos dados já salvos neste navegador!</strong> Ao fazer login
                    ou criar sua conta, essas informações serão sincronizadas automaticamente com o
                    seu perfil na nuvem.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER CTA DIAMOND */}
        <DiamondFooterCTA
          titulo="Dúvidas sobre o cadastro da sua empresa?"
          subtitulo="Nosso time de consultores está pronto para auxiliar você no mapeamento fiscal preliminar e no uso da plataforma."
        />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER DIAMOND GROUP */}
      <DiamondHeader
        badge="DIAMOND GROUP • CADASTRO OPERACIONAL ÚNICO"
        titulo="Dados da Empresa"
        subtitulo="Preencha uma única vez os dados operacionais e parâmetros fiscais da sua empresa. Eles alimentam instantaneamente o Diagnóstico Tributário, a Calculadora Simples, o Comparativo de Regimes, o Simulador de Créditos e a Transição 2026–2033."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* AVISO DO GATE SE O USUÁRIO VEIO REDIRECIONADO */}
      {destinoFinal && !temDadosSalvos && (
        <div className="bg-gradient-to-r from-[#07132B] via-[#0D2A1C] to-[#07132B] text-white border-b border-[#D4AF37]/40 py-3.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping shrink-0" />
              <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                <strong className="text-[#D4AF37]">Etapa Inicial Obrigatória:</strong> Para acessar
                o{' '}
                <strong>
                  {destinoFinal === '/calculadora-ibs-cbs'
                    ? 'Calculadora IBS/CBS'
                    : 'Diagnóstico Tributário'}
                </strong>
                , preencha os dados da sua empresa abaixo uma única vez. Eles alimentam
                automaticamente a calculadora e o diagnóstico!
              </span>
            </div>
            <span className="text-[11px] text-slate-400 bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
              Redirecionamento automático após salvar
            </span>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
            <span className="font-bold text-slate-200">Perfil Global:</span>
            <span className="text-[#D4AF37] font-semibold flex items-center gap-1.5">
              {salvoNoBanco && <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />}
              {salvoNoBanco
                ? 'Salvo na sua conta (nuvem) e sincronizado com os 5 módulos'
                : temDadosSalvos
                  ? 'Salvo no navegador (faça login ou cadastre-se para sincronizar na nuvem)'
                  : 'Utilizando parâmetros padrão da plataforma'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>
              Faturamento Anual:{' '}
              <strong className="text-white font-mono">{formatarMoeda(faturamentoAnual)}</strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Fator R Estimado:{' '}
              <strong
                className={`font-mono ${fatorR >= 28 ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                {fatorR.toFixed(1)}% ({fatorR >= 28 ? 'Anexo III' : 'Anexo V'})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO FLUTUANTE / FIXO */}
      {salvoComSucesso && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <div>
                <strong className="block text-sm font-bold">
                  Dados da Empresa salvos com sucesso!
                </strong>
                <span className="text-xs text-emerald-100">
                  {destinoFinal
                    ? `Redirecionando você para ${
                        destinoFinal === '/calculadora-ibs-cbs'
                          ? 'a Calculadora IBS/CBS'
                          : 'o Diagnóstico Tributário'
                      }...`
                    : 'Diagnóstico Tributário, Calculadora Simples, Comparativo de Regimes, Créditos e Transição já foram atualizados com seus valores.'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(destinoFinal || '/calculadora-ibs-cbs')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 border-white shrink-0 font-bold"
            >
              {destinoFinal === '/diagnostico' ? 'Ir para Diagnóstico' : 'Ir para Calculadora'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8 scroll-mt-28">
          {/* BANNER EXPLICATIVO / HUB DE MÓDULOS ALIMENTADOS */}
          <div className="bg-gradient-to-r from-[#07132B] via-[#0D1D3A] to-[#07132B] rounded-2xl p-6 sm:p-8 text-white border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Alimentação Automática Multi-Módulos
                </div>
                {formData.atualizadoEm && (
                  <span className="text-xs text-slate-400">
                    Última sincronização: {new Date(formData.atualizadoEm).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  Um único formulário. Cinco motores alimentados.
                </h2>
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                  Evite digitar os mesmos dados repetidas vezes. Ao salvar o perfil abaixo, todos os
                  módulos a seguir iniciarão automaticamente com os dados da sua empresa:
                </p>
              </div>

              {/* Badges dos 5 módulos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {[
                  {
                    titulo: 'Diagnóstico Tributário',
                    rota: '/diagnostico',
                    icon: FileSpreadsheet,
                    desc: 'Wizard & Relatório PDF',
                  },
                  {
                    titulo: 'Calculadora Simples',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calculator,
                    desc: 'Operação Unitária',
                  },
                  {
                    titulo: 'Comparativo de Regimes',
                    rota: '/calculadora-ibs-cbs',
                    icon: Scale,
                    desc: 'Matriz 4 Cenários',
                  },
                  {
                    titulo: 'Simulador de Créditos',
                    rota: '/calculadora-ibs-cbs',
                    icon: Coins,
                    desc: 'Não-Cumulatividade 26,5%',
                  },
                  {
                    titulo: 'Transição 2026–2033',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calendar,
                    desc: 'Cronograma 8 Anos',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={idx}
                      className="bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-white truncate">{item.titulo}</span>
                      </div>
                      <span className="text-[11px] text-slate-300">{item.desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLOCO 1: DADOS OPERACIONAIS DA EMPRESA (ESPELHO DO PASSO 1 DO DIAGNÓSTICO) */}
          {/* ========================================================================= */}
          <Card className="border border-slate-200/90 shadow-md overflow-hidden bg-white rounded-2xl">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
                  Passo 1 • Diagnóstico Tributário & Módulos
                </span>
                <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                  1. Dados operacionais da empresa
                </h3>
                <p className="text-xs text-slate-500">
                  Identificação do titular, empresa, CNPJ, localização, 10 segmentos de atuação e
                  perfil operacional.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Faturamento: {formatarMoeda(formData.faturamentoMensal)}/mês
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* SUB-BLOCO A: IDENTIFICAÇÃO (Passo 1 Diagnóstico) */}
              <div className="space-y-5">
                {/* Nome Completo */}
                <div>
                  <Label
                    htmlFor="nomeContato"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Seu Nome Completo *
                  </Label>
                  <Input
                    id="nomeContato"
                    type="text"
                    value={formData.nomeContato || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, nomeContato: e.target.value }))
                      if (errors.nomeContato) setErrors((prev) => ({ ...prev, nomeContato: '' }))
                    }}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className={`h-12 bg-white font-medium ${
                      errors.nomeContato ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.nomeContato ? (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.nomeContato}</p>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Responsável pelo cadastro e titular das simulações tributárias.
                    </span>
                  )}
                </div>

                {/* Razão Social / Nome da Empresa e CNPJ da Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="nomeEmpresa"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Nome da Empresa *
                    </Label>
                    <Input
                      id="nomeEmpresa"
                      type="text"
                      value={formData.nomeEmpresa || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, nomeEmpresa: e.target.value }))
                        if (errors.nomeEmpresa) setErrors((prev) => ({ ...prev, nomeEmpresa: '' }))
                      }}
                      placeholder="Ex: Inova Tecnologia & Consultoria Ltda"
                      className={`h-12 bg-white font-medium ${
                        errors.nomeEmpresa ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.nomeEmpresa ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.nomeEmpresa}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Razão social ou nome fantasia utilizado em todos os módulos e relatórios.
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="cnpjEmpresa"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        CNPJ da Empresa *
                      </Label>
                      <span className="text-[11px] text-slate-400">14 dígitos</span>
                    </div>
                    <Input
                      id="cnpjEmpresa"
                      type="text"
                      value={formData.cnpj || ''}
                      onChange={handleCnpjChange}
                      maxLength={18}
                      placeholder="00.000.000/0000-00"
                      className={`h-12 bg-white font-mono font-medium ${
                        errors.cnpj ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.cnpj ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.cnpj}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Aceita com ou sem máscara (ex: 00.000.000/0000-00). Validação de dígitos
                        verificadores ativa.
                      </p>
                    )}
                  </div>
                </div>

                {/* E-mail Corporativo e Telefone / WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="emailCorporativo"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      E-mail Corporativo *
                    </Label>
                    <Input
                      id="emailCorporativo"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                      }}
                      placeholder="carlos@empresa.com.br"
                      className={`h-12 bg-white font-medium ${
                        errors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.email ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Destino para envio do relatório detalhado do Diagnóstico em PDF.
                      </span>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="telefoneWhatsapp"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Telefone / WhatsApp *
                    </Label>
                    <Input
                      id="telefoneWhatsapp"
                      type="tel"
                      value={formData.telefone || ''}
                      onChange={handlePhoneChange}
                      placeholder="+55 (11) 99999-9999"
                      className={`h-12 bg-white font-medium ${
                        errors.telefone ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.telefone ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.telefone}</p>
                    ) : (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Com DDD e máscara automática (+55).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SUB-BLOCO B: LOCALIZAÇÃO (UF de Origem & Cidade ISS com box explicativo) */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seletor UF de Origem */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="ufOrigem"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        UF de Origem (ICMS Estadual) *
                      </Label>
                      <span className="text-[11px] font-bold text-[#145A32] bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/60">
                        ICMS: {aliqIcmsUf.toFixed(1)}%
                      </span>
                    </div>
                    <Select
                      value={formData.ufOrigem || undefined}
                      onValueChange={(val) => {
                        // Se a cidade selecionada não pertencer à nova UF, limpa o campo de cidade
                        setFormData((prev) => {
                          const cidadeAtual = CIDADES_ISS_MAPA.find((cid) => cid.id === prev.cidade)
                          const cidadeValida =
                            cidadeAtual && (cidadeAtual.uf === val || cidadeAtual.id === 'outra')
                          return {
                            ...prev,
                            ufOrigem: val,
                            cidade: cidadeValida ? prev.cidade : '',
                          }
                        })
                        if (errors.ufOrigem) setErrors((prev) => ({ ...prev, ufOrigem: '' }))
                      }}
                    >
                      <SelectTrigger
                        id="ufOrigem"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {LISTA_UFS_ICMS.map((ufItem) => (
                          <SelectItem key={ufItem.uf} value={ufItem.uf}>
                            {ufItem.uf} — {ufItem.nome} ({ufItem.aliquotaInternaPadrao.toFixed(1)}%
                            ICMS)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Define a alíquota interna padrão de ICMS estadual sobre comércio e indústria.
                    </p>
                  </div>

                  {/* Seletor Cidade/ISS */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="cidadeIss"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Cidade / UF (Alíquota de ISS) *
                      </Label>
                      <span className="text-[11px] font-bold text-[#145A32] bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/60">
                        ISS: {infoCidade.aliquota.toFixed(1)}%
                      </span>
                    </div>
                    <Select
                      value={formData.cidade || undefined}
                      onValueChange={(val) => {
                        setFormData((prev) => ({ ...prev, cidade: val }))
                        if (errors.cidade) setErrors((prev) => ({ ...prev, cidade: '' }))
                      }}
                    >
                      <SelectTrigger
                        id="cidadeIss"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {CIDADES_ISS_MAPA.filter(
                          (cid) => cid.uf === formData.ufOrigem || cid.id === 'outra',
                        ).map((cid) => (
                          <SelectItem key={cid.id} value={cid.id}>
                            {cid.descricao || `${cid.nome}/${cid.uf} (${cid.aliquota.toFixed(1)}%)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Define o ISS municipal aplicado aos cálculos de serviços e transporte.
                    </p>
                  </div>
                </div>

                {/* Box explicativo UF & ICMS */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Impacto no cálculo:</strong> A UF de origem determina o ICMS no sistema
                    atual (Lucro Presumido e Real) e serve de base para calibrar a substituição
                    gradual pelo IBS durante a transição 2029–2032.
                  </p>
                </div>
              </div>

              {/* SUB-BLOCO C: SEGMENTO PRINCIPAL DE ATIVIDADE (Grade com 10 opções exatas) */}
              <div className="pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Segmento Principal de Atividade *
                  </Label>
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
                        onClick={() => {
                          // Sincroniza também tipoAtividade aproximado para a calculadora caso não seja misto
                          let autoTipo = formData.tipoAtividade
                          if (!formData.atividadeMista) {
                            if (item.id === 'Comércio') autoTipo = 'comercio'
                            else if (item.id === 'Indústria') autoTipo = 'industria'
                            else autoTipo = 'servico'
                          }
                          setFormData((prev) => ({
                            ...prev,
                            segmento: item.id,
                            tipoAtividade: autoTipo,
                          }))
                          if (errors.segmento) setErrors((prev) => ({ ...prev, segmento: '' }))
                        }}
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
                {errors.segmento && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.segmento}</p>
                )}
              </div>

              {/* SUB-BLOCO D: PERFIL OPERACIONAL DA EMPRESA (Passo 1 Diagnóstico) */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Perfil Operacional da Empresa
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Regime Atual */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="regimeAtual"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Regime Tributário Atual
                      </Label>
                      <span className="text-[11px] text-slate-400">Como tributa hoje</span>
                    </div>
                    <Select
                      value={formData.regimeAtual || undefined}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, regimeAtual: val }))
                      }
                    >
                      <SelectTrigger
                        id="regimeAtual"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione o regime atual" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                        <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                        <SelectItem value="MEI (Microempreendedor)">
                          MEI (Microempreendedor)
                        </SelectItem>
                        <SelectItem value="Nova empresa / Ainda não optante">
                          Nova empresa / Ainda não optante
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Serve para compararmos o regime atual com a oportunidade identificada.
                    </p>
                  </div>

                  {/* Quantidade de funcionários */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label
                        htmlFor="funcionarios"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Quadro de Colaboradores
                      </Label>
                      <span className="text-[11px] text-slate-400">Equipe</span>
                    </div>
                    <Select
                      value={formData.funcionarios || undefined}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, funcionarios: val }))
                      }
                    >
                      <SelectTrigger
                        id="funcionarios"
                        className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                      >
                        <SelectValue placeholder="Selecione o porte da equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apenas sócios (sem funcionários)">
                          Apenas sócios (sem funcionários CLT)
                        </SelectItem>
                        <SelectItem value="1 a 5 funcionários">1 a 5 funcionários</SelectItem>
                        <SelectItem value="6 a 15 funcionários">6 a 15 funcionários</SelectItem>
                        <SelectItem value="16 a 50 funcionários">16 a 50 funcionários</SelectItem>
                        <SelectItem value="Mais de 50 funcionários">
                          Mais de 50 funcionários
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Influencia o peso da CPP (contribuição patronal previdenciária de 20%).
                    </p>
                  </div>
                </div>
              </div>

              {/* SUB-BLOCO E: PARÂMETROS OPERACIONAIS FINANCEIROS */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#07132B]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Parâmetros Econômicos Operacionais (Faturamento e Folha)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Alimenta o Passo 2 do Diagnóstico e Módulos da Calculadora
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Faturamento Mensal */}
                  <div className="space-y-2">
                    <Label htmlFor="fatMensal" className="text-sm font-bold text-[#07132B]">
                      Faturamento Mensal (R$) *
                    </Label>
                    <Input
                      id="fatMensal"
                      type="text"
                      value={formData.faturamentoMensal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      onChange={handleFaturamentoChange}
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      Receita bruta mensal. RBT12 calculada:{' '}
                      <strong>{formatarMoeda(faturamentoAnual)}</strong>.
                    </span>
                  </div>

                  {/* Folha de Pagamento Mensal */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="folhaMensal"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                      >
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        Folha Mensal (com Pró-labore) *
                      </Label>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          fatorR >= 28
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        R = {fatorR.toFixed(1)}%
                      </span>
                    </div>
                    <Input
                      id="folhaMensal"
                      type="text"
                      value={formData.folhaPagamentoMensal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      onChange={handleFolhaChange}
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      Folha 12m: <strong>{formatarMoeda(folhaAnual)}</strong>. Se ≥ 28%, garante
                      Anexo III.
                    </span>
                  </div>
                </div>
              </div>

              {/* SUB-BLOCO F: PARÂMETROS FISCAIS & INSUMOS (FASE 1 - FONTE MESTRA) */}
              <div className="pt-6 border-t-2 border-slate-200/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                      <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-[#07132B]">
                        Parâmetros Fiscais & Insumos • Fase 1 (Fonte Mestra)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Dados corporativos unificados. Propagam para Calculadora IBS/CBS, Recuperador
                      de Créditos e Diagnóstico 360° sem recadastro.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-[#07132B] text-[#D4AF37] px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                    FONTE MESTRA C5.0
                  </span>
                </div>

                {/* 1. PERFIL DE INSUMOS (SOMA 100%) */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label className="text-sm font-bold text-[#07132B] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        1. Perfil de Insumos da Operação (%)
                      </Label>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Distribuição das aquisições de insumos. A soma das 3 alíquotas deve ser
                        exatamente 100%.
                      </span>
                    </div>
                    {(() => {
                      const soma =
                        Number(formData.perfilInsumosAliquotaCheia ?? 0) +
                        Number(formData.perfilInsumosMonofasicos ?? 0) +
                        Number(formData.perfilInsumosAliquotaReduzida ?? 0)
                      const ok = Math.round(soma * 100) / 100 === 100
                      return (
                        <div
                          className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                            ok
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          Soma: {soma.toFixed(1)}% {ok ? '✓ Válida' : '⚠ Deve somar 100%'}
                        </div>
                      )
                    })()}
                  </div>

                  {errors.perfilInsumos && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errors.perfilInsumos}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Alíquota Cheia */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilCheia" className="text-xs font-bold text-[#07132B]">
                          Alíquota Cheia (%)
                        </Label>
                        <span className="text-[11px] font-mono text-slate-500">Padrão</span>
                      </div>
                      <Input
                        id="perfilCheia"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosAliquotaCheia ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          setFormData((prev) => ({ ...prev, perfilInsumosAliquotaCheia: val }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Tributados integralmente
                      </span>
                    </div>

                    {/* Monofásicos */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilMono" className="text-xs font-bold text-[#07132B]">
                          Monofásicos (%)
                        </Label>
                        <span className="text-[11px] font-mono text-[#D4AF37] font-bold">
                          Fase 1
                        </span>
                      </div>
                      <Input
                        id="perfilMono"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosMonofasicos ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          setFormData((prev) => ({
                            ...prev,
                            perfilInsumosMonofasicos: val,
                            presencaMonofasicos: val > 0 ? true : prev.presencaMonofasicos,
                          }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Alíquota zero / concentrada
                      </span>
                    </div>

                    {/* Alíquota Reduzida */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="perfilReduz" className="text-xs font-bold text-[#07132B]">
                          Alíquota Reduzida (%)
                        </Label>
                        <span className="text-[11px] font-mono text-slate-500">Especial</span>
                      </div>
                      <Input
                        id="perfilReduz"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.perfilInsumosAliquotaReduzida ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          setFormData((prev) => ({ ...prev, perfilInsumosAliquotaReduzida: val }))
                          if (errors.perfilInsumos)
                            setErrors((prev) => ({ ...prev, perfilInsumos: '' }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-10 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Incentivados ou cesta básica
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PRESENÇA DE MONOFÁSICOS & CATEGORIAS */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-[#07132B] flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-[#D4AF37]" />
                        2. Presença de Insumos / Produtos Monofásicos
                      </Label>
                      <span className="text-xs text-slate-500 block">
                        A empresa comercializa ou adquire insumos submetidos à tributação
                        concentrada/monofásica?
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600">
                        {formData.presencaMonofasicos ? 'Sim' : 'Não'}
                      </span>
                      <Switch
                        checked={!!formData.presencaMonofasicos}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            presencaMonofasicos: checked,
                            categoriasMonofasicos: checked ? prev.categoriasMonofasicos : [],
                          }))
                        }
                      />
                    </div>
                  </div>

                  {formData.presencaMonofasicos && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <Label className="text-xs font-bold text-[#07132B]">
                        Categorias de produtos monofásicos aplicáveis:
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {CATEGORIAS_MONOFASICOS_OPCOES.map((cat) => {
                          const selecionado = (formData.categoriasMonofasicos || []).includes(
                            cat.id,
                          )
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const atuais = prev.categoriasMonofasicos || []
                                  const novo = selecionado
                                    ? atuais.filter((id) => id !== cat.id)
                                    : [...atuais, cat.id]
                                  return { ...prev, categoriasMonofasicos: novo }
                                })
                              }}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                                selecionado
                                  ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B] font-bold shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold border ${
                                  selecionado
                                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37]'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {selecionado ? '✓' : ''}
                              </span>
                              <span className="truncate">{cat.rotulo}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 & 4. INSUMOS ENERGÉTICOS E INTANGÍVEIS / ROYALTIES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3. Insumos energéticos */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#D4AF37]" />
                        <Label className="text-sm font-bold text-[#07132B]">
                          3. Insumos Energéticos
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        A operação utiliza intensivamente energia elétrica contratada em demanda,
                        vapor industrial ou combustíveis como insumo fabril?
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-600">
                        Presença de insumos energéticos:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">
                          {formData.insumosEnergeticos ? 'Sim' : 'Não'}
                        </span>
                        <Switch
                          checked={!!formData.insumosEnergeticos}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, insumosEnergeticos: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Intangíveis e royalties */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                        <Label className="text-sm font-bold text-[#07132B]">
                          4. Intangíveis & Royalties
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Aquisição, licenciamento ou remessas de software, cessão de direitos,
                        marcas, patentes, royalties ou direitos autorais?
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-600">
                        Presença de intangíveis/royalties:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">
                          {formData.intangiveisRoyalties ? 'Sim' : 'Não'}
                        </span>
                        <Switch
                          checked={!!formData.intangiveisRoyalties}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, intangiveisRoyalties: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. INVESTIMENTOS EM ATIVO IMOBILIZADO (ÚLTIMOS 5 ANOS) */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label
                        htmlFor="imobilizadoTotal"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                      >
                        <Hammer className="w-4 h-4 text-[#D4AF37]" />
                        5. Investimentos em Ativo Imobilizado (Últimos 5 Anos)
                      </Label>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Total investido em máquinas, equipamentos, frotas, edificações e
                        benfeitorias nos últimos 60 meses.
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                      Base CIAP / PIS / COFINS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="imobilizadoTotal"
                        className="text-xs font-bold text-slate-700"
                      >
                        Valor Total Acumulado (R$)
                      </Label>
                      <Input
                        id="imobilizadoTotal"
                        type="text"
                        value={(formData.imobilizadoUltimos5Anos ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          const valor = Number(raw) / 100
                          setFormData((prev) => ({ ...prev, imobilizadoUltimos5Anos: valor }))
                        }}
                        className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-xs"
                      />
                      <span className="text-[11px] text-slate-500 block">
                        Equivale a uma média de{' '}
                        <strong>
                          {formatarMoeda((formData.imobilizadoUltimos5Anos ?? 0) / 5)}/ano
                        </strong>{' '}
                        ou{' '}
                        <strong>
                          {formatarMoeda((formData.imobilizadoUltimos5Anos ?? 0) / 60)}/mês
                        </strong>
                        .
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        Detalhamento Opcional por Exercício (Últimos 5 Anos)
                      </Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[2021, 2022, 2023, 2024, 2025].map((ano) => {
                          const anoStr = String(ano)
                          const valorAno = formData.imobilizadoAnosDetalhe?.[anoStr] ?? ''
                          return (
                            <div key={ano} className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 block text-center">
                                {ano}
                              </span>
                              <Input
                                type="text"
                                placeholder="R$ 0"
                                value={
                                  valorAno !== '' && valorAno !== undefined
                                    ? Number(valorAno).toLocaleString('pt-BR')
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '')
                                  const num = Number(raw)
                                  setFormData((prev) => {
                                    const detalhe = { ...(prev.imobilizadoAnosDetalhe || {}) }
                                    if (num > 0) {
                                      detalhe[anoStr] = num
                                    } else {
                                      delete detalhe[anoStr]
                                    }
                                    const soma = Object.values(detalhe).reduce(
                                      (acc, v) => acc + v,
                                      0,
                                    )
                                    return {
                                      ...prev,
                                      imobilizadoAnosDetalhe: detalhe,
                                      // Se detalhou, atualiza o total acumulado automaticamente se a soma for maior
                                      imobilizadoUltimos5Anos:
                                        soma > 0 ? soma : prev.imobilizadoUltimos5Anos,
                                    }
                                  })
                                }}
                                className="text-[11px] font-mono text-center h-8 px-1 bg-slate-50 border-slate-200"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Preenchimento livre. Se preenchido, calcula automaticamente o total
                        acumulado.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOTÕES DE AÇÃO: SALVAR / RESTAURAR */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRestaurar}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões da Plataforma
              </Button>
              {temDadosSalvos && (
                <span className="text-xs text-slate-500 hidden md:inline">
                  (Seus dados personalizados estão gravados no navegador)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isSalvando}
                className="w-full sm:w-auto h-12 px-8 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-5 h-5 stroke-[2.5]" />
                <span>{isSalvando ? 'Salvando...' : 'Salvar Dados da Empresa'}</span>
              </Button>
            </div>
          </div>
        </form>

        {/* ACESSO DIRETO AOS MÓDULOS DEPOIS DE SALVAR */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-lg text-[#07132B]">
              Navegar diretamente para simulação com estes dados
            </h4>
            <span className="text-xs text-slate-500">
              Todos os campos estarão pré-preenchidos automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/diagnostico"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2ECC71] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#145A32] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] flex items-center justify-center shrink-0 transition-colors">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#145A32] transition-colors">
                    Diagnóstico Tributário Completo
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#145A32] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enquadramento entre Simples, Presumido e Real, relatório executivo e exportação em
                  PDF com sua folha, faturamento e créditos.
                </p>
              </div>
            </Link>

            <Link
              to="/calculadora-ibs-cbs"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 group-hover:bg-[#07132B] group-hover:text-[#D4AF37] flex items-center justify-center shrink-0 transition-colors">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#07132B] transition-colors">
                    Calculadora IBS / CBS Integrada
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#07132B] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse os 6 módulos interligados (alíquotas oficiais, apuração unitária, matriz
                  dos 4 regimes, simulador de 10 créditos e transição).
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Dúvidas sobre o preenchimento ou parametrização tributária?"
        subtitulo="Nossa equipe de analistas e tributaristas pode realizar um diagnóstico assistido para identificar créditos ocultos e o melhor regime para o seu negócio."
      />
    </div>
  )
}
