import { useEffect, useMemo } from 'react'
import { CheckCircle2, CircleDashed } from 'lucide-react'
import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'

interface Props {
  formData: DadosEmpresaPerfil
  abaAtiva: string
  onIrParaAba: (aba: string) => void
}

interface CampoFaltante {
  rotulo: string
  aba: string
  preenchido: boolean
}

const ABAS_ROTULO: Record<string, string> = {
  identificacao: 'Identificação',
  fiscal: 'Fiscal',
  vedacoes: 'Vedações',
  parametros: 'Parâmetros',
}

export function IndicadorCompletudePerfil({ formData, abaAtiva, onIrParaAba }: Props) {
  const campos = useMemo<CampoFaltante[]>(() => {
    const cnpjDigits = (formData.cnpj || '').replace(/\D/g, '')
    return [
      {
        rotulo: 'Nome da empresa',
        aba: 'identificacao',
        preenchido: !!formData.nomeEmpresa?.trim(),
      },
      { rotulo: 'CNPJ', aba: 'identificacao', preenchido: cnpjDigits.length === 14 },
      {
        rotulo: 'Segmento de atividade',
        aba: 'identificacao',
        preenchido: !!formData.segmento?.trim(),
      },
      { rotulo: 'UF de origem', aba: 'identificacao', preenchido: !!formData.ufOrigem?.trim() },
      { rotulo: 'Cidade (ISS)', aba: 'identificacao', preenchido: !!formData.cidade?.trim() },
      { rotulo: 'E-mail', aba: 'identificacao', preenchido: !!formData.email?.trim() },
      { rotulo: 'Telefone', aba: 'identificacao', preenchido: !!formData.telefone?.trim() },
      {
        rotulo: 'Regime tributário atual',
        aba: 'identificacao',
        preenchido: !!formData.regimeAtual?.trim(),
      },
      {
        rotulo: 'Faturamento mensal',
        aba: 'fiscal',
        preenchido: (formData.faturamentoMensal ?? 0) > 0,
      },
      {
        rotulo: 'Folha de pagamento',
        aba: 'fiscal',
        preenchido: (formData.folhaPagamentoMensal ?? 0) > 0,
      },
      {
        rotulo: 'Perfil de insumos (soma 100%)',
        aba: 'fiscal',
        preenchido:
          Math.round(
            (Number(formData.perfilInsumosAliquotaCheia ?? 0) +
              Number(formData.perfilInsumosMonofasicos ?? 0) +
              Number(formData.perfilInsumosAliquotaReduzida ?? 0)) *
              100,
          ) /
            100 ===
          100,
      },
      {
        rotulo: '% Compras do Simples Nacional',
        aba: 'fiscal',
        preenchido:
          formData.porcentagemComprasSimplesNacional !== undefined &&
          formData.porcentagemComprasSimplesNacional !== null,
      },
      {
        rotulo: 'Vedações do Simples (art. 17) respondidas',
        aba: 'vedacoes',
        preenchido:
          (formData.vedacoesSimplesArt17?.length ?? 0) > 0 ||
          !!formData.vedacaoSimplesArt17Outra?.trim(),
      },
      {
        rotulo: 'Vedações Presumido/MEI respondidas',
        aba: 'vedacoes',
        preenchido:
          (formData.vedacoesPresumido?.length ?? 0) > 0 ||
          !!formData.vedacaoPresumidoOutra?.trim() ||
          (formData.vedacoesMei?.length ?? 0) > 0 ||
          !!formData.vedacaoMeiOutra?.trim(),
      },
      {
        rotulo: 'Quantidade de filiais',
        aba: 'parametros',
        preenchido: formData.numeroFiliais !== undefined && formData.numeroFiliais !== null,
      },
    ]
  }, [formData])

  const preenchidos = campos.filter((c) => c.preenchido).length
  const percentual = Math.round((preenchidos / campos.length) * 100)
  const faltantes = campos.filter((c) => !c.preenchido)

  useEffect(() => {
    // noop — mantém o effect para futuras animações sem custo
  }, [percentual])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={percentual >= 80 ? '#2ECC71' : percentual >= 50 ? '#D4AF37' : '#E74C3C'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(percentual / 100) * 97.4} 97.4`}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono text-[#07132B]">
              {percentual}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-base text-[#07132B]">
              Perfil {percentual}% completo
            </p>
            <p className="text-xs text-slate-500">
              {preenchidos} de {campos.length} campos essenciais preenchidos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {faltantes.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
              Perfil completo — todos os módulos alimentados
            </span>
          ) : (
            <>
              <span className="text-xs text-slate-500 font-medium">Faltam:</span>
              {faltantes.slice(0, 5).map((c) => (
                <button
                  key={c.rotulo}
                  type="button"
                  onClick={() => onIrParaAba(c.aba)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    abaAtiva === c.aba
                      ? 'bg-[#07132B] text-white border-[#07132B]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#2ECC71] hover:bg-emerald-50/60'
                  }`}
                >
                  <CircleDashed className="w-3 h-3 text-amber-600 shrink-0" />
                  {c.rotulo}
                  <span className="text-[10px] text-slate-400 font-normal">
                    · {ABAS_ROTULO[c.aba]}
                  </span>
                </button>
              ))}
              {faltantes.length > 5 && (
                <span className="text-[11px] text-slate-400">+{faltantes.length - 5} outro(s)</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barra de progresso contínua (reforço visual) */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentual}%`,
            background: percentual >= 80 ? '#2ECC71' : percentual >= 50 ? '#D4AF37' : '#E74C3C',
          }}
        />
      </div>
    </div>
  )
}
