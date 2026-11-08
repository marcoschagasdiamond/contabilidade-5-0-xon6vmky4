import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useProgressoTrilha } from '@/hooks/useProgressoTrilha'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatarCNPJ } from '@/lib/cnpj'
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  ExternalLink,
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
        nomeEtapa: 'Calculadora IBS/CBS',
        subtitulo: 'Diagnóstico completo • Pronto para simulação nos 6 módulos',
        completo: true,
      }
    }

    if (!algumaEtapaIniciada && etapa00.estado === 'nao_iniciada') {
      return {
        rota: '/diagnostico-360',
        nomeEtapa: 'Diagnóstico 360° (Etapa 00)',
        subtitulo: 'Apresentação & Matriz das 7 Frentes Estruturais',
        completo: false,
      }
    }

    if (etapa01.estado !== 'concluida') {
      return {
        rota: '/diagnostico-configuracoes',
        nomeEtapa: 'Configurações dos Diagnósticos (Etapa 01)',
        subtitulo: 'Parâmetros base da empresa',
        completo: false,
      }
    }
    if (etapa02.estado !== 'concluida') {
      return {
        rota: '/diagnostico-autoavaliacao',
        nomeEtapa: 'Autoavaliação das 7 Frentes (Etapa 02)',
        subtitulo: 'Questionário de maturidade e semáforo',
        completo: false,
      }
    }
    if (etapa03.estado !== 'concluida') {
      return {
        rota: '/diagnostico-transicao',
        nomeEtapa: 'Transição Fiscal (Etapa 03)',
        subtitulo: 'Roteiro de 40 minutos 2026–2033',
        completo: false,
      }
    }
    if (etapa04.estado !== 'concluida') {
      return {
        rota: '/diagnostico-regimes',
        nomeEtapa: 'Comparação de Regimes (Etapa 04)',
        subtitulo: 'Matriz dos 4 regimes tributários',
        completo: false,
      }
    }
    if (etapa05.estado !== 'concluida') {
      return {
        rota: '/diagnostico',
        nomeEtapa: 'Enquadramento Completo (Etapa 05)',
        subtitulo: 'Simulador e parecer executivo',
        completo: false,
      }
    }
    if (etapa06.estado !== 'concluida') {
      return {
        rota: '/diagnostico-fornecedores',
        nomeEtapa: 'Análise de Fornecedores (Etapa 06)',
        subtitulo: 'Auditoria de compras e créditos LC 214/2025',
        completo: false,
      }
    }

    return {
      rota: '/calculadora-ibs-cbs',
      nomeEtapa: 'Calculadora IBS/CBS',
      subtitulo: 'Diagnóstico concluído',
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
    <div
      className={`rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0A1A2E] to-[#07132B] border border-[#D4AF37]/40 p-4 sm:p-5 text-white shadow-xl relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Bloco de identificação do Cliente Ativo */}
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 inline-flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#D4AF37]" />
              Painel do Analista & Master
            </span>

            {clienteAtivo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
                Cliente Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Nenhum Cliente Ativo Selecionado
              </span>
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

          {clienteAtivo ? (
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
          ) : (
            <p className="text-xs text-slate-300">
              Selecione um cliente na carteira ou cadastre uma nova empresa para isolar o histórico
              e simulações.
            </p>
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

          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              onClick={() => navigate(infoAnalise.rota)}
              className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#E5C158] text-[#07132B] font-heading font-extrabold text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continuar Análise</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Button>
            <span className="text-[11px] text-slate-300 hidden sm:inline text-right max-w-[280px] truncate">
              {infoAnalise.completo ? 'Calculadora IBS/CBS' : `Próximo: ${infoAnalise.nomeEtapa}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
