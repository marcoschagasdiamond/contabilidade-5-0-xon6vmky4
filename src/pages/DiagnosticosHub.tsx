import React, { useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { useProgressoTrilha, type EstadoEtapaTrilha } from '@/hooks/useProgressoTrilha'

export default function DiagnosticosHub() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { etapa00, etapa01, etapa02, etapa03, etapa04, etapa05, etapa06 } = useProgressoTrilha()

  const obterCtaEtapa = useCallback((estado: EstadoEtapaTrilha, nomeAcao: string) => {
    if (estado === 'concluida') {
      return `Revisar ${nomeAcao}`
    }
    if (estado === 'em_andamento') {
      return `Continuar ${nomeAcao}`
    }
    return `Iniciar ${nomeAcao}`
  }, [])

  // Se o visitante ainda não preencheu os Dados da Empresa, redireciona com ?destino=/diagnosticos
  // Usa valores primitivos estáveis para evitar laços de navegação
  const authCarregando = Boolean(authLoading)
  const empresaSalva = Boolean(temDadosSalvos)

  useEffect(() => {
    if (!authCarregando && !empresaSalva) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnosticos'), { replace: true })
    }
  }, [authCarregando, empresaSalva, navigate])

  const diagnosticosCards = useMemo(
    () => [
      {
        numero: '00',
        id: '360',
        nome: 'Diagnóstico 360°',
        subtitulo: 'Apresentação do Serviço & Matriz das 7 Frentes Estruturais',
        parceria: 'Diamond Group & Grupo Baumgartener',
        descricao:
          'Apresentação corporativa e matriz de maturidade em 7 frentes estruturais: Financeiro, Investimentos, Societário, Fiscal, Tributário, Jurídico e Operacional.',
        beneficios: [
          'Visão integrada das 7 frentes corporativas',
          'Reestruturação no Agora e Governança no Amanhã',
          'Porta de entrada da Trilha de Diagnósticos',
        ],
        rota: '/diagnostico-360',
        corAccent: '#D4AF37',
        badge: 'Apresentação do Serviço • 7 Frentes',
        estado: etapa00.estado,
        labelEstado: etapa00.labelEstado,
        nomeAcao: 'Trilha',
      },
      {
        numero: '01',
        id: 'configuracoes',
        nome: 'Configurações dos Diagnósticos',
        subtitulo: 'Parâmetros Base • Espelhado com Calculadora IBS/CBS',
        parceria: 'Central de Propagação para os 4 Diagnósticos',
        descricao:
          'Cadastro central enxuto: CNPJ, UF, segmento, regime atual, compras e ano de transição (2026–2033). Propaga parâmetros para toda a esteira.',
        beneficios: [
          'Propagação automática para as etapas e calculadora',
          'Integração direta com a Carteira de Clientes',
          'Persistência segura vinculada a cada laudo',
        ],
        rota: '/diagnostico-configuracoes',
        corAccent: '#D4AF37',
        badge: 'Parâmetros Base • Propagação Ativa',
        estado: etapa01.estado,
        labelEstado: etapa01.labelEstado,
        nomeAcao: 'Configurações',
      },
      {
        numero: '02',
        id: 'autoavaliacao',
        nome: 'Autoavaliação das 7 Frentes na Sua Empresa',
        subtitulo: '14 Respostas • Matriz Semáforo & Plano de Ação 30-60-90',
        parceria: 'Ferramenta Interativa Diamond Intelligence',
        descricao:
          'Autoavaliação técnica em 14 dimensões (Exposição e Controle por frente). Apura o score de maturidade, semáforo de riscos e plano 30-60-90.',
        beneficios: [
          'Questionário objetivo em 14 respostas pontuais',
          'Matriz Semáforo de Riscos por frente',
          'Plano de Ação 30-60-90 vinculado à empresa',
        ],
        rota: '/diagnostico-autoavaliacao',
        corAccent: '#2ECC71',
        badge: 'Ferramenta Interativa • 14 Respostas',
        estado: etapa02.estado,
        labelEstado: etapa02.labelEstado,
        nomeAcao: 'Autoavaliação',
      },
      {
        numero: '03',
        id: 'transicao',
        nome: 'Diagnóstico de Transição Fiscal',
        subtitulo: 'Roteiro de 40 Minutos • Farol de Urgência & ERP',
        parceria: 'Reforma Tributária do Consumo',
        descricao:
          'Avaliação de impacto operacional em dois blocos (Negócio/Vendas e ERP/Caixa), com farol de urgência e prioridades para 90 dias.',
        beneficios: [
          'Análise de dependência de incentivos e ERP',
          'Farol de Urgência em 3 níveis de prioridade',
          'Recomendações práticas para os próximos 90 dias',
        ],
        rota: '/diagnostico-transicao',
        corAccent: '#F59E0B',
        badge: 'Roteiro 40 min • Farol de Risco',
        estado: etapa03.estado,
        labelEstado: etapa03.labelEstado,
        nomeAcao: 'Transição Fiscal',
      },
      {
        numero: '04',
        id: 'regimes',
        nome: 'Diagnóstico de Comparação de Regime',
        subtitulo: 'Decisão Estratégica • 4 Modelos Societários & IVA Dual',
        parceria: 'Simples Tradicional vs Híbrido vs Presumido vs Real vs IVA Dual',
        descricao:
          'Confronto matemático entre o sistema atual (PIS/COFINS/ICMS/ISS) e o IBS/CBS nos modelos Simples Tradicional, Híbrido, Presumido e Real.',
        beneficios: [
          'Árvore de decisão em 4 perguntas estratégicas',
          'Ranking financeiro dos 4 regimes tributários',
          'Simulação de Split Payment no capital de giro',
        ],
        rota: '/diagnostico-regimes',
        corAccent: '#3B82F6',
        badge: 'Comparador + Matriz 4 Regimes',
        estado: etapa04.estado,
        labelEstado: etapa04.labelEstado,
        nomeAcao: 'Comparação de Regime',
      },
      {
        numero: '05',
        id: 'enquadramento',
        nome: 'Diagnóstico de Enquadramento Completo',
        subtitulo: 'Wizard Completo com Relatório Executivo',
        parceria: 'Simulador Integrado com PDF',
        descricao:
          'Simulador de enquadramento tributário com cálculo do Fator R, economia anual estimada e emissão de relatório técnico em PDF.',
        beneficios: [
          'Cálculo do regime mais econômico em tempo real',
          'Seletor do ano-base de transição (2027–2033)',
          'Emissão de Relatório Executivo diagramado em PDF',
        ],
        rota: '/diagnostico',
        corAccent: '#10B981',
        badge: 'Parecer Executivo + PDF',
        estado: etapa05.estado,
        labelEstado: etapa05.labelEstado,
        nomeAcao: 'Enquadramento',
      },
      {
        numero: '06',
        id: 'fornecedores',
        nome: 'Análise de Fornecedores',
        subtitulo: 'Crédito Perdido vs Ganho • Comparativo Simples vs Presumido vs Real',
        parceria: 'Diagnóstico de Entrada sob a LC 214/2025',
        descricao:
          'Auditoria de compras: custo líquido real, crédito perdido por fornecedor do Simples (~26,5% vs 3–7%), ranking de gargalos e comparador de cotações.',
        beneficios: [
          'Cálculo do Custo Líquido de Aquisição e Crédito Perdido',
          'Comparador de Cotações com preço de equilíbrio',
          'Evolução comparativa de todos os anos 2026–2033',
        ],
        rota: '/diagnostico-fornecedores',
        corAccent: '#D4AF37',
        badge: 'Crédito Perdido • 2026–2033',
        estado: etapa06.estado,
        labelEstado: etapa06.labelEstado,
        nomeAcao: 'Análise de Fornecedores',
      },
    ],
    [
      etapa00.estado,
      etapa00.labelEstado,
      etapa01.estado,
      etapa01.labelEstado,
      etapa02.estado,
      etapa02.labelEstado,
      etapa03.estado,
      etapa03.labelEstado,
      etapa04.estado,
      etapa04.labelEstado,
      etapa05.estado,
      etapa05.labelEstado,
      etapa06.estado,
      etapa06.labelEstado,
    ],
  )

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
              <span className="font-mono text-xs text-[#D4AF37]">◆</span>
              <span>DIAMOND INTELLIGENCE • ECOSSISTEMA CORPORATIVO</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white mb-5 leading-tight">
              Trilha de{' '}
              <span className="text-[#D4AF37] underline decoration-[#D4AF37]/40 underline-offset-8">
                Diagnósticos Estratégicos
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6">
              Esteira guiada e modular alimentada pelos{' '}
              <strong className="text-white">Dados da Empresa</strong>: da apresentação do
              Diagnóstico 360° e autoavaliação das 7 frentes até o enquadramento matemático completo
              sob a EC 132/2023.
            </p>

            {/* BARRA DA EMPRESA ATIVA & ACESSO AO RELATÓRIO CONSOLIDADO */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 px-5 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="text-[#2ECC71] font-mono font-bold">EMPRESA:</span>
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
              <Link
                to="/diagnostico/relatorio"
                className="px-3 py-1 rounded-lg bg-[#2ECC71] text-[#07132B] font-bold hover:bg-[#27ae60] transition-colors"
              >
                Ver Relatório Consolidado →
              </Link>
              <span className="text-slate-500">•</span>
              <Link
                to="/diagnostico-configuracoes"
                className="text-[#D4AF37] hover:underline font-bold"
              >
                Configurações →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CARDS DA TRILHA DE DIAGNÓSTICOS (SEM ÍCONES, FOCO TIPOGRÁFICO) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-8 scroll-mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {diagnosticosCards.map((diag) => {
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
                  {/* Top do card: Número + Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-heading font-black text-slate-300 group-hover:text-[#07132B] transition-colors font-mono">
                        {diag.numero}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase tracking-wider"
                        style={{
                          backgroundColor: '#07132B',
                          color: diag.corAccent,
                          border: `1px solid ${diag.corAccent}40`,
                        }}
                      >
                        ETAPA {diag.numero}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {diag.estado === 'concluida' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#2ECC71]/15 text-[#1b7943] border border-[#2ECC71]/40">
                          Concluída
                        </span>
                      ) : diag.estado === 'em_andamento' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 border border-amber-500/40">
                          Em andamento
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-300">
                          Não iniciada
                        </span>
                      )}
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
                      O que esta etapa entrega:
                    </span>
                    <ul className="space-y-1.5">
                      {diag.beneficios.map((b, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                            style={{ backgroundColor: diag.corAccent }}
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
                    className="inline-flex items-center px-6 py-3 rounded-xl font-heading font-black text-xs sm:text-sm text-white shadow-md transition-all hover:brightness-110 group-hover:shadow-lg text-center"
                    style={{
                      backgroundColor: diag.estado === 'concluida' ? '#07132B' : '#07132B',
                      border:
                        diag.estado === 'concluida'
                          ? '1px solid #2ECC71'
                          : `1px solid ${diag.corAccent}60`,
                    }}
                  >
                    <span>{obterCtaEtapa(diag.estado, diag.nomeAcao)} →</span>
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
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-wider">
              Metodologia Integrada
            </span>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              Reestruturação no Agora, Governança no Amanhã
            </h2>

            <div className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                <strong className="text-white">Reestruturação (Agora):</strong> redesenha operação,
                finanças e societário para estancar perdas e destravar valor imediato.
              </p>
              <p>
                <strong className="text-white">Governança (Amanhã):</strong> implanta processos e
                controles contínuos para manter a disciplina fiscal e a solidez construída.
              </p>
            </div>

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
