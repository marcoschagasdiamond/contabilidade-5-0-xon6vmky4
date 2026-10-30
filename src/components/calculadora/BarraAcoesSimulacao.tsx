import React from 'react'
import { Button } from '@/components/ui/button'

export interface BarraAcoesSimulacaoProps {
  onSalvar: () => void
  onBaixarPdf: () => void
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
 * Apresenta os dois botões: 'Salvar Simulação' e 'Baixar Relatório em PDF'
 * Padrão visual Diamond Group: Navy #07132B / Dourado #D4AF37, SEM ÍCONES,
 * executando as mesmas validações e ações dos botões superiores.
 */
export function BarraAcoesSimulacao({
  onSalvar,
  onBaixarPdf,
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

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-center">
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
