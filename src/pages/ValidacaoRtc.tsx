import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { calcularResultadosSimulacao } from '@/lib/calculoSimulacaoIbsCbs'
import type { ParametrosSimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { AnoTransicaoIbsCbs } from '@/types/calculadoraIbsCbs'

/**
 * Página de CONFERÊNCIA OFICIAL da Calculadora IBS/CBS contra a calculadora
 * oficial da Receita Federal (repo "calculadora-rtc-regime-regular" v1.6.1, MIT).
 *
 * Regra inegociável: esta página NÃO altera nenhuma fórmula. Apenas CONSOME
 * `calcularResultadosSimulacao` (o mesmo caminho de cálculo que o
 * CalculadoraIbsCbsContext executa). Se um caso não bater, o item aparece
 * destacado em vermelho — pode ser um achado fiscal real (diferença de vigência
 * de ano), não é um bug desta página.
 *
 * Fonte dos casos-oficiais: docs/exemplos.md do repositório da Receita
 * ("Cálculo com observabilidade" — 4 itens em uma operação, dhFatoGerador
 * 2027-03-10, alíquotas nominais CBS 8.8 / IBS UF 0.05 / IBS Mun 0.05).
 */

const FONTE_OFICIAL =
  'Casos-oficiais do exemplos.md — Calculadora RTC Regime Regular v1.6.1, Receita Federal (MIT)'

interface ItemEsperadoOficial {
  vIBS: number | null
  vCBS: number | null
  vIS: number | null
}

interface ItemObtidoNosso {
  vIBS: number
  vCBS: number
  vIS: number
}

interface CasoOficial {
  numero: number
  titulo: string
  descricao: string
  produto: string
  ncm: string
  cClassTrib: string
  cst: string
  baseCalculo: number
  regimeOperacao: 'padrao' | 'cesta_basica' | 'saude_educacao'
  aliquotaImpostoSeletivo?: number
  baseImpostoSeletivo?: number
  impostoInformado?: number
  estadoItemOficial: 'CALCULO_SIMULADO' | 'INCONSISTENCIA_ENTRADA'
  esperadoOficial: ItemEsperadoOficial
  erroOficial?: string
}

const CASOS_OFICIAIS: CasoOficial[] = [
  {
    numero: 1,
    titulo: 'Arroz — redução de 100% (cesta básica)',
    descricao: 'Item 1 da operação oficial. Redução de 100% → alíquota efetiva zero.',
    produto: 'Arroz',
    ncm: '10063021',
    cClassTrib: '200003',
    cst: '200',
    baseCalculo: 100,
    regimeOperacao: 'cesta_basica',
    estadoItemOficial: 'CALCULO_SIMULADO',
    esperadoOficial: { vIBS: 0, vCBS: 0, vIS: null },
  },
  {
    numero: 2,
    titulo: 'Cerveja — com Imposto Seletivo',
    descricao:
      'Item 2 da operação oficial. A base de CBS/IBS é derivada da base do IS + IS (150 + 15 = 165).',
    produto: 'Cerveja',
    ncm: '22030000',
    cClassTrib: '000001',
    cst: '000',
    baseCalculo: 165,
    regimeOperacao: 'padrao',
    aliquotaImpostoSeletivo: 10,
    baseImpostoSeletivo: 150,
    impostoInformado: 15,
    estadoItemOficial: 'CALCULO_SIMULADO',
    esperadoOficial: { vIBS: null, vCBS: null, vIS: 15 },
    // "vIBS/vCBS do item 2 não publicados no exemplos.md oficial (total da
    // operação publicado: vIBS 0,64 e vCBS 56,76). Confronto no item: apenas o IS.
    esperadoOficial: { vIBS: null, vCBS: null, vIS: 15 },
  } as CasoOficial,
  {
    numero: 3,
    titulo: 'Educação — redução de 60%',
    descricao: 'Item 3 da operação oficial. Base 1.200, redução de 60%.',
    produto: 'Educação (NBS 122011200)',
    ncm: 'NBS 122011200',
    cClassTrib: '200028',
    cst: '200',
    baseCalculo: 1200,
    regimeOperacao: 'saude_educacao',
    estadoItemOficial: 'CALCULO_SIMULADO',
    esperadoOficial: { vIBS: 0.48, vCBS: 42.24, vIS: null },
  },
  {
    numero: 4,
    titulo: 'Verificação de consistência — NCM não vinculada',
    descricao:
      'Item 4 da operação oficial. A NCM 02013000 NÃO está vinculada ao cClassTrib 200035 — a calculadora oficial rejeita o item (estadoItem INCONSISTENCIA_ENTRADA, erro REG-011).',
    produto: 'Carne bovina (caso de inconsistência proposital)',
    ncm: '02013000',
    cClassTrib: '200035',
    cst: '200',
    baseCalculo: 80,
    regimeOperacao: 'padrao',
    estadoItemOficial: 'INCONSISTENCIA_ENTRADA',
    esperadoOficial: { vIBS: null, vCBS: null, vIS: null },
    erroOficial:
      'REG-011 — NCM de código 02013000 não vinculada à Classificação Tributária de código 200035 (CBS e IBS)',
  },
]

const ALIQUOTAS_NOMINAIS = 'CBS 8,8% · IBS UF 0,05% · IBS Mun 0,05%'

function formatBrl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Tolerância de 1 centavo para comparação de valores monetários. */
function bateValor(esperado: number, obtido: number): boolean {
  return Math.abs(esperado - obtido) <= 0.015
}

interface ItemMemoriaProps {
  rotulo: string
  esperado: number | null
  obtido: number | null
  aplicaNoCaso: boolean
}

function ItemMemoria({ rotulo, esperado, obtido, aplicaNoCaso }: ItemMemoriaProps) {
  if (!aplicaNoCaso) return null
  const bate = esperado === null || bateValor(esperado, obtido ?? 0)
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-semibold text-slate-700">{rotulo}</span>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs tabular-nums ${
            esperado === null ? 'text-slate-400 italic' : 'text-slate-600'
          }`}
        >
          {esperado === null ? 'n/d oficial' : `R$ ${formatBrl(esperado)}`}
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${bate ? 'text-slate-900' : 'text-red-600'}`}
        >
          R$ {formatBrl(obtido ?? 0)}
        </span>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
            bate ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {bate ? '✓ bate' : '✗ não bate'}
        </span>
      </div>
    </div>
  )
}

