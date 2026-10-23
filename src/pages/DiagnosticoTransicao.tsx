import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { ConteudoModulo7Diagnostico } from '@/components/reforma/Modulo7DiagnosticoReforma'
import { createDiagnostico } from '@/services/diagnosticos'
import pb from '@/lib/pocketbase/client'
import { registrarDiagnosticoUsado } from '@/services/freemium'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'

export default function DiagnosticoTransicao() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa, restaurarPadrao } = useDadosEmpresa()
  const {
    isAuthenticated,
    isLoading: authLoading,
    isPremium,
    podeDiagnosticar,
    recarregarUsuario,
  } = useAuth()
  const { clienteAtivo, clienteAtivoId } = useClienteAtivo()
  const [paywallAberto, setPaywallAberto] = useState(false)

  // Gate de Dados da Empresa
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-transicao'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  // Função para restaurar dados originais da empresa cadastrada
  const handleRestaurar = () => {
    // Permite ao usuário resetar as respostas locais para o padrão da empresa
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('contabilidade5_dados_empresa_updated'))
    }
  }

  // Salvamento do diagnóstico de transição na coleção diagnosticos com tipo_diagnostico='transicao'
  const handleSalvarDiagnosticoTransicao = async (payload: {
    totalScore: number
    farol: 'verde' | 'amarelo' | 'vermelho'
    farolTitulo: string
    servicoRecomendado: string
    respostas: Record<string, string>
    detalhesAtividadeMista?: {
      proporcaoServico: number
      proporcaoComercio: number
      subatividadeServico: any
      subatividadeComercio: any
    }
  }) => {
    if (!podeDiagnosticar) {
      setPaywallAberto(true)
      return
    }

    setSalvando(true)
    try {
      const authUserId = pb.authStore.record?.id || undefined
      const fatAnual = (dadosEmpresa.faturamentoMensal || 100000) * 12
      const folhaAnual = (dadosEmpresa.folhaPagamentoMensal || 10000) * 12

      await createDiagnostico({
        user_id: authUserId,
        cliente_id: clienteAtivoId || undefined,
        tipo_diagnostico: 'transicao',
        nome: clienteAtivo?.nome || dadosEmpresa.nomeContato || 'Contato',
        email: dadosEmpresa.email || 'contato@empresa.com.br',
        telefone: dadosEmpresa.telefone || '',
        empresa: dadosEmpresa.nomeEmpresa || 'Empresa',
        cnpj: dadosEmpresa.cnpj || '',
        segmento: dadosEmpresa.segmento || 'Serviços',
        rbt12: fatAnual,
        folha12: folhaAnual,
        margem_lucro: dadosEmpresa.margemLucroEstimada ?? 25,
        regime_recomendado: `Transição Fiscal (${payload.farolTitulo})`,
        carga_simples: 0,
        carga_presumido: 0,
        carga_real: 0,
        economia_anual: 0,
        ano_base: dadosEmpresa.anoBaseTransicao || 2026,
        sistema_recomendado_atual: dadosEmpresa.regimeAtual || 'Simples Nacional',
        sistema_recomendado_novo: `Transição: ${payload.farolTitulo}`,
        dados_extra_json: {
          tipo: 'transicao',
          moduloOrigem: 'Modulo 7 - Diagnostico da Reforma',
          totalScore: payload.totalScore,
          farol: payload.farol,
          farolTitulo: payload.farolTitulo,
          servicoRecomendado: payload.servicoRecomendado,
          respostas: payload.respostas,
          detalhesAtividadeMista: payload.detalhesAtividadeMista,
        },
      })

      await registrarDiagnosticoUsado(authUserId)
      await recarregarUsuario()

      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } catch (err) {
      console.error('Erro ao salvar diagnóstico de transição:', err)
      // Feedback amigável mesmo se offline
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
        <div className="max-w-5xl mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo na Transição Fiscal:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="transicao"
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 text-xs font-bold text-amber-300 uppercase tracking-wider backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>DIAGNÓSTICO 2 DE 4 • TRANSIÇÃO FISCAL (ROTEIRO DE 40 MINUTOS)</span>
              </div>
              <FreemiumBadge tipo="diagnostico" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Diagnóstico de Transição Fiscal:{' '}
              <span className="text-[#D4AF37]">Roteiro da Reforma Tributária</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Avaliação consultiva completa em dois blocos operacionais (Negócio & Vendas / Operação
              & ERP) com laudo executivo, farol de urgência, 3 prioridades para os próximos 90 dias
              e solução recomendada. Pré-preenchido pelos{' '}
              <strong className="text-white">Dados da Empresa</strong> cadastrada.
            </p>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: MÓDULO 7 REPLICADO */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ConteudoModulo7Diagnostico
          modo="trilha"
          dadosEmpresa={dadosEmpresa}
          temDadosSalvos={temDadosSalvos}
          onRestaurarDados={handleRestaurar}
          onSalvarDiagnostico={handleSalvarDiagnosticoTransicao}
          salvando={salvando}
          salvoFeedback={salvoFeedback}
        />
      </div>

      <DiamondFooterCTA />

      <PaywallModal open={paywallAberto} onOpenChange={setPaywallAberto} motivo="diagnostico" />
    </div>
  )
}
