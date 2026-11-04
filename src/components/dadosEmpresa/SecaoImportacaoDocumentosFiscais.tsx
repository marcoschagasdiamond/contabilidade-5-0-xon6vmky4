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
  const [modalAberto, setModalAberto] = useState(false)
  const [salvandoConfirmacao, setSalvandoConfirmacao] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = async (file: File) => {
    setErroUpload(null)

    // Valida extensão e tamanho máximo (100MB)
    const nome = file.name
    const isTxtOuSped =
      nome.toLowerCase().endsWith('.txt') ||
      nome.toLowerCase().endsWith('.sped') ||
      file.type.includes('text')

    if (!isTxtOuSped) {
      setErroUpload('Formato não suportado. Por favor envie um arquivo TXT de EFD/SPED.')
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

      setResultadoParsing(resultado)
      setModalAberto(true)
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
              Carregue a <strong>EFD Contribuições (SPED PIS/Cofins)</strong> ou{' '}
              <strong>EFD ICMS/IPI</strong> para preencher automaticamente perfil de insumos,
              monofásicos, % interestadual, % compras sem crédito, faturamento e filiais na Fonte
              Mestra.
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
              accept=".txt,.sped,text/plain"
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
                    ? 'Lendo e analisando linhas da escrituração...'
                    : 'Arraste seu arquivo SPED aqui ou clique para selecionar'}
                </h4>
                <p className="text-xs text-slate-500">
                  Aceita arquivos <strong>.TXT</strong> oficiais da EFD Contribuições ou EFD
                  ICMS/IPI.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-slate-600 border-slate-200"
                >
                  EFD Contribuições (PIS/Cofins)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-slate-600 border-slate-200"
                >
                  EFD ICMS/IPI (SPED Fiscal)
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
        onConfirmar={handleConfirmarResumo}
        salvando={salvandoConfirmacao}
      />
    </>
  )
}
