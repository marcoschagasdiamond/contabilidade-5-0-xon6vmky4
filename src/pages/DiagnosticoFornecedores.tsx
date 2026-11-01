import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { PainelSucessoFluxoGuiado } from '@/components/diagnosticos/PainelSucessoFluxoGuiado'
import { ModalEditarFornecedor } from '@/components/diagnosticos/ModalEditarFornecedor'
import { ModalImportarPlanilhaFornecedores } from '@/components/diagnosticos/ModalImportarPlanilhaFornecedores'
import { CardComparadorCotacoes } from '@/components/diagnosticos/CardComparadorCotacoes'
import { type ResultadoComparadorCotacoes } from '@/lib/calculoComparadorCotacoes'
import { Button } from '@/components/ui/button'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { type AnoBaseSimulacao, ANOS_SIMULACAO_DISPONIVEIS } from '@/lib/reformaTributaria'
import {
  type RegimeComprador,
  normalizarRegimeComprador,
  calcularResumoCarteiraFornecedores,
  obterAliquotasCreditoPorAno,
} from '@/lib/calculoFornecedores'
import {
  listarFornecedores,
  criarFornecedor,
  atualizarFornecedor,
  excluirFornecedor,
  salvarLoteFornecedores,
  limparFornecedoresPorCliente,
  type FornecedorDiagnostico,
  type FornecedorDiagnosticoRecord,
} from '@/services/fornecedores'
import { listarHistoricoCotacoes, type HistoricoCotacaoRecord } from '@/services/historicoCotacoes'
import { gerarPdfParecerFornecedores } from '@/lib/pdfParecerFornecedores'
import pb from '@/lib/pocketbase/client'

