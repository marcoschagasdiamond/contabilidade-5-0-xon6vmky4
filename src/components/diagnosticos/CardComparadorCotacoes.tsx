import React, { useState, useMemo } from 'react'
import { type AnoBaseSimulacao } from '@/lib/reformaTributaria'
import { type RegimeComprador } from '@/lib/calculoFornecedores'
import type { ClassificacaoCreditoItem } from '@/services/fornecedores'
import {
  type CotacaoItemInput,
  type RegimeFornecedorCotacao,
  calcularComparadorCotacoes,
  rotuloRegimeFornecedor,
  type ResultadoComparadorCotacoes,
} from '@/lib/calculoComparadorCotacoes'

import { ModalSalvarCotacaoVencedora } from './ModalSalvarCotacaoVencedora'
import type { FornecedorDiagnostico } from '@/services/fornecedores'
import {
  TooltipExplicacaoCredito,
  EXPLICACOES_CLASSIFICACAO_CREDITO,
} from './TooltipExplicacaoCredito'
import {
  registrarCotacaoHistorico,
  obterUltimaCotacaoVencedora,
  type HistoricoCotacaoRecord,
} from '@/services/historicoCotacoes'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

interface CardComparadorCotacoesProps {
  anoTransicao: AnoBaseSimulacao
  regimeComprador: RegimeComprador
  onComparacaoAlterada?: (resultado: ResultadoComparadorCotacoes) => void
  fornecedoresCadastrados?: FornecedorDiagnostico[]
  onFornecedorCadastrado?: (
    fornecedor: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>,
  ) => Promise<void>
  onCotacaoSalvaNoHistorico?: () => void
}

