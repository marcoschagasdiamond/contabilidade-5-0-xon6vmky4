import React from 'react'
import type { ClienteGlobalItem } from '@/types/master'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ModalFichaClienteGlobalProps {
  cliente: ClienteGlobalItem | null
  aoFechar: () => void
}

export function ModalFichaClienteGlobal({ cliente, aoFechar }: ModalFichaClienteGlobalProps) {
  if (!cliente) return null

  return (
    <Dialog open={!!cliente} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
              Ficha Completa • Visão Master
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#07132B] text-white">
              {cliente.origem_tipo === 'analista' ? 'Via Analista Parceiro' : 'Cadastro Direto'}
            </span>
          </div>
          <DialogTitle className="font-heading font-bold text-2xl text-[#07132B] mt-2">
            {cliente.nome || cliente.empresa}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            CNPJ/CPF: {cliente.cnpj_cpf || 'Não informado'} • Registrado em{' '}
            {cliente.created ? new Date(cliente.created).toLocaleDateString('pt-BR') : '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4 text-xs sm:text-sm">
          {/* BLOCO ORIGEM & ANALISTA */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
              Origem & Atribuição de Carteira
            </span>
            {cliente.origem_tipo === 'analista' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <span className="text-slate-500 block text-xs">Analista Responsável:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {cliente.analista_nome || 'Analista'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">E-mail do Analista:</span>
                  <span className="font-mono text-slate-700 text-xs">
                    {cliente.analista_email || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 text-xs mt-1">
                Cliente registrado diretamente pelo próprio empresário no portal da Contabilidade
                5.0, sem vínculo inicial a um analista parceiro.
              </p>
            )}
          </div>

          {/* DADOS CADASTRAIS */}
          <div>
            <h4 className="font-heading font-bold text-sm text-[#07132B] mb-3">
              Informações Cadastrais & Fiscais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">Segmento:</span>
                <span className="font-bold text-slate-800">{cliente.segmento}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">Regime Tributário Atual:</span>
                <span className="font-bold text-slate-800">{cliente.regime_atual}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">Localização:</span>
                <span className="font-bold text-slate-800">
                  {cliente.cidade ? `${cliente.cidade} / ` : ''}
                  {cliente.uf || 'SP'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">Faturamento Mensal:</span>
                <span className="font-bold text-slate-800">
                  {cliente.faturamento_mensal && cliente.faturamento_mensal > 0
                    ? formatarMoeda(cliente.faturamento_mensal)
                    : 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* CONTATOS */}
          <div>
            <h4 className="font-heading font-bold text-sm text-[#07132B] mb-3">Contatos Diretos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">E-mail:</span>
                <span className="font-mono text-slate-800">{cliente.email || 'Não informado'}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-xs block">Telefone / WhatsApp:</span>
                <span className="text-slate-800">{cliente.telefone || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* LAUDOS E SIMULAÇÕES */}
          <div>
            <h4 className="font-heading font-bold text-sm text-[#07132B] mb-3">
              Histórico na Plataforma
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#07132B] text-white">
                <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold block">
                  Diagnósticos Tributários
                </span>
                <p className="font-heading font-extrabold text-3xl text-white mt-1">
                  {cliente.total_diagnosticos}
                </p>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  {cliente.ultimo_diagnostico_data
                    ? `Último em: ${new Date(cliente.ultimo_diagnostico_data).toLocaleDateString('pt-BR')}`
                    : 'Nenhum diagnóstico gerado'}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Simulações IBS/CBS
                </span>
                <p className="font-heading font-extrabold text-3xl text-[#D4AF37] mt-1">
                  {cliente.total_simulacoes}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Cenários salvos na calculadora
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={aoFechar}
            className="px-5 py-2.5 rounded-xl bg-[#07132B] text-white text-xs font-bold hover:bg-[#07132B]/90 transition-colors"
          >
            Fechar Ficha
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
