import React from 'react'
import { Link } from 'react-router-dom'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Coins,
  Sparkles,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Building2,
} from 'lucide-react'

export default function Modulo4SimuladorCreditos() {
  const {
    despesasCreditos,
    updateDespesaCredito,
    resetDespesasCreditos,
    resultadoCreditos,
    config,
    anoOperacao,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
  } = useCalculadoraIbsCbs()

  const handleValorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    updateDespesaCredito(id, { valorMensal: valor })
  }

  const {
    totalAntigo,
    totalNovo,
    adicionalGanho,
    aumentoPercentual,
    economiaAnual,
    anoOperacao: anoEfetivoCreditos,
    aliquotaReferencia: aliqRefCreditos,
  } = resultadoCreditos

  const anoModulo1 = config.anoTransicao || 2033
  const anoModulo2 = anoOperacao || anoModulo1
  const haDivergenciaAnos = String(anoModulo1) !== String(anoModulo2)

  const rotuloAnoEfetivo =
    anoEfetivoCreditos === 'atual'
      ? 'Ano atual (sistema atual) • Pré-reforma'
      : `fase ${anoEfetivoCreditos}`

  // Formatações dos 5 valores dos cards de resumo
  const strTotalAntigo = formatarMoeda(totalAntigo)
  const strTotalNovo = formatarMoeda(totalNovo)
  const strAdicionalGanho = `+ ${formatarMoeda(adicionalGanho)}`
  const strAumentoPercentual = `+ ${formatarPorcentagem(aumentoPercentual, 1)}`
  const strEconomiaAnual = formatarMoeda(economiaAnual)

  // Escala responsiva da fonte com base na quantidade de caracteres para evitar estouro em cards compactos
  const obterClasseTamanhoFonte = (texto: string) => {
    const len = texto.length
    if (len >= 18) {
      return 'text-xs'
    }
    if (len >= 14) {
      return 'text-xs sm:text-sm lg:text-xs xl:text-sm'
    }
    if (len >= 11) {
      return 'text-sm sm:text-base lg:text-sm xl:text-base'
    }
    return 'text-base'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Coins className="w-3.5 h-3.5" />
              Módulo 4 • Não-Cumulatividade Plena
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Simulador de Créditos: Antes versus Depois
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Avalie como a substituição das vedações do sistema antigo pelo crédito financeiro
              amplo do IVA Dual ({formatarPorcentagem(aliqRefCreditos)} • {rotuloAnoEfetivo}) gera
              economia direta em 18 categorias essenciais de custos operacionais, CAPEX e
              suprimentos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => restaurarDadosEmpresaNoModulo(4)}
              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-emerald-500/10 text-xs font-semibold gap-1.5"
              title="Recalcula as categorias de crédito com base nas despesas com créditos dos Dados da Empresa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar dados da empresa
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetDespesasCreditos}
              className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white bg-transparent text-xs"
            >
              Padrão da Tabela
            </Button>
          </div>
        </div>
      </div>

      {/* AVISO INFORMATIVO COM ATALHO PARA DADOS DA EMPRESA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>
            Os valores abaixo são calibrados a partir das despesas mensais com créditos informadas
            nos <strong>Dados da Empresa</strong>. Você pode editar individualmente cada categoria
            para esta simulação.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => restaurarDadosEmpresaNoModulo(4)}
            className="h-6 px-2 text-xs font-semibold text-slate-700 hover:text-[#07132B]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restaurar
          </Button>
          <Link
            to="/dados-empresa"
            className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline"
          >
            Editar perfil da empresa →
          </Link>
        </div>
      </div>

      {/* AVISO DISCRETO CASO O ANO DO MÓDULO 1 DIVERJA DO MÓDULO 2 */}
      {haDivergenciaAnos && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 px-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              O cálculo dos créditos segue o Ano da Operação definido no Módulo 2 (Simulador de
              Nota). Para alterar, ajuste lá.
            </span>
          </div>
          <span className="text-[11px] text-amber-800/90 shrink-0">
            Módulo 1: {config.anoTransicao || 2033} • Módulo 2:{' '}
            {anoModulo2 === 'atual' ? 'Ano atual' : anoModulo2}
          </span>
        </div>
      )}

      {/* Cards de Resumo e Métricas Conforme Especificação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Crédito Antigo */}
        <Card className="min-w-0 border-slate-200/80 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title="Crédito Antigo"
              >
                Crédito Antigo
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strTotalAntigo)} font-mono font-extrabold text-slate-700 tracking-tight break-words min-w-0`}
                title={strTotalAntigo}
              >
                {strTotalAntigo}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 block leading-tight pt-1">
              Regras restritivas (insumos diretos e PIS/COFINS)
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Total Crédito Novo */}
        <Card className="min-w-0 border-[#D4AF37]/40 bg-gradient-to-br from-amber-50/30 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title={`Crédito Novo (${formatarPorcentagem(aliqRefCreditos)})`}
              >
                Crédito Novo ({formatarPorcentagem(aliqRefCreditos)})
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strTotalNovo)} font-mono font-extrabold text-amber-950 tracking-tight break-words min-w-0`}
                title={strTotalNovo}
              >
                {strTotalNovo}
              </p>
            </div>
            <span className="text-[11px] text-amber-800/80 block leading-tight pt-1">
              Crédito sobre 100% dos bens e serviços adquiridos ({rotuloAnoEfetivo})
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Crédito Adicional Ganho */}
        <Card className="min-w-0 border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title="Crédito Adicional Ganho"
              >
                Crédito Adicional Ganho
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strAdicionalGanho)} font-mono font-extrabold text-emerald-700 tracking-tight break-words min-w-0`}
                title={strAdicionalGanho}
              >
                {strAdicionalGanho}
              </p>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block leading-tight pt-1">
              Ganho líquido mensal de crédito
            </span>
          </CardContent>
        </Card>

        {/* Card 4: Aumento Percentual */}
        <Card className="min-w-0 border-slate-200 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title="Aumento Percentual"
              >
                Aumento Percentual
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strAumentoPercentual)} font-mono font-extrabold text-[#07132B] tracking-tight break-words min-w-0`}
                title={strAumentoPercentual}
              >
                {strAumentoPercentual}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 block leading-tight pt-1">
              Crescimento relativo na carteira de créditos
            </span>
          </CardContent>
        </Card>

        {/* Card 5: Economia Anual */}
        <Card className="min-w-0 bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 sm:p-5 space-y-1.5 relative min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1 leading-tight min-h-[2rem] break-words"
                title="Economia Anual"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Economia Anual</span>
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strEconomiaAnual)} font-mono font-extrabold text-white tracking-tight break-words min-w-0`}
                title={strEconomiaAnual}
              >
                {strEconomiaAnual}
              </p>
            </div>
            <span className="text-[11px] text-slate-300 block leading-tight pt-1">
              Fluxo financeiro preservado ao ano
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Interativa de 18 Categorias Conforme Especificação */}
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#07132B]">
              Tabela das 18 Categorias de Despesas Corporativas e Insumos
            </h3>
            <p className="text-xs text-slate-500">
              Edite o valor mensal de cada despesa da sua empresa para recalcular os créditos em
              tempo real.
            </p>
          </div>
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex flex-wrap items-center gap-1">
            <span>Taxa Referência IVA Dual:</span>
            <strong className="text-[#07132B] font-mono font-bold">
              {formatarPorcentagem(aliqRefCreditos)}
            </strong>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-medium">
              {anoEfetivoCreditos === 'atual'
                ? 'Ano atual (0%) — vinda da calculadora simples'
                : `fase ${anoEfetivoCreditos} — vinda da calculadora simples`}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-700 min-w-[240px]">
                  Categoria de Despesa
                </TableHead>
                <TableHead className="font-bold text-slate-800 text-center min-w-[170px]">
                  Valor Mensal (R$)
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-center min-w-[150px]">
                  Crédito Antigo
                </TableHead>
                <TableHead className="font-bold text-[#07132B] text-center min-w-[160px] bg-amber-50/60">
                  Crédito Novo (IBS/CBS)
                </TableHead>
                <TableHead className="font-bold text-emerald-800 text-center min-w-[150px] bg-emerald-50/60">
                  Ganho Adicional
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm divide-y divide-slate-100">
              {despesasCreditos.map((item) => {
                const cAntigo = (item.valorMensal * item.aliquotaAntiga) / 100
                const aliqNova =
                  item.aliquotaNova !== undefined ? item.aliquotaNova : aliqRefCreditos
                const cNovo = (item.valorMensal * aliqNova) / 100
                const ganho = cNovo - cAntigo

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-800 py-3">
                      <div className="font-bold text-slate-900">{item.nome}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.descricaoAntigo}
                      </div>
                      {item.notaEspecial && (
                        <div className="mt-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-md p-1.5 leading-snug">
                          {item.notaEspecial}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Input
                        type="text"
                        value={item.valorMensal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        onChange={(e) => handleValorChange(item.id, e)}
                        className="h-10 text-center font-mono font-bold text-slate-900 bg-white border-slate-300 w-full max-w-[160px] mx-auto shadow-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center font-mono text-slate-700 py-3">
                      <div className="font-semibold">{formatarMoeda(cAntigo)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ({formatarPorcentagem(item.aliquotaAntiga, 1)})
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-amber-950 bg-amber-50/40 py-3">
                      <div>{formatarMoeda(cNovo)}</div>
                      <div className="text-[10px] text-amber-700 font-normal">
                        ({formatarPorcentagem(aliqNova, 1)})
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-emerald-700 bg-emerald-50/40 py-3">
                      + {formatarMoeda(Math.max(0, ganho))}
                    </TableCell>
                  </TableRow>
                )
              })}

              {/* Linha de Totalização Conforme Especificação */}
              <TableRow className="bg-slate-900 text-white font-extrabold text-base hover:bg-slate-900 border-t-2 border-[#D4AF37]">
                <TableCell className="text-white">TOTALIZAÇÃO CONSOLIDADA</TableCell>
                <TableCell className="text-center font-mono text-white">
                  {formatarMoeda(despesasCreditos.reduce((acc, curr) => acc + curr.valorMensal, 0))}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-300">
                  {formatarMoeda(totalAntigo)}
                </TableCell>
                <TableCell className="text-center font-mono text-[#D4AF37] bg-slate-800">
                  {formatarMoeda(totalNovo)}
                </TableCell>
                <TableCell className="text-center font-mono text-emerald-400 bg-emerald-950/40">
                  + {formatarMoeda(adicionalGanho)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Premissas Legais Documentadas na Tela Conforme Especificação */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
          <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
          Premissas Técnicas e Doutrinárias da Simulação de Créditos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
            <li>
              <strong>Sistema Novo (IVA Dual - Art. 156-A da CF):</strong> Não-cumulatividade
              financeira ampla. Toda aquisição de bem ou serviço vinculada à atividade econômica
              gera crédito imediato, independentemente de ser insumo físico ou despesa
              administrativa.
            </li>
            <li>
              <strong>Itens com Crédito Zero no Passado:</strong> Aluguel e materiais para empresas
              no Lucro Presumido/Simples geravam zero crédito. Serviços com ISS (TI, consultoria,
              advocacia) não geravam crédito para nenhum regime.
            </li>
          </ul>
          <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
            <li>
              <strong>Alíquotas de Matéria-Prima e Mercadorias no Passado:</strong> Calculada
              considerando o aproveitamento conjunto de PIS (1,65%), COFINS (7,60%) e ICMS
              interestadual/interno médio (18,00%) no Lucro Real.
            </li>
            <li>
              <strong>
                Regime Especial de Serviços Financeiros e Tarifas (Arts. 164–165 / LC 214/2025):
              </strong>{' '}
              Crédito restrito e apenas a partir de 2027. Tarifas bancárias e intermediações não
              adotam alíquota imediata de 26,50%.
            </li>
            <li>
              <strong>Condição de Pagamento (Split Payment):</strong> No novo modelo, o
              aproveitamento do crédito é condicionado à liquidação financeira ou recolhimento na
              nota fiscal eletrônica.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