export default function DiagnosticoFornecedores() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { clienteAtivoId } = useClienteAtivo()
  const { dadosEmpresa, temDadosSalvos } = useDadosEmpresa()

  // 1. Herança das Configurações (Etapa 01): Ano da transição e Regime Atual
  const anoHerdado: AnoBaseSimulacao = useMemo(() => {
    const rawAno = (dadosEmpresa as any)?.anoBaseTransicao
    if (rawAno && ANOS_SIMULACAO_DISPONIVEIS.includes(Number(rawAno) as AnoBaseSimulacao)) {
      return Number(rawAno) as AnoBaseSimulacao
    }
    return 2027
  }, [dadosEmpresa])

  const regimeHerdado: RegimeComprador = useMemo(() => {
    return normalizarRegimeComprador(dadosEmpresa.regimeAtual)
  }, [dadosEmpresa.regimeAtual])

  // 2. Estado local com Override nesta etapa (sem afetar Etapa 01 nem demais etapas)
  const [anoLocal, setAnoLocal] = useState<AnoBaseSimulacao>(anoHerdado)
  const [regimeLocal, setRegimeLocal] = useState<RegimeComprador>(regimeHerdado)
  const [anoCustomizado, setAnoCustomizado] = useState(false)
  const [regimeCustomizado, setRegimeCustomizado] = useState(false)

  // Sincroniza se o usuário não tiver feito override manual
  useEffect(() => {
    if (!anoCustomizado) {
      setAnoLocal(anoHerdado)
    }
  }, [anoHerdado, anoCustomizado])

  useEffect(() => {
    if (!regimeCustomizado) {
      setRegimeLocal(regimeHerdado)
    }
  }, [regimeHerdado, regimeCustomizado])

  // 3. Fornecedores cadastrados
  const [carregando, setCarregando] = useState(true)
  const [fornecedores, setFornecedores] = useState<FornecedorDiagnostico[]>([])
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<FornecedorDiagnostico | null>(null)
  const [modalImportarAberto, setModalImportarAberto] = useState(false)
  const [painelSucessoAberto, setPainelSucessoAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [resultadoComparador, setResultadoComparador] =
    useState<ResultadoComparadorCotacoes | null>(null)
  const [historicoCotacoesCarteira, setHistoricoCotacoesCarteira] = useState<
    HistoricoCotacaoRecord[]
  >([])

  // Filtro visual de regime na listagem
  const [filtroRegime, setFiltroRegime] = useState<string>('todos')
  const [buscaNome, setBuscaNome] = useState('')

  // Carrega fornecedores do PocketBase ou dados de demonstração
  const carregarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const authUserId = pb.authStore.record?.id || user?.id
      const records = await listarFornecedores({
        clienteId: clienteAtivoId,
        userId: authUserId,
      })

      const histRecords = await listarHistoricoCotacoes({
        clienteId: clienteAtivoId,
        userId: authUserId,
      })
      setHistoricoCotacoesCarteira(histRecords)

      if (records.length > 0) {
        setFornecedores(records)
      } else {
        // Se ainda não houver nenhum no banco, semeia uma carteira demonstrativa rica de 6 fornecedores
        const demo: FornecedorDiagnostico[] = [
          {
            nome: 'Siderúrgica Nacional de Aços S.A.',
            cnpj: '11.222.333/0001-44',
            regime: 'lucro_real',
            volume_compras: 1200000,
            classificacao_credito: 'integral',
            descricao_item: 'Bobinas de aço e matéria-prima primária',
          },
          {
            nome: 'Distribuidora Paulista de Químicos Ltda',
            cnpj: '22.333.444/0001-55',
            regime: 'lucro_presumido',
            volume_compras: 750000,
            classificacao_credito: 'integral',
            descricao_item: 'Solventes e polímeros industriais',
          },
          {
            nome: 'Comercial Embalagens Express ME',
            cnpj: '33.444.555/0001-66',
            regime: 'simples_nacional',
            volume_compras: 480000,
            classificacao_credito: 'integral',
            descricao_item: 'Caixas de papelão e rótulos personalizados',
          },
          {
            nome: 'Cooperativa Agrícola Mista Vale Verde',
            cnpj: '44.555.666/0001-77',
            regime: 'misto',
            proporcao_misto: 60,
            volume_compras: 390000,
            classificacao_credito: 'integral',
            descricao_item: 'Insumos agrícolas consorciados',
          },
          {
            nome: 'Papelaria & Escritório Alpha Comércio',
            cnpj: '55.666.777/0001-88',
            regime: 'simples_nacional',
            volume_compras: 95000,
            classificacao_credito: 'nao_gera',
            descricao_item: 'Material de escritório e copa (sem crédito)',
          },
          {
            nome: 'Transportes e Cargas Rápidas Eireli',
            cnpj: '66.777.888/0001-99',
            regime: 'lucro_real',
            volume_compras: 260000,
            classificacao_credito: 'parcial',
            percentual_credito_parcial: 70,
            descricao_item: 'Frete e logística com crédito parcial',
          },
        ]
        setFornecedores(demo)
      }
    } catch (err) {
      console.warn('Erro ao carregar carteira de fornecedores:', err)
    } finally {
      setCarregando(false)
    }
  }, [clienteAtivoId, user?.id])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // 4. Executa cálculo completo da carteira
  const resumo = useMemo(() => {
    return calcularResumoCarteiraFornecedores(fornecedores, anoLocal, regimeLocal)
  }, [fornecedores, anoLocal, regimeLocal])

  // Filtragem da tabela
  const fornecedoresExibidos = useMemo(() => {
    return resumo.detalhamentoPorFornecedor.filter((item) => {
      const bateRegime = filtroRegime === 'todos' || item.fornecedor.regime === filtroRegime
      const bateNome =
        !buscaNome.trim() ||
        item.fornecedor.nome.toLowerCase().includes(buscaNome.toLowerCase()) ||
        (item.fornecedor.cnpj && item.fornecedor.cnpj.includes(buscaNome))
      return bateRegime && bateNome
    })
  }, [resumo.detalhamentoPorFornecedor, filtroRegime, buscaNome])

  // Ações de persistência
  const handleSalvarFornecedor = async (
    data: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>,
  ) => {
    try {
      const authUserId = pb.authStore.record?.id || user?.id
      const payload = {
        ...data,
        cliente_id: clienteAtivoId || undefined,
        user_id: authUserId || undefined,
      }

      if (fornecedorEmEdicao?.id) {
        await atualizarFornecedor(fornecedorEmEdicao.id, payload)
        toast({
          title: 'Fornecedor Atualizado',
          description: `Os dados de ${data.nome} foram recalculados.`,
        })
      } else {
        await criarFornecedor(payload)
        toast({
          title: 'Fornecedor Cadastrado',
          description: `${data.nome} foi adicionado à carteira.`,
        })
      }
      await carregarDados()
      setPainelSucessoAberto(true)
    } catch (err) {
      // Fallback local se erro de rede
      if (fornecedorEmEdicao) {
        setFornecedores((prev) =>
          prev.map((f) => (f.nome === fornecedorEmEdicao.nome ? { ...f, ...data } : f)),
        )
      } else {
        setFornecedores((prev) => [data, ...prev])
      }
      toast({
        title: 'Atualizado Localmente',
        description: 'Fornecedor salvo para cálculo nesta sessão.',
      })
      setPainelSucessoAberto(true)
    }
  }

  const handleExcluirFornecedor = async (f: FornecedorDiagnostico) => {
    if (!window.confirm(`Deseja remover o fornecedor "${f.nome}" da carteira?`)) return

    try {
      if (f.id) {
        await excluirFornecedor(f.id)
      }
      setFornecedores((prev) => prev.filter((item) => item.nome !== f.nome))
      toast({
        title: 'Fornecedor Removido',
        description: `${f.nome} foi retirado da análise.`,
      })
    } catch (e) {
      setFornecedores((prev) => prev.filter((item) => item.nome !== f.nome))
    }
  }

  const handleImportacaoPlanilha = async (
    lista: Array<Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>>,
  ) => {
    try {
      const authUserId = pb.authStore.record?.id || user?.id
      const comVinculos = lista.map((f) => ({
        ...f,
        cliente_id: clienteAtivoId || undefined,
        user_id: authUserId || undefined,
      }))

      await salvarLoteFornecedores(comVinculos)
      toast({
        title: 'Planilha Importada!',
        description: `${lista.length} fornecedores importados com sucesso.`,
      })
      await carregarDados()
      setPainelSucessoAberto(true)
    } catch (err) {
      setFornecedores((prev) => [...lista, ...prev])
      toast({
        title: 'Planilha Carregada Localmente',
        description: `${lista.length} fornecedores carregados nesta sessão.`,
      })
      setPainelSucessoAberto(true)
    }
  }

  const handleGerarPdf = () => {
    setGerandoPdf(true)
    try {
      gerarPdfParecerFornecedores(
        resumo,
        {
          nomeEmpresa: dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada',
          cnpj: dadosEmpresa.cnpj,
          cidade: dadosEmpresa.cidade,
          uf: dadosEmpresa.ufOrigem,
          segmento: dadosEmpresa.segmento,
          regimeAtual: dadosEmpresa.regimeAtual,
        },
        resultadoComparador,
        historicoCotacoesCarteira,
      )
      toast({
        title: 'Parecer Gerado!',
        description: 'O download do PDF de Análise de Fornecedores foi iniciado.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível compilar o parecer em PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* NAVEGAÇÃO DA TRILHA */}
      <TrilhaDiagnosticoNav
        paginaAtual="hub"
        nomeEmpresa={dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* CABEÇALHO DA ETAPA 06 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] mb-3">
              <span>ETAPA 06 • ANÁLISE DE FORNECEDORES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900 tracking-tight">
              Diagnóstico de Perda e Ganho de Créditos na Carteira
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Avalie o impacto real de comprar de empresas do <strong>Simples Nacional</strong>,{' '}
              <strong>Lucro Presumido</strong>, <strong>Lucro Real</strong> ou{' '}
              <strong>Misto</strong>. O cálculo compara o crédito aproveitado contra o regime
              regular (~26,5% vs. 3–7%) e respeita a classificação tributária de cada item
              adquirido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalImportarAberto(true)}
              className="text-xs font-bold border-[#07132B] text-[#07132B] hover:bg-slate-100"
            >
              Importar Planilha CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setFornecedorEmEdicao(null)
                setModalEditarAberto(true)
              }}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#0c224c] text-white border border-[#D4AF37]/50"
            >
              + Novo Fornecedor
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={gerandoPdf}
              onClick={handleGerarPdf}
              className="text-xs font-extrabold bg-[#D4AF37] hover:bg-[#c29f2c] text-[#07132B] shadow-md"
            >
              {gerandoPdf ? 'Gerando Parecer...' : 'Gerar parecer de fornecedores'}
            </Button>
          </div>
        </div>

        {/* PAINEL DE CONTROLE DE HERANÇA E OVERRIDE LOCAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Controle de Parâmetros da Etapa
              </span>
              <h2 className="text-base font-heading font-extrabold text-slate-900">
                Regime do Adquirente e Ano da Transição
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Origem:</span>
              <BadgeOrigemPropagada origem="Configurações (Etapa 01)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seletor Ano da Transição (com badge herdado vs ajustado) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Ano da Transição em Foco (2026–2033)
                </span>
                {anoCustomizado ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span>ajustado nesta etapa</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnoCustomizado(false)
                        setAnoLocal(anoHerdado)
                      }}
                      className="text-amber-900 underline hover:text-amber-950 text-[9px]"
                      title="Voltar ao ano herdado das Configurações"
                    >
                      (voltar ao herdado)
                    </button>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    herdado ({anoHerdado})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {ANOS_SIMULACAO_DISPONIVEIS.map((ano) => (
                  <button
                    key={ano}
                    type="button"
                    onClick={() => {
                      setAnoLocal(ano)
                      if (ano !== anoHerdado) {
                        setAnoCustomizado(true)
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      anoLocal === ano
                        ? 'bg-[#07132B] text-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Alíquota regular em {anoLocal}:{' '}
                <strong className="text-slate-800">
                  {obterAliquotasCreditoPorAno(anoLocal).aliquotaRegimeRegular * 100}%
                </strong>{' '}
                vs Simples Nacional:{' '}
                <strong className="text-slate-800">
                  ~{(obterAliquotasCreditoPorAno(anoLocal).aliquotaSimplesMedia * 100).toFixed(1)}%
                </strong>
              </p>
            </div>

            {/* Seletor Regime do Comprador (com badge herdado vs ajustado) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Regime do Comprador (Sua Empresa)
                </span>
                {regimeCustomizado ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span>ajustado nesta etapa</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRegimeCustomizado(false)
                        setRegimeLocal(regimeHerdado)
                      }}
                      className="text-amber-900 underline hover:text-amber-950 text-[9px]"
                      title="Voltar ao regime herdado das Configurações"
                    >
                      (voltar ao herdado)
                    </button>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    herdado (
                    {regimeHerdado === 'lucro_real'
                      ? 'Lucro Real'
                      : regimeHerdado === 'lucro_presumido'
                        ? 'Presumido'
                        : 'Simples'}
                    )
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lucro_real' as const, label: 'Lucro Real' },
                  { id: 'lucro_presumido' as const, label: 'Presumido' },
                  { id: 'simples_nacional' as const, label: 'Simples Nacional' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRegimeLocal(r.id)
                      if (r.id !== regimeHerdado) {
                        setRegimeCustomizado(true)
                      }
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      regimeLocal === r.id
                        ? 'bg-[#07132B] text-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                {regimeLocal === 'simples_nacional'
                  ? 'Atenção: Optantes do Simples Nacional tradicional não aproveitam crédito tributário na entrada.'
                  : 'Empresa do Regime Regular aproveita créditos e apura custo líquido e perdas de aquisição.'}
              </p>
            </div>
          </div>
        </div>

        {/* CARDS COM TOTAIS CONSOLIDADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Volume Total de Compras
            </span>
            <p className="text-2xl font-heading font-black text-slate-900 font-mono">
              R$ {resumo.volumeTotalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500">{resumo.totalFornecedores} fornecedores ativos</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Crédito Aproveitável ({anoLocal})
            </span>
            <p className="text-2xl font-heading font-black text-emerald-700 font-mono">
              R${' '}
              {resumo.creditoAproveitavelTotal.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-emerald-600">Economia fiscal na entrada sob a LC 214</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Custo Líquido de Aquisição
            </span>
            <p className="text-2xl font-heading font-black text-[#07132B] font-mono">
              R$ {resumo.custoLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500">Preço pago líquido de créditos</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Crédito Perdido (Gargalo da Carteira)
            </span>
            <p className="text-2xl font-heading font-black text-rose-700 font-mono">
              R$ {resumo.creditoPerdidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-rose-600">
              {resumo.percentualMedioPerda.toFixed(1)}% do volume total de compras
            </p>
          </div>
        </div>

        {/* RANKING DE GARGALOS (DESTAQUE DOS MAIORES PONTOS DE PERDA) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                Foco Estratégico • Gargalos de Compras
              </span>
              <h2 className="text-lg font-heading font-extrabold text-slate-900">
                Ranking de Fornecedores por Crédito Perdido
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Ordenado pelos maiores desvios contra o regime regular
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">Posição</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Regime</th>
                  <th className="py-2.5 px-3">Classificação Item</th>
                  <th className="py-2.5 px-3 text-right">Volume Compras</th>
                  <th className="py-2.5 px-3 text-right">Crédito Ganho</th>
                  <th className="py-2.5 px-3 text-right">Custo Líquido</th>
                  <th className="py-2.5 px-3 text-right">Crédito Perdido</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumo.rankingGargalos.slice(0, 5).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {item.fornecedor.nome}
                      {item.fornecedor.cnpj && (
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {item.fornecedor.cnpj}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                        {item.fornecedor.regime === 'lucro_real'
                          ? 'Lucro Real'
                          : item.fornecedor.regime === 'lucro_presumido'
                            ? 'Lucro Presumido'
                            : item.fornecedor.regime === 'simples_nacional'
                              ? 'Simples Nacional'
                              : `Misto (${item.fornecedor.proporcao_misto || 50}%)`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.fornecedor.classificacao_credito === 'integral'
                        ? 'Integral (100%)'
                        : item.fornecedor.classificacao_credito === 'parcial'
                          ? `Parcial (${item.fornecedor.percentual_credito_parcial || 50}%)`
                          : 'Não gera (0%)'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      R$ {item.volumeCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      R${' '}
                      {item.creditoAproveitavel.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      R${' '}
                      {item.custoLiquidoAquisicao.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-600">
                      R$ {item.creditoPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.ehGargalo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700">
                          Gargalo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                          Equilibrado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD SEPARADO: COMPARADOR DE COTAÇÕES (POSICIONADO APÓS O RANKING DA CARTEIRA) */}
        <CardComparadorCotacoes
          anoTransicao={anoLocal}
          regimeComprador={regimeLocal}
          onComparacaoAlterada={(res) => setResultadoComparador(res)}
          fornecedoresCadastrados={fornecedores}
          onFornecedorCadastrado={handleSalvarFornecedor}
          onCotacaoSalvaNoHistorico={carregarDados}
        />

        {/* COMPARATIVO COMPLETO DE TODOS OS ANOS DA TRANSIÇÃO (2026–2033) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                Cronograma Pleno EC 132/2023 & LC 214/2025
              </span>
              <h2 className="text-lg font-heading font-extrabold text-slate-900">
                Evolução Comparativa Ano a Ano (2026 a 2033)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Ano selecionado em destaque: <strong>{anoLocal}</strong>
            </span>
          </div>

          {/* Gráfico Visual de Barras com CSS nativo */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Evolução do Crédito Perdido na Carteira (R$)</span>
              <span className="text-slate-400 font-normal">
                Quanto mais avançada a transição, maior a penalidade de comprar do Simples sem
                desconto
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {resumo.evolucaoAnos.map((ev) => {
                const maxPerda = Math.max(
                  ...resumo.evolucaoAnos.map((e) => e.creditoPerdidoTotal),
                  1,
                )
                const pctAltura = Math.round((ev.creditoPerdidoTotal / maxPerda) * 100)
                const isAnoAtual = ev.ano === anoLocal

                return (
                  <div
                    key={ev.ano}
                    onClick={() => {
                      setAnoLocal(ev.ano)
                      if (ev.ano !== anoHerdado) setAnoCustomizado(true)
                    }}
                    className={`cursor-pointer p-2.5 rounded-xl border flex flex-col justify-end transition-all text-center group ${
                      isAnoAtual
                        ? 'bg-[#07132B] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="h-24 flex items-end justify-center mb-2">
                      <div
                        className={`w-full max-w-[28px] rounded-t transition-all ${
                          isAnoAtual ? 'bg-[#D4AF37]' : 'bg-rose-500 group-hover:bg-rose-600'
                        }`}
                        style={{ height: `${Math.max(12, pctAltura)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs">{ev.ano}</span>
                    <span
                      className={`text-[10px] font-mono mt-0.5 truncate ${
                        isAnoAtual ? 'text-[#D4AF37]' : 'text-slate-500'
                      }`}
                    >
                      R$ {(ev.creditoPerdidoTotal / 1000).toFixed(0)}k
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tabela de Todos os Anos da Transição */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">Ano</th>
                  <th className="py-2.5 px-3 text-center">Alíquota Regular</th>
                  <th className="py-2.5 px-3 text-center">Alíquota Simples</th>
                  <th className="py-2.5 px-3 text-right">Crédito Aproveitado</th>
                  <th className="py-2.5 px-3 text-right">Custo Líquido</th>
                  <th className="py-2.5 px-3 text-right">Crédito Perdido</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumo.evolucaoAnos.map((ev) => {
                  const isAnoFoco = ev.ano === anoLocal
                  return (
                    <tr
                      key={ev.ano}
                      className={`transition-colors ${
                        isAnoFoco ? 'bg-amber-50/70 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isAnoFoco
                              ? 'bg-[#07132B] text-[#D4AF37]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ev.ano} {isAnoFoco ? '★ Foco' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {ev.aliquotaRegular.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {ev.aliquotaSimples.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600">
                        R${' '}
                        {ev.creditoAproveitavelTotal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        R${' '}
                        {ev.custoLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        R${' '}
                        {ev.creditoPerdidoTotal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {!isAnoFoco && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnoLocal(ev.ano)
                              setAnoCustomizado(true)
                            }}
                            className="text-[11px] text-[#07132B] underline hover:font-bold"
                          >
                            Simular este ano
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LISTAGEM COMPLETA E GESTÃO DA CARTEIRA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Carteira de Fornecedores Cadastrada
              </span>
              <h2 className="text-lg font-heading font-extrabold text-slate-900">
                Todos os Fornecedores ({fornecedoresExibidos.length} de {fornecedores.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buscar fornecedor..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs w-44"
              />

              <select
                value={filtroRegime}
                onChange={(e) => setFiltroRegime(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="todos">Todos os Regimes</option>
                <option value="lucro_real">Lucro Real</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="simples_nacional">Simples Nacional</option>
                <option value="misto">Misto</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Regime</th>
                  <th className="py-2.5 px-3">Classificação Item</th>
                  <th className="py-2.5 px-3 text-right">Volume Compras</th>
                  <th className="py-2.5 px-3 text-right">Crédito Ganho</th>
                  <th className="py-2.5 px-3 text-right">Custo Líquido</th>
                  <th className="py-2.5 px-3 text-right">Crédito Perdido</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fornecedoresExibidos.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {item.fornecedor.nome}
                      {item.fornecedor.descricao_item && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.fornecedor.descricao_item}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                        {item.fornecedor.regime === 'lucro_real'
                          ? 'Lucro Real'
                          : item.fornecedor.regime === 'lucro_presumido'
                            ? 'Lucro Presumido'
                            : item.fornecedor.regime === 'simples_nacional'
                              ? 'Simples Nacional'
                              : `Misto (${item.fornecedor.proporcao_misto || 50}%)`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.fornecedor.classificacao_credito === 'integral'
                        ? 'Integral (100%)'
                        : item.fornecedor.classificacao_credito === 'parcial'
                          ? `Parcial (${item.fornecedor.percentual_credito_parcial || 50}%)`
                          : 'Não gera crédito'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      R$ {item.volumeCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      R${' '}
                      {item.creditoAproveitavel.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      R${' '}
                      {item.custoLiquidoAquisicao.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-600">
                      R$ {item.creditoPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFornecedorEmEdicao(item.fornecedor)
                            setModalEditarAberto(true)
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirFornecedor(item.fornecedor)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px]"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAINEL DE SUCESSO FLUXO GUIADO */}
        <PainelSucessoFluxoGuiado
          aberto={painelSucessoAberto}
          onClose={() => setPainelSucessoAberto(false)}
          titulo="Etapa 06 Concluída • Análise de Fornecedores Sincronizada"
          mensagem="A carteira de fornecedores foi calculada sob o cronograma da LC 214/2025. Você pode avançar para o Relatório Consolidado da Trilha ou revisar o parecer em PDF."
          proximaEtapaNome="Relatório Consolidado"
          proximaEtapaRota="/diagnostico/relatorio"
          etapaConcluidaNumero="06"
          etapaConcluidaNome="Análise de Fornecedores"
          etapaFinal={false}
        />

        {/* MODAL DE EDIÇÃO/CADASTRO */}
        <ModalEditarFornecedor
          aberto={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          fornecedorInicial={fornecedorEmEdicao}
          onSalvar={handleSalvarFornecedor}
        />

        {/* MODAL DE IMPORTAÇÃO CSV/XLSX */}
        <ModalImportarPlanilhaFornecedores
          aberto={modalImportarAberto}
          onOpenChange={setModalImportarAberto}
          onImportarSucesso={handleImportacaoPlanilha}
        />
      </div>
    </div>
  )
}
