import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Cliente } from '@/types/cliente'

/**
 * Página "Clientes" — Carteira de Clientes do Contador (~100 clientes)
 * Requisitos:
 * 1) Listagem em cards com dados completos (nome, CNPJ/CPF, UF, segmento, regime atual, e-mail, telefone).
 * 2) Busca por nome, CNPJ/CPF, segmento ou UF.
 * 3) Ação para definir como "Cliente Ativo" imediatamente ou desmarcar.
 * 4) Link para detalhe do histórico do cliente (/clientes/:id).
 * 5) Cadastro e edição via modal.
 * Visual: Padrão Diamond Group (#07132B e #D4AF37).
 * Regra do usuário: SEM ÍCONES — apenas texto, badges e marcadores de status.
 */
export default function Clientes() {
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
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return clientes.filter((c) => {
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

      return atendeBusca && atendeRegime
    })
  }, [clientes, busca, filtroRegime])

  const handleNovoCliente = () => {
    setClienteEditando(null)
    setModalAberto(true)
  }

  const handleEditarCliente = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    setClienteEditando(cliente)
    setModalAberto(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* HEADER DA CARTEIRA DE CLIENTES */}
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
                Carteira de Clientes do Contador
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Centralize o cadastro de empresas atendidas, defina o cliente ativo para carregar na
                Calculadora IBS/CBS e nos Diagnósticos e acesse o histórico completo de simulações.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Campo de Busca */}
          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Buscar por nome, CNPJ/CPF, segmento ou UF..."
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

        {/* LISTA EM CARDS */}
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
              {busca
                ? `Nenhum resultado para o termo "${busca}". Tente limpar o filtro de busca.`
                : 'Você ainda não cadastrou clientes na carteira. Clique no botão acima para adicionar o primeiro.'}
            </p>
            {busca && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBusca('')}
                className="text-xs"
              >
                Limpar Busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clientesFiltrados.map((cliente) => {
              const isAtivo = clienteAtivoId === cliente.id

              return (
                <div
                  key={cliente.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                    isAtivo
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Cabeçalho do Card */}
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

                      {isAtivo ? (
                        <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] text-[10px] font-bold px-2 py-0.5">
                          CLIENTE ATIVO
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-slate-400 border-slate-200 text-[10px]"
                        >
                          Inativo
                        </Badge>
                      )}
                    </div>

                    <h3
                      className="font-heading font-extrabold text-base text-[#07132B] leading-snug line-clamp-2 cursor-pointer hover:underline"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      {cliente.nome}
                    </h3>

                    <div className="text-xs font-mono text-slate-500">
                      CNPJ/CPF: {cliente.cnpj_cpf}
                    </div>
                  </div>

                  {/* Informações Fiscais e Cadastrais */}
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

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Botão de Ativar / Desativar */}
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

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleEditarCliente(cliente, e)}
                        className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <Link
                        to={`/clientes/${cliente.id}`}
                        className="text-xs font-semibold text-[#07132B] hover:text-[#D4AF37] bg-white border border-slate-200 hover:border-[#07132B] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Histórico →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <ModalCliente
        open={modalAberto}
        onOpenChange={setModalAberto}
        clienteParaEditar={clienteEditando}
        onSalvoComSucesso={() => {
          recarregarClientes()
        }}
      />
    </div>
  )
}
