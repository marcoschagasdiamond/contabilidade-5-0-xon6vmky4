import React, { useState, useEffect } from 'react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import {
  TESES_RECUPERADOR,
  CONFIGURACOES_PADRAO,
  gerarSelecaoTesesPadrao,
  calcularRecuperadorCreditos,
} from '@/lib/recuperadorCreditosCalculo'
import type {
  ConfiguracoesRecuperador,
  ParametrosRecuperador,
  ResultadosRecuperador,
  SimulacaoRecuperador,
  TeseSelecaoUsuario,
} from '@/types/recuperadorCreditos'
import {
  listarSimulacoesRecuperador,
  salvarSimulacaoRecuperador,
} from '@/services/simulacoesRecuperador'
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

// Submódulos
import ModuloConfiguracoesRecuperador from '@/components/recuperador/ModuloConfiguracoesRecuperador'
import BlocoPisCofinsRecuperador from '@/components/recuperador/BlocoPisCofinsRecuperador'
import BlocoFolhaPrevidenciarioRecuperador from '@/components/recuperador/BlocoFolhaPrevidenciarioRecuperador'
import ModuloApuracaoSelicRecuperador from '@/components/recuperador/ModuloApuracaoSelicRecuperador'
import ModuloDashboardRecuperador from '@/components/recuperador/ModuloDashboardRecuperador'
import { ModalSalvarRecuperador } from '@/components/recuperador/ModalSalvarRecuperador'
import { ListaSimulacoesRecuperador } from '@/components/recuperador/ListaSimulacoesRecuperador'

type ModuloRecuperadorId = 'configuracoes' | 'pis_cofins' | 'folha' | 'apuracao_selic' | 'dashboard'

interface ModuloNav {
  id: ModuloRecuperadorId
  numero: string
  titulo: string
  subtitulo: string
}

const MODULOS_RECUPERADOR_NAV: ModuloNav[] = [
  {
    id: 'configuracoes',
    numero: '01',
    titulo: 'Configurações',
    subtitulo: 'Regime e Bases Comuns (60m)',
  },
  {
    id: 'pis_cofins',
    numero: '02',
    titulo: 'Teses PIS / COFINS',
    subtitulo: 'Exclusão ICMS/ISS e Insumos',
  },
  {
    id: 'folha',
    numero: '03',
    titulo: 'Folha & Previdenciário',
    subtitulo: 'INSS Indenizatório e RAT/FAP',
  },
  {
    id: 'apuracao_selic',
    numero: '04',
    titulo: 'Apuração SELIC',
    subtitulo: 'Correção Oficial Ano a Ano',
  },
  {
    id: 'dashboard',
    numero: '05',
    titulo: 'Dashboard Executivo',
    subtitulo: 'KPIs e Cenários Conservador × Integral',
  },
]

