import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { FreemiumBadge } from '@/components/freemium/FreemiumBadge'
import { TermoPPLI, formatarTextoComPPLI } from '@/components/diagnosticos/TermoPPLI'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { URL_SISTEMA_ANALISE_FINANCEIRA } from '@/lib/configSistemasExternos'

// Definição completa dos 7 riscos extraídos com rigor do PDF da Diamond Intelligence
export interface Risco360Item {
  id: number
  slug: string
  nome: string
  subtitulo: string
  citacaoTecnica: string
  focoAtual: string
  focoNovoCodigo?: string
  entregavel: string
  perguntaAutoavaliacao: string
  perguntaProtecaoControle: string
  dicaPriorizacao: string
}

export const SETE_RISCOS_360: Risco360Item[] = [
  {
    id: 1,
    slug: 'financeiro-credito',
    nome: '1. Financeiro & Crédito',
    subtitulo: 'Liquidez, Rentabilidade, Expansão, M&A e Captação',
    citacaoTecnica:
      'No plano técnico, a análise da capacidade de pagamento mensal, índices de liquidez, fluxo de caixa projetado e endividamento resultante destrava limites de crédito e viabiliza novos negócios, fusões, aquisições e planos de expansão com segurança. No plano estratégico, estruturar o dossiê corporativo habilita captações competitivas junto a bancos nacionais e internacionais com taxas reduzidas e garantias sólidas.',
    focoAtual:
      'Liquidez corrente e seca, rentabilidade sobre vendas, capital de giro líquido, ciclo operacional, capacidade de pagamento mensal, prontidão para crédito corporativo e verificação de viabilidade financeira de novos negócios, fusões, aquisições e expansão.',
    focoNovoCodigo:
      'Análise do impacto da não-cumulatividade plena e do Split Payment sobre a necessidade de capital de giro (NCG), capacidade de pagamento e margens operacionais em projetos de expansão.',
    entregavel:
      'Dossiê de Prontidão para Crédito e Captação Bancária + Matriz de Capacidade de Pagamento Mensal, viabilidade financeira de novos negócios/expansão e reestruturação do capital de giro.',
    perguntaAutoavaliacao:
      'A empresa monitora sua capacidade mensal de pagamento, liquidez, capital de giro e o impacto de novos negócios ou expansão (fluxo de caixa projetado e endividamento resultante) sem estrangular o caixa?',
    perguntaProtecaoControle:
      'Existe política ativa de crédito, captação bancária e análise prévia de viabilidade financeira e capacidade de pagamento para fusão, aquisição e expansão, ou a empresa recorre a linhas emergenciais e expansões no escuro?',
    dicaPriorizacao:
      'Impacto Alto • Risco Alto • Esforço Médio → Otimização de liquidez, expansão e crédito',
  },
  {
    id: 2,
    slug: 'investimentos-wealth',
    nome: '2. Investimentos & Wealth',
    subtitulo: 'Alocação de Excedentes, Risco/Retorno e Parcerias',
    citacaoTecnica:
      'No plano técnico, a gestão de excedentes de caixa exige conciliar retorno real acima da inflação com liquidez imediata para oportunidades táticas. No plano de governança patrimonial, parcerias com bancos de primeira linha e apólices estruturadas (como seguros PPLI offshore via 1291 Group) protegem a reserva contra desvalorização, tributação e eventos imprevistos.',
    focoAtual:
      'Alocação eficiente de sobras de caixa, equilíbrio risco/retorno dos ativos líquidos e parcerias com bancos e seguradoras internacionais para produtos estruturados (incluindo seguros PPLI).',
    focoNovoCodigo:
      'Proteção contra oscilações de custos da transição tributária por meio de reservas de contingência blindadas e rentáveis.',
    entregavel:
      'Política de Gestão de Caixa e Excedentes Corporativos + Arquitetura de alocação risco/retorno e parcerias internacionais para custódia e estruturação (bancos globais e seguros PPLI).',
    perguntaAutoavaliacao:
      'Os excedentes de caixa da empresa são alocados estrategicamente considerando a relação risco/retorno e preservação de liquidez?',
    perguntaProtecaoControle:
      'A empresa possui parcerias formalizadas com bancos e seguradoras para proteger o capital e rentabilizar as sobras de tesouraria?',
    dicaPriorizacao:
      'Impacto Médio/Alto • Risco Médio • Esforço Baixo/Médio → Rentabilidade de excedentes',
  },
  {
    id: 3,
    slug: 'societario-parcerias',
    nome: '3. Societário & Parcerias — Risco Hub',
    subtitulo: 'Due Diligence de Sócios, Parceiros e Blindagem Contratual',
    citacaoTecnica:
      'No plano de governança corporativa, o Risco Hub mapeia a integridade, reputação e solvência de sócios, parceiros estratégicos e co-investidores antes de alianças e joint ventures. Blindar os contratos societários e estabelecer regras claras de saída e governança impede a contaminação patrimonial por passivos de terceiros.',
    focoAtual:
      'Due diligence rigorosa de sócios e parceiros comerciais (Risco Hub), histórico fiscal e reputacional de co-investidores e blindagem contratual nas relações societárias.',
    focoNovoCodigo:
      'Estruturação societária resiliente para reorganizações patrimoniais, cisões e blindagem de participações no ambiente da reforma.',
    entregavel:
      'Relatório de Due Diligence de Sócios e Parceiros (Risco Hub) + Matriz de Integridade Societária com cláusulas de blindagem contratual.',
    perguntaAutoavaliacao:
      'A empresa realiza due diligence aprofundada de sócios e parceiros de negócios (Risco Hub) quanto à idoneidade e solvência antes de formalizar acordos ou sociedades?',
    perguntaProtecaoControle:
      'Os contratos societários e de parcerias contam com mecanismos formais de blindagem, acordos de sócios e regras claras de saída/dissolução?',
    dicaPriorizacao:
      'Impacto Crítico • Risco Alto • Esforço Médio → Proteção societária e parcerias seguras',
  },
  {
    id: 4,
    slug: 'fiscal-contabil',
    nome: '4. Fiscal & Contábil',
    subtitulo: 'Obrigações Corretas, Eficiência, Conciliações e Fechamento',
    citacaoTecnica:
      'No plano técnico, conciliações financeiras diárias e fechamento contábil mensal preciso garantem demonstrações financeiras (Balanço e DRE) inquestionáveis. No compliance fiscal, auditar as obrigações acessórias afasta autuações da Receita e assegura distribuição de lucros isenta.',
    focoAtual:
      'Cumprimento tempestivo e correto de obrigações fiscais e contábeis, eficiência da rotina de contabilidade, conciliações bancárias rigorosas e fechamento mensal auditável.',
    focoNovoCodigo:
      'Adequação contábil e fiscal para contabilização do IVA Dual (IBS/CBS) e conciliação do Split Payment com os extratos bancários.',
    entregavel:
      'Diagnóstico de Eficiência Contábil e Fiscal + Roteiro de saneamento de conciliações, fechamento contábil fidedigno e auditoria de obrigações acessórias.',
    perguntaAutoavaliacao:
      'As obrigações fiscais e contábeis da empresa são entregues sem divergências e as conciliações e fechamentos mensais refletem 100% da operação?',
    perguntaProtecaoControle:
      'A contabilidade opera com rotinas automatizadas e revisões periódicas que impedem erros em fechamentos e autuações do Fisco?',
    dicaPriorizacao:
      'Impacto Alto • Risco Alto • Esforço Médio → Base contábil fidedigna e sem multas',
  },
  {
    id: 5,
    slug: 'tributario',
    nome: '5. Tributário',
    subtitulo: 'Estratégia, Redução e Novo Código',
    citacaoTecnica:
      'No plano técnico, a revisão tributária estanca o pagamento indevido, recupera créditos adormecidos e injeta caixa imediato na operação. No plano sistêmico e energético, o tributo é a "energia financeira" que a empresa devolve ao ambiente de forma compulsória; otimizar essa carga de forma legal significa fechar "vazamentos de energia", retendo a abundância e a vitalidade dentro do negócio para financiar seu próprio motor de crescimento e inovação.',
    focoAtual:
      'Revisão do regime vigente (Presumido vs. Real), eficiência da carga sobre a margem, identificação de passivos e parcelados irregularmente.',
    focoNovoCodigo:
      'Simulação do impacto do IBS (Imposto sobre Bens e Serviços), CBS (Contribuição sobre Bens e Serviços) e IS (Imposto Seletivo) na cadeia produtiva da empresa.',
    entregavel:
      'Mapa de teses para recuperação imediata de impostos pagos a maior (injeção de liquidez) + Estudo de Cenários Tributários (Modelagem de Transição) para definir o melhor enquadramento societário e logístico no novo modelo.',
    perguntaAutoavaliacao:
      'Sua empresa já revisou se está pagando impostos a mais nos últimos 5 anos ou se o regime atual corrói a margem líquida?',
    perguntaProtecaoControle:
      'Existe revisão periódica de créditos e teses tributárias, ou os valores pagos a maior ficam sem recuperação?',
    dicaPriorizacao: 'Impacto Alto • Risco Alto • Esforço Médio → Injeção imediata de liquidez',
  },
  {
    id: 6,
    slug: 'juridico',
    nome: '6. Jurídico',
    subtitulo: 'Contingências, Contratos e Proteção',
    citacaoTecnica:
      'No plano técnico, a inteligência jurídica mapeia litígios em instâncias críticas (como bloqueios e execuções) e implementa estruturas sólidas e internacionais (como Holdings e seguros PPLI) para isolar responsabilidades. No plano sistêmico, a proteção jurídica estabelece a "fronteira de segurança" do fundador; ao separar o risco inerente do negócio do legado familiar, você devolve paz de espírito aos sócios, permitindo que liderem o mercado com agressividade estratégica, livres do medo da ruína pessoal.',
    focoAtual:
      'Mapeamento de litígios (trabalhistas, cíveis, tributários), análise societária e exposição do patrimônio familiar.',
    focoNovoCodigo:
      'Revisão de contratos de longo prazo com fornecedores e clientes para incluir cláusulas de repasse/ajuste de custos tributários decorrentes da reforma.',
    entregavel:
      'Trilha de auditoria para litígios, aditivos contratuais de proteção tributária e desenho de Blindagem Patrimonial e Sucessória (Holdings, seguros PPLI via Diamond Investments, acordos de quotistas).',
    perguntaAutoavaliacao:
      'O patrimônio pessoal dos sócios está separado dos riscos operacionais do CNPJ e os contratos contêm cláusula de repasse tributário?',
    perguntaProtecaoControle:
      'Existem holdings/contratos formalizados protegendo o patrimônio pessoal dos sócios?',
    dicaPriorizacao:
      'Impacto Crítico • Risco Alto • Esforço Médio → Proteção patrimonial familiar e contratual',
  },
  {
    id: 7,
    slug: 'operacional-humano-cultura',
    nome: '7. Operacional, Humano & Cultura',
    subtitulo: 'POPs, Capacitação e Cultura como Condicionante de Mudanças',
    citacaoTecnica:
      'No plano técnico, procedimentos operacionais padrão (POPs) documentados erradicam falhas manuais e retrabalho. No plano cultural e humano, a cultura corporativa e a capacitação contínua são os condicionantes reais do sucesso de qualquer transição: se a equipe não comprar o porquê dos processos, a governança falha.',
    focoAtual:
      'Mapeamento e formalização de Procedimentos Operacionais Padrão (POPs), maturidade técnica das equipes operacionais e cultura corporativa alinhada à governança.',
    focoNovoCodigo:
      'Capacitação do time para faturamento dual, conferências automáticas e engajamento da equipe na transição fiscal e de processos.',
    entregavel:
      'Manual de Procedimentos Operacionais Padrão (POPs) + Programa de Capacitação e Alinhamento Cultural para sustentabilidade das mudanças.',
    perguntaAutoavaliacao:
      'As rotinas operacionais possuem POPs documentados e a cultura da equipe favorece a adaptação rápida a novas exigências e mudanças?',
    perguntaProtecaoControle:
      'Existe programa contínuo de capacitação e auditoria de processos para garantir que os POPs sejam cumpridos e a cultura não sabote as melhorias?',
    dicaPriorizacao:
      'Impacto Alto • Risco Médio • Esforço Médio → Sustentação operacional e cultural',
  },
]

