import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalculadoraProvider, useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import Modulo1Configuracoes from '@/components/calculadora/Modulo1Configuracoes'
import Modulo2CalculadoraSimples from '@/components/calculadora/Modulo2CalculadoraSimples'
import Modulo3ComparativoRegimes from '@/components/calculadora/Modulo3ComparativoRegimes'
import Modulo4SimuladorCreditos from '@/components/calculadora/Modulo4SimuladorCreditos'
import Modulo5TransicaoCronograma from '@/components/calculadora/Modulo5TransicaoCronograma'
import Modulo6Dashboard from '@/components/calculadora/Modulo6Dashboard'
import {
  Sliders,
  Calculator,
  Scale,
  Coins,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react'

type ModuloId = 'modulo1' | 'modulo2' | 'modulo3' | 'modulo4' | 'modulo5' | 'modulo6'

interface NavItem {
  id: ModuloId
  numero: string
  titulo: string
  subtitulo: string
  icon: React.ComponentType<{ className?: string }>
}

const MODULOS_NAV: NavItem[] = [
  {
    id: 'modulo1',
    numero: '01',
    titulo: 'Configurações',
    subtitulo: 'Alíquotas e Regimes',
    icon: Sliders,
  },
  {
    id: 'modulo2',
    numero: '02',
    titulo: 'Calculadora Simples',
    subtitulo: 'Operação Unitária',
    icon: Calculator,
  },
  {
    id: 'modulo3',
    numero: '03',
    titulo: 'Comparativo Regimes',
    subtitulo: 'Real, Presumido, Simples e IVA',
    icon: Scale,
  },
  {
    id: 'modulo4',
    numero: '04',
    titulo: 'Simulador de Créditos',
    subtitulo: 'Antes versus Depois',
    icon: Coins,
  },
  {
    id: 'modulo5',
    numero: '05',
    titulo: 'Transição 2026-2033',
    subtitulo: 'Cronograma e Anos Críticos',
    icon: Calendar,
  },
  {
    id: 'modulo6',
    numero: '06',
    titulo: 'Dashboard Executivo',
    subtitulo: 'KPIs, Gráficos e Resumo',
    icon: LayoutDashboard,
  },
]

function CalculadoraConteudo() {
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('modulo6') // Inicia no Dashboard ou Módulo 1
  const { resultadoDashboard } = useCalculadoraIbsCbs()

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER DIAMOND */}
      <DiamondHeader
        badge="DIAMOND GROUP • MOTOR TRIBUTÁRIO 5.0"
        titulo="Calculadora IBS / CBS Integrada"
        subtitulo="Simulador completo da Reforma Tributária (EC 132/2023 e LC 214/2025) com 6 módulos conectados em tempo real: alíquotas do IVA Dual, apuração unitária, matriz comparativa de regimes, crédito financeiro irrestrito, cronograma de transição 2026-2033 e dashboard executivo."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-bold text-slate-200">Motor Ativo:</span>
            <span className="text-[#D4AF37] font-semibold">
              CBS 8,80% + IBS 17,70% = 26,50% (Soma de Referência)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>
              Regime Recomendado:{' '}
              <strong className="text-emerald-400 font-mono">
                {resultadoDashboard.regimeRecomendado}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Alíquota Efetiva Nova:{' '}
              <strong className="text-[#D4AF37] font-mono">
                {resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL COM MENU LATERAL E CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* MENU LATERAL / NAVEGAÇÃO DE ABAS */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-md lg:sticky lg:top-24">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                6 Módulos Interligados
              </span>
              <span className="text-[11px] text-slate-500">Selecione para simular</span>
            </div>

            <nav className="space-y-1.5 flex flex-col">
              {MODULOS_NAV.map((item) => {
                const Icon = item.icon
                const isActive = moduloAtivo === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModuloAtivo(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                      isActive
                        ? 'bg-[#07132B] text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#07132B]'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-[#07132B]/10 group-hover:text-[#07132B]'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-[#D4AF37]' : 'text-[#07132B]'
                          }`}
                        >
                          {item.titulo}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isActive ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {item.numero}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] block truncate mt-0.5 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitulo}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-slate-100 px-3 py-2 bg-slate-50/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#07132B]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Dados Compartilhados
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Qualquer alteração em alíquotas ou faturamento repercute instantaneamente nos outros
                5 módulos.
              </p>
            </div>
          </aside>

          {/* ÁREA DE CONTEÚDO DO MÓDULO SELECIONADO */}
          <main className="flex-1 w-full min-w-0">
            {moduloAtivo === 'modulo1' && <Modulo1Configuracoes />}
            {moduloAtivo === 'modulo2' && <Modulo2CalculadoraSimples />}
            {moduloAtivo === 'modulo3' && <Modulo3ComparativoRegimes />}
            {moduloAtivo === 'modulo4' && <Modulo4SimuladorCreditos />}
            {moduloAtivo === 'modulo5' && <Modulo5TransicaoCronograma />}
            {moduloAtivo === 'modulo6' && <Modulo6Dashboard />}

            {/* AVISO LEGAL DE ESTIMATIVA CONFORME ESPECIFICAÇÃO */}
            <div className="mt-12 p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#07132B] text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Aviso Legal e Premissas de Simulação
              </div>
              <p className="leading-relaxed">
                As alíquotas e cálculos apresentados nesta calculadora são estimativas técnicas
                baseadas no texto promulgado da Emenda Constitucional nº 132/2023, nas disposições
                da Lei Complementar nº 214/2025 e nas notas técnicas do Ministério da Fazenda
                (alíquota padrão de referência de 26,50%). As alíquotas definitivas do IBS e da CBS
                estão sujeitas à fixação anual pelo Comitê Gestor do IBS (CGIBS) e pelo Senado
                Federal, bem como a legislações estaduais e municipais específicas durante o período
                de transição (2026–2033).
              </p>
              <p className="leading-relaxed text-slate-500">
                Esta simulação tem finalidade exclusivamente consultiva, analítica e educacional.
                Não substitui o planejamento tributário formal nem a auditoria contábil
                individualizada para sua empresa.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Quer validar o planejamento da sua empresa com nossos tributaristas?"
        subtitulo="Nossa equipe analisa seus balancetes, histórico de compras e parametrização fiscal para blindar seu caixa antes da entrada da CBS em 2027."
      />
    </div>
  )
}

export default function CalculadoraIbsCbs() {
  return (
    <CalculadoraProvider>
      <CalculadoraConteudo />
    </CalculadoraProvider>
  )
}
