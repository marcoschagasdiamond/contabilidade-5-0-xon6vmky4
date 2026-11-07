import React from 'react'
import type { ClienteGlobalItem } from '@/types/master'
import { useState } from 'react'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SecaoAnotacoesCliente } from '@/components/admin/SecaoAnotacoesCliente'
import { SecaoTarefasCliente } from '@/components/admin/SecaoTarefasCliente'
import { SecaoHistoricoCliente } from '@/components/admin/SecaoHistoricoCliente'
import { ESTAGIOS_FUNIL_CRM, type EstagioFunilCrm } from '@/types/crm'
import { atualizarEstagioFunilCliente } from '@/services/crm'

interface ModalFichaClienteGlobalProps {
  cliente: ClienteGlobalItem | null
  aoFechar: () => void
  abaInicial?: 'dados' | 'historico' | 'anotacoes' | 'tarefas'
  onClienteAtualizado?: (
    clienteId: string,
    novoEstagio: EstagioFunilCrm,
    origem: 'clientes' | 'clientes_empresas',
  ) => void
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function ModalFichaClienteGlobal({
  cliente,
  aoFechar,
  abaInicial = 'dados',
  onClienteAtualizado,
  onFeedback,
}: ModalFichaClienteGlobalProps) {
  const [abaInterna, setAbaInterna] = useState<'dados' | 'historico' | 'anotacoes' | 'tarefas'>(
    abaInicial,
  )

  // Atualiza se abaInicial mudar externamente
  React.useEffect(() => {
    if (abaInicial) setAbaInterna(abaInicial)
  }, [abaInicial, cliente?.id])
  const [salvandoEstagio, setSalvandoEstagio] = useState(false)

  if (!cliente) return null

  const handleMudarEstagio = async (novoEstagio: EstagioFunilCrm) => {
    if (cliente.estagio_funil === novoEstagio || salvandoEstagio) return
    setSalvandoEstagio(true)
    try {
      await atualizarEstagioFunilCliente({
        clienteId: cliente.id,
        collectionOrigem: cliente.collection_origem,
        estagio: novoEstagio,
      })
      cliente.estagio_funil = novoEstagio
      if (onClienteAtualizado) {
        onClienteAtualizado(cliente.id, novoEstagio, cliente.collection_origem)
      }
      if (onFeedback) {
        const estagioObj = ESTAGIOS_FUNIL_CRM.find((e) => e.id === novoEstagio)
        onFeedback({
          tipo: 'sucesso',
          mensagem: `Estágio atualizado para "${estagioObj?.rotulo || novoEstagio}".`,
        })
      }
    } catch (err) {
      console.error('Erro ao atualizar estágio do cliente na ficha:', err)
      if (onFeedback) {
        onFeedback({
          tipo: 'erro',
          mensagem: 'Erro ao atualizar estágio de funil.',
        })
      }
    } finally {
      setSalvandoEstagio(false)
    }
  }

  return (
    <Dialog open={!!cliente} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="sm:max-w-3xl bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
              Ficha Completa & CRM • Visão Master
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#07132B] text-white">
                {cliente.origem_tipo === 'analista' ? 'Via Analista Parceiro' : 'Cadastro Direto'}
              </span>
            </div>
          </div>
          <DialogTitle className="font-heading font-bold text-2xl text-[#07132B] mt-2">
            {cliente.nome || cliente.empresa}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            CNPJ/CPF: {cliente.cnpj_cpf || 'Não informado'} • Registrado em{' '}
            {cliente.created ? new Date(cliente.created).toLocaleDateString('pt-BR') : '—'}
          </DialogDescription>

          {/* CONTROLE DE ESTÁGIO DE FUNIL CRM */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Estágio do Funil (CRM)
              </span>
              <span className="text-xs text-slate-700">
                {cliente.funil_atualizado_em
                  ? `Atualizado em ${new Date(cliente.funil_atualizado_em).toLocaleDateString('pt-BR')}${
                      cliente.funil_atualizado_por_nome
                        ? ` por ${cliente.funil_atualizado_por_nome}`
                        : ''
                    }`
                  : 'Defina o estágio comercial deste cliente'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                disabled={salvandoEstagio}
                value={cliente.estagio_funil || 'lead'}
                onChange={(e) => handleMudarEstagio(e.target.value as EstagioFunilCrm)}
                className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {ESTAGIOS_FUNIL_CRM.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.rotulo} — {e.subtitulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NAVEGAÇÃO DE SUB-ABAS DA FICHA */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAbaInterna('dados')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                abaInterna === 'dados'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dados Gerais
            </button>
            <button
              type="button"
              onClick={() => setAbaInterna('historico')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                abaInterna === 'historico'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              Histórico de Alterações
            </button>
            <button
              type="button"
              onClick={() => setAbaInterna('anotacoes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                abaInterna === 'anotacoes'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Anotações CRM
            </button>
            <button
              type="button"
              onClick={() => setAbaInterna('tarefas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                abaInterna === 'tarefas'
                  ? 'bg-[#07132B] text-[#D4AF37]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tarefas CRM
            </button>
          </div>
        </DialogHeader>

        {/* CONTEÚDO DAS SUB-ABAS */}
        {abaInterna === 'historico' && (
          <div className="my-4">
            <SecaoHistoricoCliente cliente={cliente} />
          </div>
        )}

        {abaInterna === 'dados' && (
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
              <h4 className="font-heading font-bold text-sm text-[#07132B] mb-3">
                Contatos Diretos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-xs block">E-mail:</span>
                  <span className="font-mono text-slate-800">
                    {cliente.email || 'Não informado'}
                  </span>
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
                  <p
                    className="font-heading font-extrabold text-3xl text-white mt-1"
                    title={
                      !cliente.total_diagnosticos || cliente.total_diagnosticos <= 0
                        ? 'Sem diagnóstico vinculado a este cliente. O diagnóstico pode ter sido salvo sem um Cliente Ativo selecionado (registro órfão), por isso não aparece nesta contagem.'
                        : undefined
                    }
                  >
                    {cliente.total_diagnosticos}
                  </p>
                  <span
                    className="text-[11px] text-slate-300 mt-1 block"
                    title="Sem diagnóstico vinculado a este cliente. O diagnóstico pode ter sido salvo sem um Cliente Ativo selecionado (registro órfão), por isso não aparece nesta contagem."
                  >
                    {cliente.ultimo_diagnostico_data
                      ? `Último em: ${new Date(cliente.ultimo_diagnostico_data).toLocaleDateString('pt-BR')}`
                      : 'Sem diagnóstico vinculado a este cliente'}
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
        )}

        {abaInterna === 'anotacoes' && (
          <div className="my-4">
            <SecaoAnotacoesCliente
              clienteId={cliente.id}
              collectionOrigem={cliente.collection_origem}
              onFeedback={onFeedback}
            />
          </div>
        )}

        {abaInterna === 'tarefas' && (
          <div className="my-4">
            <SecaoTarefasCliente
              clienteId={cliente.id}
              collectionOrigem={cliente.collection_origem}
              onFeedback={onFeedback}
            />
          </div>
        )}

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