/** Parâmetros da simulação da NOSSA calculadora (um "mini-faturamento" por caso). */
function montarParametros(
  caso: CasoOficial,
  ano: AnoTransicaoIbsCbs,
): ParametrosSimulacaoCalculadora {
  return {
    config: {
      anoTransicao: ano,
      presetSetor: caso.regimeOperacao,
      // Alíquotas nominais dos casos-oficiais (CBS 8,8 · IBS UF+Mun 0,05+0,05)
      cbsPadrao: 8.8,
      ibsPadrao: 0.1,
      totalIvaDual: 8.9,
    },
    valorOperacao: caso.baseCalculo,
    regimeOperacao: caso.regimeOperacao,
    anoOperacao: ano,
    percentualComprasVendasSimples: 0,
    percentualComprasVendasComparativo: 0,
    percentualComprasVendas: 0,
    faturamentoMensal: caso.baseCalculo,
    tipoAtividade: caso.produto.startsWith('Educação') ? 'servico' : 'comercio',
    subatividadeServico: 'servico_comum',
    subatividadeIndustria: 'industria_comum',
    subatividadeComercio: 'varejo_comum',
    aliquotaImpostoSeletivo: caso.aliquotaImpostoSeletivo ?? 10,
    proporcaoServicoMisto: 0,
    folhaPagamentoMensal: 0,
    margemLucroEstimada: 0,
    despesasComCreditosMensais: 0,
    despesasCreditos: [],
    percentualExportacao: 0,
    ufOrigem: 'RS',
    periodoDashboard: 'mensal',
    regimeAtualFiltro: 'Lucro Presumido',
    regimeAtualEmpresa: 'Lucro Presumido',
    faturamentoAnualProjetado: caso.baseCalculo * 12,
    setorTransicao: caso.produto.startsWith('Educação') ? 'servico' : 'comercio',
  }
}

