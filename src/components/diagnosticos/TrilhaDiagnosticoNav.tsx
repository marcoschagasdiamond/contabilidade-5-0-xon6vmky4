import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export type PaginaDiagnostico =
  | 'hub'
  | '360'
  | 'configuracoes'
  | 'autoavaliacao'
  | 'transicao'
  | 'regimes'
  | 'enquadramento'
  | 'fornecedores'
  | 'relatorio'

export interface TrilhaDiagnosticoProps {
  paginaAtual: PaginaDiagnostico
  onRestaurarDados?: () => void
  temDadosSalvos?: boolean
  nomeEmpresa?: string
}

export const ETAPAS_TRILHA = [
  {
    id: '360' as const,
    numero: '00',
    nome: 'Diagnóstico 360°',
    tag: 'Apresentação & Matriz 7 Frentes',
    rota: '/diagnostico-360',
    cor: '#D4AF37',
  },
  {
    id: 'configuracoes' as const,
    numero: '01',
    nome: 'Configurações',
    tag: 'Parâmetros Base • Propagação',
    rota: '/diagnostico-configuracoes',
    cor: '#D4AF37',
  },
  {
    id: 'autoavaliacao' as const,
    numero: '02',
    nome: 'Autoavaliação das 7 Frentes',
    tag: '14 Respostas • Semáforo • 30-60-90',
    rota: '/diagnostico-autoavaliacao',
    cor: '#2ECC71',
  },
  {
    id: 'transicao' as const,
    numero: '03',
    nome: 'Transição Fiscal',
    tag: 'Roteiro 40 min • 2026–2033',
    rota: '/diagnostico-transicao',
    cor: '#F59E0B',
  },
  {
    id: 'regimes' as const,
    numero: '04',
    nome: 'Comparação de Regime',
    tag: 'Simples vs Presumido vs Real',
    rota: '/diagnostico-regimes',
    cor: '#3B82F6',
  },
  {
    id: 'enquadramento' as const,
    numero: '05',
    nome: 'Enquadramento Completo',
    tag: 'Simulador com Ranking e PDF',
    rota: '/diagnostico',
    cor: '#10B981',
  },
  {
    id: 'fornecedores' as const,
    numero: '06',
    nome: 'Análise de Fornecedores',
    tag: 'Crédito Perdido • 2026–2033',
    rota: '/diagnostico-fornecedores',
    cor: '#D4AF37',
  },
]

export default function TrilhaDiagnosticoNav({
  paginaAtual,
  onRestaurarDados,
  temDadosSalvos,
  nomeEmpresa,
}: TrilhaDiagnosticoProps) {
  const location = useLocation()

  return (
    <div className="bg-[#07132B] text-white border-b border-[#D4AF37]/30 shadow-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5">
        {/* Top bar: Breadcrumb / Empresa / Botão Restaurar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/diagnosticos"
              className={`inline-flex items-center gap-1.5 font-bold transition-colors ${
                paginaAtual === 'hub' ? 'text-[#D4AF37]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-[#D4AF37] font-mono text-xs">◆</span>
              <span>Hub de Diagnósticos</span>
            </Link>

            {paginaAtual !== 'hub' && (
              <>
                <span className="text-slate-500">/</span>
                <span className="font-semibold text-white">
                  {ETAPAS_TRILHA.find((e) => e.id === paginaAtual)?.nome || 'Diagnóstico'}
                </span>
              </>
            )}

            {nomeEmpresa && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-medium border border-white/10">
                <span className="text-[#D4AF37] font-bold">EMPRESA:</span> {nomeEmpresa}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRestaurarDados && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRestaurarDados}
                className="h-7 text-xs text-slate-300 hover:text-white hover:bg-white/10 font-semibold px-2.5"
                title="Restaura os valores a partir dos Dados da Empresa cadastrados"
              >
                Restaurar dados da empresa
              </Button>
            )}

            <Link
              to="/diagnosticos/configuracoes"
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                paginaAtual === 'configuracoes'
                  ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37]'
                  : 'text-[#D4AF37] hover:bg-[#D4AF37]/15 border-[#D4AF37]/40'
              }`}
            >
              Configurações
            </Link>

            <Link
              to="/diagnostico/relatorio"
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                paginaAtual === 'relatorio'
                  ? 'bg-[#2ECC71] text-[#07132B] border-[#2ECC71]'
                  : 'text-[#2ECC71] hover:bg-[#2ECC71]/15 border-[#2ECC71]/40'
              }`}
            >
              Relatório Consolidado
            </Link>

            <Link
              to="/dados-empresa"
              className="text-xs text-slate-400 hover:text-white hover:underline font-medium"
            >
              {temDadosSalvos ? 'Dados da Empresa' : 'Cadastrar'}
            </Link>
          </div>
        </div>

        {/* Cards da Trilha em linha (SEM ÍCONES - padrão tipográfico Diamond Group) */}
        <nav
          aria-label="Trilha de Diagnósticos Tributários"
          className="pt-3 overflow-x-auto scrollbar-none"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5 min-w-[880px] md:min-w-0">
            {ETAPAS_TRILHA.map((etapa) => {
              const isAtiva = paginaAtual === etapa.id
              return (
                <Link
                  key={etapa.id}
                  to={etapa.rota}
                  className={`group relative p-2 sm:p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isAtiva
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: isAtiva ? etapa.cor : 'rgba(255,255,255,0.08)',
                        color: isAtiva ? '#07132B' : etapa.cor,
                      }}
                    >
                      {etapa.numero}
                    </span>
                    {isAtiva && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 animate-ping"
                        style={{ backgroundColor: etapa.cor }}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`text-[11px] sm:text-xs font-bold leading-tight block ${
                        isAtiva ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {etapa.nome}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate block mt-0.5">
                      {etapa.tag}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
