import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  AVISO_LEGAL_CREDITOS,
  TIPOS_CREDITO_LISTA,
  SITUACOES_CREDITO_VENDA,
  FINALIDADES_COMPRA,
  type OperacaoCredito,
  type TipoCredito,
  type EsferaCredito,
  type SituacaoCreditoVenda,
  type FinalidadeCreditoCompra,
  type NovoAnuncioInput,
} from '@/types/creditos'
import { criarAnuncioCredito } from '@/services/creditos'
import { formatarCNPJ, limparCNPJ } from '@/lib/cnpj'

interface ModalCriarAnuncioCreditoProps {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: () => void
}

export function ModalCriarAnuncioCredito({
  aberto,
  aoFechar,
  aoSalvar,
}: ModalCriarAnuncioCreditoProps) {
  const { user } = useAuth()

  // 1) Pergunta inicial prescritiva: 'Interesse na compra ou na venda?'
  const [operacao, setOperacao] = useState<OperacaoCredito>('venda')

  // Campos específicos de VENDA
  const [tipoCredito, setTipoCredito] = useState<TipoCredito>('Precatório Federal')
  const [situacaoVenda, setSituacaoVenda] = useState<SituacaoCreditoVenda>('expedido')

  // Campos específicos de COMPRA
  const [finalidadeCompra, setFinalidadeCompra] =
    useState<FinalidadeCreditoCompra>('compensar_debitos')

  // Campos comuns
  const [esfera, setEsfera] = useState<EsferaCredito>('federal')
  const [uf, setUf] = useState('SP')
  const [municipio, setMunicipio] = useState('')
  const [valorNominal, setValorNominal] = useState('')
  const [desagioPercentual, setDesagioPercentual] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Dados de contato do anunciante
  const [contatoNome, setContatoNome] = useState(user?.name || '')
  const [contatoDocumento, setContatoDocumento] = useState('')
  const [contatoEmail, setContatoEmail] = useState(user?.email || '')
  const [contatoTelefone, setContatoTelefone] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!aberto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!user?.id) {
      setErro('Você precisa estar conectado para publicar um anúncio.')
      return
    }

    const valorLimpo = parseFloat(valorNominal.replace(/\./g, '').replace(',', '.'))
    if (isNaN(valorLimpo) || valorLimpo <= 0) {
      setErro('Informe um valor nominal válido maior que zero.')
      return
    }

    const desagioLimpo = parseFloat(desagioPercentual.replace(',', '.'))
    if (isNaN(desagioLimpo) || desagioLimpo < 0 || desagioLimpo > 100) {
      setErro('Informe um percentual de deságio entre 0% e 100%.')
      return
    }

    if (!contatoNome.trim()) {
      setErro('Informe o nome de contato do anunciante.')
      return
    }

    if (!contatoEmail.trim()) {
      setErro('Informe o e-mail de contato do anunciante.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: NovoAnuncioInput = {
        operacao,
        esfera,
        uf: uf.toUpperCase().trim() || undefined,
        municipio: municipio.trim() || undefined,
        valor_nominal: valorLimpo,
        desagio_percentual: desagioLimpo,
        observacoes: observacoes.trim() || undefined,
        contato_nome: contatoNome.trim(),
        contato_documento: contatoDocumento.trim(),
        contato_email: contatoEmail.trim(),
        contato_telefone: contatoTelefone.trim(),
      }

      if (operacao === 'venda') {
        payload.tipo_credito = tipoCredito
        payload.situacao = situacaoVenda
      } else {
        payload.finalidade = finalidadeCompra
      }

      await criarAnuncioCredito(user.id, payload)
      aoSalvar()
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao criar anúncio:', err)
      setErro(err?.message || 'Falha ao salvar anúncio. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-[#07132B] border border-[#D4AF37]/40 shadow-[0_16px_48px_rgba(0,0,0,0.85)] text-white p-6 sm:p-8">
        {/* Cabeçalho Diamond Group */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
              Mercado de Créditos 5.0
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              Publicar Anúncio no Mercado de Créditos
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Negociação de créditos tributários, direitos creditórios e precatórios federais,
              estaduais e municipais.
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* AVISO LEGAL OBRIGATÓRIO (PREVENTIVO & VISÍVEL) */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#D4AF37]/50 text-xs text-amber-200 leading-relaxed mb-6">
          <strong className="text-[#D4AF37] block mb-0.5">Aviso Legal Obrigatório:</strong>
          {AVISO_LEGAL_CREDITOS}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1) Pergunta inicial prescritiva */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2.5">
              Interesse na compra ou na venda?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOperacao('venda')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all border ${
                  operacao === 'venda'
                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Tenho Crédito para VENDA
              </button>
              <button
                type="button"
                onClick={() => setOperacao('compra')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all border ${
                  operacao === 'compra'
                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Busco Crédito para COMPRA
              </button>
            </div>
          </div>

          {/* CAMPOS SE VENDA */}
          {operacao === 'venda' ? (
            <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                Detalhes do Crédito à Venda
              </span>

              {/* Tipo de crédito */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Tipo de Crédito *
                </label>
                <select
                  value={tipoCredito}
                  onChange={(e) => setTipoCredito(e.target.value as TipoCredito)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs sm:text-sm focus:border-[#D4AF37] focus:outline-none"
                >
                  {TIPOS_CREDITO_LISTA.map((t) => (
                    <option key={t} value={t} className="bg-[#07132B] text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Situação */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Situação do Crédito *
                </label>
                <select
                  value={situacaoVenda}
                  onChange={(e) => setSituacaoVenda(e.target.value as SituacaoCreditoVenda)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs sm:text-sm focus:border-[#D4AF37] focus:outline-none"
                >
                  {SITUACOES_CREDITO_VENDA.map((s) => (
                    <option key={s.valor} value={s.valor} className="bg-[#07132B] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* CAMPOS SE COMPRA */
            <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Objetivo e Finalidade da Compra
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Finalidade da Compra *
                </label>
                <select
                  value={finalidadeCompra}
                  onChange={(e) => setFinalidadeCompra(e.target.value as FinalidadeCreditoCompra)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs sm:text-sm focus:border-[#D4AF37] focus:outline-none"
                >
                  {FINALIDADES_COMPRA.map((f) => (
                    <option key={f.valor} value={f.valor} className="bg-[#07132B] text-white">
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ESFERA, UF, MUNICÍPIO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Esfera devedora *
              </label>
              <select
                value={esfera}
                onChange={(e) => setEsfera(e.target.value as EsferaCredito)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="federal" className="bg-[#07132B]">
                  Federal (União / Autarquias)
                </option>
                <option value="estadual" className="bg-[#07132B]">
                  Estadual (Estados / DF)
                </option>
                <option value="municipal" className="bg-[#07132B]">
                  Municipal (Municípios)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                placeholder="Ex: SP, RJ, DF"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Município</label>
              <input
                type="text"
                placeholder="Opcional se federal"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* VALOR E DESÁGIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {operacao === 'venda'
                  ? 'Valor Nominal do Crédito (R$) *'
                  : 'Valor Disponível para Compra (R$) *'}
              </label>
              <input
                type="text"
                placeholder="Ex: 500000 ou 1.250.000,00"
                value={valorNominal}
                onChange={(e) => setValorNominal(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {operacao === 'venda'
                  ? 'Deságio Desejado (% de desconto) *'
                  : 'Deságio Alvo Pretendido (% de desconto) *'}
              </label>
              <input
                type="text"
                placeholder="Ex: 25 ou 30,5"
                value={desagioPercentual}
                onChange={(e) => setDesagioPercentual(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Observações / Detalhes Adicionais
            </label>
            <textarea
              rows={2}
              placeholder="Tribunal de origem, número de processo resumido, data base, laudos periciais etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* DADOS DE CONTATO DO ANUNCIANTE */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                Dados de Contato do Anunciante
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Privacidade garantida: estes dados NÃO são mostrados na vitrine pública nem para
                outros usuários comuns. Apenas os administradores têm acesso direto para
                intermediação segura.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome do Responsável / Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo ou razão social"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  CNPJ ou CPF do Anunciante
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={contatoDocumento}
                  onChange={(e) => {
                    const l = limparCNPJ(e.target.value)
                    setContatoDocumento(l.length > 11 ? formatarCNPJ(l) : e.target.value)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  E-mail de Contato *
                </label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={aoFechar}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Publicando...' : 'Publicar Anúncio no Mercado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
