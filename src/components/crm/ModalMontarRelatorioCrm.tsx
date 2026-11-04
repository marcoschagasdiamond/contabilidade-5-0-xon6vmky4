import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { execute } from '@/lib/skipConnectors'
import { formatarCNPJ } from '@/lib/cnpj'
import {
  gerarRelatorioPersonalizadoPDF,
  gerarRelatorioPersonalizadoBlob,
} from '@/lib/pdfRelatorioPersonalizado'
import { salvarRelatorioPersonalizado } from '@/services/relatoriosPersonalizados'
import { criarInteracaoCrm } from '@/services/crm'
import type { CrmFichaAgregada } from '@/types/crm'
import type {
  ConfiguracaoRelatorioPersonalizado,
  ModuloAnaliseTipo,
  SecaoCalculadoraTipo,
  SecaoRecuperadorTipo,
  SecaoDiagnosticoTipo,
  SecaoRelatorioTipo,
} from '@/types/relatorioPersonalizado'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'

interface ModalMontarRelatorioCrmProps {
  aberto: boolean
  aoFechar: () => void
  ficha: CrmFichaAgregada | null
  aoRelatorioEnviadoOuCriado?: () => void
}

export function ModalMontarRelatorioCrm({
  aberto,
  aoFechar,
  ficha,
  aoRelatorioEnviadoOuCriado,
}: ModalMontarRelatorioCrmProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const emp = ficha?.empresa
  const cli = ficha?.crmCliente
  const nomeEmpresa = emp?.nome_empresa || 'Empresa do Cliente'
  const cnpjEmpresa = emp?.cnpj || ''
  const emailCliente = emp?.email || ''

  // Simulações e diagnósticos vinculados à ficha do CRM
  const simulacoesCalc = ficha?.simulacoesCalculadora || []
  const simulacoesRecup = ficha?.simulacoesRecuperador || []
  const diagnosticosLista = ficha?.diagnosticos || []

  const temCalculadora = simulacoesCalc.length > 0
  const temRecuperador = simulacoesRecup.length > 0
  const temDiagnostico = diagnosticosLista.length > 0 || Boolean(emp?.segmento)

  // Estados de etapas do assistente
  const [passoAtivo, setPassoAtivo] = useState<1 | 2 | 3 | 4>(1)

  // Passo 1: Seleção de módulos de análises
  const [incluirCalc, setIncluirCalc] = useState<boolean>(temCalculadora)
  const [incluirRecup, setIncluirRecup] = useState<boolean>(temRecuperador)
  const [incluirDiag, setIncluirDiag] = useState<boolean>(temDiagnostico)

  const [simulacaoCalcId, setSimulacaoCalcId] = useState<string>(simulacoesCalc[0]?.id || '')
  const [simulacaoRecupId, setSimulacaoRecupId] = useState<string>(simulacoesRecup[0]?.id || '')
  const [diagnosticoId, setDiagnosticoId] = useState<string>(diagnosticosLista[0]?.id || '')

  // Passo 2: Seleção de seções
  const [secoesCalc, setSecoesCalc] = useState<SecaoCalculadoraTipo[]>([
    'calc_resumo',
    'calc_comparativo',
    'calc_evolucao',
    'calc_split',
    'calc_creditos',
    'calc_passos',
  ])
  const [secoesRecup, setSecoesRecup] = useState<SecaoRecuperadorTipo[]>([
    'recup_resumo',
    'recup_tipos',
    'recup_ano_a_ano',
    'recup_passos',
  ])
  const [secoesDiag, setSecoesDiag] = useState<SecaoDiagnosticoTipo[]>([
    'diag_resumo',
    'diag_matriz_riscos',
    'diag_autoavaliacao',
    'diag_transicao',
    'diag_enquadramento',
  ])

  // Passo 3: Título & Observações & Mensagem de envio
  const [titulo, setTitulo] = useState<string>(`Relatório Consultivo — ${nomeEmpresa}`)
  const [observacoes, setObservacoes] = useState<string>('')
  const [destinatarioEmail, setDestinatarioEmail] = useState<string>(emailCliente)
  const [assuntoEmail, setAssuntoEmail] = useState<string>(
    `Relatório Consultivo e Planejamento Tributário — ${nomeEmpresa}`,
  )
  const [mensagemEmail, setMensagemEmail] = useState<string>(
    `Olá,\n\nSegue em anexo o relatório técnico personalizado e planejamento estruturado para ${nomeEmpresa}, elaborado pela nossa assessoria contábil e tributária.\n\nFicamos à disposição para alinharmos os próximos passos.\n\nAtenciosamente,\n${user?.name || user?.email || 'Assessoria Tributária'}`,
  )

  // Status operacionais
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [enviandoGmail, setEnviandoGmail] = useState(false)
  const [copiadoLink, setCopiadoLink] = useState(false)

  // Sincroniza dados padrão ao abrir
  useEffect(() => {
    if (aberto) {
      setPassoAtivo(1)
      setIncluirCalc(temCalculadora)
      setIncluirRecup(temRecuperador)
      setIncluirDiag(temDiagnostico)
      if (simulacoesCalc[0]?.id) setSimulacaoCalcId(simulacoesCalc[0].id)
      if (simulacoesRecup[0]?.id) setSimulacaoRecupId(simulacoesRecup[0].id)
      if (diagnosticosLista[0]?.id) setDiagnosticoId(diagnosticosLista[0].id)
      setTitulo(`Relatório Consultivo — ${nomeEmpresa}`)
      setDestinatarioEmail(emp?.email || '')
      setAssuntoEmail(`Relatório Consultivo e Planejamento Tributário — ${nomeEmpresa}`)
    }
  }, [aberto, nomeEmpresa, emp?.email, temCalculadora, temRecuperador, temDiagnostico])

  const toggleSecaoCalc = (s: SecaoCalculadoraTipo) => {
    setSecoesCalc((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]))
  }

  const toggleSecaoRecup = (s: SecaoRecuperadorTipo) => {
    setSecoesRecup((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]))
  }

  const toggleSecaoDiag = (s: SecaoDiagnosticoTipo) => {
    setSecoesDiag((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]))
  }

  // Prepara simulações ativas
  const calcAtiva: SimulacaoCalculadora | undefined =
    simulacoesCalc.find((c) => c.id === simulacaoCalcId) || simulacoesCalc[0]
  const recupAtivo: SimulacaoRecuperador | undefined =
    simulacoesRecup.find((r) => r.id === simulacaoRecupId) || simulacoesRecup[0]
  const diagAtivo: DiagnosticoRecord | undefined =
    diagnosticosLista.find((d) => d.id === diagnosticoId) || diagnosticosLista[0]

  // Monta objeto de dados da empresa compatível
  const dadosEmpresaMock: DadosEmpresaPerfil = {
    nomeContato: emp?.nome_contato || user?.name || '',
    nomeEmpresa: nomeEmpresa,
    cnpj: cnpjEmpresa,
    ufOrigem: emp?.uf || 'SP',
    cidade: emp?.cidade || 'sp-sao-paulo',
    email: emp?.email || '',
    telefone: emp?.telefone || '',
    segmento: (emp?.segmento as any) || 'Serviços',
    regimeAtual: (emp?.regime_atual as any) || 'Simples Nacional',
    funcionarios: '1 a 5 funcionários',
    emissaoNf: 'Predominante para Pessoas Jurídicas (B2B)',
    atividadeMista: false,
    faturamentoMensal: 200000,
    percentualComprasVendas: 40,
    tipoAtividade: 'servico',
    subatividadeServico: 'servico_comum',
    subatividadeIndustria: 'industria_comum',
    subatividadeComercio: 'varejo_comum',
    proporcaoServicoMisto: 50,
    folhaPagamentoMensal: 50000,
    margemLucroEstimada: 20,
    despesasComCreditosMensais: 30000,
    percentualExportacao: 0,
    anoBaseTransicao: 2026,
    perfilInsumosAliquotaCheia: 70,
    perfilInsumosMonofasicos: 20,
    perfilInsumosAliquotaReduzida: 10,
    presencaMonofasicos: false,
    categoriasMonofasicos: [],
    insumosEnergeticos: false,
    intangiveisRoyalties: false,
    imobilizadoUltimos5Anos: 0,
    imobilizadoAnosDetalhe: {},
    percentualComprasSemCredito: 0,
    saldoCredorAcumulado: 0,
    percentualVendasInterestaduais: 0,
    regimeEspecialAtual: 'nenhum',
    perfilRetencaoSplit: 'nao',
    percentualRetencaoSplit: 0,
    autosInfracaoAtivos: false,
    autosInfracaoQuantidade: 0,
    autosInfracaoValor: 0,
    parcelamentosEmCurso: false,
    parcelamentosQuantidade: 0,
    dividaAtivaExecucaoFiscal: false,
    obrigacoesAcessoriasAtraso: false,
    numeroFiliais: 1,
    ufsOperacao: [],
  }

  const montarConfiguracaoAtual = (): ConfiguracaoRelatorioPersonalizado => {
    return {
      titulo: titulo.trim() || `Relatório Personalizado — ${nomeEmpresa}`,
      subtitulo: 'Dossiê técnico customizado com as análises e seções selecionadas.',
      observacoes: observacoes.trim(),
      incluirCalculadora: incluirCalc && Boolean(calcAtiva),
      incluirRecuperador: incluirRecup && Boolean(recupAtivo),
      incluirDiagnostico: incluirDiag,
      secoesCalculadora: secoesCalc,
      secoesRecuperador: secoesRecup,
      secoesDiagnostico: secoesDiag,
      idSimulacaoCalculadora: calcAtiva?.id || null,
      idSimulacaoRecuperador: recupAtivo?.id || null,
      idDiagnostico360: diagAtivo?.id || null,
      snapshotDadosEmpresa: dadosEmpresaMock,
      snapshotCalculadora: calcAtiva || null,
      snapshotRecuperador: recupAtivo || null,
      snapshotDiagnostico: diagAtivo || null,
      responsavelNome: user?.name || user?.email || 'Analista Tributário',
    }
  }

  // Ação 1: Salvar e Baixar PDF localmente
  const handleBaixarPdf = async () => {
    if (!cli?.id) {
      toast({
        title: 'Ficha não carregada',
        description: 'Aguarde o carregamento dos dados do cliente.',
        variant: 'destructive',
      })
      return
    }
    try {
      setGerandoPdf(true)
      const cfg = montarConfiguracaoAtual()

      const analisesIncluidas: ModuloAnaliseTipo[] = []
      if (cfg.incluirCalculadora) analisesIncluidas.push('calculadora')
      if (cfg.incluirRecuperador) analisesIncluidas.push('recuperador')
      if (cfg.incluirDiagnostico) analisesIncluidas.push('diagnostico')

      const secoesSelecionadas: SecaoRelatorioTipo[] = [
        ...(cfg.incluirCalculadora ? cfg.secoesCalculadora : []),
        ...(cfg.incluirRecuperador ? cfg.secoesRecuperador : []),
        ...(cfg.incluirDiagnostico ? cfg.secoesDiagnostico : []),
      ]

      // Salva no banco com registro CRM
      await salvarRelatorioPersonalizado({
        nome: cfg.titulo,
        empresa_nome: nomeEmpresa,
        cnpj: cnpjEmpresa,
        cliente_id: cli.id,
        crm_cliente_id: cli.id,
        empresa_id: emp?.id || null,
        user_id: user?.id || null,
        analises_incluidas: analisesIncluidas,
        secoes_selecionadas: secoesSelecionadas,
        observacoes: cfg.observacoes,
        canal_envio: 'download_pdf',
        data_envio: new Date().toISOString(),
        configuracao: cfg,
      })

      // Registra interação na timeline do cliente do CRM
      await criarInteracaoCrm({
        crm_cliente_id: cli.id,
        tipo: 'outros',
        data: new Date().toISOString().split('T')[0],
        resumo: `Relatório Personalizado emitido via Download de PDF: "${cfg.titulo}". Autor: ${user?.name || user?.email || 'Analista'}.`,
        proximo_passo: 'Acompanhar leitura e feedback do empresário.',
      })

      // Gera e baixa o PDF
      gerarRelatorioPersonalizadoPDF({
        configuracao: cfg,
        empresa: nomeEmpresa,
        cnpj: cnpjEmpresa,
        dadosEmpresa: dadosEmpresaMock,
        simulacaoCalculadora: calcAtiva,
        simulacaoRecuperador: recupAtivo,
        diagnostico360: diagAtivo,
      })

      toast({
        title: 'Relatório Gerado com Sucesso',
        description: 'PDF baixado e registrado no histórico comercial da ficha do cliente.',
      })

      aoRelatorioEnviadoOuCriado?.()
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err)
      toast({
        title: 'Erro ao gerar relatório',
        description: err?.message || 'Falha ao compilar PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  // Ação 2: Copiar Link do Relatório / Simulação
  const handleCopiarLink = async () => {
    if (!cli?.id) {
      toast({
        title: 'Ficha não carregada',
        description: 'Aguarde o carregamento dos dados do cliente.',
        variant: 'destructive',
      })
      return
    }
    try {
      const cfg = montarConfiguracaoAtual()
      const analisesIncluidas: ModuloAnaliseTipo[] = []
      if (cfg.incluirCalculadora) analisesIncluidas.push('calculadora')
      if (cfg.incluirRecuperador) analisesIncluidas.push('recuperador')
      if (cfg.incluirDiagnostico) analisesIncluidas.push('diagnostico')

      const secoesSelecionadas: SecaoRelatorioTipo[] = [
        ...(cfg.incluirCalculadora ? cfg.secoesCalculadora : []),
        ...(cfg.incluirRecuperador ? cfg.secoesRecuperador : []),
        ...(cfg.incluirDiagnostico ? cfg.secoesDiagnostico : []),
      ]

      // Salva no banco de relatórios
      const salvo = await salvarRelatorioPersonalizado({
        nome: cfg.titulo,
        empresa_nome: nomeEmpresa,
        cnpj: cnpjEmpresa,
        cliente_id: cli.id,
        crm_cliente_id: cli.id,
        empresa_id: emp?.id || null,
        user_id: user?.id || null,
        analises_incluidas: analisesIncluidas,
        secoes_selecionadas: secoesSelecionadas,
        observacoes: cfg.observacoes,
        canal_envio: 'link_compartilhado',
        data_envio: new Date().toISOString(),
        configuracao: cfg,
      })

      // Link direto para o empresário ver em Meus Relatórios ou Simulações
      const link = `${window.location.origin}/meus-relatorios?relatorio=${encodeURIComponent(salvo.id)}`
      await navigator.clipboard.writeText(link)
      setCopiadoLink(true)

      // Registra na timeline do CRM
      await criarInteracaoCrm({
        crm_cliente_id: cli.id,
        tipo: 'whatsapp',
        data: new Date().toISOString().split('T')[0],
        resumo: `Link do Relatório Personalizado "${cfg.titulo}" copiado para envio manual. Canal: Link/WhatsApp. Autor: ${user?.name || user?.email || 'Analista'}.`,
        proximo_passo: 'Enviar link ao cliente e confirmar recebimento.',
      })

      toast({
        title: 'Link Copiado com Sucesso!',
        description:
          'Link exclusivo copiado para a área de transferência e registrado na timeline da ficha.',
      })

      setTimeout(() => setCopiadoLink(false), 3000)
      aoRelatorioEnviadoOuCriado?.()
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar link',
        description: err?.message || 'Não foi possível copiar link.',
        variant: 'destructive',
      })
    }
  }

  // Ação 3: Envio Direto via Gmail Conectado do Analista
  const handleEnviarGmail = async () => {
    if (!destinatarioEmail || !destinatarioEmail.includes('@')) {
      toast({
        title: 'E-mail do destinatário obrigatório',
        description: 'Informe um e-mail válido para o cliente.',
        variant: 'destructive',
      })
      return
    }
    if (!cli?.id) {
      toast({
        title: 'Ficha não carregada',
        description: 'Aguarde o carregamento dos dados do cliente.',
        variant: 'destructive',
      })
      return
    }

    try {
      setEnviandoGmail(true)
      const cfg = montarConfiguracaoAtual()

      const analisesIncluidas: ModuloAnaliseTipo[] = []
      if (cfg.incluirCalculadora) analisesIncluidas.push('calculadora')
      if (cfg.incluirRecuperador) analisesIncluidas.push('recuperador')
      if (cfg.incluirDiagnostico) analisesIncluidas.push('diagnostico')

      const secoesSelecionadas: SecaoRelatorioTipo[] = [
        ...(cfg.incluirCalculadora ? cfg.secoesCalculadora : []),
        ...(cfg.incluirRecuperador ? cfg.secoesRecuperador : []),
        ...(cfg.incluirDiagnostico ? cfg.secoesDiagnostico : []),
      ]

      // 1. Gera o PDF em Blob
      const { nomeArquivo } = gerarRelatorioPersonalizadoBlob({
        configuracao: cfg,
        empresa: nomeEmpresa,
        cnpj: cnpjEmpresa,
        dadosEmpresa: dadosEmpresaMock,
        simulacaoCalculadora: calcAtiva,
        simulacaoRecuperador: recupAtivo,
        diagnostico360: diagAtivo,
      })

      // 2. Salva o registro na tabela relatorios_personalizados
      const salvo = await salvarRelatorioPersonalizado({
        nome: cfg.titulo,
        empresa_nome: nomeEmpresa,
        cnpj: cnpjEmpresa,
        cliente_id: cli.id,
        crm_cliente_id: cli.id,
        empresa_id: emp?.id || null,
        user_id: user?.id || null,
        analises_incluidas: analisesIncluidas,
        secoes_selecionadas: secoesSelecionadas,
        observacoes: cfg.observacoes,
        canal_envio: 'gmail',
        enviado_para: destinatarioEmail.trim(),
        data_envio: new Date().toISOString(),
        configuracao: cfg,
      })

      // 3. Monta link do relatório para inclusão no corpo do e-mail
      const linkRelatorio = `${window.location.origin}/meus-relatorios?relatorio=${encodeURIComponent(salvo.id)}`
      const corpoEmailFinal = `${mensagemEmail.trim()}\n\n---\n📄 Relatório: ${cfg.titulo}\n🏢 Empresa: ${nomeEmpresa} (CNPJ: ${cnpjEmpresa ? formatarCNPJ(cnpjEmpresa) : '—'})\n🔗 Link direto do dossiê: ${linkRelatorio}\n\nEmitido sob as diretrizes da Reforma Tributária (EC 132/2023 e LC 214/2025).`

      // 4. Executa tool do Gmail do usuário conectado
      const resExec = await execute('GMAIL_SEND_EMAIL', {
        recipient_email: destinatarioEmail.trim(),
        subject: assuntoEmail.trim(),
        body: corpoEmailFinal,
      })

      if (!resExec.successful) {
        throw new Error(resExec.error || 'Falha ao enviar e-mail via Gmail.')
      }

      // 5. Registra interação na timeline do cliente do CRM
      await criarInteracaoCrm({
        crm_cliente_id: cli.id,
        tipo: 'email',
        data: new Date().toISOString().split('T')[0],
        resumo: `Relatório Personalizado "${cfg.titulo}" enviado com sucesso via Gmail conectado para ${destinatarioEmail.trim()}. Autor: ${user?.name || user?.email || 'Analista'}. Arquivo de referência: ${nomeArquivo}.`,
        proximo_passo: 'Acompanhar retorno do e-mail pelo cliente.',
      })

      toast({
        title: 'Relatório Enviado com Sucesso!',
        description: `E-mail enviado via Gmail para ${destinatarioEmail.trim()} e registrado no histórico comercial.`,
      })

      aoRelatorioEnviadoOuCriado?.()
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao enviar via Gmail:', err)
      toast({
        title: 'Falha no envio por Gmail',
        description:
          err?.message ||
          'Verifique se sua conta do Gmail está conectada no botão abaixo ou utilize a opção "Baixar PDF".',
        variant: 'destructive',
      })
    } finally {
      setEnviandoGmail(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-slate-800 border border-slate-200 rounded-3xl p-6 sm:p-8">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
              CRM Diamond Group
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Ficha do Cliente: <strong>{nomeEmpresa}</strong>
            </span>
          </div>
          <DialogTitle className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B] mt-1">
            Montar & Enviar Relatório Personalizado
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Monte um dossiê customizado com as análises salvas deste cliente, emita com os dados do
            cadastro e envie diretamente ao empresário com registro automático no histórico.
          </DialogDescription>
        </DialogHeader>

        {/* NAVEGAÇÃO DE ETAPAS */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { num: 1, label: '1. Análises' },
            { num: 2, label: '2. Seções' },
            { num: 3, label: '3. Personalização' },
            { num: 4, label: '4. Envio & Emissão' },
          ].map((etapa) => (
            <button
              key={etapa.num}
              type="button"
              onClick={() => setPassoAtivo(etapa.num as any)}
              className={`p-2 rounded-xl text-left transition-all border ${
                passoAtivo === etapa.num
                  ? 'bg-[#07132B] text-white border-[#D4AF37]'
                  : passoAtivo > etapa.num
                    ? 'bg-slate-100 text-[#07132B] border-slate-300 font-semibold'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-mono block opacity-80">Etapa 0{etapa.num}</span>
              <span className="text-xs font-bold block truncate">{etapa.label}</span>
            </button>
          ))}
        </div>

        {/* ETAPA 1: ESCOLHER ANÁLISES DO CLIENTE */}
        {passoAtivo === 1 && (
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
              <span className="font-bold text-[#07132B] block mb-1">
                Análises vinculadas à ficha de {nomeEmpresa}:
              </span>
              <p className="text-slate-600">
                Selecione quais análises farão parte deste relatório. Apenas dados vinculados a este
                cliente serão incluídos.
              </p>
            </div>

            {/* Módulo Calculadora IBS/CBS */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                !temCalculadora
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : incluirCalc
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="crm-check-calc"
                  disabled={!temCalculadora}
                  checked={incluirCalc && temCalculadora}
                  onChange={(e) => setIncluirCalc(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="crm-check-calc"
                    className="font-bold text-sm text-[#07132B] cursor-pointer"
                  >
                    Calculadora IBS/CBS (Reforma Tributária)
                  </label>
                  <p className="text-xs text-slate-500">
                    Comparativo com regimes atuais, transição 2026-2033 e split payment.
                  </p>
                  {temCalculadora ? (
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600">Cenário:</span>
                      <select
                        value={simulacaoCalcId}
                        onChange={(e) => setSimulacaoCalcId(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                      >
                        {simulacoesCalc.map((sim) => (
                          <option key={sim.id} value={sim.id}>
                            {sim.nome} (Ano{' '}
                            {sim.parametros?.anoOperacao || sim.parametros?.anoTransicao || 2026})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      Nenhuma simulação da calculadora salva para esta empresa.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Módulo Recuperador de Créditos */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                !temRecuperador
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : incluirRecup
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="crm-check-recup"
                  disabled={!temRecuperador}
                  checked={incluirRecup && temRecuperador}
                  onChange={(e) => setIncluirRecup(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="crm-check-recup"
                    className="font-bold text-sm text-[#07132B] cursor-pointer"
                  >
                    Recuperador de Créditos Tributários (60 Meses)
                  </label>
                  <p className="text-xs text-slate-500">
                    Auditoria administrativa, levantamento de teses e atualização Selic.
                  </p>
                  {temRecuperador ? (
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600">Apuração:</span>
                      <select
                        value={simulacaoRecupId}
                        onChange={(e) => setSimulacaoRecupId(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                      >
                        {simulacoesRecup.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nome} (Total: R${' '}
                            {(r.total_recuperavel_integral || 0).toLocaleString('pt-BR')})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      Nenhum levantamento do recuperador cadastrado.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Módulo Diagnóstico 360° */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                !temDiagnostico
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : incluirDiag
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="crm-check-diag"
                  disabled={!temDiagnostico}
                  checked={incluirDiag && temDiagnostico}
                  onChange={(e) => setIncluirDiag(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="crm-check-diag"
                    className="font-bold text-sm text-[#07132B] cursor-pointer"
                  >
                    Diagnóstico 360° & Matriz de Governança
                  </label>
                  <p className="text-xs text-slate-500">
                    Matriz Semáforo de 7 Riscos, laudo de transição e enquadramento.
                  </p>
                  {diagnosticosLista.length > 0 && (
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600">Diagnóstico:</span>
                      <select
                        value={diagnosticoId}
                        onChange={(e) => setDiagnosticoId(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                      >
                        {diagnosticosLista.map((d) => (
                          <option key={d.id} value={d.id}>
                            Diagnóstico #{d.id.slice(-6)} (
                            {new Date(d.created).toLocaleDateString('pt-BR')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                onClick={() => {
                  if (!incluirCalc && !incluirRecup && !incluirDiag) {
                    toast({
                      title: 'Selecione ao menos uma análise',
                      description: 'Marque Calculadora, Recuperador ou Diagnóstico.',
                      variant: 'destructive',
                    })
                    return
                  }
                  setPassoAtivo(2)
                }}
                className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] font-bold text-xs rounded-xl"
              >
                Avançar para Seções →
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 2: ESCOLHER SEÇÕES */}
        {passoAtivo === 2 && (
          <div className="space-y-4 py-2">
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Marque os blocos técnicos que serão impressos no PDF gerado para o cliente:
            </div>

            {incluirCalc && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                  Seções da Calculadora IBS/CBS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'calc_resumo', label: 'Resumo Executivo da Calculadora' },
                    { id: 'calc_comparativo', label: 'Comparativo Atual x IBS/CBS' },
                    { id: 'calc_evolucao', label: 'Evolução da Transição 2026-2033' },
                    { id: 'calc_split', label: 'Split Payment e Capital de Giro' },
                    { id: 'calc_creditos', label: 'Créditos Apropriáveis de Insumos' },
                    { id: 'calc_passos', label: 'Recomendações e Próximos Passos' },
                  ].map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={secoesCalc.includes(sec.id as any)}
                        onChange={() => toggleSecaoCalc(sec.id as any)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#07132B]"
                      />
                      <span>{sec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {incluirRecup && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                  Seções do Recuperador de Créditos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'recup_resumo', label: 'Total Homologado com SELIC' },
                    { id: 'recup_tipos', label: 'Créditos por Bloco Tributário' },
                    { id: 'recup_ano_a_ano', label: 'Quadro de Competências (60 Meses)' },
                    { id: 'recup_passos', label: 'Procedimento PER/DCOMP' },
                  ].map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={secoesRecup.includes(sec.id as any)}
                        onChange={() => toggleSecaoRecup(sec.id as any)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#07132B]"
                      />
                      <span>{sec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {incluirDiag && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                  Seções do Diagnóstico 360°
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'diag_resumo', label: 'Resumo e Enquadramento' },
                    { id: 'diag_matriz_riscos', label: 'Matriz Semáforo das 7 Frentes' },
                    { id: 'diag_autoavaliacao', label: 'Plano Estruturado 30-60-90' },
                    { id: 'diag_transicao', label: 'Laudo de Transição Fiscal' },
                    { id: 'diag_enquadramento', label: 'Síntese de Governança' },
                  ].map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={secoesDiag.includes(sec.id as any)}
                        onChange={() => toggleSecaoDiag(sec.id as any)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#07132B]"
                      />
                      <span>{sec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setPassoAtivo(1)}
                className="text-xs rounded-xl"
              >
                ← Voltar
              </Button>
              <Button
                onClick={() => setPassoAtivo(3)}
                className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] font-bold text-xs rounded-xl"
              >
                Avançar para Título & Notas →
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: TÍTULO, OBSERVAÇÕES E MENSAGEM */}
        {passoAtivo === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07132B] mb-1">
                Título Oficial do Relatório
              </label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Parecer Técnico de Planejamento Tributário"
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07132B] mb-1">
                Observações Técnicas / Parecer do Analista (Impresso na capa do PDF)
              </label>
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Insira notas do escritório, recomendações sobre a transição tributária ou parecer específico para este cliente..."
                className="text-xs rounded-xl"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                Comunicação com o Cliente (E-mail Padrão Editável)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    E-mail de Destino do Cliente:
                  </label>
                  <Input
                    type="email"
                    value={destinatarioEmail}
                    onChange={(e) => setDestinatarioEmail(e.target.value)}
                    placeholder="cliente@empresa.com.br"
                    className="text-xs h-9 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assunto do E-mail:
                  </label>
                  <Input
                    value={assuntoEmail}
                    onChange={(e) => setAssuntoEmail(e.target.value)}
                    className="text-xs h-9 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mensagem de Acompanhamento:
                </label>
                <Textarea
                  rows={3}
                  value={mensagemEmail}
                  onChange={(e) => setMensagemEmail(e.target.value)}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setPassoAtivo(2)}
                className="text-xs rounded-xl"
              >
                ← Voltar
              </Button>
              <Button
                onClick={() => setPassoAtivo(4)}
                className="bg-[#07132B] text-[#D4AF37] hover:bg-[#0d2249] font-bold text-xs rounded-xl"
              >
                Avançar para Emissão & Envio →
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 4: EMISSÃO, ENVIO VIA GMAIL E ALTERNATIVAS */}
        {passoAtivo === 4 && (
          <div className="space-y-5 py-2">
            {/* QUADRO DE IDENTIFICAÇÃO E RODAPÉ DO ESCRITÓRIO */}
            <div className="bg-[#07132B] text-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                  Dossiê Pronto para Emissão
                </span>
                <span className="text-xs text-slate-300">
                  {incluirCalc ? '✓ IBS/CBS ' : ''}
                  {incluirRecup ? '✓ Créditos ' : ''}
                  {incluirDiag ? '✓ 360°' : ''}
                </span>
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-base text-white">{titulo}</h3>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-4">
                  <span>
                    Empresa: <strong>{nomeEmpresa}</strong>
                  </span>
                  <span>
                    CNPJ:{' '}
                    <strong>{cnpjEmpresa ? formatarCNPJ(cnpjEmpresa) : 'Não informado'}</strong>
                  </span>
                  <span>
                    Destinatário: <strong>{destinatarioEmail || 'Não informado'}</strong>
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300">
                <strong className="text-[#D4AF37]">Rodapé do Escritório:</strong> O PDF gerado
                conterá a identidade formal do escritório adquirente configurada em "Dados do
                Escritório", com responsável técnico, localização e referências à LC 214/2025.
              </div>
            </div>

            {/* SEÇÃO 1: ENVIO POR GMAIL CONECTADO */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#07132B]">
                    Canal Principal: Envio por Gmail Conectado
                  </h4>
                  <p className="text-xs text-slate-500">
                    O Analista envia a partir da sua própria conta de e-mail do Google.
                  </p>
                </div>
                {/* ConnectorButton padrão Skip Cloud */}
                <ConnectorButton toolkit="gmail" name="Gmail" />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleEnviarGmail}
                  disabled={enviandoGmail}
                  className="w-full sm:w-auto bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm"
                >
                  {enviandoGmail ? 'Enviando E-mail...' : 'Enviar Relatório por Gmail'}
                </Button>
                <span className="text-[11px] text-slate-500">
                  Envia a mensagem padrão configurada com os dados do dossiê para{' '}
                  {destinatarioEmail}
                </span>
              </div>
            </div>

            {/* SEÇÃO 2: ALTERNATIVAS SEMPRE DISPONÍVEIS */}
            <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#07132B]">
                  Alternativas Sempre Disponíveis (Sem Conexão ao Gmail)
                </h4>
                <p className="text-xs text-slate-500">
                  Baixe o arquivo PDF diretamente ou copie o link exclusivo para envio manual por
                  WhatsApp ou qualquer canal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleBaixarPdf}
                  disabled={gerandoPdf}
                  className="border-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50"
                >
                  {gerandoPdf ? 'Compilando...' : 'Baixar PDF do Relatório'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCopiarLink}
                  className="border-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50"
                >
                  {copiadoLink ? '✓ Link Copiado!' : 'Copiar Link do Relatório'}
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setPassoAtivo(3)}
                className="text-xs rounded-xl"
              >
                ← Voltar
              </Button>
              <Button
                variant="ghost"
                onClick={aoFechar}
                className="text-xs rounded-xl text-slate-500"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
