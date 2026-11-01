import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import type { DiagnosticoRecord } from '@/services/diagnosticos'

export type EstadoEtapaTrilha = 'nao_iniciada' | 'em_andamento' | 'concluida'

export interface ProgressoEtapaInfo {
  estado: EstadoEtapaTrilha
  labelEstado: 'Não iniciada' | 'Em andamento' | 'Concluída'
  diagnosticoSalvo: DiagnosticoRecord | null
}

export interface ProgressoTrilhaDiagnosticos {
  carregando: boolean
  // Etapa 00: Apresentação 360° (não tem formulário, mas pode refletir se o usuário iniciou a trilha pelas etapas seguintes)
  etapa00: ProgressoEtapaInfo
  // Etapa 01: Configurações dos Diagnósticos
  etapa01: ProgressoEtapaInfo
  // Etapa 02: Autoavaliação das 7 Frentes
  etapa02: ProgressoEtapaInfo
  // Etapa 03: Transição Fiscal
  etapa03: ProgressoEtapaInfo
  // Etapa 04: Comparação de Regime
  etapa04: ProgressoEtapaInfo
  // Etapa 05: Enquadramento Completo
  etapa05: ProgressoEtapaInfo
  // Etapa 06: Análise de Fornecedores
  etapa06: ProgressoEtapaInfo
  // Helper rápido para checar se etapa 01 está preenchida/concluída
  etapa01Preenchida: boolean
  // Helper para checar se a trilha como um todo tem algum dado salvo
  algumaEtapaIniciada: boolean
  recarregar: () => Promise<void>
}

/**
 * Hook para detectar o estado de progresso de cada etapa da trilha de diagnósticos
 * a partir dos dados salvos no PocketBase (coleções 'diagnosticos' e 'clientes_empresas')
 * e do contexto local (DadosEmpresaContext).
 */
