import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useProgressoTrilha } from '@/hooks/useProgressoTrilha'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatarCNPJ } from '@/lib/cnpj'
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
  Calculator,
  Compass,
  CheckCircle2,
} from 'lucide-react'

interface IndicativoClienteAtivoTopoProps {
  onCadastrarNovaEmpresa?: () => void
  className?: string
}

/**
 * Indicativo fixo do Cliente Ativo no topo de /dados-empresa
 * Exibido exclusivamente para perfis Analista e Master.
 * Mostra: Nome da empresa + CNPJ + Selo Ativo + Botão "Continuar Análise"
 * (roteando para a etapa pendente da Trilha de Diagnósticos ou para a Calculadora IBS/CBS se completo).
 */
export function IndicativoClienteAtivoTopo({
  onCadastrarNovaEmpresa,
  className = '',
}: IndicativoClienteAtivoTopoProps) {
  const navigate = useNavigate()
  const { isMaster, isAdmin, nivelAcesso, isEmpresario } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { etapa00, etapa01, etapa02, etapa03, etapa04, etapa05, etapa06, algumaEtapaIniciada } =
    useProgressoTrilha()

  // Regra de perfil: analista e master têm acesso aos controles de cliente ativo; empresário não.
  const isAnalistaOuMaster =
    !isEmpresario &&
    (isMaster ||
      isAdmin ||
      nivelAcesso === 'analista' ||
      nivelAcesso === 'master' ||
      nivelAcesso === 'admin')

  const infoAnalise = useMemo(() => {
    const etapasDiagnosticoConcluidas =
      etapa01.estado === 'concluida' &&
      etapa02.estado === 'concluida' &&
      etapa03.estado === 'concluida' &&
      etapa04.estado === 'concluida' &&
      etapa05.estado === 'concluida' &&
      etapa06.estado === 'concluida'

    if (etapasDiagnosticoConcluidas) {
      return {
        rota: '/calculadora-ibs-cbs',
        numeroEtapa: null,
        nomeEtapa: 'Calculadora IBS/CBS',
        detalhe: 'Todos os diagnósticos concluídos',
        subtitulo: 'Abre a Calculadora IBS/CBS pronta para simulação nos 6 módulos',
        completo: true,
      }
    }

    if (!algumaEtapaIniciada && etapa00.estado === 'nao_iniciada') {
      return {
        rota: '/diagnostico-360',
        numeroEtapa: '00',
        nomeEtapa: 'Diagnóstico 360°',
        detalhe: 'Apresentação & Matriz das 7 Frentes',
        subtitulo: 'Clique para iniciar a análise pelo panorama estrutural da empresa',
        completo: false,
      }
    }

    if (etapa01.estado !== 'concluida') {
      return {
        rota: '/diagnostico-configuracoes',
        numeroEtapa: '01',
        nomeEtapa: 'Configurações dos Diagnósticos',
        detalhe: 'Parâmetros base e dados fiscais',
        subtitulo: 'Clique para continuar de onde parou e calibrar os parâmetros',
        completo: false,
      }
    }
    if (etapa02.estado !== 'concluida') {
      return {
        rota: '/diagnostico-autoavaliacao',
        numeroEtapa: '02',
        nomeEtapa: 'Autoavaliação das 7 Frentes',
        detalhe: 'Questionário de maturidade e semáforo',
        subtitulo: 'Clique para continuar o preenchimento das frentes estruturais',
        completo: false,
      }
    }
    if (etapa03.estado !== 'concluida') {
      return {
        rota: '/diagnostico-transicao',
        numeroEtapa: '03',
        nomeEtapa: 'Transição Fiscal 2026–2033',
        detalhe: 'Roteiro de 40 minutos e cronograma',
        subtitulo: 'Clique para continuar a projeção da transição tributária',
        completo: false,
      }
    }
    if (etapa04.estado !== 'concluida') {
      return {
        rota: '/diagnostico-regimes',
        numeroEtapa: '04',
        nomeEtapa: 'Comparação de Regimes',
        detalhe: 'Matriz comparativa dos 4 regimes',
        subtitulo: 'Clique para prosseguir com o comparativo de carga tributária',
        completo: false,
      }
    }
    if (etapa05.estado !== 'concluida') {
      return {
        rota: '/diagnostico',
        numeroEtapa: '05',
        nomeEtapa: 'Enquadramento Completo',
        detalhe: 'Simulador tributário e parecer executivo',
        subtitulo: 'Clique para continuar o enquadramento fiscal detalhado',
        completo: false,
      }
    }
    if (etapa06.estado !== 'concluida') {
      return {
        rota: '/diagnostico-fornecedores',
        numeroEtapa: '06',
        nomeEtapa: 'Análise de Fornecedores',
        detalhe: 'Auditoria de compras e créditos LC 214/2025',
        subtitulo: 'Clique para auditar o perfil dos fornecedores e créditos',
        completo: false,
      }
    }

    return {
      rota: '/calculadora-ibs-cbs',
      numeroEtapa: null,
      nomeEtapa: 'Calculadora IBS/CBS',
      detalhe: 'Diagnóstico concluído',
      subtitulo: 'Abre a Calculadora IBS/CBS pronta para simulação',
      completo: true,
    }
  }, [
    etapa00.estado,
    etapa01.estado,
    etapa02.estado,
    etapa03.estado,
    etapa04.estado,
    etapa05.estado,
    etapa06.estado,
    algumaEtapaIniciada,
  ])

  if (!isAnalistaOuMaster) {
    return null
  }

  const cnpjFormatado = clienteAtivo?.cnpj_cpf
    ? formatarCNPJ(clienteAtivo.cnpj_cpf)
    : 'Não informado'

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0A1A2E] to-[#07132B] border border-[#D4AF37]/40 p-4 sm:p-5 text-white shadow-xl relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Bloco de identificação do Cliente Ativo */}
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Ícone de ajuda com tooltip: Painel do Analista & Master */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    aria-label="Painel do Analista & Master: clique ou passe o mouse para mais detalhes"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  sideOffset={6}
                  className="w-72 max-w-[calc(100vw-32px)] p-3 bg-[#07132B]/95 backdrop-blur-md text-slate-100 border border-[#D4AF37]/40 shadow-2xl rounded-xl z-50 text-left"
                >
                  <div className="flex items-center gap-2 font-bold text-[#D4AF37] text-xs pb-1.5 mb-1.5 border-b border-[#D4AF37]/20">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Painel do Analista & Master</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Ambiente multiempresa para você conduzir diagnósticos tributários, simulações
                    IBS/CBS e propostas isoladas para cada cliente da sua carteira.
                  </p>
                </TooltipContent>
              </Tooltip>

              {clienteAtivo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
                  Cliente Ativo
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Nenhum Cliente Ativo Selecionado
                  </span>

                  {/* Ícone de ajuda com tooltip: orientação de seleção de cliente */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="w-5 h-5 rounded-full bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-500/50 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                        aria-label="O que é o Cliente Ativo? Clique ou passe o mouse para entender"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      className="w-80 max-w-[calc(100vw-32px)] p-3.5 bg-[#07132B]/95 backdrop-blur-md text-slate-100 border border-[#D4AF37]/40 shadow-2xl rounded-xl z-50 text-left space-y-2"
                    >
                      <div className="flex items-center gap-2 font-bold text-[#D4AF37] text-xs pb-1.5 border-b border-[#D4AF37]/20">
                        <Briefcase className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>O que é o Cliente Ativo?</span>
                      </div>

                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        É a empresa selecionada no momento para receber os cálculos, relatórios e
                        dados fiscais.
                      </p>

                      <div className="space-y-1.5 pt-0.5 text-[11px] text-slate-300">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#D4AF37] font-bold">•</span>
                          <span>
                            <strong className="text-white">Isola histórico:</strong> diagnósticos,
                            relatórios e documentos fiscais ficam vinculados a ele.
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#D4AF37] font-bold">•</span>
                          <span>
                            <strong className="text-white">Alimenta simulações:</strong> a
                            Calculadora IBS/CBS herda regime, CNAEs e faturamento deste cliente.
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-[#D4AF37] flex items-center gap-1.5 font-medium">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span>Selecione na carteira ou cadastre uma nova empresa.</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate max-w-full">
                {clienteAtivo?.nome || 'Dados da Empresa (Modo Geral)'}
              </h3>

              {clienteAtivo?.cnpj_cpf && (
                <span className="font-mono text-xs sm:text-sm text-[#D4AF37] font-semibold bg-black/25 px-2 py-0.5 rounded border border-[#D4AF37]/25">
                  {cnpjFormatado}
                </span>
              )}
            </div>

            {clienteAtivo && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                  UF: <strong className="text-white">{clienteAtivo.uf || 'SP'}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Regime:{' '}
                  <strong className="text-white">
                    {clienteAtivo.regime_atual || 'Simples Nacional'}
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Segmento:{' '}
                  <strong className="text-white">{clienteAtivo.segmento || 'Serviços'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Bloco de Ações: Continuar Análise & Cadastrar Outra Empresa */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {onCadastrarNovaEmpresa && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCadastrarNovaEmpresa}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 text-xs font-semibold h-11 px-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span>Cadastrar Outra Empresa</span>
              </Button>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={() => navigate(infoAnalise.rota)}
                  className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#E5C158] text-[#07132B] font-heading font-extrabold text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  aria-label={
                    infoAnalise.completo
                      ? `Continuar Análise: Diagnóstico completo — abrir Calculadora IBS/CBS para ${
                          clienteAtivo?.nome || 'a empresa atual'
                        }`
                      : `Continuar Análise: ${infoAnalise.nomeEtapa} pendente — clique para continuar de onde parou`
                  }
                >
                  <span>Continuar Análise</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                sideOffset={6}
                className="w-80 max-w-[calc(100vw-32px)] p-3.5 bg-[#07132B]/95 backdrop-blur-md text-slate-100 border border-[#D4AF37]/40 shadow-2xl rounded-xl z-50 text-left space-y-2"
              >
                {infoAnalise.completo ? (
                  <>
                    <div className="flex items-center gap-2 font-bold text-[#2ECC71] text-xs pb-1.5 border-b border-[#2ECC71]/30">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Diagnóstico 360° Concluído</span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>Calculadora IBS/CBS</span>
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Abre a simulação tributária completa com o perfil fiscal de{' '}
                        <strong className="text-white">
                          {clienteAtivo?.nome || 'empresa selecionada'}
                        </strong>
                        .
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-[#D4AF37] flex items-center gap-1.5 font-medium">
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span>Clique para abrir a Calculadora nos 6 módulos</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#D4AF37]/20">
                      <div className="flex items-center gap-1.5 font-bold text-[#D4AF37] text-xs">
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span>Trilha de Diagnósticos</span>
                      </div>
                      {infoAnalise.numeroEtapa && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-mono font-bold border border-[#D4AF37]/30">
                          Etapa {infoAnalise.numeroEtapa} pendente
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{infoAnalise.nomeEtapa}</span>
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {infoAnalise.detalhe}.
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">{infoAnalise.subtitulo}.</p>

                    <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-[#D4AF37] flex items-center gap-1.5 font-medium">
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span>Clique para continuar a análise de onde parou</span>
                    </div>
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
