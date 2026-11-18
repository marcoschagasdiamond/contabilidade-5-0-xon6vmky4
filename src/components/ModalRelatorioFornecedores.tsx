// ============================================================================
// MODAL DO RELATÓRIO DE FORNECEDORES — visão somente leitura da carteira.
// Reutilizável: montado em /dados-empresa e na Etapa 06 (DiagnosticoFornecedores).
// Zero cálculo fiscal novo: consome relatorioFornecedores.ts +
// calculoFornecedores.ts (comparativo 2026–2033) + vedacoesSimples.ts.
// ============================================================================

import React, { useMemo, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Truck,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  ROTULO_REGIME_FORNECEDOR,
  type RelatorioFornecedoresDados,
} from '@/lib/relatorioFornecedores'
import {
  baixarCsvRelatorioFornecedores,
  gerarPdfRelatorioFornecedores,
  type DadosRelatorioFornecedores,
} from '@/lib/pdfRelatorioFornecedores'
import { BASE_LEGAL_VEDACOES_SIMPLES } from '@/lib/vedacoesSimples'
import { type ResultadoCalculoFornecedor } from '@/lib/calculoFornecedores'
import { type FornecedorDiagnostico } from '@/services/fornecedores'

export interface ModalRelatorioFornecedoresProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dados prontos do relatório (montado pelo pai com montarRelatorioFornecedores). */
  relatorio: RelatorioFornecedoresDados | null
  /** Ano de referência do comparativo (herdado da Etapa 06 quando disponível). */
  anoReferencia: number
  /** Regime do comprador normalizado ('lucro_real' | 'lucro_presumido' | 'simples_nacional'). */
  regimeComprador: string
  /** Detalhamento completo (ResultadoCalculoFornecedor[]) já calculado pela Etapa 06. */
  detalhamento?: ResultadoCalculoFornecedor[]
  /** Crédito perdido por fornecedor (nome → R$), para o alerta de risco. */
  creditoPerdidoPorNome?: Map<string, number>
}

