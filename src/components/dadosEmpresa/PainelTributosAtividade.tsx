import { Info, Receipt } from 'lucide-react'
import {
  mapearTributosPorAtividade,
  rotuloGrupoAtividade,
  CORES_CATEGORIA_TRIBUTO,
} from '@/services/mapaTributosAtividade'

interface PainelTributosAtividadeProps {
  cnaeCodigo?: string | null
  cnaeDescricao?: string | null
  segmento?: string | null
}

/**
 * Painel informativo "Tributos aplicáveis à atividade" (SOMENTE INDICAÇÃO).
 * Reage ao CNAE principal cadastrado; sem correspondência no mapeamento,
 * fica oculto — não quebra nada e não altera nenhum fluxo existente.
 */
export function PainelTributosAtividade({
  cnaeCodigo,
  cnaeDescricao,
  segmento,
}: PainelTributosAtividadeProps) {
  const resultado = mapearTributosPorAtividade(cnaeCodigo, cnaeDescricao || '', segmento)

  if (!resultado.grupoAtividade || resultado.tributos.length === 0) return null

  const rotuloGrupo = rotuloGrupoAtividade(resultado.grupoAtividade)
  const rotuloTipo =
    resultado.tipoAtividade === 'mercadoria'
      ? 'Circulação de mercadoria'
      : resultado.tipoAtividade === 'servico'
        ? 'Prestação de serviço'
        : resultado.tipoAtividade === 'mista'
          ? 'Atividade mista (mercadoria + serviço)'
          : resultado.tipoAtividade === 'rural'
            ? 'Produção rural'
            : ''

  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-[#D4AF37]" />
          Tributos aplicáveis à atividade
        </span>
        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
          {rotuloGrupo}
          {rotuloTipo ? ` • ${rotuloTipo}` : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {resultado.tributos.map((trib) => (
          <span
            key={trib.id}
            title={`${trib.descricao}${trib.fundamento ? ` — ${trib.fundamento}` : ''}`}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-help ${CORES_CATEGORIA_TRIBUTO[trib.categoria]}`}
          >
            {trib.nome}
          </span>
        ))}
        <span
          title={resultado.impostoSeletivo.observacao}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-600 cursor-help"
        >
          IS: {resultado.impostoSeletivo.sujeito ? 'possível' : 'não sujeito (regra geral)'}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-1">
        {resultado.tributos.map((trib) => (
          <p key={trib.id} className="text-[11px] text-slate-600 leading-snug">
            <strong className="text-slate-800">{trib.nome}</strong> — {trib.descricao}
            {trib.fundamento ? <span className="text-slate-400"> ({trib.fundamento})</span> : null}
          </p>
        ))}
        {resultado.observacoes.map((obs, idx) => (
          <p key={idx} className="text-[11px] text-slate-500 leading-snug flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
            {obs}
          </p>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 italic">
        Indicação informativa — não substitui análise tributária caso a caso.
      </p>
    </div>
  )
}
