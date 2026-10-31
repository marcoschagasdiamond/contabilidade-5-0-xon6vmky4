import React, { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listarHistoricoSimulacao, formatarDataHistorico } from '@/services/historicoSimulacoes'
import type {
  HistoricoSimulacaoRegistro,
  ItemAlteracaoCampo,
  TipoEventoHistorico,
} from '@/types/historicoSimulacoes'
import type { ItemSimulacaoUnificado } from '@/services/dashboardSimulacoes'

interface ModalCompararHistoricosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  simulacaoA: ItemSimulacaoUnificado | null
  simulacaoB: ItemSimulacaoUnificado | null
  todasSimulacoesDisponiveis?: ItemSimulacaoUnificado[]
  onTrocarSimulacaoA?: (nova: ItemSimulacaoUnificado) => void
  onTrocarSimulacaoB?: (nova: ItemSimulacaoUnificado) => void
}

function getBadgeEvento(tipo: TipoEventoHistorico) {
  switch (tipo) {
    case 'criacao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
          Criação
        </span>
      )
    case 'renomeacao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
          Renomeação
        </span>
      )
    case 'edicao_parametros':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50">
          Parâmetros Alterados
        </span>
      )
    case 'exclusao':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 border border-rose-300">
          Exclusão
        </span>
      )
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700">
          Registro
        </span>
      )
  }
}