const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export function ModalRelatorioFornecedores({
  open,
  onOpenChange,
  relatorio,
  anoReferencia,
  regimeComprador,
  detalhamento = [],
  creditoPerdidoPorNome,
}: ModalRelatorioFornecedoresProps) {
  const { toast } = useToast()
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Reset do estado de geração de PDF quando o modal fecha
  useEffect(() => {
    if (!open) setGerandoPdf(false)
  }, [open])

  const dadosExportacao: DadosRelatorioFornecedores | null = useMemo(() => {
    if (!relatorio) return null

    // Totais simples vs. regular vs. misto a partir da agregação por regime
    const totRegime = (pred: (regime: string) => boolean) => {
      const itens = relatorio.porRegime.filter((r) => pred(r.rotulo))
      return {
        quantidade: itens.reduce((acc, r) => acc + r.quantidade, 0),
        volume: itens.reduce((acc, r) => acc + r.volume, 0),
      }
    }

    return {
      nomeEmpresa: relatorio.nomeEmpresa,
      geradoEm: new Date().toLocaleString('pt-BR'),
      ano: anoReferencia,
      regimeComprador,
      totais: {
        simples: totRegime((r) => r.includes('Simples')),
        regular: totRegime((r) => r.includes('Lucro')),
        misto: totRegime((r) => r.includes('Misto')),
        semRegime: 0,
        totalFornecedores: relatorio.totalFornecedores,
        volumeTotal: relatorio.volumeTotalCompras,
      },
      pctCarteira: relatorio.pctCarteira,
      pctConfigurado: relatorio.pctConfigurado,
      divergenciaPp:
        relatorio.pctCarteira === null ? null : relatorio.pctCarteira - relatorio.pctConfigurado,
      chaves: relatorio.fornecedoresChave.map((fc) => ({
        nome: fc.fornecedor.nome,
        cnpj: fc.fornecedor.cnpj,
        regime: ROTULO_REGIME_FORNECEDOR[fc.fornecedor.regime] || fc.fornecedor.regime,
        volume: fc.volume,
        pctVolume: fc.pesoPercentual,
        creditoPerdido:
          creditoPerdidoPorNome?.get(fc.fornecedor.nome.trim().toLowerCase()) ??
          detalhamento.find((d) => d.fornecedor.id === fc.fornecedor.id)?.creditoPerdido ??
          0,
        riscoTexto: fc.riscoVedacao
          ? `Vedações do Simples marcadas: ${fc.rotulosVedacao.join(', ')}`
          : undefined,
      })),
      evolucaoAnos: relatorio.evolucaoAnos.map((e) => ({
        ano: e.ano,
        creditoAproveitavelTotal: e.creditoAproveitavelTotal,
        creditoPerdidoTotal: e.creditoPerdidoTotal,
        custoLiquidoTotal: e.custoLiquidoTotal,
      })),
      avisosVedacao: relatorio.fornecedoresChave
        .filter((fc) => fc.riscoVedacao)
        .map(
          (fc) =>
            `${fc.fornecedor.nome}: vedações do Simples marcadas (${fc.rotulosVedacao.join(', ')})`,
        ),
      baseLegalVedacoes: BASE_LEGAL_VEDACOES_SIMPLES,
    }
  }, [relatorio, anoReferencia, regimeComprador, detalhamento, creditoPerdidoPorNome])

  const fornecedoresChave = relatorio?.fornecedoresChave ?? []
  const porRegime = relatorio?.porRegime ?? []
  const evolucao = relatorio?.evolucaoAnos ?? []

  const handleExportarPdf = () => {
    if (!dadosExportacao) return
    setGerandoPdf(true)
    try {
      gerarPdfRelatorioFornecedores(dadosExportacao)
      toast({
        title: 'PDF Gerado',
        description: 'O download do Relatório de Fornecedores foi iniciado.',
      })
    } catch (err) {
      console.error('Erro ao gerar PDF do relatório de fornecedores:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível compilar o relatório em PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  const handleExportarCsv = () => {
    if (!dadosExportacao) return
    try {
      baixarCsvRelatorioFornecedores(dadosExportacao)
      toast({
        title: 'CSV Gerado',
        description: 'O download do arquivo CSV foi iniciado.',
      })
    } catch (err) {
      console.error('Erro ao gerar CSV do relatório de fornecedores:', err)
      toast({
        title: 'Erro ao gerar CSV',
        description: 'Não foi possível compilar o arquivo CSV.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-black text-[#07132B]">
            <Truck className="w-5 h-5 text-[#D4AF37]" />
            Relatório de Fornecedores
            {relatorio?.nomeEmpresa ? (
              <span className="text-sm font-semibold text-slate-500">
                • {relatorio.nomeEmpresa}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            Visão somente leitura da carteira de fornecedores sob a Reforma Tributária (IBS/CBS).
            Indicativo apenas — não altera cálculos fiscais. Dados da Etapa 06 (Análise de
            Fornecedores) e do parâmetro “% compras do Simples Nacional”.
          </DialogDescription>
        </DialogHeader>

        {!relatorio ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            Sem dados de carteira — cadastre fornecedores com regime e volume de compras na Etapa
            06.
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. TOTAIS POR REGIME */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Totais por regime
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {porRegime.map((r) => (
                  <div
                    key={r.rotulo}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <span className="text-[11px] font-bold text-slate-500 block truncate">
                      {r.rotulo}
                    </span>
                    <p className="text-lg font-heading font-black text-[#07132B] font-mono">
                      {formatarMoeda(r.volume)}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {r.quantidade} fornecedor(es) •{' '}
                      {fmtPct(
                        relatorio.volumeTotalCompras > 0
                          ? (r.volume / relatorio.volumeTotalCompras) * 100
                          : 0,
                      )}{' '}
                      do volume
                    </span>
                  </div>
                ))}
                {porRegime.length === 0 && (
                  <p className="text-xs text-slate-500 col-span-full">
                    Nenhum fornecedor com regime informado.
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Total da carteira: <strong>{relatorio.totalFornecedores} fornecedor(es)</strong> •{' '}
                <strong className="font-mono">{formatarMoeda(relatorio.volumeTotalCompras)}</strong>{' '}
                de compras.
              </p>
            </section>

            {/* 2. % CARTEIRA VS CONFIGURADO */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. % Compras do Simples Nacional — carteira vs. configurado
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    Calculado pela carteira
                  </span>
                  <p className="text-xl font-heading font-black text-[#07132B] font-mono">
                    {relatorio.pctCarteira === null ? '—' : `${relatorio.pctCarteira}%`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    Configurado em Dados da Empresa
                  </span>
                  <p className="text-xl font-heading font-black text-[#07132B] font-mono">
                    {relatorio.pctConfigurado}%
                  </p>
                </div>
              </div>
              {relatorio.divergenciaAviso && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Divergência de{' '}
                    {Math.abs((relatorio.pctCarteira ?? 0) - relatorio.pctConfigurado)} p.p. entre a
                    carteira e o parâmetro configurado. Revise os volumes de compra dos fornecedores
                    (Etapa 06) ou o campo em Dados da Empresa.
                  </span>
                </div>
              )}
              {!relatorio.divergenciaAviso && relatorio.pctCarteira !== null && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Parâmetro coerente com a carteira cadastrada (diferença de até 3 p.p.).
                  </span>
                </div>
              )}
            </section>

            {/* 3. FORNECEDORES-CHAVE + ALERTA DE RISCO DE VEDAÇÕES */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Fornecedores-chave (maior volume)
              </h4>
              {fornecedoresChave.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhum fornecedor cadastrado com volume informado.
                </p>
              ) : (
                <div className="space-y-2">
                  {fornecedoresChave.map((fc, i) => (
                    <div
                      key={fc.fornecedor.id || fc.fornecedor.nome || i}
                      className="p-3 rounded-lg bg-white border border-slate-200 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#07132B] truncate">
                            {i + 1}. {fc.fornecedor.nome}
                            {fc.fornecedor.cnpj ? (
                              <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                                {fc.fornecedor.cnpj}
                              </span>
                            ) : null}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {ROTULO_REGIME_FORNECEDOR[fc.fornecedor.regime] || fc.fornecedor.regime}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-mono text-[#07132B]">
                            {formatarMoeda(fc.volume)}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {fc.pesoPercentual}% da carteira
                          </span>
                        </div>
                      </div>
                      {fc.riscoVedacao && (
                        <div className="pt-1.5 border-t border-slate-100 flex items-start gap-1.5">
                          <Badge variant="destructive" className="text-[9px] font-bold shrink-0">
                            ALERTA DE RISCO
                          </Badge>
                          <span className="text-[10px] text-red-700 font-semibold leading-snug">
                            Vedações do Simples (art. 17 LC 123/2006) marcadas:{' '}
                            {fc.rotulosVedacao.join(', ')}. Risco de perda de crédito de
                            transferência e ajuste de preços na cadeia.
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. COMPARATIVO 2026–2033 (REAPROVEITADO DA ETAPA 06) */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                4. Comparativo 2026–2033 (transição IBS/CBS)
              </h4>
              {evolucao.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Sem comparativo anual (cadastre fornecedores com volume de compras).
                </p>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Ano</th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">
                          Crédito aproveitável
                        </th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">
                          Crédito perdido
                        </th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">
                          Custo líquido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evolucao.map((e) => (
                        <tr key={e.ano} className={e.ano === anoReferencia ? 'bg-amber-50/50' : ''}>
                          <td className="px-3 py-1.5 font-bold text-[#07132B] font-mono">
                            {e.ano}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-700">
                            {formatarMoeda(e.creditoAproveitavelTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-700">
                            {formatarMoeda(e.creditoPerdidoTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-700">
                            {formatarMoeda(e.custoLiquidoTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="text-[10px] text-slate-400 italic leading-snug">
              {BASE_LEGAL_VEDACOES_SIMPLES}
            </p>
          </div>
        )}

        {/* AÇÕES: EXPORTAR PDF / CSV */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dadosExportacao}
            onClick={handleExportarCsv}
            className="text-xs font-bold border-[#07132B] text-[#07132B] hover:bg-slate-100"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!dadosExportacao || gerandoPdf}
            onClick={handleExportarPdf}
            className="text-xs font-extrabold bg-[#D4AF37] hover:bg-[#c29f2c] text-[#07132B] shadow-md"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            {gerandoPdf ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ModalRelatorioFornecedores
