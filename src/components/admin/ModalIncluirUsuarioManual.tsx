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
import type { NivelAcesso, PermissaoMaster } from '@/types/master'
import { TODAS_PERMISSOES } from '@/types/master'
import { incluirUsuarioManual } from '@/services/master'

interface ModalIncluirUsuarioManualProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nivelFixo?: NivelAcesso
  isMaster: boolean
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de Inclusão Manual de Usuário
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, SEM ÍCONES na UI.
 * Permite que Master/Admin criem a conta diretamente sem cadastro público,
 * com envio de e-mail de definição de senha no primeiro acesso.
 */
export function ModalIncluirUsuarioManual({
  open,
  onOpenChange,
  nivelFixo,
  isMaster,
  onSucesso,
  onErro,
}: ModalIncluirUsuarioManualProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [nivel, setNivel] = useState<NivelAcesso>(nivelFixo || 'analista')
  const [permissoes, setPermissoes] = useState<PermissaoMaster[]>([
    'ver_clientes_globais',
    'gerenciar_usuarios',
  ])
  const [valorMensal, setValorMensal] = useState<number | ''>(347)
  const [salvando, setSalvando] = useState(false)
  const [feedbackLocal, setFeedbackLocal] = useState<{
    tipo: 'sucesso' | 'erro'
    texto: string
  } | null>(null)

  React.useEffect(() => {
    if (nivelFixo) {
      setNivel(nivelFixo)
    }
  }, [nivelFixo, open])

  const alternarPermissao = (perm: PermissaoMaster) => {
    if (permissoes.includes(perm)) {
      setPermissoes(permissoes.filter((p) => p !== perm))
    } else {
      setPermissoes([...permissoes, perm])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackLocal(null)

    if (!nome.trim() || !email.trim()) {
      setFeedbackLocal({ tipo: 'erro', texto: 'Informe o nome e o e-mail corporativo.' })
      return
    }

    if (nivel === 'admin' && !isMaster) {
      setFeedbackLocal({
        tipo: 'erro',
        texto:
          'Apenas o Administrador Master (Dr. Marco Chagas) tem autoridade para criar Administradores.',
      })
      return
    }

    try {
      setSalvando(true)
      const res = await incluirUsuarioManual({
        nome,
        email,
        whatsapp,
        nivel_acesso: nivel,
        permissoes_json: nivel === 'admin' ? permissoes : undefined,
        valor_mensal_personalizado:
          nivel === 'analista' && typeof valorMensal === 'number' ? valorMensal : undefined,
        status_operacao: 'autorizado',
      })

      if (res.success) {
        onSucesso(
          res.message ||
            `Usuário "${nome}" incluído com sucesso. Um e-mail foi disparado para definição da senha.`,
        )
        onOpenChange(false)
        setNome('')
        setEmail('')
        setWhatsapp('')
      } else {
        setFeedbackLocal({ tipo: 'erro', texto: res.error || 'Falha ao incluir usuário.' })
      }
    } catch (err: any) {
      setFeedbackLocal({ tipo: 'erro', texto: err?.message || 'Erro inesperado ao criar usuário.' })
    } finally {
      setSalvando(false)
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
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#07132B] px-2.5 py-0.5 rounded">
              Diamond Group • Inclusão Direta
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
            Incluir {nivelTitulo} Manualmente
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            A conta será criada com perfil oficial sem passar pelo cadastro público. Um e-mail será
            enviado para que o usuário defina sua senha no primeiro acesso.
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

        <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
          {/* Se não houver nivelFixo, permite alternar */}
          {!nivelFixo && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Nível de Acesso da Conta *
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
                    {isMaster ? 'Exclusivo Master' : 'Restrito ao Master'}
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

          {/* Nome Completo */}
          <div>
            <Label htmlFor="manual-nome" className="text-xs font-bold text-slate-700 block mb-1">
              Nome Completo *
            </Label>
            <input
              id="manual-nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Rodrigo Almeida Santos"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          {/* E-mail e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="manual-email" className="text-xs font-bold text-slate-700 block mb-1">
                E-mail Corporativo *
              </Label>
              <input
                id="manual-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@escritorio.com.br"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </div>
            <div>
              <Label
                htmlFor="manual-whatsapp"
                className="text-xs font-bold text-slate-700 block mb-1"
              >
                WhatsApp / Celular
              </Label>
              <input
                id="manual-whatsapp"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </div>
          </div>

          {/* Campos específicos se Administrador: Permissões marcadas na hora */}
          {nivel === 'admin' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] block">
                Permissões Designadas ao Administrador
              </span>
              <p className="text-[11px] text-slate-500">
                Selecione as funções que este administrador terá permissão de executar:
              </p>
              <div className="space-y-1.5 pt-1">
                {TODAS_PERMISSOES.map((p) => {
                  const check = permissoes.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={check}
                        onChange={() => alternarPermissao(p.id)}
                        className="mt-0.5 rounded text-[#07132B] focus:ring-[#D4AF37]"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{p.rotulo}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight">
                          {p.descricao}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Campos específicos se Analista: Valor mensal personalizado */}
          {nivel === 'analista' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#07132B]">
                  Controle Comercial da Conta (Plano Analista)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Padrão R$ 347/mês
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Você pode definir um valor mensal personalizado menor que a tabela padrão (ou manter
                R$ 347,00):
              </p>
              <div className="w-48">
                <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#D4AF37]">
                  <span className="px-3 text-xs font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={valorMensal}
                    onChange={(e) =>
                      setValorMensal(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full py-2 pr-3 text-xs text-slate-900 font-bold focus:outline-none"
                    placeholder="347"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                A operação do analista será iniciada com status <strong>Autorizado</strong>.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#07132B]/90 text-[#D4AF37] border border-[#D4AF37]/50 shadow-md"
            >
              {salvando ? 'Criando Conta...' : 'Confirmar & Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
