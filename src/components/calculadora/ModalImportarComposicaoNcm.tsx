import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  processarCsvComposicaoNcm,
  mapearLinhasParaComposicaoNcm,
  gerarCsvModeloComposicaoNcm,
  type ItemComposicaoCalculadora,
  type ItemComposicaoImportadoPreview,
  type ResultadoImportacaoComposicaoNcm,
} from '@/lib/ncmCalculadora'
import { formatarMoeda } from '@/lib/regimes'

interface ModalImportarComposicaoNcmProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onConfirmar: (novosItens: ItemComposicaoCalculadora[], substituir: boolean) => void
}

export function ModalImportarComposicaoNcm({
  aberto,
  onOpenChange,
  onConfirmar,
}: ModalImportarComposicaoNcmProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nomeArquivo, setNomeArquivo] = useState<string>('')
  const [carregando, setCarregando] = useState<boolean>(false)
  const [resultado, setResultado] = useState<ResultadoImportacaoComposicaoNcm | null>(null)
  const [modoImportacao, setModoImportacao] = useState<'acrescentar' | 'substituir'>('substituir')

  const resetarModal = () => {
    setNomeArquivo('')
    setCarregando(false)
    setResultado(null)
    setModoImportacao('substituir')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFechar = () => {
    resetarModal()
    onOpenChange(false)
  }

  const handleBaixarModelo = () => {
    const conteudo = gerarCsvModeloComposicaoNcm()
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo_composicao_ncm_lc214.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Modelo CSV baixado',
      description: 'Preencha com colunas de item, NCM e valor mensal.',
    })
  }

  const processarLinhasSimples = (texto: string, nome: string) => {
    const res = processarCsvComposicaoNcm(texto, nome)
    setResultado(res)
    if (!res.sucesso) {
      toast({
        title: 'Falha no processamento',
        description: res.erro || 'Não foi possível ler as colunas da planilha.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Planilha analisada com sucesso',
        description: `${res.totalValidas} itens válidos detectados (${res.totalComNcm} com NCM).`,
      })
    }
  }

  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setNomeArquivo(arquivo.name)
    setCarregando(true)

    const extensao = arquivo.name.split('.').pop()?.toLowerCase()

    if (extensao === 'csv' || extensao === 'txt') {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const texto = evt.target?.result as string
        processarLinhasSimples(texto, arquivo.name)
        setCarregando(false)
      }
      reader.onerror = () => {
        toast({
          title: 'Erro na leitura do arquivo',
          description: 'Não foi possível ler o arquivo enviado.',
          variant: 'destructive',
        })
        setCarregando(false)
      }
      reader.readAsText(arquivo, 'utf-8')
    } else {
      // Tenta ler como texto ou instrui sobre CSV
      toast({
        title: 'Formato recomendado: CSV',
        description:
          'Para melhor compatibilidade imediata, utilize formato CSV (separado por vírgula ou ponto-e-vírgula).',
      })
      const reader = new FileReader()
      reader.onload = (evt) => {
        const texto = evt.target?.result as string
        if (typeof texto === 'string') {
          processarLinhasSimples(texto, arquivo.name)
        }
        setCarregando(false)
      }
      reader.onerror = () => {
        setCarregando(false)
      }
      reader.readAsText(arquivo)
    }
  }

  const handleConfirmarImportacao = () => {
    if (!resultado || resultado.itens.length === 0) return

    const novosItens: ItemComposicaoCalculadora[] = resultado.itens
      .filter((it) => it.valido && it.valor > 0)
      .map((it, idx) => ({
        id: `item_ncm_${Date.now()}_${idx}`,
        descricao: it.descricao,
        ncm: it.ncm,
        ncmFormatado: it.ncmFormatado,
        ncmClassificadoAuto: it.ncmClassificadoAuto,
        tratamentoTributario: it.tratamento,
        reducaoPercentual: it.reducaoPercentual,
        valor: it.valor,
        origem: it.origem,
        anexoReferencia: it.anexoReferencia,
        observacao:
          it.observacoes ||
          (it.ncmClassificadoAuto ? 'Classificado via base curada LC 214/2025' : undefined),
      }))

    if (novosItens.length === 0) {
      toast({
        title: 'Nenhum item com valor positivo',
        description: 'Certifique-se de preencher a coluna com o valor mensal de cada item.',
        variant: 'destructive',
      })
      return
    }

    onConfirmar(novosItens, modoImportacao === 'substituir')
    toast({
      title: 'Composição importada',
      description: `${novosItens.length} itens adicionados à composição da Calculadora.`,
    })
    handleFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#07132B]">
              Importar Composição de Faturamento com NCM
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBaixarModelo}
              className="text-xs border-[#D4AF37] text-[#07132B] hover:bg-amber-50"
            >
              Baixar Modelo CSV
            </Button>
          </div>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Envie sua planilha com colunas de item/produto, código NCM e valor mensal. O sistema
            classifica automaticamente cada código na base curada da LC 214/2025 (cesta básica,
            reduções de 60%/30%, monofásicos e insumos agropecuários).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Caixa de upload */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-[#D4AF37] transition-colors bg-slate-50/60">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleArquivoSelecionado}
            />
            <p className="text-sm font-semibold text-[#07132B]">
              {nomeArquivo
                ? `Arquivo selecionado: ${nomeArquivo}`
                : 'Selecione sua planilha CSV ou TXT'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Colunas aceitas: <code className="bg-slate-200 px-1 py-0.5 rounded">ncm</code>,{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded">codigo_ncm</code>,{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded">classificacao_fiscal</code>,{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded">produto</code>,{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded">valor</code>
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={carregando}
                className="bg-[#07132B] text-white hover:bg-[#07132B]/90 font-medium text-xs px-4"
              >
                {carregando ? 'Processando arquivo...' : 'Escolher Arquivo'}
              </Button>
            </div>
          </div>

          {/* Resumo da detecção */}
          {resultado && resultado.sucesso && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-100 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block">Itens Detectados</span>
                  <span className="text-lg font-bold text-[#07132B]">{resultado.totalLidas}</span>
                </div>
                <div className="bg-slate-100 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block">Com Código NCM</span>
                  <span className="text-lg font-bold text-[#07132B]">{resultado.totalComNcm}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-xs text-emerald-800 block">Sugeridos via NCM</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {resultado.totalSugeridasNcm}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="text-xs text-amber-800 block">Valor Total Mensal</span>
                  <span className="text-lg font-bold text-[#07132B]">
                    {formatarMoeda(resultado.valorTotalDetectado)}
                  </span>
                </div>
              </div>

              {/* Tabela de pré-visualização */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#07132B]">
                    Pré-visualização dos Itens e Tratamento Tributário Sugerido
                  </span>
                  <span className="text-xs text-slate-500">
                    Mostrando até {Math.min(resultado.itens.length, 10)} de {resultado.itens.length}{' '}
                    itens
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 sticky top-0">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Item</TableHead>
                        <TableHead className="font-semibold text-slate-700">NCM</TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Tratamento Tributário
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">
                          Valor Mensal
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">Origem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.itens.slice(0, 10).map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">
                            {it.descricao}
                          </TableCell>
                          <TableCell className="font-mono text-slate-700">
                            {it.ncmFormatado || it.ncm || '—'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-[#07132B]">
                              {it.descricaoTratamento}
                            </span>
                            {it.anexoReferencia && (
                              <span className="text-[10px] text-slate-500 block">
                                {it.anexoReferencia}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {formatarMoeda(it.valor)}
                          </TableCell>
                          <TableCell>
                            {it.origem === 'ncm_sugerido' ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-semibold">
                                Sugerido via NCM
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-600 text-[10px]">
                                Manual
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Opção de substituição ou acréscimo */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Modo de aplicação na composição:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={modoImportacao === 'substituir' ? 'default' : 'outline'}
                    onClick={() => setModoImportacao('substituir')}
                    className={
                      modoImportacao === 'substituir'
                        ? 'bg-[#07132B] text-white text-xs h-7'
                        : 'text-xs h-7'
                    }
                  >
                    Substituir composição atual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={modoImportacao === 'acrescentar' ? 'default' : 'outline'}
                    onClick={() => setModoImportacao('acrescentar')}
                    className={
                      modoImportacao === 'acrescentar'
                        ? 'bg-[#07132B] text-white text-xs h-7'
                        : 'text-xs h-7'
                    }
                  >
                    Acrescentar aos itens existentes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
          <Button variant="outline" size="sm" onClick={handleFechar} className="text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmarImportacao}
            disabled={!resultado || !resultado.sucesso || resultado.totalValidas === 0}
            className="bg-[#07132B] hover:bg-[#07132B]/90 text-white text-xs font-semibold px-4"
          >
            Confirmar e Aplicar na Calculadora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
