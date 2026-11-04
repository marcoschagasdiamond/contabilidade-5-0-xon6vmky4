import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Info,
} from 'lucide-react'
import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import { parseSpedConteudo, ResultadoParsingSped } from '@/lib/parseSpedFiscal'
import { parseBalanceteArquivo } from '@/lib/parseBalancete'
import { ModalResumoImportacaoSped } from './ModalResumoImportacaoSped'

interface SecaoImportacaoDocumentosFiscaisProps {
  perfilAtual: DadosEmpresaPerfil
  onConfirmarImportacao: (
    novosCampos: Partial<DadosEmpresaPerfil>,
    resultado: ResultadoParsingSped,
  ) => Promise<void>
  disabled?: boolean
}

export const SecaoImportacaoDocumentosFiscais: React.FC<SecaoImportacaoDocumentosFiscaisProps> = ({
  perfilAtual,
  onConfirmarImportacao,
  disabled = false,
}) => {
  const [carregando, setCarregando] = useState(false)
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [resultadoParsing, setResultadoParsing] = useState<ResultadoParsingSped | null>(null)
  const [itensInformativos, setItensInformativos] = useState<
    { rotulo: string; valor: number; descricao: string }[]
  >([])
  const [modalAberto, setModalAberto] = useState(false)
  const [salvandoConfirmacao, setSalvandoConfirmacao] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = async (file: File) => {
    setErroUpload(null)
    setItensInformativos([])

    const nome = file.name.toLowerCase()
    const extensao = nome.split('.').pop() || ''

    const isTxtOuSped = extensao === 'txt' || extensao === 'sped' || file.type.includes('text')
    const isPlanilhaBalancete = extensao === 'xlsx' || extensao === 'csv' || extensao === 'xls'

    if (!isTxtOuSped && !isPlanilhaBalancete) {
      setErroUpload(
        'Formato não suportado. Por favor envie um arquivo de escrituração EFD (.TXT) ou Balancete Contábil (.CSV / .XLSX).',
      )
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setErroUpload(
        'Arquivo muito grande. O limite máximo para importação no navegador é de 100MB.',
      )
      return
    }

    setCarregando(true)

    try {
      if (isPlanilhaBalancete) {
        // Rota de parsing de Balancete Contábil
        const resBalancete = await parseBalanceteArquivo(file, perfilAtual)

        if (!resBalancete.valido) {
          setErroUpload(
            resBalancete.erro ||
              'Não foi possível extrair dados válidos do Balancete Contábil. Verifique se a planilha possui contas com descrição e valores de saldo/movimentação.',
          )
          setCarregando(false)
          return
        }

        // Converte para formato compatível com ResultadoParsingSped
        const resultadoCompativel: ResultadoParsingSped = {
          valido: true,
          metadados: resBalancete.metadados,
          detalhes: {
            faturamentoPeriodo: resBalancete.detalhesBalancete.receitaBrutaPeriodo,
            faturamentoMensalEstimado: resBalancete.detalhesBalancete.faturamentoMensalEstimado,
            mesesNoArquivo: resBalancete.detalhesBalancete.mesesEstimados,
            receitaInterestadual: 0,
            receitaEstadual: 0,
            receitaExportacao: 0,
            percentualVendasInterestaduais: 0,
            percentualExportacao: 0,
            comprasTotais: 0,
            comprasComCredito: 0,
            comprasSemCredito: 0,
            percentualComprasSemCredito: 0,
            percentualComprasVendasEstimado: 0,
            insumosAliquotaCheia: 0,
            insumosMonofasicos: 0,
            insumosAliquotaReduzida: 0,
            perfilInsumosAliquotaCheia: 0,
            perfilInsumosMonofasicos: 0,
            perfilInsumosAliquotaReduzida: 0,
            presencaMonofasicos: false,
            categoriasMonofasicosDetectadas: [],
            insumosEnergeticosDetectados: resBalancete.detalhesBalancete.contasEnergiaEletrica > 0,
            intangiveisDetectados: resBalancete.detalhesBalancete.contasIntangiveisRoyalties > 0,
            imobilizadoIdentificado: resBalancete.detalhesBalancete.ativoImobilizadoTotal,
            saldoCredorAcumulado: 0,
            filiaisDetectadas: 1,
            ufsOperacaoDetectadas: [],
            regimeEspecialSugerido: 'nenhum',
            avisos: resBalancete.detalhesBalancete.avisos,
          },
          camposSugeridos: resBalancete.camposSugeridos,
          camposComparativo: resBalancete.camposComparativo,
        }

        setItensInformativos(resBalancete.detalhesBalancete.itensInformativos)
        setResultadoParsing(resultadoCompativel)
        setModalAberto(true)
      } else {
        // Rota de parsing de EFD SPED (TXT)
        const texto = await file.text()
        const resultado = parseSpedConteudo(texto, file.name, perfilAtual)

        if (!resultado.valido) {
          setErroUpload(
            resultado.erro ||
              'Não foi possível identificar uma estrutura EFD válida neste arquivo. Certifique-se de enviar a EFD Contribuições ou EFD ICMS/IPI em formato TXT.',
          )
          setCarregando(false)
          return
        }

        setItensInformativos([])
        setResultadoParsing(resultado)
        setModalAberto(true)
      }
    } catch (err: any) {
      console.error('Erro ao ler arquivo fiscal:', err)
      setErroUpload(
        err?.message ||
          'Erro ao ler o conteúdo do arquivo. Verifique se o arquivo não está corrompido.',
      )
    } finally {
      setCarregando(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processarArquivo(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled || carregando) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processarArquivo(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !carregando) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleConfirmarResumo = async () => {
    if (!resultadoParsing) return
    setSalvandoConfirmacao(true)
    try {
      await onConfirmarImportacao(resultadoParsing.camposSugeridos, resultadoParsing)
      setModalAberto(false)
      setResultadoParsing(null)
    } catch (err) {
      console.error('Erro ao confirmar importação:', err)
    } finally {
      setSalvandoConfirmacao(false)
    }
  }

  const docImportadoAnterior = perfilAtual.documentoFiscalImportado

  return (
    <>
      <Card className="border border-slate-200/90 shadow-md overflow-hidden bg-white rounded-2xl">
        {/* Cabeçalho do Bloco */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
              Aceleração Cadastral • Opcional
            </span>
            <h3 className="text-xl font-heading font-extrabold text-[#07132B] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#07132B]" />
              Importação de Documentos Fiscais (Opcional)
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Carregue a <strong>EFD Contribuições (SPED PIS/Cofins)</strong>,{' '}
              <strong>EFD ICMS/IPI</strong> ou <strong>Balancete Contábil (CSV/XLSX)</strong> para
              preencher automaticamente receitas, despesas geradoras de crédito, folha, insumos
              energéticos, intangíveis, imobilizado e filiais na Fonte Mestra.
            </p>
          </div>

          <Badge
            variant="outline"
            className="self-start sm:self-auto bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-3 py-1"
          >
            Preenchimento Opcional
          </Badge>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Alerta de Documento Já Importado (se houver histórico) */}
          {docImportadoAnterior && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-2.5 text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Último documento importado: {docImportadoAnterior.nomeArquivo} (
                    {docImportadoAnterior.nomeTipo})
                  </span>
                  <span className="text-emerald-700 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 inline" />
                    Processado em{' '}
                    {new Date(docImportadoAnterior.dataImportacao).toLocaleString('pt-BR')}
                    {docImportadoAnterior.linhasLidas
                      ? ` • ${docImportadoAnterior.linhasLidas.toLocaleString('pt-BR')} linhas`
                      : ''}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || carregando}
                className="text-xs font-semibold bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Importar Outro Período
              </Button>
            </div>
          )}

          {/* Dropzone de Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !carregando && !disabled && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#D4AF37] bg-amber-50/40 shadow-inner'
                : 'border-slate-300 hover:border-[#D4AF37] hover:bg-slate-50/60'
            } ${disabled || carregando ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.sped,.csv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || carregando}
            />

            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#07132B] to-[#0D1D3A] flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#07132B]/10">
                {carregando ? (
                  <span className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                ) : (
                  <FileText className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-[#07132B]">
                  {carregando
                    ? 'Lendo e analisando contas e movimentações...'
                    : 'Arraste seu arquivo SPED ou Balancete aqui ou clique para selecionar'}
                </h4>
                <p className="text-xs text-slate-500">
                  Aceita <strong>EFD Contribuições</strong>, <strong>EFD ICMS/IPI</strong> (.TXT) e{' '}
                  <strong>Balancete Contábil</strong> (.CSV ou .XLSX).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-slate-600 border-slate-200"
                >
                  EFD Contribuições (.TXT)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-slate-600 border-slate-200"
                >
                  EFD ICMS/IPI (.TXT)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-50 text-[#07132B] border-[#D4AF37]/40 font-bold"
                >
                  Balancete Contábil (.CSV / .XLSX)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-slate-600 border-slate-200"
                >
                  Processamento 100% no navegador
                </Badge>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro se houver */}
          {erroUpload && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Falha na leitura do arquivo</span>
                <p className="text-rose-800 leading-relaxed text-[11px]">{erroUpload}</p>
              </div>
            </div>
          )}

          {/* Destaque das Garantias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-[#07132B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Visualização Prévia
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Você visualiza todos os campos extraídos e o comparativo antes de qualquer alteração
                na Fonte Mestra.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-[#07132B] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sincronia Automática
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Ao confirmar, os valores propagam para a Calculadora IBS/CBS, Recuperador e
                Diagnóstico.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-[#07132B] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Teses Manuais
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                A seleção de teses do Recuperador de Créditos continua 100% manual e sob seu
                controle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação com Resumo Comparativo */}
      <ModalResumoImportacaoSped
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        resultado={resultadoParsing}
        itensInformativos={itensInformativos}
        onConfirmar={handleConfirmarResumo}
        salvando={salvandoConfirmacao}
      />
    </>
  )
}
