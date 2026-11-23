/**
 * Modal de importação de faturamento em /dados-empresa — DUAS FONTES:
 *  - aba "Arquivo": OFX/CSV/XLSX/TXT (fluxo original da v0.0.430, mesmo parser)
 *  - aba "Google Sheets": planilha online da PRÓPRIA conta Google do usuário
 *    (conector toolkit 'googlesheets' via ConnectorButton + execute()).
 *
 * O modal NUNCA grava nada: apenas pré-visualiza e devolve o
 * ResultadoIngestaoFaturamento ao onConfirmarImportacao (a página grava via
 * DadosEmpresaContext.salvar()).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Table2, Upload } from 'lucide-react'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
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
import {
  isConteudoSped,
  parseOfxConteudo,
  parsePlanilhaCsvXlsx,
  parseSpedFaturamento,
  processarMapeamentoFaturamento,
  sugerirMapeamentoColunas,
  type LinhaPlanilhaBruta,
  type MapeamentoColunasFaturamento,
  type ResultadoIngestaoFaturamento,
  type TransacaoOfx,
} from '@/lib/ingestaoFaturamento'

interface ModalImportarFaturamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmarImportacao: (resumo: ResultadoIngestaoFaturamento) => void
  abaInicial?: 'arquivo' | 'sheets'
  /** Perfil do formulário (fallback/aviso do parser SPED) — a página injeta o formDataRef.current */
  perfilAtual?: DadosEmpresaPerfil
}

type AbaFonte = 'arquivo' | 'sheets'

const FORMATOS_ACEITOS = '.ofx,.csv,.xlsx,.xls,.txt'
const NENHUMA = '__nenhuma__'

