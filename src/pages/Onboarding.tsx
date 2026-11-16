// ============================================================================
// WIZARD PRIMEIROS PASSOS (/onboarding) — fase pendente do projeto, opção (b)
// do usuário: wizard COMPLETO com a Simulação Expressa como porta de entrada.
// 4 passos: Boas-vindas → Dados da Empresa (fonte mestra clientes_empresas)
// → Regime & Vedações (matriz v0.0.362) → Concluído (CTA Diagnóstico 360).
// Não altera cálculos, diagnósticos nem CRM.
// ============================================================================
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Building2,
  Scale,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  PartyPopper,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getClienteEmpresaPorUsuario,
  recordToPerfil,
  salvarClienteEmpresaNoBanco,
} from '@/services/clientesEmpresas'
import { salvarProgressoOnboarding } from '@/services/onboarding'
import { VEDACOES_SIMPLES_ART17, VEDACOES_PRESUMIDO, VEDACOES_MEI } from '@/lib/vedacoesRegimes'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import { CHAVE_PREFILL_ONBOARDING as CHAVE_PREFILL } from '@/components/home/WidgetSimulacaoExpressa'

const PASSOS = ['Boas-vindas', 'Dados da Empresa', 'Regime & Vedações', 'Concluído']

const OPCOES_REGIME = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'] as const

const FATURAMENTO_MENSAL_POR_FAIXA: Record<string, number> = {
  ate_4_8m: 200_000,
  '4_8m_50m': 1_500_000,
  acima_50m: 6_666_667,
}

const REGIME_POR_CHAVE: Record<string, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}

interface PrefillSimulacao {
  origem?: string
  faturamento?: string
  regime?: string
  despesas?: string
  vedacoesAnonimas?: string[]
  vedacoesMeiAnonimas?: string[]
}

interface FormDados {
  nomeContato: string
  nomeEmpresa: string
  cnpj: string
  telefone: string
  ufOrigem: string
  segmento: string
  faturamentoMensal: number
  folhaPagamentoMensal: number
  funcionarios: string
}

const FORM_VAZIO: FormDados = {
  nomeContato: '',
  nomeEmpresa: '',
  cnpj: '',
  telefone: '',
  ufOrigem: 'SP',
  segmento: 'Serviços',
  faturamentoMensal: 200_000,
  folhaPagamentoMensal: 50_000,
  funcionarios: '1 a 5 funcionários',
}

const catalogoSimples = VEDACOES_SIMPLES_ART17 as unknown as ReadonlyArray<{
  id: string
  rotulo?: string
  rotuloCurto?: string
  descricao?: string
}>

/**
 * Mapeia os ids anônimos da Simulação Expressa (pergunta 4) para os campos da
 * matriz de vedações — ids anônimos não coincidem com os ids da matriz.
 */
const MAPA_VEDACAO_ANONIMA_PARA_MATRIZ: Record<string, { grupo: 'simples' | 'mei'; id: string }> = {
  debito_inss_fazenda: { grupo: 'simples', id: 'inc5_debitos_inss_fazenda' },
  socio_outra_empresa: { grupo: 'mei', id: 'mei_socio' },
  mei_atividade_nao_permitida: { grupo: 'mei', id: 'mei_atividade_nao_permitida' },
}

const catalogoPresumido = VEDACOES_PRESUMIDO as ReadonlyArray<{
  id: string
  rotulo: string
  descricao: string
}>

const catalogoMei = VEDACOES_MEI as ReadonlyArray<{
  id: string
  rotulo: string
  descricao: string
}>