export function CardComparadorCotacoes({
  anoTransicao,
  regimeComprador,
  onComparacaoAlterada,
  fornecedoresCadastrados = [],
  onFornecedorCadastrado,
  onCotacaoSalvaNoHistorico,
}: CardComparadorCotacoesProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { clienteAtivoId } = useClienteAtivo()

  // Modal de salvar cotação vencedora
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [ultimaCotacaoReferencia, setUltimaCotacaoReferencia] =
    useState<HistoricoCotacaoRecord | null>(null)
  const [carregandoReferencia, setCarregandoReferencia] = useState(false)

  // Quantidade de cotações avaliadas: 2 ou 3
  const [qtdCotacoes, setQtdCotacoes] = useState<2 | 3>(2)

  // Classificação do item adquirido (reaproveitada das opções existentes na página)
  const [classificacaoItem, setClassificacaoItem] = useState<ClassificacaoCreditoItem>('integral')
  const [percentualCreditoParcial, setPercentualCreditoParcial] = useState<number>(50)

  // Volume mensal de compra opcional (para anualização)
  const [volumeMensalStr, setVolumeMensalStr] = useState<string>('')

  // Estado das 3 cotações possíveis (A, B e C)
  // Valores padrão predefinidos para refletir o caso pedido pelo usuário:
  // Cotação A: Fornecedor do Simples Nacional com preço menor (ex: R$ 92,00)
  // Cotação B: Fornecedor do Lucro Presumido com preço maior que gera crédito (ex: R$ 100,00)
  // Cotação C: Fornecedor do Lucro Real (ex: R$ 98,00)
  const [cotacaoA, setCotacaoA] = useState<CotacaoItemInput>({
    id: 'cotacao-a',
    identificador: 'A',
    fornecedorNome: 'Fornecedor A (Simples)',
    preco: 92,
    regime: 'simples_nacional',
    aliquotaSimplesCustom: 4.5,
  })

  const [cotacaoB, setCotacaoB] = useState<CotacaoItemInput>({
    id: 'cotacao-b',
    identificador: 'B',
    fornecedorNome: 'Fornecedor B (Presumido)',
    preco: 100,
    regime: 'lucro_presumido',
    aliquotaSimplesCustom: 4.5,
  })

  const [cotacaoC, setCotacaoC] = useState<CotacaoItemInput>({
    id: 'cotacao-c',
    identificador: 'C',
    fornecedorNome: 'Fornecedor C (Lucro Real)',
    preco: 98,
    regime: 'lucro_real',
    aliquotaSimplesCustom: 4.5,
  })

  // Lista ativa de cotações para o cálculo
  const cotacoesAtivas = useMemo(() => {
    return qtdCotacoes === 2 ? [cotacaoA, cotacaoB] : [cotacaoA, cotacaoB, cotacaoC]
  }, [qtdCotacoes, cotacaoA, cotacaoB, cotacaoC])

  // Volume mensal numérico
  const volumeMensalNum = useMemo(() => {
    const limpo = volumeMensalStr.replace(/\./g, '').replace(',', '.')
    const v = parseFloat(limpo)
    return isNaN(v) || v <= 0 ? 0 : v
  }, [volumeMensalStr])

  // Cálculo reativo completo
  const resultado = useMemo(() => {
    const res = calcularComparadorCotacoes(cotacoesAtivas, {
      anoTransicao,
      regimeComprador,
      classificacaoItem,
      percentualCreditoParcial,
      volumeMensal: volumeMensalNum,
    })

    if (onComparacaoAlterada) {
      onComparacaoAlterada(res)
    }

    return res
  }, [
    cotacoesAtivas,
    anoTransicao,
    regimeComprador,
    classificacaoItem,
    percentualCreditoParcial,
    volumeMensalNum,
    onComparacaoAlterada,
  ])

  // Carrega última cotação vencedora para pré-preenchimento
  const carregarUltimaReferencia = React.useCallback(async () => {
    try {
      const authUserId = pb.authStore.record?.id || user?.id
      const ult = await obterUltimaCotacaoVencedora({
        clienteId: clienteAtivoId,
        userId: authUserId,
      })
      setUltimaCotacaoReferencia(ult)
    } catch {
      /* intentionally ignored */
    }
  }, [clienteAtivoId, user?.id])

  React.useEffect(() => {
    carregarUltimaReferencia()
  }, [carregarUltimaReferencia])

  // Aplica a última cotação vencedora como referência pré-preenchida
  const handleUsarUltimaVencedora = (destino: 'A' | 'B' | 'C' = 'A') => {
    if (!ultimaCotacaoReferencia) return

    const nova: CotacaoItemInput = {
      id: `cotacao-${destino.toLowerCase()}`,
      identificador: destino,
      fornecedorNome: `${ultimaCotacaoReferencia.fornecedor_nome} (Última Vencedora)`,
      preco: ultimaCotacaoReferencia.preco_informado,
      regime: ultimaCotacaoReferencia.regime,
      aliquotaSimplesCustom: ultimaCotacaoReferencia.percentual_efetivo_simples ?? 4.5,
    }

    if (destino === 'A') setCotacaoA(nova)
    else if (destino === 'B') setCotacaoB(nova)
    else if (destino === 'C') setCotacaoC(nova)

    toast({
      title: 'Referência Carregada!',
      description: `Cotação vencedora de ${ultimaCotacaoReferencia.fornecedor_nome} (R$ ${ultimaCotacaoReferencia.preco_informado.toFixed(2)}) aplicada na Cotação ${destino}.`,
    })
  }

  // Ação de salvar cotação vencedora no banco
  const handleConfirmarSalvarVencedora = async (dados: {
    fornecedorId?: string
    fornecedorNome: string
    descricaoItem: string
    observacoes?: string
    cadastrarFornecedorNaCarteira: boolean
    dadosNovoFornecedor?: {
      nome: string
      cnpj?: string
      volumeCompras?: number
    }
  }) => {
    const authUserId = pb.authStore.record?.id || user?.id
    const vencedora = resultado.melhorCotacao

    // 1. Se pediu para cadastrar na carteira rapidamente
    let fornecedorIdFinal = dados.fornecedorId
    if (
      dados.cadastrarFornecedorNaCarteira &&
      dados.dadosNovoFornecedor &&
      onFornecedorCadastrado
    ) {
      try {
        await onFornecedorCadastrado({
          nome: dados.dadosNovoFornecedor.nome,
          cnpj: dados.dadosNovoFornecedor.cnpj,
          regime: vencedora.regime,
          volume_compras: dados.dadosNovoFornecedor.volumeCompras || vencedora.precoBruto,
          classificacao_credito: classificacaoItem,
          percentual_credito_parcial:
            classificacaoItem === 'parcial' ? percentualCreditoParcial : undefined,
          descricao_item: dados.descricaoItem,
          aliquota_simples_informada:
            vencedora.regime === 'simples_nacional' ? vencedora.aliquotaEfetivaAplicada : undefined,
          ativo: true,
        })
      } catch (e) {
        console.warn('Aviso: falha ao cadastrar fornecedor na carteira:', e)
      }
    }

    // 2. Registra na coleção historico_cotacoes_fornecedores
    const payload = {
      user_id: authUserId || undefined,
      cliente_id: clienteAtivoId || undefined,
      fornecedor_id: fornecedorIdFinal || undefined,
      fornecedor_nome: dados.fornecedorNome,
      descricao_item: dados.descricaoItem,
      preco_informado: vencedora.precoBruto,
      regime: vencedora.regime,
      percentual_efetivo_simples:
        vencedora.regime === 'simples_nacional' ? vencedora.aliquotaEfetivaAplicada : undefined,
      custo_liquido_calculado: vencedora.custoLiquido,
      credito_calculado: vencedora.creditoRecuperavel,
      eh_vencedora: true,
      ano_transicao: anoTransicao,
      regime_comprador: regimeComprador,
      classificacao_item: classificacaoItem,
      observacoes: dados.observacoes,
      dados_comparacao_json: {
        identificador: vencedora.identificador,
        aliquota_efetiva: vencedora.aliquotaEfetivaAplicada,
        diferenca_economia: resultado.diferencaCustoLiquidoMoeda,
        segunda_colocada: resultado.segundaMelhorCotacao?.fornecedorNome,
        break_evens: resultado.breakEvens,
        veredito: resultado.vereditoDireto,
      },
    }

    await registrarCotacaoHistorico(payload)

    toast({
      title: 'Cotação Vencedora Salva!',
      description: `A cotação de ${dados.fornecedorNome} foi registrada no histórico com sucesso.`,
    })

    await carregarUltimaReferencia()
    if (onCotacaoSalvaNoHistorico) {
      onCotacaoSalvaNoHistorico()
    }
  }

  // Helpers de atualização
  const atualizarCotacao = (id: 'A' | 'B' | 'C', campo: keyof CotacaoItemInput, valor: any) => {
    if (id === 'A') setCotacaoA((prev) => ({ ...prev, [campo]: valor }))
    else if (id === 'B') setCotacaoB((prev) => ({ ...prev, [campo]: valor }))
    else if (id === 'C') setCotacaoC((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* CABEÇALHO DO CARD */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] mb-2">
            <span>FERRAMENTA DE DECISÃO TÁTICA • COTAÇÕES</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Comparador de Cotações: Preço Nominal vs. Custo Líquido de Crédito
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Avalie se vale mais a pena comprar com preço menor no <strong>Simples Nacional</strong>{' '}
            ou pagar mais caro no <strong>Lucro Real / Presumido</strong> para recuperar créditos de
            IBS/CBS sob a <strong>LC 214/2025</strong>.
          </p>
        </div>

        {/* AÇÕES DE CABEÇALHO: REFERÊNCIA PRÉ-PREENCHIDA E CONTROLE 2/3 COTAÇÕES */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start">
          {ultimaCotacaoReferencia && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
              <span className="text-[11px] text-amber-900 font-bold">
                Última Vencedora ({ultimaCotacaoReferencia.fornecedor_nome}):
              </span>
              <button
                type="button"
                onClick={() => handleUsarUltimaVencedora('A')}
                title="Pré-preencher na Cotação A como base de comparação"
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#0c224c]"
              >
                Usar como Cotação A
              </button>
              <button
                type="button"
                onClick={() => handleUsarUltimaVencedora('B')}
                title="Pré-preencher na Cotação B como base de comparação"
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              >
                Usar como B
              </button>
            </div>
          )}

          {/* CONTROLE 2 OU 3 COTAÇÕES */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2">Cotações:</span>
            <button
              type="button"
              onClick={() => setQtdCotacoes(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                qtdCotacoes === 2
                  ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Opções (A vs B)
            </button>
            <button
              type="button"
              onClick={() => setQtdCotacoes(3)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                qtdCotacoes === 3
                  ? 'bg-[#07132B] text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Opções (A, B e C)
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE PARÂMETROS DO ITEM E DO COMPRADOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        {/* Parâmetro 1: Classificação do Item Adquirido */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              Classificação do Item / Insumo
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Ajuda:</span>
              <TooltipExplicacaoCredito tipo={classificacaoItem} />
            </div>
          </div>
          <select
            value={classificacaoItem}
            onChange={(e) => setClassificacaoItem(e.target.value as ClassificacaoCreditoItem)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-[#07132B]"
          >
            <option value="integral">Crédito Integral (100% da base)</option>
            <option value="parcial">Crédito Parcial (% ajustável)</option>
            <option value="nao_gera">Não gera crédito (0% - Insumo vedado)</option>
          </select>
          {classificacaoItem === 'parcial' && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">% aproveitável:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={percentualCreditoParcial}
                onChange={(e) =>
                  setPercentualCreditoParcial(Math.max(1, Math.min(99, Number(e.target.value))))
                }
                className="w-16 px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold bg-white text-center"
              />
              <span className="text-xs text-slate-500 font-bold">%</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 leading-snug">
            {classificacaoItem === 'nao_gera'
              ? EXPLICACOES_CLASSIFICACAO_CREDITO.nao_gera.destaqueDecisao
              : EXPLICACOES_CLASSIFICACAO_CREDITO[classificacaoItem].explicacao}
          </p>
        </div>

        {/* Parâmetro 2: Contexto Herdado do Adquirente */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Adquirente e Ano da Transição
          </label>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Regime Comprador:</span>
              <span className="font-bold text-[#07132B]">
                {regimeComprador === 'lucro_real'
                  ? 'Lucro Real'
                  : regimeComprador === 'lucro_presumido'
                    ? 'Lucro Presumido'
                    : 'Simples Nacional'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ano da Transição:</span>
              <span className="font-mono font-bold text-[#07132B]">{anoTransicao}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {regimeComprador === 'simples_nacional'
              ? 'Comprador no Simples não toma crédito: decisão pura por preço.'
              : 'Empresa do Lucro Real/Presumido toma crédito contra seus débitos.'}
          </p>
        </div>

        {/* Parâmetro 3: Volume Mensal Opcional (para anualizar) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Volume Mensal de Compras (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">R$</span>
            <input
              type="text"
              placeholder="Ex: 50.000 ou 1.000 un."
              value={volumeMensalStr}
              onChange={(e) => setVolumeMensalStr(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#07132B]"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Informe para ver o impacto financeiro anualizado da decisão (R$/ano).
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DAS COTAÇÕES (CARDS LADO A LADO) */}
      <div
        className={`grid grid-cols-1 ${
          qtdCotacoes === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
        } gap-4`}
      >
        {cotacoesAtivas.map((cot) => {
          const isA = cot.identificador === 'A'
          const isB = cot.identificador === 'B'
          const resCot = resultado.cotacoes.find((c) => c.identificador === cot.identificador)
          const ehMelhor = resultado.melhorCotacao?.identificador === cot.identificador

          return (
            <div
              key={cot.identificador}
              className={`p-4 rounded-xl border transition-all space-y-3 relative ${
                ehMelhor
                  ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Badge de Destaque se for a melhor */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#07132B] text-[#D4AF37]">
                  COTAÇÃO {cot.identificador}
                </span>
                {ehMelhor && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Menor Custo Líquido
                  </span>
                )}
              </div>

              {/* Nome do Fornecedor */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Identificação do Fornecedor
                </label>
                <input
                  type="text"
                  value={cot.fornecedorNome}
                  onChange={(e) =>
                    atualizarCotacao(cot.identificador as any, 'fornecedorNome', e.target.value)
                  }
                  placeholder={`Ex: Fornecedor ${cot.identificador}`}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800"
                />
              </div>

              {/* Preço de Face */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Preço de Compra (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 text-xs font-mono text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cot.preco || ''}
                    onChange={(e) =>
                      atualizarCotacao(
                        cot.identificador as any,
                        'preco',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Regime do Fornecedor */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Regime Tributário do Fornecedor
                </label>
                <select
                  value={cot.regime}
                  onChange={(e) =>
                    atualizarCotacao(
                      cot.identificador as any,
                      'regime',
                      e.target.value as RegimeFornecedorCotacao,
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-semibold"
                >
                  <option value="simples_nacional">Simples Nacional (Alíq. 3%–7%)</option>
                  <option value="lucro_presumido">Lucro Presumido (Crédito Integral)</option>
                  <option value="lucro_real">Lucro Real (Crédito Integral)</option>
                </select>
              </div>

              {/* Alíquota do Simples (caso aplicável) */}
              {cot.regime === 'simples_nacional' && (
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-900">
                      % Efetivo de Crédito do Simples:
                    </span>
                    <span className="font-mono font-bold text-amber-950">
                      {(cot.aliquotaSimplesCustom ?? 4.5).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="8.0"
                    step="0.1"
                    value={cot.aliquotaSimplesCustom ?? 4.5}
                    onChange={(e) =>
                      atualizarCotacao(
                        cot.identificador as any,
                        'aliquotaSimplesCustom',
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full accent-amber-700 cursor-pointer h-1.5 bg-amber-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-amber-800 font-mono">
                    <span>Mín: 2,0%</span>
                    <span>Padrão: 4,5%</span>
                    <span>Máx: 8,0%</span>
                  </div>
                </div>
              )}

              {/* Resultado Financeiro Desta Cotação */}
              {resCot && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Crédito Aproveitável:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      R${' '}
                      {resCot.creditoRecuperavel.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-slate-400">
                        ({resCot.aliquotaEfetivaAplicada.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Custo Líquido Real:</span>
                    <span className="font-mono text-sm font-black text-[#07132B]">
                      R${' '}
                      {resCot.custoLiquido.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* QUADRO DE RESULTADOS COMPARATIVOS, ECONOMIA E BREAK-EVEN */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Resultado Analítico
            </span>
            <h3 className="text-base font-heading font-extrabold text-slate-900">
              Diferença Financeira & Preço de Equilíbrio (Break-Even)
            </h3>
          </div>

          {resultado.segundaMelhorCotacao && (
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Vantagem Líquida da Melhor:</span>
              <span className="font-mono font-black text-sm text-emerald-700">
                R${' '}
                {resultado.diferencaCustoLiquidoMoeda.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ({resultado.diferencaCustoLiquidoPercentual.toFixed(1)}% de economia)
              </span>
            </div>
          )}
        </div>

        {/* PROJEÇÃO ANUALIZADA SE VOLUME INFORMADO */}
        {resultado.volumeMensalInformado && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                Projeção de Economia Anualizada
              </span>
              <p className="text-xs text-emerald-700 mt-0.5">
                Neste item, comprar de <strong>{resultado.melhorCotacao.fornecedorNome}</strong> em
                vez de{' '}
                <strong>{resultado.segundaMelhorCotacao?.fornecedorNome || 'outra opção'}</strong>{' '}
                gera:
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-emerald-600 block">Economia Anual Estimada:</span>
              <span className="text-xl font-heading font-black text-emerald-800 font-mono">
                R${' '}
                {resultado.economiaAnual.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                /ano
              </span>
            </div>
          </div>
        )}

        {/* TABELA DE BREAK-EVEN CRUZADO */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Preço Máximo de Equilíbrio (A partir de qual preço a outra passa a compensar):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resultado.breakEvens.map((be, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {be.nomeBase} ({be.base}) vs {be.nomeComparada} ({be.comparada})
                  </span>
                  <span className="font-mono font-black text-[#07132B]">
                    Teto: R${' '}
                    {be.precoMaximoBaseParaEquiparar.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {be.descricaoBreakEven}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VEREDITO EM LINGUAGEM DIRETA (DIAMOND GROUP) */}
        <div className="p-4 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-extrabold uppercase text-[#D4AF37] tracking-wider">
              VEREDITO EXECUTIVO DIAMOND GROUP
            </span>
            <span className="text-[10px] text-slate-300">
              Base Legal: LC 214/2025 · Transição {anoTransicao}
            </span>
          </div>

          <p className="text-sm font-bold text-white leading-relaxed">{resultado.vereditoDireto}</p>

          <p className="text-xs text-slate-300 leading-relaxed">
            {resultado.recomendacaoDetalhada}
          </p>

          <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400">
            {resultado.explicacaoRegimes}
          </div>

          {/* BOTÃO E AÇÃO PARA SALVAR COTAÇÃO VENCEDORA NO HISTÓRICO */}
          <div className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">Vencedora Apurada:</span>{' '}
              {resultado.melhorCotacao.fornecedorNome} ({resultado.melhorCotacao.identificador}) —
              Custo Líquido R${' '}
              {resultado.melhorCotacao.custoLiquido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <button
              type="button"
              onClick={() => setModalSalvarAberto(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-[#D4AF37] hover:bg-[#c29f2c] text-[#07132B] shadow-md transition-all shrink-0 text-center"
            >
              Salvar Cotação Vencedora no Histórico
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PARA SALVAR COTAÇÃO VENCEDORA */}
      <ModalSalvarCotacaoVencedora
        aberto={modalSalvarAberto}
        onOpenChange={setModalSalvarAberto}
        cotacaoVencedora={resultado.melhorCotacao}
        fornecedoresCadastrados={fornecedoresCadastrados}
        anoTransicao={anoTransicao}
        regimeComprador={regimeComprador}
        classificacaoItem={classificacaoItem}
        onSalvar={handleConfirmarSalvarVencedora}
      />
    </div>
  )
}