// Mapeamento retrocompatível para diagnósticos antigos com frentes legadas
// Tributário (1) -> 5 (Tributário)
// Fiscal (2) -> 4 (Fiscal & Contábil)
// Financeiro (3) -> 1 (Financeiro & Crédito)
// Contábil (4) -> 4 (Fiscal & Contábil)
// Jurídico (5) -> 6 (Jurídico)
// Operacional (6) -> 7 (Operacional, Humano & Cultura)
// Humano (7) -> 7 (Operacional, Humano & Cultura)
export const MAPA_RETROCOMPATIBILIDADE_FRENTES: Record<number, number> = {
  1: 5, // Tributário -> Tributário
  2: 4, // Fiscal -> Fiscal & Contábil
  3: 1, // Financeiro -> Financeiro & Crédito
  4: 4, // Contábil -> Fiscal & Contábil
  5: 6, // Jurídico -> Jurídico
  6: 7, // Operacional -> Operacional, Humano & Cultura
  7: 7, // Humano -> Operacional, Humano & Cultura
}

export function normalizarAvaliacoesRetrocompativeis(
  salvas?: Record<string | number, number>,
): Record<number, number> {
  const padrao: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2 }
  if (!salvas || typeof salvas !== 'object') return padrao

  const resultado: Record<number, number> = { ...padrao }

  // Se já tiver as 7 chaves modernas mapeadas, prioriza
  Object.entries(salvas).forEach(([k, v]) => {
    const numKey = Number(k)
    const val = Number(v)
    if (numKey >= 1 && numKey <= 7 && !isNaN(val)) {
      resultado[numKey] = val
    }
  })

  return resultado
}

