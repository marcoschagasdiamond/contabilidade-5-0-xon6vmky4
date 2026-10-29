import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  AVISO_LEGAL_CREDITOS,
  TIPOS_CREDITO_LISTA,
  type AnuncioCredito,
  type PedidoInformacaoCredito,
  type TipoCredito,
} from '@/types/creditos'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import {
  listarAnunciosMercado,
  listarMeusPedidosUsuario,
  marcarPedidoVisualizado,
} from '@/services/creditos'
import { useRealtime } from '@/hooks/use-realtime'
import { ModalCriarAnuncioCredito } from '@/components/creditos/ModalCriarAnuncioCredito'
import { ModalPedirMaisInformacoes } from '@/components/creditos/ModalPedirMaisInformacoes'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'

export default function MercadoCreditos() {
  const { isAuthenticated, user, isAdmin } = useAuth()

  const [anuncios, setAnuncios] = useState<AnuncioCredito[]>([])
  const [meusPedidos, setMeusPedidos] = useState<PedidoInformacaoCredito[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroOperacao, setFiltroOperacao] = useState<'todos' | 'venda' | 'compra'>('todos')
  const [filtroEsfera, setFiltroEsfera] = useState<'todas' | 'federal' | 'estadual' | 'municipal'>(
    'todas',
  )
  const [filtroTipoCredito, setFiltroTipoCredito] = useState<string>('todos')
  const [filtroUf, setFiltroUf] = useState<string>('todas')
  const [valorMinimo, setValorMinimo] = useState<string>('')
  const [valorMaximo, setValorMaximo] = useState<string>('')
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'maior_valor' | 'menor_valor'>('recentes')
  const [buscaTexto, setBuscaTexto] = useState('')

  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [anuncioSelecionadoParaInfo, setAnuncioSelecionadoParaInfo] =
    useState<AnuncioCredito | null>(null)
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null)

  const carregarDados = async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const lista = await listarAnunciosMercado(isAdmin, user?.id)
      setAnuncios(lista)

      if (user?.id) {
        const pedidos = await listarMeusPedidosUsuario(user.id)
        setMeusPedidos(pedidos)
      }
    } catch (err) {
      console.error('Erro ao carregar mercado de créditos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [isAuthenticated, isAdmin, user?.id])

  // Inscrição em tempo real na coleção 'anuncios_creditos' para refletir edições imediatamente
  useRealtime(
    'anuncios_creditos',
    () => {
      carregarDados()
    },
    isAuthenticated,
  )

  const handleMarcarVisualizado = async (pedidoId: string) => {
    try {
      await marcarPedidoVisualizado(pedidoId)
      setMeusPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, visualizado_pelo_solicitante: true } : p)),
      )
    } catch (err) {
      console.error(err)
    }
  }

  const temFiltroAtivo =
    filtroOperacao !== 'todos' ||
    filtroEsfera !== 'todas' ||
    filtroTipoCredito !== 'todos' ||
    filtroUf !== 'todas' ||
    valorMinimo.trim() !== '' ||
    valorMaximo.trim() !== '' ||
    ordenacao !== 'recentes' ||
    buscaTexto.trim() !== ''

  const limparFiltros = () => {
    setFiltroOperacao('todos')
    setFiltroEsfera('todas')
    setFiltroTipoCredito('todos')
    setFiltroUf('todas')
    setValorMinimo('')
    setValorMaximo('')
    setOrdenacao('recentes')
    setBuscaTexto('')
  }

  // Filtragem e ordenação combinada (E lógico)
  const anunciosFiltrados = anuncios
    .filter((item) => {
      if (filtroOperacao !== 'todos' && item.operacao !== filtroOperacao) {
        return false
      }
      if (filtroEsfera !== 'todas' && item.esfera !== filtroEsfera) {
        return false
      }
      if (filtroTipoCredito !== 'todos') {
        if (item.tipo_credito !== filtroTipoCredito) {
          return false
        }
      }
      if (filtroUf !== 'todas') {
        if (!item.uf || item.uf.toUpperCase() !== filtroUf.toUpperCase()) {
          return false
        }
      }
      if (valorMinimo.trim() !== '') {
        const min = Number(valorMinimo.replace(/\./g, '').replace(',', '.'))
        if (!Number.isNaN(min) && item.valor_nominal < min) {
          return false
        }
      }
      if (valorMaximo.trim() !== '') {
        const max = Number(valorMaximo.replace(/\./g, '').replace(',', '.'))
        if (!Number.isNaN(max) && item.valor_nominal > max) {
          return false
        }
      }
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase()
        const matchTipo = item.tipo_credito?.toLowerCase().includes(q)
        const matchObs = item.observacoes?.toLowerCase().includes(q)
        const matchUf = item.uf?.toLowerCase().includes(q)
        const matchMun = item.municipio?.toLowerCase().includes(q)
        const matchFin = item.finalidade?.toLowerCase().includes(q)
        if (!matchTipo && !matchObs && !matchUf && !matchMun && !matchFin) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (ordenacao === 'maior_valor') {
        return (b.valor_nominal || 0) - (a.valor_nominal || 0)
      }
      if (ordenacao === 'menor_valor') {
        return (a.valor_nominal || 0) - (b.valor_nominal || 0)
      }
      // Padrão: mais recentes primeiro (por created desc)
      return new Date(b.created).getTime() - new Date(a.created).getTime()
    })

  // Se deslogado: Vitrine SEM anúncios e SEM dados sensíveis — apenas CTA para entrar/cadastrar
  if (!isAuthenticated) {
    return (
      <div className="pt-28 pb-20 bg-slate-50 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Header institucional Diamond Group */}
          <div className="rounded-3xl bg-[#07132B] border-2 border-[#D4AF37]/50 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden mb-12">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 mb-4">
                Mesa de Negócios 5.0 • Diamond Group
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
                Mercado de Créditos Tributários & Precatórios
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                Plataforma institucional para negociação e intermediação de precatórios federais,
                estaduais e municipais, RPVs e direitos creditórios, com auditoria prévia, due
                diligence e segurança jurídica absoluta.
              </p>
            </div>
          </div>

          {/* Aviso Legal Obrigatório */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/40 text-xs sm:text-sm text-amber-900 leading-relaxed mb-8">
            <strong className="text-amber-950 block mb-1">Aviso Legal Obrigatório:</strong>
            {AVISO_LEGAL_CREDITOS}
          </div>

          {/* Card de CTA para visitante deslogado */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Acesso Exclusivo para Usuários Cadastrados
            </span>
            <h2 className="font-heading font-bold text-2xl text-slate-900 mb-3">
              Faça login para acessar os anúncios do Mercado de Créditos
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Por razões de conformidade e sigilo comercial das partes envolvidas, os anúncios de
              compra e venda e suas condições de deságio são visíveis apenas para membros conectados
              ao portal Contabilidade 5.0.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white bg-[#07132B] hover:bg-[#0B1E3F] transition-all shadow-md text-center"
              >
                Entrar na Conta
              </Link>
              <Link
                to="/cadastro"
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md text-center"
              >
                Criar Conta Gratuita
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
              Quer conhecer nossa metodologia e os 5 pilares de governança em precatórios?{' '}
              <Link
                to="/servicos/negociacao-creditos-precatorios"
                className="text-[#07132B] font-bold underline hover:text-[#D4AF37]"
              >
                Ver apresentação completa do serviço
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Usuário LOGADO: visualiza a vitrine de resumos sem dados de vendedor/comprador
  return (
    <div className="pt-28 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Banner Superior Diamond Group */}
        <div className="rounded-3xl bg-[#07132B] border-2 border-[#D4AF37]/50 text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                  Mesa de Negócios 5.0
                </span>
                <span className="text-xs text-slate-400">Padrão Diamond Group</span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
                Mercado de Créditos Tributários & Precatórios
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                Vitrine consolidada de ativos de compra e venda (federal, estadual e municipal).
                Seus dados sensíveis permanecem sob sigilo: a intermediação é operada pela mesa
                técnica da Contabilidade 5.0.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalCriarAberto(true)}
                className="px-5 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                + Anunciar Compra / Venda
              </button>
              <Link
                to="/servicos/negociacao-creditos-precatorios"
                className="px-4 py-3 rounded-xl font-heading font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-center"
              >
                Página & Pilares 5.0
              </Link>
            </div>
          </div>
        </div>

        {/* FEEDBACK DE SUCESSO */}
        {feedbackSucesso && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{feedbackSucesso}</span>
            <button
              type="button"
              onClick={() => setFeedbackSucesso(null)}
              className="text-xs px-2 py-1 rounded bg-emerald-200/50 hover:bg-emerald-200 font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* NOTIFICAÇÃO: RESPOSTAS DO ADMIN AOS MEUS PEDIDOS */}
        {meusPedidos.filter((p) => p.status === 'respondido' && !p.visualizado_pelo_solicitante)
          .length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-[#07132B] border-2 border-[#D4AF37] text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Notificação de Resposta da Mesa Técnica
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#07132B] font-extrabold">
                {
                  meusPedidos.filter(
                    (p) => p.status === 'respondido' && !p.visualizado_pelo_solicitante,
                  ).length
                }{' '}
                nova(s)
              </span>
            </div>

            <div className="space-y-2">
              {meusPedidos
                .filter((p) => p.status === 'respondido' && !p.visualizado_pelo_solicitante)
                .map((ped) => (
                  <div
                    key={ped.id}
                    className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        Resposta ao seu pedido de informação sobre o anúncio:
                      </p>
                      <p className="text-[#D4AF37] mt-1 italic">"{ped.resposta_admin}"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarcarVisualizado(ped.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#07132B] text-xs font-bold hover:bg-[#c49f2e] shrink-0 self-start sm:self-auto"
                    >
                      Marcar como Lida
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* AVISO LEGAL OBRIGATÓRIO (SEMPRE VISÍVEL) */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/50 text-xs sm:text-sm text-amber-950 leading-relaxed mb-6">
          <strong className="text-amber-900 block mb-0.5">Aviso Legal Obrigatório:</strong>
          {AVISO_LEGAL_CREDITOS}
        </div>

        {/* PAINEL DE FILTROS DIAMOND GROUP */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6 space-y-4">
          {/* Linha Superior: Operação e Busca Geral */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Operação:</span>
              <button
                type="button"
                onClick={() => setFiltroOperacao('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filtroOperacao === 'todos'
                    ? 'bg-[#07132B] text-[#D4AF37]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos ({anuncios.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroOperacao('venda')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filtroOperacao === 'venda'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Venda ({anuncios.filter((a) => a.operacao === 'venda').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroOperacao('compra')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filtroOperacao === 'compra'
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Compra ({anuncios.filter((a) => a.operacao === 'compra').length})
              </button>
            </div>

            <div className="w-full lg:w-72">
              <input
                type="text"
                placeholder="Buscar por termos, município..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Grid de Filtros: Tipo de Crédito, Estado/UF, Faixa de Valor (Mín/Máx) e Ordenação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {/* 1. Tipo de crédito */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Tipo de Crédito
              </label>
              <select
                value={filtroTipoCredito}
                onChange={(e) => setFiltroTipoCredito(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="todos">Todos os tipos</option>
                {TIPOS_CREDITO_LISTA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Estado / UF */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Estado / UF
              </label>
              <select
                value={filtroUf}
                onChange={(e) => setFiltroUf(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="todas">Todos os estados</option>
                {LISTA_UFS_ICMS.map((item) => (
                  <option key={item.uf} value={item.uf}>
                    {item.uf} — {item.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Faixa de Valor: Valor Mínimo */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Valor Mínimo (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ex: 50.000"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#D4AF37]"
              ></input>
            </div>

            {/* 3. Faixa de Valor: Valor Máximo */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Valor Máximo (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ex: 1.000.000"
                value={valorMaximo}
                onChange={(e) => setValorMaximo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#D4AF37]"
              ></input>
            </div>

            {/* 4. Ordenação */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Ordenação
              </label>
              <select
                value={ordenacao}
                onChange={(e) =>
                  setOrdenacao(e.target.value as 'recentes' | 'maior_valor' | 'menor_valor')
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="recentes">Mais recentes primeiro</option>
                <option value="maior_valor">Maior valor primeiro</option>
                <option value="menor_valor">Menor valor primeiro</option>
              </select>
            </div>
          </div>

          {/* Barra de Status do Filtro & Ações */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {anunciosFiltrados.length === 1
                  ? '1 anúncio encontrado'
                  : `${anunciosFiltrados.length} anúncios encontrados`}
              </span>
              {anuncios.length > 0 && anunciosFiltrados.length !== anuncios.length && (
                <span className="text-slate-500">(de um total de {anuncios.length})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroEsfera}
                onChange={(e) => setFiltroEsfera(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                title="Filtrar por esfera governamental"
              >
                <option value="todas">Todas as Esferas</option>
                <option value="federal">Federal</option>
                <option value="estadual">Estadual</option>
                <option value="municipal">Municipal</option>
              </select>

              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LISTAGEM DE ANÚNCIOS (RESUMOS SEM DADOS SENSÍVEIS) */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Carregando Mercado de Créditos...</p>
          </div>
        ) : anunciosFiltrados.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {temFiltroAtivo
                ? 'Nenhum anúncio atende aos filtros selecionados.'
                : 'Nenhum anúncio publicado no momento.'}
            </p>
            <p className="text-xs text-slate-500 mb-5">
              {temFiltroAtivo
                ? 'Tente ajustar os critérios de tipo de crédito, estado ou faixa de valor.'
                : 'Seja o primeiro a publicar um crédito para venda ou interesse de compra!'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalCriarAberto(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all cursor-pointer"
              >
                Publicar Anúncio
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {anunciosFiltrados.map((item) => {
              const ehVenda = item.operacao === 'venda'
              const ehMeuAnuncio = user?.id && item.user_id === user.id

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ehVenda
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {ehVenda ? 'Oferta de Venda' : 'Demanda de Compra'}
                      </span>

                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                        {item.esfera} {item.uf ? `• ${item.uf}` : ''}
                      </span>
                    </div>

                    {/* Título do Ativo */}
                    <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug">
                      {ehVenda
                        ? item.tipo_credito || 'Crédito Tributário / Precatório'
                        : 'Interesse de Compra / Compensação'}
                    </h3>

                    {/* Situação ou Finalidade */}
                    <div className="text-xs text-slate-600 mb-4 pb-3 border-b border-slate-100">
                      {ehVenda ? (
                        <span>
                          Situação:{' '}
                          <strong className="text-slate-800 capitalize">
                            {item.situacao?.replace('_', ' ') || 'Expedido'}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          Finalidade:{' '}
                          <strong className="text-slate-800 capitalize">
                            {item.finalidade?.replace('_', ' ') || 'Compensar débitos'}
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Valores de Resumo */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          {ehVenda ? 'Valor Nominal:' : 'Valor Disponível:'}
                        </span>
                        <strong className="font-heading font-extrabold text-sm text-slate-900">
                          {formatarMoeda(item.valor_nominal)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          {ehVenda ? 'Deságio Desejado:' : 'Deságio Alvo:'}
                        </span>
                        <strong className="font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37]/20 px-2 py-0.5 rounded border border-[#D4AF37]/40">
                          {formatarPorcentagem(item.desagio_percentual)}
                        </strong>
                      </div>
                    </div>

                    {/* Observações públicas */}
                    {item.observacoes && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3 italic">
                        "{item.observacoes}"
                      </p>
                    )}

                    {/* Status ou Meu Anúncio badge */}
                    {ehMeuAnuncio && (
                      <div className="mb-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                        Seu Anúncio Publicado
                      </div>
                    )}
                  </div>

                  {/* Ação: Botão 'Pedir mais informações' */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAnuncioSelecionadoParaInfo(item)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Pedir mais informações
                    </button>
                    <span className="text-[10px] text-slate-400 block text-center mt-1.5">
                      Intermediação com sigilo total via administradores
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL CRIAR ANÚNCIO */}
      <ModalCriarAnuncioCredito
        aberto={modalCriarAberto}
        aoFechar={() => setModalCriarAberto(false)}
        aoSalvar={() => {
          setFeedbackSucesso('Seu anúncio foi publicado com sucesso no Mercado de Créditos!')
          carregarDados()
        }}
      />

      {/* MODAL PEDIR MAIS INFORMAÇÕES */}
      <ModalPedirMaisInformacoes
        anuncio={anuncioSelecionadoParaInfo}
        aberto={!!anuncioSelecionadoParaInfo}
        aoFechar={() => setAnuncioSelecionadoParaInfo(null)}
        aoSucesso={() => {
          setFeedbackSucesso(
            'Seu pedido de informação foi registrado com sucesso! Nossa mesa técnica responderá em breve e você será notificado aqui no portal.',
          )
          carregarDados()
        }}
      />
    </div>
  )
}
