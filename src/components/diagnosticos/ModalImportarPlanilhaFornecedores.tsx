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
  processarCsvFornecedores,
  gerarCsvModeloFornecedores,
  type FornecedorImportadoPreview,
} from '@/lib/importacaoFornecedores'
import type { FornecedorDiagnostico } from '@/services/fornecedores'

export interface ModalImportarPlanilhaFornecedoresProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onImportarSucesso: (
    fornecedores: Array<Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>>,
  ) => void
}

export function ModalImportarPlanilhaFornecedores({
  aberto,
  onOpenChange,
  onImportarSucesso,
}: ModalImportarPlanilhaFornecedoresProps) {
  const [arquivoNome, setArquivoNome] = useState('')
  const [erroMsg, setErroMsg] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [previewFornecedores, setPreviewFornecedores] = useState<FornecedorImportadoPreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleArquivoSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setErroMsg(null)
    setProcessando(true)

    try {
      const texto = await file.text()
      const resultado = processarCsvFornecedores(texto, file.name)

      if (!resultado.sucesso) {
        setErroMsg(resultado.erro || 'Falha ao processar arquivo.')
        setPreviewFornecedores([])
      } else {
        setPreviewFornecedores(resultado.fornecedores)
      }
    } catch (err: any) {
      setErroMsg(`Erro ao ler arquivo: ${err?.message || 'Formato não suportado.'}`)
      setPreviewFornecedores([])
    } finally {
      setProcessando(false)
    }
  }

  const handleConfirmarImportacao = () => {
    const validos = previewFornecedores.filter((f) => f.valido)
    if (validos.length === 0) {
      setErroMsg('Nenhum fornecedor válido com volume de compras positivo foi encontrado.')
      return
    }

    const payload = validos.map((f) => ({
      nome: f.nome,
      cnpj: f.cnpj,
      regime: f.regime,
      proporcao_misto: f.proporcao_misto,
      volume_compras: f.volume_compras,
      classificacao_credito: f.classificacao_credito,
      percentual_credito_parcial: f.percentual_credito_parcial,
      descricao_item: f.descricao_item,
      aliquota_simples_informada: f.aliquota_simples_informada,
      ncm: f.ncm,
      ncm_classificado_auto: f.ncm_classificado_auto,
      observacoes: f.observacoes,
      ativo: true,
    }))

    onImportarSucesso(payload)
    onOpenChange(false)
    setPreviewFornecedores([])
    setArquivoNome('')
  }

  const handleBaixarModelo = () => {
    const csvContent = gerarCsvModeloFornecedores()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_fornecedores.csv')
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
              IMPORTAÇÃO • CSV / XLSX
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 mt-1">
            Importar Carteira de Fornecedores
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Carregue sua planilha de compras por fornecedor para cálculo imediato de perda e ganho
            de crédito sob a LC 214/2025.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Ações de modelo e dropzone */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Precisa do modelo de cabeçalho?</p>
              <p className="text-[11px] text-slate-500">
                Baixe o modelo com colunas para Nome, CNPJ, Regime, Volume e Classificação.
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
              id="file-upload-fornecedores"
            />
            <label
              htmlFor="file-upload-fornecedores"
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
                Suporta até 200 fornecedores por importação
              </span>
            </label>
          </div>

          {/* Mensagem de Erro */}
          {erroMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {erroMsg}
            </div>
          )}

          {/* Preview dos Fornecedores Detectados */}
          {previewFornecedores.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Pré-visualização: {previewFornecedores.length} fornecedores lidos (
                  {previewFornecedores.filter((f) => f.valido).length} válidos)
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {previewFornecedores.map((f, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 truncate">{f.nome}</p>
                        {f.ncm && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                            NCM {f.ncm}
                          </span>
                        )}
                        {f.ncm_classificado_auto && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#07132B] text-[#D4AF37] font-bold">
                            Auto LC 214
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Regime: <strong className="text-slate-700">{f.regime}</strong> • Item:{' '}
                        <strong className="text-slate-700">{f.classificacao_credito}</strong>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-900">
                        R$ {f.volume_compras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {!f.valido && (
                        <span className="text-[10px] text-rose-600 font-bold">Volume zerado</span>
                      )}
                    </div>
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
              disabled={processando || previewFornecedores.length === 0}
              onClick={handleConfirmarImportacao}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              Confirmar Importação ({previewFornecedores.filter((f) => f.valido).length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
