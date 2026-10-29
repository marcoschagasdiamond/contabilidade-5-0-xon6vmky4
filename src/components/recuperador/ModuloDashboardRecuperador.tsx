import React from 'react'
import type { ResultadosRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

import { QuadroTesesContextuaisRecuperador } from './QuadroTesesContextuaisRecuperador'
import { AvisoOrientativo } from '@/components/common/AvisoOrientativo'

interface Props {
  resultados: ResultadosRecuperador
  cenarioSelecionado: 'integral' | 'conservador'
  segmento?: string
  regimeAtual?: string
  onChangeCenario: (cenario: 'integral' | 'conservador') => void
  onGerarPdf: () => void
  onSalvarAnalise: () => void
  onSelecionarTese?: (teseId: string) => void
}

export default function ModuloDashboardRecuperador({
  resultados,
  cenarioSelecionado,
  segmento,
  regimeAtual,
  onChangeCenario,
  onGerarPdf,
  onSalvarAnalise,
  onSelecionarTese,
}: Props) {
  const valorExibir =
    cenarioSelecionado === 'integral'
      ? resultados.totalIntegralCorrigido
      : resultados.totalConservadorCorrigido

  const originalExibir =
    cenarioSelecionado === 'integral'
      ? resultados.totalIntegralOriginal
      : resultados.totalConservadorOriginal

  const selicExibir =
    cenarioSelecionado === 'integral'
      ? resultados.totalIntegralSelic
      : resultados.totalConservadorSelic

  return (
    <div className="space-y-6">
      {/* SELETOR DE CENÁRIO CONSERVADOR X INTEGRAL */}
      <div className="bg-[#07132B] text-white rounded-2xl p-6 border border-[#D4AF37]/30 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Dashboard Executivo • Recuperação 5.0
              </span>
              {segmento && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  Setor: {segmento}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Potencial Total Recuperável: {formatarMoeda(valorExibir)}
            </h2>
            <p className="text-xs text-slate-300 mt-1 mb-2.5">
              Valores acumulados nos últimos 60 meses com correção monetária pela taxa SELIC para as{' '}
              {resultados.resultadosTeses.length} teses aplicáveis ao setor{' '}
              {segmento || 'selecionado'}.
            </p>
            <AvisoOrientativo variante="curta" tema="escuro" className="max-w-2xl" />
          </div>

          {/* TOGGLE CENÁRIO INTEGRAL VS CONSERVADOR */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/10 border border-white/10">
            <button
              type="button"
              onClick={() => onChangeCenario('integral')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cenarioSelecionado === 'integral'
                  ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Cenário Integral ({formatarMoeda(resultados.totalIntegralCorrigido)})
            </button>
            <button
              type="button"
              onClick={() => onChangeCenario('conservador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cenarioSelecionado === 'conservador'
                  ? 'bg-emerald-500 text-[#07132B] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Cenário Conservador ({formatarMoeda(resultados.totalConservadorCorrigido)})
            </button>
          </div>
        </div>

        {/* 3 CARDS DE KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Principal Original</span>
            <span className="text-lg font-bold font-mono text-white block mt-0.5">
              {formatarMoeda(originalExibir)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Soma histórica das competências
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">
              Acréscimo Taxa SELIC
            </span>
            <span className="text-lg font-bold font-mono text-[#D4AF37] block mt-0.5">
              +{formatarMoeda(selicExibir)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ganho médio financeiro de ~
              {originalExibir > 0 ? ((selicExibir / originalExibir) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">
              {cenarioSelecionado === 'integral' ? 'Todas as Teses' : 'Apenas Teses Verdes'}
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400 block mt-0.5">
              {formatarMoeda(valorExibir)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Total disponível para PER/DCOMP
            </span>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO DO DASHBOARD */}
        <div className="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-white/10">
          <button
            type="button"
            onClick={onSalvarAnalise}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#07132B] font-bold text-xs hover:bg-[#c49f2e] transition-colors shadow-sm"
          >
            Salvar Análise na Carteira
          </button>
          <button
            type="button"
            onClick={onGerarPdf}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Gerar Parecer Técnico em PDF
          </button>
        </div>
      </div>

      {/* AVISO LEGAL COMPLETO NO RESUMO FINAL DO DASHBOARD EXECUTIVO */}
      <AvisoOrientativo variante="completa" tema="claro" />

      {/* CARDS DE DISTRIBUIÇÃO: POR TRIBUTO & POR FAROL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QUADRO DE TESES EXCLUSIVAS DO PERFIL */}
        <div className="md:col-span-2">
          <QuadroTesesContextuaisRecuperador
            segmentoSelecionado={segmento}
            regimeSelecionado={regimeAtual}
            onSelecionarTese={onSelecionarTese}
          />
        </div>

        {/* DISTRIBUIÇÃO POR TRIBUTO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide pb-3 border-b border-slate-100">
            Distribuição por Bloco de Tributo
          </h3>
          <div className="space-y-4 pt-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>PIS / COFINS (Tributos sobre Faturamento)</span>
                <span className="font-mono text-[#07132B]">
                  {formatarMoeda(resultados.totalPisCofinsCorrigido)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${
                      resultados.totalIntegralCorrigido > 0
                        ? (resultados.totalPisCofinsCorrigido / resultados.totalIntegralCorrigido) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block text-right font-mono">
                {resultados.totalIntegralCorrigido > 0
                  ? (
                      (resultados.totalPisCofinsCorrigido / resultados.totalIntegralCorrigido) *
                      100
                    ).toFixed(1)
                  : 0}
                % do total
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Folha de Pagamento & Previdenciário (INSS/RAT)</span>
                <span className="font-mono text-[#07132B]">
                  {formatarMoeda(resultados.totalFolhaCorrigido)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${
                      resultados.totalIntegralCorrigido > 0
                        ? (resultados.totalFolhaCorrigido / resultados.totalIntegralCorrigido) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block text-right font-mono">
                {resultados.totalIntegralCorrigido > 0
                  ? (
                      (resultados.totalFolhaCorrigido / resultados.totalIntegralCorrigido) *
                      100
                    ).toFixed(1)
                  : 0}
                % do total
              </span>
            </div>
          </div>
        </div>

        {/* DISTRIBUIÇÃO POR FAROL DE RISCO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide pb-3 border-b border-slate-100">
            Distribuição por Farol de Risco Jurídico
          </h3>
          <div className="space-y-4 pt-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="text-emerald-800">
                  Farol Verde (Jurisprudência Pacificada / Baixo Risco)
                </span>
                <span className="font-mono text-emerald-800">
                  {formatarMoeda(resultados.totalVerdeCorrigido)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${
                      resultados.totalIntegralCorrigido > 0
                        ? (resultados.totalVerdeCorrigido / resultados.totalIntegralCorrigido) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="text-amber-800">
                  Farol Amarelo (Depende de Laudo/Auditoria • Moderado)
                </span>
                <span className="font-mono text-amber-800">
                  {formatarMoeda(resultados.totalAmareloCorrigido)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${
                      resultados.totalIntegralCorrigido > 0
                        ? (resultados.totalAmareloCorrigido / resultados.totalIntegralCorrigido) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="text-rose-800">Farol Vermelho (Tese em Disputa / Alto Risco)</span>
                <span className="font-mono text-rose-800">
                  {formatarMoeda(resultados.totalVermelhoCorrigido)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${
                      resultados.totalIntegralCorrigido > 0
                        ? (resultados.totalVermelhoCorrigido / resultados.totalIntegralCorrigido) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIZ DE TESES E CLASSIFICAÇÃO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide pb-4 border-b border-slate-100">
          Quadro Consolidado por Tese & Risco
        </h3>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold">Tese</th>
                <th className="py-2.5 px-3 font-bold">Módulo</th>
                <th className="py-2.5 px-3 font-bold text-center">Farol</th>
                <th className="py-2.5 px-3 font-bold text-right">Original (5 Anos)</th>
                <th className="py-2.5 px-3 font-bold text-right">SELIC</th>
                <th className="py-2.5 px-3 font-bold text-right">Total Corrigido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultados.resultadosTeses.map((tese) => (
                <tr key={tese.teseId} className={tese.ativa ? 'hover:bg-slate-50' : 'opacity-40'}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    <span className="font-bold block">{tese.titulo}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{tese.fundamento}</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600">
                    {tese.modulo === 'pis_cofins' ? 'PIS/COFINS' : 'Folha/INSS'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        tese.farol === 'verde'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tese.farol === 'amarelo'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tese.farol.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatarMoeda(tese.valorOriginalTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    +{formatarMoeda(tese.correcaoSelicTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#07132B]">
                    {formatarMoeda(tese.totalCorrigido)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
