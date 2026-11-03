import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  processarCsvRecuperador,
  gerarCsvModeloRecuperador,
  type ResultadoImportacaoPlanilhaRecuperador,
} from '@/lib/importacaoRecuperadorPlanilha'
import { formatarCodigoNcm } from '@/data/tabelaNcmLc214'

export interface ModalImportarPlanilhaRecuperadorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onImportarSucesso: (resultado: ResultadoImportacaoPlanilhaRecuperador) => void
}

export function ModalImportarPlanilhaRecuperador({
  aberto,
  onOpenChange,
  onImportarSucesso,
}: ModalImportarPlanilhaRecuperadorProps) {
  const [arquivoNome, setArquivoNome] = useState('')
  const [erroMsg, setErroMsg] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [resultadoParse, setResultadoParse] =
    useState<ResultadoImportacaoPlanilhaRecuperador | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleArquivoSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setErroMsg(null)
    setProcessando(true)

    try {
      const texto = await file.text()
      const res = processarCsvRecuperador(texto, file.name)

      if (!res.sucesso) {
        setErroMsg(res.erro || 'Falha ao processar arquivo.')
        setResultadoParse(null)
      } else {
        setResultadoParse(res)
      }
    } catch (err: any) {
      setErroMsg(`Erro ao ler arquivo: ${err?.message || 'Formato não suportado.'}`)
      setResultadoParse(null)
    } finally {
      setProcessando(false)
    }
  }

  const handleConfirmarImportacao = () => {
    if (!resultadoParse || resultadoParse.itens.length === 0) {
      setErroMsg('Nenhum item válido foi lido da planilha.')
      return
    }

    onImportarSucesso(resultadoParse)
    onOpenChange(false)
    setResultadoParse(null)
    setArquivoNome('')
  }

  const handleBaixarModelo = () => {
    const csvContent = gerarCsvModeloRecuperador()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_recuperador_ncm.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-800 p-6 sm:p-7 rounded-[22px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37] uppercase">
              IMPORTAÇÃO • CSV / XLSX COM NCM
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-extrabold text-[#07132B] mt-1">
            Importar Produtos e Insumos com NCM
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Importe planilhas contendo a coluna NCM (ncm, codigo_ncm ou classificacao_fiscal). O
            sistema identifica automaticamente na base curada da LC 214/2025 e sugere as teses
            aplicáveis, mantendo fallback manual caso o código não seja informado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Card de download de modelo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Modelo com colunas NCM da LC 214/2025
              </p>
              <p className="text-[11px] text-slate-500">
                Exemplos de monofásicos, insumos agropecuários, cesta básica e reduções 60%/30%.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBaixarModelo}
              className="text-xs font-bold border-[#07132B] text-[#07132B] hover:bg-slate-100 shrink-0"
            >
              Baixar Modelo CSV
            </Button>
          </div>

          {/* Área de Seleção de Arquivo */}
          <div className="border-2 border-dashed border-slate-300 hover:border-[#D4AF37] rounded-2xl p-6 text-center transition-colors bg-white">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleArquivoSelecionado}
              className="hidden"
              id="file-upload-recuperador-ncm"
            />
            <label
              htmlFor="file-upload-recuperador-ncm"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-[#07132B] text-white">
                Selecionar Arquivo CSV
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {arquivoNome ? (
                  <strong className="text-slate-900">{arquivoNome}</strong>
                ) : (
                  'Clique para escolher arquivo (.csv codificado em UTF-8 com separador vírgula ou ponto-e-vírgula)'
                )}
              </p>
              <span className="text-[10px] text-slate-400">
                Aceita colunas: ncm, codigo_ncm, classificacao_fiscal, produto, faturamento
              </span>
            </label>
          </div>

          {/* Erro */}
          {erroMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {erroMsg}
            </div>
          )}

          {/* Preview da Análise */}
          {resultadoParse && resultadoParse.itens.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#07132B] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span className="font-bold">
                    {resultadoParse.totalLidas} itens lidos • {resultadoParse.totalComNcm} com NCM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#D4AF37] text-[#07132B] text-[11px]">
                    {resultadoParse.totalSugeridasAuto} sugeridos via LC 214/2025
                  </span>
                </div>
              </div>

              {resultadoParse.todosNcmSugeridos.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-[#07132B] block">
                    Teses identificadas automaticamente para aplicação:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resultadoParse.todosNcmSugeridos.map((sug, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-slate-800 text-[11px] font-medium"
                      >
                        NCM {formatarCodigoNcm(sug.itemCurado.codigoLimpo)}: {sug.categoriaRotulo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {resultadoParse.itens.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 truncate">{it.produtoOuItem}</p>
                        {it.ncmFormatado && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            NCM {it.ncmFormatado}
                          </span>
                        )}
                        {it.classificadoAuto ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07132B] text-[#D4AF37] font-bold">
                            Sugerido via NCM
                          </span>
                        ) : it.ncmRaw ? (
                          <span className="text-[10px] text-slate-500 italic">
                            Fora da base curada (fallback manual)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Sem NCM (manual)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {it.sugestao?.motivoSugestao || it.avisos.join(' • ')}
                      </p>
                    </div>
                    {it.valorOuFaturamento !== undefined && it.valorOuFaturamento > 0 && (
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 block">
                          R${' '}
                          {it.valorOuFaturamento.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={processando || !resultadoParse || resultadoParse.itens.length === 0}
              onClick={handleConfirmarImportacao}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              Aplicar Teses Sugeridas ({resultadoParse?.totalSugeridasAuto || 0})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
