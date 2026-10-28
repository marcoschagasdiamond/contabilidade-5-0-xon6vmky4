import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { AnuncioCredito, NovoPedidoInformacaoInput } from '@/types/creditos'
import { registrarPedidoInformacao } from '@/services/creditos'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'

interface ModalPedirMaisInformacoesProps {
  anuncio: AnuncioCredito | null
  aberto: boolean
  aoFechar: () => void
  aoSucesso: () => void
}

export function ModalPedirMaisInformacoes({
  anuncio,
  aberto,
  aoFechar,
  aoSucesso,
}: ModalPedirMaisInformacoesProps) {
  const { user } = useAuth()

  const [mensagem, setMensagem] = useState('')
  const [nome, setNome] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [telefone, setTelefone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!aberto || !anuncio) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!user?.id) {
      setErro('Você precisa estar conectado para solicitar informações.')
      return
    }

    if (!mensagem.trim()) {
      setErro('Por favor, descreva suas dúvidas ou proposta na mensagem.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: NovoPedidoInformacaoInput = {
        anuncio_id: anuncio.id,
        mensagem: mensagem.trim(),
        solicitante_nome: nome.trim() || user.name || user.email || 'Usuário Interessado',
        solicitante_email: email.trim() || user.email || '',
        solicitante_telefone: telefone.trim(),
      }

      await registrarPedidoInformacao(user.id, payload)
      aoSucesso()
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao pedir informações:', err)
      setErro(err?.message || 'Falha ao enviar pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tituloAnuncio =
    anuncio.operacao === 'venda'
      ? `${anuncio.tipo_credito || 'Crédito'} (${anuncio.esfera.toUpperCase()})`
      : `Interesse de Compra (${anuncio.esfera.toUpperCase()})`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-[#07132B] border border-[#D4AF37]/40 shadow-[0_16px_48px_rgba(0,0,0,0.85)] text-white p-6 sm:p-7">
        <div className="flex items-start justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
              Intermediação Segura Diamond Group
            </span>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white">
              Pedir Mais Informações
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Resumo do Anúncio */}
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 mb-4 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{tituloAnuncio}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                anuncio.operacao === 'venda'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {anuncio.operacao === 'venda' ? 'Venda' : 'Compra'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300 pt-1">
            <span>Valor Nominal / Disponível:</span>
            <strong className="text-white">{formatarMoeda(anuncio.valor_nominal)}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Deságio Alvo / Desejado:</span>
            <strong className="text-[#D4AF37]">
              {formatarPorcentagem(anuncio.desagio_percentual)}
            </strong>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Sua mensagem será encaminhada diretamente à mesa técnica de administradores da
          Contabilidade 5.0. Nossos tributaristas realizam a checagem de procedência e intermediarão
          o contato com segurança e sigilo absoluto.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Sua Mensagem / Dúvidas / Proposta *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Escreva sua mensagem: interesse em documentação, certidões de trânsito em julgado, proposta de deságio ou prazo..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Seu Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Seu E-mail de Contato *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {erro && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={aoFechar}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Pedido à Mesa Técnica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
