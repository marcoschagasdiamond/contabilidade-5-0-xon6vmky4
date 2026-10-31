import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  obterDadosEscritorioAtivo,
  salvarDadosEscritorioUsuario,
  dispensarGateEscritorio,
} from '@/services/escritorio'
import type { DadosEscritorioAdquirente } from '@/types/escritorio'
import { formatarCNPJ, sanitizarCNPJ } from '@/lib/cnpj'

const ESTADOS_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export default function DadosEscritorio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isEmpresario, isContador, isAdmin, recarregarUsuario } = useAuth()

  const redirectDestino = searchParams.get('redirect') || '/dados-empresa'

  // Regra (2): Empresário NÃO vê esse formulário de forma alguma
  useEffect(() => {
    if (isEmpresario) {
      navigate('/minha-conta', { replace: true })
    }
  }, [isEmpresario, navigate])

  const [form, setForm] = useState<DadosEscritorioAdquirente>(() => {
    const dados = obterDadosEscritorioAtivo()
    return {
      escritorio_nome: dados.escritorio_nome || '',
      escritorio_responsavel: dados.escritorio_responsavel || (user as any)?.name || '',
      escritorio_cnpj: dados.escritorio_cnpj ? formatarCNPJ(dados.escritorio_cnpj) : '',
      escritorio_email: dados.escritorio_email || user?.email || '',
      escritorio_telefone: dados.escritorio_telefone || '',
      escritorio_uf: dados.escritorio_uf || 'SP',
      escritorio_cidade: dados.escritorio_cidade || '',
      escritorio_cadastrado: dados.escritorio_cadastrado,
    }
  })

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const dados = obterDadosEscritorioAtivo()
    setForm((prev) => ({
      ...prev,
      escritorio_nome: prev.escritorio_nome || dados.escritorio_nome || '',
      escritorio_responsavel:
        prev.escritorio_responsavel || dados.escritorio_responsavel || (user as any)?.name || '',
      escritorio_cnpj:
        prev.escritorio_cnpj || (dados.escritorio_cnpj ? formatarCNPJ(dados.escritorio_cnpj) : ''),
      escritorio_email: prev.escritorio_email || dados.escritorio_email || user?.email || '',
      escritorio_telefone: prev.escritorio_telefone || dados.escritorio_telefone || '',
      escritorio_uf: prev.escritorio_uf || dados.escritorio_uf || 'SP',
      escritorio_cidade: prev.escritorio_cidade || dados.escritorio_cidade || '',
      escritorio_cadastrado: dados.escritorio_cadastrado,
    }))
  }, [user])

  const handleChange = (campo: keyof DadosEscritorioAdquirente, valor: string) => {
    if (campo === 'escritorio_cnpj') {
      const limpo = sanitizarCNPJ(valor)
      setForm((prev) => ({
        ...prev,
        escritorio_cnpj: limpo.length <= 14 ? formatarCNPJ(limpo) : prev.escritorio_cnpj,
      }))
      return
    }
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handlePular = () => {
    dispensarGateEscritorio()
    navigate(redirectDestino, { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!form.escritorio_nome.trim()) {
      setErro('Informe o nome do escritório ou da pessoa jurídica adquirente.')
      return
    }

    setSalvando(true)
    try {
      const res = await salvarDadosEscritorioUsuario({
        ...form,
        escritorio_cnpj: sanitizarCNPJ(form.escritorio_cnpj),
      })

      if (!res.success) {
        setErro(res.error || 'Não foi possível salvar os dados do escritório.')
        setSalvando(false)
        return
      }

      await recarregarUsuario()
      dispensarGateEscritorio()
      setSucesso(true)

      setTimeout(() => {
        navigate(redirectDestino, { replace: true })
      }, 1200)
    } catch (err: any) {
      setErro(err?.message || 'Erro inesperado ao salvar os dados.')
    } finally {
      setSalvando(false)
    }
  }

  if (isEmpresario) {
    return null
  }

  return (
    <div className="pt-28 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-6">
        {/* Cabeçalho Diamond Group (Sem ícones) */}
        <div className="bg-[#07132B] text-white rounded-[24px] p-6 sm:p-8 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded">
                Bloco 2 • Identidade do Escritório Parceiro
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {isAdmin ? 'Nível Administrador / Analista' : 'Nível Analista'}
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Identificação do Escritório Adquirente
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Estes dados identificam o seu escritório como emissor técnico dos relatórios e
              pareceres em PDF (cabeçalho, rodapé e termo formal de responsabilidade).{' '}
              <strong>Não alimentam cálculos de tributos</strong>
              nem simulações — são estritamente dados de identidade profissional.
            </p>
          </div>
        </div>

        {/* Quadro informativo de gate leve */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 text-slate-600">
            <span className="font-bold text-slate-900 block text-xs">
              Primeiro acesso do Analista — Formulário Curto
            </span>
            <p className="text-[11px] text-slate-500">
              Você pode preencher agora para assinar pareceres com a marca do seu escritório ou
              pular e preencher depois.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePular}
            className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors shrink-0"
          >
            Preencher Depois →
          </button>
        </div>

        {/* Mensagens de feedback */}
        {sucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-950 flex items-center justify-between">
            <span>Dados do escritório salvos com sucesso! Redirecionando...</span>
          </div>
        )}

        {erro && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-950 flex items-center justify-between">
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário Curto e Separado de Dados da Empresa */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Dados Cadastrais do Escritório
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Utilizados no rodapé e cabeçalho dos laudos técnicos: "Parecer emitido por
              [Escritório] — responsável técnico [Nome]".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="esc-nome"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Nome do Escritório / Razão Social *
              </label>
              <input
                id="esc-nome"
                type="text"
                required
                value={form.escritorio_nome}
                onChange={(e) => handleChange('escritorio_nome', e.target.value)}
                placeholder="Ex.: Chagas & Associados Contabilidade Estratégica"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              />
              <span className="text-[11px] text-slate-400 block">
                Nome que aparecerá no cabeçalho e rodapé dos pareceres emitidos.
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-resp"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Responsável Técnico Contábil *
              </label>
              <input
                id="esc-resp"
                type="text"
                required
                value={form.escritorio_responsavel}
                onChange={(e) => handleChange('escritorio_responsavel', e.target.value)}
                placeholder="Ex.: Dr. Carlos Mendes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-cnpj"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                CNPJ do Escritório
              </label>
              <input
                id="esc-cnpj"
                type="text"
                value={form.escritorio_cnpj}
                onChange={(e) => handleChange('escritorio_cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 font-mono input-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-email"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                E-mail Institucional *
              </label>
              <input
                id="esc-email"
                type="email"
                required
                value={form.escritorio_email}
                onChange={(e) => handleChange('escritorio_email', e.target.value)}
                placeholder="contato@escritorio.com.br"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-tel"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Telefone / WhatsApp
              </label>
              <input
                id="esc-tel"
                type="text"
                value={form.escritorio_telefone}
                onChange={(e) => handleChange('escritorio_telefone', e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-cidade"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                Cidade *
              </label>
              <input
                id="esc-cidade"
                type="text"
                required
                value={form.escritorio_cidade}
                onChange={(e) => handleChange('escritorio_cidade', e.target.value)}
                placeholder="São Paulo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="esc-uf"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                UF *
              </label>
              <select
                id="esc-uf"
                value={form.escritorio_uf}
                onChange={(e) => handleChange('escritorio_uf', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 input-focus-ring"
              >
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">
              Pré-visualização do Rodapé nos Pareceres:
            </span>
            <p className="italic text-slate-700 font-mono text-[11px]">
              "Parecer emitido por {form.escritorio_nome.trim() || '[Nome do Escritório]'} —
              responsável técnico {form.escritorio_responsavel.trim() || '[Nome do Responsável]'} |{' '}
              {form.escritorio_cidade.trim() || 'Cidade'} - {form.escritorio_uf || 'UF'}"
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePular}
              disabled={salvando}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Pular e Preencher Depois
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A1A13] hover:bg-[#142820] text-[#D4AF37] font-heading font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {salvando ? 'Salvando Identidade...' : 'Salvar Cadastro do Escritório'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link
            to="/minha-conta"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors underline"
          >
            ← Voltar para Minha Conta
          </Link>
        </div>
      </div>
    </div>
  )
}
