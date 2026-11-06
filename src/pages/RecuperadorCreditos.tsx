import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useFonteMestraSync } from '@/hooks/useFonteMestraSync'
import { camposDivergem } from '@/lib/fonteMestra'
import { carregarDadosEmpresa, existeDadosEmpresaSalvos } from '@/types/dadosEmpresa'
import { carregarSimulacoesLocais } from '@/services/simulacoesCalculadora'
import { derivarAnosFaturamentoDeMensal } from '@/lib/recuperadorCreditosCalculo'
import type { Cliente } from '@/types/cliente'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import {
  TESES_RECUPERADOR,
  CONFIGURACOES_PADRAO,
  obterTesesPorSegmento,
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
import { isTeseCancelamentoAtiva, marcarTesesRelacionadasEst04 } from '@/lib/relacionamentoEst04'

import { AvisoOrientativo } from '@/components/common/AvisoOrientativo'

// Submódulos
import ModuloConfiguracoesRecuperador from '@/components/recuperador/ModuloConfiguracoesRecuperador'
import BlocoPisCofinsRecuperador from '@/components/recuperador/BlocoPisCofinsRecuperador'
import BlocoFolhaPrevidenciarioRecuperador from '@/components/recuperador/BlocoFolhaPrevidenciarioRecuperador'
import { BlocoIrpjCsllRecuperador } from '@/components/recuperador/BlocoIrpjCsllRecuperador'
import { BlocoOutrosTributosRecuperador } from '@/components/recuperador/BlocoOutrosTributosRecuperador'
import ModuloApuracaoSelicRecuperador from '@/components/recuperador/ModuloApuracaoSelicRecuperador'
import ModuloDashboardRecuperador from '@/components/recuperador/ModuloDashboardRecuperador'
import { ModalSalvarRecuperador } from '@/components/recuperador/ModalSalvarRecuperador'
import { ListaSimulacoesRecuperador } from '@/components/recuperador/ListaSimulacoesRecuperador'
import { ModalExportarDadosSimulacao } from '@/components/calculadora/ModalExportarDadosSimulacao'
import { ModalImportarPlanilhaRecuperador } from '@/components/recuperador/ModalImportarPlanilhaRecuperador'
import { type SugestaoNcmRecuperador } from '@/lib/ncmRecuperadorCreditos'
import { type ResultadoImportacaoPlanilhaRecuperador } from '@/lib/importacaoRecuperadorPlanilha'
import { formatarCodigoNcm } from '@/data/tabelaNcmLc214'

type ModuloRecuperadorId =
  | 'configuracoes'
  | 'pis_cofins'
  | 'folha'
  | 'irpj_csll'
  | 'outros_tributos'
  | 'apuracao_selic'
  | 'dashboard'

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
    id: 'irpj_csll',
    numero: '04',
    titulo: 'IRPJ & CSLL',
    subtitulo: 'Temas 1008/STJ, 962/STF e Subvenções',
  },
  {
    id: 'outros_tributos',
    numero: '05',
    titulo: 'ICMS, ISS & ITCMD',
    subtitulo: 'Energia Fabril, ST e Temas 918/851',
  },
  {
    id: 'apuracao_selic',
    numero: '06',
    titulo: 'Apuração SELIC',
    subtitulo: 'Correção Oficial Ano a Ano',
  },
  {
    id: 'dashboard',
    numero: '07',
    titulo: 'Dashboard Executivo',
    subtitulo: 'KPIs e Cenários Conservador × Integral',
  },
]

