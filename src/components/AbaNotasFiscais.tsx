// Aba "Notas Fiscais" de /dados-empresa: importação CSV/XML-NFe com preview,
// listagem com totalizadores, filtros por período, limpar importação e exportar PDF/CSV.
// Padrão seguido: ModalImportarPlanilhaFornecedores + importacaoFornecedores.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import {
  FileUp,
  FileText,
  Trash2,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  FileJson,
} from 'lucide-react'
import {
  listarNotasFiscais,
  salvarLoteNotasFiscais,
  limparNotasFiscaisPorCliente,
  calcularTotaisNotasFiscais,
  type NotaFiscalRecord,
} from '@/services/notasFiscais'
import {
  parseCsvNotasFiscais,
  parseXmlNfe,
  ehArquivoXml,
  type LinhaNotaImportada,
} from '@/lib/notasFiscaisImportacao'
import { baixarCsvNotasFiscais, baixarPdfNotasFiscais } from '@/lib/pdfRelatorioNotasFiscais'

const BRL = (v: number) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const dataBr = (iso?: string) => {
  if (!iso || iso.length < 10) return '-'
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

interface AbaNotasFiscaisProps {
  nomeEmpresa: string
}

export function AbaNotasFiscais({ nomeEmpresa }: AbaNotasFiscaisProps) {
  const { user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()

  const [notas, setNotas] = useState<NotaFiscalRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [importando, setImportando] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [confirmarLimpar, setConfirmarLimpar] = useState(false)

  // Filtros por período
  const [filtroDe, setFiltroDe] = useState('')
  const [filtroAte, setFiltroAte] = useState('')

  // Preview da importação
  const [previewAberto, setPreviewAberto] = useState(false)
  const [previewNotas, setPreviewNotas] = useState<LinhaNotaImportada[]>([])
  const [previewErros, setPreviewErros] = useState<string[]>([])
  const [previewIgnoradas, setPreviewIgnoradas] = useState(0)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  const escopoParams = useMemo(
    () => ({
      clienteId: clienteAtivo?.id ?? null,
      userId: clienteAtivo?.id ? null : (user?.id ?? null),
    }),
    [clienteAtivo?.id, user?.id],
  )

  const carregar = useCallback(async () => {
    setCarregando(true)
    const lista = await listarNotasFiscais(escopoParams)
    setNotas(lista)
    setCarregando(false)
  }, [escopoParams])

  useEffect(() => {
    carregar()
  }, [carregar])

  const notasFiltradas = useMemo(() => {
    return notas.filter((n) => {
      const d = n.data_emissao || ''
      if (filtroDe && d && d < filtroDe) return false
      if (filtroAte && d && d > filtroAte) return false
      return true
    })
  }, [notas, filtroDe, filtroAte])

  const totais = useMemo(() => calcularTotaisNotasFiscais(notasFiltradas), [notasFiltradas])

  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    try {
      const conteudo = await arquivo.text()
      const isXml = ehArquivoXml(arquivo.name) || conteudo.trimStart().startsWith('<')
      const resultado = isXml ? parseXmlNfe(conteudo) : parseCsvNotasFiscais(conteudo)

      if (resultado.notas.length === 0) {
        toast({
          title: 'Nenhuma nota importada',
          description:
            resultado.erros[0] || 'Não foi possível extrair notas fiscais válidas do arquivo.',
          variant: 'destructive',
        })
        return
      }

      setPreviewNotas(resultado.notas)
      setPreviewErros(resultado.erros)
      setPreviewIgnoradas(resultado.ignoradas)
      setPreviewAberto(true)
    } catch (err) {
      console.warn('Erro ao ler arquivo de notas:', err)
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo é um CSV ou XML de NFe válido.',
        variant: 'destructive',
      })
    }
  }

  const confirmarImportacao = async () => {
    if (previewNotas.length === 0) return
    setImportando(true)
    try {
      const criadas = await salvarLoteNotasFiscais(
        previewNotas.map((n) => ({
          cliente_id: clienteAtivo?.id || '',
          numero: n.numero,
          data_emissao: n.data_emissao,
          cnpj_emitente: n.cnpj_emitente || '',
          nome_emitente: n.nome_emitente || '',
          valor_total: n.valor_total,
          valor_produtos: n.valor_produtos || 0,
          regime_fornecedor: n.regime_fornecedor || '',
          origem: n.origem,
        })),
      )
      setPreviewAberto(false)
      setPreviewNotas([])
      toast({
        title: 'Importação concluída',
        description: `${criadas.length} nota(s) importada(s) com sucesso.`,
      })
      await carregar()
    } catch (err) {
      console.warn('Erro ao salvar notas:', err)
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível salvar as notas fiscais. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setImportando(false)
    }
  }

  const handleLimpar = async () => {
    setLimpando(true)
    try {
      const removidas = await limparNotasFiscaisPorCliente(escopoParams)
      toast({
        title: 'Importação limpa',
        description: `${removidas} nota(s) removida(s).`,
      })
      setConfirmarLimpar(false)
      await carregar()
    } catch (err) {
      console.warn('Erro ao limpar notas:', err)
      toast({
        title: 'Erro ao limpar',
        description: 'Não foi possível remover as notas fiscais.',
        variant: 'destructive',
      })
    } finally {
      setLimpando(false)
    }
  }

  const formatarOrigem = (origem?: string) => {
    switch (origem) {
      case 'csv':
        return 'CSV'
      case 'xml_nfe':
        return 'XML NFe'
      default:
        return origem || '-'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileJson className="h-5 w-5" />
            Notas Fiscais de Compras (CSV / XML NFe)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Importe as notas fiscais reais de compras da empresa. Esses valores alimentam a
            Calculadora IBS/CBS (botão "Usar notas fiscais reais"), sem alterar nenhuma fórmula
            fiscal. CSV com colunas{' '}
            <code className="rounded bg-muted px-1 text-xs">
              numero, data, cnpj_emitente, nome_emitente, valor_total, valor_produtos
            </code>{' '}
            ou XML de NFe (campos ide/det/prod).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputArquivoRef}
              type="file"
              accept=".csv,.txt,.xml"
              className="hidden"
              onChange={handleSelecionarArquivo}
            />
            <Button onClick={() => inputArquivoRef.current?.click()} disabled={importando}>
              {importando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Importar CSV / XML
            </Button>
            <Button
              variant="outline"
              onClick={() => baixarCsvNotasFiscais(notasFiltradas, nomeEmpresa)}
              disabled={notasFiltradas.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => baixarPdfNotasFiscais(notasFiltradas, nomeEmpresa)}
              disabled={notasFiltradas.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmarLimpar(true)}
              disabled={notas.length === 0 || limpando}
            >
              {limpando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Limpar importação
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <CardTitle className="text-base">Notas importadas</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">De</label>
                <Input
                  type="date"
                  value={filtroDe}
                  onChange={(e) => setFiltroDe(e.target.value)}
                  className="h-8 w-36"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Até</label>
                <Input
                  type="date"
                  value={filtroAte}
                  onChange={(e) => setFiltroAte(e.target.value)}
                  className="h-8 w-36"
                />
              </div>
              {(filtroDe || filtroAte) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroDe('')
                    setFiltroAte('')
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-lg font-semibold">{totais.quantidade}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="text-lg font-semibold">{BRL(totais.valorTotal)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Valor produtos</p>
              <p className="text-lg font-semibold">{BRL(totais.valorProdutos)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Média por nota</p>
              <p className="text-lg font-semibold">{BRL(totais.mediaValor)}</p>
            </div>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notasFiltradas.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              {notas.length === 0
                ? 'Nenhuma nota fiscal importada ainda. Use o botão "Importar CSV / XML" acima.'
                : 'Nenhuma nota no período selecionado.'}
            </div>
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Emitente</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Produtos</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notasFiltradas.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.numero}</TableCell>
                      <TableCell>{dataBr(n.data_emissao)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {n.nome_emitente || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{n.cnpj_emitente || '-'}</TableCell>
                      <TableCell className="text-right">{BRL(n.valor_total)}</TableCell>
                      <TableCell className="text-right">{BRL(n.valor_produtos)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatarOrigem(n.origem)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview antes de confirmar */}
      <Dialog open={previewAberto} onOpenChange={setPreviewAberto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Confirme a importação</DialogTitle>
            <DialogDescription>
              {previewNotas.length} nota(s) detectada(s)
              {previewIgnoradas > 0 ? `, ${previewIgnoradas} linha(s) ignorada(s)` : ''}. Nada é
              salvo antes da confirmação.
            </DialogDescription>
          </DialogHeader>

          {previewErros.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Linhas ignoradas</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc text-xs">
                  {previewErros.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-[300px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Emitente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Produtos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewNotas.slice(0, 100).map((n, i) => (
                  <TableRow key={i}>
                    <TableCell>{n.numero}</TableCell>
                    <TableCell>{dataBr(n.data_emissao)}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {n.nome_emitente || '-'}
                    </TableCell>
                    <TableCell className="text-right">{BRL(n.valor_total)}</TableCell>
                    <TableCell className="text-right">{BRL(n.valor_produtos)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewAberto(false)} disabled={importando}>
              Cancelar
            </Button>
            <Button onClick={confirmarImportacao} disabled={importando}>
              {importando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Importar {previewNotas.length} nota(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de limpeza */}
      <AlertDialog open={confirmarLimpar} onOpenChange={setConfirmarLimpar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as notas importadas?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá as {notas.length} nota(s) importada(s) do escopo atual (cliente ativo ou
              seu usuário). A ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={limpando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleLimpar()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={limpando}
            >
              {limpando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AbaNotasFiscais