export function ModalCompararHistoricos({
  open,
  onOpenChange,
  simulacaoA,
  simulacaoB,
  todasSimulacoesDisponiveis = [],
  onTrocarSimulacaoA,
  onTrocarSimulacaoB,
}: ModalCompararHistoricosProps) {
  const [historicoA, setHistoricoA] = useState<HistoricoSimulacaoRegistro[]>([])
  const [historicoB, setHistoricoB] = useState<HistoricoSimulacaoRegistro[]>([])
  const [carregando, setCarregando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  useEffect(() => {
    if (!open || !simulacaoA || !simulacaoB) {
      setHistoricoA([])
      setHistoricoB([])
      return
    }

    let ativo = true
    setCarregando(true)

    Promise.all([listarHistoricoSimulacao(simulacaoA.id), listarHistoricoSimulacao(simulacaoB.id)])
      .then(([dadosA, dadosB]) => {
        if (!ativo) return
        setHistoricoA(dadosA)
        setHistoricoB(dadosB)
      })
      .catch((err) => {
        console.error('Erro ao carregar históricos para comparação:', err)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [open, simulacaoA?.id, simulacaoB?.id])

  // Estatísticas do histórico A
  const statsA = useMemo(() => {
    const totalEventos = historicoA.length
    const edicoesParametros = historicoA.filter((h) => h.tipo_evento === 'edicao_parametros').length
    const renomeacoes = historicoA.filter((h) => h.tipo_evento === 'renomeacao').length
    const autoresUnicos = Array.from(new Set(historicoA.map((h) => h.autor_nome).filter(Boolean)))
    const ultimaAtualizacao = historicoA[0]?.created
    return {
      totalEventos,
      edicoesParametros,
      renomeacoes,
      autoresUnicos,
      ultimaAtualizacao,
    }
  }, [historicoA])

  // Estatísticas do histórico B
  const statsB = useMemo(() => {
    const totalEventos = historicoB.length
    const edicoesParametros = historicoB.filter((h) => h.tipo_evento === 'edicao_parametros').length
    const renomeacoes = historicoB.filter((h) => h.tipo_evento === 'renomeacao').length
    const autoresUnicos = Array.from(new Set(historicoB.map((h) => h.autor_nome).filter(Boolean)))
    const ultimaAtualizacao = historicoB[0]?.created
    return {
      totalEventos,
      edicoesParametros,
      renomeacoes,
      autoresUnicos,
      ultimaAtualizacao,
    }
  }, [historicoB])

  // Comparação de estatísticas destacada
  const analiseComparativa = useMemo(() => {
    let diferencaEdicoesTexto = 'Ambas possuem o mesmo número de modificações de parâmetros.'
    if (statsA.edicoesParametros > statsB.edicoesParametros) {
      const diff = statsA.edicoesParametros - statsB.edicoesParametros
      diferencaEdicoesTexto = `Simulação A teve ${diff} alteração(ões) de parâmetros a mais que a Simulação B.`
    } else if (statsB.edicoesParametros > statsA.edicoesParametros) {
      const diff = statsB.edicoesParametros - statsA.edicoesParametros
      diferencaEdicoesTexto = `Simulação B teve ${diff} alteração(ões) de parâmetros a mais que a Simulação A.`
    }

    let diferencaTotalEventosTexto = 'Mesmo total de eventos registrados em ambas.'
    if (statsA.totalEventos > statsB.totalEventos) {
      diferencaTotalEventosTexto = `Simulação A acumula histórico mais longo (${statsA.totalEventos} vs ${statsB.totalEventos} eventos).`
    } else if (statsB.totalEventos > statsA.totalEventos) {
      diferencaTotalEventosTexto = `Simulação B acumula histórico mais longo (${statsB.totalEventos} vs ${statsA.totalEventos} eventos).`
    }

    return {
      diferencaEdicoesTexto,
      diferencaTotalEventosTexto,
    }
  }, [statsA, statsB])

  // Filtro de eventos
  const filtradosA = useMemo(() => {
    if (filtroTipo === 'todos') return historicoA
    return historicoA.filter((h) => h.tipo_evento === filtroTipo)
  }, [historicoA, filtroTipo])

  const filtradosB = useMemo(() => {
    if (filtroTipo === 'todos') return historicoB
    return historicoB.filter((h) => h.tipo_evento === filtroTipo)
  }, [historicoB, filtroTipo])

  if (!simulacaoA || !simulacaoB) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] flex flex-col p-0 border border-[#D4AF37]/30 bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Cabeçalho Diamond Group (Navy/Dourado) */}
        <div className="bg-[#07132B] text-white p-5 border-b border-[#D4AF37]/30 relative shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 uppercase mb-2">
              AUDITORIA COMPARATIVA DE SIMULAÇÕES
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
              Comparação de Histórico de Alterações
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 mt-1 max-w-3xl">
              Compare lado a lado as linhas do tempo de duas simulações, auditando as modificações
              de parâmetros, diffs "de → para", responsáveis e intensidade de edições.
            </DialogDescription>
          </div>

          {/* Destaque comparativo das duas simulações e seletores de troca rápida */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna Simulação A */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  Simulação A
                </span>
                <Badge variant="outline" className="border-white/20 text-slate-300 text-[10px]">
                  {simulacaoA.tipo === 'calculadora'
                    ? 'Calculadora IBS/CBS'
                    : 'Recuperador Créditos'}
                </Badge>
              </div>

              {todasSimulacoesDisponiveis.length > 2 && onTrocarSimulacaoA ? (
                <div className="mt-1">
                  <Select
                    value={simulacaoA.id}
                    onValueChange={(idEscolhido) => {
                      const achada = todasSimulacoesDisponiveis.find((s) => s.id === idEscolhido)
                      if (achada) onTrocarSimulacaoA(achada)
                    }}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-black/30 border-white/20 text-white truncate">
                      <SelectValue placeholder="Selecione a Simulação A" />
                    </SelectTrigger>
                    <SelectContent>
                      {todasSimulacoesDisponiveis.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id}
                          disabled={item.id === simulacaoB.id}
                          className="text-xs"
                        >
                          {item.nome} ({item.empresa || 'Sem empresa'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <h4 className="text-sm font-bold text-white truncate">{simulacaoA.nome}</h4>
              )}

              <div className="mt-2 text-[11px] text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  Empresa: <strong className="text-white">{simulacaoA.empresa || '-'}</strong>
                </span>
                <span>
                  Regime: <strong className="text-white">{simulacaoA.regime || '-'}</strong>
                </span>
              </div>
            </div>

            {/* Coluna Simulação B */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded border border-blue-400/30">
                  Simulação B
                </span>
                <Badge variant="outline" className="border-white/20 text-slate-300 text-[10px]">
                  {simulacaoB.tipo === 'calculadora'
                    ? 'Calculadora IBS/CBS'
                    : 'Recuperador Créditos'}
                </Badge>
              </div>

              {todasSimulacoesDisponiveis.length > 2 && onTrocarSimulacaoB ? (
                <div className="mt-1">
                  <Select
                    value={simulacaoB.id}
                    onValueChange={(idEscolhido) => {
                      const achada = todasSimulacoesDisponiveis.find((s) => s.id === idEscolhido)
                      if (achada) onTrocarSimulacaoB(achada)
                    }}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-black/30 border-white/20 text-white truncate">
                      <SelectValue placeholder="Selecione a Simulação B" />
                    </SelectTrigger>
                    <SelectContent>
                      {todasSimulacoesDisponiveis.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id}
                          disabled={item.id === simulacaoA.id}
                          className="text-xs"
                        >
                          {item.nome} ({item.empresa || 'Sem empresa'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <h4 className="text-sm font-bold text-white truncate">{simulacaoB.nome}</h4>
              )}

              <div className="mt-2 text-[11px] text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  Empresa: <strong className="text-white">{simulacaoB.empresa || '-'}</strong>
                </span>
                <span>
                  Regime: <strong className="text-white">{simulacaoB.regime || '-'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Destaque de Estatísticas Comparativas */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          {/* Quadro Comparativo de Métricas do Histórico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Total de Eventos
              </span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[#D4AF37] font-bold text-sm">
                  {statsA.totalEventos} na Sim. A
                </span>
                <span className="text-slate-400 text-[10px]">vs</span>
                <span className="text-blue-900 font-bold text-sm">
                  {statsB.totalEventos} na Sim. B
                </span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Edições de Parâmetros
              </span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[#D4AF37] font-bold text-sm">
                  {statsA.edicoesParametros} na Sim. A
                </span>
                <span className="text-slate-400 text-[10px]">vs</span>
                <span className="text-blue-900 font-bold text-sm">
                  {statsB.edicoesParametros} na Sim. B
                </span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Renomeações
              </span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-slate-700 font-semibold">{statsA.renomeacoes}</span>
                <span className="text-slate-400 text-[10px]">vs</span>
                <span className="text-slate-700 font-semibold">{statsB.renomeacoes}</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Responsáveis / Autores
              </span>
              <div className="mt-1 flex items-baseline justify-between text-[11px] truncate">
                <span
                  className="font-semibold text-slate-700"
                  title={statsA.autoresUnicos.join(', ')}
                >
                  {statsA.autoresUnicos.length || 0} pessoa(s)
                </span>
                <span className="text-slate-400 text-[10px]">vs</span>
                <span
                  className="font-semibold text-slate-700"
                  title={statsB.autoresUnicos.join(', ')}
                >
                  {statsB.autoresUnicos.length || 0} pessoa(s)
                </span>
              </div>
            </div>
          </div>

          {/* Síntese em linguagem natural Diamond */}
          <div className="bg-[#07132B]/5 border border-[#D4AF37]/30 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-700">
              <strong className="text-[#07132B] font-bold">Diagnóstico comparativo: </strong>
              <span>{analiseComparativa.diferencaEdicoesTexto} </span>
              <span className="text-slate-500">
                {analiseComparativa.diferencaTotalEventosTexto}
              </span>
            </div>

            {/* Filtros de eventos */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 font-semibold text-[11px]">Filtrar:</span>
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filtroTipo === 'todos'
                    ? 'bg-[#07132B] text-[#D4AF37]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('edicao_parametros')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filtroTipo === 'edicao_parametros'
                    ? 'bg-[#07132B] text-[#D4AF37]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Parâmetros
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('renomeacao')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filtroTipo === 'renomeacao'
                    ? 'bg-[#07132B] text-[#D4AF37]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Renomeação
              </button>
            </div>
          </div>
        </div>

        {/* Linhas do Tempo Lado a Lado (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {carregando ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <div className="inline-block w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="font-semibold text-slate-700">
                Carregando históricos das duas simulações...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna A */}
              <div className="space-y-4">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs py-2 border-b border-[#D4AF37]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                    <h3 className="font-heading font-bold text-sm text-[#07132B] truncate max-w-[240px]">
                      {simulacaoA.nome}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {filtradosA.length} {filtradosA.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {filtradosA.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    Nenhum evento registrado nesta simulação.
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4AF37]/30">
                    {filtradosA.map((item, idx) => (
                      <CardEventoHistorico
                        key={item.id || idx}
                        item={item}
                        bordaDestaque="dourada"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna B */}
              <div className="space-y-4">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs py-2 border-b border-blue-400/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                    <h3 className="font-heading font-bold text-sm text-[#07132B] truncate max-w-[240px]">
                      {simulacaoB.nome}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {filtradosB.length} {filtradosB.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {filtradosB.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    Nenhum evento registrado nesta simulação.
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-300/40">
                    {filtradosB.map((item, idx) => (
                      <CardEventoHistorico key={item.id || idx} item={item} bordaDestaque="azul" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Diamond */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-500">
            Comparação imutável com rastreamento auditável de responsáveis e carimbos de tempo.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs bg-white text-slate-700 border-slate-300 font-semibold"
          >
            Fechar Comparação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CardEventoHistorico({
  item,
  bordaDestaque,
}: {
  item: HistoricoSimulacaoRegistro
  bordaDestaque: 'dourada' | 'azul'
}) {
  const temAlteracoes = item.alteracoes_json && item.alteracoes_json.length > 0

  return (
    <div className="relative group">
      {/* Marcador na linha do tempo */}
      <div
        className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
          bordaDestaque === 'dourada'
            ? 'bg-[#07132B] border-2 border-[#D4AF37]'
            : 'bg-blue-950 border-2 border-blue-400'
        }`}
      />

      <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 transition-all text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-200">
          <div className="flex items-center gap-1.5">
            {getBadgeEvento(item.tipo_evento)}
            <strong className="text-xs font-bold text-[#07132B]">{item.descricao}</strong>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {formatarDataHistorico(item.created)}
          </span>
        </div>

        {/* Informações do autor */}
        <div className="mt-1.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
          <span>
            Autor: <strong className="text-slate-700">{item.autor_nome || 'Usuário'}</strong>
            {item.autor_nivel && (
              <span className="ml-1 text-[9px] uppercase font-bold text-slate-400">
                ({item.autor_nivel})
              </span>
            )}
          </span>
          {item.origem && (
            <span className="text-[10px] text-slate-400">
              • {item.origem === 'nuvem' ? 'Nuvem' : 'Local'}
            </span>
          )}
        </div>

        {/* Tabela de Diff De -> Para */}
        {temAlteracoes && (
          <div className="mt-2.5 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-[#07132B] uppercase tracking-wider block mb-1">
              Diferenças registradas nesta alteração:
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-200 rounded overflow-hidden">
                <thead className="bg-[#07132B]/5 text-slate-700 text-[9px] uppercase font-bold">
                  <tr>
                    <th className="p-1.5 border-b border-slate-200">Parâmetro</th>
                    <th className="p-1.5 border-b border-slate-200">De (Anterior)</th>
                    <th className="p-1.5 border-b border-slate-200">Para (Novo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {item.alteracoes_json!.map((alt: ItemAlteracaoCampo, aIdx: number) => (
                    <tr key={aIdx} className="hover:bg-slate-50/60">
                      <td className="p-1.5 font-medium text-slate-800">
                        {alt.rotulo || alt.campo}
                      </td>
                      <td className="p-1.5 font-mono text-slate-500 line-through">
                        {alt.valorAnteriorFormatado || String(alt.valorAnterior ?? '-')}
                      </td>
                      <td
                        className={`p-1.5 font-mono font-bold ${
                          bordaDestaque === 'dourada'
                            ? 'text-[#07132B] bg-[#D4AF37]/10'
                            : 'text-blue-950 bg-blue-50'
                        }`}
                      >
                        {alt.valorNovoFormatado || String(alt.valorNovo ?? '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Snapshot dos resultados no momento */}
        {item.snapshot_novo_json && (
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 flex flex-wrap gap-x-2.5 gap-y-0.5">
            {item.snapshot_novo_json.regime && (
              <span>
                Regime: <strong>{item.snapshot_novo_json.regime}</strong>
              </span>
            )}
            {item.snapshot_novo_json.faturamentoMensal !== undefined && (
              <span>
                Faturamento:{' '}
                <strong>
                  R$ {item.snapshot_novo_json.faturamentoMensal.toLocaleString('pt-BR')}
                </strong>
              </span>
            )}
            {item.snapshot_novo_json.aliquotaEfetiva !== undefined && (
              <span>
                Alíquota: <strong>{item.snapshot_novo_json.aliquotaEfetiva.toFixed(2)}%</strong>
              </span>
            )}
            {item.snapshot_novo_json.economiaAnual !== undefined && (
              <span>
                Economia:{' '}
                <strong className="text-emerald-700">
                  R${' '}
                  {item.snapshot_novo_json.economiaAnual.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </span>
            )}
            {item.snapshot_novo_json.totalRecuperavelIntegral !== undefined && (
              <span>
                Créditos:{' '}
                <strong className="text-emerald-700">
                  R${' '}
                  {item.snapshot_novo_json.totalRecuperavelIntegral.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
