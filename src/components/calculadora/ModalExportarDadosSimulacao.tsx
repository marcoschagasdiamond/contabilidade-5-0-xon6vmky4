import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  type DadosParaExportacaoSimulacao,
  baixarPlanilhaCsvSimulacao,
} from '@/lib/exportacaoCalculadora'
import {
  type DadosParaExportacaoRecuperador,
  baixarPlanilhaCsvRecuperador,
} from '@/lib/exportacaoRecuperador'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

export interface ModalExportarDadosSimulacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dados da Calculadora IBS/CBS */
  dadosSimulacao?: DadosParaExportacaoSimulacao | null
  /** Dados do Recuperador de Créditos */
  dadosRecuperador?: DadosParaExportacaoRecuperador | null
  titulo?: string
  descricao?: string
  moduloOrigem?: 'calculadora' | 'recuperador'
}

/**
 * Modal Unificado de Exportação de Dados (Padrão Diamond Group, sem ícones)
 * Reutilizado tanto na Calculadora IBS/CBS quanto no Recuperador de Créditos Tributários.
 * Oferece as opções de:
 * 1) Planilha Completa (CSV/Excel pronta para Excel/Sheets com UTF-8 BOM e delimitador ';')
 * 2) Relatório Técnico Oficial em PDF (abre modal de preenchimento do Responsável Técnico com CRC)
 */