export function useProgressoTrilha(): ProgressoTrilhaDiagnosticos {
  const { user, isAuthenticated } = useAuth()
  const { clienteAtivoId } = useClienteAtivo()
  const { temDadosSalvos, dadosEmpresa, salvoNoBanco } = useDadosEmpresa()

  const [carregando, setCarregando] = useState(true)
  const [diagnosticosLista, setDiagnosticosLista] = useState<DiagnosticoRecord[]>([])

  const reqEmVooDiagnosticosRef = useRef(false)
  const chaveUltimaBuscaDiagnosticosRef = useRef<string>('')

  const carregarDiagnosticosDoBackend = useCallback(
    async (forcar = false) => {
      if (!isAuthenticated) {
        chaveUltimaBuscaDiagnosticosRef.current = ''
        setDiagnosticosLista((prev) => (prev.length === 0 ? prev : []))
        setCarregando(false)
        return
      }

      const authUserId = pb.authStore.record?.id || user?.id || ''
      const filter = clienteAtivoId
        ? `cliente_id = "${clienteAtivoId}"`
        : authUserId
          ? `user_id = "${authUserId}"`
          : ''

      const chaveAtual = `${authUserId}:${clienteAtivoId || ''}`

      if (
        !forcar &&
        (reqEmVooDiagnosticosRef.current || chaveUltimaBuscaDiagnosticosRef.current === chaveAtual)
      ) {
        return
      }

      reqEmVooDiagnosticosRef.current = true
      try {
        const registros = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
          filter: filter || undefined,
          sort: '-created',
        })

        chaveUltimaBuscaDiagnosticosRef.current = chaveAtual
        setDiagnosticosLista((prev) => {
          // Guarda de igualdade para evitar re-render se os IDs e tamanhos forem os mesmos
          if (
            prev.length === registros.length &&
            prev.every(
              (p, idx) => p.id === registros[idx]?.id && p.updated === registros[idx]?.updated,
            )
          ) {
            return prev
          }
          return registros
        })
      } catch (err) {
        console.warn('Erro ao carregar lista de diagnósticos para progresso da trilha:', err)
        chaveUltimaBuscaDiagnosticosRef.current = chaveAtual
        setDiagnosticosLista((prev) => (prev.length === 0 ? prev : []))
      } finally {
        reqEmVooDiagnosticosRef.current = false
        setCarregando(false)
      }
    },
    [isAuthenticated, user?.id, clienteAtivoId],
  )

  useEffect(() => {
    carregarDiagnosticosDoBackend()
  }, [carregarDiagnosticosDoBackend])

  // Avaliação da Etapa 01: Configurações
  // Concluída quando há dados da empresa válidos (CNPJ + Razão social preenchidos) salvos no contexto ou no banco
  const etapa01Info = useMemo<ProgressoEtapaInfo>(() => {
    // 1. Verifica se no banco há registro com configuracoes_diagnostico_json ou se cliente_empresa / context tem dados
    const diagComConfig = diagnosticosLista.find(
      (d) =>
        d.configuracoes_diagnostico_json &&
        Boolean(
          d.configuracoes_diagnostico_json.razao_social || d.configuracoes_diagnostico_json.cnpj,
        ),
    )

    const temIdentificacaoMinima = Boolean(
      (dadosEmpresa.nomeEmpresa && dadosEmpresa.nomeEmpresa.trim().length > 0) ||
      (dadosEmpresa.cnpj && dadosEmpresa.cnpj.trim().length > 0),
    )

    const temConfigCompleta = Boolean(
      dadosEmpresa.nomeEmpresa?.trim() &&
      dadosEmpresa.cnpj?.trim() &&
      (salvoNoBanco || temDadosSalvos || diagComConfig),
    )

    if (temConfigCompleta || diagComConfig) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: diagComConfig || null,
      }
    }

    if (temIdentificacaoMinima || temDadosSalvos) {
      return {
        estado: 'em_andamento',
        labelEstado: 'Em andamento',
        diagnosticoSalvo: null,
      }
    }

    return {
      estado: 'nao_iniciada',
      labelEstado: 'Não iniciada',
      diagnosticoSalvo: null,
    }
  }, [diagnosticosLista, dadosEmpresa, salvoNoBanco, temDadosSalvos])

  // Avaliação da Etapa 02: Autoavaliação das 7 Frentes
  const etapa02Info = useMemo<ProgressoEtapaInfo>(() => {
    const diag = diagnosticosLista.find(
      (d) => d.tipo_diagnostico === 'autoavaliacao' || d.tipo_diagnostico === '360',
    )
    if (!diag) {
      return {
        estado: 'nao_iniciada',
        labelEstado: 'Não iniciada',
        diagnosticoSalvo: null,
      }
    }

    const extra = (diag.dados_extra_json as any) || {}
    const temAvaliacoes = extra.avaliacoes && Object.keys(extra.avaliacoes).length > 0
    const temScores = extra.scoresPorFrente && Object.keys(extra.scoresPorFrente).length > 0
    const temResumo = Boolean(extra.resumo)

    if (temScores || temResumo) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: diag,
      }
    }

    if (temAvaliacoes) {
      return {
        estado: 'em_andamento',
        labelEstado: 'Em andamento',
        diagnosticoSalvo: diag,
      }
    }

    return {
      estado: 'nao_iniciada',
      labelEstado: 'Não iniciada',
      diagnosticoSalvo: diag,
    }
  }, [diagnosticosLista])

  // Avaliação da Etapa 03: Transição Fiscal
  const etapa03Info = useMemo<ProgressoEtapaInfo>(() => {
    const diag = diagnosticosLista.find((d) => d.tipo_diagnostico === 'transicao')
    if (!diag) {
      return {
        estado: 'nao_iniciada',
        labelEstado: 'Não iniciada',
        diagnosticoSalvo: null,
      }
    }

    const extra = (diag.dados_extra_json as any) || {}
    const temLaudo = Boolean(extra.laudo?.farol || extra.laudo?.servicoRecomendado)

    if (temLaudo) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: diag,
      }
    }

    return {
      estado: 'em_andamento',
      labelEstado: 'Em andamento',
      diagnosticoSalvo: diag,
    }
  }, [diagnosticosLista])

  // Avaliação da Etapa 04: Comparação de Regime
  const etapa04Info = useMemo<ProgressoEtapaInfo>(() => {
    const diag = diagnosticosLista.find((d) => d.tipo_diagnostico === 'regimes')
    if (!diag) {
      return {
        estado: 'nao_iniciada',
        labelEstado: 'Não iniciada',
        diagnosticoSalvo: null,
      }
    }

    const temRecomendacao = Boolean(
      diag.regime_recomendado ||
      diag.sistema_recomendado_novo ||
      diag.economia_anual ||
      diag.carga_simples,
    )

    if (temRecomendacao) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: diag,
      }
    }

    return {
      estado: 'em_andamento',
      labelEstado: 'Em andamento',
      diagnosticoSalvo: diag,
    }
  }, [diagnosticosLista])

  // Avaliação da Etapa 05: Enquadramento Completo
  const etapa05Info = useMemo<ProgressoEtapaInfo>(() => {
    const diag = diagnosticosLista.find(
      (d) => d.tipo_diagnostico === 'enquadramento' || (!d.tipo_diagnostico && d.rbt12),
    )
    if (!diag) {
      return {
        estado: 'nao_iniciada',
        labelEstado: 'Não iniciada',
        diagnosticoSalvo: null,
      }
    }

    const temParecerCompleto = Boolean(
      (diag.rbt12 && diag.rbt12 > 0) ||
      diag.ranking_json?.length ||
      diag.sistema_recomendado_novo ||
      diag.economia_anual_novo,
    )

    if (temParecerCompleto) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: diag,
      }
    }

    return {
      estado: 'em_andamento',
      labelEstado: 'Em andamento',
      diagnosticoSalvo: diag,
    }
  }, [diagnosticosLista])

  // Avaliação da Etapa 06: Análise de Fornecedores e Cotações
  // Concluída quando há fornecedores cadastrados na coleção fornecedores_diagnostico
  // ou histórico de cotações salvo na coleção historico_cotacoes_fornecedores
  const [totalFornecedoresCadastrados, setTotalFornecedoresCadastrados] = useState<number>(0)
  const [totalCotacoesCadastradas, setTotalCotacoesCadastradas] = useState<number>(0)

  const authUserId = user?.id || pb.authStore.record?.id || ''
  const userIdEstavel = isAuthenticated ? authUserId : ''
  const clienteIdEstavel = clienteAtivoId || ''

  // Cache e controle de requisições em voo para evitar refetch desnecessário
  const reqEmVooEtapa06Ref = useRef(false)
  const chaveUltimaBuscaEtapa06Ref = useRef<string>('')

  useEffect(() => {
    let montado = true
    const chaveAtual = `${userIdEstavel}:${clienteIdEstavel}`

    if (!isAuthenticated) {
      chaveUltimaBuscaEtapa06Ref.current = ''
      setTotalFornecedoresCadastrados((prev) => (prev === 0 ? prev : 0))
      setTotalCotacoesCadastradas((prev) => (prev === 0 ? prev : 0))
      return
    }

    // Se já buscou para esta chave de usuário/cliente ou já está carregando, evita refetch
    if (reqEmVooEtapa06Ref.current || chaveUltimaBuscaEtapa06Ref.current === chaveAtual) {
      return
    }

    async function checarDadosEtapa06() {
      reqEmVooEtapa06Ref.current = true
      try {
        const filter = clienteIdEstavel
          ? `cliente_id = "${clienteIdEstavel}"`
          : userIdEstavel
            ? `user_id = "${userIdEstavel}"`
            : ''

        const [listFornecedores, listCotacoes] = await Promise.all([
          pb.collection('fornecedores_diagnostico').getList(1, 1, {
            filter: filter || undefined,
          }),
          pb
            .collection('historico_cotacoes_fornecedores')
            .getList(1, 1, {
              filter: filter || undefined,
            })
            .catch(() => ({ totalItems: 0 })),
        ])

        if (montado) {
          chaveUltimaBuscaEtapa06Ref.current = chaveAtual
          setTotalFornecedoresCadastrados((prev) =>
            prev === listFornecedores.totalItems ? prev : listFornecedores.totalItems,
          )
          setTotalCotacoesCadastradas((prev) =>
            prev === listCotacoes.totalItems ? prev : listCotacoes.totalItems,
          )
        }
      } catch (_) {
        if (montado) {
          chaveUltimaBuscaEtapa06Ref.current = chaveAtual
          setTotalFornecedoresCadastrados((prev) => (prev === 0 ? prev : 0))
          setTotalCotacoesCadastradas((prev) => (prev === 0 ? prev : 0))
        }
      } finally {
        reqEmVooEtapa06Ref.current = false
      }
    }

    checarDadosEtapa06()

    return () => {
      montado = false
    }
  }, [isAuthenticated, userIdEstavel, clienteIdEstavel])

  const etapa06Info = useMemo<ProgressoEtapaInfo>(() => {
    if (totalFornecedoresCadastrados >= 1 || totalCotacoesCadastradas >= 1) {
      return {
        estado: 'concluida',
        labelEstado: 'Concluída',
        diagnosticoSalvo: null,
      }
    }
    return {
      estado: 'nao_iniciada',
      labelEstado: 'Não iniciada',
      diagnosticoSalvo: null,
    }
  }, [totalFornecedoresCadastrados, totalCotacoesCadastradas])

  const etapa01Preenchida = etapa01Info.estado === 'concluida'

  const algumaEtapaIniciada = Boolean(
    etapa01Info.estado !== 'nao_iniciada' ||
    etapa02Info.estado !== 'nao_iniciada' ||
    etapa03Info.estado !== 'nao_iniciada' ||
    etapa04Info.estado !== 'nao_iniciada' ||
    etapa05Info.estado !== 'nao_iniciada' ||
    etapa06Info.estado !== 'nao_iniciada',
  )

  // Etapa 00 (Apresentação 360°) reflete o início geral da esteira
  const etapa00Info = useMemo<ProgressoEtapaInfo>(() => {
    if (etapa01Preenchida || algumaEtapaIniciada) {
      return {
        estado: 'em_andamento',
        labelEstado: 'Em andamento',
        diagnosticoSalvo: null,
      }
    }
    return {
      estado: 'nao_iniciada',
      labelEstado: 'Não iniciada',
      diagnosticoSalvo: null,
    }
  }, [etapa01Preenchida, algumaEtapaIniciada])

  return {
    carregando,
    etapa00: etapa00Info,
    etapa01: etapa01Info,
    etapa02: etapa02Info,
    etapa03: etapa03Info,
    etapa04: etapa04Info,
    etapa05: etapa05Info,
    etapa06: etapa06Info,
    etapa01Preenchida,
    algumaEtapaIniciada,
    recarregar: useCallback(async () => {
      await carregarDiagnosticosDoBackend(true)
    }, [carregarDiagnosticosDoBackend]),
  }
}
