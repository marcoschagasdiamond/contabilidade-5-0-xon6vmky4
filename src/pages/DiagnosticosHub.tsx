import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Compass,
  Calendar,
  Scale,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  Layers,
  TrendingUp,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'

export default function DiagnosticosHub() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Se o visitante ainda não preencheu os Dados da Empresa, redireciona com ?destino=/diagnosticos
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnosticos'), { replace: true })
    }
  }, [authLoading, temDadosSalvos, navigate])

  const diagnosticosCards = [
    {
      numero: '01',
      id: '360',
      nome: 'Diagnóstico 360°',
      subtitulo: 'Inteligência Fiscal & Governança',
      parceria: 'Diamond Group & Grupo Baumgartener',
      descricao:
        'Mapeamento profundo das vulnerabilidades nas 7 frentes de risco (Tributário, Fiscal, Financeiro, Contábil, Jurídico, Operacional e Humano). Aplica a matriz Impacto × Risco × Esforço e entrega o Dossiê Executivo em 3 frentes de ação.',
      beneficios: [
        'Matriz completa dos 7 Riscos com foco atual e no Novo Código',
        'Autoavaliação interativa com classificação de perfil de risco',
        'Jornada De → Para (do apagar incêndios à previsibilidade)',
        'Dossiê Executivo: Ações Rápidas, Estruturais e Comitê de Transição',
      ],
      rota: '/diagnostico-360',
      corAccent: '#D4AF37',
      badge: 'Metodologia Diamond Intelligence',
      icone: Compass,
    },
    {
      numero: '02',
      id: 'transicao',
      nome: 'Diagnóstico de Transição Fiscal',
      subtitulo: 'Roteiro de 40 Minutos • Farol de Urgência & ERP',
      parceria: 'Reforma Tributária do Consumo',
      descricao:
        'Roteiro guiado em dois blocos operacionais (Negócio & Vendas / Operação & ERP) que gera laudo com farol de risco, 3 prioridades para os próximos 90 dias e solução recomendada.',
      beneficios: [
        'Bloco A: Negócio, Regime & Vendas (20 min)',
        'Bloco B: Operação, Sistema ERP & Caixa (20 min)',
        'Laudo Executivo com Farol de Urgência (Verde, Amarelo e Vermelho)',
        'As 3 prioridades estratégicas para os próximos 90 dias',
      ],
      rota: '/diagnostico-transicao',
      corAccent: '#F59E0B',
      badge: 'Roteiro 40 min • Farol de Risco',
      icone: Calendar,
    },
    {
      numero: '03',
      id: 'regimes',
      nome: 'Diagnóstico de Comparação de Regime',
      subtitulo: 'Decisão Estratégica • 4 Modelos Societários & IVA Dual',
      parceria: 'Simples Tradicional vs Híbrido vs Presumido vs Real vs IVA Dual',
      descricao:
        'Sistema unificado integrando o fluxo estratégico de decisão (Simples Tradicional, Híbrido ou Regime Regular) com a matriz numérica dos 4 regimes societários, ranking de economia e simulação de split payment.',
      beneficios: [
        'Fluxo de decisão interativo em 4 perguntas estratégicas',
        'Ranking financeiro completo dos 4 regimes com apuração líquida',
        'Simulação de Split Payment e impacto no capital de giro',
        'Os 3 cenários práticos mais comuns de mercado (estudos de caso)',
      ],
      rota: '/diagnostico-regimes',
      corAccent: '#3B82F6',
      badge: 'Comparador + Matriz 4 Regimes',
      icone: Scale,
    },
    {
      numero: '04',
      id: 'enquadramento',
      nome: 'Diagnóstico de Enquadramento Completo',
      subtitulo: 'Wizard Completo com Relatório Executivo',
      parceria: 'Simulador Integrado com PDF',
      descricao:
        'O wizard aprofundado com seletor de ano-base (2027 a 2033), detalhamento de créditos, ranking de regimes, análise setorial e geração instantânea de parecer e relatório executivo em PDF para download.',
      beneficios: [
        'Wizard de 4 passos com validação e cálculo em tempo real',
        'Seletor dinâmico do ano-base da transição (2027–2033)',
        'Geração e download de Relatório Executivo em PDF',
        'Salvamento automático no histórico e visível no painel admin',
      ],
      rota: '/diagnostico',
      corAccent: '#2ECC71',
      badge: 'Parecer Executivo + PDF',
      icone: FileCheck2,
    },
  ]

  if (authLoading || !temDadosSalvos) {
    return (
      <div className="min-h-screen bg-[#0A1A13] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-10 h-10 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Verificando Dados da Empresa...</h2>
          <p className="text-xs text-slate-400">
            Os diagnósticos tributários exigem os parâmetros operacionais da sua empresa.
            Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-24 sm:pt-28 pb-20">
      {/* HERO SECTION DO HUB */}
      <section className="relative py-14 md:py-20 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs sm:text-sm font-bold text-[#D4AF37] mb-5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>DIAMOND INTELLIGENCE • ECOSSISTEMA CORPORATIVO</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white mb-5 leading-tight">
              Diagnósticos{' '}
              <span className="text-[#D4AF37] underline decoration-[#D4AF37]/40 underline-offset-8">
                Tributários Estratégicos
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6">
              Uma trilha completa de 4 ferramentas integradas alimentadas pelos{' '}
              <strong className="text-white">Dados da Empresa</strong>. Do mapeamento dos 7 riscos
              de governança ao enquadramento matemático completo sob o Novo Código Tributário.
            </p>

            {/* BARRA DA EMPRESA ATIVA */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 px-5 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2ECC71]" />
                <span className="font-semibold text-white">
                  {dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada'}
                </span>
                {dadosEmpresa.cnpj && (
                  <span className="text-slate-400 font-mono">({dadosEmpresa.cnpj})</span>
                )}
              </div>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">
                Segmento: <strong className="text-white">{dadosEmpresa.segmento}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <Link to="/dados-empresa" className="text-[#D4AF37] hover:underline font-bold">
                Editar dados →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CARDS DOS 4 DIAGNÓSTICOS */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-8 scroll-mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {diagnosticosCards.map((diag) => {
            const IconComp = diag.icone
            return (
              <div
                key={diag.id}
                className="bg-white rounded-[26px] border border-slate-200/90 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Faixa decorativa superior */}
                <div
                  className="h-2 w-full transition-all"
                  style={{
                    background: `linear-gradient(90deg, ${diag.corAccent}, #07132B)`,
                  }}
                />

                <div className="p-7 sm:p-9 space-y-6">
                  {/* Top do card: Número + Badge + Ícone */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-heading font-black text-slate-300 group-hover:text-[#07132B] transition-colors">
                        {diag.numero}
                      </span>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: '#07132B',
                          color: diag.corAccent,
                          border: `1px solid ${diag.corAccent}40`,
                        }}
                      >
                        <IconComp className="w-6 h-6 stroke-[2]" />
                      </div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${diag.corAccent}15`,
                        color: '#07132B',
                        border: `1px solid ${diag.corAccent}40`,
                      }}
                    >
                      {diag.badge}
                    </span>
                  </div>

                  {/* Títulos */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {diag.parceria}
                    </span>
                    <h3 className="font-heading font-extrabold text-2xl text-slate-900 group-hover:text-[#07132B] transition-colors">
                      {diag.nome}
                    </h3>
                    <p className="text-xs font-semibold text-[#D4AF37] mt-0.5">{diag.subtitulo}</p>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-slate-600 leading-relaxed">{diag.descricao}</p>

                  {/* Benefícios / Entregáveis */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      O que este diagnóstico entrega:
                    </span>
                    <ul className="space-y-1.5">
                      {diag.beneficios.map((b, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700 leading-snug"
                        >
                          <CheckCircle2
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: diag.corAccent }}
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer do Card com CTA */}
                <div className="p-6 sm:p-7 pt-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    <span>Alimentado por: </span>
                    <strong className="text-slate-800">Dados da Empresa</strong>
                  </div>

                  <Link
                    to={diag.rota}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-white shadow-md transition-all hover:brightness-110 group-hover:shadow-lg"
                    style={{
                      backgroundColor: '#07132B',
                      border: `1px solid ${diag.corAccent}60`,
                    }}
                  >
                    <span>Acessar Diagnóstico</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SEÇÃO METODOLÓGICA DIAMOND GROUP & GRUPO BAUMGARTENER */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-16">
        <div className="bg-[#07132B] text-white rounded-[28px] p-8 sm:p-12 border border-[#D4AF37]/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Metodologia Integrada
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              Reestruturação no Agora, Governança no Amanhã
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A <strong>Reestruturação de Empresas</strong> é o processo de redesenhar a forma como
              a empresa opera, se financia ou se organiza societariamente para resolver crises,
              eliminar ineficiências ou destravar valor. Ela atua no <em>"agora"</em>.
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A <strong>Governança</strong> cria processos e controles pelo qual a empresa é
              administrada e monitorada. Se a reestruturação arruma a casa, a governança garante que
              ela não bagunce de novo. Ela atua no <em>"amanhã"</em>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-[#D4AF37] uppercase block mb-1">
                  1. Precedência
                </span>
                <p className="text-xs text-slate-300">
                  O diagnóstico precede qualquer intervenção ou recomendação técnica.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-[#D4AF37] uppercase block mb-1">
                  2. Matriz de Priorização
                </span>
                <p className="text-xs text-slate-300">
                  Soluções são priorizadas pela matriz de Impacto × Risco × Esforço.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-[#D4AF37] uppercase block mb-1">
                  3. Separação Clara
                </span>
                <p className="text-xs text-slate-300">
                  Divide contingência (passado/presente) de compliance e governança (futuro).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA DIAMOND */}
      <div className="mt-16">
        <DiamondFooterCTA
          titulo="Precisa de apoio para conduzir os diagnósticos da sua empresa?"
          subtitulo="Nosso time de consultores fiscais e contábeis está à disposição para analisar seu dossiê executivo."
        />
      </div>
    </div>
  )
}
