import React, { useState } from 'react'
import type { EstagioPipelineLead, LeadProcessado, TipoInteracaoLead } from '@/types/pipelineLead'
import { ESTAGIOS_PIPELINE_LEAD } from '@/types/pipelineLead'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { TimelineLead } from './TimelineLead'
import { Button } from '@/components/ui/button'

interface ModalFichaLeadPipelineProps {
  lead: LeadProcessado | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMudarEstagio: (leadId: string, novoEstagio: EstagioPipelineLead) => Promise<void>
  onAdicionarInteracao: (
    leadId: string,
    dados: {
      tipo: TipoInteracaoLead
      descricao: string
      proximoPasso?: string
      dataProximoPasso?: string
    },
  ) => Promise<void>
}

export function ModalFichaLeadPipeline({
  lead,
  open,
  onOpenChange,
  onMudarEstagio,
  onAdicionarInteracao,
}: ModalFichaLeadPipelineProps) {
  const [mudandoEstagio, setMudandoEstagio] = useState(false)

  if (!lead) return null

  const handleMudarEstagio = async (novo: EstagioPipelineLead) => {
    if (novo === lead.estagio_pipeline) return
    setMudandoEstagio(true)
    try {
      await onMudarEstagio(lead.id, novo)
    } finally {
      setMudandoEstagio(false)
    }
  }

  const handleInteracao = async (dados: {
    tipo: TipoInteracaoLead
    descricao: string
    proximoPasso?: string
    dataProximoPasso?: string
  }) => {
    await onAdicionarInteracao(lead.id, dados)
  }

  const telClean = lead.telefone ? lead.telefone.replace(/\D/g, '') : ''
  const whatsappUrl = telClean ? `https://wa.me/55${telClean}` : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                Score: {lead.score} pts
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                Origem: {lead.fonte}
              </span>
              {lead.isQuenteEsquecido && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white animate-pulse">
                  🔥 Lead Quente Esquecido
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              Criado em:{' '}
              {lead.created
                ? new Date(lead.created).toLocaleDateString('pt-BR')
                : 'Data não informada'}
            </span>
          </div>

          <DialogTitle className="font-heading font-extrabold text-xl text-[#07132B]">
            {lead.nome}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {lead.empresa || 'Empresa não informada'} • Segmento: {lead.segmento} • Porte:{' '}
            {lead.funcionarios} func.
          </DialogDescription>
        </DialogHeader>

        {/* CONTROLES RÁPIDOS DE CONTATO E ESTÁGIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
              Mudar Estágio do Pipeline
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {ESTAGIOS_PIPELINE_LEAD.map((est) => {
                const ativo = lead.estagio_pipeline === est.id
                return (
                  <button
                    key={est.id}
                    type="button"
                    disabled={mudandoEstagio}
                    onClick={() => handleMudarEstagio(est.id)}
                    className={`text-xs font-bold py-1.5 px-2 rounded-xl transition-all border text-left ${
                      ativo
                        ? `${est.corHeaderBg} border-current shadow-xs`
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {est.rotulo}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
                Canais de Contato
              </span>
              <div className="space-y-1 text-xs">
                <p className="text-slate-700">
                  <strong>E-mail:</strong>{' '}
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    'Não informado'
                  )}
                </p>
                <p className="text-slate-700">
                  <strong>Telefone:</strong> {lead.telefone || 'Não informado'}
                </p>
                {lead.cnpj && (
                  <p className="text-slate-700">
                    <strong>CNPJ:</strong> {lead.cnpj}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              {whatsappUrl && (
                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl flex-1"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    Conversar via WhatsApp
                  </a>
                </Button>
              )}
              {lead.email && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="text-xs h-8 rounded-xl flex-1 border-slate-300"
                >
                  <a href={`mailto:${lead.email}`}>Enviar E-mail</a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* MENSAGEM OU DETALHES INICIAIS */}
        {lead.mensagem && (
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-extrabold uppercase text-amber-900 block mb-1">
              Mensagem ou Contexto do Formulário
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-wrap">{lead.mensagem}</p>
          </div>
        )}

        {/* TIMELINE DE INTERAÇÕES */}
        <div className="pt-2">
          <TimelineLead lead={lead} onAdicionarInteracao={handleInteracao} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
