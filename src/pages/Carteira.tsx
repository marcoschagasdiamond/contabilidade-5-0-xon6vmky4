import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarClientes } from '@/services/clientes'
import { listarSimulacoes } from '@/services/simulacoesCalculadora'
import { listarSimulacoesRecuperador } from '@/services/simulacoesRecuperador'
import { getDiagnosticos } from '@/services/diagnosticos'
import { listarConversasAssistente } from '@/services/conversasAssistente'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import type { Cliente } from '@/types/cliente'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { ConversaAssistente } from '@/services/conversasAssistente'

/**
 * Interface com os dados consolidados de cada cliente na Carteira
 */
interface ClienteCarteiraConsolidado {
  cliente: Cliente
  totalSimulacoes: number
  totalRecuperador: number
  totalRecuperavelCreditos: number
  totalDiagnosticos: number
  totalConversas: number
  ultimaEconomiaAnual: number | null
  temEconomiaPositiva: boolean
  alertaSimples: boolean
  alertaSimplesTipo: 'desenquadrado' | 'hibrido' | 'atencao' | null
  faturamentoSimplesMax: number
  dataUltimaAtividade: string | null
  simulacaoMaisRecente?: SimulacaoCalculadora
  diagnosticoMaisRecente?: DiagnosticoRecord
  conversaMaisRecente?: ConversaAssistente
}

type FiltroDiagnostico = 'todos' | 'com' | 'sem'
type FiltroEconomia = 'todos' | 'positiva' | 'sem_economia'
type FiltroAlertaSimples = 'todos' | 'com_alerta' | 'sem_alerta'
type OrdenacaoCampo =
  | 'nome'
  | 'atividade'
  | 'simulacoes'
  | 'diagnosticos'
  | 'conversas'
  | 'economia'

