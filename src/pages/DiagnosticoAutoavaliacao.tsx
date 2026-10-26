import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { Button } from '@/components/ui/button'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { PainelSucessoFluxoGuiado } from '@/components/diagnosticos/PainelSucessoFluxoGuiado'
import { createDiagnostico } from '@/services/diagnosticos'
import pb from '@/lib/pocketbase/client'
import { registrarDiagnosticoUsado } from '@/services/freemium'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import {
  SETE_RISCOS_360,
  normalizarAvaliacoesRetrocompativeis,
  type Risco360Item,
} from '@/pages/Diagnostico360'

export default function DiagnosticoAutoavaliacao() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading, podeDiagnosticar, recarregarUsuario } = useAuth()
  const { clienteAtivo, clienteAtivoId } = useClienteAtivo()

  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-autoavaliacao'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  const [avaliacoes, setAvaliacoes] = useState<Record<number, number>>({
    1: 2,
    2: 2,
    3: 3,
    4: 2,
    5: 2,
    6: 2,
    7: 3,
  })

  const [avaliacoesProtecao, setAvaliacoesProtecao] = useState<Record<number, number>>({
    1: 2,
    2: 2,
    3: 2,
    4: 2,
    5: 2,
    6: 2,
    7: 2,
  })

  const [salvandoDiagnostico, setSalvandoDiagnostico] = useState(false)
  const [painelSucessoAberto, setPainelSucessoAberto] = useState(false)
  const [paywallAberto, setPaywallAberto] = useState(false)

  useEffect(() => {
    async function carregarDiagnosticoSalvo() {
      try {
        const authUserId = pb.authStore.record?.id
        const filter = clienteAtivoId
          ? `cliente_id = "${clienteAtivoId}" && (tipo_diagnostico = "autoavaliacao" || tipo_diagnostico = "360")`
          : authUserId
            ? `user_id = "${authUserId}" && (tipo_diagnostico = "autoavaliacao" || tipo_diagnostico = "360")`
            : ''
        if (!filter) return

        const res = await pb.collection('diagnosticos').getList(1, 1, {
          filter,
          sort: '-created',
        })

        if (res.items.length > 0) {
          const ultimo = res.items[0]
          const extra = (ultimo.dados_extra_json as any) || {}
          if (extra.avaliacoes) {
            setAvaliacoes(normalizarAvaliacoesRetrocompativeis(extra.avaliacoes))
          }
          if (extra.avaliacoesProtecao) {
            setAvaliacoesProtecao(normalizarAvaliacoesRetrocompativeis(extra.avaliacoesProtecao))
          }
        }
      } catch (err) {
        console.warn('Diagnóstico anterior não encontrado para autoavaliação:', err)
      }
    }
    carregarDiagnosticoSalvo()
  }, [clienteAtivoId])

  const handleSelectNivel = (riscoId: number, nivel: number) => {
    setAvaliacoes((prev) => ({ ...prev, [riscoId]: nivel }))
  }

  const handleSelectNivelProtecao = (riscoId: number, nivel: number) => {
    setAvaliacoesProtecao((prev) => ({ ...prev, [riscoId]: nivel }))
  }

  const todasRespostas = [...Object.values(avaliacoes), ...Object.values(avaliacoesProtecao)]
  const totalCriticos = todasRespostas.filter((v) => v === 3).length
  const totalAlertas = todasRespostas.filter((v) => v === 2).length
  const totalControlados = todasRespostas.filter((v) => v === 1).length

  const scoresPorFrente = SETE_RISCOS_360.reduce<
    Record<number, { scoreMedio: number; p1: number; p2: number }>
  >((acc, risco) => {
    const p1 = avaliacoes[risco.id] ?? 2
    const p2 = avaliacoesProtecao[risco.id] ?? p1
    const scoreMedio = (p1 + p2) / 2
    acc[risco.id] = { scoreMedio, p1, p2 }
    return acc
  }, {})

  let perfilGlobal: { titulo: string; cor: string; desc: string } = {
    titulo: 'Vulnerabilidade Moderada com Oportunidades Rápidas',
    cor: '#D4AF37',
    desc: 'Sua empresa possui pontos de atenção imediata que, quando saneados, liberam caixa expressivo e criam blindagem para a transição fiscal.',
  }

  if (totalCriticos >= 5) {
    perfilGlobal = {
      titulo: 'Alto Risco Operacional & Financeiro (Prioridade Máxima)',
      cor: '#E74C3C',
      desc: 'Há estrangulamentos críticos de caixa, passivos latentes ou vulnerabilidade patrimonial. Recomendamos acionar o plano de Ações Rápidas de Liquidez imediatamente.',
    }
  } else if (totalCriticos === 0 && totalAlertas <= 4) {
    perfilGlobal = {
      titulo: 'Operação Madura em Direção à Governança Avançada',
      cor: '#2ECC71',
      desc: 'Os riscos básicos estão controlados. O foco agora é alavancagem estruturada, holdings patrimoniais e o Comitê de Transição Tributária.',
    }
  }

  const handleSalvarAutoavaliacao = async () => {
    if (!podeDiagnosticar) {
      setPaywallAberto(true)
      return
    }

    setSalvandoDiagnostico(true)
    try {
      const authUserId = pb.authStore.record?.id || undefined
      const fatAnual = dadosEmpresa.faturamentoMensal ? dadosEmpresa.faturamentoMensal * 12 : 600000
      const folhaAnual = dadosEmpresa.folhaPagamentoMensal
        ? dadosEmpresa.folhaPagamentoMensal * 12
        : 120000

      await createDiagnostico({
        user_id: authUserId,
        cliente_id: clienteAtivoId || undefined,
        tipo_diagnostico: 'autoavaliacao' as any,
        nome: clienteAtivo?.nome || dadosEmpresa.nomeContato || 'Contato',
        email: dadosEmpresa.email || 'contato@empresa.com.br',
        telefone: dadosEmpresa.telefone || '',
        empresa: dadosEmpresa.nomeEmpresa || 'Empresa',
        cnpj: dadosEmpresa.cnpj || '',
        segmento: dadosEmpresa.segmento || 'Serviços',
        rbt12: fatAnual,
        folha12: folhaAnual,
        margem_lucro: dadosEmpresa.margemLucroEstimada ?? 25,
        regime_recomendado: 'Autoavaliação das 7 Frentes',
        carga_simples: 0,
        carga_presumido: 0,
        carga_real: 0,
        economia_anual: 0,
        sistema_recomendado_atual: dadosEmpresa.regimeAtual || 'Simples Nacional',
        sistema_recomendado_novo: perfilGlobal.titulo,
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
          tipo: 'autoavaliacao',
          moduloOrigem: 'Autoavaliação das 7 Frentes na Sua Empresa',
          versaoMatriz: '7_frentes_v2',
          avaliacoes,
          avaliacoesProtecao,
          scoresPorFrente,
          painelResultadosNome: 'Matriz Semáforo de Riscos e Oportunidades',
          planoAcaoNome: 'Plano de Ação 30-60-90',
          resumo: {
            totalCriticos,
            totalAlertas,
            totalControlados,
            totalPerguntas: 14,
            perfil: perfilGlobal.titulo,
            farolNome: 'Matriz Semáforo de Riscos e Oportunidades',
            planoNome: 'Plano de Ação 30-60-90',
          },
          frentesPriorizadas: [
            '1. Plano de Ação 30 Dias (Liquidez Rápida e Crédito)',
            '2. Plano de Ação 60 Dias (Societário, Parcerias e Governança)',
            '3. Plano de Ação 90 Dias (Transição Tributária, Cultura e Processos)',
          ],
        },
      })

      await registrarDiagnosticoUsado(authUserId)
      await recarregarUsuario()
      setPainelSucessoAberto(true)
    } catch (err) {
      console.error('Erro ao salvar Autoavaliação das 7 Frentes:', err)
      setPainelSucessoAberto(true)
    } finally {
      setSalvandoDiagnostico(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* SELETOR CLIENTE ATIVO NO TOPO */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo na Autoavaliação 360°:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="autoavaliacao"
        nomeEmpresa={dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
      />

      {/* HERO DA PÁGINA */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur-md">
                DIAMOND INTELLIGENCE • FERRAMENTA DE AUTOAVALIAÇÃO
              </span>
              <BadgeOrigemPropagada origem="configuracoes" />
              <FreemiumBadge tipo="diagnostico" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Autoavaliação das 7 Frentes <span className="text-[#D4AF37]">na Sua Empresa</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Mapeie em 14 respostas (2 por frente: Exposição/Vulnerabilidade e Proteção/Controle)
              os pontos de atenção e controle da sua operação para gerar a{' '}
              <strong className="text-white">Matriz Semáforo de Riscos e Oportunidades</strong> e o{' '}
              <strong className="text-white">Plano de Ação 30-60-90</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* CONTAINER DO CONTEÚDO PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* PAINEL DE SUCESSO DO FLUXO GUIADO (ESTEIRA) */}
        <PainelSucessoFluxoGuiado
          aberto={painelSucessoAberto}
          onClose={() => setPainelSucessoAberto(false)}
          titulo="Autoavaliação Salva com Sucesso!"
          mensagem="Sua Matriz Semáforo e Plano de Ação 30-60-90 foram persistidos com sucesso e vinculados ao laudo da empresa. Siga agora para a simulação do impacto da Reforma Tributária."
          proximaEtapaNome="Diagnóstico de Transição Fiscal"
          proximaEtapaRota="/diagnostico-transicao"
          segundosAutoRedirect={5}
          etapaConcluidaNumero="ETAPA 02"
          etapaConcluidaNome="Autoavaliação das 7 Frentes"
        />

        {/* SEÇÃO DA AUTOAVALIAÇÃO INTERATIVA DAS 7 FRENTES */}
        <section
          id="autoavaliacao-360"
          className="bg-white rounded-[26px] p-6 sm:p-10 border-2 border-[#D4AF37]/50 shadow-xl space-y-8 scroll-mt-28"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 uppercase mb-2">
                Interatividade Diamond Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
                Classificação das 7 Frentes Estruturais
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Classifique o nível de cada dimensão para gerar a Matriz Semáforo de Riscos e
                Oportunidades e o Plano de Ação 30-60-90.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSalvarAutoavaliacao}
              disabled={salvandoDiagnostico}
              className="self-start sm:self-auto border-[#07132B] text-[#07132B] hover:bg-slate-100 font-bold px-5 h-10"
            >
              {salvandoDiagnostico ? 'Salvando...' : 'Salvar na Conta'}
            </Button>
          </div>

          {/* LISTA DAS 7 FRENTES COM 2 PERGUNTAS CADA (14 PERGUNTAS NO TOTAL) */}
          <div className="space-y-6">
            {SETE_RISCOS_360.map((risco: Risco360Item) => {
              const valorP1 = avaliacoes[risco.id] ?? 2
              const valorP2 = avaliacoesProtecao[risco.id] ?? 2
              const frenteScore = scoresPorFrente[risco.id] || {
                scoreMedio: (valorP1 + valorP2) / 2,
                p1: valorP1,
                p2: valorP2,
              }
              const scoreMedio = frenteScore.scoreMedio

              const statusFrente =
                scoreMedio >= 2.5
                  ? {
                      label: 'Crítico',
                      bg: 'bg-rose-500/15',
                      text: 'text-rose-700',
                      border: 'border-rose-300',
                    }
                  : scoreMedio >= 1.75
                    ? {
                        label: 'Alerta',
                        bg: 'bg-amber-500/15',
                        text: 'text-amber-800',
                        border: 'border-amber-300',
                      }
                    : {
                        label: 'Controlado',
                        bg: 'bg-[#145A32]/15',
                        text: 'text-[#145A32]',
                        border: 'border-[#2ECC71]/40',
                      }

              return (
                <div
                  key={risco.id}
                  className="rounded-2xl bg-slate-50/90 border border-slate-200/90 overflow-hidden shadow-sm transition-all hover:border-[#145A32]/40"
                >
                  <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider block">
                        Frente {risco.id} de 7 • {risco.subtitulo}
                      </span>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0A1A13]">
                        {risco.nome}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Score Médio da Frente:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${statusFrente.bg} ${statusFrente.text} ${statusFrente.border}`}
                      >
                        {scoreMedio.toFixed(1)} / 3.0 • {statusFrente.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Pergunta 1: Exposição & Vulnerabilidade */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                      <div className="space-y-1 max-w-2xl">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#0A1A13]/5 text-[#0A1A13] border border-[#0A1A13]/15">
                          Dimensão: Exposição & Vulnerabilidade
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                          {risco.perguntaAutoavaliacao}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {[
                          { nivel: 1, label: 'Baixo (Controlado)' },
                          { nivel: 2, label: 'Médio (Alerta)' },
                          { nivel: 3, label: 'Alto (Crítico)' },
                        ].map((opt) => {
                          const isSelected = valorP1 === opt.nivel
                          return (
                            <button
                              key={opt.nivel}
                              type="button"
                              onClick={() => handleSelectNivel(risco.id, opt.nivel)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? opt.nivel === 3
                                    ? 'bg-[#0E3520] text-rose-300 border-rose-500 shadow-sm ring-1 ring-rose-500'
                                    : opt.nivel === 2
                                      ? 'bg-[#0E3520] text-amber-300 border-amber-500 shadow-sm ring-1 ring-amber-500'
                                      : 'bg-[#0E3520] text-[#2ECC71] border-[#2ECC71] shadow-sm ring-1 ring-[#2ECC71]'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Pergunta 2: Proteção & Controle */}
                    <div className="p-4 rounded-xl bg-[#0E3520]/5 border border-[#145A32]/25 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                      <div className="space-y-1 max-w-2xl">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#145A32] text-white border border-[#2ECC71]/40">
                          Dimensão: Proteção & Controle
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-[#0A1A13] leading-snug">
                          {risco.perguntaProtecaoControle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {[
                          { nivel: 1, label: 'Baixo (Controlado)' },
                          { nivel: 2, label: 'Médio (Alerta)' },
                          { nivel: 3, label: 'Alto (Crítico)' },
                        ].map((opt) => {
                          const isSelected = valorP2 === opt.nivel
                          return (
                            <button
                              key={opt.nivel}
                              type="button"
                              onClick={() => handleSelectNivelProtecao(risco.id, opt.nivel)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? opt.nivel === 3
                                    ? 'bg-[#0A1A13] text-rose-300 border-rose-500 shadow-sm ring-1 ring-rose-500'
                                    : opt.nivel === 2
                                      ? 'bg-[#0A1A13] text-amber-300 border-amber-500 shadow-sm ring-1 ring-amber-500'
                                      : 'bg-[#0A1A13] text-[#2ECC71] border-[#2ECC71] shadow-sm ring-1 ring-[#2ECC71]'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* PAINEL DE RESULTADO DA AUTOAVALIAÇÃO */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A1A13] text-white border-2 border-[#145A32] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-bold text-[#2ECC71] uppercase tracking-wider block mb-1">
                  Matriz Semáforo de Riscos e Oportunidades • 14 Respostas (7 Frentes × 2 Perguntas)
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {perfilGlobal.titulo}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  {totalCriticos} / 14 Crítico(s)
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {totalAlertas} / 14 Alerta(s)
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#145A32] text-[#2ECC71] border border-[#2ECC71]/40">
                  {totalControlados} / 14 Controlado(s)
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">{perfilGlobal.desc}</p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                Plano de Ação 30-60-90:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                  <span>1. 30 Dias: Liquidez, Crédito & Caixa</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
                  <span>2. 60 Dias: Societário, Risco Hub & Fechamento</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span>3. 90 Dias: Transição Tributária, POPs & Cultura</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSalvarAutoavaliacao}
                disabled={salvandoDiagnostico}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs sm:text-sm h-11 px-6 rounded-xl"
              >
                {salvandoDiagnostico ? 'Salvando...' : 'Salvar Resultado na Conta'}
              </Button>

              <Link
                to="/diagnostico-transicao"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl border border-white/20 transition-all text-center"
              >
                Avançar para Etapa 3: Transição Fiscal →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA INFERIOR DE CONTINUIDADE DA ESTEIRA */}
        <section className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4">
          <h3 className="font-heading font-extrabold text-2xl text-[#07132B]">
            Próxima Etapa da Trilha: Transição Fiscal
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Agora que os 7 riscos foram mapeados, simule o impacto ano a ano da substituição de
            tributos no Diagnóstico de Transição Fiscal (2026–2033).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/diagnostico-transicao"
              className="inline-flex items-center px-6 py-3 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all"
            >
              Acessar Diagnóstico de Transição Fiscal →
            </Link>
            <Link
              to="/diagnosticos"
              className="inline-flex items-center px-6 py-3 rounded-xl font-heading font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Voltar ao Hub de Diagnósticos
            </Link>
          </div>
        </section>
      </div>

      <DiamondFooterCTA />

      <PaywallModal open={paywallAberto} onOpenChange={setPaywallAberto} motivo="diagnostico" />
    </div>
  )
}
