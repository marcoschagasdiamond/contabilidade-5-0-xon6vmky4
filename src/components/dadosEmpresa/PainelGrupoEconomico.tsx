import { useMemo } from 'react'
import { Network, Plus, AlertTriangle, Building2, Landmark, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VinculoSocietario, PapelClienteNoVinculo } from '@/types/dadosEmpresa'
import { TETO_SIMPLES_NACIONAL } from '@/lib/vinculosSocietarios'

const LIMITE_ALERTA_GRUPO = 4000000 // R$ 4M — a partir daqui, risco de desenquadramento

interface PainelGrupoEconomicoProps {
  empresaNome?: string
  empresaCnpj?: string
  regimeAtual?: string
  faturamentoMensalProprio: number
  vinculos: VinculoSocietario[]
  /** Abre o formulário de vínculo existente da seção (sem novo fluxo de gravação).
   *  Opcional: quando omitido, o painel é SOMENTE LEITURA (ex.: modal de consulta
   *  rápida na /carteira — sem adicionar/remover vínculo por ali). */
  onAdicionarEmpresa?: () => void
}

const ROTULOS_PAPEL: Record<PapelClienteNoVinculo, string> = {
  socio_pf: 'Sócio PF da outra empresa',
  administrador: 'Administrador / Diretor da outra empresa',
  pj_socia_holding: 'PJ / Holding como sócia (vedação)',
  empresa_participa_outra: 'Esta empresa participa do capital de outra PJ (vedação)',
}

const formatarMoeda = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

type StatusBarra = 'verde' | 'amarelo' | 'vermelho'

/**
 * Painel Grupo Econômico (GE) — visão consolidada da empresa ativa + vínculos
 * cadastrados em vinculos_societarios (fonte única, sem nova coleção).
 * Puramente informativo: não altera regras de gravação nem cálculos tributários.
 */
