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
import type {
  FornecedorDiagnostico,
  RegimeFornecedor,
  ClassificacaoCreditoItem,
} from '@/services/fornecedores'
import {
  TooltipExplicacaoCredito,
  EXPLICACOES_CLASSIFICACAO_CREDITO,
} from '@/components/diagnosticos/TooltipExplicacaoCredito'
import { CampoNcmAutocomplete } from '@/components/diagnosticos/CampoNcmAutocomplete'
import { buscarNcmPorCodigo, type ItemNcmCurado } from '@/data/tabelaNcmLc214'
import { listarHistoricoCotacoes, type HistoricoCotacaoRecord } from '@/services/historicoCotacoes'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'

export interface ModalEditarFornecedorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  fornecedorInicial?: FornecedorDiagnostico | null
  onSalvar: (fornecedor: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>) => void
}

export function ModalEditarFornecedor({
  aberto,
  onOpenChange,
  fornecedorInicial,
  onSalvar,
}: ModalEditarFornecedorProps) {
  const [nome, setNome] = useState(fornecedorInicial?.nome || '')
  const [cnpj, setCnpj] = useState(fornecedorInicial?.cnpj || '')
  const [regime, setRegime] = useState<RegimeFornecedor>(fornecedorInicial?.regime || 'lucro_real')
  const [proporcaoMisto, setProporcaoMisto] = useState<number>(
    fornecedorInicial?.proporcao_misto ?? 50,
  )
  const [volumeCompras, setVolumeCompras] = useState<number>(
    fornecedorInicial?.volume_compras || 100000,
  )
  const [classificacaoCredito, setClassificacaoCredito] = useState<ClassificacaoCreditoItem>(
    fornecedorInicial?.classificacao_credito || 'integral',
  )
  const [percentualCreditoParcial, setPercentualCreditoParcial] = useState<number>(
    fornecedorInicial?.percentual_credito_parcial ?? 50,
  )
  const [descricaoItem, setDescricaoItem] = useState(fornecedorInicial?.descricao_item || '')
  const [aliquotaSimplesInformada, setAliquotaSimplesInformada] = useState<string>(
    fornecedorInicial?.aliquota_simples_informada
      ? String(fornecedorInicial.aliquota_simples_informada)
      : '',
  )
  const [ncm, setNcm] = useState(fornecedorInicial?.ncm || '')
  const [itemNcmCurado, setItemNcmCurado] = useState<ItemNcmCurado | null>(() => {
    return fornecedorInicial?.ncm ? buscarNcmPorCodigo(fornecedorInicial.ncm) : null
  })
  const [ncmClassificadoAuto, setNcmClassificadoAuto] = useState<boolean>(
    Boolean(fornecedorInicial?.ncm_classificado_auto),
  )
  const [erro, setErro] = useState<string | null>(null)
  const { clienteAtivoId } = useClienteAtivo()
  const { user } = useAuth()
  const [historicoCotacoes, setHistoricoCotacoes] = useState<HistoricoCotacaoRecord[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Carrega histórico de cotações associadas a este fornecedor
  React.useEffect(() => {
    if (!aberto || !fornecedorInicial) {
      setHistoricoCotacoes([])
      return
    }

    const buscarHistorico = async () => {
      setCarregandoHistorico(true)
      try {
        const authUserId = pb.authStore.record?.id || user?.id
        const cotacoes = await listarHistoricoCotacoes({
          clienteId: clienteAtivoId,
          userId: authUserId,
          fornecedorId: fornecedorInicial.id || undefined,
          fornecedorNome: fornecedorInicial.nome,
        })
        setHistoricoCotacoes(cotacoes)
      } catch (e) {
        console.warn('Erro ao carregar histórico de cotações do fornecedor:', e)
      } finally {
        setCarregandoHistorico(false)
      }
    }

    buscarHistorico()
  }, [aberto, fornecedorInicial, clienteAtivoId, user?.id])

  // Atualiza estado quando abre com fornecedorInicial diferente
  React.useEffect(() => {
    if (fornecedorInicial) {
      setNome(fornecedorInicial.nome)
      setCnpj(fornecedorInicial.cnpj || '')
      setRegime(fornecedorInicial.regime)
      setProporcaoMisto(fornecedorInicial.proporcao_misto ?? 50)
      setVolumeCompras(fornecedorInicial.volume_compras)
      setClassificacaoCredito(fornecedorInicial.classificacao_credito)
      setPercentualCreditoParcial(fornecedorInicial.percentual_credito_parcial ?? 50)
      setDescricaoItem(fornecedorInicial.descricao_item || '')
      setAliquotaSimplesInformada(
        fornecedorInicial.aliquota_simples_informada
          ? String(fornecedorInicial.aliquota_simples_informada)
          : '',
      )
      setNcm(fornecedorInicial.ncm || '')
      setNcmClassificadoAuto(Boolean(fornecedorInicial.ncm_classificado_auto))
      setItemNcmCurado(fornecedorInicial.ncm ? buscarNcmPorCodigo(fornecedorInicial.ncm) : null)
    } else {
      setNome('')
      setCnpj('')
      setRegime('lucro_real')
      setProporcaoMisto(50)
      setVolumeCompras(100000)
      setClassificacaoCredito('integral')
      setPercentualCreditoParcial(50)
      setDescricaoItem('')
      setAliquotaSimplesInformada('')
      setNcm('')
      setNcmClassificadoAuto(false)
      setItemNcmCurado(null)
    }
    setErro(null)
  }, [fornecedorInicial, aberto])

  // Ao selecionar um NCM curado, pré-preenche automaticamente a classificação
  const handleNcmSelecionado = (item: ItemNcmCurado) => {
    setItemNcmCurado(item)
    setNcm(item.codigo)
    setClassificacaoCredito(item.classificacaoSugerida)
    if (item.percentualCreditoSugerido) {
      setPercentualCreditoParcial(item.percentualCreditoSugerido)
    }
    if (!descricaoItem.trim()) {
      setDescricaoItem(item.descricao)
    }
    setNcmClassificadoAuto(true)
  }

  // Ao alterar NCM livremente
  const handleChangeNcm = (codigo: string) => {
    setNcm(codigo)
    if (!codigo) {
      setItemNcmCurado(null)
      setNcmClassificadoAuto(false)
    } else {
      const achado = buscarNcmPorCodigo(codigo)
      setItemNcmCurado(achado)
      if (achado) {
        setNcmClassificadoAuto(true)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Informe a razão social ou nome fantasia do fornecedor.')
      return
    }
    if (volumeCompras <= 0) {
      setErro('O volume de compras deve ser maior que zero.')
      return
    }

    const payload: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'> = {
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      regime,
      proporcao_misto: regime === 'misto' ? proporcaoMisto : undefined,
      volume_compras: volumeCompras,
      classificacao_credito: classificacaoCredito,
      percentual_credito_parcial:
        classificacaoCredito === 'parcial' ? percentualCreditoParcial : undefined,
      descricao_item: descricaoItem.trim() || undefined,
      aliquota_simples_informada:
        regime === 'simples_nacional' && aliquotaSimplesInformada
          ? parseFloat(aliquotaSimplesInformada) || undefined
          : undefined,
      ncm: ncm.trim() || undefined,
      ncm_classificado_auto: ncm.trim() ? ncmClassificadoAuto : false,
      ativo: true,
    }

    onSalvar(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-800 p-6 sm:p-7 rounded-[22px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
            {fornecedorInicial ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Defina o regime tributário e a classificação de crédito do item fornecido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {erro}
            </div>
          )}

          {/* Campo NCM com busca/autocomplete LC 214/2025 (no topo do formulário) */}
          <div>
            <CampoNcmAutocomplete
              ncmValor={ncm}
              onChangeNcm={handleChangeNcm}
              onNcmSelecionado={handleNcmSelecionado}
              itemNcmAtual={itemNcmCurado}
            />
          </div>

          {/* Nome e CNPJ */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-700">Nome / Razão Social *</Label>
            <Input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fornecedor Aliança Insumos Ltda"
              className="text-xs border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">CNPJ (opcional)</Label>
              <Input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="text-xs border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Volume de Compras (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="any"
                required
                value={volumeCompras || ''}
                onChange={(e) => setVolumeCompras(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 150000"
                className="text-xs border-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Regime do Fornecedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Regime Tributário do Fornecedor *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'lucro_real' as const, label: 'Lucro Real' },
                { id: 'lucro_presumido' as const, label: 'Presumido' },
                { id: 'simples_nacional' as const, label: 'Simples Nac.' },
                { id: 'misto' as const, label: 'Misto' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegime(r.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    regime === r.id
                      ? 'bg-[#07132B] text-[#D4AF37] border-[#07132B]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proporção se for Misto */}
          {regime === 'misto' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">
                  Proporção Lucro Real: {proporcaoMisto}%
                </span>
                <span className="text-amber-700">Simples Nacional: {100 - proporcaoMisto}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={proporcaoMisto}
                onChange={(e) => setProporcaoMisto(parseInt(e.target.value, 10))}
                className="w-full accent-[#07132B]"
              />
            </div>
          )}

          {/* Alíquota declarada do Simples (opcional) */}
          {regime === 'simples_nacional' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Alíquota transferida do Simples (% opcional, padrão ~3,5% a 7%)
              </Label>
              <Input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={aliquotaSimplesInformada}
                onChange={(e) => setAliquotaSimplesInformada(e.target.value)}
                placeholder="Ex: 4.5"
                className="text-xs border-slate-200"
              />
            </div>
          )}

          {/* Classificação do Item / Produto */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-700">
                  Classificação de Crédito do Item *
                </Label>
                {ncmClassificadoAuto && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37]">
                    Sugerido via NCM
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Passe o mouse ou toque no <strong className="text-slate-600">?</strong> para
                entender
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['integral', 'parcial', 'nao_gera'] as ClassificacaoCreditoItem[]).map((tipoId) => {
                const info = EXPLICACOES_CLASSIFICACAO_CREDITO[tipoId]
                const ativo = classificacaoCredito === tipoId

                return (
                  <div
                    key={tipoId}
                    onClick={() => setClassificacaoCredito(tipoId)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                      ativo
                        ? 'bg-[#07132B] text-white border-[#07132B] ring-1 ring-[#D4AF37]/50'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          ativo ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {info.titulo}
                      </p>
                      <TooltipExplicacaoCredito
                        tipo={tipoId}
                        className={
                          ativo
                            ? 'bg-[#0c224c] text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#07132B]'
                            : ''
                        }
                      />
                    </div>
                    <p
                      className={`text-[10px] mt-1.5 ${
                        ativo ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {info.subtitulo}
                    </p>
                  </div>
                )
              })}
            </div>
            {/* Explicação contextual da opção atualmente selecionada */}
            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800">
                {EXPLICACOES_CLASSIFICACAO_CREDITO[classificacaoCredito].titulo}:
              </span>{' '}
              {EXPLICACOES_CLASSIFICACAO_CREDITO[classificacaoCredito].explicacao}
            </div>
          </div>

          {/* Slider se for Parcial */}
          {classificacaoCredito === 'parcial' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Percentual de Crédito Aproveitável: {percentualCreditoParcial}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={percentualCreditoParcial}
                onChange={(e) => setPercentualCreditoParcial(parseInt(e.target.value, 10))}
                className="w-full accent-[#07132B]"
              />
            </div>
          )}

          {/* Descrição do Produto/Serviço */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Descrição do Produto ou Serviço (opcional)
            </Label>
            <Input
              type="text"
              value={descricaoItem}
              onChange={(e) => setDescricaoItem(e.target.value)}
              placeholder="Ex: Matéria-prima de alumínio, embalagens, fretes"
              className="text-xs border-slate-200"
            />
          </div>

          {/* SEÇÃO: HISTÓRICO DE COTAÇÕES VENCEDORAS DESTE FORNECEDOR */}
          {fornecedorInicial && (
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-extrabold uppercase text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
                    HISTÓRICO DE COTAÇÕES
                  </span>
                  <h4 className="text-xs font-heading font-extrabold text-slate-900 mt-1">
                    Cotações Vencedoras Registradas ({historicoCotacoes.length})
                  </h4>
                </div>
                {carregandoHistorico && (
                  <span className="text-[10px] text-slate-400">Carregando histórico...</span>
                )}
              </div>

              {historicoCotacoes.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[11px] text-slate-500">
                    Nenhuma cotação vencedora salva no histórico deste fornecedor ainda. Ao utilizar
                    o <strong>Comparador de Cotações</strong>, você pode salvar os vereditos aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {historicoCotacoes.map((cot) => {
                    const dataFmt = cot.data_cotacao
                      ? new Date(cot.data_cotacao).toLocaleDateString('pt-BR')
                      : cot.created
                        ? new Date(cot.created).toLocaleDateString('pt-BR')
                        : 'Recente'

                    return (
                      <div
                        key={cot.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {cot.descricao_item || 'Item / Insumo'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {dataFmt}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-400 block text-[10px]">
                              Preço Informado:
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              R${' '}
                              {cot.preco_informado.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Regime:</span>
                            <span className="font-semibold text-slate-700">
                              {cot.regime === 'simples_nacional'
                                ? `Simples (${cot.percentual_efetivo_simples?.toFixed(1) || 4.5}%)`
                                : cot.regime === 'lucro_presumido'
                                  ? 'Lucro Presumido'
                                  : 'Lucro Real'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Custo Líquido:</span>
                            <span className="font-mono font-black text-emerald-700">
                              R${' '}
                              {cot.custo_liquido_calculado.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                        {cot.eh_vencedora && (
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="font-bold text-emerald-700">
                              ★ Cotação Vencedora da Comparação
                            </span>
                            {cot.ano_transicao && (
                              <span className="text-slate-500 font-mono">
                                Transição: {cot.ano_transicao}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              Salvar Fornecedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
