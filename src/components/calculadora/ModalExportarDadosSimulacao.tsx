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
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'

export interface ModalExportarDadosSimulacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dadosSimulacao: DadosParaExportacaoSimulacao | null
  titulo?: string
  descricao?: string
}

/**
 * Modal Unificado de Exportação de Dados da Simulação (Padrão Diamond Group, sem ícones)
 * Oferece as opções de:
 * 1) Planilha Completa (CSV/Excel) com todos os parâmetros, comparativo 4 regimes, split payment, estoque e transição 2026-2033
 * 2) Relatório Técnico Oficial em PDF (abre modal de preenchimento do Responsável Técnico com CRC)
 */
export function ModalExportarDadosSimulacao({
  open,
  onOpenChange,
  dadosSimulacao,
  titulo = 'Exportar Dados da Simulação',
  descricao = 'Selecione o formato desejado para exportar todos os parâmetros, cálculos e projeções da Reforma Tributária.',
}: ModalExportarDadosSimulacaoProps) {
  const { toast } = useToast()
  const [modalPdfAberto, setModalPdfAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [baixandoPlanilha, setBaixandoPlanilha] = useState(false)

  if (!dadosSimulacao) return null

  const handleExportarPlanilha = () => {
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

  const handleAbrirPdf = () => {
    setModalPdfAberto(true)
  }

  const handleConfirmarPdf = (dadosTecnico: ResponsavelTecnicoDados) => {
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
              {titulo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">{descricao}</DialogDescription>
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
                onClick={handleExportarPlanilha}
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
                onClick={handleAbrirPdf}
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
        onConfirmar={handleConfirmarPdf}
        gerando={gerandoPdf}
      />
    </>
  )
}
