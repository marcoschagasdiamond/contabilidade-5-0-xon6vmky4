import React, { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import {
  parseArquivoFaturamento,
  sugerirMapeamentoColunas,
  processarMapeamentoFaturamento,
  type ResultadoParsePlanilha,
  type MapeamentoColunasFaturamento,
  type FaturamentoExtraido,
} from '@/lib/importacaoFaturamento'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { execute, listConnectors, type ConnectorStatus } from '@/lib/skipConnectors'

export interface DadosFaturamentoImportados {
  faturamentoMensal: number
  faturamentoAnual: number
  comprasMensal?: number
  folhaMensal?: number
  detalhamentoMeses?: { periodo: string; valor: number }[]
  nomeArquivo?: string
}

export interface ModalImportarFaturamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmarImportacao: (dados: DadosFaturamentoImportados) => void
  valoresAtuais?: {
    faturamentoMensal: number
    comprasMensal?: number
    folhaMensal?: number
  }
}

type EtapaImportacao = 'selecao' | 'mapeamento' | 'revisao' | 'conector'

export function ModalImportarFaturamento({
  open,
  onOpenChange,
  onConfirmarImportacao,
  valoresAtuais,
}: ModalImportarFaturamentoProps) {
  const { toast } = useToast()

  const [etapa, setEtapa] = useState<EtapaImportacao>('selecao')
  const [carregandoArquivo, setCarregandoArquivo] = useState(false)
  const [resultadoParse, setResultadoParse] = useState<ResultadoParsePlanilha | null>(null)

  // Mapeamento guiado
  const [mapeamento, setMapeamento] = useState<MapeamentoColunasFaturamento>({
    colunaFaturamento: '',
    colunaPeriodo: '',
    tipoFaturamento: 'auto',
    colunaCompras: '',
    colunaFolha: '',
  })

  // Dados extraídos e editáveis antes de aplicar
  const [dadosEditaveis, setDadosEditaveis] = useState<{
    faturamentoMensal: string
    faturamentoAnual: string
    comprasMensal: string
    folhaMensal: string
  }>({
    faturamentoMensal: '',
    faturamentoAnual: '',
    comprasMensal: '',
    folhaMensal: '',
  })
  const [faturamentoExtraido, setFaturamentoExtraido] = useState<FaturamentoExtraido | null>(null)

  // Estado Conectores (Google Sheets / Excel)
  const [statusSheets, setStatusSheets] = useState<ConnectorStatus | null>(null)
  const [statusExcel, setStatusExcel] = useState<ConnectorStatus | null>(null)
  const [planilhaIdGoogle, setPlanilhaIdGoogle] = useState('')
  const [intervaloGoogle, setIntervaloGoogle] = useState('A1:Z100')
  const [buscandoConector, setBuscandoConector] = useState(false)

  // Reseta ao fechar/abrir
  useEffect(() => {
    if (open) {
      setEtapa('selecao')
      setResultadoParse(null)
      setFaturamentoExtraido(null)
      verificarConectores()
    }
  }, [open])

  const verificarConectores = async () => {
    try {
      const all = await listConnectors()
      setStatusSheets(all.find((c) => c.toolkit === 'googlesheets')?.status ?? null)
      setStatusExcel(all.find((c) => c.toolkit === 'excel')?.status ?? null)
    } catch (_) {
      // Falha silenciosa no check de conectores
    }
  }

  // Handler de upload de arquivo (CSV ou XLSX)
  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCarregandoArquivo(true)
    try {
      const res = await parseArquivoFaturamento(file)
      if (!res.sucesso) {
        toast({
          title: 'Arquivo inválido',
          description: res.erro || 'Não foi possível ler as colunas da planilha informada.',
          variant: 'destructive',
        })
        return
      }

      setResultadoParse(res)

      // Sugere mapeamento inteligente
      const sugestao = sugerirMapeamentoColunas(res.colunas)
      setMapeamento({
        colunaFaturamento: sugestao.colunaFaturamento || res.colunas[0] || '',
        colunaPeriodo: sugestao.colunaPeriodo || '',
        tipoFaturamento: sugestao.tipoFaturamento || 'auto',
        colunaCompras: sugestao.colunaCompras || '',
        colunaFolha: sugestao.colunaFolha || '',
      })

      setEtapa('mapeamento')
      toast({
        title: 'Planilha carregada!',
        description: `${res.totalLinhas} linhas identificadas no arquivo "${res.nomeArquivo}". Ajuste o mapeamento das colunas.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro no processamento',
        description: err?.message || 'Falha ao processar a planilha.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoArquivo(false)
      // limpa input para permitir selecionar o mesmo arquivo novamente
      e.target.value = ''
    }
  }

  // Avançar do mapeamento para revisão editável
  const handleAvancarParaRevisao = () => {
    if (!resultadoParse) return

    if (!mapeamento.colunaFaturamento) {
      toast({
        title: 'Mapeamento incompleto',
        description: 'Por favor, selecione a coluna correspondente ao faturamento/receita.',
        variant: 'destructive',
      })
      return
    }

    const extraido = processarMapeamentoFaturamento(resultadoParse.linhas, mapeamento)

    if (extraido.faturamentoMensal <= 0 && extraido.faturamentoAnual <= 0) {
      toast({
        title: 'Nenhum valor válido encontrado',
        description:
          extraido.avisos[0] ||
          'A coluna selecionada não contém valores numéricos positivos para faturamento.',
        variant: 'destructive',
      })
      return
    }

    setFaturamentoExtraido(extraido)
    setDadosEditaveis({
      faturamentoMensal: String(extraido.faturamentoMensal || ''),
      faturamentoAnual: String(extraido.faturamentoAnual || ''),
      comprasMensal: extraido.comprasMensal
        ? String(extraido.comprasMensal)
        : valoresAtuais?.comprasMensal
          ? String(valoresAtuais.comprasMensal)
          : '',
      folhaMensal: extraido.folhaMensal
        ? String(extraido.folhaMensal)
        : valoresAtuais?.folhaMensal
          ? String(valoresAtuais.folhaMensal)
          : '',
    })

    setEtapa('revisao')
  }

  // Puxar dados de Google Sheets via conector do próprio usuário
  const handlePuxarGoogleSheets = async () => {
    if (!planilhaIdGoogle.trim()) {
      toast({
        title: 'Informe a planilha',
        description: 'Cole o ID ou URL da planilha Google Sheets que você tem acesso.',
        variant: 'destructive',
      })
      return
    }

    let spreadsheetId = planilhaIdGoogle.trim()
    // Se colou a URL completa: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
    const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (urlMatch && urlMatch[1]) {
      spreadsheetId = urlMatch[1]
    }

    setBuscandoConector(true)
    try {
      const res = await execute('GOOGLESHEETS_VALUES_GET', {
        spreadsheet_id: spreadsheetId,
        range: intervaloGoogle.trim() || 'A1:Z100',
      })

      if (!res.successful || !res.data) {
        throw new Error(res.error || 'Não foi possível recuperar as células da planilha conectada.')
      }

      // Converte a matriz de valores da API em colunas e linhas
      const dataObj = res.data as any
      const rawValues: any[][] = dataObj?.values || dataObj?.valueRanges?.[0]?.values || []
      if (!Array.isArray(rawValues) || rawValues.length < 2) {
        throw new Error(
          'A planilha Google Sheets conectada precisa conter pelo menos um cabeçalho e uma linha de faturamento.',
        )
      }

      const colunas = rawValues[0].map((c: any, idx: number) => {
        const str = String(c || '').trim()
        return str || `Coluna_${idx + 1}`
      })

      const linhas: { [k: string]: string }[] = []
      for (let i = 1; i < rawValues.length; i++) {
        const row = rawValues[i]
        if (!Array.isArray(row) || row.every((c) => !String(c || '').trim())) continue
        const obj: { [k: string]: string } = {}
        colunas.forEach((col: string, idx: number) => {
          obj[col] = String(row[idx] || '').trim()
        })
        linhas.push(obj)
      }

      if (linhas.length === 0) {
        throw new Error(
          'Nenhuma linha preenchida com valores foi encontrada no intervalo selecionado.',
        )
      }

      const parseConector: ResultadoParsePlanilha = {
        sucesso: true,
        nomeArquivo: `Google Sheets (${spreadsheetId.slice(0, 8)}...)`,
        colunas,
        linhas,
        totalLinhas: linhas.length,
        amostra: linhas.slice(0, 5),
      }

      setResultadoParse(parseConector)
      const sugestao = sugerirMapeamentoColunas(colunas)
      setMapeamento({
        colunaFaturamento: sugestao.colunaFaturamento || colunas[0] || '',
        colunaPeriodo: sugestao.colunaPeriodo || '',
        tipoFaturamento: sugestao.tipoFaturamento || 'auto',
        colunaCompras: sugestao.colunaCompras || '',
        colunaFolha: sugestao.colunaFolha || '',
      })

      setEtapa('mapeamento')
      toast({
        title: 'Dados sincronizados do Google Sheets!',
        description: `${linhas.length} linhas lidas da sua planilha conectada.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao conectar planilha',
        description:
          err?.message ||
          'Certifique-se de que sua conta Google está conectada e que você possui permissão na planilha informada.',
        variant: 'destructive',
      })
    } finally {
      setBuscandoConector(false)
    }
  }

  // Confirmar e aplicar na simulação atual
  const handleConfirmar = () => {
    const faturamentoMensalNum = parseFloat(dadosEditaveis.faturamentoMensal) || 0
    const faturamentoAnualNum =
      parseFloat(dadosEditaveis.faturamentoAnual) || faturamentoMensalNum * 12
    const comprasMensalNum = dadosEditaveis.comprasMensal
      ? parseFloat(dadosEditaveis.comprasMensal)
      : undefined
    const folhaMensalNum = dadosEditaveis.folhaMensal
      ? parseFloat(dadosEditaveis.folhaMensal)
      : undefined

    if (faturamentoMensalNum <= 0) {
      toast({
        title: 'Faturamento inválido',
        description: 'O faturamento mensal revisado deve ser maior que zero.',
        variant: 'destructive',
      })
      return
    }

    onConfirmarImportacao({
      faturamentoMensal: faturamentoMensalNum,
      faturamentoAnual: faturamentoAnualNum,
      comprasMensal: comprasMensalNum,
      folhaMensal: folhaMensalNum,
      detalhamentoMeses: faturamentoExtraido?.detalhamentoMeses,
      nomeArquivo: resultadoParse?.nomeArquivo,
    })

    toast({
      title: 'Faturamento importado!',
      description: `R$ ${faturamentoMensalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês aplicado nos campos da simulação atual.`,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-200">
        <DialogHeader>
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] w-fit">
            Diamond Group • Importação de Faturamento
          </div>
          <DialogTitle className="text-base font-extrabold text-[#07132B] pt-1">
            Alimentar Simulação com Faturamento Externo
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Importe planilhas CSV/XLSX com colunas de faturamento mensal ou anual. Os valores
            preenchem apenas a simulação atual e podem ser editados manualmente antes de calcular.
          </DialogDescription>
        </DialogHeader>

        {/* ETAPA 1: SELEÇÃO DE FONTE DE DADOS */}
        {etapa === 'selecao' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Opção 1: Arquivo local CSV / XLSX */}
              <div className="p-4 rounded-xl border-2 border-[#D4AF37]/60 bg-gradient-to-br from-amber-50/40 via-white to-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                    Planilha CSV ou XLSX
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37] text-[#07132B] font-bold">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Aceita arquivos de faturamento de qualquer ERP, emissor fiscal ou relatório
                  contábil. O mapeamento guiado identificará as colunas de faturamento e período.
                </p>
                <div className="pt-1">
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv, .xlsx, .txt"
                      onChange={handleUploadArquivo}
                      disabled={carregandoArquivo}
                      className="hidden"
                    />
                    <div className="w-full h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer">
                      {carregandoArquivo ? 'Lendo planilha...' : 'Selecionar Arquivo (CSV / XLSX)'}
                    </div>
                  </label>
                  <span className="text-[10px] text-slate-400 block mt-1.5 text-center">
                    Formatos aceitos: .csv, .xlsx e .txt delimitado
                  </span>
                </div>
              </div>

              {/* Opção 2: Conexão via Google Sheets / Excel (App Connectors) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                      Google Sheets / Excel
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07132B] text-white font-semibold">
                      Sua Conta
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    Conecte a sua conta do Google Drive ou Microsoft 365 para puxar dados direto de
                    uma planilha em nuvem com o mesmo mapeamento guiado.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa('conector')}
                  className="w-full h-10 rounded-xl border-slate-300 hover:border-[#07132B] text-[#07132B] font-bold text-xs"
                >
                  Usar Planilha Conectada
                </Button>
              </div>
            </div>

            {/* Alerta de segurança e integridade */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-[#07132B] block">Garantia de integridade:</span>
              <p>
                A importação preenche somente os campos em edição na calculadora atual. Nenhuma
                simulação já salva no seu histórico será sobrescrita. Todas as fórmulas e alíquotas
                permanecem inalteradas.
              </p>
            </div>
          </div>
        )}

        {/* ETAPA 2: MAPEAMENTO GUIADO DE COLUNAS */}
        {etapa === 'mapeamento' && resultadoParse && (
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#07132B] block">
                  Arquivo: {resultadoParse.nomeArquivo}
                </span>
                <span className="text-[11px] text-slate-500">
                  {resultadoParse.totalLinhas} linhas identificadas •{' '}
                  {resultadoParse.colunas.length} colunas detectadas
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEtapa('selecao')}
                className="text-xs text-slate-600 hover:text-[#07132B]"
              >
                Trocar Arquivo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Coluna Faturamento (Obrigatória) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07132B]">
                  Coluna de Faturamento / Receita *
                </Label>
                <Select
                  value={mapeamento.colunaFaturamento}
                  onValueChange={(val) =>
                    setMapeamento((prev) => ({ ...prev, colunaFaturamento: val }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs border-slate-300">
                    <SelectValue placeholder="Selecione a coluna..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resultadoParse.colunas.map((col) => (
                      <SelectItem key={col} value={col} className="text-xs">
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-500">
                  Ex: "Receita Bruta", "Faturamento", "Vendas", "Total"
                </span>
              </div>

              {/* Tipo de Interpretação */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07132B]">
                  Interpretação do Faturamento
                </Label>
                <Select
                  value={mapeamento.tipoFaturamento}
                  onValueChange={(val: any) =>
                    setMapeamento((prev) => ({ ...prev, tipoFaturamento: val }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-xs">
                      Detecção Automática (Recomendado)
                    </SelectItem>
                    <SelectItem value="mensal" className="text-xs">
                      Valores Mensais (calcula média/total)
                    </SelectItem>
                    <SelectItem value="anual" className="text-xs">
                      Valor Anual Consolidado
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-500">
                  Define se cada linha é um mês ou o acumulado do ano
                </span>
              </div>

              {/* Coluna Período / Mês (Opcional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Coluna de Período / Mês (Opcional)
                </Label>
                <Select
                  value={mapeamento.colunaPeriodo || '__nenhuma__'}
                  onValueChange={(val) =>
                    setMapeamento((prev) => ({
                      ...prev,
                      colunaPeriodo: val === '__nenhuma__' ? '' : val,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs border-slate-300">
                    <SelectValue placeholder="Nenhuma selecionada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nenhuma__" className="text-xs">
                      Nenhuma (linhas sequenciais)
                    </SelectItem>
                    {resultadoParse.colunas.map((col) => (
                      <SelectItem key={col} value={col} className="text-xs">
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-500">
                  Ex: "Mês", "Competência", "Data", "Período"
                </span>
              </div>

              {/* Coluna Insumos / Compras (Opcional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Coluna de Compras / Insumos (Opcional)
                </Label>
                <Select
                  value={mapeamento.colunaCompras || '__nenhuma__'}
                  onValueChange={(val) =>
                    setMapeamento((prev) => ({
                      ...prev,
                      colunaCompras: val === '__nenhuma__' ? '' : val,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs border-slate-300">
                    <SelectValue placeholder="Nenhuma selecionada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nenhuma__" className="text-xs">
                      Nenhuma
                    </SelectItem>
                    {resultadoParse.colunas.map((col) => (
                      <SelectItem key={col} value={col} className="text-xs">
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-500">
                  Se presente, atualiza o campo de compras da simulação
                </span>
              </div>
            </div>

            {/* Amostra das primeiras linhas lidas */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-[#07132B] block">
                Pré-visualização dos dados ({resultadoParse.amostra.length} primeiras linhas):
              </span>
              <div className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold">
                    <tr>
                      {resultadoParse.colunas.slice(0, 5).map((c) => (
                        <th key={c} className="p-2 border-b border-slate-200 truncate">
                          {c}
                          {c === mapeamento.colunaFaturamento && (
                            <span className="ml-1 text-[9px] bg-[#D4AF37] text-[#07132B] px-1 rounded">
                              Fat
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoParse.amostra.map((linha, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        {resultadoParse.colunas.slice(0, 5).map((c) => (
                          <td key={c} className="p-2 truncate text-slate-600">
                            {linha[c] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa('selecao')}
                className="text-xs h-9"
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleAvancarParaRevisao}
                className="text-xs h-9 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold"
              >
                Processar e Revisar Valores
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: REVISÃO E EDIÇÃO MANUAL DOS VALORES ANTES DE APLICAR */}
        {etapa === 'revisao' && faturamentoExtraido && (
          <div className="space-y-4 pt-1">
            {/* Quadro explicativo da extração */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-[#07132B] block">
                Valores calculados a partir da planilha:
              </span>
              {faturamentoExtraido.avisos.map((aviso, idx) => (
                <p key={idx} className="text-slate-700 text-[11px]">
                  • {aviso}
                </p>
              ))}
            </div>

            {/* Campos visíveis e editáveis antes de calcular */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                  Revise e Edite os Campos da Simulação
                </span>
                <span className="text-[10px] text-slate-500">Editável manualmente</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07132B]">
                    Faturamento Mensal (R$) *
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={dadosEditaveis.faturamentoMensal}
                    onChange={(e) => {
                      const val = e.target.value
                      const num = parseFloat(val) || 0
                      setDadosEditaveis((prev) => ({
                        ...prev,
                        faturamentoMensal: val,
                        faturamentoAnual:
                          num > 0
                            ? String(Math.round(num * 12 * 100) / 100)
                            : prev.faturamentoAnual,
                      }))
                    }}
                    className="h-9 text-xs font-mono font-bold text-[#07132B]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Preencherá a receita mensal base da calculadora
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07132B]">Faturamento Anual (R$)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={dadosEditaveis.faturamentoAnual}
                    onChange={(e) =>
                      setDadosEditaveis((prev) => ({
                        ...prev,
                        faturamentoAnual: e.target.value,
                      }))
                    }
                    className="h-9 text-xs font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500">
                    Projeção anual da empresa em 12 meses
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Compras / Insumos Mensais (R$)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={dadosEditaveis.comprasMensal}
                    onChange={(e) =>
                      setDadosEditaveis((prev) => ({
                        ...prev,
                        comprasMensal: e.target.value,
                      }))
                    }
                    placeholder="Manter valor atual"
                    className="h-9 text-xs font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500">
                    Opcional: base para tomada de créditos IBS/CBS
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Folha de Pagamento Mensal (R$)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={dadosEditaveis.folhaMensal}
                    onChange={(e) =>
                      setDadosEditaveis((prev) => ({
                        ...prev,
                        folhaMensal: e.target.value,
                      }))
                    }
                    placeholder="Manter valor atual"
                    className="h-9 text-xs font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500">
                    Opcional: base para encargos e Fator R
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa('mapeamento')}
                className="text-xs h-9"
              >
                Voltar ao Mapeamento
              </Button>
              <Button
                type="button"
                onClick={handleConfirmar}
                className="text-xs h-9 bg-[#07132B] hover:bg-[#0c1e40] text-[#D4AF37] border border-[#D4AF37] font-extrabold shadow-md"
              >
                Aplicar na Simulação Atual
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA CONECTOR: GOOGLE SHEETS / EXCEL VIA CONTA DO PRÓPRIO USUÁRIO */}
        {etapa === 'conector' && (
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-[#07132B] block">
                Conexão da Conta do Próprio Usuário
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Cada usuário conecta sua conta individual do Google Workspace ou Microsoft 365. O
                aplicativo nunca acessa a conta do construtor nem armazena credenciais
                confidenciais.
              </p>
            </div>

            {/* Bloco Google Sheets */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#07132B] block">Google Sheets</span>
                  <span className="text-[10px] text-slate-500">
                    Status:{' '}
                    {statusSheets === 'connected'
                      ? 'Conectado à sua conta Google'
                      : 'Não conectado'}
                  </span>
                </div>
                <ConnectorButton
                  toolkit="googlesheets"
                  name="Google Sheets"
                  className="scale-90 origin-right"
                />
              </div>

              {statusSheets === 'connected' ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      ID ou Link da Planilha Google Sheets
                    </Label>
                    <Input
                      placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ou URL da planilha"
                      value={planilhaIdGoogle}
                      onChange={(e) => setPlanilhaIdGoogle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Intervalo de Células (A1 notation)
                    </Label>
                    <Input
                      placeholder="Ex: A1:Z100 ou 'Faturamento'!A1:M13"
                      value={intervaloGoogle}
                      onChange={(e) => setIntervaloGoogle(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handlePuxarGoogleSheets}
                    disabled={buscandoConector}
                    className="w-full h-9 mt-1 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs"
                  >
                    {buscandoConector ? 'Sincronizando...' : 'Puxar Dados para Mapeamento'}
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Clique no botão acima para autorizar o acesso à sua conta Google e selecionar suas
                  planilhas.
                </p>
              )}
            </div>

            {/* Bloco Microsoft Excel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#07132B] block">
                    Microsoft Excel (365)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Status:{' '}
                    {statusExcel === 'connected'
                      ? 'Conectado à sua conta Microsoft'
                      : 'Não conectado'}
                  </span>
                </div>
                <ConnectorButton
                  toolkit="excel"
                  name="Excel (365)"
                  className="scale-90 origin-right"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Para planilhas Excel em arquivo (.xlsx), você também pode fazer o upload direto no
                primeiro passo de forma instantânea sem precisar de autenticação na nuvem.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa('selecao')}
                className="text-xs h-9"
              >
                Voltar à Seleção de Arquivo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