export function PainelGrupoEconomico({
  empresaNome,
  empresaCnpj,
  regimeAtual = 'Simples Nacional',
  faturamentoMensalProprio,
  vinculos = [],
  onAdicionarEmpresa,
}: PainelGrupoEconomicoProps) {
  const proprioAnual = (faturamentoMensalProprio || 0) * 12

  const resumo = useMemo(() => {
    const somaVinculos = vinculos.reduce((acc, v) => acc + (Number(v.faturamentoAnual) || 0), 0)
    const grupoAnual = proprioAnual + somaVinculos
    const percentualTeto = Math.min(100, (grupoAnual / TETO_SIMPLES_NACIONAL) * 100)

    let status: StatusBarra = 'verde'
    if (grupoAnual > TETO_SIMPLES_NACIONAL) status = 'vermelho'
    else if (grupoAnual > LIMITE_ALERTA_GRUPO) status = 'amarelo'

    return { somaVinculos, grupoAnual, percentualTeto, status }
  }, [proprioAnual, vinculos])

  const corBarra =
    resumo.status === 'vermelho'
      ? 'bg-rose-500'
      : resumo.status === 'amarelo'
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  const corTextoGrupo =
    resumo.status === 'vermelho'
      ? 'text-rose-700'
      : resumo.status === 'amarelo'
        ? 'text-amber-700'
        : 'text-emerald-700'

  return (
    <div
      role="group"
      aria-label="Painel Grupo Econômico (GE)"
      className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#0E2442] via-[#14345C] to-[#07132B] border border-[#D4AF37]/30 space-y-5 animate-in fade-in duration-200"
    >
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              Grupo Econômico (GE)
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                {vinculos.length + 1} empresa(s)
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Árvore do grupo a partir de <strong>vinculos_societarios</strong> da empresa ativa
              (fonte única — sem nova coleção).
            </p>
          </div>
        </div>

        {onAdicionarEmpresa && (
          <Button
            type="button"
            onClick={onAdicionarEmpresa}
            className="shrink-0 bg-[#2ECC71] hover:bg-[#27AE60] text-[#0A1A13] font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Adicionar empresa ao grupo
          </Button>
        )}
      </div>

      {/* ÁRVORE DO GRUPO */}
      <div className="space-y-2">
        {/* Raiz: empresa ativa */}
        <div className="p-3.5 rounded-xl bg-white/95 border border-[#D4AF37]/40 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#07132B] text-[#D4AF37] shrink-0 mt-0.5">
                <Landmark className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-xs font-bold font-heading text-[#07132B]">
                    {empresaNome || 'Empresa Ativa'}
                  </strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40">
                    Empresa Ativa (raiz)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                  {empresaCnpj || 'CNPJ não informado'} • {regimeAtual}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                Receita Anual
              </span>
              <strong className="text-xs font-mono text-slate-900">
                {formatarMoeda(proprioAnual)}
              </strong>
            </div>
          </div>
        </div>

        {/* Filhos: vínculos cadastrados */}
        {vinculos.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/10 border border-dashed border-white/25 text-center">
            <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-[11px] font-semibold text-slate-200">
              Nenhuma outra empresa vinculada ao grupo ainda.
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {onAdicionarEmpresa
                ? 'Use "Adicionar empresa ao grupo" para cadastrar o primeiro vínculo.'
                : 'Cadastre vínculos na aba Vedações em Dados da Empresa (/dados-empresa).'}
            </p>
          </div>
        ) : (
          <div className="pl-4 sm:pl-6 space-y-2 border-l-2 border-[#D4AF37]/30 ml-4">
            {vinculos.map((v) => {
              const isVedacao =
                v.papelCliente === 'pj_socia_holding' ||
                (v.papelCliente === 'empresa_participa_outra' && !v.excecaoLegal)

              return (
                <div
                  key={v.id}
                  className={`relative p-3 rounded-xl border shadow-sm ${
                    isVedacao ? 'bg-rose-50 border-rose-300' : 'bg-white/95 border-slate-200'
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute -left-[calc(1rem+2px)] sm:-left-[calc(1.5rem+2px)] top-6 w-4 sm:w-6 h-0.5 bg-[#D4AF37]/40"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong
                          className={`text-xs font-bold font-heading ${
                            isVedacao ? 'text-rose-900' : 'text-slate-900'
                          }`}
                        >
                          {v.nomeEmpresa}
                        </strong>
                        {isVedacao && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            Vedação LC 123
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[10px] text-slate-500">
                        {v.cnpj && <span className="font-mono">{v.cnpj}</span>}
                        <span className={isVedacao ? 'text-rose-700 font-semibold' : ''}>
                          {ROTULOS_PAPEL[v.papelCliente] || v.papelCliente}
                        </span>
                        <span>• {v.regimeEmpresa}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-left sm:text-right">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                          Participação
                        </span>
                        <strong
                          className={`text-xs font-mono ${
                            isVedacao ? 'text-rose-800' : 'text-slate-900'
                          }`}
                        >
                          {v.percentualParticipacao}%{v.exerceAdministracao ? ' (Adm)' : ''}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                          Receita Anual
                        </span>
                        <strong className="text-xs font-mono text-slate-900">
                          {formatarMoeda(Number(v.faturamentoAnual) || 0)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FATURAMENTO DO GRUPO vs TETO SIMPLES */}
      <div className="p-4 rounded-xl bg-white/95 border border-white/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#07132B]">
            Faturamento do Grupo (12 meses)
          </span>
          <span className="text-[11px] text-slate-500">
            Próprio {formatarMoeda(proprioAnual)} + Vínculos {formatarMoeda(resumo.somaVinculos)}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <strong className={`text-lg font-mono font-bold ${corTextoGrupo}`}>
            {formatarMoeda(resumo.grupoAnual)}
          </strong>
          <span className="text-[11px] text-slate-500 font-mono">
            {resumo.percentualTeto.toFixed(1)}% do teto de R$ 4.800.000
          </span>
        </div>

        {/* BARRA DE PROGRESSO VERDE / AMARELO / VERMELHO */}
        <div className="relative">
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
              style={{ width: `${resumo.percentualTeto}%` }}
              role="progressbar"
              aria-valuenow={Math.round(resumo.percentualTeto)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Faturamento do grupo vs teto do Simples Nacional"
            />
          </div>
          {/* Marcador de R$ 4M (limite de alerta) */}
          <span
            aria-hidden
            className="absolute top-[-3px] h-[calc(100%+6px)] w-0.5 bg-slate-700/60"
            style={{ left: `${(LIMITE_ALERTA_GRUPO / TETO_SIMPLES_NACIONAL) * 100}%` }}
            title="R$ 4.000.000 — limite de alerta de desenquadramento"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> até R$ 4M —
            regular
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> R$ 4M a R$ 4,8M —
            atenção
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> acima de R$ 4,8M —
            teto excedido
          </span>
        </div>

        {/* ALERTA DE DESENQUADRAMENTO (> R$ 4M) */}
        {resumo.grupoAnual > LIMITE_ALERTA_GRUPO && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <strong className="block font-bold">
                ⚠️ Simples Nacional em risco de desenquadramento
              </strong>
              <span className="block leading-relaxed">
                O faturamento global do grupo econômico ({formatarMoeda(resumo.grupoAnual)})
                ultrapassou R$ 4.000.000. A receita bruta de todas as empresas do grupo deve ser
                somada para aferição do teto de R$ 4,8 milhões (LC 123/2006, art. 3º, §4º).
                {resumo.grupoAnual > TETO_SIMPLES_NACIONAL &&
                  ' O teto legal já foi excedido — avalie a transição de regime imediata.'}
              </span>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[10px] text-blue-900 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Fonte única dos dados: campo <strong>vinculos_societarios</strong> da empresa ativa.
            Painel indicativo — não altera gravações nem o parecer técnico abaixo.
          </span>
        </div>
      </div>
    </div>
  )
}
