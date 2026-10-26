import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { PainelSucessoFluxoGuiado } from '@/components/diagnosticos/PainelSucessoFluxoGuiado'
import { Modulo6ComparadorRegime } from '@/components/reforma/Modulo6ComparadorRegime'
import { createDiagnostico } from '@/services/diagnosticos'
import pb from '@/lib/pocketbase/client'
import { registrarDiagnosticoUsado } from '@/services/freemium'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'

export default function DiagnosticoRegimes() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isPremium, podeDiagnosticar, recarregarUsuario } = useAuth()
  const { clienteAtivo, clienteAtivoId } = useClienteAtivo()
  const [paywallAberto, setPaywallAberto] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Gate de Dados da Empresa
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-regimes'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  const handleRestaurar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('contabilidade5_dados_empresa_updated'))
    }
  }

  // Salvamento unificado na coleção diagnosticos com tipo_diagnostico='regimes'
  const handleSalvarDiagnosticoRegimes = async (payload: {
    regimeVencedor: string
    justificativa: string
    scoreSimples: number
    scoreHibrido: number
    scoreNormal: number
    respostas: Record<number, string>
    convergencia?: {
      convergem: boolean
      hipoteseQualitativa: string
      recomendacaoFinal: string
      motivoPrevalencia?: string
      detalhes?: {
        faturamentoAnual: number
        tetoSimples: number
        sublimiteSimples: number
        fatorR: number
        fatorRPercent: number
      }
    }
    resultadosNumericos: {
      faturamentoAnual: number
      folhaAnual: number
      margemLucro: number
      anoBase: number
      melhorRegime: string
      economiaAnualMaxima: number
      cargaSimples: number
      cargaPresumido: number
      cargaReal: number
      cargaNovoSistema: number
      ranking: Array<{
        posicao: number
        regime: string
        cargaAnual: number
        aliquotaEfetiva: number
        elegivel: boolean
        diferencaValor: number
        diferencaPercent: number
      }>
    }
  }) => {
    if (!podeDiagnosticar) {
      setPaywallAberto(true)
      return
    }

    setSalvando(true)
    try {
      const authUserId = pb.authStore.record?.id || undefined
      const num = payload.resultadosNumericos
      const conv = payload.convergencia

      await createDiagnostico({
        user_id: authUserId,
        cliente_id: clienteAtivoId || undefined,
        tipo_diagnostico: 'regimes',
        nome: clienteAtivo?.nome || dadosEmpresa.nomeContato || 'Contato',
        email: dadosEmpresa.email || 'contato@empresa.com.br',
        telefone: dadosEmpresa.telefone || '',
        empresa: dadosEmpresa.nomeEmpresa || 'Empresa',
        cnpj: dadosEmpresa.cnpj || '',
        segmento: dadosEmpresa.segmento || 'Serviços',
        rbt12: num.faturamentoAnual,
        folha12: num.folhaAnual,
        folha_pagamento: Math.round(num.folhaAnual / 12),
        margem_lucro: num.margemLucro,
        regime_recomendado: num.melhorRegime,
        carga_simples: num.cargaSimples,
        carga_presumido: num.cargaPresumido,
        carga_real: num.cargaReal,
        economia_anual: num.economiaAnualMaxima,
        ano_base: num.anoBase,
        sistema_recomendado_atual: dadosEmpresa.regimeAtual || 'Simples Nacional',
        sistema_recomendado_novo: num.melhorRegime,
        carga_simples_novo: num.cargaSimples,
        carga_presumido_novo: num.cargaPresumido,
        carga_real_novo: num.cargaReal,
        economia_anual_novo: num.economiaAnualMaxima,
        uf_origem: dadosEmpresa.ufOrigem || 'SP',
        cidade: dadosEmpresa.cidade || '',
        despesas_creditos: dadosEmpresa.despesasComCreditosMensais || 0,
        percentual_exportacao: dadosEmpresa.percentualExportacao || 0,
        funcionarios: dadosEmpresa.funcionarios,
        emissao_nf: dadosEmpresa.emissaoNf,
        regime_atual: dadosEmpresa.regimeAtual,
        ranking_json: num.ranking,
        configuracoes_diagnostico_json: {
          regime_atual: dadosEmpresa.regimeAtual,
          segmento: dadosEmpresa.segmento,
          atividade_mista: dadosEmpresa.atividadeMista,
          proporcao_servico_misto: dadosEmpresa.proporcaoServicoMisto,
          ano_base_transicao: dadosEmpresa.anoBaseTransicao,
          uf_origem: dadosEmpresa.ufOrigem,
          cidade: dadosEmpresa.cidade,
          funcionarios: dadosEmpresa.funcionarios,
          emissao_nf: dadosEmpresa.emissaoNf,
          cnpj: dadosEmpresa.cnpj,
          razao_social: dadosEmpresa.nomeEmpresa,
          nome_contato: dadosEmpresa.nomeContato,
        },
        dados_extra_json: {
          tipo: 'regimes',
          moduloOrigem: 'Modulo 6 - Comparador de Regime Unificado',
          regimeVencedorModulo6: payload.regimeVencedor,
          hipoteseQualitativa: conv?.hipoteseQualitativa || payload.regimeVencedor,
          recomendacaoFinalNumerica: num.melhorRegime,
          convergenciaAnalise: conv?.convergem ?? false,
          statusConvergencia: conv?.convergem ? 'convergem' : 'divergem',
          motivoPrevalenciaNumerica: conv?.motivoPrevalencia || '',
          detalhesLimiares: conv?.detalhes || null,
          justificativaModulo6: payload.justificativa,
          scoreSimples: payload.scoreSimples,
          scoreHibrido: payload.scoreHibrido,
          scoreNormal: payload.scoreNormal,
          respostasModulo6: payload.respostas,
          anoBase: num.anoBase,
          ranking: num.ranking,
        },
      })

      await registrarDiagnosticoUsado(authUserId)
      await recarregarUsuario()

      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } catch (err) {
      console.error('Erro ao salvar diagnóstico de regimes:', err)
      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* SELETOR CLIENTE ATIVO NO TOPO */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo no Comparador de Regimes:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="regimes"
        nomeEmpresa={dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
        onRestaurarDados={handleRestaurar}
      />

      {/* HERO DA PÁGINA */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-400/40 bg-blue-400/15 text-xs font-bold text-blue-300 uppercase tracking-wider backdrop-blur-md font-mono">
                <span>ETAPA 04 • COMPARADOR DE REGIME TRIBUTÁRIO</span>
              </div>
              <BadgeOrigemPropagada origem="configuracoes" />
              <FreemiumBadge tipo="diagnostico" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Comparação dos 4 Regimes:{' '}
              <span className="text-[#D4AF37]">Simples, Presumido, Real e Novo Sistema</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Sistema unificado de decisão: fluxo consultivo estratégico (Simples Tradicional,
              Simples Híbrido e Regime Normal), matriz matemática dos 4 regimes societários, impacto
              do split payment no capital de giro e os 3 cenários práticos de mercado. Alimentado
              pelos <strong className="text-white">Dados da Empresa</strong> cadastrada.
            </p>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: MÓDULO 6 COMPARTILHADO EM MODO TRILHA */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-8">
        <PainelSucessoFluxoGuiado
          aberto={salvoFeedback}
          onClose={() => setSalvoFeedback(false)}
          titulo="Comparação de Regimes Salva com Sucesso!"
          mensagem="A matriz comparativa e o ranking dos 4 regimes societários foram salvos na sua conta. Avance para a etapa final: o Simulador de Enquadramento Completo com emissão de parecer e PDF."
          proximaEtapaNome="Enquadramento Completo (Simulador & Relatório PDF)"
          proximaEtapaRota="/diagnostico"
          segundosAutoRedirect={5}
          etapaConcluidaNumero="ETAPA 04"
          etapaConcluidaNome="Comparação de Regime"
        />

        <Modulo6ComparadorRegime
          modo="trilha"
          dadosEmpresa={dadosEmpresa}
          temDadosSalvos={temDadosSalvos}
          onRestaurarDados={handleRestaurar}
          onSalvarDiagnostico={handleSalvarDiagnosticoRegimes}
          salvando={salvando}
          salvoFeedback={salvoFeedback}
        />
      </div>

      <DiamondFooterCTA />

      <PaywallModal open={paywallAberto} onOpenChange={setPaywallAberto} motivo="diagnostico" />
    </div>
  )
}
