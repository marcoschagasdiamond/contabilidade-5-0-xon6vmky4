import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { obterAliquotasCreditoPorAno } from '@/lib/calculoFornecedores'
import { ANOS_SIMULACAO_DISPONIVEIS, type AnoBaseSimulacao } from '@/lib/reformaTributaria'
import {
  FUNDAMENTO_ALIQUOTA_SIMPLES_MEDIA,
  temAjusteAliquotaSimplesMedia,
  obterAliquotaSimplesMediaEfectivaEm,
} from '@/lib/aliquotaSimplesMediaConfig'
import type { AjusteAliquotaSimplesMedia } from '@/lib/aliquotaSimplesMediaConfig'
import {
  Calculator,
  BookOpen,
  Scale,
  Percent,
  Layers,
  ShieldCheck,
  Info,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react'

export interface ModalMetodologiaCalculoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faturamentoMensal: number
  anoTransicao: number | string
  totalIvaDual: number
  cbsPadrao: number
  ibsPadrao: number
  porcentagemComprasSimplesNacional: number
  percentualComprasVendasComparativo: number
  despesasComCreditosMensais: number
  percentualComprasSemCredito?: number
  /** Ajuste ativo do usuário para a alíquota média do Simples (Módulo 1). */
  ajusteAliquotaSimplesMedia?: AjusteAliquotaSimplesMedia | null
  resultadoComparativo: {
    lucroReal: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos?: string
    }
    lucroPresumido: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      detalheImpostos?: string
    }
    simplesNacional: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      anexoUtilizado?: string
      faixaEncontrada?: string
      detalheImpostos?: string
    }
    ibsCbs: {
      pisOuCbs: number
      cofinsOuIbs: number
      ipiOuIcmsOuIss: number
      impostoSeletivo?: number
      totalNominal: number
      creditos: number
      totalEfetivo: number
      aliquotaEfetiva: number
      reducaoAplicadaPercentual?: number
      detalheImpostos?: string
    }
    dadosAdicionais?: {
      receitaTributavelInterna?: number
      receitaExportacaoIsenta?: number
      creditosDespesasReal?: number
      creditosDespesasIbsCbs?: number
      sujeitoImpostoSeletivo?: boolean
      aliquotaIcmsAplicada?: number
    }
  }
}

