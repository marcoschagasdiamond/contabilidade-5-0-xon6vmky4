// AvisoNotasFiscaisReais — banner da Calculadora IBS/CBS que mostra as notas fiscais
// reais importadas em /dados-empresa (aba Notas Fiscais, coleção notas_fiscais) e
// permite aplicar a base de compras pelos valores importados, pelo MESMO caminho do
// ModalImportarFaturamento (restaurarSimulacao na página). Não altera nenhuma fórmula
// fiscal nem a ponderação do Context: apenas preenche parâmetros editáveis da simulação.

import React, { useEffect, useMemo, useState } from 'react'
import { ReceiptText, Loader2, Undo2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import {
  listarNotasFiscais,
  calcularResumoComprasMensal,
  type NotaFiscalRecord,
  type ResumoComprasNotasReais,
} from '@/services/notasFiscais'

const BRL = (v: number) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface AvisoNotasFiscaisReaisProps {
  /** Resumo aplicado atualmente (null = fonte estimada). */
  fonteAplicada: ResumoComprasNotasReais | null
  /** Aplica a base de compras pelos valores reais das notas. */
  onAplicar: (resumo: ResumoComprasNotasReais) => void
  /** Volta a indicar fonte estimada (não altera os valores já preenchidos). */
  onRemover: () => void
}

export function AvisoNotasFiscaisReais({
  fonteAplicada,
  onAplicar,
  onRemover,
}: AvisoNotasFiscaisReaisProps) {
  const { user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()

  const [notas, setNotas] = useState<NotaFiscalRecord[]>([])
  const [carregando, setCarregando] = useState(true)

  // Mesmo escopo da AbaNotasFiscais: notas do cliente ativo, ou do próprio usuário.
  useEffect(() => {
    let cancelado = false
    const carregar = async () => {
      setCarregando(true)
      const lista = await listarNotasFiscais({
        clienteId: clienteAtivo?.id ?? null,
        userId: clienteAtivo?.id ? null : (user?.id ?? null),
      })
      if (!cancelado) {
        setNotas(lista)
        setCarregando(false)
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [clienteAtivo?.id, user?.id])

  const resumoNotas = useMemo(() => calcularResumoComprasMensal(notas), [notas])

  // Sem notas importadas e sem aplicação anterior: a tela fica exatamente como hoje.
  if (carregando) return null
  if (!resumoNotas && !fonteAplicada) return null

  const fonteReal = !!fonteAplicada && !!resumoNotas
  const resumo = resumoNotas ?? fonteAplicada!

  return (
    <div
      className={`rounded-xl border p-4 space-y-2 shadow-xs ${
        fonteReal ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-100 border-slate-200'
      }`}
      data-testid="aviso-notas-fiscais-reais"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ReceiptText
            className={`w-5 h-5 shrink-0 mt-0.5 ${fonteReal ? 'text-emerald-700' : 'text-[#07132B]'}`}
          />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  fonteReal ? 'text-emerald-800' : 'text-[#07132B]'
                }`}
              >
                Notas fiscais reais importadas
              </span>
              {/* FONTE EXPLÍCITA: real (notas aplicadas) vs estimada */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  fonteReal
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
                title={
                  fonteReal
                    ? 'A base de compras desta simulação está usando os valores das notas importadas'
                    : 'A base de compras está usando a estimativa interna (média/configuração)'
                }
              >
                Fonte das compras: {fonteReal ? 'REAL' : 'ESTIMADA'}
              </span>
            </div>
            {resumoNotas ? (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {resumoNotas.quantidadeNotas} nota(s) de compra importada(s) em /dados-empresa
                {resumoNotas.periodo ? ` (${resumoNotas.periodo})` : ''} — total{' '}
                <strong className="font-mono">{BRL(resumoNotas.valorTotal)}</strong>, média mensal{' '}
                <strong className="font-mono">{BRL(resumoNotas.comprasMensal)}</strong> (
                {resumoNotas.mesesConsiderados} mês(es)).
              </p>
            ) : (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As notas importadas não estão mais disponíveis (foram removidas em /dados-empresa).
                A simulação continua com os últimos valores aplicados.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {fonteAplicada && (
            <button
              type="button"
              onClick={onRemover}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              title="Marcar a fonte como estimada novamente (mantém os valores atuais da simulação)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Voltar para estimativa</span>
            </button>
          )}
          {resumoNotas && (
            <button
              type="button"
              onClick={() => onAplicar(resumoNotas)}
              disabled={carregando}
              className="px-3 py-1.5 rounded-lg bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-extrabold hover:bg-[#122347] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Ajusta a base de compras da simulação atual pelos valores importados (mesmo caminho da importação de faturamento)"
            >
              {carregando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ReceiptText className="w-3.5 h-3.5" />
              )}
              <span>
                {fonteAplicada ? 'Reaplicar notas fiscais reais' : 'Usar notas fiscais reais'}
              </span>
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-500">
        O botão ajusta apenas a base de compras da simulação atual (percentual de compras/vendas),
        pelo mesmo caminho do botão "Importar faturamento". Nenhum cálculo fiscal é alterado e os
        valores continuam editáveis.
      </p>
    </div>
  )
}

export default AvisoNotasFiscaisReais
