import { Link } from 'react-router-dom'
import {
  CalendarClock,
  TrafficCone,
  Gauge,
  AlertTriangle,
  Info,
  Store,
  ArrowUpRight,
  Landmark,
  Boxes,
  ShoppingCart,
  Receipt,
  ShieldAlert,
} from 'lucide-react'
import { obterAliquotaISS } from '@/lib/regimes'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { BASE_LEGAL_VEDACOES_SIMPLES } from '@/lib/vedacoesSimples'

interface BlocoAvisosRegimeProps {
  regimeAtual?: string
  cidade?: string
  segmento?: string
  faturamentoMensal: number
  folhaPagamentoMensal: number
  perfilInsumosAliquotaCheia?: number
  perfilInsumosMonofasicos?: number
  perfilInsumosAliquotaReduzida?: number
  porcentagemComprasSimplesNacional?: number
  /** Ids das vedações do art. 17 marcados em /dados-empresa (para o alerta do inc. V). */
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
}

// Presunção do segmento no Lucro Presumido (IRPJ / CSLL) — apenas orientação visual
const PRESUNCAO_SEGMENTO: Record<string, { irpj: string; csll: string; nota: string }> = {
  Comércio: { irpj: '8%', csll: '12%', nota: 'Revenda de mercadorias (base de presunção 8%)' },
  Indústria: { irpj: '8%', csll: '12%', nota: 'Industrialização de produtos (base 8%)' },
  Agro: { irpj: '8%', csll: '12%', nota: 'Atividade rural — atenção ao regime de caixa' },
  Transporte: { irpj: '16%', csll: '12%', nota: 'Transporte de cargas (base 16%)' },
  'Bares e Restaurantes': { irpj: '8%', csll: '12%', nota: 'Alimentação (base 8% — Lei 13.370)' },
  Serviços: { irpj: '32%', csll: '32%', nota: 'Prestação de serviços em geral (base 32%)' },
  Tecnologia: {
    irpj: '32%',
    csll: '32%',
    nota: 'Software/SaaS (base 32%, salvo desenvolvimento licenciável)',
  },
  Saúde: { irpj: '32%', csll: '32%', nota: 'Serviços de saúde (base 32%)' },
  Educação: { irpj: '32%', csll: '32%', nota: 'Ensino (base 32%)' },
  'Construção Civil': {
    irpj: '8%*',
    csll: '12%',
    nota: '*8% quando usa só materiais; 32% se só mão de obra',
  },
}

const LIMITE_MEI = 81000
const SUBLIMITE_IBS = 3600000
const TETO_SIMPLES = 4800000

function LinhaComparacao({
  rotulo,
  mei,
  simples,
}: {
  rotulo: string
  mei: string
  simples: string
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-xs items-start border-t border-slate-100 pt-2 first:border-0 first:pt-0">
      <span className="font-bold text-slate-700">{rotulo}</span>
      <span className="text-slate-600">{mei}</span>
      <span className="text-slate-600">{simples}</span>
    </div>
  )
}

