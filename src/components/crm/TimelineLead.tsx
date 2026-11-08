import React, { useState } from 'react'
import type { LeadProcessado, TipoInteracaoLead } from '@/types/pipelineLead'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TimelineLeadProps {
  lead: LeadProcessado
  onAdicionarInteracao: (dados: {
    tipo: TipoInteracaoLead
    descricao: string
    proximoPasso?: string
    dataProximoPasso?: string
  }) => Promise<void>
}

export function TimelineLead({ lead, onAdicionarInteracao }: TimelineLeadProps) {
  const [novoTipo, setNovoTipo] = useState<TipoInteracaoLead>('whatsapp')
  const [descricao, setDescricao] = useState('')
  const [proximoPasso, setProximoPasso] = useState('')
  const [dataProximoPasso, setDataProximoPasso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [formAberto, setFormAberto] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) return

    setSalvando(true)
    try {
      await onAdicionarInteracao({
        tipo: novoTipo,
        descricao: descricao.trim(),
        proximoPasso: proximoPasso.trim() || undefined,
        dataProximoPasso: dataProximoPasso || undefined,
      })
      setDescricao('')
      setProximoPasso('')
      setDataProximoPasso('')
      setFormAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  const getBadgeTipo = (tipo: TipoInteracaoLead) => {
    switch (tipo) {
      case 'whatsapp':
        return { label: 'WhatsApp', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      case 'telefone':
        return { label: 'Ligação', bg: 'bg-blue-100 text-blue-800 border-blue-300' }
      case 'email':
        return { label: 'E-mail', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
      case 'reuniao':
        return { label: 'Reunião', bg: 'bg-purple-100 text-purple-800 border-purple-300' }
      case 'sistema':
        return { label: 'Sistema / Evento', bg: 'bg-slate-100 text-slate-800 border-slate-300' }
      case 'nota':
      default:
        return { label: 'Nota Interna', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h4 className="font-heading font-extrabold text-sm text-[#07132B]">
            Timeline de Interações
          </h4>
          <p className="text-[11px] text-slate-500">
            {lead.interacoes.length} {lead.interacoes.length === 1 ? 'registro' : 'registros'} no
            histórico
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          onClick={() => setFormAberto(!formAberto)}
          className="bg-[#07132B] hover:bg-[#0c2452] text-[#D4AF37] font-bold text-xs h-8 px-3 rounded-xl shadow-xs"
        >
          {formAberto ? 'Fechar Formulário' : '+ Registrar Interação'}
        </Button>
      </div>

      {formAberto && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#07132B]">Nova Interação com o Lead</span>
            <span className="text-[10px] text-slate-400">
              Atualiza automaticamente o status ativo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Canal / Meio *</Label>
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value as TipoInteracaoLead)}
                className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-white text-slate-800"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="telefone">Ligação Telefônica</option>
                <option value="email">E-mail</option>
                <option value="reuniao">Reunião Online/Presencial</option>
                <option value="nota">Nota de Acompanhamento</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Data do Próximo Passo</Label>
              <Input
                type="date"
                value={dataProximoPasso}
                onChange={(e) => setDataProximoPasso(e.target.value)}
                className="h-9 text-xs rounded-xl border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Resumo da Conversa *</Label>
            <Textarea
              required
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que foi conversado, retorno do cliente ou proposta apresentada..."
              className="text-xs rounded-xl border-slate-300"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Próximo Passo / Ação Combinada
            </Label>
            <Input
              value={proximoPasso}
              onChange={(e) => setProximoPasso(e.target.value)}
              placeholder="Ex: Enviar proposta comercial até amanhã às 14h"
              className="h-9 text-xs rounded-xl border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormAberto(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !descricao.trim()}
              className="bg-[#07132B] hover:bg-[#0c2452] text-[#D4AF37] font-bold text-xs rounded-xl px-4"
            >
              {salvando ? 'Salvando...' : 'Salvar Interação'}
            </Button>
          </div>
        </form>
      )}

      {/* LISTA DE CARDS DA TIMELINE */}
      <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
        {lead.interacoes.map((item, index) => {
          const badge = getBadgeTipo(item.tipo)
          const dataFmt = item.data
            ? new Date(item.data).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Data não registrada'

          return (
            <div key={item.id || index} className="relative pl-9">
              <div className="absolute left-2.5 top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#07132B] border-2 border-white shadow-xs" />
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    {item.titulo && (
                      <span className="font-heading font-bold text-xs text-[#07132B]">
                        {item.titulo}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{dataFmt}</span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {item.descricao}
                </p>

                {(item.proximoPasso || item.autorNome) && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    {item.proximoPasso ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                        Próximo passo: {item.proximoPasso}{' '}
                        {item.dataProximoPasso &&
                          `(${new Date(item.dataProximoPasso).toLocaleDateString('pt-BR')})`}
                      </span>
                    ) : (
                      <span />
                    )}

                    {item.autorNome && (
                      <span className="text-slate-400 text-[10px]">
                        Por: <strong className="text-slate-600">{item.autorNome}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