export function ModalMetodologiaCalculo({
  open,
  onOpenChange,
  faturamentoMensal,
  anoTransicao,
  totalIvaDual,
  cbsPadrao,
  ibsPadrao,
  porcentagemComprasSimplesNacional,
  percentualComprasVendasComparativo,
  despesasComCreditosMensais,
  percentualComprasSemCredito,
  ajusteAliquotaSimplesMedia = null,
  resultadoComparativo,
}: ModalMetodologiaCalculoProps) {
  const { lucroReal, lucroPresumido, simplesNacional, ibsCbs, dadosAdicionais } =
    resultadoComparativo

  // Ano numérico para a tabela curada da LC 214/2025
  const anoNum: AnoBaseSimulacao =
    typeof anoTransicao === 'number'
      ? (anoTransicao as AnoBaseSimulacao)
      : (2033 as AnoBaseSimulacao)
  const infoAno = obterAliquotasCreditoPorAno(anoNum)
  const aliqSimplesMediaPct = infoAno.aliquotaSimplesMedia * 100

  const pctSimples = Math.min(100, Math.max(0, porcentagemComprasSimplesNacional || 0))
  const pctRegular = 100 - pctSimples

  // Alíquota média ponderada de crédito em compras sob a LC 214/2025
  const aliqPonderadaCompras =
    pctSimples > 0
      ? (pctRegular / 100) * totalIvaDual + (pctSimples / 100) * aliqSimplesMediaPct
      : totalIvaDual

  // Base de compras e despesas estimadas do Módulo 3
  const volumeCompras = (faturamentoMensal * percentualComprasVendasComparativo) / 100
  const receitaInterna = dadosAdicionais?.receitaTributavelInterna ?? faturamentoMensal
  const reducaoIbsCbsPct = ibsCbs.reducaoAplicadaPercentual ?? 0
  const fatorAliquotaIbsCbs = Math.max(0, 1 - reducaoIbsCbsPct / 100)
  const aliqCbsEfetiva = cbsPadrao * fatorAliquotaIbsCbs
  const aliqIbsEfetiva = ibsPadrao * fatorAliquotaIbsCbs
  const aliqIvaDualEfetiva = totalIvaDual * fatorAliquotaIbsCbs

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-[#07132B]">
            <div className="w-10 h-10 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-heading font-extrabold text-[#07132B]">
                Metodologia de Cálculo • Tabela Comparativa de Regimes
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Memória analítica, fórmulas matemáticas aplicadas a cada linha e fundamentação na LC
                214/2025 e EC 132/2023 com os valores atuais da simulação.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2 space-y-6 text-slate-700 text-sm">
          {/* BANNER COM OS VALORES-BASE ATUAIS DA SIMULAÇÃO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#07132B]">Premissas Ativas:</span>
              <Badge variant="outline" className="bg-white font-mono text-slate-800">
                Faturamento: {formatarMoeda(faturamentoMensal)}
              </Badge>
              <Badge variant="outline" className="bg-white font-mono text-slate-800">
                Compras ({percentualComprasVendasComparativo}%): {formatarMoeda(volumeCompras)}
              </Badge>
              <Badge variant="outline" className="bg-white font-mono text-slate-800">
                Despesas c/ Crédito: {formatarMoeda(despesasComCreditosMensais)}
              </Badge>
              <Badge variant="outline" className="bg-white font-mono text-slate-800">
                Ano Base: {anoTransicao === 'atual' ? 'Atual' : anoTransicao}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              <Percent className="w-3 h-3 text-amber-700" />
              <span>
                Compras do Simples:{' '}
                <strong className="font-mono">{formatarPorcentagem(pctSimples)}</strong>
              </span>
            </div>
          </div>

          <Tabs defaultValue="formulas" className="w-full">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="formulas" className="text-xs font-bold gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Fórmulas por Linha
              </TabsTrigger>
              <TabsTrigger value="simples" className="text-xs font-bold gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                Ponderação Simples (LC 214)
              </TabsTrigger>
              <TabsTrigger value="normas" className="text-xs font-bold gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Legislação & LC 214/2025
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: FÓRMULAS DE CADA LINHA DA TABELA */}
            <TabsContent value="formulas" className="space-y-4 pt-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Cada linha da Tabela Comparativa sintetiza débitos tributários, apropriação de
                  créditos e apuração efetiva. Abaixo estão as fórmulas gerais e o exemplo numérico
                  derivado diretamente dos parâmetros da simulação em tela.
                </span>
              </div>

              {/* LINHA 1: TOTAL NOMINAL (DÉBITOS) */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <h4 className="font-bold text-[#07132B] text-sm">
                        1. Total Nominal (Débitos sobre Vendas)
                      </h4>
                    </div>
                    <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[10px]">
                      Linha 4 da Tabela
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Soma de todas as alíquotas incidentes sobre a receita bruta ou faturamento
                    tributável interno (PIS/PASEP + COFINS + ICMS/ISS/IPI no sistema atual; CBS +
                    IBS + Imposto Seletivo no novo sistema tributário).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Fórmula Geral
                      </span>
                      <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                        Total Nominal = Débito PIS/CBS + Débito COFINS/IBS + Débito Indiretos/IS
                      </div>
                      <p className="text-[11px] text-slate-500">
                        No IBS/CBS:{' '}
                        <em>Faturamento Tributável × (CBS efetiva + IBS efetivo) + IS</em>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Exemplo Numérico da Simulação Atual
                      </span>
                      <div className="bg-white p-2 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Real:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(lucroReal.totalNominal)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Presumido:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(lucroPresumido.totalNominal)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Simples Nacional:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(simplesNacional.totalNominal)}
                          </strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-0.5 text-blue-900">
                          <span>IBS/CBS ({formatarPorcentagem(aliqIvaDualEfetiva)}):</span>
                          <strong>{formatarMoeda(ibsCbs.totalNominal)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LINHA 2: CRÉDITOS RECUPERÁVEIS */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <h4 className="font-bold text-[#07132B] text-sm">
                        2. (-) Créditos Recuperáveis (Insumos e Despesas Operacionais)
                      </h4>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 text-[10px]">
                      Linha 5 da Tabela
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Créditos tributários admitidos para compensação com os débitos da saída. No
                    Lucro Presumido e Simples Nacional o regime é cumulativo/sem créditos (R$ 0,00).
                    No Lucro Real aplicam-se regras estritas da Lei 10.833/03 (PIS 1,65% / COFINS
                    7,6%). No IBS/CBS vigora o princípio da{' '}
                    <strong>não cumulatividade plena</strong> (art. 28 a 33 da LC 214/2025),
                    permitindo crédito sobre qualquer bem ou serviço tributado adquirido pela pessoa
                    jurídica, ponderado pela origem do fornecedor.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Fórmula Geral
                      </span>
                      <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                        Crédito Total = Crédito sobre Compras + Crédito sobre Despesas
                      </div>
                      <p className="text-[11px] text-slate-500">
                        IBS/CBS Compras ={' '}
                        <em>Compras × Alíquota Ponderada (LC 214) × (1 − % Sem Crédito)</em>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        IBS/CBS Despesas ={' '}
                        <em>
                          Despesas Elegíveis × Alíquota Cheia do IVA Dual (
                          {formatarPorcentagem(totalIvaDual)})
                        </em>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Exemplo Numérico da Simulação Atual
                      </span>
                      <div className="bg-white p-2 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between text-emerald-700">
                          <span>Lucro Real (insumos + despesas):</span>
                          <strong>- {formatarMoeda(lucroReal.creditos)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Lucro Presumido (cumulativo):</span>
                          <span>R$ 0,00</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Simples Nacional (sem crédito):</span>
                          <span>R$ 0,00</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-0.5 text-emerald-800 font-bold">
                          <span>IBS/CBS (não cumulatividade ampla):</span>
                          <strong>- {formatarMoeda(ibsCbs.creditos)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LINHA 3: TOTAL EFETIVO A RECOLHER */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <h4 className="font-bold text-[#07132B] text-sm">
                        3. Total Efetivo a Recolher (Desembolso Líquido de Caixa)
                      </h4>
                    </div>
                    <Badge className="bg-purple-100 text-purple-900 border-purple-200 text-[10px]">
                      Linha 6 da Tabela
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Valor monetário final recolhido ao Fisco após a dedução dos créditos
                    recuperáveis apurados. Caso os créditos superem os débitos no período, o total
                    efetivo é R$ 0,00 e o saldo excedente é acumulado como crédito para os períodos
                    subsequentes ou ressarcimento/compensação (art. 37 da LC 214/2025).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Fórmula Geral
                      </span>
                      <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                        Total Efetivo = Máximo(0, Total Nominal − Créditos Recuperáveis)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        No Presumido e Simples Nacional: <em>Total Efetivo = Total Nominal</em>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Exemplo Numérico da Simulação Atual
                      </span>
                      <div className="bg-white p-2 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Real:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(lucroReal.totalEfetivo)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Presumido:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(lucroPresumido.totalEfetivo)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Simples Nacional:</span>
                          <strong className="text-slate-800">
                            {formatarMoeda(simplesNacional.totalEfetivo)}
                          </strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-0.5 text-[#07132B] font-extrabold">
                          <span>IBS/CBS Líquido:</span>
                          <strong>{formatarMoeda(ibsCbs.totalEfetivo)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LINHA 4: ALÍQUOTA EFETIVA FINAL */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      <h4 className="font-bold text-[#07132B] text-sm">
                        4. Alíquota Efetiva Final (% sobre Faturamento Bruto)
                      </h4>
                    </div>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
                      Linha 7 da Tabela
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Representa o peso percentual real do desembolso tributário sobre o faturamento
                    bruto da empresa. É o critério técnico para o ranking de competitividade e para
                    a decisão de enquadramento ou desenquadramento de regime.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Fórmula Geral
                      </span>
                      <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                        Alíquota Efetiva (%) = (Total Efetivo / Faturamento Bruto) × 100
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Demonstra o quanto do faturamento é consumido por tributos indiretos após
                        créditos.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                        Exemplo Numérico da Simulação Atual
                      </span>
                      <div className="bg-white p-2 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Real:</span>
                          <strong className="text-slate-800">
                            {formatarPorcentagem(lucroReal.aliquotaEfetiva)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lucro Presumido:</span>
                          <strong className="text-slate-800">
                            {formatarPorcentagem(lucroPresumido.aliquotaEfetiva)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Simples Nacional:</span>
                          <strong className="text-slate-800">
                            {formatarPorcentagem(simplesNacional.aliquotaEfetiva)}
                          </strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-0.5 text-blue-900 font-extrabold">
                          <span>Regime Regular (IBS/CBS) Efetiva:</span>
                          <strong>{formatarPorcentagem(ibsCbs.aliquotaEfetiva)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* EXPLICATIVO DO REGIME REGULAR (IBS/CBS) E ART. 348 DA LC 214/2025 */}
              <Card className="border-blue-200 bg-blue-50/50 shadow-xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-blue-200/80 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
                    <h4 className="font-bold text-[#07132B] text-sm">
                      Natureza do Cenário: Regime Regular (IBS/CBS) e Regra de Concorrência
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    O cenário intitulado <strong>Regime Regular (IBS/CBS)</strong> representa o
                    regime geral e não-cumulativo do novo sistema tributário da reforma (EC 132/2023
                    e LC 214/2025), caracterizado pelo{' '}
                    <strong>crédito amplo sobre compras, insumos e despesas operacionais</strong>.
                    Ele é estruturalmente distinto dos regimes tradicionais do sistema tributário
                    atual —<strong> Lucro Real</strong> (regime não-cumulativo setorial da Lei
                    10.833/03),
                    <strong> Lucro Presumido</strong> (regime cumulativo da Lei 9.718/98) e
                    <strong> Simples Nacional</strong> (regime unificado da LC 123/2006).
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-1.5">
                    <div className="font-bold text-[#07132B] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-700" />
                      <span>Fase-Piloto em 2026 / Ano Atual (art. 348 da LC 214/2025):</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Em <strong>2026 e no ano atual</strong>, o IBS e a CBS operam exclusivamente
                      em fase-piloto e teste institucional (CBS de 0,9% e IBS de 0,1%), com
                      recolhimentos integralmente compensáveis com PIS/COFINS e sem extinção dos
                      tributos do consumo vigentes. Por esse motivo legal (art. 348 da LC 214/2025),
                      o Regime Regular (IBS/CBS)
                      <strong>
                        {' '}
                        não concorre na recomendação do regime mais vantajoso em 2026/ano atual
                      </strong>{' '}
                      (a recomendação é disputada apenas entre Lucro Real, Lucro Presumido e Simples
                      Nacional). O Regime Regular passa a concorrer ativamente na recomendação
                      econômica apenas de <strong>2027 a 2033</strong>, período no qual o novo IVA
                      Dual entra em eficácia plena e substitui os tributos federais e subnacionais.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: PONDERAÇÃO DO CRÉDITO DO SIMPLES NACIONAL (LC 214/2025) */}
            <TabsContent value="simples" className="space-y-4 pt-3">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Regra do Crédito Presumido de Fornecedores do Simples Nacional (v0.0.313)
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Conforme os <strong>artigos 28 e 44 da LC 214/2025</strong>, o adquirente sujeito
                  ao regime regular do IBS/CBS que adquire bens ou serviços de optantes do Simples
                  Nacional apropria crédito apenas pelo montante efetivamente recolhido pelo
                  fornecedor no Documento de Arrecadação do Simples Nacional (DAS), exceto se o
                  optante tiver exercido a opção pelo recolhimento do IBS/CBS por fora (regime
                  híbrido).
                </p>
              </div>

              {/* FÓRMULA MATEMÁTICA DETALHADA */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-bold text-[#07132B] text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#D4AF37]" />
                    Fórmula da Alíquota Média Ponderada de Crédito
                  </h4>

                  <div className="p-3 bg-slate-900 text-amber-300 rounded-lg font-mono text-xs sm:text-sm text-center shadow-inner overflow-x-auto">
                    Alíquota Compras = (1 − % Simples) × Alíquota Cheia + % Simples × Alíquota Média
                    Simples
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    O percentual de compras originado de fornecedores optantes pelo Simples Nacional
                    é parametrizado no <strong>Módulo 1 (Configurações Gerais)</strong> e reflete a
                    proporção da cadeia de suprimentos da empresa. A{' '}
                    <strong>alíquota média do Simples</strong> também é ajustável no Módulo 1:{' '}
                    {FUNDAMENTO_ALIQUOTA_SIMPLES_MEDIA}
                    {ajusteAliquotaSimplesMedia &&
                    temAjusteAliquotaSimplesMedia(ajusteAliquotaSimplesMedia)
                      ? ' — nesta simulação, o valor aplicado foi ajustado manualmente pelo usuário no Módulo 1, não é a estimativa.'
                      : '.'}
                  </p>

                  {/* TABELA DA ALÍQUOTA MÉDIA DO SIMPLES POR ANO (2026–2040) */}
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-[#07132B] block mb-1.5">
                      Alíquota média do Simples Nacional por ano (2026–2040):
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-slate-200 rounded">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700">
                            <th className="text-left px-2 py-1 font-semibold border-b border-slate-200">
                              Ano
                            </th>
                            <th className="text-right px-2 py-1 font-semibold border-b border-slate-200">
                              Estimativa padrão
                            </th>
                            <th className="text-right px-2 py-1 font-semibold border-b border-slate-200">
                              Valor aplicado nesta simulação
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ANOS_SIMULACAO_DISPONIVEIS.map((ano) => {
                            const padrao = obterAliquotasCreditoPorAno(ano).aliquotaSimplesMedia
                            const aplicado = obterAliquotaSimplesMediaEfectivaEm(
                              ano,
                              ajusteAliquotaSimplesMedia,
                            )
                            const difere = aplicado !== padrao
                            return (
                              <tr
                                key={ano}
                                className={
                                  difere ? 'bg-amber-50/70 text-amber-900' : 'text-slate-600'
                                }
                              >
                                <td className="px-2 py-1 border-b border-slate-100 font-mono">
                                  {ano}
                                </td>
                                <td className="px-2 py-1 border-b border-slate-100 text-right font-mono">
                                  {formatarPorcentagem(padrao)}
                                </td>
                                <td className="px-2 py-1 border-b border-slate-100 text-right font-mono font-semibold">
                                  {formatarPorcentagem(aplicado)}
                                  {difere && ' *'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Estimativa padrão: 2026: 3,5%; 2027–2028: 4,5%; 2029+: 4,5% + 4 p.p. × fator
                      IBS do ano (transição); 2033+: 6,5%.
                      {ajusteAliquotaSimplesMedia &&
                        temAjusteAliquotaSimplesMedia(ajusteAliquotaSimplesMedia) &&
                        ' * ano com alíquota ajustada manualmente no Módulo 1 (precedência: valor por ano > valor único > estimativa padrão).'}
                    </p>
                  </div>

                  {/* PARÂMETROS E TAXAS DO ANO SELECIONADO */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Ano Selecionado</span>
                      <strong className="text-sm font-mono text-[#07132B]">
                        {anoTransicao === 'atual' ? '2026 / Atual' : `Ano ${anoTransicao}`}
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {infoAno.detalhesTexto}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-950">
                      <span className="text-blue-700 block text-[11px]">
                        Alíquota Cheia IVA Dual
                      </span>
                      <strong className="text-sm font-mono text-blue-900">
                        {formatarPorcentagem(totalIvaDual)}
                      </strong>
                      <span className="text-[10px] text-blue-600 block mt-0.5">
                        CBS ({formatarPorcentagem(cbsPadrao)}) + IBS (
                        {formatarPorcentagem(ibsPadrao)})
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                      <span className="text-amber-700 block text-[11px]">Média Simples LC 214</span>
                      <strong className="text-sm font-mono text-amber-900">
                        {formatarPorcentagem(aliqSimplesMediaPct)}
                      </strong>
                      <span className="text-[10px] text-amber-700 block mt-0.5">
                        Tabela curada Anexos XVIII–XXII
                      </span>
                    </div>
                  </div>

                  {/* DEMONSTRAÇÃO NUMÉRICA PLUGADA */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-[#07132B] block">
                      Aplicação Numérica com os Dados da Empresa:
                    </span>
                    <div className="space-y-1 font-mono text-[11px] text-slate-800 bg-white p-3 rounded border border-slate-200">
                      <div>
                        • Proporção Regular: (100% − {formatarPorcentagem(pctSimples)}) ={' '}
                        <strong>{formatarPorcentagem(pctRegular)}</strong>
                      </div>
                      <div>
                        • Parcela Regular: {formatarPorcentagem(pctRegular)} ×{' '}
                        {formatarPorcentagem(totalIvaDual)} ={' '}
                        <strong>{formatarPorcentagem((pctRegular / 100) * totalIvaDual)}</strong>
                      </div>
                      <div>
                        • Parcela Simples Nacional: {formatarPorcentagem(pctSimples)} ×{' '}
                        {formatarPorcentagem(aliqSimplesMediaPct)} ={' '}
                        <strong>
                          {formatarPorcentagem((pctSimples / 100) * aliqSimplesMediaPct)}
                        </strong>
                      </div>
                      <div className="border-t border-slate-200 pt-1 text-emerald-800 font-bold flex justify-between">
                        <span>= Alíquota Ponderada Efetiva sobre Compras:</span>
                        <span>{formatarPorcentagem(aliqPonderadaCompras)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sobre o volume mensal de compras estimado em{' '}
                      <strong>{formatarMoeda(volumeCompras)}</strong>, a apropriação de crédito
                      resulta em{' '}
                      <strong>
                        {formatarMoeda(
                          ((volumeCompras * aliqPonderadaCompras) / 100) *
                            Math.max(0, 1 - percentualComprasSemCredito / 100),
                        )}
                      </strong>
                      {pctSimples === 0 ? (
                        <span> (100% compras no regime regular, sem deságio de crédito).</span>
                      ) : (
                        <span>
                          {' '}
                          (se todas as compras fossem do regime regular a alíquota cheia geraria{' '}
                          {formatarMoeda((volumeCompras * totalIvaDual) / 100)}).
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 3: REFERÊNCIAS NORMATIVAS À LC 214/2025 */}
            <TabsContent value="normas" className="space-y-3 pt-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Dispositivos da Lei Complementar nº 214/2025 e da Emenda Constitucional nº
                  132/2023 aplicados aos regimes tributários comparados:
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <Card className="border-slate-200 shadow-xs">
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#07132B]">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Art. 28 a 33 da LC 214/2025 — Não Cumulatividade Ampla (Regime Regular)
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Institui o <strong>Regime Regular não-cumulativo</strong>, garantindo ao
                      contribuinte do IBS e da CBS o direito de apropriar créditos amplos do imposto
                      cobrado e destacado nas operações de aquisição de quaisquer bens materiais ou
                      imateriais, inclusive direitos e serviços, superando o conceito restritivo de
                      insumos do PIS/COFINS.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-xs">
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#07132B]">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      Art. 44 e 45 da LC 214/2025 — Aquisições do Simples Nacional
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Determina que as aquisições de pessoas jurídicas optantes pelo Simples
                      Nacional geram crédito presumido ao adquirente sujeito ao regime regular no
                      montante equivalente ao IBS e à CBS efetivamente devidos no regime
                      simplificado, vedada a tomada de crédito integral pelo IVA Dual padrão.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-xs">
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#07132B]">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Art. 82 a 125 da LC 214/2025 — Regimes Diferenciados e Reduções
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Estabelece reduções de 60% e 30% nas alíquotas do IBS e da CBS para serviços
                      de educação, saúde, transporte público coletivo, medicamentos, dispositivos
                      médicos e produtos agropecuários, além de desonerações específicas do setor de
                      TI e segurança da informação (art. 120 e seguintes).
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-xs">
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#07132B]">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      Art. 347 e 348 da LC 214/2025 — Cronograma e Fase-Piloto (2026–2033)
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Fixa a fase de teste em 2026 (CBS 0,9% e IBS 0,1%), período em que o novo
                      tributo não concorre na escolha de regime (compensação total), a extinção do
                      PIS/COFINS em 2027 com CBS plena (8,7%), e a transição gradual federativa do
                      ICMS e ISS para o IBS de 2029 a 2032 (à razão de 1/10 ao ano), culminando no
                      modelo pleno em 2033.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">
                  Preservação do Lucro Real e Presumido (Legislação Federal Vigente):
                </span>
                <p>
                  • Lucro Real: Lei nº 10.637/2002 (PIS não cumulativo 1,65%) e Lei nº 10.833/2003
                  (COFINS não cumulativo 7,60%), além de IRPJ (15% + 10%) e CSLL (9%).
                </p>
                <p>
                  • Lucro Presumido: Lei nº 9.718/1998 (PIS cumulativo 0,65% e COFINS cumulativo
                  3,00%), sem direito a crédito na entrada, acrescido de ISS (2% a 5%) ou ICMS.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
