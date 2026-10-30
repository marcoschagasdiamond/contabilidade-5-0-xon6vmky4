import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { criarInteracaoCrm } from '@/services/crm'
import type { TipoInteracaoCrm, CrmInteracaoRecord } from '@/types/crm'

interface ModalRegistrarInteracaoProps {
  aberto: boolean
  aoFechar: () => void
  crmClienteId: string
  aoSalvarSucesso: (nova: CrmInteracaoRecord) => void
}

export function ModalRegistrarInteracao({
  aberto,
  aoFechar,
  crmClienteId,
  aoSalvarSucesso,
}: ModalRegistrarInteracaoProps) {
  const { toast } = useToast()

  const [tipo, setTipo] = useState<TipoInteracaoCrm>('whatsapp')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [resumo, setResumo] = useState('')
  const [proximoPasso, setProximoPasso] = useState('')
  const [dataProximoPasso, setDataProximoPasso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumo.trim()) {
      toast({
        title: 'Resumo obrigatório',
        description: 'Descreva os pontos principais da interação.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      const nova = await criarInteracaoCrm({
        crm_cliente_id: crmClienteId,
        tipo,
        data,
        resumo: resumo.trim(),
        proximo_passo: proximoPasso.trim() || undefined,
        data_proximo_passo: dataProximoPasso || undefined,
      })

      toast({
        title: 'Interação Registrada!',
        description: 'Histórico e próximo passo adicionados à timeline do cliente.',
      })

      aoSalvarSucesso(nova)
      setResumo('')
      setProximoPasso('')
      setDataProximoPasso('')
      aoFechar()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar interação',
        description: err?.message || 'Falha ao salvar interação.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left border-b border-slate-100 pb-4">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] w-fit">
            CRM • Timeline
          </span>
          <DialogTitle className="font-heading font-extrabold text-2xl text-[#07132B]">
            Registrar Interação com o Cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            Mantenha o histórico comercial vivo. Registre ligações, e-mails, conversas por WhatsApp
            ou reuniões realizadas e defina o próximo passo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Canal / Tipo *</Label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoInteracaoCrm)}
                className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-white text-slate-800"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="reuniao">Reunião Presencial / Online</option>
                <option value="telefone">Ligação Telefônica</option>
                <option value="email">E-mail</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Data da Interação *</Label>
              <Input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Resumo da Conversa *</Label>
            <Textarea
              rows={3}
              required
              placeholder="Ex: Alinhamento sobre transição para Lucro Presumido, cliente solicitou simulação com split payment..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="text-xs rounded-xl border-slate-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Próximo Passo / Ação</Label>
              <Input
                placeholder="Ex: Enviar proposta revisada"
                value={proximoPasso}
                onChange={(e) => setProximoPasso(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Data do Próximo Passo</Label>
              <Input
                type="date"
                value={dataProximoPasso}
                onChange={(e) => setDataProximoPasso(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={aoFechar}
              disabled={salvando}
              className="text-xs font-bold border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] text-xs font-bold px-5 rounded-xl shadow-md"
            >
              {salvando ? 'Salvando...' : 'Salvar Interação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
