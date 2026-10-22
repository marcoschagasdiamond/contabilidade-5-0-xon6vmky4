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
import { enviarConviteCliente, reenviarConviteCliente, ConviteCliente } from '@/services/planos'
import type { Cliente } from '@/types/cliente'

interface ModalConvidarClienteProps {
  aberto: boolean
  aoFechar: () => void
  cliente?: Cliente | null
  clientesDisponiveis?: Cliente[]
  aoConviteEnviado?: () => void
}

/**
 * Modal de Envio e Gestão de Convites para Clientes
 * Padrão visual Diamond Group (#07132B e #D4AF37) — REGRA ABSOLUTA: SEM ÍCONES.
 */
export function ModalConvidarCliente({
  aberto,
  aoFechar,
  cliente,
  clientesDisponiveis = [],
  aoConviteEnviado,
}: ModalConvidarClienteProps) {
  const { toast } = useToast()

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>(cliente?.id || '')
  const [email, setEmail] = useState<string>(cliente?.email || '')
  const [mensagem, setMensagem] = useState<string>(
    'Olá! Convidamos você a acessar o espaço exclusivo do empresário na plataforma Contabilidade 5.0 para acompanhar os diagnósticos e projeções da sua empresa sob a Reforma Tributária.',
  )
  const [enviando, setEnviando] = useState(false)
  const [conviteGeradoLink, setConviteGeradoLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Atualiza estados caso o cliente prop mude
  React.useEffect(() => {
    if (cliente) {
      setClienteSelecionadoId(cliente.id)
      setEmail(cliente.email || '')
    }
  }, [cliente])

  const clienteAtual =
    cliente || clientesDisponiveis.find((c) => c.id === clienteSelecionadoId) || null

  const handleClienteChange = (id: string) => {
    setClienteSelecionadoId(id)
    const sel = clientesDisponiveis.find((c) => c.id === id)
    if (sel && sel.email) {
      setEmail(sel.email)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um e-mail válido para enviar o convite.',
        variant: 'destructive',
      })
      return
    }

    setEnviando(true)
    try {
      const res = await enviarConviteCliente({
        email: email.trim(),
        cliente_id: clienteAtual?.id || '',
        cliente_nome: clienteAtual?.nome || '',
        mensagem: mensagem.trim(),
      })

      if (res.success) {
        toast({
          title: 'Convite Enviado com Sucesso!',
          description: `Um e-mail de acesso foi disparado para ${email}.`,
        })
        setConviteGeradoLink(res.link || null)
        if (aoConviteEnviado) aoConviteEnviado()
      } else {
        toast({
          title: 'Falha no envio',
          description: res.error || 'Não foi possível enviar o convite.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Erro de conexão',
        description: 'Falha ao comunicar com o servidor de convites.',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const copiarLink = () => {
    if (conviteGeradoLink) {
      navigator.clipboard.writeText(conviteGeradoLink)
      setCopiado(true)
      toast({
        title: 'Link copiado!',
        description: 'O link de cadastro foi copiado para a área de transferência.',
      })
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  const handleFecharModal = () => {
    setConviteGeradoLink(null)
    setCopiado(false)
    aoFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={handleFecharModal}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-2 text-left border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
              Fase 2 • Convites
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Perfil Empresário
            </span>
          </div>

          <DialogTitle className="font-heading font-extrabold text-2xl text-[#07132B]">
            Convidar Cliente para a Plataforma
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            Envie um convite formal por e-mail (usando o servidor SMTP nativo) para que o empresário
            acesse a Contabilidade 5.0. O cadastro criará a conta já com perfil{' '}
            <strong>Empresário</strong> e vinculada à sua carteira.
          </DialogDescription>
        </DialogHeader>

        {conviteGeradoLink ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
              <strong className="block font-bold text-sm text-emerald-950">
                Convite emitido e e-mail disparado!
              </strong>
              <p className="leading-relaxed">
                O convite foi enviado para <strong>{email}</strong>. Caso prefira enviar diretamente
                via WhatsApp ou mensagem interna, utilize o link de cadastro único abaixo:
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Link de Cadastro Exclusivo</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={conviteGeradoLink}
                  className="font-mono text-xs bg-slate-50 border-slate-300"
                />
                <Button
                  type="button"
                  onClick={copiarLink}
                  className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] text-xs font-bold shrink-0"
                >
                  {copiado ? 'Copiado!' : 'Copiar Link'}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Vínculo Automático:</span>
              <span>
                Ao se cadastrar por este link, o cliente terá acesso restrito de Empresário (sem
                Carteira/Clientes) e ficará permanentemente associado à sua carteira de analista.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFecharModal}
                className="text-xs font-bold border-slate-300 text-slate-700"
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* SELETOR DE CLIENTE (caso não venha pré-selecionado) */}
            {!cliente && clientesDisponiveis.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="cliente-select" className="text-xs font-bold text-slate-700">
                  Vincular a qual Empresa da sua Carteira? (Opcional)
                </Label>
                <select
                  id="cliente-select"
                  value={clienteSelecionadoId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="">Nenhuma empresa específica (vincular apenas ao analista)</option>
                  {clientesDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cnpj_cpf ? `(${c.cnpj_cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {cliente && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Empresa da Carteira
                  </span>
                  <span className="font-bold text-slate-900">{cliente.nome}</span>
                </div>
                {cliente.cnpj_cpf && (
                  <span className="text-[11px] font-mono text-slate-500">{cliente.cnpj_cpf}</span>
                )}
              </div>
            )}

            {/* CAMPO DE E-MAIL */}
            <div className="space-y-1.5">
              <Label htmlFor="email-convidado" className="text-xs font-bold text-slate-700">
                E-mail do Cliente / Empresário *
              </Label>
              <Input
                id="email-convidado"
                type="email"
                required
                placeholder="exemplo@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs rounded-xl border-slate-300 focus:ring-[#D4AF37]"
              />
            </div>

            {/* MENSAGEM OPCIONAL */}
            <div className="space-y-1.5">
              <Label htmlFor="mensagem-convidado" className="text-xs font-bold text-slate-700">
                Mensagem Personalizada do Analista (Opcional)
              </Label>
              <Textarea
                id="mensagem-convidado"
                rows={3}
                placeholder="Insira uma mensagem que acompanhará o e-mail..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="text-xs rounded-xl border-slate-300 focus:ring-[#D4AF37] resize-none"
              />
            </div>

            {/* AVISO DO PERFIL EMPRESÁRIO */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#07132B] uppercase tracking-wider text-[10px]">
                  Regras de Acesso do Convidado:
                </span>
                <span className="font-bold text-[#D4AF37]">Plano Empresário</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-3 list-disc">
                <li>O convidado cria a conta sem necessidade de pagamento (Modo Teste).</li>
                <li>Ele acessa apenas as simulações e diagnósticos da sua própria empresa.</li>
                <li>Recursos de Carteira, listagem de clientes e convites ficam bloqueados.</li>
              </ul>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFecharModal}
                className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] text-xs font-bold py-2.5 rounded-xl shadow-md"
              >
                {enviando ? 'Enviando Convite por E-mail...' : 'Disparar Convite por E-mail'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Tabela/Lista de Convites Pendentes & Reenvio
 * REGRA ABSOLUTA: SEM ÍCONES.
 */
export function ListaConvitesPendentes({
  convites,
  aoReenviarSucesso,
}: {
  convites: ConviteCliente[]
  aoReenviarSucesso?: () => void
}) {
  const { toast } = useToast()
  const [reenviandoId, setReenviandoId] = useState<string | null>(null)

  if (convites.length === 0) {
    return null
  }

  const handleReenviar = async (conviteId: string, email: string) => {
    setReenviandoId(conviteId)
    try {
      const res = await reenviarConviteCliente(conviteId)
      if (res.success) {
        toast({
          title: 'Convite Reenviado!',
          description: `Novo e-mail com link atualizado disparado para ${email}.`,
        })
        if (aoReenviarSucesso) aoReenviarSucesso()
      } else {
        toast({
          title: 'Erro ao reenviar',
          description: res.error || 'Falha ao reenviar e-mail.',
          variant: 'destructive',
        })
      }
    } catch (_) {
      toast({
        title: 'Erro',
        description: 'Falha de comunicação.',
        variant: 'destructive',
      })
    } finally {
      setReenviandoId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] block">
            Convites de Acesso Emitidos ({convites.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Acompanhe o status e reenvie links de cadastro para empresários da carteira
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {convites.map((conv) => {
          const isPendente = conv.status === 'pendente'
          const isAceito = conv.status === 'aceito'

          return (
            <div
              key={conv.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#D4AF37] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-slate-900 font-bold">{conv.email}</strong>
                  {conv.cliente_nome && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                      {conv.cliente_nome}
                    </span>
                  )}
                  {isPendente && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Pendente
                    </span>
                  )}
                  {isAceito && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Conta Criada / Ativa
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>
                    Enviado em{' '}
                    {conv.enviado_em || conv.created
                      ? new Date(conv.enviado_em || conv.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                  {conv.aceito_em && (
                    <span>
                      • Aceito em{' '}
                      {new Date(conv.aceito_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isPendente && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={reenviandoId === conv.id}
                    onClick={() => handleReenviar(conv.id, conv.email)}
                    className="text-xs font-bold border-slate-300 text-[#07132B] hover:bg-slate-100 px-3 py-1.5 h-auto rounded-lg"
                  >
                    {reenviandoId === conv.id ? 'Reenviando...' : 'Reenviar E-mail'}
                  </Button>
                )}
                {isAceito && (
                  <span className="text-[11px] font-bold text-emerald-700">Vinculado</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
