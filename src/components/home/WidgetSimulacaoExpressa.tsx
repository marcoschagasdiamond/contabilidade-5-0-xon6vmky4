import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Calculator,
  Info,
  AlertTriangle,
  Store,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import {
  getClienteEmpresaPorUsuario,
  getClienteEmpresaPorClienteAtivo,
  recordToPerfil,
} from '@/services/clientesEmpresas'

import {
  MATRIZ_VAZIA_SIMULACAO,
  OPCOES_VEDACAO_ANONIMA,
  OPCOES_VEDACAO_MEI_ANONIMA,
  LIMITE_MEI_SIMULACAO,
  matrizVedacoesDoPerfil,
  temVedacaoAnonima,
  temVedacaoMeiAnonima,
  statusRegimeNaSimulacao,
  regimeRecomendadoSimulacao,
  alertaVedacaoTexto,
  alertaVedacaoMeiTexto,
  type IdVedacaoAnonima,
  type IdVedacaoMeiAnonima,
  type MatrizVedacoesSimulacao,
  type StatusRegimeSimulacao,
} from '@/lib/simulacaoExpressaVedacoes'
import { registrarLeadSimulacaoExpressa } from '@/services/leadWhatsApp'
import type { ClienteEmpresaRecord } from '@/services/clientesEmpresas'

export type FaixaFaturamento = 'ate_4_8m' | '4_8m_50m' | 'acima_50m'
export type RegimeAtual = 'simples' | 'presumido' | 'real'
export type NivelDespesasCredito = 'baixa' | 'media' | 'alta'

interface ResultadoEstimativa {
  minimo: number
  maximo: number
  descricao: string
}

export function calcularEstimativaExpressa(
  faturamento: FaixaFaturamento,
  regime: RegimeAtual,
  despesas: NivelDespesasCredito,
): ResultadoEstimativa {
  // Valores anuais de faturamento aproximado de referência para cálculo ilustrativo
  const fatRef =
    faturamento === 'ate_4_8m' ? 2_400_000 : faturamento === '4_8m_50m' ? 18_000_000 : 80_000_000

  // Multiplicador do regime tributário atual
  let fatorRegime = 1.0
  let baseDescricao = ''

  if (regime === 'simples') {
    // No Simples, a oportunidade vem do creditamento na cadeia B2B ou opção híbrida
    fatorRegime = 0.008
    baseDescricao = 'Oportunidade na transferência de créditos IBS/CBS e otimização híbrida'
  } else if (regime === 'presumido') {
    // No Presumido, a transição para IBS/CBS com aproveitamento amplo de créditos de insumos/serviços
    fatorRegime = 0.018
    baseDescricao = 'Ganhos com creditamento financeiro integral e eliminação de cumulatividade'
  } else {
    // No Lucro Real, ganho via créditos amplos da Reforma LC 214/2025 e split payment
    fatorRegime = 0.015
    baseDescricao = 'Eficiência de créditos sobre insumos, split payment e Selic de créditos'
  }

  // Multiplicador do nível de despesas com crédito
  const fatorDespesa = despesas === 'baixa' ? 0.7 : despesas === 'media' ? 1.0 : 1.45

  const valorBase = fatRef * fatorRegime * fatorDespesa
  const minimo = Math.round((valorBase * 0.75) / 1000) * 1000
  const maximo = Math.round((valorBase * 1.35) / 1000) * 1000

  return {
    minimo: Math.max(minimo, 12_000),
    maximo: Math.max(maximo, 38_000),
    descricao: baseDescricao,
  }
}

export function formatarValorK(val: number): string {
  if (val >= 1_000_000) {
    const milhoes = (val / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')
    return `R$ ${milhoes} mi`
  }
  const milhares = Math.round(val / 1000)
  return `R$ ${milhares} mil`
}

/** Tipos de atividade do MEI e o valor mensal da guia DAS fixa de 2026 (R$/mês). */
export type TipoAtividadeMei = 'comercio' | 'servicos' | 'comercio_e_servicos'

export const VALOR_DAS_MEI_MENSAL: Record<TipoAtividadeMei, number> = {
  comercio: 82.05,
  servicos: 86.05,
  comercio_e_servicos: 87.05,
}

/** Formata o valor mensal da guia DAS-MEI (2026) com 2 decimais no padrão pt-BR. */
export function formatarValorMeiDas(tipo: TipoAtividadeMei): string {
  return `R$ ${VALOR_DAS_MEI_MENSAL[tipo].toFixed(2).replace('.', ',')}`
}

/** Rótulo legível das faixas/regimes para o payload do lead. */
const ROTULOS_FATURAMENTO: Record<FaixaFaturamento, string> = {
  ate_4_8m: 'Até R$ 4,8 mi',
  '4_8m_50m': 'R$ 4,8 mi a 50 mi',
  acima_50m: 'Acima de R$ 50 mi',
}
const ROTULOS_REGIME: Record<RegimeAtual, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}

