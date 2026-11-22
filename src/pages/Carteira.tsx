import React, { useCallback, useState, useMemo } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import {
  ModalConvidarCliente,
  ListaConvitesPendentes,
} from '@/components/clientes/ModalConvidarCliente'
import { listarConvitesAnalista, ConviteCliente } from '@/services/planos'
import {
  useModoVisualizacaoCarteira,
  TIPOS_TECNICOS,
  TIPO_TODOS,
  MODOS_ORDEM,
  rotuloModo,
} from '@/hooks/useAgrupamentoCarteira'
import { AgrupamentoPorTecnico } from '@/components/carteira/AgrupamentoPorTecnico'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalGrupoEconomico } from '@/components/carteira/ModalGrupoEconomico'
import { ModalSuporteCliente } from '@/components/carteira/ModalSuporteCliente'
import type { Cliente } from '@/types/cliente'

/**
 * Página "Carteira" — LISTA ÚNICA de clientes (unificação de "Carteira de Clientes" + "Meus Clientes").
 * Requisitos:
 * 1) Lista única em cards com todos os clientes, badge do estágio do funil e badge "Cliente Ativo".
 * 2) Busca por nome/CNPJ/CPF (e segmento/UF) + filtro por estágio do funil no topo.
 * 3) Ações rápidas por card: abrir dossiê (/clientes/:id), definir como Cliente Ativo, ir para Diagnóstico.
 * 4) A rota antiga /clientes redireciona para cá (ver App.tsx — RedirecionarParaCarteira).
 * 5) Proteção de acesso preservada: os clientes vêm do ClienteAtivoContext (listarClientes, com
 *    filtro por user_id/logado) — nenhum cliente de outro usuário aparece.
 * Visual: Padrão Diamond Group (#07132B e #D4AF37). Regra do usuário: SEM ÍCONES — apenas texto.
 */

const ESTAGIOS_FUNIL: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'lead', label: 'Lead' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'cliente_ativo', label: 'Cliente Ativo' },
  { id: 'descartado', label: 'Descartado' },
]

const ROTULO_ESTAGIO: Record<string, string> = {
  lead: 'Lead',
  diagnostico: 'Diagnóstico',
  proposta: 'Proposta',
  cliente_ativo: 'Cliente Ativo',
  descartado: 'Descartado',
}