export default function Carteira() {
  const navigate = useNavigate()
  const { clienteAtivoId, selecionarClienteAtivo, limparClienteAtivo } = useClienteAtivo()

  const [carregando, setCarregando] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [simulacoes, setSimulacoes] = useState<SimulacaoCalculadora[]>([])
  const [recuperadorSims, setRecuperadorSims] = useState<SimulacaoRecuperador[]>([])
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [conversas, setConversas] = useState<ConversaAssistente[]>([])

  // Filtros e busca
  const [busca, setBusca] = useState('')
  const [filtroDiag, setFiltroDiag] = useState<FiltroDiagnostico>('todos')
  const [filtroEco, setFiltroEco] = useState<FiltroEconomia>('todos')
  const [filtroSimples, setFiltroSimples] = useState<FiltroAlertaSimples>('todos')
  const [filtroRegime, setFiltroRegime] = useState<string>('todos')
  const [ordenacao, setOrdenacao] = useState<OrdenacaoCampo>('atividade')
  const [ordemDesc, setOrdemDesc] = useState<boolean>(true)

  // Carrega todos os dados das coleções existentes
  const carregarDadosCarteira = async () => {
    try {
      setCarregando(true)
      const [listaClientes, listaSims, listaRecup, listaDiags, listaConvs] = await Promise.all([
        listarClientes(),
        listarSimulacoes(),
        listarSimulacoesRecuperador(),
        getDiagnosticos(),
        listarConversasAssistente(),
      ])

      setClientes(listaClientes)
      setSimulacoes(listaSims)
      setRecuperadorSims(listaRecup)
      setDiagnosticos(listaDiags)
      setConversas(listaConvs)
    } catch (err) {
      console.error('Erro ao consolidar dados da carteira:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDadosCarteira()
  }, [])

  // Agrega dados por cliente
  const consolidados = useMemo<ClienteCarteiraConsolidado[]>(() => {
    // Agrupa por cliente_id
    const simsPorCliente = new Map<string, SimulacaoCalculadora[]>()
    simulacoes.forEach((s) => {
      if (s.cliente_id) {
        const arr = simsPorCliente.get(s.cliente_id) || []
        arr.push(s)
        simsPorCliente.set(s.cliente_id, arr)
      }
    })

    const recupPorCliente = new Map<string, SimulacaoRecuperador[]>()
    recuperadorSims.forEach((r) => {
      if (r.cliente_id) {
        const arr = recupPorCliente.get(r.cliente_id) || []
        arr.push(r)
        recupPorCliente.set(r.cliente_id, arr)
      }
    })

    const diagsPorCliente = new Map<string, DiagnosticoRecord[]>()
    diagnosticos.forEach((d) => {
      if (d.cliente_id) {
        const arr = diagsPorCliente.get(d.cliente_id) || []
        arr.push(d)
        diagsPorCliente.set(d.cliente_id, arr)
      }
    })

    const convsPorCliente = new Map<string, ConversaAssistente[]>()
    conversas.forEach((c) => {
      if (c.cliente_id) {
        const arr = convsPorCliente.get(c.cliente_id) || []
        arr.push(c)
        convsPorCliente.set(c.cliente_id, arr)
      }
    })

    return clientes.map((cliente) => {
      const cliSims = simsPorCliente.get(cliente.id) || []
      const cliRecup = recupPorCliente.get(cliente.id) || []
      const cliDiags = diagsPorCliente.get(cliente.id) || []
      const cliConvs = convsPorCliente.get(cliente.id) || []

      const totalRecuperavelCreditos = cliRecup.reduce(
        (acc, curr) => acc + (curr.total_recuperavel_integral || 0),
        0,
      )

      // Ordenar simulações por data decrescente
      cliSims.sort((a, b) => {
        const dateA = new Date(a.updated || a.created).getTime()
        const dateB = new Date(b.updated || b.created).getTime()
        return dateB - dateA
      })

      // Ordenar diagnósticos por data decrescente
      cliDiags.sort((a, b) => {
        const dateA = new Date(a.updated || a.created || 0).getTime()
        const dateB = new Date(b.updated || b.created || 0).getTime()
        return dateB - dateA
      })

      // Ordenar conversas por data decrescente
      cliConvs.sort((a, b) => {
        const dateA = new Date(a.updated || a.created).getTime()
        const dateB = new Date(b.updated || b.created).getTime()
        return dateB - dateA
      })

      const simMaisRecente = cliSims[0]
      const diagMaisRecente = cliDiags[0]
      const convMaisRecente = cliConvs[0]

      // Última economia anual
      let ultimaEco: number | null = null
      if (simMaisRecente) {
        if (typeof simMaisRecente.economia_anual === 'number') {
          ultimaEco = simMaisRecente.economia_anual
        } else if (
          typeof simMaisRecente.resultados?.resultadoDashboard?.economiaAnualProjetada === 'number'
        ) {
          ultimaEco = simMaisRecente.resultados.resultadoDashboard.economiaAnualProjetada
        }
      } else if (diagMaisRecente && typeof diagMaisRecente.economia_anual === 'number') {
        ultimaEco = diagMaisRecente.economia_anual
      }

      const temEcoPositiva = ultimaEco !== null && ultimaEco > 0

      // Alerta do Simples Nacional:
      // Verifica simulações do cliente. Se faturamentoAnual >= 4.320.000 (90% do teto) ou > 4.800.000, ou sublimite 3.600.000
      let temAlertaSimples = false
      let alertaTipo: 'desenquadrado' | 'hibrido' | 'atencao' | null = null
      let fatMax = 0

      cliSims.forEach((s) => {
        const fatAnual =
          (s.parametros?.faturamentoMensal || s.faturamento_mensal || 0) * 12 ||
          s.parametros?.faturamentoAnualProjetado ||
          0
        if (fatAnual > fatMax) fatMax = fatAnual
      })

      // Também verifica no diagnóstico se houver rbt12
      cliDiags.forEach((d) => {
        const rbt = d.rbt12 || (d.folha_pagamento ? d.folha_pagamento * 12 : 0) || 0
        if (rbt > fatMax) fatMax = rbt
      })

      if (fatMax > 4800000) {
        temAlertaSimples = true
        alertaTipo = 'desenquadrado'
      } else if (fatMax >= 4320000) {
        temAlertaSimples = true
        alertaTipo = 'atencao'
      } else if (fatMax > 3600000) {
        temAlertaSimples = true
        alertaTipo = 'hibrido'
      }

      // Se o regime for Simples Nacional e o faturamento estiver próximo, reforça o alerta
      if (
        cliente.regime_atual?.toLowerCase().includes('simples') &&
        fatMax >= 3600000 &&
        !temAlertaSimples
      ) {
        temAlertaSimples = true
        alertaTipo = 'hibrido'
      }

      // Data da última atividade
      const datas: number[] = []
      if (simMaisRecente)
        datas.push(new Date(simMaisRecente.updated || simMaisRecente.created).getTime())
      if (diagMaisRecente)
        datas.push(new Date(diagMaisRecente.updated || diagMaisRecente.created || 0).getTime())
      if (convMaisRecente)
        datas.push(new Date(convMaisRecente.updated || convMaisRecente.created).getTime())

      let dataUltimaAtividade: string | null = null
      if (datas.length > 0) {
        const maxTime = Math.max(...datas)
        dataUltimaAtividade = new Date(maxTime).toISOString()
      } else if (cliente.updated || cliente.created) {
        dataUltimaAtividade = cliente.updated || cliente.created || null
      }

      return {
        cliente,
        totalSimulacoes: cliSims.length,
        totalRecuperador: cliRecup.length,
        totalRecuperavelCreditos,
        totalDiagnosticos: cliDiags.length,
        totalConversas: cliConvs.length,
        ultimaEconomiaAnual: ultimaEco,
        temEconomiaPositiva: temEcoPositiva,
        alertaSimples: temAlertaSimples,
        alertaSimplesTipo: alertaTipo,
        faturamentoSimplesMax: fatMax,
        dataUltimaAtividade,
        simulacaoMaisRecente: simMaisRecente,
        diagnosticoMaisRecente: diagMaisRecente,
        conversaMaisRecente: convMaisRecente,
      }
    })
  }, [clientes, simulacoes, recuperadorSims, diagnosticos, conversas])

  // KPIs Consolidados do Topo
  const kpis = useMemo(() => {
    const totalClientes = consolidados.length
    const comDiagnostico = consolidados.filter((c) => c.totalDiagnosticos > 0).length
    const comSimulacoes = consolidados.filter((c) => c.totalSimulacoes > 0).length
    const comRecuperador = consolidados.filter((c) => c.totalRecuperador > 0).length
    const comEconomiaPositiva = consolidados.filter((c) => c.temEconomiaPositiva).length
    const comAlertaSimples = consolidados.filter((c) => c.alertaSimples).length

    const somaCreditosRecuperador = consolidados.reduce(
      (acc, c) => acc + c.totalRecuperavelCreditos,
      0,
    )

    // Soma da economia potencial identificada na carteira
    const somaEconomiaPositiva = consolidados.reduce((acc, c) => {
      if (c.ultimaEconomiaAnual && c.ultimaEconomiaAnual > 0) {
        return acc + c.ultimaEconomiaAnual
      }
      return acc
    }, 0)

    return {
      totalClientes,
      comDiagnostico,
      comSimulacoes,
      comRecuperador,
      comEconomiaPositiva,
      comAlertaSimples,
      somaEconomiaPositiva,
      somaCreditosRecuperador,
    }
  }, [consolidados])

  // Filtros aplicados à lista
  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return consolidados
      .filter((item) => {
        // Busca textual por nome, CNPJ/CPF, UF, segmento, regime
        const atendeBusca =
          !termo ||
          item.cliente.nome.toLowerCase().includes(termo) ||
          item.cliente.cnpj_cpf.toLowerCase().includes(termo) ||
          item.cliente.uf.toLowerCase().includes(termo) ||
          item.cliente.segmento.toLowerCase().includes(termo) ||
          item.cliente.regime_atual.toLowerCase().includes(termo)

        // Filtro de Diagnóstico
        let atendeDiag = true
        if (filtroDiag === 'com') atendeDiag = item.totalDiagnosticos > 0
        if (filtroDiag === 'sem') atendeDiag = item.totalDiagnosticos === 0

        // Filtro de Economia
        let atendeEco = true
        if (filtroEco === 'positiva') atendeEco = item.temEconomiaPositiva
        if (filtroEco === 'sem_economia') atendeEco = !item.temEconomiaPositiva

        // Filtro de Alerta do Simples
        let atendeSimples = true
        if (filtroSimples === 'com_alerta') atendeSimples = item.alertaSimples
        if (filtroSimples === 'sem_alerta') atendeSimples = !item.alertaSimples

        // Filtro de Regime
        let atendeRegime = true
        if (filtroRegime !== 'todos') {
          atendeRegime = item.cliente.regime_atual
            .toLowerCase()
            .includes(filtroRegime.toLowerCase())
        }

        return atendeBusca && atendeDiag && atendeEco && atendeSimples && atendeRegime
      })
      .sort((a, b) => {
        let comp = 0
        switch (ordenacao) {
          case 'nome':
            comp = a.cliente.nome.localeCompare(b.cliente.nome)
            break
          case 'simulacoes':
            comp = a.totalSimulacoes - b.totalSimulacoes
            break
          case 'diagnosticos':
            comp = a.totalDiagnosticos - b.totalDiagnosticos
            break
          case 'conversas':
            comp = a.totalConversas - b.totalConversas
            break
          case 'economia': {
            const ecoA = a.ultimaEconomiaAnual ?? -Infinity
            const ecoB = b.ultimaEconomiaAnual ?? -Infinity
            comp = ecoA - ecoB
            break
          }
          case 'atividade':
          default: {
            const timeA = a.dataUltimaAtividade ? new Date(a.dataUltimaAtividade).getTime() : 0
            const timeB = b.dataUltimaAtividade ? new Date(b.dataUltimaAtividade).getTime() : 0
            comp = timeA - timeB
            break
          }
        }
        return ordemDesc ? -comp : comp
      })
  }, [
    consolidados,
    busca,
    filtroDiag,
    filtroEco,
    filtroSimples,
    filtroRegime,
    ordenacao,
    ordemDesc,
  ])

  const alternarOrdem = (campo: OrdenacaoCampo) => {
    if (ordenacao === campo) {
      setOrdemDesc(!ordemDesc)
    } else {
      setOrdenacao(campo)
      setOrdemDesc(true)
    }
  }

  const formatarDataSimples = (iso?: string | null) => {
    if (!iso) return 'Sem registro'
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* HEADER DA CARTEIRA CONSOLIDADA (PADRÃO DIAMOND GROUP #07132B / #D4AF37) */}
      <section className="relative py-10 sm:py-14 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  Fase 3 • Painel Consolidado da Carteira
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                Carteira de Clientes do Analista
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Visão unificada de toda a base de clientes: status de diagnósticos concluídos,
                simulações tributárias na Calculadora IBS/CBS, economia anual identificada e
                monitoramento dos limites do Simples Nacional (R$ 4,8M).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/clientes"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
              >
                Gerenciar Cadastros
              </Link>
              <Link
                to="/recuperador-creditos"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-[#2ECC71] border border-[#2ECC71]/30 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
              >
                Recuperador de Créditos
              </Link>
              <Link
                to="/calculadora-ibs-cbs"
                className="inline-flex items-center justify-center bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors"
              >
                Calculadora IBS/CBS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ÁREA PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* CARDS DE RESUMO DA CARTEIRA (TOP KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total de Clientes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 transition-all hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total de Clientes
              </span>
              <span className="w-2 h-2 rounded-full bg-[#07132B]" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#07132B]">
              {kpis.totalClientes}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Cadastrados na carteira</p>
          </div>

          {/* Card 2: Com Diagnóstico Feito */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 transition-all hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Com Diagnóstico
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-700">
              {kpis.comDiagnostico}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {kpis.totalClientes > 0
                ? `${Math.round((kpis.comDiagnostico / kpis.totalClientes) * 100)}% da base analisada`
                : 'Nenhum registro'}
            </p>
          </div>

          {/* Card 3: Com Simulações */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 transition-all hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Com Simulações
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#07132B]">
              {kpis.comSimulacoes}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Calculadora IBS/CBS</p>
          </div>

          {/* Card 4: Recuperador de Créditos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 transition-all hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Créditos (60m)
              </span>
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-700">
              {kpis.comRecuperador}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight font-mono">
              {kpis.somaCreditosRecuperador > 0
                ? formatarMoeda(kpis.somaCreditosRecuperador)
                : 'Potencial recuperável'}
            </p>
          </div>

          {/* Card 5: Economia Positiva */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 transition-all hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Economia Positiva
              </span>
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-amber-700">
              {kpis.comEconomiaPositiva}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {kpis.somaEconomiaPositiva > 0
                ? `${formatarMoeda(kpis.somaEconomiaPositiva)}/ano`
                : 'Projetada > R$ 0'}
            </p>
          </div>

          {/* Card 5: Alerta do Simples (Teto R$ 4,8M / Sublimite) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5 col-span-2 sm:col-span-1 transition-all hover:border-rose-400">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Alertas do Simples
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-rose-700">
              {kpis.comAlertaSimples}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Limite R$ 4,8M ou sublimite</p>
          </div>
        </div>

        {/* BARRA DE BUSCA, FILTROS RÁPIDOS E ORDENAÇÃO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="w-full lg:w-96">
              <Input
                type="text"
                placeholder="Buscar por cliente, CNPJ/CPF, UF ou segmento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="text-xs h-10 border-slate-200"
              />
            </div>

            {/* Contagem de resultados */}
            <div className="text-xs text-slate-600 font-medium">
              Exibindo <strong>{clientesFiltrados.length}</strong> de{' '}
              <strong>{consolidados.length}</strong> clientes
            </div>
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* Filtro Diagnóstico */}
            <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">
              Diagnóstico:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'com', label: 'Com Diagnóstico' },
              { id: 'sem', label: 'Sem Diagnóstico' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroDiag(f.id as FiltroDiagnostico)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filtroDiag === f.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>

            {/* Filtro Economia */}
            <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">Economia:</span>
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'positiva', label: 'Economia Positiva' },
              { id: 'sem_economia', label: 'Sem Economia' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroEco(f.id as FiltroEconomia)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filtroEco === f.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>

            {/* Filtro Alerta Simples */}
            <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">
              Simples (R$ 4,8M):
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'com_alerta', label: 'Com Alerta' },
              { id: 'sem_alerta', label: 'Sem Alerta' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroSimples(f.id as FiltroAlertaSimples)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filtroSimples === f.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>

            {/* Filtro de Regime Atual */}
            <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">Regime:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'simples', label: 'Simples' },
              { id: 'presumido', label: 'Presumido' },
              { id: 'real', label: 'Lucro Real' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroRegime(f.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filtroRegime === f.id
                    ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABELA CONSOLIDADA DA CARTEIRA */}
        {carregando ? (
          <div className="py-20 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando painel consolidado da carteira...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <strong className="text-base font-bold text-[#07132B] block">
              Nenhum cliente atende aos filtros selecionados
            </strong>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ajuste os filtros de diagnóstico, economia ou alerta do Simples para visualizar os
              registros da carteira.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBusca('')
                  setFiltroDiag('todos')
                  setFiltroEco('todos')
                  setFiltroSimples('todos')
                  setFiltroRegime('todos')
                }}
                className="text-xs font-bold text-[#07132B] bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#07132B] text-white border-b border-[#D4AF37]/40 uppercase tracking-wider font-semibold">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('nome')}
                    >
                      Cliente / Identificação
                      {ordenacao === 'nome' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="py-3.5 px-3">Regime & UF</th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('simulacoes')}
                    >
                      Simulações
                      {ordenacao === 'simulacoes' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="py-3.5 px-3 text-center">Créditos (60m)</th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('diagnosticos')}
                    >
                      Diagnósticos
                      {ordenacao === 'diagnosticos' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('conversas')}
                    >
                      Assistente
                      {ordenacao === 'conversas' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('economia')}
                    >
                      Última Economia Anual
                      {ordenacao === 'economia' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="py-3.5 px-3 text-center">Farol Simples (R$ 4,8M)</th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:text-[#D4AF37] transition-colors"
                      onClick={() => alternarOrdem('atividade')}
                    >
                      Última Atividade
                      {ordenacao === 'atividade' && (
                        <span className="text-[#D4AF37] ml-1">{ordemDesc ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientesFiltrados.map((item) => {
                    const isAtivo = clienteAtivoId === item.cliente.id

                    return (
                      <tr
                        key={item.cliente.id}
                        onClick={() => navigate(`/clientes/${item.cliente.id}`)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/90 ${
                          isAtivo ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* COLUNA 1: NOME + CNPJ/CPF + BADGE ATIVO */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isAtivo ? 'bg-[#D4AF37] animate-pulse' : 'bg-slate-300'
                                }`}
                              />
                              <strong className="text-slate-900 font-bold text-xs truncate block hover:text-[#D4AF37] transition-colors">
                                {item.cliente.nome}
                              </strong>
                              {isAtivo && (
                                <span className="bg-[#D4AF37] text-[#07132B] font-extrabold text-[9px] px-1.5 py-0.2 rounded shrink-0">
                                  ATIVO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 pl-4">
                              {item.cliente.cnpj_cpf} • {item.cliente.segmento}
                            </div>
                          </div>
                        </td>

                        {/* COLUNA 2: REGIME & UF */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-slate-300 text-slate-700 bg-white"
                            >
                              {item.cliente.regime_atual}
                            </Badge>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              UF: {item.cliente.uf}
                            </span>
                          </div>
                        </td>

                        {/* COLUNA 3: SIMULAÇÕES */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              item.totalSimulacoes > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.totalSimulacoes}
                          </span>
                        </td>

                        {/* COLUNA 3.5: RECUPERADOR DE CRÉDITOS */}
                        <td className="py-3.5 px-3 text-center">
                          {item.totalRecuperador > 0 ? (
                            <span
                              title={`Total apurado em 60 meses: ${formatarMoeda(item.totalRecuperavelCreditos)}`}
                              className="inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {item.totalRecuperador} (
                              {formatarMoeda(item.totalRecuperavelCreditos)})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* COLUNA 4: DIAGNÓSTICOS */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              item.totalDiagnosticos > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.totalDiagnosticos}
                          </span>
                        </td>

                        {/* COLUNA 5: CONVERSAS COM O ASSISTENTE */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              item.totalConversas > 0
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.totalConversas}
                          </span>
                        </td>

                        {/* COLUNA 6: ÚLTIMA ECONOMIA ANUAL */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {item.ultimaEconomiaAnual === null ? (
                            <span className="text-slate-400 text-[11px]">Sem cálculo</span>
                          ) : item.ultimaEconomiaAnual > 0 ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-emerald-700 text-xs">
                                +{formatarMoeda(item.ultimaEconomiaAnual)}
                              </span>
                              <span className="text-[10px] text-emerald-600 block">/ano</span>
                            </div>
                          ) : (
                            <span className="text-amber-800 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                              Sem economia neste cenário
                            </span>
                          )}
                        </td>

                        {/* COLUNA 7: ALERTA DO SIMPLES NACIONAL (R$ 4,8M / SUBLIMITE) */}
                        <td className="py-3.5 px-3 text-center">
                          {item.alertaSimplesTipo === 'desenquadrado' ? (
                            <span
                              title={`Faturamento anual projetado (${formatarMoeda(item.faturamentoSimplesMax)}) ultrapassa o teto de R$ 4,8M.`}
                              className="inline-block bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            >
                              Teto R$ 4,8M Excedido
                            </span>
                          ) : item.alertaSimplesTipo === 'atencao' ? (
                            <span
                              title={`Faturamento anual (${formatarMoeda(item.faturamentoSimplesMax)}) acima de 90% do teto legal.`}
                              className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            >
                              Atenção Teto (&gt;90%)
                            </span>
                          ) : item.alertaSimplesTipo === 'hibrido' ? (
                            <span
                              title={`Faturamento anual (${formatarMoeda(item.faturamentoSimplesMax)}) ultrapassa R$ 3,6M (Simples Híbrido: ICMS/ISS por fora).`}
                              className="inline-block bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-full"
                            >
                              Simples Híbrido (&gt;3,6M)
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[10px] font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Enquadrado
                            </span>
                          )}
                        </td>

                        {/* COLUNA 8: DATA DA ÚLTIMA ATIVIDADE */}
                        <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {formatarDataSimples(item.dataUltimaAtividade)}
                        </td>

                        {/* COLUNA 9: AÇÃO RÁPIDA / FICHA */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isAtivo ? (
                              <button
                                type="button"
                                onClick={() => limparClienteAtivo()}
                                className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                Desativar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => selecionarClienteAtivo(item.cliente.id)}
                                className="text-[11px] font-bold text-[#07132B] bg-[#D4AF37]/25 hover:bg-[#D4AF37]/40 border border-[#D4AF37]/60 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                Ativar
                              </button>
                            )}

                            <Link
                              to={`/clientes/${item.cliente.id}`}
                              className="text-[11px] font-bold text-[#07132B] hover:text-[#D4AF37] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Ver Ficha →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTA METODOLÓGICA / RODAPÉ DA CARTEIRA */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 border border-[#D4AF37]/30 shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <strong className="text-xs uppercase tracking-wider text-[#D4AF37]">
              Diretrizes do Painel Consolidado de Clientes
            </strong>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A Carteira do Analista agrega todos os dados fiscais gerados na Calculadora IBS/CBS, no
            Diagnóstico 360° e na trilha de transição tributária (EC 132/2023 e LC 214/2025). O
            alerta do Simples Nacional monitora se as projeções de faturamento anualizado aproximam
            ou superam o teto de <strong>R$ 4,8 milhões</strong> ou o sublimite de{' '}
            <strong>R$ 3,6 milhões</strong> (Simples Híbrido com ICMS e ISS apurados por fora da
            guia DAS).
          </p>
        </div>
      </div>
    </div>
  )
}
