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
import { DadosEmpresaPerfil, OrigemCampoImportado } from '@/types/dadosEmpresa'
import { parseSpedConteudo, ResultadoParsingSped } from '@/lib/parseSpedFiscal'
import { BadgeProvenienciaCampo } from '@/components/diagnosticos/BadgeProvenienciaCampo'
import { parseBalanceteArquivo } from '@/lib/parseBalancete'
import {
  parseNfeXmlUnica,
  agregarLoteNfe,
  construirResultadoParsingLoteNfe,
  NotaFiscalExtraida,
  ErroImportacaoNfeItem,
  ResultadoParsingLoteNfe,
} from '@/lib/parseNfeLote'
import { extrairXmlsDeZip } from '@/lib/zipReader'
import { ModalResumoImportacaoSped } from './ModalResumoImportacaoSped'

interface SecaoImportacaoDocumentosFiscaisProps {
  perfilAtual: DadosEmpresaPerfil
  onConfirmarImportacao: (
    novosCampos: Partial<DadosEmpresaPerfil>,
    resultado: ResultadoParsingSped,
    resultadoNfe?: ResultadoParsingLoteNfe,
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
  const [resultadoNfe, setResultadoNfe] = useState<ResultadoParsingLoteNfe | null>(null)
  const [itensInformativos, setItensInformativos] = useState<
    { rotulo: string; valor: number; descricao: string }[]
  >([])
  const [modalAberto, setModalAberto] = useState(false)
  const [salvandoConfirmacao, setSalvandoConfirmacao] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isNfeXml = (nome: string) => nome.toLowerCase().endsWith('.xml')
  const isZip = (nome: string) => nome.toLowerCase().endsWith('.zip')

  // Processa lote de NF-e em XML (arquivos soltos e/ou ZIPs com XMLs internos).
  // XML corrompido vira erro item a item — nunca aborta o lote inteiro.
  const processarLoteNfe = async (arquivos: File[]) => {
    const notas: NotaFiscalExtraida[] = []
    const erros: ErroImportacaoNfeItem[] = []

    for (const file of arquivos) {
      try {
        if (isNfeXml(file.name)) {
          const texto = await file.text()
          const nota = parseNfeXmlUnica(texto, file.name)
          notas.push(nota)
        } else if (isZip(file.name)) {
          const buffer = await file.arrayBuffer()
          const entradas = await extrairXmlsDeZip(buffer)
          for (const entrada of entradas) {
            try {
              const nota = parseNfeXmlUnica(entrada.texto, entrada.nome)
              notas.push(nota)
            } catch (err: any) {
              erros.push({
                nomeArquivo: entrada.nome,
                motivo: err?.message || 'XML inválido ou corrompido dentro do ZIP.',
              })
            }
          }
        }
      } catch (err: any) {
        erros.push({
          nomeArquivo: file.name,
          motivo: err?.message || 'Falha ao ler o arquivo (XML ou ZIP corrompido).',
        })
      }
    }

    if (notas.length === 0) {
      setErroUpload(
        erros.length > 0
          ? `Nenhuma NF-e válida encontrada no lote. ${erros.length} arquivo(s) inválido(s): ${erros
              .slice(0, 3)
              .map((e) => `${e.nomeArquivo} (${e.motivo})`)
              .join('; ')}${erros.length > 3 ? '…' : ''}`
          : 'Nenhum XML de NF-e válido encontrado nos arquivos enviados. Verifique se os XMLs são notas fiscais eletrônicas (modelo 55 ou 65).',
      )
      setCarregando(false)
      return
    }

    const agregados = agregarLoteNfe(notas, erros, perfilAtual)
    const tamanhoTotal = arquivos.reduce((acc, f) => acc + f.size, 0)
    const nomeLote =
      arquivos.length === 1 ? arquivos[0].name : `${arquivos.length} arquivo(s) de NF-e`

    const resultadoLote = construirResultadoParsingLoteNfe(
      agregados,
      notas,
      nomeLote,
      tamanhoTotal,
      perfilAtual,
    )

    setResultadoParsing(resultadoLote)
    setResultadoNfe(resultadoLote)
    setModalAberto(true)
  }

  const processarArquivo = async (file: File) => {
    setErroUpload(null)
    setItensInformativos([])

    const nome = file.name.toLowerCase()
    const extensao = nome.split('.').pop() || ''

    const isTxtOuSped = extensao === 'txt' || extensao === 'sped' || file.type.includes('text')
    const isPlanilhaBalancete = extensao === 'xlsx' || extensao === 'csv' || extensao === 'xls'

    if (!isTxtOuSped && !isPlanilhaBalancete && !isNfeXml(file.name) && !isZip(file.name)) {
      setErroUpload(
        'Formato não suportado. Por favor envie escrituração EFD (.TXT), Balancete Contábil (.CSV / .XLSX), NF-e (.XML) ou lote de notas (.ZIP).',
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
      if (isNfeXml(file.name) || isZip(file.name)) {
        await processarLoteNfe([file])
        return
      }

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

        // Converte para formato compatível com ResultadoParsingSped, incluindo agregados contábeis
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
          agregadosContabeis: {
            ativoTotal: resBalancete.detalhesBalancete.ativoTotal,
            passivoTotal: resBalancete.detalhesBalancete.passivoTotal,
            patrimonioLiquido: resBalancete.detalhesBalancete.patrimonioLiquido,
            cmvCsp: resBalancete.detalhesBalancete.custosMercadoriasServicos,
            lucroLiquido: resBalancete.detalhesBalancete.lucroLiquidoPeriodo,
            receitaBruta: resBalancete.detalhesBalancete.receitaBrutaPeriodo,
            despesasOperacionais: resBalancete.detalhesBalancete.despesasComCreditoPeriodo,
          },
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
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const temNfe = files.some((f) => isNfeXml(f.name) || isZip(f.name))
    if (temNfe) {
      setErroUpload(null)
      setItensInformativos([])
      setCarregando(true)
      processarLoteNfe(files)
        .catch((err: any) => {
          console.error('Erro ao processar lote de NF-e:', err)
          setErroUpload(
            err?.message ||
              'Erro ao processar o lote de notas fiscais. Verifique os arquivos e tente novamente.',
          )
        })
        .finally(() => {
          setCarregando(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        })
      return
    }

    // Fluxo de arquivo único existente (SPED/Balancete)
    processarArquivo(files[0])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled || carregando) return

    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return

    const temNfe = files.some((f) => isNfeXml(f.name) || isZip(f.name))
    if (temNfe) {
      setErroUpload(null)
      setItensInformativos([])
      setCarregando(true)
      processarLoteNfe(files)
        .catch((err: any) => {
          console.error('Erro ao processar lote de NF-e (drag & drop):', err)
          setErroUpload(
            err?.message ||
              'Erro ao processar o lote de notas fiscais. Verifique os arquivos e tente novamente.',
          )
        })
        .finally(() => {
          setCarregando(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        })
      return
    }

    processarArquivo(files[0])
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
      await onConfirmarImportacao(
        resultadoParsing.camposSugeridos,
        resultadoParsing,
        resultadoNfe || undefined,
      )
      setModalAberto(false)
      setResultadoParsing(null)
      setResultadoNfe(null)
    } catch (err) {
      console.error('Erro ao confirmar importação:', err)
    } finally {
      setSalvandoConfirmacao(false)
    }
  }

  const docImportadoAnterior = perfilAtual.documentoFiscalImportado

  // IBS/CBS (integração antecipada): monta a lista dos 4 campos preenchidos apenas
  // quando o documento importado trouxe o grupo IBSCBS; origemCampos dá o badge de proveniência
  const camposIbsCbsComOrigem: {
    chave: string
    rotulo: string
    valorFormatado?: string
    valorOriginal?: string
    origem?: OrigemCampoImportado
  }[] = []
  if (docImportadoAnterior?.totaisFiscais) {
    const tf = docImportadoAnterior.totaisFiscais
    const origemCamposIbs = docImportadoAnterior.origemCampos || {}
    const fmtMoedaIbs = (v?: number) =>
      (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    if (tf.ibsDestacado !== undefined) {
      camposIbsCbsComOrigem.push({
        chave: 'ibsDestacado',
        rotulo: 'IBS Destacado (Total)',
        valorFormatado:
          origemCamposIbs.ibsDestacado?.valorFormatado || fmtMoedaIbs(tf.ibsDestacado),
        origem: origemCamposIbs.ibsDestacado,
      })
    }
    if (tf.cbsDestacado !== undefined) {
      camposIbsCbsComOrigem.push({
        chave: 'cbsDestacado',
        rotulo: 'CBS Destacada (Total)',
        valorFormatado:
          origemCamposIbs.cbsDestacado?.valorFormatado || fmtMoedaIbs(tf.cbsDestacado),
        origem: origemCamposIbs.cbsDestacado,
      })
    }
    if (tf.cstCClassTrib) {
      camposIbsCbsComOrigem.push({
        chave: 'cstCClassTrib',
        rotulo: 'CST / cClassTrib IBS-CBS',
        valorFormatado: origemCamposIbs.cstCClassTrib?.valorFormatado || tf.cstCClassTrib,
        origem: origemCamposIbs.cstCClassTrib,
      })
    }
    if (tf.creditoIbsCbsApurado !== undefined) {
      camposIbsCbsComOrigem.push({
        chave: 'creditoIbsCbsApurado',
        rotulo: 'Crédito IBS/CBS Apurado',
        valorFormatado:
          origemCamposIbs.creditoIbsCbsApurado?.valorFormatado ||
          fmtMoedaIbs(tf.creditoIbsCbsApurado),
        origem: origemCamposIbs.creditoIbsCbsApurado,
      })
    }
  }

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
              <strong>EFD ICMS/IPI</strong>, <strong>Balancete Contábil (CSV/XLSX)</strong> ou{' '}
              <strong>Notas Fiscais Eletrônicas (XMLs ou ZIP de lote)</strong> para preencher
              automaticamente receitas, despesas geradoras de crédito, folha, insumos energéticos,
              intangíveis, imobilizado, filiais e o consolidado de NCMs na Fonte Mestra.
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
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col gap-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  className="text-xs font-semibold bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shrink-0 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Importar Outro Período
                </Button>
              </div>

              {/* IBS/CBS (integração antecipada): só aparece quando o documento importado trouxe os valores */}
              {camposIbsCbsComOrigem.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 text-xs w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#07132B] uppercase tracking-wide">
                      IBS / CBS do documento importado
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Grupo IBSCBS — Reforma Tributária
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {camposIbsCbsComOrigem.map((campo) => (
                      <div
                        key={campo.chave}
                        className="p-2.5 bg-white rounded-lg border border-slate-200/90 flex flex-col gap-1"
                      >
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {campo.rotulo}
                        </span>
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-mono font-bold text-[#07132B]">
                            {campo.valorFormatado || campo.valorOriginal}
                          </span>
                          <BadgeProvenienciaCampo origem={campo.origem} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              multiple
              accept=".txt,.sped,.csv,.xlsx,.xls,.xml,.zip,text/plain,application/xml,text/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/zip"
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
                    ? 'Lendo e analisando contas, movimentações e notas fiscais...'
                    : 'Arraste seu SPED, Balancete, NF-e (.XML) ou lote (.ZIP) aqui ou clique para selecionar'}
                </h4>
                <p className="text-xs text-slate-500">
                  Aceita <strong>EFD Contribuições</strong>, <strong>EFD ICMS/IPI</strong> (.TXT),{' '}
                  <strong>Balancete Contábil</strong> (.CSV ou .XLSX), <strong>NF-e</strong> (.XML,
                  vários arquivos) e <strong>Lote de Notas</strong> (.ZIP).
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
                  className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                >
                  NF-e (.XML) / Lote (.ZIP)
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
                Você visualiza todos os campos extraídos, os NCMs consolidados e os erros por
                arquivo antes de qualquer alteração na Fonte Mestra.
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
        resultadoNfe={resultadoNfe}
        itensInformativos={itensInformativos}
        onConfirmar={handleConfirmarResumo}
        salvando={salvandoConfirmacao}
      />
    </>
  )
}
