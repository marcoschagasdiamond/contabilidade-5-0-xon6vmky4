import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { NivelAcesso } from '@/types/master'
import { enviarConviteComNivel } from '@/services/master'

interface ModalEnviarConviteNivelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nivelFixo?: NivelAcesso
  isMaster: boolean
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de Envio de Convite por E-mail com Nível Pré-definido
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, SEM ÍCONES na UI.
 * Gera token exclusivo na coleção 'convites_clientes' com o nível pré-determinado
 * (administrador, analista ou empresário) e dispara e-mail com link direto.
 */
export function ModalEnviarConviteNivel({
  open,
  onOpenChange,
  nivelFixo,
  isMaster,
  onSucesso,
  onErro,
}: ModalEnviarConviteNivelProps) {
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [nivel, setNivel] = useState<NivelAcesso>(nivelFixo || 'analista')
  const [enviando, setEnviando] = useState(false)
  const [feedbackLocal, setFeedbackLocal] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  React.useEffect(() => {
    if (nivelFixo) {
      setNivel(nivelFixo)
    }
  }, [nivelFixo, open])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackLocal(null)

    if (!email.trim() || !email.includes('@')) {
      setFeedbackLocal({ tipo: 'erro', texto: 'Informe um e-mail válido para o convite.' })
      return
    }

    if (nivel === 'admin' && !isMaster) {
      setFeedbackLocal({
        tipo: 'erro',
        texto: 'Apenas o Administrador Master pode convidar novos administradores.',
      })
      return
    }

    try {
      setEnviando(true)
      const res = await enviarConviteComNivel({
        email,
        nivel_convite: nivel,
        whatsapp,
        mensagem,
      })

      if (res.success) {
        onSucesso(`Convite enviado com sucesso para "${email}" com nível pré-definido (${nivel}).`)
        onOpenChange(false)
        setEmail('')
        setWhatsapp('')
        setMensagem('')
      } else {
        setFeedbackLocal({
          tipo: 'erro',
          texto: res.error || 'Falha ao enviar convite por e-mail.',
        })
      }
    } catch (err: any) {
      setFeedbackLocal({
        tipo: 'erro',
        texto: err?.message || 'Erro inesperado ao enviar convite.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const nivelTitulo =
    nivel === 'admin'
      ? 'Administrador'
      : nivel === 'analista'
        ? 'Analista & Parceiro'
        : 'Empresário / Cliente'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#07132B] px-2.5 py-0.5 rounded">
              Diamond Group • Convite Formal
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
            Enviar Convite para {nivelTitulo}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            A pessoa receberá um link exclusivo com token seguro que a guiará ao cadastro oficial já
            com o nível e os acessos vinculados.
          </DialogDescription>
        </DialogHeader>

        {feedbackLocal && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              feedbackLocal.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedbackLocal.texto}
          </div>
        )}

        <form onSubmit={handleEnviar} className="space-y-4 my-2 text-xs">
          {!nivelFixo && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Nível Pré-definido *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!isMaster}
                  onClick={() => setNivel('admin')}
                  className={`p-2.5 rounded-xl border text-left font-heading text-xs transition-all ${
                    nivel === 'admin'
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] font-bold shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 disabled:opacity-40'
                  }`}
                >
                  <span className="block font-bold">Administrador</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {isMaster ? 'Exclusivo Master' : 'Restrito'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNivel('analista')}
                  className={`p-2.5 rounded-xl border text-left font-heading text-xs transition-all ${
                    nivel === 'analista'
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] font-bold shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold">Analista</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Carteira e Clientes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNivel('empresario')}
                  className={`p-2.5 rounded-xl border text-left font-heading text-xs transition-all ${
                    nivel === 'empresario'
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] font-bold shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-bold">Empresário</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Cliente final</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="convite-email" className="text-xs font-bold text-slate-700 block mb-1">
              E-mail de Destino do Convidado *
            </Label>
            <input
              id="convite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="destinatario@empresa.com.br"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <div>
            <Label htmlFor="convite-whats" className="text-xs font-bold text-slate-700 block mb-1">
              WhatsApp / Telefone (Opcional)
            </Label>
            <input
              id="convite-whats"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <div>
            <Label htmlFor="convite-msg" className="text-xs font-bold text-slate-700 block mb-1">
              Mensagem Personalizada no E-mail (Opcional)
            </Label>
            <textarea
              id="convite-msg"
              rows={3}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Ex.: Olá! Este é o convite oficial para você operar a plataforma Contabilidade 5.0..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={enviando}
              className="text-xs border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={enviando}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#07132B]/90 text-[#D4AF37] border border-[#D4AF37]/50 shadow-md"
            >
              {enviando ? 'Enviando Convite...' : 'Enviar Convite por E-mail'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