function classeBadgeEstagio(estagio?: string): string {
  switch (estagio) {
    case 'cliente_ativo':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'proposta':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'diagnostico':
      return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'lead':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'descartado':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

export default function Carteira() {
  const navigate = useNavigate()
  const {
    clientes,
    carregando,
    clienteAtivoId,
    selecionarClienteAtivo,
    limparClienteAtivo,
    recarregarClientes,
  } = useClienteAtivo()

  const [busca, setBusca] = useState('')
  const [filtroRegime, setFiltroRegime] = useState<string>('todos')
  const [filtroEstagio, setFiltroEstagio] = useState<string>('todos')
  const { modo, setModo, tipoTecnico, setTipoTecnico, tecnicos } = useModoVisualizacaoCarteira(
    useMemo(() => clientes.map((c) => c.user_id).filter(Boolean) as string[], [clientes]),
  )

  const [modalAberto, setModalAberto] = useState(false)
  const [modalConviteAberto, setModalConviteAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [clienteParaConvidar, setClienteParaConvidar] = useState<Cliente | null>(null)
  const [convites, setConvites] = useState<ConviteCliente[]>([])
  const [clienteGeAberto, setClienteGeAberto] = useState<Cliente | null>(null)
  const [clienteSuporteAberto, setClienteSuporteAberto] = useState<Cliente | null>(null)

  const carregarConvites = React.useCallback(async () => {
    try {
      const records = await listarConvitesAnalista()
      setConvites(records)
    } catch (e) {
      console.warn('Erro ao carregar convites:', e)
    }
  }, [])

  React.useEffect(() => {
    carregarConvites()
  }, [carregarConvites])

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return clientes.filter((c) => {
      const atendeTecnico = tipoTecnico === TIPO_TODOS || c.user_id === tipoTecnico
      if (!atendeTecnico) return false

      const atendeBusca =
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        c.cnpj_cpf.toLowerCase().includes(termo) ||
        c.uf.toLowerCase().includes(termo) ||
        c.segmento.toLowerCase().includes(termo) ||
        c.regime_atual.toLowerCase().includes(termo) ||
        (c.email && c.email.toLowerCase().includes(termo))

      const atendeRegime =
        filtroRegime === 'todos' ||
        c.regime_atual.toLowerCase().includes(filtroRegime.toLowerCase())

      const atendeEstagio =
        filtroEstagio === 'todos' || (c.estagio_funil ?? 'lead') === filtroEstagio

      return atendeBusca && atendeRegime && atendeEstagio
    })
  }, [clientes, busca, filtroRegime, filtroEstagio, tipoTecnico])

  const handleNovoCliente = () => {
    setClienteEditando(null)
    setModalAberto(true)
  }

  const handleEditarCliente = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    setClienteEditando(cliente)
    setModalAberto(true)
  }

  const handleIrParaDiagnostico = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    selecionarClienteAtivo(cliente.id)
    navigate('/diagnostico')
  }

  const handleAbrirGrupoEconomico = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    setClienteGeAberto(cliente)
  }

  const handleAbrirSuporte = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    setClienteSuporteAberto(cliente)
  }

  // Card do cliente — extraído como callback para ser reutilizado pelo
  // componente de agrupamento por técnico (e pelo modo 'Todos').
  const renderCard = (cliente: Cliente) => {
    const isAtivo = clienteAtivoId === cliente.id
    const estagio = cliente.estagio_funil ?? 'lead'
    return (
      <div
        key={cliente.id}
        className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
          isAtivo
            ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-amber-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isAtivo ? 'bg-[#D4AF37] animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                UF: {cliente.uf}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 ${classeBadgeEstagio(estagio)}`}
            >
              {ROTULO_ESTAGIO[estagio] ?? estagio}
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-heading font-extrabold text-base text-[#07132B] leading-snug line-clamp-2 cursor-pointer hover:underline"
              onClick={() => navigate(`/clientes/${cliente.id}`)}
            >
              {cliente.nome}
            </h3>
            {isAtivo && (
              <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] text-[10px] font-bold px-2 py-0.5 shrink-0">
                CLIENTE ATIVO
              </Badge>
            )}
          </div>
          <div className="text-xs font-mono text-slate-500">CNPJ/CPF: {cliente.cnpj_cpf}</div>
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Regime:</span>
            <span className="font-semibold text-slate-800">{cliente.regime_atual}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Segmento:</span>
            <span className="font-semibold text-slate-800">{cliente.segmento}</span>
          </div>
          {cliente.email && (
            <div className="flex items-center justify-between text-slate-600 truncate">
              <span className="text-slate-500">E-mail:</span>
              <span className="truncate max-w-[190px]" title={cliente.email}>
                {cliente.email}
              </span>
            </div>
          )}
          {cliente.telefone && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Telefone:</span>
              <span>{cliente.telefone}</span>
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <Link
            to={`/clientes/${cliente.id}`}
            className="text-xs font-semibold text-[#07132B] hover:text-[#D4AF37] bg-white border border-slate-200 hover:border-[#07132B] px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Dossiê →
          </Link>
          {isAtivo ? (
            <button
              type="button"
              onClick={() => limparClienteAtivo()}
              className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Desativar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => selecionarClienteAtivo(cliente.id)}
              className="text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 border border-[#D4AF37]/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Tornar Ativo
            </button>
          )}
          <button
            type="button"
            onClick={(e) => handleIrParaDiagnostico(cliente, e)}
            className="text-xs font-bold text-white bg-[#07132B] hover:bg-[#0d2350] px-3 py-1.5 rounded-lg transition-colors"
            title="Define como Cliente Ativo e abre o Diagnóstico"
          >
            Diagnóstico
          </button>
          <button
            type="button"
            onClick={(e) => handleAbrirGrupoEconomico(cliente, e)}
            className="text-xs font-bold text-[#D4AF37] hover:text-white bg-[#07132B] hover:bg-[#0d2350] border border-[#D4AF37]/50 px-3 py-1.5 rounded-lg transition-colors"
            title="Abre o Grupo Econômico do cliente (árvore + faturamento vs teto do Simples) — somente leitura"
          >
            GE
          </button>
          <button
            type="button"
            onClick={(e) => handleAbrirSuporte(cliente, e)}
            className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition-colors"
            title="Abre o Suporte com IA já contextualizado com os dados deste cliente (nome, CNPJ, regime e estágio do funil)"
          >
            Suporte
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setClienteParaConvidar(cliente)
                setModalConviteAberto(true)
              }}
              className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] bg-amber-50 hover:bg-amber-100 border border-[#D4AF37]/40 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Convidar empresário por e-mail"
            >
              Convidar
            </button>
            <button
              type="button"
              onClick={(e) => handleEditarCliente(cliente, e)}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg font-medium transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* HEADER DA CARTEIRA */}
      <section className="relative py-10 sm:py-14 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  Módulo de Gestão Contábil • Carteira de Clientes
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                Carteira de Clientes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Lista única de todos os seus clientes: defina o cliente ativo, acompanhe o estágio
                do funil, abra o dossiê completo ou siga direto para o Diagnóstico.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  setClienteParaConvidar(null)
                  setModalConviteAberto(true)
                }}
                className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
              >
                Convidar Cliente
              </Button>
              <Button
                type="button"
                onClick={handleNovoCliente}
                className="bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md"
              >
                + Cadastrar Novo Cliente
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ÁREA DE BUSCA, FILTROS E CONTAGEM */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="w-full md:w-96">
              <Input
                type="text"
                placeholder="Buscar por nome ou CNPJ/CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="text-xs h-10 border-slate-200"
              />
            </div>

            {/* Filtros rápidos de regime */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 mr-1">Regime:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'simples', label: 'Simples' },
                { id: 'presumido', label: 'Presumido' },
                { id: 'real', label: 'Lucro Real' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setFiltroRegime(reg.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filtroRegime === reg.id
                      ? 'bg-[#07132B] text-[#D4AF37] font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>

            {/* Contador */}
            <div className="text-xs text-slate-500 font-medium">
              Exibindo <strong>{clientesFiltrados.length}</strong> de{' '}
              <strong>{clientes.length}</strong> clientes
            </div>
          </div>

          {/* Seletor de modo de visualização + filtro por técnico */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Visualização:</span>
            {MODOS_ORDEM.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModo(m.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  modo === m.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rotuloModo(m.id)}
              </button>
            ))}
            <span className="text-xs font-semibold text-slate-500 ml-2">Técnico:</span>
            <select
              value={tipoTecnico}
              onChange={(e) => setTipoTecnico(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300 transition-colors"
            >
              {TIPOS_TECNICOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              {Object.entries(tecnicos).map(([id, nome]) => (
                <option key={id} value={id}>
                  {nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estágio do funil */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Estágio do Funil:</span>
            {ESTAGIOS_FUNIL.map((est) => (
              <button
                key={est.id}
                type="button"
                onClick={() => setFiltroEstagio(est.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filtroEstagio === est.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {est.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA ÚNICA EM CARDS */}
        {carregando ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando carteira de clientes...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <span className="text-sm font-bold text-[#07132B] block">
              Nenhum cliente encontrado
            </span>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {busca || filtroEstagio !== 'todos' || filtroRegime !== 'todos'
                ? 'Nenhum resultado para os filtros aplicados. Tente limpá-los.'
                : 'Você ainda não cadastrou clientes na carteira. Clique no botão acima para adicionar o primeiro.'}
            </p>
            {(busca || filtroEstagio !== 'todos' || filtroRegime !== 'todos') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBusca('')
                  setFiltroEstagio('todos')
                  setFiltroRegime('todos')
                }}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <AgrupamentoPorTecnico
            modo={modo}
            tipoTecnico={tipoTecnico}
            tecnicos={tecnicos}
            clientesFiltrados={clientesFiltrados}
            renderCard={renderCard}
          />
        )}

        {/* LISTA DE CONVITES PENDENTES & REENVIO */}
        <ListaConvitesPendentes convites={convites} aoReenviarSucesso={() => carregarConvites()} />
      </div>

      {/* MODAL DE CONVIDAR CLIENTE */}
      <ModalConvidarCliente
        aberto={modalConviteAberto}
        aoFechar={() => setModalConviteAberto(false)}
        cliente={clienteParaConvidar}
        clientesDisponiveis={clientes}
        aoConviteEnviado={() => carregarConvites()}
      />

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <ModalCliente
        open={modalAberto}
        onOpenChange={setModalAberto}
        clienteParaEditar={clienteEditando}
        onSalvoComSucesso={() => {
          recarregarClientes()
        }}
      />

      {/* MODAL GRUPO ECONÔMICO (GE) — consulta rápida, somente leitura */}
      <ModalGrupoEconomico
        aberto={clienteGeAberto !== null}
        aoFechar={() => setClienteGeAberto(null)}
        cliente={clienteGeAberto}
      />

      {/* MODAL SUPORTE — resolve a empresa do cliente e abre o chat de suporte
          existente (agente assistente-suporte-50) com o contexto do card */}
      <ModalSuporteCliente
        aberto={clienteSuporteAberto !== null}
        aoFechar={() => setClienteSuporteAberto(null)}
        cliente={clienteSuporteAberto}
      />
    </div>
  )
}

/**
 * Redirecionamento da rota antiga de "Meus Clientes" (/clientes) para a Carteira unificada.
 * Links e atalhos salvos continuam funcionando.
 */
export function RedirecionarParaCarteira() {
  return <Navigate to="/carteira" replace />
}
