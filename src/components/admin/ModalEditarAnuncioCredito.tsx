import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AVISO_LEGAL_CREDITOS,
  TIPOS_CREDITO_LISTA,
  SITUACOES_CREDITO_VENDA,
  FINALIDADES_COMPRA,
  type AnuncioCredito,
  type OperacaoCredito,
  type TipoCredito,
  type EsferaCredito,
  type SituacaoCreditoVenda,
  type FinalidadeCreditoCompra,
  type StatusAnuncio,
  type EditarAnuncioInput,
} from '@/types/creditos'
import { atualizarAnuncioCredito } from '@/services/creditos'
import { formatarCpfCnpj, limparCNPJ, validarCpfCnpj } from '@/lib/cnpj'

export interface ModalEditarAnuncioCreditoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anuncio: AnuncioCredito | null
  onSucesso: (mensagem: string, anuncioAtualizado: AnuncioCredito) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de edição de anúncio do Mercado de Créditos
 * Padrão visual Diamond Group: Navy (#07132B), Dourado (#D4AF37), sem ícones.
 * Validação rigorosa de CPF/CNPJ obrigatório e campos essenciais.
 */
export function ModalEditarAnuncioCredito({
  open,
  onOpenChange,
  anuncio,
  onSucesso,
  onErro,
}: ModalEditarAnuncioCreditoProps) {
  const [operacao, setOperacao] = useState<OperacaoCredito>('venda')
  const [tipoCredito, setTipoCredito] = useState<TipoCredito>('Precatório Federal')
  const [situacaoVenda, setSituacaoVenda] = useState<SituacaoCreditoVenda>('expedido')
  const [finalidadeCompra, setFinalidadeCompra] =
    useState<FinalidadeCreditoCompra>('compensar_debitos')
  const [esfera, setEsfera] = useState<EsferaCredito>('federal')
  const [uf, setUf] = useState('SP')
  const [municipio, setMunicipio] = useState('')
  const [valorNominal, setValorNominal] = useState('')
  const [desagioPercentual, setDesagioPercentual] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [status, setStatus] = useState<StatusAnuncio>('ativo')

  // Contato / Dados sensíveis
  const [contatoNome, setContatoNome] = useState('')
  const [contatoDocumento, setContatoDocumento] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)

  // Preencher formulário ao abrir para um anúncio específico
  useEffect(() => {
    if (anuncio && open) {
      setOperacao(anuncio.operacao || 'venda')
      setTipoCredito(anuncio.tipo_credito || 'Precatório Federal')
      setSituacaoVenda(anuncio.situacao || 'expedido')
      setFinalidadeCompra(anuncio.finalidade || 'compensar_debitos')
      setEsfera(anuncio.esfera || 'federal')
      setUf(anuncio.uf || 'SP')
      setMunicipio(anuncio.municipio || '')
      setValorNominal(
        anuncio.valor_nominal !== undefined && anuncio.valor_nominal !== null
          ? String(anuncio.valor_nominal).replace('.', ',')
          : '',
      )
      setDesagioPercentual(
        anuncio.desagio_percentual !== undefined && anuncio.desagio_percentual !== null
          ? String(anuncio.desagio_percentual).replace('.', ',')
          : '',
      )
      setObservacoes(anuncio.observacoes || '')
      setStatus(anuncio.status || 'ativo')
      setContatoNome(anuncio.contato_nome || '')
      setContatoDocumento(
        anuncio.contato_documento ? formatarCpfCnpj(anuncio.contato_documento) : '',
      )
      setContatoEmail(anuncio.contato_email || '')
      setContatoTelefone(anuncio.contato_telefone || '')
      setErroValidacao(null)
    }
  }, [anuncio, open])

  if (!anuncio) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroValidacao(null)

    // 1. Validação de Valor Nominal
    const valorLimpo = parseFloat(valorNominal.toString().replace(/\./g, '').replace(',', '.'))
    if (isNaN(valorLimpo) || valorLimpo <= 0) {
      setErroValidacao('Informe um valor nominal válido maior que zero.')
      return
    }

    // 2. Validação de Deságio
    const desagioLimpo = parseFloat(desagioPercentual.toString().replace(',', '.'))
    if (isNaN(desagioLimpo) || desagioLimpo < 0 || desagioLimpo > 100) {
      setErroValidacao('Informe um percentual de deságio entre 0% e 100%.')
      return
    }

    // 3. Validação de Nome de Contato
    if (!contatoNome.trim()) {
      setErroValidacao('Informe o nome de contato do anunciante.')
      return
    }

    // 4. Validação de CPF/CNPJ (Obrigatório e Válido)
    const docLimpo = limparCNPJ(contatoDocumento)
    if (!docLimpo) {
      setErroValidacao('O CPF/CNPJ do anunciante é obrigatório. Por favor, preencha o documento.')
      return
    }

    if (docLimpo.length !== 11 && docLimpo.length !== 14) {
      setErroValidacao('O documento informado deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).')
      return
    }

    if (!validarCpfCnpj(docLimpo)) {
      setErroValidacao(
        docLimpo.length === 11
          ? 'O CPF informado é inválido. Verifique os dígitos digitados.'
          : 'O CNPJ informado é inválido. Verifique os dígitos digitados.',
      )
      return
    }

    // 5. Validação de E-mail
    if (!contatoEmail.trim()) {
      setErroValidacao('Informe o e-mail de contato do anunciante.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: EditarAnuncioInput = {
        operacao,
        esfera,
        uf: uf.toUpperCase().trim() || undefined,
        municipio: municipio.trim() || undefined,
        valor_nominal: valorLimpo,
        desagio_percentual: desagioLimpo,
        observacoes: observacoes.trim() || undefined,
        status,
        contato_nome: contatoNome.trim(),
        contato_documento: contatoDocumento.trim(),
        contato_email: contatoEmail.trim(),
        contato_telefone: contatoTelefone.trim() || undefined,
      }

      if (operacao === 'venda') {
        payload.tipo_credito = tipoCredito
        payload.situacao = situacaoVenda
        payload.finalidade = undefined
      } else {
        payload.finalidade = finalidadeCompra
        payload.tipo_credito = undefined
        payload.situacao = undefined
      }

      const atualizado = await atualizarAnuncioCredito(anuncio.id, payload)
      onSucesso('Anúncio atualizado com sucesso no Mercado de Créditos.', atualizado)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao atualizar anúncio de crédito:', err)
      const msg =
        err?.message ||
        'Falha ao atualizar anúncio de crédito. Verifique suas permissões e os dados enviados.'
      setErroValidacao(msg)
      onErro(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#07132B] border border-[#D4AF37]/40 text-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.85)]">
        <DialogHeader className="space-y-1.5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded">
              Mesa de Créditos • Gestão Administrativa
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold text-white">
            Editar Anúncio no Mercado de Créditos
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-300">
            Atualize as informações comerciais, parâmetros operacionais e dados sensíveis de contato
            do anúncio.
          </DialogDescription>
        </DialogHeader>

        {/* Aviso Legal Institucional */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#D4AF37]/50 text-xs text-amber-200 leading-relaxed my-2">
          <strong className="text-[#D4AF37] block mb-0.5">Aviso Legal Obrigatório:</strong>
          {AVISO_LEGAL_CREDITOS}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Seletor de Operação: Compra vs Venda */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2.5">
              Tipo de Operação do Anúncio *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOperacao('venda')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all border ${
                  operacao === 'venda'
                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Oferta de Venda
              </button>
              <button
                type="button"
                onClick={() => setOperacao('compra')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all border ${
                  operacao === 'compra'
                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Demanda de Compra
              </button>
            </div>
          </div>

          {/* Status do Anúncio na Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Status do Anúncio na Vitrine *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAnuncio)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs sm:text-sm focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="ativo" className="bg-[#07132B]">
                  Ativo (visível na vitrine pública)
                </option>
                <option value="pausado" className="bg-[#07132B]">
                  Pausado (temporariamente oculto)
                </option>
                <option value="negociado" className="bg-[#07132B]">
                  Negociado (operação concluída)
                </option>
                <option value="cancelado" className="bg-[#07132B]">
                  Cancelado (removido da vitrine)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Esfera Devedora *
              </label>
              <select
                value={esfera}
                onChange={(e) => setEsfera(e.target.value as EsferaCredito)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1A2F] border border-white/15 text-white text-xs sm:text-sm focus:border-[#D4AF37] focus:outline-none"
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

          {/* UF E MUNICÍPIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* DADOS SENSÍVEIS DO ANUNCIANTE (EDITÁVEIS POR ADMIN/MASTER) */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-[#D4AF37]/30 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Dados de Contato do Anunciante
                </span>
                <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded font-bold uppercase">
                  Acesso Restrito
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Validação obrigatória: o CPF ou CNPJ do anunciante é checado rigorosamente pelos
                algoritmos da plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome do Responsável / Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Nome completo ou razão social"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1A2F] border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  CPF ou CNPJ do Anunciante *
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={contatoDocumento}
                  onChange={(e) => {
                    const formatado = formatarCpfCnpj(e.target.value)
                    setContatoDocumento(formatado)
                  }}
                  required
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
                  Telefone / WhatsApp
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

          {/* Mensagem de Erro de Validação */}
          {erroValidacao && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-xs text-rose-200 leading-relaxed font-medium">
              {erroValidacao}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
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
              {isSubmitting ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
