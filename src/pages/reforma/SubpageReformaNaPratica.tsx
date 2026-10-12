import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calculator,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Split,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Building2,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowDownRight,
  FileText,
  BadgeAlert,
  Receipt,
  RotateCcw,
  Store,
  Briefcase,
  Factory,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NavSection {
  id: string
  num: number
  titulo: string
  subtitulo: string
  icone: React.ComponentType<{ className?: string }>
}

const SECOES_NAV: NavSection[] = [
  {
    id: 'caminho-calculo',
    num: 1,
    titulo: 'Caminho do Cálculo',
    subtitulo: 'A ordem de 6 etapas',
    icone: Layers,
  },
  {
    id: 'operacao-incidencia',
    num: 2,
    titulo: 'Operação e Incidência',
    subtitulo: 'Classificação e regras',
    icone: Briefcase,
  },
  {
    id: 'base-calculo',
    num: 3,
    titulo: 'Base de Cálculo',
    subtitulo: 'O que soma e o que sai',
    icone: Calculator,
  },
  {
    id: 'calculo-4-passos',
    num: 4,
    titulo: 'Cálculo em 4 Passos',
    subtitulo: 'Exemplos por setor',
    icone: Store,
  },
  {
    id: 'aliquotas-excecoes',
    num: 5,
    titulo: 'Alíquotas e Exceções',
    subtitulo: 'Zero, redução e Simples',
    icone: Sparkles,
  },
  {
    id: 'credito-pratica',
    num: 6,
    titulo: 'Crédito na Prática',
    subtitulo: 'Apuração e 5 checagens',
    icone: CheckCircle2,
  },
  {
    id: 'situacoes-especiais',
    num: 7,
    titulo: 'Situações Especiais',
    subtitulo: 'Split Payment e devoluções',
    icone: Split,
  },
  {
    id: 'nota-fiscal',
    num: 8,
    titulo: 'Nota Fiscal Eletrônica',
    subtitulo: 'Campos novos e modelo visual',
    icone: Receipt,
  },
  {
    id: 'dere-plataformas',
    num: 9,
    titulo: 'DeRE e Plataformas',
    subtitulo: 'Regimes e intermediação',
    icone: FileSpreadsheet,
  },
  {
    id: 'mapa-decisao-erros',
    num: 10,
    titulo: 'Mapa de Decisão e Erros',
    subtitulo: '4 perguntas e 4 erros caros',
    icone: ShieldAlert,
  },
]

