import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  executarCasosOficiaisRtc,
  FASE_CASOS,
  type CasoOficialRtc,
  type ItemConferenciaRtc,
} from '@/lib/casosOficiaisRtc'

/**
 * Página de CONFERÊNCIA OFICIAL da Calculadora IBS/CBS contra a calculadora
 * oficial da Receita Federal (repo "calculadora-rtc-regime-regular" v1.6.1, MIT).
 *
 * Regra inegociável: esta página NÃO altera nenhuma fórmula. Apenas CONSOME
 * `executarCasosOficiaisRtc()` (src/lib/casosOficiaisRtc.ts), que roda os
 * casos-oficiais do exemplos.md na mesma função pura usada pela tela
 * (`calcularResultadosSimulacao`). Se um caso não bater, o item aparece
 * destacado em vermelho — pode ser um achado fiscal real (ex. arredondamento
 * de esferas IBS UF/Mun, diferença de vigência de ano), não é bug desta página.
 *
 * Acesso: exclusivo `nivel_acesso === 'master'` (padrão do AuthContext).
 */

const FONTE_OFICIAL =
  'Casos-oficiais do exemplos.md — Calculadora RTC Regime Regular v1.6.1, Receita Federal (MIT)'

const ALIQUOTAS_NOMINAIS = `CBS 8,8% · IBS UF 0,05% · IBS Mun 0,05% (nominais informadas na operação; IBS total 0,1%)`

function formatBrl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function LinhaMemoria({ texto }: { texto: string }) {
  return <li className="text-xs text-slate-600 leading-relaxed list-disc list-inside">{texto}</li>
}

interface ItemConferenciaProps {
  item: ItemConferenciaRtc
}

/** Uma linha do quadro item a item: esperado oficial × obtido, divergente em vermelho. */
function ItemConferencia({ item }: ItemConferenciaProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-semibold text-slate-700">{item.rotulo}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-slate-500">
          oficial: R$ {formatBrl(item.esperadoOficial)}
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${
            item.bate ? 'text-slate-900' : 'text-red-600'
          }`}
        >
          R$ {formatBrl(item.obtidoNosso)}
        </span>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
            item.bate ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {item.bate ? '✓ bate' : '✗ não bate'}
        </span>
      </div>
    </div>
  )
}

function CardCaso({
  caso,
  aberto,
  onToggle,
}: {
  caso: CasoOficialRtc
  aberto: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        caso.bate ? 'border-slate-200' : 'border-red-300 ring-1 ring-red-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                caso.bate ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              Caso {caso.numero}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {caso.codigo} · cClassTrib {caso.cClassTrib}
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
          {/* Memória de cálculo LADO A LADO: oficial × nosso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Esperado — Calculadora oficial da Receita
              </p>
              <ul className="space-y-1">
                {caso.memoriaOficial.map((linha, idx) => (
                  <LinhaMemoria key={idx} texto={linha} />
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Obtido — Calculadora IBS/CBS (nosso sistema)
              </p>
              <ul className="space-y-1">
                {caso.memoriaNosso.map((linha, idx) => (
                  <LinhaMemoria key={idx} texto={linha} />
                ))}
              </ul>
            </div>
          </div>

          {/* Quadro item a item (divergentes em vermelho) */}
          <div className="rounded-xl border border-slate-200 px-4 py-2 mb-3">
            {caso.itens.map((item) => (
              <ItemConferencia key={item.rotulo} item={item} />
            ))}
          </div>

          {/* Notas de modelo dos casos com divergência esperada */}
          {caso.numero === 2 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Nota de modelo: a calculadora oficial arredonda vIBSUF e vIBSMun a 2 casas decimais
              antes de somar (0.08 + 0.08 = 0.16); nosso motor apura o IBS em uma esfera única (165
              × 0,10% = 0.165). Divergência de arredondamento de esferas esperada — não é bug.
            </div>
          )}
          {caso.numero === 4 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Nota de modelo: a calculadora oficial rejeita o item (estadoItem
              INCONSISTENCIA_ENTRADA, erro REG-011 — NCM 02013000 não vinculada ao cClassTrib
              200035). Nossa base curada não modela o vínculo NCM×cClassTrib; a conferência aqui é
              de consistência entre as duas bases.
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2">
            Alíquotas nominais dos casos: {ALIQUOTAS_NOMINAIS} · memória de cálculo gerada em tempo
            de execução pela função pura da calculadora — zero fórmula alterada.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ValidacaoRtc() {
  const { isAuthenticated, isLoading, isMaster } = useAuth()
  const location = useLocation()
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set([1, 2, 3, 4]))

  // Executa os 4 casos-oficiais na nossa calculadora (função pura, memoizada)
  const casos = useMemo(() => executarCasosOficiaisRtc(), [])

  const totalBatem = casos.filter((c) => c.bate).length
  const totalDivergentes = casos.length - totalBatem

  const toggle = (numero: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(numero)) next.delete(numero)
      else next.add(numero)
      return next
    })
  }

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
            destacadas em vermelho (podem ser achados fiscais reais, como arredondamento de esferas
            ou diferença de vigência de ano, e não bug desta página).
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
          <p
            className={`font-heading font-extrabold text-xl ${
              totalDivergentes === 0 ? 'text-emerald-800' : 'text-red-700'
            }`}
          >
            {totalBatem}/{casos.length} casos conferidos
            {totalDivergentes > 0 && (
              <span className="font-semibold text-sm ml-2">
                • {totalDivergentes} divergência(s) destacada(s) em vermelho
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Casos executados com a lógica de cálculo existente da Calculadora IBS/CBS
            (calculoSimulacaoIbsCbs.ts). Ano da operação oficial: <strong>2027</strong>{' '}
            (dhFatoGerador 2027-03-10).
          </p>
        </div>

        {/* Casos com memória de cálculo oficial × obtido */}
        <div className="space-y-4">
          {casos.map((caso) => (
            <CardCaso
              key={caso.numero}
              caso={caso}
              aberto={expandidos.has(caso.numero)}
              onToggle={() => toggle(caso.numero)}
            />
          ))}
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
