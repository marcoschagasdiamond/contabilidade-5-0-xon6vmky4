import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Split,
  Coins,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  FileCheck2,
  Scale,
  ShieldAlert,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { formatarMoeda } from '@/lib/calculadoraUtils'

export default function SubpageSplitPayment() {
  // Simulador interativo embutido para o usuário experimentar na subpágina
  const [valorNota, setValorNota] = useState<number>(10000)
  const [prazoRecebimentoDias, setPrazoRecebimentoDias] = useState<number>(60)
  const [taxaMensalJuros, setTaxaMensalJuros] = useState<number>(1.0)
  const aliquotaIbsCbs = 0.265 // 26,5% IVA Dual padrão de referência

  // Cálculos do exemplo interativo
  const impostoRetido = valorNota * aliquotaIbsCbs // R$ 2.650 para R$ 10.000
  const valorLiquidoRecebido = valorNota - impostoRetido // R$ 7.350
  // Custo de oportunidade de adiantar o imposto no fluxo:
  // No modelo antigo, a empresa recebia a totalidade e recolhia apenas no dia 20 do mês seguinte à apuração.
  // Prazo de carrego do tributo perdido: prazoRecebimentoDias / 30 * taxaMensal
  const custoFinanceiroPerdido =
    impostoRetido * ((taxaMensalJuros / 100) * (prazoRecebimentoDias / 30))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER PADRÃO DIAMOND GROUP */}
      <DiamondHeader
        badge="MÓDULO 7 • FLUXO DE CAIXA"
        titulo="Split Payment na Reforma Tributária"
        subtitulo="A retenção do IBS e da CBS no ato da liquidação financeira: o que muda na prática, impactos no capital de giro, exemplos numéricos e como preparar sua empresa."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* BLOCO 1: CONCEITO — O QUE É O SPLIT PAYMENT E O QUE MUDA NA PRÁTICA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <Split className="w-3.5 h-3.5" />
            Conceito Fundamental
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-4">
            O que é o Split Payment e o que muda na prática?
          </h2>
          <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
            <p>
              No sistema tributário atual, quando uma empresa vende uma mercadoria ou presta um
              serviço, ela emite a nota fiscal, recebe o valor <strong>integral</strong> pago pelo
              cliente na sua conta bancária e só recolhe os tributos (PIS, COFINS, ICMS, ISS ou guia
              única do Simples Nacional) semanas ou meses depois — normalmente até o dia 20 do mês
              seguinte à emissão.
            </p>
            <p>
              Com a Reforma Tributária (<strong>EC 132/2023</strong> regulamentada pela{' '}
              <strong>LC 214/2025</strong>), entra em cena o <strong>Split Payment</strong>{' '}
              (pagamento fracionado instantâneo). Pelo novo mecanismo, as instituições financeiras,
              operadoras de cartão, gateways de pagamento e arranjos do Banco Central segregam o
              imposto destacado na nota fiscal{' '}
              <strong>no momento exato em que o pagamento é liquidado</strong>.
            </p>
          </div>

          {/* Destaque visual: Antes vs Depois */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Modelo Atual (Até 2026)
                </span>
                <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  Apuração Mensal
                </span>
              </div>
              <p className="text-lg font-heading font-bold text-slate-900">
                100% entra no caixa da empresa
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                O cliente paga R$ 10.000, caem R$ 10.000 na conta corrente. A empresa utiliza esse
                montante como capital de giro temporário até pagar a guia no dia 20 do mês seguinte.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-amber-50/70 border border-[#D4AF37]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Novo Modelo Split Payment (IBS/CBS)
                </span>
                <span className="text-[10px] font-bold bg-[#D4AF37] text-[#07132B] px-2 py-0.5 rounded">
                  Retenção Automática
                </span>
              </div>
              <p className="text-lg font-heading font-bold text-[#07132B]">
                Apenas o líquido entra na conta
              </p>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                O cliente paga R$ 10.000 via Pix, boleto ou cartão: a instituição retém
                automaticamente R$ 2.650 e envia ao Fisco; apenas R$ 7.350 são disponibilizados na
                conta corrente da empresa.
              </p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: IMPACTO NO FLUXO DE CAIXA E EXEMPLO NUMÉRICO COMPARATIVO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <Clock className="w-3.5 h-3.5" />
            Impacto no Capital de Giro
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-3">
            O fim do "carrego" de tributos e o capital de giro
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
            Muitas empresas utilizam sem perceber o "float" tributário: o dinheiro do imposto ficava
            rendendo em aplicações financeiras ou cobrindo contas do dia a dia por 30 a 60 dias. Com
            o split payment, esse prazo desaparece.
          </p>

          {/* SIMULADOR DIDÁTICO INTERATIVO */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#07132B] to-[#0E2442] text-white border border-[#D4AF37]/30 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Exemplo Numérico Dinâmico: Simule Sua Operação
              </div>
              <span className="text-[11px] text-slate-300">Alíquota IBS/CBS: 26,50%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* Input Valor da Nota */}
              <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <Label
                  htmlFor="valorNotaInput"
                  className="text-xs text-slate-300 font-semibold block"
                >
                  Valor da Venda / Fatura (R$)
                </Label>
                <Input
                  id="valorNotaInput"
                  type="number"
                  min="1000"
                  step="1000"
                  value={valorNota}
                  onChange={(e) => setValorNota(Math.max(0, Number(e.target.value)))}
                  className="bg-white/10 border-white/20 text-white font-mono font-bold h-9 text-sm"
                />
                <span className="text-[10px] text-slate-400">Ex.: Venda a prazo B2B</span>
              </div>

              {/* Slider Prazo de Recebimento */}
              <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Prazo de Recebimento
                  </Label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">
                    {prazoRecebimentoDias} dias
                  </span>
                </div>
                <Slider
                  value={[prazoRecebimentoDias]}
                  min={15}
                  max={120}
                  step={15}
                  onValueChange={(val) => setPrazoRecebimentoDias(val[0])}
                  className="py-1"
                />
                <span className="text-[10px] text-slate-400">
                  Intervalo entre venda e liquidação
                </span>
              </div>

              {/* Slider Custo do Capital */}
              <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Custo do Capital / CDI
                  </Label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">
                    {taxaMensalJuros.toFixed(2)}% a.m.
                  </span>
                </div>
                <Slider
                  value={[taxaMensalJuros]}
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  onValueChange={(val) => setTaxaMensalJuros(val[0])}
                  className="py-1"
                />
                <span className="text-[10px] text-slate-400">Taxa de oportunidade mensal</span>
              </div>
            </div>

            {/* Resultado do Exemplo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-300 block mb-1">
                  Imposto Retido na Fonte
                </span>
                <p className="text-xl font-mono font-bold text-[#D4AF37]">
                  {formatarMoeda(impostoRetido)}
                </p>
                <span className="text-[10px] text-slate-400">Enviado direto ao Comitê/Receita</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-300 block mb-1">
                  Líquido Creditado na Conta
                </span>
                <p className="text-xl font-mono font-bold text-white">
                  {formatarMoeda(valorLiquidoRecebido)}
                </p>
                <span className="text-[10px] text-slate-400">Disponível para a empresa</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-[11px] text-rose-300 block mb-1">
                  Perda Financeira do Carrego
                </span>
                <p className="text-xl font-mono font-bold text-rose-400">
                  {formatarMoeda(custoFinanceiroPerdido)}
                </p>
                <span className="text-[10px] text-rose-300/80">
                  Em {prazoRecebimentoDias} dias a {taxaMensalJuros}% a.m.
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              <strong>Cenário B2B a prazo:</strong> se sua empresa emitir uma nota de R$ 10.000 em
              01/07 com vencimento em 60 dias (30/08), hoje o imposto seria apurado e recolhido em
              20/08. Com o split payment, o imposto só sai quando o cliente quitar a fatura em 30/08
              — ou seja,{' '}
              <em>a empresa não precisa desembolsar do próprio bolso antes de receber</em>.
            </p>
            <p className="text-slate-600">
              Contudo, no momento do recebimento, o valor já chega descontado de R$ 2.650,
              eliminando a possibilidade de utilizar esse montante para cobrir folha ou fornecedores
              no curto prazo.
            </p>
          </div>
        </div>

        {/* BLOCO 3: QUEM MAIS SENTE E PERFIS DE RISCO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            Matriz de Sensibilidade
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-2">
            Quais setores e perfis sentem mais a mudança?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            O impacto não é uniforme: varia conforme o prazo médio de cobrança, a margem de lucro e
            a dependência de capital de giro.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Perfil 1 */}
            <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Alto Impacto
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <h3 className="font-heading font-bold text-base text-rose-950">
                Margem Fina e Prazos Longos
              </h3>
              <p className="text-xs text-rose-900 leading-relaxed">
                Distribuidores, atacadistas e revendedores B2B que concedem 60 a 90 dias de prazo
                para clientes e operam com margens de 3% a 7%. A perda da liquidez sobre o tributo
                pode exigir linhas de crédito emergenciais.
              </p>
              <div className="pt-2 border-t border-rose-200 text-[11px] font-semibold text-rose-900">
                Risco: compressão severa de liquidez
              </div>
            </div>

            {/* Perfil 2 */}
            <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Médio Impacto
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <h3 className="font-heading font-bold text-base text-amber-950">
                Prestadores de Serviços com Folha Alta
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Empresas de TI, engenharia, consultoria e facilities. Como a folha salarial não gera
                crédito de IBS/CBS, o volume a ser retido na fonte no momento do faturamento aos
                clientes é significativo.
              </p>
              <div className="pt-2 border-t border-amber-200 text-[11px] font-semibold text-amber-900">
                Risco: desencontro entre folha e recebimentos
              </div>
            </div>

            {/* Perfil 3 */}
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Impacto Neutro / Benéfico
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <h3 className="font-heading font-bold text-base text-emerald-950">
                Varejo B2C à Vista ou Cartão Curto
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Comércio varejista que já recebe via Pix e cartão em D+1 ou D+2 e paga fornecedores
                a prazo. Elimina de vez o risco de atrasar guias fiscais e arcar com multas
                moratórias e juros Selic.
              </p>
              <div className="pt-2 border-t border-emerald-200 text-[11px] font-semibold text-emerald-900">
                Vantagem: conformidade fiscal 100% garantida
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 4: COMO SE PREPARAR — PLANO DE AÇÃO CONSULTIVO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <FileCheck2 className="w-3.5 h-3.5" />
            Recomendações Práticas Diamond Group
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-2">
            Como preparar sua empresa antes de 2027?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            A adaptação ao split payment não exige apenas ajustes de software: exige reestruturação
            financeira estratégica.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0 font-bold text-sm">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  Mapear prazos médios de recebimento (PMR) e pagamento (PMP)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calcule com exatidão quantos dias decorrem entre a entrega do serviço/produto e a
                  entrada efetiva do dinheiro no caixa para estimar o novo ciclo financeiro líquido.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0 font-bold text-sm">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  Recalcular a necessidade de Capital de Giro (NCG)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Construa um colchão de segurança de capital próprio para o primeiro mês de
                  implantação da CBS (2027), evitando recorrer a cheque especial ou antecipação cara
                  de recebíveis.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0 font-bold text-sm">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  Renegociar contratos e prazos com fornecedores
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se os seus clientes pagam com retenção na fonte, seus pagamentos a fornecedores
                  também deverão ter prazos alinhados com a liquidez real das faturas.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0 font-bold text-sm">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm text-[#07132B]">
                  Simular o impacto exato na Calculadora IBS/CBS
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Utilize o módulo dedicado de Split Payment da nossa plataforma para calcular a
                  taxa de capital de giro e o custo financeiro anual projetado para o seu
                  faturamento real.
                </p>
              </div>
            </div>
          </div>

          {/* BANNER COM CTA PARA A CALCULADORA IBS/CBS */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white border border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 uppercase">
                Ferramenta Completa
              </span>
              <h3 className="text-lg font-heading font-bold text-white">
                Simule o Split Payment com os dados reais da sua empresa
              </h3>
              <p className="text-xs text-slate-300">
                A Calculadora IBS/CBS possui controles de taxa de capital de giro (% a.m.) e dias de
                antecipação.
              </p>
            </div>
            <Link
              to="/calculadora-ibs-cbs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-md transition-all shrink-0"
            >
              Abrir Calculadora IBS/CBS
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* BLOCO 5: MITIGADORES PREVISTOS NA LEGISLAÇÃO E O QUE DEPENDE DE REGULAMENTAÇÃO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-4">
            <Scale className="w-3.5 h-3.5" />
            Segurança Jurídica & Realidade Técnica
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#07132B] mb-2">
            Mitigadores na LC 214/2025 e regulamentação pendente
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Com transparência consultiva Diamond Group: entenda o que a lei já garante e o que ainda
            depende de normas complementares do Comitê Gestor e do Banco Central.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#07132B]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Modalidade de destaque simplificado e apuração mensal (Já previsto em lei)
                </span>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                A LC 214/2025 prevê que o split payment poderá operar de forma simplificada em
                certas operações onde a retenção direta for tecnicamente inviável, aplicando-se
                regras de recolhimento periódico garantido.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#07132B]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tratamento da inadimplência e estorno de retenções (Em regulamentação)</span>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                Se o cliente não pagar a fatura, o tributo não é retido via split payment. A lei
                estabelece que a perda de recebimento poderá ensejar estorno do débito
                correspondente ou compensação automática, com prazos e procedimentos detalhados a
                serem fixados pelo CGIBS e pela RFB.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>
                  Compensação instantânea com créditos acumulados (Em desenvolvimento pelo CGIBS)
                </span>
              </div>
              <p className="text-xs text-amber-950/80 pl-6 leading-relaxed">
                A intenção declarada do Comitê Gestor é permitir que empresas que possuam saldo
                credor de compras tenham a retenção do split payment abatida ou zerada em tempo real
                no ato da venda. Esse sistema em nuvem está em fase de homologação técnica.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-300/80 text-xs text-slate-700">
            <strong className="text-slate-900 block mb-1">Nota Técnica Diamond Group:</strong>
            Não prometa nem adote regras contábeis baseadas em suposições. O cronograma oficial
            prevê os primeiros testes de split payment em 2026/2027, momento em que o Banco Central
            e a Receita publicarão as portarias operacionais definitivas para cada meio de pagamento
            eletrônico.
          </div>
        </div>
      </div>

      {/* FOOTER CTA CONSULTIVO */}
      <DiamondFooterCTA
        titulo="Quer avaliar a necessidade de capital de giro da sua empresa?"
        subtitulo="Nossa equipe de consultoria tributária analisa seus prazos de recebimento e modela o impacto real do Split Payment no seu caixa."
      />
    </div>
  )
}
