import React from 'react'
import { Button } from '@/components/ui/button'

export interface BarraAcoesSimulacaoProps {
  onSalvar: () => void
  onBaixarPdf: () => void
  onExportarDados?: () => void
  onImportarFaturamento?: () => void
  gerandoPdf?: boolean
  /**
   * Quando true, no mobile a barra fica fixa no rodapé (sticky bottom-0 z-30),
   * acompanhando a rolagem, e em telas médias/grandes comporta-se como bloco normal.
   */
  stickyMobile?: boolean
  className?: string
}

/**
 * Barra de Ações Estratégicas da Simulação (Diamond Group)
 * Apresenta os botões: 'Exportar dados', 'Salvar Simulação' e 'Gerar parecer da calculadora'
 * Padrão visual Diamond Group: Navy #07132B / Dourado #D4AF37, SEM ÍCONES,
 * executando as mesmas validações e ações dos botões superiores.
 */
export function BarraAcoesSimulacao({
  onSalvar,
  onBaixarPdf,
  onExportarDados,
  onImportarFaturamento,
  gerandoPdf = false,
  stickyMobile = false,
  className = '',
}: BarraAcoesSimulacaoProps) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0d1d3d] to-[#07132B] border border-[#D4AF37]/40 p-4 sm:p-5 shadow-lg ${
        stickyMobile
          ? 'sticky bottom-3 z-30 sm:static sm:bottom-auto backdrop-blur-md bg-opacity-95'
          : ''
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37] block">
            Ações Rápidas do Cenário
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Grave este resultado na sua conta ou emita o relatório técnico oficial em PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 justify-center">
          {/* Botão Importar faturamento: Fundo Navy com borda Dourada, sem ícones */}
          {onImportarFaturamento && (
            <Button
              type="button"
              onClick={onImportarFaturamento}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-[#07132B] hover:bg-[#0f244c] text-[#D4AF37] border border-[#D4AF37] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Importar faturamento a partir de planilha CSV/XLSX ou conexão com Google Sheets / Excel"
            >
              Importar faturamento
            </Button>
          )}

          {/* Botão Exportar dados: Fundo Navy com borda Dourada, sem ícones */}
          {onExportarDados && (
            <Button
              type="button"
              onClick={onExportarDados}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-[#07132B] hover:bg-[#0f244c] text-white border border-[#D4AF37]/60 font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Exportar planilha (CSV/Excel) e relatório completo dos parâmetros e resultados"
            >
              Exportar dados
            </Button>
          )}

          {/* Botão Salvar Simulação: Fundo Dourado #D4AF37, texto Navy #07132B, sem ícones */}
          <Button
            type="button"
            onClick={onSalvar}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-[#D4AF37]"
            title="Salvar esta simulação na sua conta"
          >
            Salvar Simulação
          </Button>

          {/* Botão Gerar Parecer da Calculadora: Navy #07132B com borda e realce Dourado #D4AF37, sem ícones */}
          <Button
            type="button"
            onClick={onBaixarPdf}
            disabled={gerandoPdf}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-xl bg-[#07132B] hover:bg-[#0c1e40] text-[#D4AF37] hover:text-white border-2 border-[#D4AF37] font-extrabold text-xs tracking-wide shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            title="Gerar parecer da calculadora em PDF com a memória de cálculo"
          >
            {gerandoPdf ? 'Gerando Parecer...' : 'Gerar parecer da calculadora'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BarraAcoesSimulacao
