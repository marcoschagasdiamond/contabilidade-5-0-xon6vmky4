import React from 'react'
import type { MetricasPipelineCrm } from '@/types/pipelineLead'
import { formatarValorCompacto } from '@/lib/pipelineLeadUtils'

interface DashboardMetricasCrmProps {
  metricas: MetricasPipelineCrm
  onFiltrarQuentes?: () => void
}

export function DashboardMetricasCrm({ metricas, onFiltrarQuentes }: DashboardMetricasCrmProps) {
  return (
    <div className="space-y-4">
      {/* GRID PRINCIPAL DE CARDS DE INDICADORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. VOLUME DE LEADS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Volume Recebido
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
              📊
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              {metricas.totalLeads}
            </span>
            <span className="text-xs text-slate-400 font-semibold">leads totais</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Últimos 7 dias: <strong className="text-slate-800">{metricas.leads7Dias}</strong>
            </span>
            <span>
              30 dias: <strong className="text-slate-800">{metricas.leads30Dias}</strong>
            </span>
          </div>
        </div>

        {/* 2. TAXA DE CONVERSÃO (NOVO -> CLIENTE) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-black border border-emerald-100">
              🎯
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-600">
              {metricas.taxaConversaoNovoParaCliente.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </span>
            <span className="text-xs text-slate-400 font-semibold">novo → cliente</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Clientes ativos:{' '}
              <strong className="text-emerald-700">{metricas.totalConvertidos}</strong>
            </span>
            <span>
              No topo do funil: <strong className="text-slate-800">{metricas.totalNovos}</strong>
            </span>
          </div>
        </div>

        {/* 3. TEMPO MÉDIO DE PRIMEIRO CONTATO */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tempo de Resposta
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-black border border-purple-100">
              ⚡
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              {metricas.tempoMedioPrimeiroContatoFormatado}
            </span>
            <span className="text-xs text-slate-400 font-semibold">1º contato</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Média até 1ª ação</span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              SLA Recomendado &lt; 24h
            </span>
          </div>
        </div>

        {/* 4. LEADS QUENTES ESFRIANDO */}
        <div
          onClick={onFiltrarQuentes}
          className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
            metricas.leadsQuentesEsfriando > 0
              ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200/60 hover:bg-rose-50/70 shadow-xs'
              : 'bg-white border-slate-200/80 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Leads Esfriando
            </span>
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border ${
                metricas.leadsQuentesEsfriando > 0
                  ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              🔥
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-heading font-black ${
                metricas.leadsQuentesEsfriando > 0 ? 'text-rose-600' : 'text-[#07132B]'
              }`}
            >
              {metricas.leadsQuentesEsfriando}
            </span>
            <span className="text-xs text-slate-400 font-semibold">precisam de atenção</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Score &ge; 40 pts sem ação</span>
            {metricas.leadsQuentesEsfriando > 0 ? (
              <span className="font-extrabold text-rose-700 underline text-[11px]">
                Filtrar no funil &rarr;
              </span>
            ) : (
              <span className="text-emerald-600 font-bold text-[11px]">Nenhum em risco</span>
            )}
          </div>
        </div>
      </div>

      {/* LINHA DE RESUMO FINANCEIRO DO FUNIL */}
      <div className="bg-gradient-to-r from-[#07132B] via-[#0E2045] to-[#07132B] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D4AF37] block">
            Valor Potencial do Pipeline
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
              {formatarValorCompacto(metricas.valorPotencialTotal)}
            </span>
            <span className="text-xs text-slate-300">
              em faturamento ponderado das PMEs no funil
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">1. Novos</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {formatarValorCompacto(metricas.valorPotencialPorEstagio.novo)}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">2. Contato</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {formatarValorCompacto(metricas.valorPotencialPorEstagio.contato_feito)}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">3. Reunião</span>
            <span className="text-xs sm:text-sm font-black text-amber-300">
              {formatarValorCompacto(metricas.valorPotencialPorEstagio.reuniao)}
            </span>
          </div>
          <div className="bg-emerald-500/20 rounded-xl px-3 py-1.5 border border-emerald-400/30 text-center">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">
              4. Convertidos
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-300">
              {formatarValorCompacto(metricas.valorPotencialPorEstagio.cliente)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