export default function RecuperadorCreditos() {
  const { user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  // Função pura que deriva o estado inicial do Recuperador seguindo as prioridades:
  // 1) Empresa Ativa da Carteira
  // 2) Configurações da Calculadora IBS/CBS / Dados da Empresa salvos
  // 3) Zerado/vazio
  const derivarConfiguracoesIniciais = React.useCallback(
    (cliente: Cliente | null): ConfiguracoesRecuperador => {
      // 1. Prioridade 1: Empresa Ativa na Carteira
      if (cliente) {
        // Busca possíveis simulações vinculadas ao cliente para obter métricas financeiras se houver
        let fatMensalCliente = 0
        let pctComprasCliente = 0
        let anoTransicaoCliente: string | number = 2033
        let regimeAplicadoCliente = 'Padrão / Sem Redução'
        let folhaMensalCliente = 0

        try {
          const simsLocais = carregarSimulacoesLocais()
          const simDoCliente = simsLocais.find((s) => s.cliente_id === cliente.id)
          if (simDoCliente && simDoCliente.parametros) {
            fatMensalCliente =
              simDoCliente.parametros.faturamentoMensal ||
              simDoCliente.faturamento_mensal ||
              simDoCliente.parametros.config?.faturamentoMensal ||
              0
            pctComprasCliente =
              simDoCliente.parametros.percentualComprasVendasComparativo ??
              simDoCliente.parametros.percentualComprasVendasSimples ??
              simDoCliente.parametros.config?.percentualComprasVendas ??
              0
            anoTransicaoCliente =
              simDoCliente.parametros.config?.anoTransicao ||
              simDoCliente.parametros.anoTransicao ||
              2033
            regimeAplicadoCliente =
              simDoCliente.parametros.config?.presetSetor ||
              simDoCliente.parametros.regimeOperacao ||
              'Padrão / Sem Redução'
          }
        } catch {
          /* ignore */
        }

        // Se ainda não achou nas simulações daquele cliente, tenta dados de empresa
        if (fatMensalCliente === 0 && existeDadosEmpresaSalvos()) {
          const dadosEmp = carregarDadosEmpresa()
          if (
            dadosEmp.nomeEmpresa &&
            (dadosEmp.nomeEmpresa.toLowerCase() === cliente.nome.toLowerCase() ||
              dadosEmp.cnpj === cliente.cnpj_cpf)
          ) {
            fatMensalCliente = dadosEmp.faturamentoMensal || 0
            pctComprasCliente = dadosEmp.percentualComprasVendas || 0
            folhaMensalCliente = dadosEmp.folhaPagamentoMensal || 0
            anoTransicaoCliente = dadosEmp.anoBaseTransicao || 2033
          }
        }

        const regimeNormalizado: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional' =
          cliente.regime_atual === 'Lucro Real' ||
          cliente.regime_atual === 'Lucro Presumido' ||
          cliente.regime_atual === 'Simples Nacional'
            ? cliente.regime_atual
            : 'Lucro Presumido'

        const anosFat = derivarAnosFaturamentoDeMensal(fatMensalCliente)

        return {
          ...CONFIGURACOES_PADRAO,
          clienteId: cliente.id,
          empresa: cliente.nome || '',
          cnpj: cliente.cnpj_cpf || '',
          uf: cliente.uf || 'SP',
          segmento: cliente.segmento || 'Comércio',
          regimeAtual: regimeNormalizado,
          aliquotaPisCofinsPadrao: regimeNormalizado === 'Lucro Real' ? 9.25 : 3.65,
          faturamentoMensal: fatMensalCliente,
          percentualComprasVendas: pctComprasCliente,
          anosFaturamento: anosFat,
          massaSalarialMensal: folhaMensalCliente,
          anoTransicao: anoTransicaoCliente,
          regimeAplicado: regimeAplicadoCliente,
          origemPreenchimento: 'empresa_ativa',
          avisoOrigem: `Pré-preenchido com dados da Empresa Ativa na Carteira: ${cliente.nome}`,
        }
      }

      // 2. Prioridade 2: Configurações da Calculadora IBS/CBS / Dados da Empresa salvos
      if (existeDadosEmpresaSalvos()) {
        const dadosEmp = carregarDadosEmpresa()
        let regNormalizado: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional' =
          'Lucro Presumido'
        if (dadosEmp.regimeAtual?.includes('Real')) regNormalizado = 'Lucro Real'
        else if (dadosEmp.regimeAtual?.includes('Simples')) regNormalizado = 'Simples Nacional'

        const fatMensal = dadosEmp.faturamentoMensal || 0
        const anosFat = derivarAnosFaturamentoDeMensal(fatMensal)

        return {
          ...CONFIGURACOES_PADRAO,
          clienteId: null,
          empresa: dadosEmp.nomeEmpresa || '',
          cnpj: dadosEmp.cnpj || '',
          uf: dadosEmp.ufOrigem || 'SP',
          segmento: dadosEmp.segmento || 'Comércio',
          regimeAtual: regNormalizado,
          aliquotaPisCofinsPadrao: regNormalizado === 'Lucro Real' ? 9.25 : 3.65,
          faturamentoMensal: fatMensal,
          percentualComprasVendas: dadosEmp.percentualComprasVendas || 0,
          anosFaturamento: anosFat,
          massaSalarialMensal: dadosEmp.folhaPagamentoMensal || 0,
          anoTransicao: dadosEmp.anoBaseTransicao || 2033,
          regimeAplicado: 'Padrão / Sem Redução',
          perfilInsumosAliquotaCheia: dadosEmp.perfilInsumosAliquotaCheia,
          perfilInsumosMonofasicos: dadosEmp.perfilInsumosMonofasicos,
          perfilInsumosAliquotaReduzida: dadosEmp.perfilInsumosAliquotaReduzida,
          presencaMonofasicos: dadosEmp.presencaMonofasicos,
          categoriasMonofasicos: dadosEmp.categoriasMonofasicos,
          insumosEnergeticos: dadosEmp.insumosEnergeticos,
          intangiveisRoyalties: dadosEmp.intangiveisRoyalties,
          imobilizadoUltimos5Anos: dadosEmp.imobilizadoUltimos5Anos,
          imobilizadoAnosDetalhe: dadosEmp.imobilizadoAnosDetalhe,
          percentualComprasSemCredito: dadosEmp.percentualComprasSemCredito,
          saldoCredorAcumulado: dadosEmp.saldoCredorAcumulado,
          percentualVendasInterestaduais: dadosEmp.percentualVendasInterestaduais,
          regimeEspecialAtual: dadosEmp.regimeEspecialAtual,
          perfilRetencaoSplit: dadosEmp.perfilRetencaoSplit,
          percentualRetencaoSplit: dadosEmp.percentualRetencaoSplit,
          origemPreenchimento: 'calculadora_ibs_cbs',
          avisoOrigem: 'Pré-preenchido com dados salvos nas Configurações da Calculadora IBS/CBS',
        }
      }

      // 3. Sem histórico nem empresa ativa: todos os campos zerados/vazios
      return {
        ...CONFIGURACOES_PADRAO,
        clienteId: null,
        empresa: '',
        cnpj: '',
        regimeAtual: 'Lucro Presumido',
        segmento: '',
        uf: 'SP',
        anosFaturamento: derivarAnosFaturamentoDeMensal(0),
        numeroMedioEmpregados: 0,
        percentualRotatividadeAnual: 0,
        massaSalarialMensal: 0,
        faturamentoMensal: 0,
        percentualComprasVendas: 0,
        anoTransicao: 2033,
        regimeAplicado: 'Padrão / Sem Redução',
        origemPreenchimento: 'manual',
      }
    },
    [],
  )

  const [moduloAtivo, setModuloAtivo] = useState<ModuloRecuperadorId>(() => {
    const abaParam = searchParams.get('aba')
    const moduloParam = searchParams.get('modulo')
    const paramEfetivo = abaParam || moduloParam
    if (
      paramEfetivo === 'configuracoes' ||
      paramEfetivo === 'pis_cofins' ||
      paramEfetivo === 'folha' ||
      paramEfetivo === 'irpj_csll' ||
      paramEfetivo === 'outros_tributos' ||
      paramEfetivo === 'apuracao_selic' ||
      paramEfetivo === 'dashboard'
    ) {
      return paramEfetivo
    }
    const teseParam = searchParams.get('tese')
    if (teseParam) {
      if (teseParam.startsWith('tese_pis_')) return 'pis_cofins'
      if (teseParam.startsWith('tese_folha_')) return 'folha'
      if (teseParam.startsWith('tese_irpj_')) return 'irpj_csll'
      if (
        teseParam.startsWith('tese_icms_') ||
        teseParam.startsWith('tese_iss_') ||
        teseParam.startsWith('tese_itcmd_')
      ) {
        return 'outros_tributos'
      }
    }
    return 'dashboard'
  })
  // Fonte Mestra: dados cadastrais sincronizados automaticamente
  const dadosMestres = useFonteMestraSync()

  // IBS/CBS (integração antecipada, FATIA 2): leitura INERTE dos valores do novo
  // sistema importados em /dados-empresa. Apenas disponíveis para uso futuro —
  // nenhum cálculo, parâmetro default ou tese é alterado por eles.
  const ibsCbsImportados = React.useMemo(
    () => ({
      ibsDestacado: dadosMestres.documentoFiscalImportado?.totaisFiscais?.ibsDestacado,
      cbsDestacado: dadosMestres.documentoFiscalImportado?.totaisFiscais?.cbsDestacado,
      cstCClassTrib: dadosMestres.documentoFiscalImportado?.totaisFiscais?.cstCClassTrib,
      creditoIbsCbsApurado:
        dadosMestres.documentoFiscalImportado?.totaisFiscais?.creditoIbsCbsApurado,
      temDados: !!(
        dadosMestres.documentoFiscalImportado?.totaisFiscais?.ibsDestacado ||
        dadosMestres.documentoFiscalImportado?.totaisFiscais?.cbsDestacado ||
        dadosMestres.documentoFiscalImportado?.totaisFiscais?.creditoIbsCbsApurado
      ),
    }),
    [dadosMestres.documentoFiscalImportado],
  )
  void ibsCbsImportados

  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesRecuperador>(() =>
    derivarConfiguracoesIniciais(clienteAtivo),
  )
  const [tesesSelecionadas, setTesesSelecionadas] =
    useState<Record<string, TeseSelecaoUsuario>>(gerarSelecaoTesesPadrao())
  const [cenarioSelecionado, setCenarioSelecionado] = useState<'integral' | 'conservador'>(
    'integral',
  )

  // Modais
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [modalPdfAberto, setModalPdfAberto] = useState(false)
  const [modalExportarDadosAberto, setModalExportarDadosAberto] = useState(false)
  const [modalLimparAberto, setModalLimparAberto] = useState(false)
  const [modalImportarPlanilhaAberto, setModalImportarPlanilhaAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Simulações salvas
  const [simulacoes, setSimulacoes] = useState<SimulacaoRecuperador[]>([])

  // Sincronização automática quando a Fonte Mestra mudar (sem sobrescrever se o usuário fez override local divergente)
  useEffect(() => {
    // Se não há cliente ativo e a fonte mestra foi atualizada, sincroniza automaticamente
    if (!clienteAtivo && dadosMestres.nomeEmpresa) {
      setConfiguracoes((prev) => {
        // Se já está com dados de outra origem manual sem vínculo, atualiza os dados mestres
        let regNormalizado: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional' =
          'Lucro Presumido'
        if (dadosMestres.regimeAtual?.includes('Real')) regNormalizado = 'Lucro Real'
        else if (dadosMestres.regimeAtual?.includes('Simples')) regNormalizado = 'Simples Nacional'

        const fatMensal = dadosMestres.faturamentoMensal || 0
        const anosFat = derivarAnosFaturamentoDeMensal(fatMensal)

        return {
          ...prev,
          empresa: dadosMestres.nomeEmpresa || prev.empresa,
          cnpj: dadosMestres.cnpj || prev.cnpj,
          uf: dadosMestres.ufOrigem || prev.uf,
          segmento: dadosMestres.segmento || prev.segmento,
          regimeAtual: regNormalizado,
          aliquotaPisCofinsPadrao: regNormalizado === 'Lucro Real' ? 9.25 : 3.65,
          faturamentoMensal: fatMensal,
          percentualComprasVendas: dadosMestres.percentualComprasVendas || 0,
          anosFaturamento: anosFat,
          massaSalarialMensal: dadosMestres.folhaPagamentoMensal || 0,
          anoTransicao: dadosMestres.anoBaseTransicao || 2033,
          perfilInsumosAliquotaCheia: dadosMestres.perfilInsumosAliquotaCheia,
          perfilInsumosMonofasicos: dadosMestres.perfilInsumosMonofasicos,
          perfilInsumosAliquotaReduzida: dadosMestres.perfilInsumosAliquotaReduzida,
          presencaMonofasicos: dadosMestres.presencaMonofasicos,
          categoriasMonofasicos: dadosMestres.categoriasMonofasicos,
          insumosEnergeticos: dadosMestres.insumosEnergeticos,
          intangiveisRoyalties: dadosMestres.intangiveisRoyalties,
          imobilizadoUltimos5Anos: dadosMestres.imobilizadoUltimos5Anos,
          imobilizadoAnosDetalhe: dadosMestres.imobilizadoAnosDetalhe,
          percentualComprasSemCredito: dadosMestres.percentualComprasSemCredito,
          saldoCredorAcumulado: dadosMestres.saldoCredorAcumulado,
          percentualVendasInterestaduais: dadosMestres.percentualVendasInterestaduais,
          regimeEspecialAtual: dadosMestres.regimeEspecialAtual,
          perfilRetencaoSplit: dadosMestres.perfilRetencaoSplit,
          percentualRetencaoSplit: dadosMestres.percentualRetencaoSplit,
          origemPreenchimento: 'dados_empresa',
          avisoOrigem: 'Alimentado automaticamente pelos Dados da Empresa (Fonte Mestra)',
        }
      })
    }
  }, [dadosMestres, clienteAtivo])

  // Identificação de divergência local (override manual no Recuperador em relação ao cadastro mestre)
  const temDivergenciaMestre = React.useMemo(() => {
    return (
      camposDivergem(configuracoes.segmento, dadosMestres.segmento) ||
      camposDivergem(configuracoes.regimeAtual, dadosMestres.regimeAtual) ||
      camposDivergem(configuracoes.uf, dadosMestres.ufOrigem) ||
      camposDivergem(configuracoes.faturamentoMensal, dadosMestres.faturamentoMensal) ||
      camposDivergem(configuracoes.massaSalarialMensal, dadosMestres.folhaPagamentoMensal)
    )
  }, [
    configuracoes.segmento,
    configuracoes.regimeAtual,
    configuracoes.uf,
    configuracoes.faturamentoMensal,
    configuracoes.massaSalarialMensal,
    dadosMestres.segmento,
    dadosMestres.regimeAtual,
    dadosMestres.ufOrigem,
    dadosMestres.faturamentoMensal,
    dadosMestres.folhaPagamentoMensal,
  ])

  // Restaura os dados iniciais do cadastro do cliente neste módulo (seleção de teses permanece intacta)
  const handleRestaurarDadosMestres = React.useCallback(() => {
    const novasConfigs = derivarConfiguracoesIniciais(clienteAtivo)
    setConfiguracoes(novasConfigs)
    toast({
      title: 'Dados restaurados',
      description: 'As configurações do Recuperador retornaram aos dados do cadastro do cliente.',
    })
  }, [clienteAtivo, derivarConfiguracoesIniciais])

  // Se o cliente ativo mudar, sincroniza empresa/CNPJ/regime/faturamento com prioridade da Empresa Ativa
  useEffect(() => {
    if (clienteAtivo) {
      const novasConfigs = derivarConfiguracoesIniciais(clienteAtivo)
      setConfiguracoes((prev) => {
        // Preserva valores ajustados manualmente se o cliente for o mesmo
        if (prev.clienteId === clienteAtivo.id) {
          return {
            ...novasConfigs,
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
            origemPreenchimento: 'empresa_ativa',
            avisoOrigem: `Pré-preenchido com dados da Empresa Ativa na Carteira: ${clienteAtivo.nome}`,
          }
        }
        return novasConfigs
      })
    } else {
      // Quando cliente ativo for desmarcado, se houver configs da calculadora preenche com elas, senão mantém
      setConfiguracoes((prev) => {
        if (prev.origemPreenchimento === 'empresa_ativa') {
          return derivarConfiguracoesIniciais(null)
        }
        return prev
      })
    }
  }, [clienteAtivo, derivarConfiguracoesIniciais])

  // Recarrega simulações salvas
  const recarregarSimulacoes = async () => {
    const lista = await listarSimulacoesRecuperador(user?.id)
    setSimulacoes(lista)
  }

  useEffect(() => {
    recarregarSimulacoes()
  }, [user?.id])

  // Detecção de simulação na query string (?simulacao=...)
  useEffect(() => {
    const idSimulacao = searchParams.get('simulacao')
    if (idSimulacao) {
      const carregar = async () => {
        try {
          const { obterSimulacaoRecuperadorPorId } =
            await import('@/services/simulacoesRecuperador')
          const sim = await obterSimulacaoRecuperadorPorId(idSimulacao)
          if (sim && sim.parametros) {
            handleCarregarSimulacao(sim)
          }
        } catch (err) {
          console.error('Erro ao carregar simulação de recuperador da URL:', err)
        }
      }
      carregar()
    }
  }, [searchParams])

  // Trata deep link da tese vindo de /legislacao ou notificações (?aba=... ou ?modulo=...&tese=...)
  useEffect(() => {
    const abaParam = searchParams.get('aba')
    const moduloParam = searchParams.get('modulo')
    const paramEfetivo = abaParam || moduloParam
    if (
      paramEfetivo === 'configuracoes' ||
      paramEfetivo === 'pis_cofins' ||
      paramEfetivo === 'folha' ||
      paramEfetivo === 'irpj_csll' ||
      paramEfetivo === 'outros_tributos' ||
      paramEfetivo === 'apuracao_selic' ||
      paramEfetivo === 'dashboard'
    ) {
      setModuloAtivo(paramEfetivo)
    }

    const teseParam = searchParams.get('tese')
    if (teseParam) {
      if (!paramEfetivo) {
        if (teseParam.startsWith('tese_pis_')) {
          setModuloAtivo('pis_cofins')
        } else if (teseParam.startsWith('tese_folha_')) {
          setModuloAtivo('folha')
        } else if (teseParam.startsWith('tese_irpj_')) {
          setModuloAtivo('irpj_csll')
        } else if (
          teseParam.startsWith('tese_icms_') ||
          teseParam.startsWith('tese_iss_') ||
          teseParam.startsWith('tese_itcmd_')
        ) {
          setModuloAtivo('outros_tributos')
        }
      }
      // Ativa a tese explicitamente caso estivesse inativa
      setTesesSelecionadas((prev) => {
        const existente = prev[teseParam]
        if (existente) {
          if (!existente.ativa) {
            return {
              ...prev,
              [teseParam]: { ...existente, ativa: true },
            }
          }
          return prev
        }
        return {
          ...prev,
          [teseParam]: {
            teseId: teseParam,
            ativa: true,
            farol: 'verde',
          },
        }
      })
    }
  }, [searchParams])

  // Teses filtradas pelo segmento selecionado no Módulo 1 (Configurações)
  const tesesElegiveisSetor = React.useMemo(() => {
    return obterTesesPorSegmento(configuracoes.segmento)
  }, [configuracoes.segmento])

  // Cálculo reativo — calcula apenas as teses elegíveis do setor
  const parametrosAtuais: ParametrosRecuperador = {
    configuracoes,
    teses: tesesSelecionadas,
    cenarioSelecionado,
  }

  const resultadosAtuais: ResultadosRecuperador = React.useMemo(() => {
    return calcularRecuperadorCreditos(parametrosAtuais, { filtrarPorSetor: true })
  }, [parametrosAtuais])

  // Camada de relacionamento com a tese EST-04 (Cancelamento de NF-e e Devoluções):
  // apenas indicação textual — não altera seleção nem cálculo.
  const est04Ativa = isTeseCancelamentoAtiva(tesesSelecionadas)
  const tesesElegiveisComRelacaoEst04 = React.useMemo(
    () => marcarTesesRelacionadasEst04(tesesElegiveisSetor, est04Ativa),
    [tesesElegiveisSetor, est04Ativa],
  )

  const handleUpdateTese = (teseId: string, atualizacao: Partial<TeseSelecaoUsuario>) => {
    setTesesSelecionadas((prev) => ({
      ...prev,
      [teseId]: {
        ...prev[teseId],
        ...atualizacao,
      },
    }))
  }

  // Sugestão automática de teses via NCM com override manual irrestrito
  const handleAplicarSugestaoNcm = (sug: SugestaoNcmRecuperador) => {
    const codFormatado = formatarCodigoNcm(sug.itemCurado.codigoLimpo)

    setTesesSelecionadas((prev) => {
      const novas = { ...prev }
      sug.tesesSugeridasIds.forEach((tId) => {
        novas[tId] = {
          ...(novas[tId] || { teseId: tId, farol: 'verde', percentualBaseCustomizado: undefined }),
          teseId: tId,
          ativa: true,
          origem: 'ncm_sugerido',
          ncmReferencia: codFormatado,
        }
      })
      return novas
    })

    toast({
      title: 'Teses sugeridas via NCM (LC 214/2025)',
      description: `NCM ${codFormatado} (${sug.categoriaRotulo}): teses ativadas automaticamente com badge 'Sugerido via NCM'. Seleção manual livre.`,
    })
  }

  // Importação de planilha CSV/XLSX com coluna NCM
  const handleImportacaoPlanilhaSucesso = (resultado: ResultadoImportacaoPlanilhaRecuperador) => {
    setTesesSelecionadas((prev) => {
      const novas = { ...prev }
      resultado.todosNcmSugeridos.forEach((sug) => {
        const codFormatado = formatarCodigoNcm(sug.itemCurado.codigoLimpo)
        sug.tesesSugeridasIds.forEach((tId) => {
          novas[tId] = {
            ...(novas[tId] || {
              teseId: tId,
              farol: 'verde',
              percentualBaseCustomizado: undefined,
            }),
            teseId: tId,
            ativa: true,
            origem: 'ncm_sugerido',
            ncmReferencia: codFormatado,
          }
        })
      })
      return novas
    })

    if (resultado.todosNcmSugeridos.length > 0) {
      const primeiro = resultado.todosNcmSugeridos[0]
      setConfiguracoes((prev) => ({
        ...prev,
        ncm: primeiro.itemCurado.codigo,
        ncmDescricao: primeiro.itemCurado.descricao,
        ncmCategoriaRotulo: primeiro.categoriaRotulo,
        ncmOrigemSugerida: true,
      }))
    }

    toast({
      title: 'Planilha com NCM importada',
      description: `${resultado.totalLidas} itens lidos (${resultado.totalSugeridasAuto} sugeridos via NCM). Teses aplicadas com badge 'Sugerido via NCM'.`,
    })
  }

  const handleLimparDashboard = () => {
    // 1. Zera dados de entrada e restaura configurações padrão
    setConfiguracoes({
      ...CONFIGURACOES_PADRAO,
      clienteId: null,
      empresa: '',
      cnpj: '',
      regimeAtual: 'Lucro Presumido',
      segmento: '',
      uf: 'SP',
      anosFaturamento: derivarAnosFaturamentoDeMensal(0),
      numeroMedioEmpregados: 0,
      percentualRotatividadeAnual: 0,
      massaSalarialMensal: 0,
      faturamentoMensal: 0,
      percentualComprasVendas: 0,
      anoTransicao: 2033,
      regimeAplicado: 'Padrão / Sem Redução',
      origemPreenchimento: 'manual',
    })

    // 2. Desmarca todas as teses selecionadas (ativas voltam para false)
    const tesesPadrao = gerarSelecaoTesesPadrao()
    const tesesDesmarcadas: Record<string, TeseSelecaoUsuario> = {}
    Object.keys(tesesPadrao).forEach((key) => {
      tesesDesmarcadas[key] = {
        ...tesesPadrao[key],
        ativa: false,
      }
    })
    setTesesSelecionadas(tesesDesmarcadas)
    setCenarioSelecionado('integral')

    toast({
      title: 'Recuperador limpo!',
      description:
        'Todos os faturamentos, anos e teses foram zerados e a tela retornou ao estado inicial.',
    })
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

      // Ao concluir a análise com emissão de parecer, reverte os dados locais para o cadastro mestre do cliente
      handleRestaurarDadosMestres()
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
        mostrarDiagnosticoBtn={false}
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
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline">
              IRPJ/CSLL:{' '}
              <strong className="text-white font-mono">
                {formatarMoeda(resultadosAtuais.totalIrpjCsllCorrigido || 0)}
              </strong>
            </span>
            <span className="hidden xl:inline text-slate-500">|</span>
            <span className="hidden xl:inline">
              ICMS/ISS/Outros:{' '}
              <strong className="text-white font-mono">
                {formatarMoeda(resultadosAtuais.totalOutrosTributosCorrigido || 0)}
              </strong>
            </span>

            {/* BOTÕES DE AÇÃO RÁPIDA: EXPORTAR DADOS, SALVAR E BAIXAR PDF */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setModalExportarDadosAberto(true)}
                className="px-3 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#0f244c] text-white border border-[#D4AF37]/70 font-extrabold text-xs tracking-wide transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                title="Exportar planilha (CSV/Excel) e dados da análise atual"
              >
                Exportar dados
              </button>
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
                onNcmSugerido={handleAplicarSugestaoNcm}
                onAbrirImportacaoPlanilha={() => setModalImportarPlanilhaAberto(true)}
                temDivergenciaMestre={temDivergenciaMestre}
                onRestaurarDadosMestres={handleRestaurarDadosMestres}
              />
            )}

            {moduloAtivo === 'pis_cofins' && (
              <BlocoPisCofinsRecuperador
                tesesDefinicoes={tesesElegiveisComRelacaoEst04}
                tesesSelecionadas={tesesSelecionadas}
                resultadosTeses={resultadosAtuais.resultadosTeses}
                segmento={configuracoes.segmento}
                onChangeTese={handleUpdateTese}
                configuracoes={configuracoes}
                itensNcmImportados={dadosMestres.documentoFiscalImportado?.itensNcmImportados}
              />
            )}

            {moduloAtivo === 'folha' && (
              <BlocoFolhaPrevidenciarioRecuperador
                tesesDefinicoes={tesesElegiveisComRelacaoEst04}
                tesesSelecionadas={tesesSelecionadas}
                resultadosTeses={resultadosAtuais.resultadosTeses}
                segmento={configuracoes.segmento}
                onChangeTese={handleUpdateTese}
              />
            )}

            {moduloAtivo === 'irpj_csll' && (
              <BlocoIrpjCsllRecuperador
                teses={tesesElegiveisComRelacaoEst04}
                tesesConfiguradas={tesesSelecionadas}
                onChangeTese={handleUpdateTese}
                resultados={resultadosAtuais}
              />
            )}

            {moduloAtivo === 'outros_tributos' && (
              <BlocoOutrosTributosRecuperador
                teses={tesesElegiveisComRelacaoEst04}
                tesesConfiguradas={tesesSelecionadas}
                onChangeTese={handleUpdateTese}
                resultados={resultadosAtuais}
              />
            )}

            {moduloAtivo === 'apuracao_selic' && (
              <ModuloApuracaoSelicRecuperador
                resultados={resultadosAtuais}
                segmento={configuracoes.segmento}
              />
            )}

            {moduloAtivo === 'dashboard' && (
              <ModuloDashboardRecuperador
                resultados={resultadosAtuais}
                configuracoes={configuracoes}
                cenarioSelecionado={cenarioSelecionado}
                segmento={configuracoes.segmento}
                regimeAtual={configuracoes.regimeAtual}
                onChangeCenario={setCenarioSelecionado}
                onLimparDashboard={handleLimparDashboard}
                onIrParaConfiguracoes={() => setModuloAtivo('configuracoes')}
                onExportarDados={() => setModalExportarDadosAberto(true)}
                onGerarPdf={() => setModalPdfAberto(true)}
                onSalvarAnalise={() => setModalSalvarAberto(true)}
                onSelecionarTese={(teseId) => {
                  if (teseId.startsWith('tese_pis_')) {
                    setModuloAtivo('pis_cofins')
                  } else if (teseId.startsWith('tese_folha_')) {
                    setModuloAtivo('folha')
                  } else if (teseId.startsWith('tese_irpj_')) {
                    setModuloAtivo('irpj_csll')
                  } else if (
                    teseId.startsWith('tese_icms_') ||
                    teseId.startsWith('tese_iss_') ||
                    teseId.startsWith('tese_itcmd_') ||
                    teseId.startsWith('tese_cancelamento_')
                  ) {
                    setModuloAtivo('outros_tributos')
                  }
                  setTesesSelecionadas((prev) => {
                    const existente = prev[teseId]
                    if (existente) {
                      return {
                        ...prev,
                        [teseId]: { ...existente, ativa: true },
                      }
                    }
                    return {
                      ...prev,
                      [teseId]: {
                        teseId,
                        ativa: true,
                        farol: 'verde',
                      },
                    }
                  })
                }}
              />
            )}

            {/* AVISO ORIENTATIVO COMPLETO NO RESUMO FINAL */}
            <div className="mt-8">
              <AvisoOrientativo variante="completa" tema="claro" />
            </div>

            {/* AVISO TÉCNICO REGULATÓRIO */}
            <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs space-y-2">
              <div className="font-bold text-[#07132B] text-sm">
                Condições Técnicas de Homologação & SPED
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
          // Ao concluir/salvar a análise, reverte os dados locais do módulo para o cadastro mestre do cliente
          handleRestaurarDadosMestres()
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

      {/* MODAL EXPORTAR DADOS DA ANÁLISE ATUAL (PLANILHA CSV / PARECER PDF) */}
      <ModalExportarDadosSimulacao
        open={modalExportarDadosAberto}
        onOpenChange={setModalExportarDadosAberto}
        moduloOrigem="recuperador"
        dadosRecuperador={{
          nomeAnalise: 'Recuperação de Créditos (60 Meses) - Atual em Tela',
          empresa: clienteAtivo?.nome || configuracoes.empresa,
          cnpj: clienteAtivo?.cnpj_cpf || configuracoes.cnpj,
          parametros: parametrosAtuais,
          resultados: resultadosAtuais,
        }}
      />

      {/* MODAL IMPORTAR PLANILHA CSV / XLSX COM COLUNA NCM */}
      <ModalImportarPlanilhaRecuperador
        aberto={modalImportarPlanilhaAberto}
        onOpenChange={setModalImportarPlanilhaAberto}
        onImportarSucesso={handleImportacaoPlanilhaSucesso}
      />
    </div>
  )
}