export default function WidgetSimulacaoExpressa({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()

  const [faturamento, setFaturamento] = useState<FaixaFaturamento>('ate_4_8m')
  const [regime, setRegime] = useState<RegimeAtual>('simples')
  const [despesas, setDespesas] = useState<NivelDespesasCredito>('media')

  // Nível ANÔNIMO: situações de possível vedação marcadas na pergunta 4
  const [vedacoesAnonimas, setVedacoesAnonimas] = useState<IdVedacaoAnonima[]>([])
  const [vedacoesMeiAnonimas, setVedacoesMeiAnonimas] = useState<IdVedacaoMeiAnonima[]>([])
  // Nível LOGADO: matriz de vedações carregada da fonte mestra
  const [matrizLogada, setMatrizLogada] = useState<MatrizVedacoesSimulacao>(MATRIZ_INICIAL)

  // Carrega as vedações salvas na fonte mestra quando logado (nível 1 da lib)
  useEffect(() => {
    let ativo = true
    if (!isAuthenticated) {
      setMatrizLogada(MATRIZ_INICIAL)
      return
    }
    ;(async () => {
      try {
        let rec: ClienteEmpresaRecord | null = null
        if (clienteAtivo) {
          rec = await getClienteEmpresaPorClienteAtivo(clienteAtivo)
        }
        if (!rec && user?.id) {
          rec = await getClienteEmpresaPorUsuario(user.id)
        }
        if (ativo) setMatrizLogada(matrizVedacoesDoPerfil(rec ? recordToPerfil(rec) : null))
      } catch (err) {
        console.warn('[Simulação Expressa] Erro ao carregar vedações da fonte mestra:', err)
        if (ativo) setMatrizLogada(MATRIZ_INICIAL)
      }
    })()
    return () => {
      ativo = false
    }
  }, [isAuthenticated, user?.id, clienteAtivo])

  const vedacaoAnonima = temVedacaoAnonima(vedacoesAnonimas)
  const vedacaoMeiAnonima = temVedacaoMeiAnonima(vedacoesMeiAnonimas)

  const estimativa = useMemo(() => {
    return calcularEstimativaExpressa(faturamento, regime, despesas)
  }, [faturamento, regime, despesas])

  const statusSimples = useMemo(
    () => statusRegimeNaSimulacao('simples', matrizLogada, vedacaoAnonima),
    [matrizLogada, vedacaoAnonima],
  )
  const recomendacao = useMemo(
    () => regimeRecomendadoSimulacao(regime, matrizLogada, vedacaoAnonima),
    [regime, matrizLogada, vedacaoAnonima],
  )
  const alertaVedacao = useMemo(
    () => alertaVedacaoTexto(matrizLogada, vedacaoAnonima),
    [matrizLogada, vedacaoAnonima],
  )
  const exibeVedacao = statusSimples.status !== 'disponivel'

  // Card do MEI no resultado: parte da matriz logada (nível 1) e, no anônimo,
  // da checagem automática pelo faturamento + checkbox da Pergunta 4.
  const faturamentoMeiExcede = faturamento !== 'ate_4_8m'
  const statusMei = useMemo(() => {
    const base = statusRegimeNaSimulacao('mei', matrizLogada, vedacaoAnonima, vedacaoMeiAnonima)
    // Checagem automática pelo faturamento informado (Pergunta 1):
    // acima do limite anual do MEI, o regime sai da simulação por limite excedido.
    if (faturamentoMeiExcede && base.status === 'disponivel') {
      return {
        status: 'vedado' as StatusRegimeSimulacao,
        rotulo: `Indisponível — limite excedido (${formatarValorK(LIMITE_MEI_SIMULACAO)})`,
      }
    }
    return base
  }, [matrizLogada, vedacaoAnonima, vedacaoMeiAnonima, faturamentoMeiExcede])
  const alertaMei = useMemo(() => alertaVedacaoMeiTexto(vedacaoMeiAnonima), [vedacaoMeiAnonima])

  const toggleVedacaoAnonima = (id: IdVedacaoAnonima) => {
    setVedacoesAnonimas((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    )
  }

  const toggleVedacaoMeiAnonima = (id: IdVedacaoMeiAnonima) => {
    setVedacoesMeiAnonimas((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    )
  }

  const handleCta = () => {
    // Fire-and-forget: lead da simulação anônima (com score/origem de vedação quando marcada)
    if (!isAuthenticated) {
      registrarLeadSimulacaoExpressa({
        selecionadas: vedacoesAnonimas,
        selecionadasMei: vedacoesMeiAnonimas,
        faturamento: ROTULOS_FATURAMENTO[faturamento],
        regime: ROTULOS_REGIME[regime],
        isAuthenticated: false,
      }).catch(() => {})
    }
    if (isAuthenticated) {
      navigate('/dados-empresa')
    } else {
      navigate('/cadastro?redirect=%2Fdados-empresa')
    }
  }

  return (
    <div
      data-testid="widget-simulacao-expressa"
      className={`bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-100/60 transition-all ${className}`}
    >
      {/* Cabeçalho do Widget */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#145A32]">
            <Calculator className="w-5 h-5 text-[#2ECC71]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base text-[#07132B] tracking-tight">
                Simulação Expressa
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#916b0d] border border-[#D4AF37]/30">
                IBS / CBS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isAuthenticated
                ? 'Baseado nos seus Dados da Empresa'
                : '3 respostas • resultado imediato'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span>Grátis</span>
        </div>
      </div>

      {/* Pergunta 1: Faturamento Anual */}
      <div className="space-y-1.5 mb-3.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>1. Faturamento anual da empresa</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFaturamento('ate_4_8m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === 'ate_4_8m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Até R$ 4,8 mi
          </button>
          <button
            type="button"
            onClick={() => setFaturamento('4_8m_50m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === '4_8m_50m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            R$ 4,8 a 50 mi
          </button>
          <button
            type="button"
            onClick={() => setFaturamento('acima_50m')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              faturamento === 'acima_50m'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Acima de 50 mi
          </button>
        </div>
      </div>

      {/* Pergunta 2: Regime Atual */}
      <div className="space-y-1.5 mb-3.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>2. Regime tributário atual</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setRegime('simples')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'simples'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Simples Nac.
          </button>
          <button
            type="button"
            onClick={() => setRegime('presumido')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'presumido'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Lucro Presumido
          </button>
          <button
            type="button"
            onClick={() => setRegime('real')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              regime === 'real'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Lucro Real
          </button>
        </div>
      </div>

      {/* Pergunta 3: % Despesas com Crédito */}
      <div className="space-y-1.5 mb-3.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>3. Despesas com compras, insumos e serviços</span>
          <span className="text-[11px] font-normal text-slate-500">com direito a crédito</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setDespesas('baixa')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'baixa'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Baixa (&lt;25%)
          </button>
          <button
            type="button"
            onClick={() => setDespesas('media')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'media'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Média (25% a 50%)
          </button>
          <button
            type="button"
            onClick={() => setDespesas('alta')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
              despesas === 'alta'
                ? 'bg-[#0E3520] text-white border-[#0E3520] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Alta (&gt;50%)
          </button>
        </div>
      </div>

      {/* Pergunta 4 (anônimo): situações de possível vedação ao Simples */}
      {!isAuthenticated && (
        <div className="space-y-1.5 mb-4" data-testid="widget-pergunta-vedacao">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>4. Alguma destas situações se aplica?</span>
            <span className="text-[11px] font-normal text-slate-500">
              afeta a opção pelo Simples
            </span>
          </label>
          <div className="space-y-1.5">
            {OPCOES_VEDACAO_ANONIMA.map((op) => {
              const marcada = vedacoesAnonimas.includes(op.id)
              return (
                <label
                  key={op.id}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                    marcada
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    data-testid={`vedacao-anonima-${op.id}`}
                    checked={marcada}
                    onChange={() => toggleVedacaoAnonima(op.id)}
                    className="mt-0.5 h-3.5 w-3.5 accent-amber-600 cursor-pointer"
                  />
                  <span className="leading-snug font-medium">{op.rotulo}</span>
                </label>
              )
            })}
            {OPCOES_VEDACAO_MEI_ANONIMA.map((op) => {
              const marcada = vedacoesMeiAnonimas.includes(op.id)
              return (
                <label
                  key={op.id}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                    marcada
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    data-testid={`vedacao-mei-anonima-${op.id}`}
                    checked={marcada}
                    onChange={() => toggleVedacaoMeiAnonima(op.id)}
                    className="mt-0.5 h-3.5 w-3.5 accent-amber-600 cursor-pointer"
                  />
                  <span className="leading-snug font-medium">
                    {op.rotulo}
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      {op.dica}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Card do MEI (checagem automática pelo faturamento + checkbox da Pergunta 4) */}
      <div
        data-testid="widget-card-mei"
        className={`p-3 sm:p-3.5 rounded-xl border mb-3.5 ${
          statusMei.status !== 'disponivel'
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#07132B]">
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <span>MEI (Microempreendedor Individual)</span>
          </div>
          {statusMei.status === 'vedado' && (
            <span
              data-testid="mei-vedado-badge"
              className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300"
            >
              {statusMei.rotulo}
            </span>
          )}
          {statusMei.status === 'possivel_vedacao' && (
            <span
              data-testid="mei-possivel-vedacao-badge"
              className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
            >
              {statusMei.rotulo}
            </span>
          )}
          {statusMei.status === 'disponivel' && (
            <span
              data-testid="mei-disponivel-badge"
              className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300"
            >
              Disponível
            </span>
          )}
        </div>

        {statusMei.status === 'vedado' ? (
          <p className="text-[11px] text-rose-800 leading-snug">
            {matrizLogada.vedadosMei
              ? alertaVedacao
              : `Receita bruta anual informada acima de ${formatarValorK(LIMITE_MEI_SIMULACAO)} — a empresa não se qualifica como MEI (Resolução CGSN 140/2018, art. 3º).`}
          </p>
        ) : (
          <p className="text-[11px] text-slate-600 leading-snug">
            <span className="font-semibold text-slate-700">
              Guia DAS fixa: {formatarValorMeiDas('servicos')}/mês
            </span>{' '}
            (serviços; R$ 82,05 comércio, R$ 86,05 serviços — INSS 5% do salário mínimo + ICMS/ISS).
            {statusMei.status === 'possivel_vedacao' && alertaMei && (
              <span className="block mt-1 font-semibold text-amber-800">{alertaMei}</span>
            )}
          </p>
        )}
      </div>

      {/* Card do Resultado na hora */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border mb-3.5 ${
          exibeVedacao
            ? 'bg-gradient-to-br from-amber-50 via-amber-50/60 to-white border-amber-300'
            : 'bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50/40 border-emerald-200/80'
        }`}
      >
        {/* Faixa de possível/confirmada vedação (âmbar) — nunca vermelho no anônimo */}
        {exibeVedacao && (
          <div
            data-testid="widget-vedacao-badge"
            className="flex items-start gap-2 mb-2.5 p-2 rounded-lg bg-amber-100/70 border border-amber-300"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <span
                className={`font-bold block ${
                  statusSimples.status === 'vedado' ? 'text-rose-700' : 'text-amber-800'
                }`}
              >
                {statusSimples.rotulo}
              </span>
              <span className="text-amber-800/80">{alertaVedacao}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Economia potencial estimada com IBS/CBS:</span>
        </div>
        <div
          data-testid="estimativa-faixa-resultado"
          className="text-lg sm:text-2xl font-heading font-extrabold text-[#0E3520] tracking-tight"
        >
          {formatarValorK(estimativa.minimo)} a {formatarValorK(estimativa.maximo)}
          <span className="text-xs font-semibold text-slate-600 ml-1.5">/ ano</span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
          {recomendacao.motivo ? recomendacao.motivo : estimativa.descricao}
        </p>
      </div>

      {/* CTA para o relatório completo */}
      <button
        type="button"
        onClick={handleCta}
        data-testid="cta-simulacao-expressa"
        className="w-full py-3.5 px-4 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.45)] transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer btn-press"
      >
        <span>Quero o relatório completo</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Disclaimer */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3 h-3 shrink-0" />
        <span className="text-center">
          Estimativa ilustrativa — a análise completa considera seu caso real.
        </span>
      </div>
    </div>
  )
}

const MATRIZ_INICIAL = MATRIZ_VAZIA_SIMULACAO