export default function RecuperadorCreditos() {
  const { user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()

  const [moduloAtivo, setModuloAtivo] = useState<ModuloRecuperadorId>('dashboard')
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesRecuperador>(CONFIGURACOES_PADRAO)
  const [tesesSelecionadas, setTesesSelecionadas] =
    useState<Record<string, TeseSelecaoUsuario>>(gerarSelecaoTesesPadrao())
  const [cenarioSelecionado, setCenarioSelecionado] = useState<'integral' | 'conservador'>(
    'integral',
  )

  // Modais
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalPdfAberto, setModalPdfAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Simulações salvas
  const [simulacoes, setSimulacoes] = useState<SimulacaoRecuperador[]>([])

  // Se o cliente ativo mudar, sincroniza empresa/CNPJ/regime
  useEffect(() => {
    if (clienteAtivo) {
      setConfiguracoes((prev) => ({
        ...prev,
        clienteId: clienteAtivo.id,
        empresa: clienteAtivo.nome || prev.empresa,
        cnpj: clienteAtivo.cnpj_cpf || prev.cnpj,
        uf: clienteAtivo.uf || prev.uf,
        segmento: clienteAtivo.segmento || prev.segmento,
        regimeAtual:
          clienteAtivo.regime_atual === 'Lucro Real' ||
          clienteAtivo.regime_atual === 'Lucro Presumido' ||
          clienteAtivo.regime_atual === 'Simples Nacional'
            ? clienteAtivo.regime_atual
            : prev.regimeAtual,
      }))
    }
  }, [clienteAtivo])

  // Recarrega simulações salvas
  const recarregarSimulacoes = async () => {
    const lista = await listarSimulacoesRecuperador(user?.id)
    setSimulacoes(lista)
  }

  useEffect(() => {
    recarregarSimulacoes()
  }, [user?.id])

  // Cálculo reativo
  const parametrosAtuais: ParametrosRecuperador = {
    configuracoes,
    teses: tesesSelecionadas,
    cenarioSelecionado,
  }

  const resultadosAtuais: ResultadosRecuperador = React.useMemo(() => {
    return calcularRecuperadorCreditos(parametrosAtuais)
  }, [parametrosAtuais])

  const handleUpdateTese = (teseId: string, atualizacao: Partial<TeseSelecaoUsuario>) => {
    setTesesSelecionadas((prev) => ({
      ...prev,
      [teseId]: {
        ...prev[teseId],
        ...atualizacao,
      },
    }))
  }

  const handleCarregarSimulacao = (sim: SimulacaoRecuperador) => {
    try {
      setConfiguracoes(sim.parametros.configuracoes)
      setTesesSelecionadas(sim.parametros.teses)
      if (sim.parametros.cenarioSelecionado) {
        setCenarioSelecionado(sim.parametros.cenarioSelecionado)
      }
      toast({
        title: 'Análise carregada!',
        description: `Todos os parâmetros de "${sim.nome}" foram aplicados na tela.`,
      })
    } catch {
      toast({
        title: 'Erro ao carregar análise',
        variant: 'destructive',
      })
    }
  }

  const handleConfirmarPdf = (dadosTecnico: ResponsavelTecnicoDados) => {
    try {
      setGerandoPdf(true)
      gerarParecerRecuperadorPDF({
        nomeAnalise: 'Recuperação de Créditos (60 Meses)',
        parametros: parametrosAtuais,
        resultados: resultadosAtuais,
        clienteNome: clienteAtivo?.nome || configuracoes.empresa,
        empresa: configuracoes.empresa,
        cnpj: configuracoes.cnpj,
        responsavelTecnico: dadosTecnico,
        observacoesAnalista: dadosTecnico.observacoes,
      })

      toast({
        title: 'Parecer Técnico gerado!',
        description: 'O download do relatório com as teses e quadro SELIC foi iniciado.',
      })
      setModalPdfAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar parecer',
        description: err?.message || 'Falha ao compilar o PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER NOVO PADRÃO DIAMOND GROUP */}
      <DiamondHeader
        badge="DIAMOND GROUP • RECUPERAÇÃO DE CRÉDITOS 5.0"
        titulo="Recuperador de Créditos Tributários"
        subtitulo="Levantamento administrativo retroativo dos últimos 60 meses (5 anos) com atualização oficial pela taxa SELIC, checklist de teses do STF/STJ com farol de risco, módulos PIS/COFINS e Folha/Previdenciário e emissão de parecer executivo."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* SELETOR CLIENTE ATIVO NO TOPO */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo no Recuperador:" />
        </div>
      </div>

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-bold text-slate-200">Total Recuperável (Integral c/ SELIC):</span>
            <span className="text-[#D4AF37] font-mono font-bold text-sm">
              {formatarMoeda(resultadosAtuais.totalIntegralCorrigido)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="hidden sm:inline">
              Cenário Conservador (Verde):{' '}
              <strong className="text-emerald-400 font-mono">
                {formatarMoeda(resultadosAtuais.totalConservadorCorrigido)}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              PIS/COFINS:{' '}
              <strong className="text-white font-mono">
                {formatarMoeda(resultadosAtuais.totalPisCofinsCorrigido)}
              </strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Folha/INSS:{' '}
              <strong className="text-white font-mono">
                {formatarMoeda(resultadosAtuais.totalFolhaCorrigido)}
              </strong>
            </span>

            {/* BOTÕES DE AÇÃO RÁPIDA: SALVAR E BAIXAR PDF */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setModalSalvarAberto(true)}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#07132B] font-bold hover:bg-[#E5C158] transition-colors shadow-sm"
              >
                Salvar Análise
              </button>
              <button
                type="button"
                onClick={() => setModalPdfAberto(true)}
                disabled={gerandoPdf}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
              >
                {gerandoPdf ? 'Gerando...' : 'Emitir Parecer PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL COM MENU LATERAL E CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* MENU LATERAL / ABAS */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-md lg:sticky lg:top-24 space-y-3">
            <div className="px-3 py-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                Módulos do Recuperador
              </span>
              <span className="text-[11px] text-slate-500">Apuração de 60 meses</span>
            </div>

            <nav className="space-y-1.5 flex flex-col">
              {MODULOS_RECUPERADOR_NAV.map((item) => {
                const isActive = moduloAtivo === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModuloAtivo(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                      isActive
                        ? 'bg-[#07132B] text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#07132B]'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-[#07132B]/10 group-hover:text-[#07132B]'
                      }`}
                    >
                      {item.numero}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs font-bold block truncate ${
                          isActive ? 'text-[#D4AF37]' : 'text-[#07132B]'
                        }`}
                      >
                        {item.titulo}
                      </span>
                      <span
                        className={`text-[11px] block truncate mt-0.5 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitulo}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* LISTA LATERAL: ANÁLISES SALVAS */}
            <div className="mt-4 pt-3 border-t border-slate-100 px-1">
              <ListaSimulacoesRecuperador
                simulacoes={simulacoes}
                onCarregarSimulacao={handleCarregarSimulacao}
                onSimulacaoAtualizada={recarregarSimulacoes}
              />
            </div>
          </aside>

          {/* ÁREA DE CONTEÚDO DO MÓDULO SELECIONADO */}
          <main className="flex-1 w-full min-w-0">
            {moduloAtivo === 'configuracoes' && (
              <ModuloConfiguracoesRecuperador
                configuracoes={configuracoes}
                onChange={setConfiguracoes}
              />
            )}

            {moduloAtivo === 'pis_cofins' && (
              <BlocoPisCofinsRecuperador
                tesesDefinicoes={TESES_RECUPERADOR}
                tesesSelecionadas={tesesSelecionadas}
                resultadosTeses={resultadosAtuais.resultadosTeses}
                onChangeTese={handleUpdateTese}
              />
            )}

            {moduloAtivo === 'folha' && (
              <BlocoFolhaPrevidenciarioRecuperador
                tesesDefinicoes={TESES_RECUPERADOR}
                tesesSelecionadas={tesesSelecionadas}
                resultadosTeses={resultadosAtuais.resultadosTeses}
                onChangeTese={handleUpdateTese}
              />
            )}

            {moduloAtivo === 'apuracao_selic' && (
              <ModuloApuracaoSelicRecuperador resultados={resultadosAtuais} />
            )}

            {moduloAtivo === 'dashboard' && (
              <ModuloDashboardRecuperador
                resultados={resultadosAtuais}
                cenarioSelecionado={cenarioSelecionado}
                onChangeCenario={setCenarioSelecionado}
                onGerarPdf={() => setModalPdfAberto(true)}
                onSalvarAnalise={() => setModalSalvarAberto(true)}
              />
            )}

            {/* AVISO TÉCNICO REGULATÓRIO */}
            <div className="mt-12 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs space-y-2">
              <div className="font-bold text-[#07132B] text-sm">
                Aviso Legal & Condições de Homologação
              </div>
              <p className="leading-relaxed">
                Os valores apresentados neste simulador constituem projeções administrativas
                baseadas na aplicação de alíquotas e jurisprudência vinculante do STF e STJ sobre os
                dados declarados. O valor final definitivo passível de compensação via PER/DCOMP ou
                restituição em conta corrente depende impreterivelmente da auditoria e validação dos
                arquivos digitais oficiais (SPED Fiscal, EFD-Contribuições, eSocial e Folha de
                Pagamento Analítica) da empresa.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Deseja auditar seus arquivos SPED e homologar esses créditos?"
        subtitulo="Nossa equipe de especialistas tributários realiza a validação cruzada das suas declarações dos últimos 60 meses para garantir segurança jurídica e monetização rápida via PER/DCOMP."
      />

      {/* MODAL SALVAR ANÁLISE */}
      <ModalSalvarRecuperador
        open={modalSalvarAberto}
        onOpenChange={setModalSalvarAberto}
        parametros={parametrosAtuais}
        resultados={resultadosAtuais}
        onSalvoComSucesso={() => {
          recarregarSimulacoes()
        }}
      />

      {/* MODAL RESPONSÁVEL TÉCNICO PARA PDF */}
      <ModalGerarPdf
        open={modalPdfAberto}
        onOpenChange={setModalPdfAberto}
        titulo="Emitir Parecer Técnico de Recuperação de Créditos"
        descricao="Preencha os dados do Responsável Técnico para constar na capa, cabeçalho e termo de encerramento do parecer."
        modo="individual"
        onConfirmar={handleConfirmarPdf}
        gerando={gerandoPdf}
      />
    </div>
  )
}
