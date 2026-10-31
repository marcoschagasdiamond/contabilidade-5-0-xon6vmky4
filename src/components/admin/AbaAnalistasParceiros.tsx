import React, { useState } from 'react'
import type { AnalistaMetricasItem, ClienteGlobalItem } from '@/types/master'
import { ModalExcluirAnalista } from '@/components/admin/ModalExcluirAnalista'
import { formatarCNPJ } from '@/lib/cnpj'

interface AbaAnalistasParceirosProps {
  analistas: AnalistaMetricasItem[]
  isLoading: boolean
  masterId?: string
  masterNome?: string
  onSelecionarCliente: (cliente: ClienteGlobalItem) => void
  onAtualizar: () => void
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function AbaAnalistasParceiros({
  analistas,
  isLoading,
  masterId,
  masterNome,
  onSelecionarCliente,
  onAtualizar,
  onFeedback,
}: AbaAnalistasParceirosProps) {
  const [busca, setBusca] = useState('')
  const [analistaSelecionadoDrilldown, setAnalistaSelecionadoDrilldown] =
    useState<AnalistaMetricasItem | null>(null)
  const [buscaDrilldown, setBuscaDrilldown] = useState('')
  const [analistaParaExcluir, setAnalistaParaExcluir] = useState<AnalistaMetricasItem | null>(null)

  const analistasFiltrados = analistas.filter((a) => {
    const termo = busca.toLowerCase().trim()
    return (
      !termo ||
      a.name?.toLowerCase().includes(termo) ||
      a.email?.toLowerCase().includes(termo) ||
      a.nivel_acesso?.toLowerCase().includes(termo)
    )
  })

  // Métricas agregadas de analistas
  const totalAnalistas = analistas.length
  const totalClientesCarteiras = analistas.reduce((acc, a) => acc + a.total_clientes, 0)
  const totalDiagsCarteiras = analistas.reduce((acc, a) => acc + a.total_diagnosticos, 0)
  const totalSimsCarteiras = analistas.reduce((acc, a) => acc + a.total_simulacoes, 0)

  // Clientes filtrados no drill-down
  const clientesDrilldown = (analistaSelecionadoDrilldown?.clientes_carteira || []).filter((c) => {
    const termo = buscaDrilldown.toLowerCase().trim()
    return (
      !termo ||
      c.nome?.toLowerCase().includes(termo) ||
      c.empresa?.toLowerCase().includes(termo) ||
      c.cnpj_cpf?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-6">
      {/* KPI CARDS - ANALISTAS & PARCEIROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#07132B] text-white p-5 rounded-2xl border border-[#D4AF37]/30 shadow-md">
          <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold block">
            Total de Analistas
          </span>
          <p className="font-heading font-extrabold text-3xl text-white mt-1">{totalAnalistas}</p>
          <span className="text-[11px] text-slate-300 mt-1 block">Parceiros credenciados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Clientes em Carteiras
          </span>
          <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">
            {totalClientesCarteiras}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Média de {totalAnalistas > 0 ? (totalClientesCarteiras / totalAnalistas).toFixed(1) : 0}{' '}
            por analista
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Diagnósticos Realizados
          </span>
          <p className="font-heading font-extrabold text-3xl text-[#07132B] mt-1">
            {totalDiagsCarteiras}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Laudos gerados por parceiros
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Simulações Concluídas
          </span>
          <p className="font-heading font-extrabold text-3xl text-[#D4AF37] mt-1">
            {totalSimsCarteiras}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Cenários de Reforma Tributária
          </span>
        </div>
      </div>

      {/* SEÇÃO DRILL-DOWN SE ANALISTA ESTIVER SELECIONADO */}
      {analistaSelecionadoDrilldown && (
        <div className="bg-white rounded-2xl border-2 border-[#D4AF37] shadow-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#D4AF37] block">
                Drill-Down da Carteira do Analista
              </span>
              <h3 className="font-heading font-bold text-xl text-[#07132B]">
                {analistaSelecionadoDrilldown.name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {analistaSelecionadoDrilldown.email} • Nível:{' '}
                <span className="font-semibold uppercase">
                  {analistaSelecionadoDrilldown.nivel_acesso}
                </span>
                {analistaSelecionadoDrilldown.escritorio_nome && (
                  <span className="ml-2 font-medium text-slate-800">
                    • Escritório: {analistaSelecionadoDrilldown.escritorio_nome}
                    {analistaSelecionadoDrilldown.escritorio_cnpj &&
                      ` (CNPJ ${formatarCNPJ(analistaSelecionadoDrilldown.escritorio_cnpj)})`}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAnalistaSelecionadoDrilldown(null)
                  setBuscaDrilldown('')
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Fechar Drill-Down
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              placeholder="Filtrar clientes deste analista..."
              value={buscaDrilldown}
              onChange={(e) => setBuscaDrilldown(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
            />
            <span className="text-xs text-slate-500 font-medium">
              {clientesDrilldown.length} cliente(s) na carteira
            </span>
          </div>

          {clientesDrilldown.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
              Nenhum cliente cadastrado na carteira deste analista até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#07132B] text-white uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Cliente / Razão Social</th>
                    <th className="py-3 px-4">CNPJ / CPF</th>
                    <th className="py-3 px-4">Segmento & UF</th>
                    <th className="py-3 px-4">Regime Atual</th>
                    <th className="py-3 px-4 text-center">Diagnósticos</th>
                    <th className="py-3 px-4 text-center">Simulações</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientesDrilldown.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onSelecionarCliente(c)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.nome || c.empresa}
                        {c.email && <div className="text-[11px] text-slate-500">{c.email}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.cnpj_cpf || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.segmento} ({c.uf})
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-800 text-xs">
                          {c.regime_atual}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#07132B]">
                        {c.total_diagnosticos}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#D4AF37]">
                        {c.total_simulacoes}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelecionarCliente(c)
                          }}
                          className="px-3 py-1 rounded bg-[#07132B] text-white text-xs font-semibold"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BARRA DE BUSCA GERAL DE ANALISTAS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <input
            type="text"
            placeholder="Buscar analista por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          />
        </div>

        <button
          type="button"
          onClick={onAtualizar}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          Atualizar Lista
        </button>
      </div>

      {/* TABELA DE ANALISTAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Carregando lista de analistas e parceiros...
          </div>
        ) : analistasFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-slate-700 text-base">Nenhum analista encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#07132B] text-white font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Analista / Parceiro</th>
                  <th className="py-3.5 px-5">Escritório Adquirente</th>
                  <th className="py-3.5 px-5">Nível de Acesso</th>
                  <th className="py-3.5 px-5 text-center">Nº Clientes Carteira</th>
                  <th className="py-3.5 px-5 text-center">Nº Diagnósticos</th>
                  <th className="py-3.5 px-5 text-center">Nº Simulações</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analistasFiltrados.map((item) => {
                  const ehMarco =
                    item.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com' ||
                    item.nivel_acesso === 'master'

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setAnalistaSelecionadoDrilldown(item)}
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </td>

                      <td className="py-4 px-5">
                        {item.escritorio_nome ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block text-xs">
                              {item.escritorio_nome}
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.escritorio_cnpj
                                ? `CNPJ ${formatarCNPJ(item.escritorio_cnpj)}`
                                : item.escritorio_cidade && item.escritorio_uf
                                  ? `${item.escritorio_cidade} - ${item.escritorio_uf}`
                                  : 'Cadastrado'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Não cadastrado</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            item.nivel_acesso === 'master'
                              ? 'bg-[#D4AF37] text-[#07132B]'
                              : item.nivel_acesso === 'admin'
                                ? 'bg-[#07132B] text-white'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.nivel_acesso}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-slate-900 text-base">
                          {item.total_clientes}
                        </span>
                        <span className="text-xs text-slate-500 block">clientes</span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-[#07132B] text-base">
                          {item.total_diagnosticos}
                        </span>
                        <span className="text-xs text-slate-500 block">diagnósticos</span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-[#D4AF37] text-base">
                          {item.total_simulacoes}
                        </span>
                        <span className="text-xs text-slate-500 block">simulações</span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAnalistaSelecionadoDrilldown(item)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] text-xs font-bold transition-colors"
                          >
                            Abrir Carteira ({item.total_clientes})
                          </button>

                          {!ehMarco ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAnalistaParaExcluir(item)
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                              title="Excluir analista e transferir carteira"
                            >
                              Excluir Analista
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium px-2">
                              Master
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE TRANSFERIR CARTEIRA E EXCLUIR ANALISTA */}
      <ModalExcluirAnalista
        open={!!analistaParaExcluir}
        onOpenChange={(open) => {
          if (!open) setAnalistaParaExcluir(null)
        }}
        analista={analistaParaExcluir}
        todosAnalistas={analistas}
        masterId={masterId}
        masterNome={masterNome}
        onSucesso={(msg) => {
          setAnalistaParaExcluir(null)
          if (analistaSelecionadoDrilldown?.id === analistaParaExcluir?.id) {
            setAnalistaSelecionadoDrilldown(null)
          }
          onAtualizar()
          if (onFeedback) {
            onFeedback({ tipo: 'sucesso', mensagem: msg })
          }
        }}
        onErro={(msg) => {
          if (onFeedback) {
            onFeedback({ tipo: 'erro', mensagem: msg })
          }
        }}
      />
    </div>
  )
}
