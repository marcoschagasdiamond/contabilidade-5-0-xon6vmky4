import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  detectarTipoFonte,
  parseOfxConteudo,
  parsePlanilhaCsvXlsx,
  sugerirMapeamentoColunas,
  processarMapeamentoFaturamento,
  type ResultadoIngestaoFaturamento,
  type TipoFonteFaturamento,
  type IngestaoPlanilhaIntermediaria,
} from '@/lib/ingestaoFaturamento'

export interface ModalImportarFaturamentoEmpresaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado SOMENTE quando há um total válido pré-visualizado — nada é gravado aqui. */
  onConfirmarImportacao: (resumo: ResultadoIngestaoFaturamento) => void | Promise<void>
}

const FORMATOS_ACEITOS = '.ofx,.csv,.xlsx,.txt'

function formatarBrl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataIso(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

/**
 * Modal de importação de faturamento por arquivo (OFX / CSV / XLSX) na página
 * Dados da Empresa. Segue o padrão do modal da Calculadora: seleção de
 * arquivo → pré-visualização (total, quantidade de lançamentos, período) →
 * confirmação. Arquivo inválido/vazio mostra mensagem clara em PT-BR e NADA é
 * gravado — a gravação acontece na página, via DadosEmpresaContext.salvar().
 */
export function ModalImportarFaturamento({
  open,
  onOpenChange,
  onConfirmarImportacao,
}: ModalImportarFaturamentoEmpresaProps) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [tipoFonte, setTipoFonte] = useState<TipoFonteFaturamento | null>(null)
  const [ofxTexto, setOfxTexto] = useState<string | null>(null)
  const [planilha, setPlanilha] = useState<IngestaoPlanilhaIntermediaria | null>(null)
  const [colunaFaturamento, setColunaFaturamento] = useState('')
  // Período opcional indicado pelo técnico (quando o arquivo não traz datas)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')

  // Reseta tudo ao abrir
  useEffect(() => {
    if (open) {
      setCarregando(false)
      setErro(null)
      setNomeArquivo('')
      setTipoFonte(null)
      setOfxTexto(null)
      setPlanilha(null)
      setColunaFaturamento('')
      setPeriodoInicio('')
      setPeriodoFim('')
    }
  }, [open])

  // Pré-visualização recalculada em tempo real (inclusive quando o técnico
  // ajusta o filtro de período em um OFX)
  const preview = useMemo<ResultadoIngestaoFaturamento | null>(() => {
    if (tipoFonte === 'ofx' && ofxTexto !== null) {
      return parseOfxConteudo(ofxTexto, nomeArquivo, {
        inicio: periodoInicio || undefined,
        fim: periodoFim || undefined,
      })
    }
    if ((tipoFonte === 'csv' || tipoFonte === 'xlsx') && planilha?.sucesso && colunaFaturamento) {
      const extraido = processarMapeamentoFaturamento(planilha.linhas, {
        colunaFaturamento,
        tipoFaturamento: 'auto',
      })
      if (extraido.faturamentoMensal <= 0) return null
      return {
        sucesso: true,
        tipoFonte,
        nomeArquivo,
        receitaTotal: extraido.faturamentoMensal,
        qtdLancamentos: extraido.totalMesesIdentificados,
        periodoInicio: periodoInicio || undefined,
        periodoFim: periodoFim || undefined,
        lancamentos: [],
        avisos: extraido.avisos,
      }
    }
    return null
  }, [tipoFonte, ofxTexto, planilha, colunaFaturamento, periodoInicio, periodoFim, nomeArquivo])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErro(null)
    setOfxTexto(null)
    setPlanilha(null)
    setPeriodoInicio('')
    setPeriodoFim('')
    setColunaFaturamento('')

    const tipo = detectarTipoFonte(file.name)
    if (!tipo) {
      setTipoFonte(null)
      setErro(
        'Formato de arquivo não suportado. Envie um extrato .ofx, uma planilha .csv/.xlsx ou um .txt delimitado.',
      )
      e.target.value = ''
      return
    }

    setNomeArquivo(file.name)
    setTipoFonte(tipo)
    setCarregando(true)
    try {
      if (tipo === 'ofx') {
        const texto = await file.text()
        setOfxTexto(texto)
      } else {
        const res = await parsePlanilhaCsvXlsx(file)
        if (!res.sucesso) {
          setTipoFonte(null)
          setErro(res.erro || 'Não foi possível ler a planilha enviada.')
        } else {
          setPlanilha(res)
          const sugestao = sugerirMapeamentoColunas(res.colunas)
          setColunaFaturamento(sugestao.colunaFaturamento || res.colunas[0] || '')
        }
      }
    } catch (err: any) {
      setTipoFonte(null)
      setErro(err?.message || 'Falha ao ler o arquivo. Verifique se ele não está corrompido.')
    } finally {
      setCarregando(false)
      // Limpa o input para permitir reenviar o mesmo arquivo
      e.target.value = ''
    }
  }

  const handleConfirmar = () => {
    if (!preview || !preview.sucesso || preview.receitaTotal <= 0) return
    onConfirmarImportacao(preview)
    onOpenChange(false)
  }

  const erroExibicao = erro || (preview && !preview.sucesso ? preview.erro : null)
  const podeConfirmar = !!preview && preview.sucesso && preview.receitaTotal > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-slate-200">
        <DialogHeader>
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] w-fit">
            Contabilidade 5.0 • Importação de Faturamento
          </div>
          <DialogTitle className="text-base font-extrabold text-[#07132B] pt-1">
            Importar Faturamento de Arquivo
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Suba um extrato bancário (.ofx) ou uma planilha (.csv / .xlsx / .txt) com a receita do
            período. Nada é gravado antes de você revisar e confirmar os valores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Seleção de arquivo */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#07132B]">Arquivo de faturamento *</Label>
            <label className="block">
              <input
                type="file"
                accept={FORMATOS_ACEITOS}
                onChange={handleUpload}
                disabled={carregando}
                className="hidden"
              />
              <div className="w-full h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer">
                {carregando ? 'Lendo arquivo...' : 'Selecionar Arquivo (OFX / CSV / XLSX)'}
              </div>
            </label>
            <span className="text-[10px] text-slate-400 block">
              Formatos aceitos: .ofx (extrato bancário), .csv, .xlsx e .txt delimitado
            </span>
          </div>

          {/* Erro: arquivo inválido/vazio — mensagem clara, nada gravado */}
          {erroExibicao && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <span className="font-bold block">Não foi possível importar:</span>
              {erroExibicao}
            </div>
          )}

          {/* Coluna de faturamento (apenas planilhas) */}
          {(tipoFonte === 'csv' || tipoFonte === 'xlsx') && planilha?.sucesso && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#07132B]">
                Coluna de Faturamento / Receita *
              </Label>
              <Select value={colunaFaturamento} onValueChange={setColunaFaturamento}>
                <SelectTrigger className="h-9 text-xs border-slate-300">
                  <SelectValue placeholder="Selecione a coluna..." />
                </SelectTrigger>
                <SelectContent>
                  {planilha.colunas.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] text-slate-500">
                Ex: "Receita Bruta", "Faturamento", "Vendas" — {planilha.totalLinhas} linha(s)
                lida(s) do arquivo "{nomeArquivo}"
              </span>
            </div>
          )}

          {/* Pré-visualização */}
          {preview && preview.sucesso && (
            <div className="p-4 rounded-xl border-2 border-[#D4AF37]/60 bg-gradient-to-br from-amber-50/40 via-white to-white space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B] block">
                Pré-visualização — revise antes de confirmar
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Total calculado
                  </span>
                  <span className="text-sm font-mono font-extrabold text-[#07132B]">
                    {formatarBrl(preview.receitaTotal)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Lançamentos
                  </span>
                  <span className="text-sm font-mono font-extrabold text-[#07132B]">
                    {preview.qtdLancamentos}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Período
                  </span>
                  <span className="text-[11px] font-bold text-[#07132B]">
                    {preview.periodoInicio || preview.periodoFim
                      ? `${formatarDataIso(preview.periodoInicio)} a ${formatarDataIso(preview.periodoFim)}`
                      : 'Não identificado'}
                  </span>
                </div>
              </div>
              {preview.avisos.length > 0 && (
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  {preview.avisos.map((aviso, idx) => (
                    <p key={idx}>• {aviso}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Período manual (opcional) — para OFX filtra os créditos do extrato */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-[#07132B] block">
              Período de referência (opcional)
            </span>
            <p className="text-[11px] text-slate-600">
              Obrigatório apenas quando o arquivo não identificar datas. Em um OFX, informa o
              intervalo dos créditos somados.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={!podeConfirmar || carregando}
              className="text-xs h-9 bg-[#07132B] hover:bg-[#0c1e40] text-[#D4AF37] border border-[#D4AF37] font-extrabold shadow-md disabled:opacity-50"
            >
              Confirmar Importação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
