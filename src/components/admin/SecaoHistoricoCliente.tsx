import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  History,
  RefreshCw,
  FileSpreadsheet,
  Calculator,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import type { ClienteGlobalItem } from '@/types/master'
import {
  listarHistoricoCompletoPorCliente,
  type EventoHistoricoCliente,
} from '@/services/historicoCliente'

interface SecaoHistoricoClienteProps {
  cliente: ClienteGlobalItem
}

export function SecaoHistoricoCliente({ cliente }: SecaoHistoricoClienteProps) {
  const [eventos, setEventos] = useState<EventoHistoricoCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const carregarHistorico = async () => {
    setCarregando(true)
    try {
      const lista = await listarHistoricoCompletoPorCliente(cliente)
      setEventos(lista)
    } catch (err) {
      console.error('Erro ao carregar histórico do cliente:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarHistorico()
  }, [cliente.id, cliente.cnpj_cpf])

  const eventosFiltrados = eventos.filter((ev) => {
    if (filtroTipo === 'todos') return true
    return ev.tipo === filtroTipo
  })

  const formatarDataPtBr = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const getIconeEvento = (tipo: EventoHistoricoCliente['tipo']) => {
    switch (tipo) {
      case 'criacao_cliente':
        return <UserCheck className="w-4 h-4 text-emerald-600" />
      case 'edicao_dados':
        return <Building className="w-4 h-4 text-[#D4AF37]" />
      case 'simulacao':
        return <Calculator className="w-4 h-4 text-blue-600" />
      case 'relatorio':
        return <FileSpreadsheet className="w-4 h-4 text-purple-600" />
      default:
        return <History className="w-4 h-4 text-slate-600" />
    }
  }

  const getBadgeTipo = (tipo: EventoHistoricoCliente['tipo']) => {
    switch (tipo) {
      case 'criacao_cliente':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px] font-bold">
            Criação de Cadastro
          </Badge>
        )
      case 'edicao_dados':
        return (
          <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200 text-[10px] font-bold">
            Edição de Dados
          </Badge>
        )
      case 'simulacao':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-[10px] font-bold">
            Simulação Salva
          </Badge>
        )
      case 'relatorio':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 text-[10px] font-bold">
            Relatório Gerado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-bold">
            Registro
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <h3 className="font-heading font-bold text-sm text-[#07132B]">
              Histórico & Trilha de Auditoria do Cliente
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico de todas as modificações: quem alterou (nome, e-mail e nível), o
            que mudou e quando.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={carregarHistorico}
            disabled={carregando}
            className="text-xs font-bold border-slate-300 text-slate-700 h-8 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Filtrar:
        </span>
        <button
          type="button"
          onClick={() => setFiltroTipo('todos')}
          className={`px-2.5 py-1 rounded-md font-bold transition-all text-xs ${
            filtroTipo === 'todos'
              ? 'bg-[#07132B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({eventos.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroTipo('edicao_dados')}
          className={`px-2.5 py-1 rounded-md font-bold transition-all text-xs ${
            filtroTipo === 'edicao_dados'
              ? 'bg-[#07132B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Edições ({eventos.filter((e) => e.tipo === 'edicao_dados').length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroTipo('simulacao')}
          className={`px-2.5 py-1 rounded-md font-bold transition-all text-xs ${
            filtroTipo === 'simulacao'
              ? 'bg-[#07132B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Simulações ({eventos.filter((e) => e.tipo === 'simulacao').length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroTipo('relatorio')}
          className={`px-2.5 py-1 rounded-md font-bold transition-all text-xs ${
            filtroTipo === 'relatorio'
              ? 'bg-[#07132B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Relatórios ({eventos.filter((e) => e.tipo === 'relatorio').length})
        </button>
      </div>

      {/* TIMELINE CRONOLÓGICA */}
      {carregando ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Carregando histórico do cliente...</p>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Nenhum evento registrado ainda</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quando este cliente tiver dados editados, simulações salvas ou relatórios gerados por
            analistas ou pelo master, a timeline detalhada aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {eventosFiltrados.map((item) => (
            <div key={item.id} className="relative group">
              {/* Ponto na timeline */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#07132B] flex items-center justify-center shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              </div>

              {/* CARD DO EVENTO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all">
                {/* TOPO: DATA, TIPO E ORIGEM */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#07132B]">
                      {formatarDataPtBr(item.dataHora)}
                    </span>
                    {getBadgeTipo(item.tipo)}
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {item.origem}
                    </span>
                  </div>

                  {/* IDENTIFICAÇÃO DO AUTOR */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">Por:</span>
                    <span className="font-bold text-slate-900">{item.autorNome}</span>
                    {item.autorNivel && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold text-slate-600 border-slate-300 px-1.5 py-0"
                      >
                        {item.autorNivel}
                      </Badge>
                    )}
                    {item.autorEmail && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({item.autorEmail})
                      </span>
                    )}
                  </div>
                </div>

                {/* TÍTULO E DESCRIÇÃO */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {getIconeEvento(item.tipo)}
                    {item.titulo}
                  </h4>
                  {item.descricao && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.descricao}</p>
                  )}
                </div>

                {/* TABELA DE DIFF ANTES -> DEPOIS (QUANDO DISPONÍVEL) */}
                {Array.isArray(item.alteracoes) && item.alteracoes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Campos Alterados ({item.alteracoes.length}):
                    </span>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#07132B] text-white text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="py-1.5 px-2.5 font-bold">Campo</th>
                            <th className="py-1.5 px-2.5 font-bold text-rose-300">Antes</th>
                            <th className="py-1.5 px-2.5 font-bold text-emerald-300">Depois</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {item.alteracoes.map((alt, aIdx) => (
                            <tr key={aIdx} className="hover:bg-slate-50/70">
                              <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                                {alt.rotulo || alt.campo}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600 line-through decoration-rose-400 bg-rose-50/20 font-mono text-[11px]">
                                {alt.valorAnteriorFormatado || String(alt.valorAnterior ?? '—')}
                              </td>
                              <td className="py-1.5 px-2.5 text-emerald-800 font-bold bg-emerald-50/20 font-mono text-[11px]">
                                {alt.valorNovoFormatado || String(alt.valorNovo ?? '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
