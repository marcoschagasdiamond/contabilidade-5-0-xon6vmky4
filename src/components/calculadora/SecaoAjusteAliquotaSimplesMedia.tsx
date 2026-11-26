import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw, Percent } from 'lucide-react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { obterAliquotasCreditoPorAno } from '@/lib/calculoFornecedores'
import {
  temAjusteAliquotaSimplesMedia,
  temAjusteIvaDualCenarioCheio,
  type AjusteAliquotaSimplesMedia,
} from '@/lib/aliquotaSimplesMediaConfig'
import { obterFaseTransicaoPorAno } from '@/types/calculadoraIbsCbs'
import { ANOS_SIMULACAO_DISPONIVEIS, type AnoBaseSimulacao } from '@/lib/reformaTributaria'

/**
 * Ajuste da alíquota média do Simples Nacional (crédito presumido de compras de
 * optantes do Simples — LC 214/2025 Anexos XVIII–XXII; LC 123/2006 art. 23).
 *
 * Permite (a) valor único (%) para todos os anos ou (b) valores por ano (2026–2040).
 * Precedência: por ano > valor único > estimativa padrão (obterAliquotasCreditoPorAno).
 * Nenhuma fórmula muda: é só uma substituição de fonte de valor.
 */
export function SecaoAjusteAliquotaSimplesMedia() {
  const { config, updateConfig } = useCalculadoraIbsCbs()

  const ajuste: AjusteAliquotaSimplesMedia = config.ajusteAliquotaSimplesMedia ?? {}
  const temAjuste = temAjusteAliquotaSimplesMedia(ajuste)

  const estimativas = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const ano of ANOS_SIMULACAO_DISPONIVEIS) {
      mapa.set(ano, obterAliquotasCreditoPorAno(ano).aliquotaSimplesMedia * 100)
    }
    return mapa
  }, [])

  const normalizarValor = (raw: string): number | null => {
    const limpo = raw.replace(',', '.').trim()
    if (limpo === '') return null
    const n = Number(limpo)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.min(100, Math.max(0, n))
  }

  const definirValorUnico = (raw: string) => {
    const v = normalizarValor(raw)
    const porAnoAtual = ajuste.porAno ?? null
    updateConfig({
      ajusteAliquotaSimplesMedia: { valorUnico: v, porAno: porAnoAtual },
    })
  }

  const definirPorAno = (ano: AnoBaseSimulacao, raw: string) => {
    const v = normalizarValor(raw)
    const porAnoAtual = { ...(ajuste.porAno ?? {}) }
    if (v == null) {
      delete porAnoAtual[String(ano)]
    } else {
      porAnoAtual[String(ano)] = v
    }
    updateConfig({
      ajusteAliquotaSimplesMedia: {
        valorUnico: ajuste.valorUnico ?? null,
        porAno: Object.keys(porAnoAtual).length > 0 ? porAnoAtual : null,
      },
    })
  }

  const restaurarPadrao = () => {
    updateConfig({ ajusteAliquotaSimplesMedia: { valorUnico: null, porAno: null } })
  }

  const restaurarPadraoIvaDual = () => {
    updateConfig({ ajusteIvaDualCenarioCheio: { valorUnico: null } })
  }

  // IVA Dual — Cenário Cheio (Módulo 2): valor único (%), sem ajuste = tabela de fases
  const ivaDualAjuste = config.ajusteIvaDualCenarioCheio
  const temAjusteIvaDual = temAjusteIvaDualCenarioCheio(ivaDualAjuste)
  const totalIvaDualTabela = useMemo(() => {
    const ano =
      typeof config.anoTransicao === 'number'
        ? (config.anoTransicao as AnoBaseSimulacao)
        : (2033 as AnoBaseSimulacao)
    return obterFaseTransicaoPorAno(ano)?.totalIvaDual ?? null
  }, [config.anoTransicao])

  const definirIvaDualCenarioCheio = (raw: string) => {
    const limpo = raw.replace(',', '.').trim()
    const n = limpo === '' ? null : Number(limpo)
    const v = n != null && Number.isFinite(n) && n > 0 ? Math.min(100, Math.max(0, n)) : null
    updateConfig({ ajusteIvaDualCenarioCheio: { valorUnico: v } })
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
              Alíquota Média do Simples Nacional
            </span>
            <CardTitle className="text-lg font-heading text-[#07132B] mt-0.5">
              Crédito Presumido de Compras de Optantes do Simples
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Estimativa da alíquota média efetiva do DAS (LC 214/2025, Anexos XVIII–XXII; LC
              123/2006 art. 23) — ajustável aqui. Precedência: valor por ano &gt; valor único &gt;
              estimativa padrão.
            </CardDescription>
          </div>
          <Percent className="w-5 h-5 text-amber-600 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {/* Valor único */}
        <div className="min-w-0 w-full">
          <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
            <Label
              htmlFor="ajusteSimplesValorUnico"
              className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
            >
              Valor único (%) — vale para todos os anos
            </Label>
            {temAjuste && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                Ajuste ativo
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              id="ajusteSimplesValorUnico"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={ajuste.valorUnico ?? ''}
              placeholder={
                temAjuste
                  ? 'definido por ano'
                  : `ex.: ${(estimativas.get(2033) ?? 6.5).toFixed(2).replace('.', ',')}`
              }
              onChange={(e) => definirValorUnico(e.target.value)}
              className="pr-8 font-mono font-medium"
              autoComplete="off"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Deixe vazio para usar a estimativa padrão de cada ano.
          </p>
        </div>

        {/* Valores por ano */}
        <div className="min-w-0 w-full">
          <Label
            htmlFor="ajusteSimplesAno2026"
            className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
          >
            Valores por ano (%) — 2026 a 2040 (sobrepõem o valor único)
          </Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ANOS_SIMULACAO_DISPONIVEIS.map((ano) => {
              const padrao = estimativas.get(ano) ?? 0
              const temValorAno = ajuste.porAno?.[String(ano)] != null
              return (
                <div key={ano} className="min-w-0">
                  <Label
                    htmlFor={`ajusteSimplesAno${ano}`}
                    className="text-[10px] font-semibold text-slate-500 block mb-0.5"
                  >
                    {ano}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`ajusteSimplesAno${ano}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.01"
                      value={ajuste.porAno?.[String(ano)] ?? ''}
                      placeholder={padrao.toFixed(2).replace('.', ',')}
                      onChange={(e) => definirPorAno(ano, e.target.value)}
                      className={`h-8 text-xs pr-5 font-mono ${
                        temValorAno ? 'border-amber-400 bg-amber-50/60' : ''
                      }`}
                      autoComplete="off"
                      aria-label={`Alíquota média do Simples para ${ano} (%)`}
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Placeholder = estimativa padrão do ano (2026: 3,5%; 2027–2028: 4,5%; 2029+: 4,5% + 4
            p.p. × fator IBS; 2033+: 6,5%). Ano em destaque âmbar tem valor ajustado.
          </p>
        </div>

        {/* IVA Dual — Cenário Cheio (Módulo 2): ajuste do usuário sobre a alíquota da tabela de fases */}
        <div className="min-w-0 w-full border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
            <Label
              htmlFor="ajusteIvaDualCenarioCheio"
              className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
            >
              IVA Dual — Cenário Cheio (%)
            </Label>
            {temAjusteIvaDual && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                Ajuste ativo
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              id="ajusteIvaDualCenarioCheio"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={ivaDualAjuste?.valorUnico ?? ''}
              placeholder={(totalIvaDualTabela ?? config.totalIvaDual).toFixed(2).replace('.', ',')}
              onChange={(e) => definirIvaDualCenarioCheio(e.target.value)}
              className="pr-8 font-mono font-medium"
              autoComplete="off"
            />
            <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Substitui a alíquota cheia do IVA Dual do Cenário Cheio no Módulo 2 (Calculadora
            Simples). Placeholder = total da tabela de fases para o ano selecionado
            {totalIvaDualTabela != null
              ? ` (${totalIvaDualTabela.toFixed(2).replace('.', ',')}%)`
              : ''}
            . Deixe vazio (ou 0) para voltar ao default legal.
          </p>
        </div>

        {/* Restaurar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-500 leading-relaxed">
            {temAjuste
              ? 'Os cálculos estão usando o ajuste informado acima em vez da estimativa padrão.'
              : 'Sem ajuste: os cálculos usam a estimativa padrão por ano (nenhuma fórmula muda).'}
          </span>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restaurarPadraoIvaDual}
              disabled={!temAjusteIvaDual}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar IVA Dual legal
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restaurarPadrao}
              disabled={!temAjuste}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar estimativa padrão
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
