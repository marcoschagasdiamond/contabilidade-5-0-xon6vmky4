import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CampoNcmAutocomplete } from '@/components/diagnosticos/CampoNcmAutocomplete'
import { buscarNcmPorCodigo, type ItemNcmCurado } from '@/data/tabelaNcmLc214'
import { ModalImportarComposicaoNcm } from '@/components/calculadora/ModalImportarComposicaoNcm'
import {
  classificarNcmParaCalculadora,
  calcularResumoComposicaoNcm,
  calcularAliquotaEfetivaItemComposicao,
  OPCOES_TRATAMENTO_NCM,
  type ItemComposicaoCalculadora,
  type TratamentoTributarioNcm,
} from '@/lib/ncmCalculadora'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { type AnoTransicaoIbsCbs } from '@/types/calculadoraIbsCbs'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'

export function SecaoComposicaoItensNcm() {
  const {
    itensComposicao,
    setItensComposicao,
    adicionarItemComposicao,
    atualizarItemComposicao,
    removerItemComposicao,
    limparItensComposicao,
    config,
    updateConfig,
  } = useCalculadoraIbsCbs()

  const [modalImportarAberto, setModalImportarAberto] = useState(false)

  // Formulário do novo item manual
  const [novoDescricao, setNovoDescricao] = useState('')
  const [novoNcm, setNovoNcm] = useState('')
  const [itemNcmCurado, setItemNcmCurado] = useState<ItemNcmCurado | null>(null)
  const [novoValor, setNovoValor] = useState<string>('')
  const [novoTratamento, setNovoTratamento] = useState<TratamentoTributarioNcm>('geral')
  const [novoOrigem, setNovoOrigem] = useState<'manual' | 'ncm_sugerido'>('manual')
  const [novoAnexo, setNovoAnexo] = useState<string>('')

  const anoAtivo: AnoTransicaoIbsCbs = config.anoTransicao || 2033

  // Ao selecionar um item NCM da lista de sugestões curadas (mesmo padrão do ModalEditarFornecedor)
  const handleNcmSelecionado = (item: ItemNcmCurado) => {
    setItemNcmCurado(item)
    setNovoNcm(item.codigo)
    const classif = classificarNcmParaCalculadora(item.codigo)
    setNovoTratamento(classif.tratamento)
    setNovoOrigem(classif.origem)
    setNovoAnexo(classif.anexoReferencia || item.anexoReferencia || '')
    if (!novoDescricao) {
      setNovoDescricao(item.descricao)
    }
  }

  // Ao alterar o texto do NCM livremente no input
  const handleChangeNcm = (codigo: string) => {
    setNovoNcm(codigo)
    if (!codigo) {
      setItemNcmCurado(null)
      setNovoTratamento('geral')
      setNovoOrigem('manual')
      setNovoAnexo('')
    } else {
      const achado = buscarNcmPorCodigo(codigo)
      setItemNcmCurado(achado)
      const classif = classificarNcmParaCalculadora(codigo)
      setNovoTratamento(classif.tratamento)
      setNovoOrigem(classif.origem)
      setNovoAnexo(classif.anexoReferencia || achado?.anexoReferencia || '')
      if (!novoDescricao && achado) {
        setNovoDescricao(achado.descricao)
      }
    }
  }

  const handleAdicionarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const valorNum = Number(novoValor.replace(/\D/g, '')) / 100
    if (!novoDescricao && !novoNcm) return
    if (valorNum <= 0) return

    const classif = novoNcm ? classificarNcmParaCalculadora(novoNcm) : null

    adicionarItemComposicao({
      descricao: novoDescricao || (novoNcm ? `Item NCM ${novoNcm}` : 'Item sem descrição'),
      ncm: novoNcm || undefined,
      ncmFormatado: novoNcm || undefined,
      ncmClassificadoAuto: classif?.itemCurado !== null,
      tratamentoTributario: novoTratamento,
      reducaoPercentual:
        novoTratamento === 'cesta_basica_zero'
          ? 100
          : novoTratamento === 'reducao_60' || novoTratamento === 'insumo_agro'
            ? 60
            : novoTratamento === 'reducao_30'
              ? 30
              : 0,
      valor: valorNum,
      origem: novoOrigem,
      anexoReferencia: novoAnexo || undefined,
    })

    // Limpa campos
    setNovoDescricao('')
    setNovoNcm('')
    setItemNcmCurado(null)
    setNovoValor('')
    setNovoTratamento('geral')
    setNovoOrigem('manual')
    setNovoAnexo('')
  }

  // Resumo analítico da composição atual
  const resumo = calcularResumoComposicaoNcm(itensComposicao, anoAtivo, config.totalIvaDual || 26.5)

  // Sincroniza o total de faturamento dos itens com o campo geral do Módulo 1 se desejado
  const handleAplicarTotalNoFaturamento = () => {
    if (resumo.totalFaturamento > 0) {
      updateConfig({ faturamentoMensal: resumo.totalFaturamento })
    }
  }

  const handleConfirmarImportacao = (
    novosItens: ItemComposicaoCalculadora[],
    substituir: boolean,
  ) => {
    if (substituir) {
      setItensComposicao(novosItens)
    } else {
      setItensComposicao((prev) => [...prev, ...novosItens])
    }
  }

  return (
    <Card className="border-slate-200 shadow-md overflow-hidden">
      <CardHeader className="bg-[#07132B] text-white p-5 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#D4AF37] tracking-wider uppercase">
                LC 214/2025 · Refinamento por NCM
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                Classificação Automática
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-white mt-1">
              Composição de Faturamento por Itens e Código NCM
            </CardTitle>
            <CardDescription className="text-xs text-slate-300 mt-0.5">
              Informe ou importe os itens da empresa com seus códigos NCM para aplicar
              automaticamente alíquota zero (Cesta Básica Nacional), reduções de 60%/30%,
              monofásicos e insumos agropecuários.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalImportarAberto(true)}
              className="text-xs font-semibold border-[#D4AF37] text-[#07132B] bg-white hover:bg-amber-50 h-8"
            >
              Importar Planilha (CSV/NCM)
            </Button>
            {itensComposicao.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={limparItensComposicao}
                className="text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 h-8"
              >
                Limpar Itens
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6 bg-slate-50/50">
        {/* Formulário de adição de item manual com CampoNcmAutocomplete */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#07132B] uppercase tracking-wide">
              Adicionar Item à Composição
            </span>
            <span className="text-[11px] text-slate-500">
              Digite código ou descrição para buscar na base curada da LC 214/2025
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Campo NCM com autocomplete curado */}
            <div className="md:col-span-4 min-w-0">
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Código NCM (Base Curada LC 214/2025)
              </Label>
              <CampoNcmAutocomplete
                ncmValor={novoNcm}
                onChangeNcm={handleChangeNcm}
                onNcmSelecionado={handleNcmSelecionado}
                itemNcmAtual={itemNcmCurado}
              />
            </div>

            {/* Descrição do produto */}
            <div className="md:col-span-3 min-w-0">
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Descrição do Item / Produto
              </Label>
              <Input
                type="text"
                placeholder="Ex: Arroz Parboilizado 5kg"
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Valor Mensal */}
            <div className="md:col-span-2 min-w-0">
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Valor Mensal (R$)
              </Label>
              <Input
                type="text"
                placeholder="R$ 0,00"
                value={novoValor}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  const v = Number(raw) / 100
                  setNovoValor(
                    raw ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                  )
                }}
                className="h-9 text-xs font-mono font-semibold"
              />
            </div>

            {/* Tratamento Tributário (com override livre) */}
            <div className="md:col-span-3 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Tratamento Tributário
                </Label>
                {novoOrigem === 'ncm_sugerido' && (
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 h-4">
                    Sugerido via NCM
                  </Badge>
                )}
              </div>
              <Select
                value={novoTratamento}
                onValueChange={(v) => {
                  setNovoTratamento(v as TratamentoTributarioNcm)
                  setNovoOrigem('manual')
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_TRATAMENTO_NCM.map((op) => (
                    <SelectItem key={op.id} value={op.id} className="text-xs">
                      {op.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleAdicionarItem}
              className="bg-[#07132B] hover:bg-[#07132B]/90 text-white font-semibold text-xs h-8 px-4"
            >
              Adicionar Item
            </Button>
          </div>
        </div>

        {/* Lista de itens na composição */}
        {itensComposicao.length > 0 ? (
          <div className="space-y-4">
            {/* Cards de Resumo da Composição */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Total da Composição
                </span>
                <span className="text-base font-bold text-[#07132B]">
                  {formatarMoeda(resumo.totalFaturamento)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {resumo.quantidadeItens} {resumo.quantidadeItens === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm">
                <span className="text-[11px] text-emerald-800 font-medium block">
                  Itens com NCM
                </span>
                <span className="text-base font-bold text-emerald-700">
                  {resumo.totalComNcm} de {resumo.quantidadeItens}
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  {resumo.totalSugeridosAuto} sugeridos via base curada
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                <span className="text-[11px] text-amber-900 font-medium block">
                  Alíquota Média Efetiva ({anoAtivo})
                </span>
                <span className="text-base font-bold text-[#D4AF37]">
                  {resumo.aliquotaMediaPonderada.toFixed(2)}%
                </span>
                <span className="text-[10px] text-amber-700 block">
                  Ponderada por item e tratamento
                </span>
              </div>

              <div className="bg-[#07132B] text-white rounded-lg p-3 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block">
                    Imposto Estimado Total
                  </span>
                  <span className="text-base font-bold text-[#D4AF37]">
                    {formatarMoeda(resumo.impostoEstimadoTotal)}
                  </span>
                </div>
                {resumo.totalFaturamento !== config.faturamentoMensal && (
                  <button
                    type="button"
                    onClick={handleAplicarTotalNoFaturamento}
                    className="text-[10px] text-left underline text-[#D4AF37] hover:text-white mt-1 cursor-pointer font-medium"
                  >
                    Sincronizar com Faturamento M1
                  </button>
                )}
              </div>
            </div>

            {/* Tabela dos Itens */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <Table className="text-xs">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Item / Descrição</TableHead>
                    <TableHead className="font-semibold text-slate-700">NCM</TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tratamento Tributário
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">
                      Origem
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">
                      Valor Mensal
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">
                      Alíq. {anoAtivo}
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-16">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensComposicao.map((item) => {
                    const aliq = calcularAliquotaEfetivaItemComposicao(
                      item,
                      anoAtivo,
                      config.totalIvaDual || 26.5,
                    )
                    const opTrat = OPCOES_TRATAMENTO_NCM.find(
                      (o) => o.id === item.tratamentoTributario,
                    )

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium text-slate-900 max-w-[220px]">
                          <span className="block truncate">{item.descricao}</span>
                          {item.anexoReferencia && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.anexoReferencia}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-slate-700">
                          {item.ncmFormatado || item.ncm || '—'}
                        </TableCell>

                        <TableCell>
                          <Select
                            value={item.tratamentoTributario}
                            onValueChange={(novoTrat) => {
                              atualizarItemComposicao(item.id, {
                                tratamentoTributario: novoTrat as TratamentoTributarioNcm,
                                origem: 'manual',
                              })
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs bg-transparent border-slate-200 w-[210px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPCOES_TRATAMENTO_NCM.map((op) => (
                                <SelectItem key={op.id} value={op.id} className="text-xs">
                                  {op.rotulo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="text-center">
                          {item.origem === 'ncm_sugerido' ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-semibold">
                              Sugerido via NCM
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[10px]">
                              Manual
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-mono font-semibold text-slate-900">
                          {formatarMoeda(item.valor)}
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-[#D4AF37]">
                          {aliq.toFixed(2)}%
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => removerItemComposicao(item.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                            title="Remover item da composição"
                          >
                            Excluir
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Nenhum item individual adicionado à composição
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A simulação continua funcionando normalmente com o Preset por Setor e o Faturamento
              Mensal global acima. Ao adicionar itens com NCM ou importar sua planilha, o sistema
              refina a alíquota ponderada conforme a LC 214/2025.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalImportarAberto(true)}
                className="text-xs border-[#D4AF37] text-[#07132B] hover:bg-amber-50"
              >
                Importar Planilha CSV com NCM
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ModalImportarComposicaoNcm
        aberto={modalImportarAberto}
        onOpenChange={setModalImportarAberto}
        onConfirmar={handleConfirmarImportacao}
      />
    </Card>
  )
}