export default function Diagnostico360() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Gate de Dados da Empresa
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-360'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* SELETOR CLIENTE ATIVO NO TOPO */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo no Diagnóstico 360°:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="360"
        nomeEmpresa={dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
      />

      {/* HERO DA PÁGINA 360 */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur-md">
                DIAMOND INTELLIGENCE • PARCERIA GRUPO BAUMGARTENER
              </span>
              <FreemiumBadge tipo="diagnostico" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Diagnóstico 360°:{' '}
              <span className="text-[#D4AF37]">Inteligência Fiscal & Governança</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Ecossistema de inteligência corporativa focado em{' '}
              <strong className="text-white">transformar risco em liquidez</strong> e{' '}
              <strong className="text-white">governança em crescimento</strong>. Mapeamento profundo
              das vulnerabilidades da empresa para estancar perdas, blindar o patrimônio e preparar
              a operação para o Novo Código Tributário.
            </p>
          </div>
        </div>
      </section>

      {/* CONTAINER DO CONTEÚDO PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* CTA INICIAL DE CONTEXTO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#07132B] border border-[#D4AF37]/30 text-white">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-white">
              Quer uma avaliação personalizada para a sua empresa?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Converse diretamente com o time de especialistas do Diamond Group e Grupo
              Baumgartener.
            </p>
          </div>
          <a
            href="/#contato"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            Fale com um Especialista
          </a>
        </div>

        {/* ========================================================= */}
        {/* SEÇÃO A: CONCEITO REESTRUTURAÇÃO × GOVERNANÇA */}
        {/* ========================================================= */}
        <section className="bg-white rounded-[26px] p-6 sm:p-10 border border-slate-200 shadow-md">
          <div className="max-w-3xl space-y-3 mb-8">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Fundamentos da Assessoria
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              O Agora e o Amanhã do seu Negócio
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nosso trabalho começa com um diagnóstico técnico completo para mapear riscos e
              oportunidades nas frentes jurídica, tributária, fiscal, contábil, financeira,
              operacional e humana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Reestruturação */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-[#07132B]">
                  Atua no "Agora"
                </div>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  A Reestruturação de Empresas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  É o processo de redesenhar a forma como a empresa opera, se financia ou se
                  organiza societariamente para <strong>resolver crises</strong>,{' '}
                  <strong>eliminar ineficiências</strong> ou <strong>destravar valor</strong>.
                  Estanca vazamentos imediatos de caixa e recupera recursos tributários pagos
                  indevidamente.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-xs text-[#D4AF37] font-semibold">
                Foco: Liquidez rápida, renegociação de dívidas e saneamento emergencial.
              </div>
            </div>

            {/* Card Governança */}
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-950 to-[#0A1A13] text-white border border-emerald-500/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#2ECC71] text-[#0A1A13]">
                  Atua no "Amanhã"
                </div>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  A Governança Corporativa
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cria processos e controles pelos quais a empresa é administrada e monitorada.{' '}
                  <em>
                    "Se a reestruturação arruma a casa, a governança garante que ela não bagunce de
                    novo."
                  </em>{' '}
                  Prepara a corporação para perenidade, captação de fundos e sucessão segura.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-xs text-emerald-300 font-semibold">
                Foco: Compliance, blindagem patrimonial (Holdings/
                <TermoPPLI />) e Comitê Tributário.
              </div>
            </div>
          </div>

          {/* CTA APÓS REESTRUTURAÇÃO × GOVERNANÇA */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Precisa equilibrar o saneamento imediato e a governança de longo prazo da sua empresa?
            </p>
            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Fale com um Especialista
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO B: AS 3 PREMISSAS DA METODOLOGIA */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Premissas Inegociáveis
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              Como Conduzimos o Diagnóstico 360°
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-heading font-bold text-base text-[#07132B]">
                Diagnóstico Precede a Intervenção
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nenhuma recomendação técnica ou alteração societária é implementada sem o mapeamento
                profundo prévio. Evita retrabalho e decisões tomadas no escuro.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-heading font-bold text-base text-[#07132B]">
                Matriz Impacto × Risco × Esforço
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As soluções identificadas são rigorosamente priorizadas: o que gera maior caixa com
                menor fricção é executado primeiro, financiando as etapas seguintes.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-heading font-bold text-base text-[#07132B]">
                Contingência vs. Governança
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A análise divide com clareza o que é contingência (passado/presente a estancar) do
                que é compliance, contratos e governança (futuro a blindar).
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO C: MATRIZ COMPLETA DOS 7 RISCOS */}
        {/* ========================================================= */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Matriz Estrutural Diamond Intelligence
                </span>
                <BadgeOrigemPropagada origem="configuracoes" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
                As 7 Frentes da Matriz Semáforo de Riscos e Oportunidades
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Conteúdo integral do Dossiê Diamond Group & Grupo Baumgartener. Parâmetros
                sincronizados das Configurações.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <span>
                  Setor: <strong className="text-[#07132B]">{dadosEmpresa.segmento}</strong>
                </span>
                <span>
                  • Regime:{' '}
                  <strong className="text-[#07132B]">
                    {dadosEmpresa.regimeAtual || 'Simples Nacional'}
                  </strong>
                </span>
                <BadgeOrigemPropagada origem="configuracoes" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {SETE_RISCOS_360.map((risco) => (
              <div
                key={risco.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header do Risco */}
                <div className="bg-slate-50/80 p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                      Frente {risco.id} de 7
                    </span>
                    <h3 className="font-heading font-extrabold text-xl text-[#07132B]">
                      {risco.nome}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{risco.subtitulo}</p>
                  </div>

                  <span className="self-start sm:self-auto text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {risco.dicaPriorizacao}
                  </span>
                </div>

                <div className="p-6 sm:p-7 space-y-5 text-xs sm:text-sm">
                  {/* Citação Técnica do PDF */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-slate-700 italic leading-relaxed text-xs">
                    "{formatarTextoComPPLI(risco.citacaoTecnica)}"
                  </div>

                  {/* Foco Atual & Foco Novo Código */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#07132B]" />
                        Foco Atual (Legislação Vigente)
                      </span>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {formatarTextoComPPLI(risco.focoAtual)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1.5">
                      <span className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Foco no Novo Código Tributário (IBS / CBS / IS)
                      </span>
                      <p className="text-blue-900/80 leading-relaxed text-xs">
                        {formatarTextoComPPLI(
                          risco.focoNovoCodigo ||
                            'Preparação contábil para o IVA Dual e alinhamento às exigências de transparência da EC 132/2023.',
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Entregável do Risco */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <strong className="text-xs font-bold text-emerald-950 uppercase tracking-wide block mb-0.5">
                        Entregável Concreto deste Módulo:
                      </strong>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {formatarTextoComPPLI(risco.entregavel)}
                      </p>
                    </div>
                  </div>

                  {/* FASE 2: BOTÃO ANÁLISE FINANCEIRA COMPLETA NA FRENTE 1 FINANCEIRO & CRÉDITO */}
                  {risco.id === 1 && (
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#07132B]/5 border border-[#D4AF37]/40">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">
                          Fase 2 • Sistema Externo Integrado
                        </span>
                        <p className="text-xs font-semibold text-[#07132B]">
                          Auditoria detalhada de balanço, DRE, fluxo de caixa e capacidade de
                          pagamento.
                        </p>
                      </div>
                      <a
                        href={URL_SISTEMA_ANALISE_FINANCEIRA}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
                      >
                        Análise Financeira Completa
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA APÓS A MATRIZ DAS 7 FRENTES */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-heading font-bold text-base sm:text-lg text-[#07132B]">
                Identificou riscos na sua operação nestas 7 frentes?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Nossos analistas estruturam a auditoria e o plano de mitigação sob medida.
              </p>
            </div>
            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Fale com um Especialista
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO D: JORNADA VISUAL DE → PARA */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white rounded-[26px] p-6 sm:p-10 border border-[#D4AF37]/30 shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Destino: Inteligência Fiscal & Governança
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
              A Jornada de Transformação "De → Para"
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              O que acontece quando a sua empresa substitui a reação passiva pela estratégia
              proativa e governança integrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                de: 'Apagar incêndios',
                para: 'Controle e previsibilidade',
              },
              {
                de: 'Risco de caixa e multas',
                para: 'Prevenção e estratégia',
              },
              {
                de: 'Insegurança e reatividade',
                para: 'Caixa otimizado e protegido',
              },
              {
                de: 'Decisões no escuro',
                para: 'Decisões baseadas em dados',
              },
            ].map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      DE:
                    </span>
                    <span className="text-sm font-semibold text-slate-300 line-through decoration-rose-400">
                      {item.de}
                    </span>
                  </div>

                  <span className="font-heading font-black text-sm text-[#D4AF37] shrink-0">→</span>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      PARA:
                    </span>
                    <span className="text-sm font-bold text-emerald-300">{item.para}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA APÓS A JORNADA DE TRANSFORMAÇÃO */}
          <div className="pt-6 border-t border-white/10 text-center">
            <a
              href="/#contato"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Fale com um Especialista
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO E: CRITÉRIO DE SUCESSO — PLANO DE AÇÃO 30-60-90 */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Critério de Sucesso
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#07132B]">
              Plano de Ação 30-60-90
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ao final do mapeamento das 7 frentes, a diretoria recebe um plano de ação claro
              dividido em três marcos cronológicos de execução:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-[#D4AF37]/40 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  30
                </span>
                <h3 className="font-heading font-bold text-lg text-[#07132B]">
                  Marco 30 Dias: Ações Rápidas & Liquidez
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Recuperação tributária imediata, saneamento da capacidade de pagamento mensal e
                  reestruturação do capital de giro para oxigenar o fluxo de caixa.
                </p>
                <div className="pt-2">
                  <a
                    href={URL_SISTEMA_ANALISE_FINANCEIRA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all"
                  >
                    Análise Financeira Completa
                  </a>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#D4AF37] bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Prazo estimado: Primeiros 30 dias
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-emerald-500/40 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="w-8 h-8 rounded-xl bg-[#0A1A13] text-[#2ECC71] font-bold text-xs flex items-center justify-center">
                  60
                </span>
                <h3 className="font-heading font-bold text-lg text-[#07132B]">
                  Marco 60 Dias: Societário, Parcerias & Governança
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Due diligence de sócios e parceiros (Risco Hub), blindagem em novos negócios,
                  fechamento contábil auditável e estruturação de alocação de excedentes.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#145A32] bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                Prazo estimado: 30 a 60 dias
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-blue-500/40 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="w-8 h-8 rounded-xl bg-[#07132B] text-blue-400 font-bold text-xs flex items-center justify-center">
                  90
                </span>
                <h3 className="font-heading font-bold text-lg text-[#07132B]">
                  Marco 90 Dias: Transição Tributária & Cultura Operacional
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Implementação de POPs operacionais, programa de capacitação cultural e comitê
                  permanente de transição para o Novo Código Tributário (IBS/CBS/IS).
                </p>
              </div>
              <div className="text-[11px] font-semibold text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                Prazo estimado: 60 a 90 dias e acompanhamento
              </div>
            </div>
          </div>

          {/* CTA APÓS O PLANO 30-60-90 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-heading font-bold text-sm sm:text-base text-[#07132B]">
                Quer acelerar a implantação dos marcos 30, 60 e 90 dias na sua operação?
              </h4>
              <p className="text-xs text-slate-600">
                Acompanhamento consultivo direto com os analistas e parceiros do Diamond Group.
              </p>
            </div>
            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Fale com um Especialista
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO F: CICLO DA ASSESSORIA (4 ETAPAS DO PDF) */}
        {/* ========================================================= */}
        <section className="bg-slate-100 rounded-[26px] p-6 sm:p-10 border border-slate-200 space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Aplicação Prática
            </span>
            <h2 className="text-2xl font-heading font-black text-[#07132B]">
              O Ciclo Completo da Assessoria
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '1',
                titulo: 'Diagnóstico 360°',
                desc: 'Mapeamento do cenário contábil, fiscal, jurídico e financeiro.',
              },
              {
                num: '2',
                titulo: 'Reestruturação',
                desc: 'Ações Rápidas: créditos tributários, alongamento de passivos e caixa.',
              },
              {
                num: '3',
                titulo: 'Governança',
                desc: 'Ações Estruturais: matriz de risco, compliance e proteção patrimonial.',
              },
              {
                num: '4',
                titulo: 'Alavancagem',
                desc: 'Captação BNDES/fundos, parcerias corporativas e preparação para M&A.',
              },
            ].map((etapa) => (
              <div
                key={etapa.num}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2"
              >
                <span className="w-7 h-7 rounded-lg bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                  {etapa.num}
                </span>
                <h4 className="font-heading font-bold text-sm text-[#07132B]">{etapa.titulo}</h4>
                <p className="text-xs text-slate-600 leading-snug">{etapa.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA APÓS O CICLO COMPLETO DA ASSESSORIA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Quer iniciar as 4 etapas do ciclo de assessoria com suporte executivo?
            </p>
            <a
              href="/#contato"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Fale com um Especialista
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO G: CTA DE ENTRADA NA ESTEIRA DE DIAGNÓSTICOS */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-br from-[#07132B] via-[#0D1F3C] to-[#07132B] rounded-[26px] p-8 sm:p-12 border-2 border-[#D4AF37]/50 shadow-2xl text-white space-y-6 text-center relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/20 border border-[#D4AF37]/40 uppercase tracking-wider">
              Trilha Guiada Diamond Intelligence
            </span>

            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white leading-tight">
              Pronto para Iniciar a Trilha de Diagnósticos?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Inicie a esteira completa: ajuste as premissas em Configurações, execute a
              Autoavaliação das 7 Frentes na sua empresa, analise a Transição Fiscal, compare
              regimes vigentes e emita o Enquadramento Completo.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/diagnostico-configuracoes"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-heading font-black text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Iniciar Trilha Completa de Diagnósticos
              </Link>

              <a
                href="/#contato"
                className="w-full sm:w-auto px-6 py-4 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                Fale com um Especialista
              </a>
            </div>
          </div>
        </section>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
