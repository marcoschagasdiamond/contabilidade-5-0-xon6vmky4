/**
 * Modal de importação de faturamento em /dados-empresa — DUAS FONTES:
 *  - aba "Arquivo": OFX/CSV/XLSX/TXT (fluxo original, intocado)
 *  - aba "Google Sheets": planilha online da PRÓPRIA conta Google do usuário
 *    (conector toolkit 'googlesheets' via ConnectorButton + execute()).
 *
 * O modal NUNCA grava nada: apenas pré-visualiza e devolve o
 * ResultadoIngestaoFaturamento ao onConfirmarImportacao (a página grava via
 * DadosEmpresaContext.salvar()).
 */
import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Table2, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import {
  importarFaturamentoGoogleSheets,
  type IngestaoSheetsIntermediaria,
} from '@/lib/ingestaoFaturamentoSheets'
import { parsePlanilhaCsvXlsx, type ResultadoIngestaoFaturamento } from '@/lib/ingestaoFaturamento'
import type { LinhaPlanilhaBruta } from '@/lib/ingestaoFaturamento'

interface ModalImportarFaturamentoProps {
  aberto: boolean
  onFechar: () => void
  onConfirmarImportacao: (resumo: ResultadoIngestaoFaturamento) => void
  abaInicial?: 'arquivo' | 'sheets'
}

type AbaFonte = 'arquivo' | 'sheets'

const FORMATOS_ACEITOS = '.ofx,.csv,.xlsx,.xls,.txt'