export function ModalExportarDadosSimulacao({
  open,
  onOpenChange,
  dadosSimulacao,
  dadosRecuperador,
  titulo,
  descricao,
  moduloOrigem,
}: ModalExportarDadosSimulacaoProps) {
  const { toast } = useToast()
  const [modalPdfAberto, setModalPdfAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [baixandoPlanilha, setBaixandoPlanilha] = useState(false)

  // Detecta automaticamente se o contexto é Recuperador ou Calculadora
  const isRecuperador =
    moduloOrigem === 'recuperador' || (Boolean(dadosRecuperador) && !dadosSimulacao)

  if (isRecuperador) {
    if (!dadosRecuperador) return null

    const tituloEfetivo = titulo || 'Exportar Dados do Recuperador de Créditos'
    const descricaoEfetiva =
      descricao ||
      'Selecione o formato desejado para exportar todos os parâmetros, créditos identificados por bloco de tributo, valores com correção SELIC, estoque e comparativo com IBS/CBS.'

    const handleExportarPlanilhaRecuperador = () => {
      try {
        setBaixandoPlanilha(true)
        baixarPlanilhaCsvRecuperador(dadosRecuperador)
        toast({
          title: 'Planilha exportada com sucesso!',
          description: `O arquivo CSV com todos os dados da análise "${dadosRecuperador.nomeAnalise}" foi baixado.`,
        })
        onOpenChange(false)
      } catch (err: any) {
        toast({
          title: 'Erro ao exportar planilha',
          description: err?.message || 'Falha ao compilar os dados para planilha.',
          variant: 'destructive',
        })
      } finally {
        setBaixandoPlanilha(false)
      }
    }

    const handleConfirmarPdfRecuperador = (dadosTecnico: ResponsavelTecnicoDados) => {
      try {
        setGerandoPdf(true)
        gerarParecerRecuperadorPDF({
          nomeAnalise: dadosRecuperador.nomeAnalise,
          parametros: dadosRecuperador.parametros,
          resultados: dadosRecuperador.resultados,
          clienteNome:
            dadosRecuperador.empresa || dadosRecuperador.parametros.configuracoes.empresa,
          empresa: dadosRecuperador.empresa || dadosRecuperador.parametros.configuracoes.empresa,
          cnpj: dadosRecuperador.cnpj || dadosRecuperador.parametros.configuracoes.cnpj,
          dataGeracao: dadosRecuperador.dataRegistro,
          responsavelTecnico: dadosTecnico,
          observacoesAnalista: dadosTecnico.observacoes,
        })
        toast({
          title: 'Parecer Técnico PDF gerado!',
          description: `O relatório da análise "${dadosRecuperador.nomeAnalise}" foi baixado.`,
        })
        setModalPdfAberto(false)
        onOpenChange(false)
      } catch (err: any) {
        toast({
          title: 'Erro ao gerar PDF',
          description: err?.message || 'Falha ao compilar o parecer técnico.',
          variant: 'destructive',
        })
      } finally {
        setGerandoPdf(false)
      }
    }

    const totalIntegral = dadosRecuperador.resultados.totalIntegralCorrigido
    const totalConservador = dadosRecuperador.resultados.totalConservadorCorrigido
    const empresaNome =
      dadosRecuperador.empresa ||
      dadosRecuperador.parametros.configuracoes.empresa ||
      'Empresa em Análise'
    const regimeEmpresa = dadosRecuperador.parametros.configuracoes.regimeAtual || 'Lucro Presumido'

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md border-slate-200">
            <DialogHeader>
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] w-fit">
                Diamond Group • Recuperação de Créditos 5.0
              </div>
              <DialogTitle className="text-base font-extrabold text-[#07132B] pt-1">
                {tituloEfetivo}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {descricaoEfetiva}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              {/* Resumo do Cenário do Recuperador */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-[#07132B] block truncate">
                  Cenário: {dadosRecuperador.nomeAnalise}
                </span>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Empresa: {empresaNome}</span>
                  <span>•</span>
                  <span>Regime: {regimeEmpresa}</span>
                  <span>•</span>
                  <span className="text-[#D4AF37] font-semibold font-mono">
                    Integral: {formatarMoeda(totalIntegral)}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    Conservador: {formatarMoeda(totalConservador)}
                  </span>
                </div>
              </div>

              {/* OPÇÃO 1: PLANILHA CSV/EXCEL */}
              <div className="p-4 rounded-xl border-2 border-[#D4AF37]/50 bg-gradient-to-br from-amber-50/30 via-white to-white hover:border-[#D4AF37] transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                    Planilha de Dados (CSV / Excel)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37] text-[#07132B] font-bold">
                    Completa
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Exporta todos os parâmetros da empresa (faturamento 60m, folha, colaboradores,
                  alíquotas e teses selecionadas), créditos identificados por tipo (PIS/COFINS,
                  Folha/Previdenciário, IRPJ/CSLL, outros), valores com correção SELIC, crédito de
                  estoque na transição e comparativo antes/depois com IBS/CBS em colunas tabuladas
                  compatíveis com Excel e Google Planilhas.
                </p>
                <Button
                  type="button"
                  onClick={handleExportarPlanilhaRecuperador}
                  disabled={baixandoPlanilha}
                  className="w-full h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {baixandoPlanilha ? 'Exportando Planilha...' : 'Baixar Planilha (CSV / Excel)'}
                </Button>
              </div>

              {/* OPÇÃO 2: RELATÓRIO TÉCNICO PDF */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#07132B]/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                    Parecer Técnico Oficial (PDF)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07132B] text-white font-semibold">
                    Oficial
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dossiê institucional diagramado no padrão executivo Diamond Group com parecer
                  técnico, quadro de teses com farol de risco, detalhamento ano a ano pela SELIC,
                  crédito de estoque na LC 214/2025 e termo de encerramento com CRC do responsável
                  contábil.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPdfAberto(true)}
                  className="w-full h-10 rounded-xl bg-[#07132B] hover:bg-[#0c1e40] text-[#D4AF37] hover:text-white border-2 border-[#D4AF37] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Gerar Relatório Técnico em PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL RESPONSÁVEL TÉCNICO (INCLUSÃO DE CRC E PARECER) */}
        <ModalGerarPdf
          open={modalPdfAberto}
          onOpenChange={setModalPdfAberto}
          titulo={`Emitir Parecer: "${dadosRecuperador.nomeAnalise}"`}
          descricao="Preencha os dados do Responsável Técnico para inclusão no cabeçalho e parecer do documento."
          modo="individual"
          onConfirmar={handleConfirmarPdfRecuperador}
          gerando={gerandoPdf}
        />
      </>
    )
  }

  // MODO CALCULADORA IBS / CBS (padrão mantido)
  if (!dadosSimulacao) return null

  const tituloEfetivo = titulo || 'Exportar Dados da Simulação'
  const descricaoEfetiva =
    descricao ||
    'Selecione o formato desejado para exportar todos os parâmetros, cálculos e projeções da Reforma Tributária.'

  const handleExportarPlanilhaCalculadora = () => {
    try {
      setBaixandoPlanilha(true)
      baixarPlanilhaCsvSimulacao(dadosSimulacao)
      toast({
        title: 'Planilha exportada com sucesso!',
        description: `O arquivo CSV com todos os dados da simulação "${dadosSimulacao.nomeSimulacao}" foi baixado.`,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar planilha',
        description: err?.message || 'Falha ao compilar os dados para planilha.',
        variant: 'destructive',
      })
    } finally {
      setBaixandoPlanilha(false)
    }
  }

  const handleConfirmarPdfCalculadora = (dadosTecnico: ResponsavelTecnicoDados) => {
    try {
      setGerandoPdf(true)
      gerarRelatorioSimulacaoPDF({
        nomeSimulacao: dadosSimulacao.nomeSimulacao,
        parametros: dadosSimulacao.parametros,
        resultados: dadosSimulacao.resultados,
        empresa: dadosSimulacao.empresa || dadosSimulacao.parametros.empresa,
        cnpj: dadosSimulacao.cnpj || dadosSimulacao.parametros.cnpj,
        clienteNome: dadosSimulacao.empresa,
        dataGeracao: dadosSimulacao.dataRegistro,
        responsavelTecnico: dadosTecnico,
        observacoesContador: dadosTecnico.observacoes,
      })
      toast({
        title: 'Relatório PDF gerado!',
        description: `O relatório da simulação "${dadosSimulacao.nomeSimulacao}" foi baixado.`,
      })
      setModalPdfAberto(false)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao compilar o relatório técnico.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-slate-200">
          <DialogHeader>
            <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] w-fit">
              Diamond Group • Motor Tributário 5.0
            </div>
            <DialogTitle className="text-base font-extrabold text-[#07132B] pt-1">
              {tituloEfetivo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {descricaoEfetiva}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Resumo do Cenário */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-[#07132B] block truncate">
                Cenário: {dadosSimulacao.nomeSimulacao}
              </span>
              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Empresa: {dadosSimulacao.empresa || 'Empresa em Simulação'}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">
                  Recomendado: {dadosSimulacao.resultados.resultadoDashboard.regimeRecomendado}
                </span>
              </div>
            </div>

            {/* OPÇÃO 1: PLANILHA CSV/EXCEL */}
            <div className="p-4 rounded-xl border-2 border-[#D4AF37]/50 bg-gradient-to-br from-amber-50/30 via-white to-white hover:border-[#D4AF37] transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                  Planilha de Dados (CSV / Excel)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37] text-[#07132B] font-bold">
                  Completa
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Exporta todos os parâmetros da operação (faturamento, compras, margem, alíquotas),
                resultados do Dashboard, matriz comparativa dos 4 regimes, detalhamento do Simples
                Nacional (LC 214/2025), simulador de créditos, cronograma de transição 2026–2033,
                crédito de estoque e split payment em colunas tabuladas compatíveis com Excel e
                Google Planilhas.
              </p>
              <Button
                type="button"
                onClick={handleExportarPlanilhaCalculadora}
                disabled={baixandoPlanilha}
                className="w-full h-10 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {baixandoPlanilha ? 'Exportando Planilha...' : 'Baixar Planilha (CSV / Excel)'}
              </Button>
            </div>

            {/* OPÇÃO 2: RELATÓRIO TÉCNICO PDF */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#07132B]/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#07132B]">
                  Relatório Técnico Executivo (PDF)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07132B] text-white font-semibold">
                  Oficial
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dossiê institucional diagramado no padrão executivo Diamond Group com parecer
                técnico, matriz comparativa, gráficos, legislação aplicável e bloco de assinatura
                com CRC do responsável contábil.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalPdfAberto(true)}
                className="w-full h-10 rounded-xl bg-[#07132B] hover:bg-[#0c1e40] text-[#D4AF37] hover:text-white border-2 border-[#D4AF37] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Gerar Relatório Técnico em PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL RESPONSÁVEL TÉCNICO (INCLUSÃO DE CRC E PARECER) */}
      <ModalGerarPdf
        open={modalPdfAberto}
        onOpenChange={setModalPdfAberto}
        titulo={`Emitir Relatório: "${dadosSimulacao.nomeSimulacao}"`}
        descricao="Preencha os dados do Responsável Técnico para inclusão no cabeçalho e parecer do documento."
        modo="individual"
        onConfirmar={handleConfirmarPdfCalculadora}
        gerando={gerandoPdf}
      />
    </>
  )
}
