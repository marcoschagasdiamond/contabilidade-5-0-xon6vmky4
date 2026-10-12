import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Compass,
  Calendar,
  Scale,
  FileCheck2,
  ChevronRight,
  Sparkles,
  Building2,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TrilhaDiagnosticoProps {
  paginaAtual: 'hub' | '360' | 'transicao' | 'regimes' | 'enquadramento'
  onRestaurarDados?: () => void
  temDadosSalvos?: boolean
  nomeEmpresa?: string
}

export const ETAPAS_TRILHA = [
  {
    id: '360' as const,
    numero: '1',
    nome: 'Diagnóstico 360°',
    tag: 'Matriz dos 7 Riscos',
    rota: '/diagnostico-360',
    icone: Compass,
    cor: '#D4AF37',
  },
  {
    id: 'transicao' as const,
    numero: '2',
    nome: 'Transição Fiscal',
    tag: 'Roteiro 40 min • Farol',
    rota: '/diagnostico-transicao',
    icone: Calendar,
    cor: '#F59E0B',
  },
  {
    id: 'regimes' as const,
    numero: '3',
    nome: 'Comparação de Regimes',
    tag: 'Simples vs Presumido vs Real',
    rota: '/diagnostico-regimes',
    icone: Scale,
    cor: '#3B82F6',
  },
  {
    id: 'enquadramento' as const,
    numero: '4',
    nome: 'Enquadramento Completo',
    tag: 'Simulador com Ranking e PDF',
    rota: '/diagnostico',
    icone: FileCheck2,
    cor: '#2ECC71',
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
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Hub de Diagnósticos</span>
            </Link>

            {paginaAtual !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-white">
                  {ETAPAS_TRILHA.find((e) => e.id === paginaAtual)?.nome || 'Diagnóstico'}
                </span>
              </>
            )}

            {nomeEmpresa && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-medium border border-white/10">
                <Building2 className="w-3 h-3" />
                {nomeEmpresa}
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
                className="h-7 text-xs text-slate-300 hover:text-white hover:bg-white/10 font-semibold gap-1.5 px-2.5"
                title="Restaura os valores a partir dos Dados da Empresa cadastrados"
              >
                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                Restaurar dados da empresa
              </Button>
            )}

            <Link
              to="/dados-empresa"
              className="text-xs text-[#D4AF37] hover:underline font-semibold"
            >
              {temDadosSalvos ? 'Ver perfil da empresa' : 'Cadastrar empresa'}
            </Link>
          </div>
        </div>

        {/* 4 Cards da Trilha em linha (responsivo horizontal scroll em telas muito pequenas) */}
        <nav
          aria-label="Trilha de Diagnósticos Tributários"
          className="pt-3 overflow-x-auto scrollbar-none"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 min-w-[560px] md:min-w-0">
            {ETAPAS_TRILHA.map((etapa) => {
              const IconComp = etapa.icone
              const isAtiva = paginaAtual === etapa.id
              return (
                <Link
                  key={etapa.id}
                  to={etapa.rota}
                  className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                    isAtiva
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Número / Ícone */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: isAtiva ? etapa.cor : '#0A1A13',
                      color: isAtiva ? '#07132B' : etapa.cor,
                      border: `1px solid ${etapa.cor}40`,
                    }}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {etapa.numero}.
                      </span>
                      <span
                        className={`text-xs font-bold truncate block ${
                          isAtiva ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {etapa.nome}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">{etapa.tag}</span>
                  </div>

                  {isAtiva && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 animate-ping"
                      style={{ backgroundColor: etapa.cor }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