export function BlocoAvisosRegime({
  regimeAtual,
  cidade,
  segmento,
  faturamentoMensal,
  folhaPagamentoMensal,
  perfilInsumosAliquotaCheia = 0,
  perfilInsumosMonofasicos = 0,
  perfilInsumosAliquotaReduzida = 0,
  porcentagemComprasSimplesNacional = 0,
  vedacoesSimplesArt17 = [],
  vedacaoSimplesArt17Outra = '',
}: BlocoAvisosRegimeProps) {
  if (!regimeAtual || regimeAtual === 'Nova empresa / Ainda não optante') return null

  const rbt12 = faturamentoMensal * 12
  const fatorR = faturamentoMensal > 0 ? (folhaPagamentoMensal / faturamentoMensal) * 100 : 0
  const infoCidade = obterAliquotaISS(cidade)

  // ---------- SIMPLES NACIONAL ----------
  if (regimeAtual === 'Simples Nacional') {
    const emSublimite = rbt12 > SUBLIMITE_IBS && rbt12 <= TETO_SIMPLES
    const proximoTeto = rbt12 >= TETO_SIMPLES * 0.9
    const estourouTeto = rbt12 > TETO_SIMPLES
    const folhaNecessaria = faturamentoMensal * 0.28
    // Alerta de exclusão de ofício: optante do Simples com vedação do inc. V marcada
    const vedaInc5Ativa = vedacoesSimplesArt17.includes('inc5_debitos_inss_fazenda')

    return (
      <div className="space-y-3">
        {/* BANNER: JANELA DA REGRA HÍBRIDA */}
        <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#07132B] via-[#0D2A1C] to-[#07132B] text-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <CalendarClock className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <div className="flex-1 text-xs leading-relaxed">
            <strong className="text-[#D4AF37]">
              Janela da Regra Híbrida de Migração (Simples):
            </strong>{' '}
            mudanças de opção seguem janela <strong>semestral (março e setembro)</strong>, com
            efeito no semestre seguinte. A janela de 2026{' '}
            <strong className="text-[#D4AF37]">encerra em 30/10/2026</strong> — quem decidir até
            essa data tem efeito no <strong>1º semestre de 2027</strong>.
          </div>
          <Link
            to="/diagnostico-transicao"
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold bg-[#D4AF37] text-[#07132B] px-3 py-1.5 rounded-full hover:bg-[#e6c35a] transition-colors"
          >
            Ver cronograma <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* FAROL DO FATOR R EM TEMPO REAL */}
        <div
          className={`rounded-xl border p-4 space-y-2 ${
            fatorR >= 28 ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 ${fatorR >= 28 ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="text-sm font-bold text-[#07132B]">
              Farol do Fator R (tempo real, conforme a folha digitada)
            </span>
            <span
              className={`ml-auto text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                fatorR >= 28 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              R = {fatorR.toFixed(1)}% → {fatorR >= 28 ? 'Anexo III (≥ 6%)' : 'Anexo V (≥ 15,5%)'}
            </span>
          </div>
          {faturamentoMensal <= 0 ? (
            <p className="text-xs text-slate-600">
              Informe o Faturamento Mensal abaixo para calcular o Fator R (folha 12m ÷ receita 12m).
            </p>
          ) : fatorR >= 28 ? (
            <p className="text-xs text-emerald-900">
              Folha 12m ({formatarMoeda(folhaPagamentoMensal * 12)}) ≥ 28% da receita 12m:{' '}
              <strong>Anexo III garantido</strong> (alíquota inicial ~6%). Mantenha a proporção nos
              12 meses para não cair no Anexo V.
            </p>
          ) : (
            <p className="text-xs text-amber-900">
              <strong>Dica de pró-labore:</strong> eleve a folha (com pró-labore) em{' '}
              <strong>
                {formatarMoeda(Math.max(0, folhaNecessaria - folhaPagamentoMensal))}/mês
              </strong>{' '}
              — folha total de {formatarMoeda(folhaNecessaria)}/mês — para atingir 28% e migrar do
              Anexo V para o Anexo III (economia de até ~9,5 p.p. na alíquota inicial).
            </p>
          )}
        </div>

        {/* AVISO DE SUBLIMITE IBS (RBT12 ENTRE 3,6M E 4,8M) */}
        {emSublimite && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <TrafficCone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Sublimite de IBS/CBS atingido (R$ 3,6 milhões):</strong> com RBT12 de{' '}
              {formatarMoeda(rbt12)}, o IBS e a CBS passam a ser apurados{' '}
              <strong>por fora (regime regular)</strong> sobre a receita, com aproveitamento
              integral dos créditos — ICMS/ISS seguem no DAS-Simples.
            </p>
          </div>
        )}

        {/* AVISO DE PROXIMIDADE DO TETO (R$ 4,8M) */}
        {proximoTeto && !estourouTeto && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 leading-relaxed">
              <strong>Proximidade do teto do Simples (R$ 4,8 milhões):</strong> RBT12 em{' '}
              {((rbt12 / TETO_SIMPLES) * 100).toFixed(1)}% do limite. Ao ultrapassar o teto há{' '}
              <strong>exclusão obrigatória</strong> — o excesso passa a tributar pelo Lucro
              Presumido.
            </p>
          </div>
        )}
        {estourouTeto && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 leading-relaxed">
              <strong>Teto excedido:</strong> com RBT12 de {formatarMoeda(rbt12)} (acima de{' '}
              {formatarMoeda(TETO_SIMPLES)}), a empresa não pode permanecer no Simples —{' '}
              <strong>exclusão obrigatória</strong> (o excesso tributa pelo Lucro Presumido).
            </p>
          </div>
        )}

        {/* ALERTA VERMELHO: RISCO DE EXCLUSÃO DE OFÍCIO — OPTANTE + VEDAÇÃO INC. V (DÉBITO INSS/FAZENDA) */}
        {vedaInc5Ativa && (
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 leading-relaxed">
              <strong className="font-extrabold uppercase tracking-wide block">
                Risco de exclusão de ofício do Simples Nacional (art. 17, V)
              </strong>
              <span className="block mt-1">
                A empresa está <strong>optante</strong> do Simples Nacional e há{' '}
                <strong>débito com o INSS ou com as Fazendas Públicas</strong> (certidão positiva
                sem exigibilidade suspensa, sem parcelamento ou decisão judicial) registrado em
                Dados da Empresa. Nesse cenário, a Receita Federal pode promover a{' '}
                <strong>exclusão de ofício</strong> da empresa do regime.
              </span>
              {vedacaoSimplesArt17Outra.trim() && (
                <span className="block mt-1 font-semibold">
                  Registro livre associado: “{vedacaoSimplesArt17Outra.trim()}”
                </span>
              )}
              <span className="block mt-1.5 text-[11px] text-red-700">
                {BASE_LEGAL_VEDACOES_SIMPLES} Regularize ou suspenda a exigibilidade do débito
                (parcelamento ou decisão judicial) — a avaliação final é do especialista.
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------- MEI ----------
  if (regimeAtual === 'MEI (Microempreendedor)') {
    const estourouMei = rbt12 > LIMITE_MEI
    const proximoMei = !estourouMei && rbt12 >= LIMITE_MEI * 0.8

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-700" />
          <span className="text-sm font-bold text-[#07132B]">
            MEI — Bloco Simplificado do Microempreendedor Individual
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-white border border-blue-200">
            <p className="text-[11px] font-bold text-blue-800 uppercase">Guia fixa (DAS-MEI)</p>
            <p className="text-xs text-slate-600 mt-1">
              Valor fixo mensal por competência (INSS + ICMS/ISS), sem alíquota variável sobre a
              receita.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-blue-200">
            <p className="text-[11px] font-bold text-blue-800 uppercase">Limite anual</p>
            <p className="text-xs text-slate-600 mt-1">
              <strong>R$ 81.000,00</strong> de receita bruta (≈ {formatarMoeda(6750)}/mês).
              {rbt12 > 0 && (
                <>
                  {' '}
                  RBT12 estimada: <strong>{formatarMoeda(rbt12)}</strong>.
                </>
              )}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-blue-200">
            <p className="text-[11px] font-bold text-blue-800 uppercase">Atividades & regras</p>
            <p className="text-xs text-slate-600 mt-1">
              Somente ocupações autorizadas no CNPJ-MEI; até 1 empregado; sem pró-labore (retirada
              livre dentro do limite).
            </p>
          </div>
        </div>

        {estourouMei && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900">
              <strong>Limite MEI excedido:</strong> {formatarMoeda(rbt12)} &gt; R$ 81.000 — o{' '}
              <strong>desenquadramento para o Simples Nacional é obrigatório</strong> (comunicar à
              Receita; efeitos no ano-calendário da excessão conforme regra de desenquadramento).
            </p>
          </div>
        )}
        {!estourouMei && proximoMei && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              <strong>Aproximação do limite MEI:</strong> RBT12 em{' '}
              {((rbt12 / LIMITE_MEI) * 100).toFixed(1)}% de R$ 81.000. Planeje a migração para o
              Simples antes de estourar.
            </p>
          </div>
        )}

        {/* COMPARAÇÃO DE MIGRAÇÃO PARA O SIMPLES */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
          <p className="text-xs font-bold text-[#07132B] flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#2ECC71]" />
            Migração MEI → Simples Nacional (o que muda)
          </p>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-[11px] font-bold uppercase text-slate-400">
            <span />
            <span>MEI (hoje)</span>
            <span>Simples (após migração)</span>
          </div>
          <LinhaComparacao
            rotulo="Limite"
            mei="R$ 81.000/ano"
            simples="R$ 4,8 milhões/ano (sublimite IBS/CBS de R$ 3,6 mi)"
          />
          <LinhaComparacao
            rotulo="Guia"
            mei="DAS fixo mensal"
            simples="DAS variável: % sobre a receita por anexo (I, II, III, V)"
          />
          <LinhaComparacao
            rotulo="Enquadramento"
            mei="Tabela fixa de atividades"
            simples="Anexo conforme atividade; Fator R passa a valer para serviços"
          />
          <LinhaComparacao
            rotulo="Folha"
            mei="Até 1 empregado"
            simples="Sem limite de folha (CPP de 20% ou Fator R define o anexo)"
          />
          <LinhaComparacao
            rotulo="Crédito ao cliente"
            mei="Não gera crédito de IBS/CBS"
            simples="Optante do Simples gera crédito limitado (pós-2027)"
          />
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <Info className="w-3 h-3 inline mr-1 -mt-0.5 text-slate-400" />
            Ao desenquadrar, a RBT12 do Simples passa a contar a partir do mês seguinte
            (proporcional no 1º ano). Os campos de faturamento e folha abaixo já alimentam a
            comparação de regimes.
          </p>
        </div>
      </div>
    )
  }

  // ---------- LUCRO PRESUMIDO ----------
  if (regimeAtual === 'Lucro Presumido') {
    const pres = PRESUNCAO_SEGMENTO[segmento || ''] || {
      irpj: '8–32%',
      csll: '12–32%',
      nota: 'Presunção conforme a atividade específica do segmento',
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50/70 p-4 ring-2 ring-blue-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Landmark className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-blue-900 uppercase">
              Destaque: ISS da cidade (campos acima)
            </span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            <strong>{infoCidade.cidadeNome}</strong> — alíquota de ISS de{' '}
            <strong className="font-mono">{infoCidade.aliquota.toFixed(1)}%</strong> aplicada às
            notas de serviços. No Lucro Presumido o ISS é recolhido direto ao município (fora do
            DAS) — confira a cidade selecionada no bloco de Localização acima.
          </p>
        </div>
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50/70 p-4 ring-2 ring-blue-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Receipt className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-blue-900 uppercase">
              Destaque: presunção do segmento
            </span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            Segmento <strong>{segmento || 'não informado'}</strong>: presunção de{' '}
            <strong className="font-mono">{pres.irpj}</strong> para IRPJ e{' '}
            <strong className="font-mono">{pres.csll}</strong> para CSLL. {pres.nota}. A margem real
            acima da presunção aumenta a carga efetiva — compare com o Lucro Real no diagnóstico.
          </p>
        </div>
      </div>
    )
  }

  // ---------- LUCRO REAL ----------
  if (regimeAtual === 'Lucro Real') {
    const geradoras = (perfilInsumosAliquotaCheia || 0) + (perfilInsumosAliquotaReduzida || 0)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-violet-300 bg-violet-50/70 p-4 ring-2 ring-violet-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Boxes className="w-4 h-4 text-violet-700" />
            <span className="text-xs font-bold text-violet-900 uppercase">
              Destaque: despesas geradoras de crédito
            </span>
          </div>
          <p className="text-xs text-violet-950 leading-relaxed">
            Insumos creditáveis (cheia + reduzida):{' '}
            <strong className="font-mono">{geradoras.toFixed(1)}%</strong> das aquisições
            (monofásicos: {(perfilInsumosMonofasicos || 0).toFixed(1)}%). No Lucro Real{' '}
            <strong>toda despesa necessária gera crédito</strong> de PIS/COFINS e, na reforma, de
            IBS/CBS — mantenha o "Perfil de Insumos da Operação" abaixo atualizado.
          </p>
        </div>
        <div className="rounded-xl border-2 border-violet-300 bg-violet-50/70 p-4 ring-2 ring-violet-100">
          <div className="flex items-center gap-2 mb-1.5">
            <ShoppingCart className="w-4 h-4 text-violet-700" />
            <span className="text-xs font-bold text-violet-900 uppercase">
              Destaque: % de compras
            </span>
          </div>
          <p className="text-xs text-violet-950 leading-relaxed">
            Compras com fornecedores do Simples Nacional:{' '}
            <strong className="font-mono">
              {(porcentagemComprasSimplesNacional || 0).toFixed(1)}%
            </strong>
            . Fornecedor optante pelo Simples <strong>não repassa crédito integral</strong>{' '}
            (alíquota única reduzida) — quanto maior esse %, menor o aproveitamento de créditos no
            Real. Ajuste o campo de compras abaixo para calibrar o comparativo.
          </p>
        </div>
      </div>
    )
  }

  return null
}