export function ModalImportarFaturamento({
  open,
  onOpenChange,
  onConfirmarImportacao,
  abaInicial = 'arquivo',
  perfilAtual,
}: ModalImportarFaturamentoProps) {
  const [aba, setAba] = useState<AbaFonte>(abaInicial)

  // ---- Estado compartilhado das duas fontes (pós-leitura) -----------------
  const [colunas, setColunas] = useState<string[]>([])
  const [linhas, setLinhas] = useState<LinhaPlanilhaBruta[]>([])
  const [mapeamento, setMapeamento] = useState<Partial<MapeamentoColunasFaturamento>>({})
  const [erroLeitura, setErroLeitura] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)

  // ---- Estado da aba arquivo ----------------------------------------------
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [resultadoOfx, setResultadoOfx] = useState<ResultadoIngestaoFaturamento | null>(null)

  // ---- Estado da aba sheets -----------------------------------------------
  const [linkPlanilha, setLinkPlanilha] = useState('')
  const [planilhaSheets, setPlanilhaSheets] = useState<IngestaoSheetsIntermediaria | null>(null)

  const limparEstado = useCallback(() => {
    setColunas([])
    setLinhas([])
    setMapeamento({})
    setErroLeitura(null)
    setNomeArquivo(null)
    setResultadoOfx(null)
    setPlanilhaSheets(null)
    setLinkPlanilha('')
  }, [])

  // Restaura a aba pedida e zera o estado quando o modal (re)abre
  useEffect(() => {
    if (open) {
      setAba(abaInicial)
      limparEstado()
    }
  }, [open, abaInicial, limparEstado])

  /** Aplica colunas/linhas lidas de uma planilha (arquivo ou Sheets). */
  const aplicarDados = useCallback((dados: { colunas: string[]; linhas: LinhaPlanilhaBruta[] }) => {
    setColunas(dados.colunas)
    setLinhas(dados.linhas)
    setMapeamento(sugerirMapeamentoColunas(dados.colunas))
    setResultadoOfx(null)
  }, [])

  /** Aba arquivo: lê OFX (extrato) ou CSV/XLSX (planilha) local. */
  const aoSelecionarArquivo = useCallback(
    async (arquivo: File) => {
      setLendo(true)
      setErroLeitura(null)
      setPlanilhaSheets(null)
      setColunas([])
      setLinhas([])
      setMapeamento({})
      setResultadoOfx(null)
      setNomeArquivo(arquivo.name)
      try {
        const ext = arquivo.name.split('.').pop()?.toLowerCase() || ''
        if (ext === 'ofx') {
          const texto = await arquivo.text()
          const res = parseOfxConteudo(texto, arquivo.name)
          if (!res.sucesso) {
            setErroLeitura(res.erro || 'Não foi possível ler o arquivo OFX.')
            return
          }
          setResultadoOfx(res)
          return
        }
        // SPED EFD (.txt): reconhecido pelo CONTEÚDO (linhas |0000|...), porque
        // o mesmo .txt é o formato que antes caía no parser CSV e só extraía a
        // razão social. Quando é SPED, roteia para o parser fiscal (Blocos A/C/D).
        let isSped = false
        if (ext === 'txt' || ext === 'csv' || ext === '') {
          try {
            isSped = isConteudoSped(await arquivo.slice(0, 512 * 1024).text())
          } catch {
            isSped = false
          }
        }
        if (isSped) {
          const texto = await arquivo.text()
          const res = parseSpedFaturamento(texto, arquivo.name, perfilAtual)
          if (!res.sucesso) {
            // SPED lido mas sem receita extraível: mostra o aviso PT-BR e NÃO
            // deixa confirmar (nada é gravado sem o usuário ver o valor)
            setErroLeitura(res.erro || 'Não foi possível extrair receita deste SPED.')
            return
          }
          setResultadoOfx(res)
          return
        }
        const intermediaria = await parsePlanilhaCsvXlsx(arquivo)
        if (!intermediaria.sucesso) {
          setErroLeitura(intermediaria.erro || 'Não foi possível ler o arquivo.')
          return
        }
        aplicarDados(intermediaria)
      } catch (err) {
        setErroLeitura(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.')
      } finally {
        setLendo(false)
      }
    },
    [aplicarDados, perfilAtual],
  )

  /** Aba sheets: lê a planilha online pela conta Google conectada do usuário. */
  const aoLerPlanilhaSheets = useCallback(async () => {
    setLendo(true)
    setErroLeitura(null)
    setNomeArquivo(null)
    setColunas([])
    setLinhas([])
    setMapeamento({})
    setResultadoOfx(null)
    setPlanilhaSheets(null)
    try {
      const intermediaria = await importarFaturamentoGoogleSheets(linkPlanilha)
      setPlanilhaSheets(intermediaria)
      if (!intermediaria.sucesso) {
        setErroLeitura(intermediaria.erro || 'Não foi possível ler a planilha.')
        return
      }
      aplicarDados(intermediaria)
    } catch (err) {
      setErroLeitura(err instanceof Error ? err.message : 'Não foi possível ler a planilha.')
    } finally {
      setLendo(false)
    }
  }, [linkPlanilha, aplicarDados])

  // ---- Pré-visualização da planilha (CSV/XLSX/Sheets) ----------------------
  const extraido = useMemo(() => {
    if (linhas.length === 0) return null
    const m: MapeamentoColunasFaturamento = {
      colunaFaturamento: mapeamento.colunaFaturamento || '',
      colunaPeriodo: mapeamento.colunaPeriodo || '',
      colunaCompras: mapeamento.colunaCompras || '',
      colunaFolha: mapeamento.colunaFolha || '',
      tipoFaturamento: mapeamento.tipoFaturamento || 'auto',
    }
    return processarMapeamentoFaturamento(linhas, m)
  }, [linhas, mapeamento])

  const resultadoPlanilha = useMemo<ResultadoIngestaoFaturamento | null>(() => {
    if (!extraido || extraido.faturamentoMensal <= 0) return null
    const periodoCol = mapeamento.colunaPeriodo || ''
    const colFat = mapeamento.colunaFaturamento || ''
    const periodos = (
      periodoCol ? linhas.map((l) => l[periodoCol] || '').filter((p) => p.trim() !== '') : []
    ).sort()
    const lancamentos: TransacaoOfx[] = linhas.slice(0, 300).map((l) => ({
      tipo: 'credito' as const,
      valor: 0,
      data: periodoCol ? l[periodoCol] || '' : '',
      descricao: colFat ? l[colFat] || '' : '',
    }))
    return {
      sucesso: true,
      tipoFonte: aba === 'sheets' ? 'sheets' : 'csv',
      nomeArquivo:
        aba === 'sheets'
          ? planilhaSheets?.titulo || planilhaSheets?.id || 'Planilha Google Sheets'
          : nomeArquivo || 'planilha',
      receitaTotal: extraido.faturamentoMensal,
      qtdLancamentos: extraido.totalMesesIdentificados,
      periodoInicio: periodos[0],
      periodoFim: periodos[periodos.length - 1],
      lancamentos,
      avisos: extraido.avisos || [],
    }
  }, [extraido, linhas, mapeamento, aba, planilhaSheets, nomeArquivo])

  const resumoFinal: ResultadoIngestaoFaturamento | null = resultadoOfx ?? resultadoPlanilha
  const podeConfirmar = !!resumoFinal && resumoFinal.sucesso && resumoFinal.receitaTotal > 0

  const aoConfirmar = useCallback(() => {
    if (!podeConfirmar || !resumoFinal) return
    onConfirmarImportacao(resumoFinal)
  }, [podeConfirmar, resumoFinal, onConfirmarImportacao])

  const resumoSheets = aba === 'sheets' && planilhaSheets?.sucesso ? planilhaSheets : null

  const periodoColExibicao = mapeamento.colunaPeriodo || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        {/* --------------------- MAPEAMENTO DA PLANILHA ---------------------- */}
        {aba !== 'arquivo' || resultadoOfx ? null : colunas.length > 0 && linhas.length > 0 ? (
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['colunaFaturamento', 'Coluna do faturamento (R$)'],
                  ['colunaPeriodo', 'Coluna do período (opcional)'],
                  ['colunaCompras', 'Coluna de compras (opcional)'],
                  ['colunaFolha', 'Coluna da folha (opcional)'],
                ] as const
              ).map(([campo, rotulo]) => (
                <div key={campo} className="space-y-1">
                  <Label>{rotulo}</Label>
                  <Select
                    value={mapeamento[campo] || NENHUMA}
                    onValueChange={(v) =>
                      setMapeamento((atual) => ({
                        ...atual,
                        [campo]: v === NENHUMA ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NENHUMA}>— Nenhuma —</SelectItem>
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
          </div>
        ) : null}

        {/* ------------------------ PRÉ-VISUALIZAÇÃO ------------------------- */}
        {resumoFinal && (
          <div className="space-y-3 border-t pt-3">
            {resumoFinal.avisos.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{resumoFinal.avisos.join(' ')}</span>
              </div>
            )}
            <div className="rounded-md border px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Pré-visualização
              </div>
              <div className="text-sm">
                Total:{' '}
                <span className="font-semibold">{formatarMoeda(resumoFinal.receitaTotal)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {resumoFinal.qtdLancamentos} lançamento(s) · período{' '}
                {resumoFinal.periodoInicio || '—'} a {resumoFinal.periodoFim || '—'}
              </div>
              <div className="max-h-40 overflow-y-auto text-xs">
                {resultadoOfx
                  ? resumoFinal.lancamentos.map((l, i) => (
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
                    ))
                  : linhas.slice(0, 20).map((l, i) => (
                      <div
                        key={i}
                        className="flex justify-between gap-2 border-b py-0.5 last:border-b-0"
                      >
                        <span>
                          {(periodoColExibicao ? l[periodoColExibicao] || '' : `#${i + 1}`) || '—'}{' '}
                          —{' '}
                          {mapeamento.colunaFaturamento
                            ? l[mapeamento.colunaFaturamento] || '(sem valor)'
                            : '(sem descrição)'}
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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