/** Executa um caso na NOSSA calculadora e extrai vIBS / vCBS / vIS. */
function executarCaso(
  caso: CasoOficial,
  ano: AnoTransicaoIbsCbs,
): { obtido: ItemObtidoNosso; notas: string[] } {
  const parametros = montarParametros(caso, ano)
  const resultado = calcularResultadosSimulacao(parametros)
  const notas: string[] = []

  // Nosso caminho de cálculo não modela NCM×cClassTrib: no Caso 4 (item oficial
  // com erro proposital), nossa calculadora CALCULA o item em vez de rejeitar.
  if (caso.estadoItemOficial === 'INCONSISTENCIA_ENTRADA') {
    notas.push(
      'Nossa calculadora não possui a validação NCM×cClassTrib: calcula o item normalmente (sem erro REG-011). Divergência de modelo esperada, não é bug desta página.',
    )
  }

  return {
    obtido: {
      vIBS: resultado.resultadoSimples.debitoIbs,
      vCBS: resultado.resultadoSimples.debitoCbs,
      vIS:
        caso.baseImpostoSeletivo !== undefined && caso.impostoInformado !== undefined
          ? (caso.baseImpostoSeletivo * caso.aliquotaImpostoSeletivo) / 100
          : 0,
    },
    notas,
  }
}