export default function SubpageReformaNaPratica() {
  const [secaoAtiva, setSecaoAtiva] = useState<string>('caminho-calculo')

  const scrollToSecao = (id: string) => {
    setSecaoAtiva(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER OFICIAL DIAMOND GROUP */}
      <DiamondHeader
        badge="MÓDULO 8 • OPERAÇÃO & CÁLCULO"
        titulo="Reforma na Prática — Operação e Cálculo"
        subtitulo="Guia operacional baseado nas Fichas Desenhadas Volume 2.2 da Diamond Group: a lógica de 6 etapas, base de cálculo, apuração de créditos, nota fiscal e mapa de decisão."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* CARD FIXO NO TOPO: CALENDÁRIO DAS OBRIGAÇÕES */}
        <div className="rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-6 sm:p-8 border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 mb-0.5">
                    Cronograma Regulatório Diamond
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                    Calendário das Obrigações
                  </h2>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                Linha do tempo oficial • 2026 a 2033
              </span>
            </div>

            {/* Grid dos 4 marcos obrigatórios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Marco 1: 2026 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-heading font-black text-[#D4AF37]">2026</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                      Fase Teste
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1.5">
                    Emissão da nota fiscal com destaque
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Emissão da nota com IBS e CBS destacados, sem recolher.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  Treino e validação de ERPs
                </div>
              </div>

              {/* Marco 2: Julho de 2026 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-heading font-black text-[#D4AF37]">
                      Jul / 2026
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded">
                      Cadastro PF
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1.5">Inscrição no CNPJ</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pessoa física contribuinte se inscreve no CNPJ.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  Produtor rural, autônomos e locadores
                </div>
              </div>

              {/* Marco 3: 2027 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-heading font-black text-[#D4AF37]">2027</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded">
                      Início Efetivo
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1.5">CBS e Seletivo em vigor</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    CBS e Imposto Seletivo passam a valer, PIS e COFINS extintos.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  Fim formal do PIS/COFINS
                </div>
              </div>

              {/* Marco 4: 2033 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-heading font-black text-[#D4AF37]">2033</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-400/20 text-purple-300 px-2 py-0.5 rounded">
                      Modelo Pleno
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1.5">Fim do ICMS e ISS</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ICMS e ISS extintos, modelo pleno.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  IVA Dual 100% no destino
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO RÁPIDA POR SEÇÕES (CARD INTERATIVO COM 10 ITENS) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#07132B] mb-1">
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                Sumário Operacional Diamond
              </div>
              <h3 className="text-lg font-heading font-bold text-[#07132B]">
                As 10 Seções Práticas de Operação e Cálculo
              </h3>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
              Clique para navegar direto
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {SECOES_NAV.map((item) => {
              const IconeComponente = item.icone
              const ativo = secaoAtiva === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSecao(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                    ativo
                      ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-md'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-[#D4AF37]/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        ativo
                          ? 'bg-[#D4AF37] text-[#07132B]'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      #{item.num}
                    </span>
                    <IconeComponente
                      className={`w-4 h-4 ${
                        ativo ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-[#D4AF37]'
                      }`}
                    />
                  </div>
                  <div>
                    <span
                      className={`block text-xs font-heading font-bold leading-tight ${
                        ativo ? 'text-white' : 'text-[#07132B]'
                      }`}
                    >
                      {item.titulo}
                    </span>
                    <span
                      className={`block text-[10px] mt-0.5 truncate ${
                        ativo ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitulo}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 1: CAMINHO DO CÁLCULO
            ======================================================== */}
        <div
          id="caminho-calculo"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Layers className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 1
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">01 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            1. Caminho do Cálculo — A ordem de 6 etapas
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            A ordem de 6 etapas:{' '}
            <strong>Operação → Incidência → Base → Cálculo → Crédito → Documento</strong>. Cada
            etapa decide a próxima, e pular uma etapa erra toda a conta.
          </p>

          {/* Stepper visual com 6 etapas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            {[
              {
                num: '1',
                nome: 'Operação',
                desc: 'Classificar o tipo exato do negócio realizado',
              },
              {
                num: '2',
                nome: 'Incidência',
                desc: 'Verificar se é onerosa, imune ou fora do campo',
              },
              {
                num: '3',
                nome: 'Base',
                desc: 'Aplicar adições e exclusões legais na base',
              },
              {
                num: '4',
                nome: 'Cálculo',
                desc: 'Multiplicar alíquotas de CBS e IBS sobre a base',
              },
              {
                num: '5',
                nome: 'Crédito',
                desc: 'Apuração e 5 checagens antes do aproveitamento',
              },
              {
                num: '6',
                nome: 'Documento',
                desc: 'Emissão da nota com destaque correto e total',
              },
            ].map((etapa, idx) => (
              <div
                key={etapa.num}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between hover:border-[#D4AF37] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                      {etapa.num}
                    </span>
                    {idx < 5 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden lg:block" />
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#07132B] mb-1">
                    {etapa.nome}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-snug">{etapa.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Regra de ouro Diamond Group:</strong> cada etapa decide a próxima. Se você
              pular para a alíquota antes de classificar a operação ou purificar a base de cálculo,
              toda a conta fiscal e os créditos do cliente serão invalidados.
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 2: OPERAÇÃO E INCIDÊNCIA
            ======================================================== */}
        <div
          id="operacao-incidencia"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Briefcase className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 2
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">02 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            2. Operação e Incidência
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Como classificar a operação primeiro (venda, serviço, locação, cessão, transferência,
            brinde). Regra geral: incide sobre operações onerosas com bens ou serviços. O que fica
            fora: exportações (imunes com crédito mantido), operações fora do campo de incidência.
            Grátis não é sinônimo de isento: brindes, bonificações e operações entre partes
            relacionadas têm regra própria. Momento do fato gerador: no fornecimento. Local: no
            destino, onde o bem ou serviço é consumido.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#07132B] uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Classificação da Operação & Regra Geral
              </div>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li>
                  • <strong>Tipos de operação:</strong> venda, serviço, locação, cessão,
                  transferência ou brinde.
                </li>
                <li>
                  • <strong>Regra geral:</strong> incide sobre operações onerosas com bens
                  materiais, imateriais ou serviços.
                </li>
                <li>
                  • <strong>O que fica fora:</strong> exportações (imunes com crédito mantido) e
                  operações fora do campo de incidência constitucional.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#07132B] uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Grátis não é Isento, Fato Gerador e Local
              </div>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li>
                  • <strong>Grátis não é sinônimo de isento:</strong> brindes, bonificações e
                  operações entre partes relacionadas têm regra própria de valor tributável.
                </li>
                <li>
                  • <strong>Momento do fato gerador:</strong> no fornecimento (entrega do bem ou
                  prestação do serviço).
                </li>
                <li>
                  • <strong>Local:</strong> no destino, onde o bem ou serviço é consumido (fim da
                  guerra fiscal na origem).
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 3: BASE DE CÁLCULO
            ======================================================== */}
        <div
          id="base-calculo"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Calculator className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 3
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">03 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            3. Base de Cálculo — O que soma e o que sai
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            A nova base de cálculo adota o princípio de cálculo "por fora". Saiba exatamente o que
            integra e o que deve ser expurgado do montante tributável.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* O QUE SOMA */}
            <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                O que SOMA na base
              </div>
              <ul className="text-xs sm:text-sm text-emerald-950 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Frete e seguro cobrados do adquirente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Taxas e encargos acessórios da operação</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Juros e multas ligados diretamente à venda</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Descontos condicionais (vinculados a evento futuro)</span>
                </li>
              </ul>
            </div>

            {/* O QUE SAI */}
            <div className="p-5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                O que SAI da base
              </div>
              <ul className="text-xs sm:text-sm text-rose-950 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    −
                  </span>
                  <span>IBS e CBS (cálculo por fora, imposto não incide sobre si mesmo)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    −
                  </span>
                  <span>IPI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    −
                  </span>
                  <span>Descontos incondicionais (destacados no documento)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    −
                  </span>
                  <span>ICMS / ISS / PIS / COFINS no período de transição</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    −
                  </span>
                  <span>Reembolsos por conta e ordem (com documento em nome do terceiro)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Destaque da diferença crucial */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#07132B]">
              Diferença crucial: Desconto Incondicional vs Desconto Condicional
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong>Desconto incondicional</strong> consta na nota fiscal e é imediato →{' '}
              <strong>sai da base</strong>.
              <br />
              <strong>Desconto condicional</strong> depende de evento futuro (ex.: pagar até o dia
              10) → <strong>fica na base</strong>.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200 text-xs font-semibold text-[#07132B]">
              💡 <strong>Exemplo prático:</strong> Venda de R$ 2.000 com desconto incondicional de
              R$ 200 → base começa em R$ 1.800.
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 4: CÁLCULO EM 4 PASSOS (EXEMPLOS POR SETOR)
            ======================================================== */}
        <div
          id="calculo-4-passos"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Store className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 4
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">04 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            4. Cálculo em 4 Passos — Exemplos práticos passo a passo
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Confira como apurar a base e os tributos no comércio, serviço e indústria. Os 4 passos
            universais:
            <strong> 1) Identificar adições e exclusões</strong> →{' '}
            <strong>2) Apurar a base líquida</strong> →{' '}
            <strong>3) Aplicar CBS (9%) e IBS (18%)</strong> →{' '}
            <strong>4) Totalizar o imposto</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Exemplo Comércio */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-[#D4AF37] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#D4AF37]" />
                    Comércio
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Venda de Mercadoria
                  </Badge>
                </div>
                <div className="font-mono text-xs text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div>Produto: R$ 5.000</div>
                  <div className="text-emerald-700">+ Frete: R$ 200</div>
                  <div className="text-emerald-700">+ Seguro: R$ 100</div>
                  <div className="text-rose-700">− Desc. incondicional: R$ 300</div>
                  <div className="text-rose-700">− ICMS transição: R$ 900</div>
                  <div className="pt-2 border-t border-slate-200 font-bold text-[#07132B]">
                    = Base: R$ 4.100
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">CBS (9%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 369,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IBS (18%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 738,00</span>
                </div>
                <div className="flex justify-between font-bold text-[#07132B] pt-1 border-t border-slate-200">
                  <span>Total apurado:</span>
                  <span className="font-mono text-[#D4AF37] text-sm">R$ 1.107,00</span>
                </div>
              </div>
            </div>

            {/* Exemplo Serviço */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-[#D4AF37] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                    Serviço
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Prestação de Serviço
                  </Badge>
                </div>
                <div className="font-mono text-xs text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div>Serviço: R$ 6.000</div>
                  <div className="text-emerald-700">+ Taxa acessória: R$ 300</div>
                  <div className="text-rose-700">− Desc. incondicional: R$ 300</div>
                  <div className="text-rose-700">− ISS transição: R$ 300</div>
                  <div className="pt-2 border-t border-slate-200 font-bold text-[#07132B]">
                    = Base: R$ 5.700
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">CBS (9%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 513,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IBS (18%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 1.026,00</span>
                </div>
                <div className="flex justify-between font-bold text-[#07132B] pt-1 border-t border-slate-200">
                  <span>Total apurado:</span>
                  <span className="font-mono text-[#D4AF37] text-sm">R$ 1.539,00</span>
                </div>
              </div>
            </div>

            {/* Exemplo Indústria */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-[#D4AF37] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-[#D4AF37]" />
                    Indústria
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Fabricação / Saída
                  </Badge>
                </div>
                <div className="font-mono text-xs text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div>Produto industrial: R$ 10.000</div>
                  <div className="text-emerald-700">+ Frete: R$ 200</div>
                  <div className="text-rose-700">− IPI: R$ 500</div>
                  <div className="text-rose-700">− Desconto: R$ 200</div>
                  <div className="pt-2 border-t border-slate-200 font-bold text-[#07132B]">
                    = Base: R$ 9.500
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">CBS (9%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 855,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IBS (18%):</span>
                  <span className="font-mono font-bold text-slate-900">R$ 1.710,00</span>
                </div>
                <div className="flex justify-between font-bold text-[#07132B] pt-1 border-t border-slate-200">
                  <span>Total apurado:</span>
                  <span className="font-mono text-[#D4AF37] text-sm">R$ 2.565,00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-700 space-y-2">
            <p>
              <strong>Observação técnica Indústria:</strong> O IPI zera em 2027 e fica fora da base
              de cálculo.
            </p>
            <p className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Aviso:</strong> Alíquotas de referência estimadas (CBS 9% e IBS 18% = 27%),
                ainda não oficiais, utilizadas para treinar a lógica operacional do cálculo.
              </span>
            </p>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 5: ALÍQUOTAS E EXCEÇÕES
            ======================================================== */}
        <div
          id="aliquotas-excecoes"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 5
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">05 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            5. Alíquotas e Exceções
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Alíquota zero (cesta básica), redução de 60% (saúde e educação), regimes específicos
            (combustíveis, financeiro). Simples no cálculo: Simples comum (recolhe tudo no DAS,
            passa pouco crédito) versus Simples Híbrido (recolhe IBS e CBS por fora no regime
            normal, passa crédito integral). Decisão: clientes que usam crédito pedem Híbrido;
            consumidor final, DAS comum resolve.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Alíquota Zero
              </div>
              <h4 className="font-heading font-bold text-sm text-[#07132B]">
                Cesta Básica Nacional
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Itens essenciais definidos em lei têm incidência zero de IBS e CBS, com manutenção
                integral dos créditos da cadeia anterior.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Redução de 60%
              </div>
              <h4 className="font-heading font-bold text-sm text-[#07132B]">Saúde e Educação</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Serviços de saúde humana, medicamentos essenciais e ensino regular pagam apenas 40%
                da alíquota de referência (~10,6%).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-800">
                Regimes Específicos
              </div>
              <h4 className="font-heading font-bold text-sm text-[#07132B]">
                Combustíveis & Financeiro
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tributação monofásica para combustíveis e margem de intermediação financeira,
                tratados via DeRE específica.
              </p>
            </div>
          </div>

          {/* Comparativo Simples Comum vs Simples Híbrido */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 space-y-4">
            <h4 className="text-sm font-heading font-extrabold text-[#07132B]">
              Simples no Cálculo: Comum vs Híbrido
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">Simples Comum</span>
                  <span className="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded">
                    B2C / Varejo
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recolhe tudo unificado dentro do DAS. Passa pouco crédito para quem compra (apenas
                  a parcela efetiva de IBS/CBS da alíquota do Simples).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#07132B] uppercase">
                    Simples Híbrido
                  </span>
                  <span className="text-[10px] bg-[#D4AF37] text-[#07132B] font-bold px-2 py-0.5 rounded">
                    B2B / Fornecedor
                  </span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  Recolhe IBS e CBS por fora no regime normal, apurando créditos e repassando
                  crédito integral de IBS e CBS ao cliente PJ.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#07132B] text-white text-xs leading-relaxed flex items-center justify-between gap-3">
              <span>
                🎯 <strong>Regra de Decisão Diamond:</strong> Clientes que usam crédito pedem
                Híbrido; se a empresa vende para consumidor final, o DAS comum resolve.
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 6: CRÉDITO NA PRÁTICA
            ======================================================== */}
        <div
          id="credito-pratica"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 6
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">06 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            6. Crédito na Prática — Apuração e 5 checagens
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            A apuração segue 4 passos lógicos simples. Em seguida, antes de validar o crédito na
            escrituração, execute obrigatoriamente as 5 checagens de segurança.
          </p>

          {/* Apuração em 4 passos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              {
                num: '1',
                titulo: 'Some créditos',
                desc: 'Some os créditos das compras de insumos e despesas',
              },
              {
                num: '2',
                titulo: 'Some débitos',
                desc: 'Some os débitos gerados pelas vendas faturadas',
              },
              {
                num: '3',
                titulo: 'Abata da conta',
                desc: 'Abata o valor do crédito do valor do débito',
              },
              {
                num: '4',
                titulo: 'Recolha a sobra',
                desc: 'Recolha apenas a diferença líquida ao Fisco',
              },
            ].map((p) => (
              <div key={p.num} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">Passo {p.num}</span>
                <h4 className="font-heading font-bold text-sm text-[#07132B] mt-1 mb-0.5">
                  {p.titulo}
                </h4>
                <p className="text-xs text-slate-600 leading-snug">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Exemplo numérico da apuração */}
          <div className="p-5 rounded-xl bg-slate-900 text-white mb-6 border border-[#D4AF37]/30">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
              Exemplo Numérico de Apuração
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-slate-400 block mb-1">Compra (Base R$ 4.000)</span>
                <div className="text-emerald-400 font-bold">+ Crédito CBS: R$ 360</div>
                <div className="text-emerald-400 font-bold">+ Crédito IBS: R$ 720</div>
                <div className="text-slate-300 pt-1 text-[11px]">Total crédito: R$ 1.080</div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-slate-400 block mb-1">Venda (Base R$ 6.000)</span>
                <div className="text-rose-400 font-bold">+ Débito CBS: R$ 540</div>
                <div className="text-rose-400 font-bold">+ Débito IBS: R$ 1.080</div>
                <div className="text-slate-300 pt-1 text-[11px]">Total débito: R$ 1.620</div>
              </div>

              <div className="bg-[#D4AF37]/20 p-3 rounded-lg border border-[#D4AF37]/40">
                <span className="text-[#D4AF37] font-bold block mb-1">Apuração Líquida</span>
                <div className="text-white font-bold">CBS a recolher: R$ 180</div>
                <div className="text-white font-bold">IBS a recolher: R$ 360</div>
                <div className="text-[#D4AF37] pt-1 text-sm font-black">
                  Total a recolher: R$ 540
                </div>
              </div>
            </div>
          </div>

          {/* As 5 checagens antes de tomar crédito */}
          <div className="space-y-3">
            <h4 className="text-sm font-heading font-extrabold text-[#07132B]">
              As 5 Checagens Antes de Tomar Crédito
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                'Operação anterior gerou débito?',
                'Débito foi pago ou extinto?',
                'Não é bem de uso ou consumo pessoal?',
                'Documento fiscal está correto?',
                'Operação permite crédito pela lei?',
              ].map((checagem, idx) => (
                <div
                  key={checagem}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#07132B] text-[#D4AF37] text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-800 font-medium leading-relaxed">
                    {checagem}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 7: SITUAÇÕES ESPECIAIS
            ======================================================== */}
        <div
          id="situacoes-especiais"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Split className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 7
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">07 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            7. Situações Especiais — Split Payment e Devoluções
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Mecanismos que afetam diretamente o fluxo financeiro da operação e o ajuste cadastral
            dos documentos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Split Payment */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                  <Split className="w-4 h-4 text-[#D4AF37]" />
                  Split Payment
                </span>
                <Link
                  to="/reforma-tributaria/split-payment"
                  className="text-[11px] font-bold text-[#07132B] hover:text-[#D4AF37] inline-flex items-center gap-1 underline"
                >
                  Ver módulo dedicado
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Imposto separado na hora do pagamento: garante recolhimento instantâneo pelo arranjo
                bancário e agiliza a liberação do crédito tributário de quem compra.
              </p>
            </div>

            {/* Cancelamento e Devolução */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#D4AF37]" />
                Cancelamento ou Devolução
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                O débito da venda é ajustado, o crédito é revisto pelo comprador, e o documento
                fiscal de devolução precisa conversar obrigatoriamente com o documento original
                referenciado.
              </p>
            </div>
          </div>

          {/* Ciclo Completo Compra -> Venda -> Apuração */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#07132B] to-[#0E2442] text-white border border-[#D4AF37]/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
              Ciclo Completo: Compra → Venda → Apuração (Exemplo Numérico)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[#D4AF37] font-bold block mb-1">1. Entrada (Compra)</span>
                <p className="text-slate-300">
                  Compra insumos de R$ 1.000 + R$ 270 (CBS/IBS). Gera crédito imediato de R$ 270.
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[#D4AF37] font-bold block mb-1">2. Saída (Venda)</span>
                <p className="text-slate-300">
                  Vende por R$ 2.500 + R$ 675 (CBS/IBS). Gera débito a recolher de R$ 675.
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[#D4AF37] font-bold block mb-1">3. Apuração</span>
                <p className="text-slate-300">
                  Débito R$ 675 − Crédito R$ 270 = R$ 405 recolhidos via split payment bancário.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 8: NOTA FISCAL ELETRÔNICA
            ======================================================== */}
        <div
          id="nota-fiscal"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <Receipt className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 8
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">08 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            8. Nota Fiscal Eletrônica — Passo a passo e Checklist
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Passo a passo dos campos novos: base por item, destaque do IBS e CBS por item, conferir
            total.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Checklist de Emissão */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Checklist de Emissão da Nota Fiscal
              </h4>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                {[
                  'Dados do emitente conferidos e atualizados',
                  'Dados do destinatário (com CNPJ ou CPF regular)',
                  'Informar base por item (com adições e deduções)',
                  'Destacar valor do IBS por item e no total',
                  'Destacar valor da CBS por item e no total',
                  'Conferir total da nota e valor líquido a faturar',
                ].map((item, idx) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modelo Visual da NF-e no estilo Diamond */}
            <div className="p-5 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/30 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[11px] font-bold text-[#D4AF37]">
                  DANFE • REPRESENTAÇÃO VISUAL DIAMOND
                </span>
                <span className="text-[10px] text-slate-400">MODELO NF-e 2026/2027</span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <div>EMITENTE: EMPRESA MODELO LTDA • CNPJ: 00.000.000/0001-00</div>
                <div>DESTINATÁRIO: CLIENTE EXEMPLO S/A • CNPJ: 11.111.111/0001-11</div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 text-[11px]">
                <div className="text-slate-400 font-bold border-b border-white/10 pb-1">
                  ITENS DA NOTA COM DESTAQUE DE IBS/CBS
                </div>
                <div className="flex justify-between">
                  <span>ITEM 01 • PRODUTO ALFA</span>
                  <span className="text-white font-bold">R$ 1.000,00</span>
                </div>
                <div className="flex justify-between text-slate-300 pl-3">
                  <span>└ Base Item: R$ 1.000,00</span>
                  <span>Alíq. IBS 18% | CBS 9%</span>
                </div>
                <div className="flex justify-between text-[#D4AF37] pl-3 font-bold">
                  <span>└ Destaque IBS: R$ 180,00</span>
                  <span>Destaque CBS: R$ 90,00</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-bold">
                <span className="text-slate-300">TOTAL DA NOTA:</span>
                <span className="text-[#D4AF37] text-sm">R$ 1.270,00</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso para 2026:</strong> Em 2026 emitir com alíquotas de teste (CBS 0,9% e
              IBS 0,1%), sem recolhimento e sem multa por erro de preenchimento.
            </span>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 9: DeRE E PLATAFORMAS
            ======================================================== */}
        <div
          id="dere-plataformas"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 9
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">09 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            9. DeRE e Plataformas
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Declaração dos Regimes Específicos (DeRE): para setores com tratamento próprio como
            financeiro, seguros, saúde, combustíveis. Quem entrega, prazo, dados, como conversa com
            IBS e CBS. Plataformas no radar: marketplace, quem vende, quem intermedeia, quem
            informa, qual documento é usado. A Reforma olha para quem vende e também para quem
            intermedeia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* DeRE */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
                Declaração dos Regimes Específicos (DeRE)
              </div>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li>
                  • <strong>Setores aplicáveis:</strong> financeiro, seguros, planos de saúde,
                  combustíveis e imóveis.
                </li>
                <li>
                  • <strong>Conteúdo declarado:</strong> apuração de margens agregadas, deduções
                  legais e créditos setoriais.
                </li>
                <li>
                  • <strong>Conversa com IBS e CBS:</strong> alimenta os dados para geração das
                  guias centralizadas no CGIBS e RFB.
                </li>
              </ul>
            </div>

            {/* Plataformas e Marketplaces */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
                <Store className="w-4 h-4 text-[#D4AF37]" />
                Plataformas no Radar do Fisco
              </div>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                <li>
                  • <strong>Papel do intermediador:</strong> marketplace, quem vende, quem
                  intermedeia, quem informa, qual documento é usado.
                </li>
                <li>
                  • <strong>Responsabilidade tributária:</strong> plataformas passam a ter
                  responsabilidade solidária ou de retenção na fonte.
                </li>
                <li>
                  • <strong>Foco da fiscalização:</strong> A Reforma olha para quem vende e também
                  para quem intermedeia.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 10: MAPA DE DECISÃO E ERROS
            ======================================================== */}
        <div
          id="mapa-decisao-erros"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-[#07132B]" />
              Seção 10
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">10 / 10</span>
          </div>

          <h2 className="text-2xl font-heading font-black text-[#07132B] mb-2">
            10. Mapa de Decisão e Erros
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Quadro prático para guiar a operação diária, blindar a empresa contra autuações e
            estruturar o plano de adaptação fiscal.
          </p>

          {/* As 4 perguntas do mapa de decisão */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#07132B]">
              Mapa de Decisão em 4 Perguntas Antes de Calcular Qualquer Operação
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { p: '1. Que operação é?', r: 'Venda, serviço, locação ou cessão?' },
                { p: '2. Ela incide?', r: 'É onerosa, imune ou fora do campo?' },
                { p: '3. Qual é a base?', r: 'Aplicou acréscimos e deduções legais?' },
                { p: '4. Quanto dá?', r: 'Multiplicou as alíquotas corretas no destino?' },
              ].map((item) => (
                <div key={item.p} className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <div className="font-heading font-black text-sm text-[#07132B] mb-1">
                    {item.p}
                  </div>
                  <div className="text-xs text-slate-600 leading-snug">{item.r}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Os 4 erros mais caros */}
          <div className="p-5 rounded-xl bg-rose-50/70 border border-rose-200 mb-6 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-950 flex items-center gap-2">
              <BadgeAlert className="w-4 h-4 text-rose-600" />
              Os 4 Erros Mais Caros da Reforma
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-rose-950">
              <div className="p-3 rounded-lg bg-white/80 border border-rose-200">
                <strong>1. Calcular antes de classificar a operação:</strong>
                <p className="text-xs text-rose-900 mt-0.5">
                  Aplicar alíquota sem saber a natureza exata da prestação ou fornecimento.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-rose-200">
                <strong>2. Colocar tudo na base sem verificar exclusões legais:</strong>
                <p className="text-xs text-rose-900 mt-0.5">
                  Tributar por dentro tributos federais ou municipais que devem ser expurgados.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-rose-200">
                <strong>3. Tirar valores da base sem documento fiscal comprobatório:</strong>
                <p className="text-xs text-rose-900 mt-0.5">
                  Dedução indevida sem comprovação gera glosa e multa automática de até 75%.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-rose-200">
                <strong>4. Tomar crédito de forma automática sem checagens:</strong>
                <p className="text-xs text-rose-900 mt-0.5">
                  Aproveitar crédito financeiro sem confirmação da liquidação da etapa anterior.
                </p>
              </div>
            </div>
          </div>

          {/* Plano de Adaptação */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#07132B]">
              Plano de Adaptação Diamond Group
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                {
                  t: '1. Mapear operações',
                  d: 'Levantar todas as linhas de venda e compra da empresa',
                },
                { t: '2. Ajustar sistema', d: 'Adequar ERP e software de emissão de notas' },
                { t: '3. Treinar equipe', d: 'Capacitar o time fiscal e contábil nas 6 etapas' },
                {
                  t: '4. Revisar preços e margem',
                  d: 'Recalcular a formação de preço considerando o cálculo por fora',
                },
                {
                  t: '5. Organizar créditos',
                  d: 'Implantar rotina de conferência das 5 checagens',
                },
                {
                  t: '6. Acompanhar normas',
                  d: 'Acompanhar a regulamentação do Comitê Gestor e RFB',
                },
              ].map((plano) => (
                <div key={plano.t} className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-[#07132B] block mb-0.5">{plano.t}</span>
                  <span className="text-slate-600">{plano.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================
            FONTES E ATUALIZAÇÃO
            ======================================================== */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            Bases Oficiais & Alinhamento
          </div>
          <h3 className="text-xl font-heading font-black text-white mb-2">
            Fontes e Atualização Oficial
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Conteúdo elaborado e atualizado com base nas fontes públicas oficiais:{' '}
            <strong>LC 214/2025</strong>, <strong>Receita Federal do Brasil</strong>,{' '}
            <strong>Comitê Gestor do IBS (CGIBS)</strong> e <strong>Notas Técnicas do ENCAT</strong>
            .
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Aviso Importante Diamond Group:</strong>
              A Reforma Tributária ainda se ajusta por decretos, convênios e instruções normativas.
              A fonte oficial é sempre a palavra final para atos de apuração definitiva.
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CTA CONSULTIVO (DIRECIONANDO PARA A CALCULADORA IBS/CBS) */}
      <DiamondFooterCTA
        titulo="Quer simular a operação e o cálculo exato na sua empresa?"
        subtitulo="Utilize nossa Calculadora IBS/CBS com os 6 módulos interligados para simular alíquotas, créditos de fornecedores e a transição 2026-2033."
      />
    </div>
  )
}