export function ModalImportarFaturamento({
  aberto,
  onFechar,
  onConfirmarImportacao,
  abaInicial = 'arquivo',
}: ModalImportarFaturamentoProps) {
  const [aba, setAba] = useState<AbaFonte>(abaInicial)
  const [abaRestaurada, setAbaRestaurada] = useState(false)

  // ---- Estado compartilhado das duas fontes (pós-leitura) -----------------
  const [colunas, setColunas] = useState<string[]>([])
  const [linhas, setLinhas] = useState<LinhaPlanilhaBruta[]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<ResultadoIngestaoFaturamento | null>(null)
  const [erroLeitura, setErroLeitura] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)

  // ---- Estado da aba arquivo ----------------------------------------------
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)

  // ---- Estado da aba sheets -----------------------------------------------
  const [linkPlanilha, setLinkPlanilha] = useState('')
  const [planilhaSheets, setPlanilhaSheets] = useState<IngestaoSheetsIntermediaria | null>(null)

  // Restaura a aba pedida quando o modal (re)abre
  if (aberto && !abaRestaurada) {
    setAba(abaInicial)
    setAbaRestaurada(true)
  }
  if (!aberto && abaRestaurada) {
    setAbaRestaurada(false)
  }

  const limparEstado = useCallback(() => {
    setColunas([])
    setLinhas([])
    setMapeamento({})
    setResultado(null)
    setErroLeitura(null)
    setNomeArquivo(null)
    setPlanilhaSheets(null)
  }, [])

  const aplicarDados = useCallback((dados: { colunas: string[]; linhas: LinhaPlanilhaBruta[] }) => {
    setColunas(dados.colunas)
    setLinhas(dados.linhas)
    setMapeamento(sugerirMapeamentoColunas(dados.colunas))
    setResultado(null)
  }, [])

  /** Aba arquivo: lê OFX/CSV/XLSX/TXT local. */
  const aoSelecionarArquivo = useCallback(
    async (arquivo: File) => {
      setLendo(true)
      setErroLeitura(null)
      setPlanilhaSheets(null)
      setNomeArquivo(arquivo.name)
      try {
        const intermediaria = await parsePlanilhaCsvXlsx(arquivo)
        if (!intermediaria.sucesso) {
          setErroLeitura(intermediaria.erro || 'Não foi possível ler o arquivo.')
          setColunas([])
          setLinhas([])
          setResultado(null)
          return
        }
        aplicarDados(intermediaria)
      } catch (err) {
        setErroLeitura(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.')
        setColunas([])
        setLinhas([])
        setResultado(null)
      } finally {
        setLendo(false)
      }
    },
    [aplicarDados],
  )

  /** Aba sheets: lê a planilha online pela conta Google conectada do usuário. */
  const aoLerPlanilhaSheets = useCallback(async () => {
    setLendo(true)
    setErroLeitura(null)
    setNomeArquivo(null)
    try {
      const intermediaria = await importarFaturamentoGoogleSheets(linkPlanilha)
      setPlanilhaSheets(intermediaria)
      if (!intermediaria.sucesso) {
        setErroLeitura(intermediaria.erro || 'Não foi possível ler a planilha.')
        setColunas([])
        setLinhas([])
        setResultado(null)
        return
      }
      aplicarDados(intermediaria)
    } catch (err) {
      setPlanilhaSheets(null)
      setErroLeitura(err instanceof Error ? err.message : 'Não foi possível ler a planilha.')
      setColunas([])
      setLinhas([])
      setResultado(null)
    } finally {
      setLendo(false)
    }
  }, [linkPlanilha, aplicarDados])

  /** Recalcula a pré-visualização quando o mapeamento muda (fonte: colunas→valores). */
  const recalcular = useCallback(
    (novoMapeamento: Record<string, string>) => {
      setMapeamento(novoMapeamento)
      if (linhas.length === 0) {
        setResultado(null)
        return
      }
      const res = processarMapeamentoFaturamento({
        colunas,
        linhas,
        mapeamento: novoMapeamento,
        tipoFonte: aba === 'sheets' ? 'sheets' : 'arquivo',
        nomeFonte:
          aba === 'sheets'
            ? planilhaSheets?.titulo || 'Planilha Google Sheets'
            : nomeArquivo || undefined,
      })
      setResultado(res)
    },
    [linhas, colunas, aba, planilhaSheets, nomeArquivo],
  )

  const podeConfirmar = !!resultado && !resultado.erro && resultado.totalLinhas > 0

  const aoConfirmar = useCallback(() => {
    if (!podeConfirmar || !resultado) return
    onConfirmarImportacao(resultado)
  }, [podeConfirmar, resultado, onConfirmarImportacao])

  const resumoSheets = useMemo(() => {
    if (aba !== 'sheets' || !planilhaSheets?.sucesso) return null
    return planilhaSheets
  }, [aba, planilhaSheets])

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar faturamento</DialogTitle>
          <DialogDescription>
            OFX, CSV, XLSX, TXT ou Google Sheets — pré-visualiza antes de gravar.
          </DialogDescription>
        </DialogHeader>

        {/* Toggles de fonte */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={aba === 'arquivo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setAba('arquivo')
              limparEstado()
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Arquivo
          </Button>
          <Button
            type="button"
            variant={aba === 'sheets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setAba('sheets')
              limparEstado()
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Google Sheets
          </Button>
        </div>

        {erroLeitura && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erroLeitura}
          </div>
        )}

        {/* --------------------------- ABA ARQUIVO --------------------------- */}
        {aba === 'arquivo' && (
          <div className="space-y-3">
            <Label htmlFor="importar-faturamento-arquivo" className="sr-only">
              Arquivo de faturamento
            </Label>
            <Input
              id="importar-faturamento-arquivo"
              type="file"
              accept={FORMATOS_ACEITOS}
              disabled={lendo}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void aoSelecionarArquivo(f)
              }}
            />
            {lendo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo…
              </div>
            )}
          </div>
        )}

        {/* ------------------------ ABA GOOGLE SHEETS ------------------------ */}
        {aba === 'sheets' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ConnectorButton toolkit="googlesheets" name="Google Sheets" />
              <span className="text-xs text-muted-foreground">
                Conecte a SUA conta Google para o app ler a planilha que você compartilhar.
              </span>
            </div>
            <div className="space-y-1">
              <Label htmlFor="importar-faturamento-sheets-link">Link ou ID da planilha</Label>
              <div className="flex gap-2">
                <Input
                  id="importar-faturamento-sheets-link"
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  value={linkPlanilha}
                  disabled={lendo}
                  onChange={(e) => setLinkPlanilha(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={lendo || !linkPlanilha.trim()}
                  onClick={() => void aoLerPlanilhaSheets()}
                >
                  {lendo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Table2 className="h-4 w-4" />
                  )}
                  Ler planilha
                </Button>
              </div>
            </div>
            {resumoSheets && (
              <p className="text-xs text-muted-foreground">
                Planilha lida:{' '}
                <span className="font-medium">{resumoSheets.titulo || resumoSheets.id}</span> —{' '}
                {resumoSheets.totalLinhas} linha(s) de dados.
              </p>
            )}
          </div>
        )}

        {/* ------------------- MAPEAMENTO + PRÉ-VISUALIZAÇÃO ------------------ */}
        {colunas.length > 0 && linhas.length > 0 && (
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {['data', 'valor', 'descricao'].map((campo) => (
                <div key={campo} className="space-y-1">
                  <Label>
                    Coluna{' '}
                    {campo === 'data'
                      ? 'da data'
                      : campo === 'valor'
                        ? 'do valor'
                        : 'da descrição (opcional)'}
                  </Label>
                  <Select
                    value={mapeamento[campo] || ''}
                    onValueChange={(v) => recalcular({ ...mapeamento, [campo]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {colunas.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {resultado?.erro && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{resultado.erro}</span>
              </div>
            )}

            {resultado && !resultado.erro && (
              <div className="rounded-md border px-3 py-2 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pré-visualização
                </div>
                <div className="text-sm">
                  Total: <span className="font-semibold">{formatarMoeda(resultado.total)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {resultado.totalLinhas} lançamento(s) · período {resultado.periodoInicio || '—'} a{' '}
                  {resultado.periodoFim || '—'}
                </div>
                <div className="max-h-40 overflow-y-auto text-xs">
                  {resultado.lancamentos.slice(0, 20).map((l, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-2 border-b py-0.5 last:border-b-0"
                    >
                      <span>
                        {l.data || '—'} — {l.descricao || '(sem descrição)'}
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        {formatarMoeda(l.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onFechar}>
                Cancelar
              </Button>
              <Button type="button" size="sm" disabled={!podeConfirmar} onClick={aoConfirmar}>
                Confirmar importação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