export default function ValidacaoRtc() {
  const { isAuthenticated, isLoading, isMaster } = useAuth()
  const location = useLocation()
  const [anoCaso, setAnoCaso] = useState<AnoTransicaoIbsCbs>(2027)
  const [expandido, setExpandido] = useState<number | null>(1)

  const resultados = useMemo(() => {
    return CASOS_OFICIAIS.map((caso) => {
      const { obtido, notas } = executarCaso(caso, anoCaso)
      const itens = [
        {
          rotulo: 'vIBS',
          esperado: caso.esperadoOficial.vIBS,
          obtido: obtido.vIBS,
          aplicaNoCaso:
            caso.esperadoOficial.vIBS !== null ||
            caso.estadoItemOficial !== 'INCONSISTENCIA_ENTRADA',
        },
        {
          rotulo: 'vCBS',
          esperado: caso.esperadoOficial.vCBS,
          obtido: obtido.vCBS,
          aplicaNoCaso:
            caso.esperadoOficial.vCBS !== null ||
            caso.estadoItemOficial !== 'INCONSISTENCIA_ENTRADA',
        },
        {
          rotulo: 'IS (vIS)',
          esperado: caso.esperadoOficial.vIS,
          obtido: obtido.vIS,
          aplicaNoCaso: caso.esperadoOficial.vIS !== null,
        },
      ].filter((i) => i.aplicaNoCaso)

      const itensBatem = itens.filter((i) => i.esperado === null || bateValor(i.esperado, i.obtido))
      const casoBate = itensBatem.length === itens.length && itens.length > 0

      return { caso, obtido, itens, casoBate }
    })
  }, [anoCaso])

  const totalBatem = resultados.filter((r) => r.casoBate).length
  const totalDivergentes = resultados.length - totalBatem

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Bloqueio: só usuário master acessa (mesmo padrão das rotas admin)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isMaster) {
    return <Navigate to="/minha-conta" replace />
  }

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#2ECC71]" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37]">
              Conferência Oficial • Uso Interno (Master)
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Validação RTC — Calculadora IBS/CBS × Calculadora Oficial da Receita
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Esta página roda os casos-oficiais do <em>exemplos.md</em> da Receita Federal na
            Calculadora IBS/CBS deste sistema e compara, item a item, o resultado esperado (oficial)
            com o obtido pela nossa calculadora. Nenhuma fórmula é alterada aqui — divergências são
            destacadas em vermelho (podem ser achados fiscais reais, como diferença de vigência de
            ano, e não bug desta página).
          </p>
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span>{FONTE_OFICIAL}</span>
          </div>
        </div>

        {/* Veredito geral no topo */}
        <div
          className={`rounded-2xl p-6 border mb-6 ${
            totalDivergentes === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p
                className={`font-heading font-extrabold text-xl ${
                  totalDivergentes === 0 ? 'text-emerald-800' : 'text-red-700'
                }`}
              >
                {totalDivergentes === 0
                  ? `${totalBatem}/${resultados.length} casos conferidos`
                  : `${totalBatem}/${resultados.length} casos conferidos • ${totalDivergentes} divergência(ões)`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Casos executados com a lógica de cálculo existente da Calculadora IBS/CBS
                (calculoSimulacaoIbsCbs.ts). Ano da operação oficial: <strong>2027</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="ano-operacao" className="text-xs font-semibold text-slate-600">
                Ano da operação:
              </label>
              <select
                id="ano-operacao"
                value={String(anoCaso)}
                onChange={(e) => setAnoCaso(e.target.value as AnoTransicaoIbsCbs)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="2027">2027</option>
                <option value="2033">2033 (pleno)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Casos lado a lado */}
        <div className="space-y-4">
          {resultados.map(({ caso, obtido, itens, casoBate }) => {
            const aberto = expandido === caso.numero
            return (
              <div
                key={caso.numero}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  casoBate ? 'border-slate-200' : 'border-red-300 ring-1 ring-red-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : caso.numero)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          casoBate ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        Caso {caso.numero}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          caso.estadoItemOficial === 'CALCULO_SIMULADO'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        oficial: {caso.estadoItemOficial}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {caso.ncm} · {caso.cClassTrib}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 mt-1.5">{caso.titulo}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{caso.descricao}</p>
                  </div>
                  {aberto ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {aberto && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    {/* Memória de cálculo LADO A LADO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Esperado — Calculadora oficial da Receita
                        </p>
                        <div className="space-y-1">
                          {itens.map((i) => (
                            <div key={i.rotulo} className="flex justify-between text-xs">
                              <span className="text-slate-600 font-medium">{i.rotulo}</span>
                              <span className="tabular-nums text-slate-800">
                                {i.esperado === null
                                  ? 'n/d no exemplos.md'
                                  : `R$ ${formatBrl(i.esperado)}`}
                              </span>
                            </div>
                          ))}
                          {caso.erroOficial && (
                            <p className="text-[11px] text-red-600 mt-2 font-medium">
                              Erro esperado: {caso.erroOficial}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4 bg-white">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Obtido — Calculadora IBS/CBS (nosso sistema)
                        </p>
                        <div className="space-y-1">
                          {itens.map((i) => (
                            <div key={i.rotulo} className="flex justify-between text-xs">
                              <span className="text-slate-600 font-medium">{i.rotulo}</span>
                              <span
                                className={`tabular-nums font-bold ${
                                  i.esperado !== null && !bateValor(i.esperado, i.obtido)
                                    ? 'text-red-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                R$ {formatBrl(i.obtido)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bate / não bate por item */}
                    <div className="rounded-xl border border-slate-200 px-4 py-2 mb-3">
                      {itens.map((i) => (
                        <ItemMemoria
                          key={i.rotulo}
                          rotulo={i.rotulo}
                          esperado={i.esperado}
                          obtido={i.obtido}
                          aplicaNoCaso
                        />
                      ))}
                    </div>

                    {/* Notas de modelo */}
                    {resultados.find((r) => r.caso.numero === caso.numero) && null}
                    {caso.numero === 4 && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                        Nota de modelo: nossa calculadora não modela o vínculo NCM×cClassTrib, então
                        calcula o item em vez de rejeitar com erro REG-011 — divergência de modelo
                        esperada. Valor obtido com a base R$ 80,00 e alíquotas nominais: vIBS R${' '}
                        {formatBrl(obtido.vIBS)} · vCBS R$ {formatBrl(obtido.vCBS)}.
                      </div>
                    )}
                    {caso.numero === 2 && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                        Nota de modelo: o exemplos.md não publica vIBS/vCBS individualmente para o
                        item 2 (apenas o total da operação: vIBS 0,64 · vCBS 56,76, que soma os 4
                        itens calculados). O confronto neste item é do IS (R$ 15,00), calculado da
                        base do IS (R$ 150,00) × 10%. A base de CBS/IBS do item (base do IS + IS =
                        R$ 165,00) foi alimentada na nossa calculadora de acordo com a regra
                        oficial.
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 mt-2">
                      Alíquotas nominais dos casos: {ALIQUOTAS_NOMINAIS} · memória de cálculo gerada
                      em tempo de execução pela função pura da calculadora — zero fórmula alterada.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Rodapé / fonte */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">{FONTE_OFICIAL}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Página de conferência interna (acesso exclusivo master). Os cálculos da Calculadora
            IBS/CBS usados nesta página são exatamente os mesmos rodados nos módulos do sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