const rotuloSimples = (id: string) => {
  const item = catalogoSimples.find((v) => v.id === id)
  return item?.rotulo || item?.rotuloCurto || id
}

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor || 0)

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [passo, setPasso] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState<FormDados>(FORM_VAZIO)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Passo 3: regime + vedações (matriz Simples/Presumido/MEI)
  const [regimeAtual, setRegimeAtual] = useState<string>('Simples Nacional')
  const [vedSimples, setVedSimples] = useState<string[]>([])
  const [outraSimples, setOutraSimples] = useState('')
  const [vedPresumido, setVedPresumido] = useState<string[]>([])
  const [outraPresumido, setOutraPresumido] = useState('')
  const [vedMei, setVedMei] = useState<string[]>([])
  const [outraMei, setOutraMei] = useState('')

  // Pré-preenchimento vindo da Simulação Expressa (widget da home, anônimo)
  const prefill = useMemo<PrefillSimulacao | null>(() => {
    try {
      const cru = localStorage.getItem(CHAVE_PREFILL)
      if (!cru) return null
      const parsed = JSON.parse(cru) as PrefillSimulacao
      return parsed?.origem === 'simulacao_expressa' ? parsed : null
    } catch {
      return null
    }
  }, [])

  // Carrega dados existentes da fonte mestra + aplica prefill da simulação
  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        if (user?.id) {
          const rec = await getClienteEmpresaPorUsuario(user.id)
          if (ativo && rec) {
            setEmpresaId(rec.id)
            const perfil = recordToPerfil(rec)
            setForm((prev) => ({
              ...prev,
              nomeContato: perfil.nomeContato || prev.nomeContato,
              nomeEmpresa: perfil.nomeEmpresa || prev.nomeEmpresa,
              cnpj: perfil.cnpj || prev.cnpj,
              telefone: perfil.telefone || prev.telefone,
              ufOrigem: perfil.ufOrigem || prev.ufOrigem,
              segmento: perfil.segmento || prev.segmento,
              faturamentoMensal: perfil.faturamentoMensal ?? prev.faturamentoMensal,
              folhaPagamentoMensal: perfil.folhaPagamentoMensal ?? prev.folhaPagamentoMensal,
              funcionarios: perfil.funcionarios || prev.funcionarios,
            }))
            setRegimeAtual(perfil.regimeAtual || 'Simples Nacional')
            setVedSimples(perfil.vedacoesSimplesArt17 || [])
            setOutraSimples(perfil.vedacaoSimplesArt17Outra || '')
            setVedPresumido(perfil.vedacoesPresumido || [])
            setOutraPresumido(perfil.vedacaoPresumidoOutra || '')
            setVedMei(perfil.vedacoesMei || [])
            setOutraMei(perfil.vedacaoMeiOutra || '')
          }
        }
        if (ativo && prefill) {
          const fat = prefill.faturamento
            ? FATURAMENTO_MENSAL_POR_FAIXA[prefill.faturamento]
            : undefined
          if (fat) setForm((prev) => ({ ...prev, faturamentoMensal: fat }))
          const regime = prefill.regime ? REGIME_POR_CHAVE[prefill.regime] : undefined
          if (regime) setRegimeAtual(regime)
          // Mapeia ids anônimos da simulação para os ids da matriz (só os válidos entram)
          const mapeadas = [
            ...(prefill.vedacoesAnonimas || []),
            ...(prefill.vedacoesMeiAnonimas || []),
          ]
            .map((id) => MAPA_VEDACAO_ANONIMA_PARA_MATRIZ[id])
            .filter(Boolean)
          const idsSimples = mapeadas.filter((m) => m.grupo === 'simples').map((m) => m.id)
          const idsMei = mapeadas.filter((m) => m.grupo === 'mei').map((m) => m.id)
          if (idsSimples.length)
            setVedSimples((prev) => Array.from(new Set([...prev, ...idsSimples])))
          if (idsMei.length) setVedMei((prev) => Array.from(new Set([...prev, ...idsMei])))
        }
      } catch (err) {
        console.warn('[Onboarding] Erro ao carregar dados iniciais:', err)
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [user?.id, prefill])

  const setCampo = <K extends keyof FormDados>(campo: K, valor: FormDados[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }))

  const toggle = (lista: string[], setLista: (v: string[]) => void, id: string) =>
    setLista(lista.includes(id) ? lista.filter((v) => v !== id) : [...lista, id])

  // Passo 2: salva os dados da empresa na fonte mestra (cria ou atualiza)
  const salvarDadosEmpresa = async (): Promise<boolean> => {
    if (!user?.id) return false
    setErro(null)
    if (!form.nomeEmpresa.trim()) {
      setErro('Informe o nome da empresa para continuar.')
      return false
    }
    setSalvando(true)
    try {
      const perfil: Partial<DadosEmpresaPerfil> = {
        nomeContato: form.nomeContato || undefined,
        nomeEmpresa: form.nomeEmpresa,
        cnpj: form.cnpj || undefined,
        email: user.email || undefined,
        telefone: form.telefone || undefined,
        ufOrigem: form.ufOrigem,
        segmento: form.segmento as DadosEmpresaPerfil['segmento'],
        faturamentoMensal: Number(form.faturamentoMensal) || 0,
        folhaPagamentoMensal: Number(form.folhaPagamentoMensal) || 0,
        funcionarios: form.funcionarios,
      }
      const rec = await salvarClienteEmpresaNoBanco(perfil, user.id)
      setEmpresaId(rec.id)
      await salvarProgressoOnboarding(user.id, { passo_empresa_concluido: true })
      return true
    } catch (err: any) {
      console.error('[Onboarding] Erro ao salvar dados da empresa:', err)
      setErro(err?.message || 'Não foi possível salvar os dados. Tente novamente.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  // Passo 3: persiste regime + vedações no MESMO registro da fonte mestra
  const salvarRegimeVedacoes = async (): Promise<boolean> => {
    if (!user?.id) return false
    setErro(null)
    setSalvando(true)
    try {
      const perfil: Partial<DadosEmpresaPerfil> = {
        regimeAtual,
        vedacoesSimplesArt17: vedSimples,
        vedacaoSimplesArt17Outra: outraSimples,
        vedacoesPresumido: vedPresumido,
        vedacaoPresumidoOutra: outraPresumido,
        vedacoesMei: vedMei,
        vedacaoMeiOutra: outraMei,
      }
      await salvarClienteEmpresaNoBanco(perfil, user.id)
      await salvarProgressoOnboarding(user.id, { wizard_dispensado: true })
      return true
    } catch (err: any) {
      console.error('[Onboarding] Erro ao salvar regime e vedações:', err)
      setErro(err?.message || 'Não foi possível salvar o regime. Tente novamente.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  const avancar = async () => {
    if (passo === 1) {
      const ok = await salvarDadosEmpresa()
      if (!ok) return
      avancarSemSalvar()
      return
    }
    if (passo === 2) {
      const ok = await salvarRegimeVedacoes()
      if (!ok) return
      avancarSemSalvar()
      return
    }
    avancarSemSalvar()
  }

  const avancarSemSalvar = () => setPasso((p) => Math.min(p + 1, PASSOS.length - 1))

  const voltar = () => setPasso((p) => Math.max(p - 1, 0))

  const totalVedacoes = vedSimples.length + vedPresumido.length + vedMei.length
  const textoPrefill =
    prefill &&
    (prefill.faturamento || prefill.regime || (prefill.vedacoesAnonimas || []).length > 0)
      ? 'Respostas da Simulação Expressa foram aplicadas nesta configuração.'
      : null

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {PASSOS.map((rotulo, i) => (
              <button
                key={rotulo}
                type="button"
                onClick={() => i < passo && setPasso(i)}
                className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                  i === passo
                    ? 'text-[#07132B]'
                    : i < passo
                      ? 'text-emerald-700 cursor-pointer'
                      : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    i < passo
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : i === passo
                        ? 'bg-[#07132B] text-white border-[#07132B]'
                        : 'bg-white text-slate-400 border-slate-300'
                  }`}
                >
                  {i < passo ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{rotulo}</span>
              </button>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37] transition-all duration-300"
              style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
          {erro && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-[#E74C3C]">
              {erro}
            </div>
          )}

          {/* ---------------- PASSO 1: BOAS-VINDAS ---------------- */}
          {passo === 0 && (
            <div data-testid="onboarding-passo-1" className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-2xl text-[#07132B] tracking-tight">
                    Bem-vindo à Contabilidade 5.0
                  </h1>
                  <p className="text-xs text-slate-500">
                    Wizard de primeiros passos — 3 minutos para configurar sua análise
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                A C50 combina contabilidade consultiva com inteligência da Reforma Tributária
                (IBS/CBS). Neste wizard vamos configurar, em 3 passos curtos:
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                  <span>
                    <strong>Dados da Empresa</strong> — a base de todas as simulações e diagnósticos
                    da plataforma.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                  <span>
                    <strong>Regime atual e vedações</strong> — matriz Simples/Presumido/MEI que
                    define quais regimes estão disponíveis para você.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                  <span>
                    <strong>Diagnóstico 360°</strong> — o relatório consolidado com sua posição na
                    transição 2026-2033.
                  </span>
                </li>
              </ul>
              {textoPrefill && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{textoPrefill}</span>
                </div>
              )}
            </div>
          )}

          {/* ---------------- PASSO 2: DADOS DA EMPRESA ---------------- */}
          {passo === 1 && (
            <div data-testid="onboarding-passo-2" className="space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#145A32]" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl text-[#07132B]">
                    Dados da Empresa
                  </h2>
                  <p className="text-xs text-slate-500">
                    Salvos na fonte mestra — nunca pedimos de novo em Dados da Empresa
                  </p>
                </div>
              </div>
              <Campo
                label="Nome da empresa *"
                value={form.nomeEmpresa}
                onChange={(v) => setCampo('nomeEmpresa', v)}
                placeholder="Razão social"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Campo
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={(v) => setCampo('cnpj', v)}
                  placeholder="00.000.000/0000-00"
                />
                <Campo
                  label="Seu nome (contato)"
                  value={form.nomeContato}
                  onChange={(v) => setCampo('nomeContato', v)}
                  placeholder="Responsável"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Campo
                  label="Telefone"
                  value={form.telefone}
                  onChange={(v) => setCampo('telefone', v)}
                  placeholder="+55 (11) 99999-9999"
                />
                <Campo
                  label="UF de origem"
                  value={form.ufOrigem}
                  onChange={(v) => setCampo('ufOrigem', v.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Segmento
                </label>
                <select
                  value={form.segmento}
                  onChange={(e) => setCampo('segmento', e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                >
                  <option value="Serviços">Serviços</option>
                  <option value="Comércio">Comércio</option>
                  <option value="Indústria">Indústria</option>
                  <option value="Atividade mista">Atividade mista</option>
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Campo
                  label="Faturamento mensal (R$)"
                  value={String(form.faturamentoMensal || '')}
                  onChange={(v) => setCampo('faturamentoMensal', Number(v.replace(/\D/g, '')) || 0)}
                  placeholder="200000"
                  tipo="numeric"
                />
                <Campo
                  label="Folha de pagamento mensal (R$)"
                  value={String(form.folhaPagamentoMensal || '')}
                  onChange={(v) =>
                    setCampo('folhaPagamentoMensal', Number(v.replace(/\D/g, '')) || 0)
                  }
                  placeholder="50000"
                  tipo="numeric"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Funcionários
                </label>
                <select
                  value={form.funcionarios}
                  onChange={(e) => setCampo('funcionarios', e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
                >
                  <option value="Sem funcionários">Sem funcionários</option>
                  <option value="1 a 5 funcionários">1 a 5 funcionários</option>
                  <option value="6 a 20 funcionários">6 a 20 funcionários</option>
                  <option value="21 a 50 funcionários">21 a 50 funcionários</option>
                  <option value="Mais de 50 funcionários">Mais de 50 funcionários</option>
                </select>
              </div>
            </div>
          )}

          {/* ---------------- PASSO 3: REGIME & VEDAÇÕES ---------------- */}
          {passo === 2 && (
            <div data-testid="onboarding-passo-3" className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl text-[#07132B]">
                    Regime & Vedações
                  </h2>
                  <p className="text-xs text-slate-500">
                    Matriz de disponibilidade — indicativa, sem alterar cálculos
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Regime tributário atual
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OPCOES_REGIME.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setRegimeAtual(op)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-heading font-semibold border transition-all text-left cursor-pointer ${
                        regimeAtual === op
                          ? 'bg-[#07132B] text-white border-[#D4AF37] ring-1 ring-[#D4AF37]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <BlocoVedacao
                titulo="Simples Nacional (art. 17, LC 123/2006)"
                itens={catalogoSimples.map((v) => ({
                  id: v.id,
                  rotulo: rotuloSimples(v.id),
                  descricao: v.descricao || '',
                }))}
                marcadas={vedSimples}
                onToggle={(id) => toggle(vedSimples, setVedSimples, id)}
                outra={outraSimples}
                onOutra={setOutraSimples}
              />
              <BlocoVedacao
                titulo="Lucro Presumido (Lei 9.718/98)"
                itens={catalogoPresumido.map((v) => ({
                  id: v.id,
                  rotulo: v.rotulo,
                  descricao: v.descricao,
                }))}
                marcadas={vedPresumido}
                onToggle={(id) => toggle(vedPresumido, setVedPresumido, id)}
                outra={outraPresumido}
                onOutra={setOutraPresumido}
              />
              <BlocoVedacao
                titulo="MEI (Resolução CGSN 140/2018)"
                itens={catalogoMei.map((v) => ({
                  id: v.id,
                  rotulo: v.rotulo,
                  descricao: v.descricao,
                }))}
                marcadas={vedMei}
                onToggle={(id) => toggle(vedMei, setVedMei, id)}
                outra={outraMei}
                onOutra={setOutraMei}
              />
              {textoPrefill && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-800">
                  {textoPrefill} Situações da simulação foram aplicadas quando correspondem à
                  matriz; revise as marcações abaixo.
                </div>
              )}
            </div>
          )}

          {/* ---------------- PASSO 4: CONCLUÍDO ---------------- */}
          {passo === 3 && (
            <div data-testid="onboarding-passo-4" className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                <PartyPopper className="w-7 h-7 text-[#145A32]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl text-[#07132B]">
                  Configuração concluída!
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Sua base está pronta para as análises da Reforma Tributária.
                </p>
              </div>
              <div className="text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                <Resumo rotulo="Empresa" valor={form.nomeEmpresa || '—'} />
                <Resumo
                  rotulo="Faturamento mensal"
                  valor={formatarMoeda(Number(form.faturamentoMensal))}
                />
                <Resumo
                  rotulo="Folha de pagamento"
                  valor={formatarMoeda(Number(form.folhaPagamentoMensal))}
                />
                <Resumo rotulo="Regime atual" valor={regimeAtual} />
                <Resumo
                  rotulo="Vedações registradas"
                  valor={
                    totalVedacoes > 0
                      ? `${totalVedacoes} situação(ões) na matriz`
                      : 'Nenhuma — todos os regimes disponíveis'
                  }
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                <Link
                  to="/diagnostico-360"
                  data-testid="onboarding-cta-diagnostico"
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all hover:-translate-y-0.5"
                >
                  Fazer Diagnóstico 360°
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-heading font-semibold text-sm text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all"
                >
                  Voltar ao início
                </Link>
              </div>
            </div>
          )}

          {/* Navegação */}
          {passo < 3 && (
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={voltar}
                disabled={passo === 0 || salvando}
                className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={avancar}
                disabled={salvando}
                data-testid="onboarding-avancar"
                className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {passo === 2 ? 'Concluir' : 'Avançar'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {passo === 0 && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Você pode rever tudo depois em <span className="font-semibold">Dados da Empresa</span>.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Blocos auxiliares
// ---------------------------------------------------------------------------

function Campo({
  label,
  value,
  onChange,
  placeholder,
  tipo,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  tipo?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={tipo === 'numeric' ? 'text' : 'text'}
        inputMode={tipo === 'numeric' ? 'numeric' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
      />
    </div>
  )
}

function BlocoVedacao({
  titulo,
  itens,
  marcadas,
  onToggle,
  outra,
  onOutra,
}: {
  titulo: string
  itens: ReadonlyArray<{ id: string; rotulo: string; descricao: string }>
  marcadas: string[]
  onToggle: (id: string) => void
  outra: string
  onOutra: (v: string) => void
}) {
  return (
    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60">
      <p className="text-xs font-bold text-slate-800 mb-2">{titulo}</p>
      <div className="space-y-1.5">
        {itens.map((item) => {
          const marcada = marcadas.includes(item.id)
          return (
            <label
              key={item.id}
              title={item.descricao}
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                marcada
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={marcada}
                onChange={() => onToggle(item.id)}
                className="mt-0.5 h-3.5 w-3.5 accent-amber-600 cursor-pointer"
              />
              <span className="leading-snug font-medium">{item.rotulo}</span>
            </label>
          )
        })}
        <input
          type="text"
          value={outra}
          onChange={(e) => onOutra(e.target.value)}
          placeholder="Outra situação (descreva)"
          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 input-focus-ring"
        />
      </div>
    </div>
  )
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {rotulo}
      </span>
      <span className="text-sm font-semibold text-slate-800 text-right">{valor}</span>
    </div>
  )
}
