import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Calculator,
  LogOut,
  Edit,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { PLANOS_CONFIG } from '@/services/planos'
import { ModalMigrarParaAnalista } from '@/components/ModalMigrarParaAnalista'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { getDiagnosticos, type DiagnosticoRecord } from '@/services/diagnosticos'
import { listarSimulacoes } from '@/services/simulacoesCalculadora'
import { listarConversasAssistente, type ConversaAssistente } from '@/services/conversasAssistente'
import { listarClientes } from '@/services/clientes'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { Cliente } from '@/types/cliente'

export default function MinhaConta() {
  const { user, logout, isAdmin, isContador, isEmpresario, recarregarUsuario } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { dadosEmpresa, salvoNoBanco } = useDadosEmpresa()

  const [meusDiagnosticos, setMeusDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [minhasSimulacoes, setMinhasSimulacoes] = useState<SimulacaoCalculadora[]>([])
  const [minhasConversas, setMinhasConversas] = useState<ConversaAssistente[]>([])
  const [clienteAssociado, setClienteAssociado] = useState<Cliente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modalMigrarAberto, setModalMigrarAberto] = useState(false)
  const [abaEmpresario, setAbaEmpresario] = useState<'diagnosticos' | 'simulacoes' | 'conversas'>(
    'diagnosticos',
  )

  useEffect(() => {
    async function carregarTudo() {
      setCarregando(true)
      try {
        const userEmail = user?.email?.toLowerCase() || ''
        const userId = user?.id || ''
        const userClienteId = (user as any)?.cliente_id || ''

        // 1. Buscar cadastro de clientes para identificar vínculo
        let cliEncontrado: Cliente | null = null
        try {
          const clientes = await listarClientes()
          cliEncontrado =
            clientes.find(
              (c) =>
                (userClienteId && c.id === userClienteId) ||
                (c.user_id && c.user_id === userId) ||
                (c.email && c.email.toLowerCase() === userEmail) ||
                (dadosEmpresa.email &&
                  c.email &&
                  c.email.toLowerCase() === dadosEmpresa.email.toLowerCase()),
            ) || null
          setClienteAssociado(cliEncontrado)
        } catch (e) {
          console.warn('Erro ao associar cliente:', e)
        }

        const clienteIdFinal = cliEncontrado?.id || userClienteId || ''

        // 2. Carregar diagnósticos
        const todosDiags = await getDiagnosticos()
        const diagsFiltrados = todosDiags.filter((d) => {
          if ((d as any).user_id && (d as any).user_id === userId) return true
          if (clienteIdFinal && (d as any).cliente_id === clienteIdFinal) return true
          if (d.email && d.email.toLowerCase() === userEmail) return true
          if (
            dadosEmpresa.email &&
            d.email &&
            d.email.toLowerCase() === dadosEmpresa.email.toLowerCase()
          )
            return true
          return false
        })
        setMeusDiagnosticos(diagsFiltrados)

        // 3. Carregar simulações da calculadora
        const todasSimulacoes = await listarSimulacoes(userId)
        const simsFiltradas = todasSimulacoes.filter((s) => {
          if (s.user_id && s.user_id === userId) return true
          if (clienteIdFinal && s.cliente_id === clienteIdFinal) return true
          if (
            s.empresa &&
            dadosEmpresa.nomeEmpresa &&
            s.empresa.toLowerCase() === dadosEmpresa.nomeEmpresa.toLowerCase()
          )
            return true
          return false
        })
        setMinhasSimulacoes(simsFiltradas)

        // 4. Carregar conversas/pareceres do assistente
        const todasConversas = await listarConversasAssistente()
        const convsFiltradas = todasConversas.filter((c) => {
          if (c.user_id && c.user_id === userId) return true
          if (clienteIdFinal && c.cliente_id === clienteIdFinal) return true
          return false
        })
        setMinhasConversas(convsFiltradas)
      } catch (err) {
        console.warn('Erro ao carregar dados em MinhaConta:', err)
      } finally {
        setCarregando(false)
      }
    }

    carregarTudo()
  }, [
    user?.id,
    user?.email,
    (user as any)?.cliente_id,
    dadosEmpresa.email,
    dadosEmpresa.nomeEmpresa,
  ])

  const faturamentoAnual = (dadosEmpresa.faturamentoMensal || 0) * 12

  return (
    <div className="pt-28 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* CABEÇALHO DO PERFIL */}
        <div className="bg-[#07132B] text-white rounded-[24px] p-6 sm:p-8 border border-[#D4AF37]/30 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0D2A1C] border border-[#2ECC71]/40 flex items-center justify-center text-[#2ECC71] shadow-lg shrink-0">
                <User className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                    {dadosEmpresa.nomeContato || (user as any)?.name || 'Cliente Diamond'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2ECC71] text-[#0A1A13]">
                    Conta Ativa
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/20">
                    {isEmpresario ? 'Perfil: Empresário (Cliente)' : 'Perfil: Analista'}
                  </span>
                  {isEmpresario && (
                    <button
                      type="button"
                      onClick={() => setModalMigrarAberto(true)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] transition-colors shadow-sm"
                    >
                      Migrar para Analista
                    </button>
                  )}
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#07132B]">
                      Administrador
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span>{user?.email}</span>
                </p>
                <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                    {salvoNoBanco ? 'Sincronizado na nuvem' : 'Armazenamento local'}
                  </span>
                  <span>•</span>
                  <span>
                    Cadastrado em {new Date(user?.created || '').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-2.5 rounded-xl font-heading font-semibold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-colors"
                >
                  Painel Admin
                </Link>
              )}
              <Link
                to="/dados-empresa"
                className="px-4 py-2.5 rounded-xl font-heading font-semibold text-xs text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] transition-colors flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar Dados da Empresa</span>
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="p-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL: DADOS DA EMPRESA + DIAGNÓSTICOS VINCULADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA: PERFIL DA EMPRESA CADASTRADA */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#145A32]" />
                  <h2 className="font-heading font-bold text-base text-slate-900">
                    Dados da Empresa
                  </h2>
                </div>
                <Link
                  to="/dados-empresa"
                  className="text-xs font-bold text-[#145A32] hover:underline flex items-center gap-1"
                >
                  <span>Alterar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* BOTÃO DE AGENDAMENTO DE REUNIÃO (PADRÃO DIAMOND GROUP, SEM ÍCONES) */}
              <div className="p-3.5 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/30 space-y-2 mb-4">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  CONSULTORIA COM ESPECIALISTA
                </span>
                <p className="text-xs text-slate-300">
                  Precisa alinhar metas ou sanar dúvidas com a equipe executiva?
                </p>
                <Link
                  to="/agendamento?origem=minha_conta&assunto=Alinhamento+Estratégico+Empresarial"
                  className="block text-center py-2 px-3 rounded-lg text-xs font-heading font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-colors"
                >
                  Agendar Reunião
                </Link>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                    Razão Social / Nome Fantasia
                  </span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {dadosEmpresa.nomeEmpresa || 'Não informado'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                      CNPJ
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {dadosEmpresa.cnpj || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                      Segmento
                    </span>
                    <span className="font-semibold text-slate-800">{dadosEmpresa.segmento}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                      Localização
                    </span>
                    <span className="font-semibold text-slate-800">
                      {dadosEmpresa.cidade} / {dadosEmpresa.ufOrigem}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                      Regime Atual
                    </span>
                    <span className="font-semibold text-slate-800">{dadosEmpresa.regimeAtual}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                    Faturamento Mensal Declarado
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatarMoeda(dadosEmpresa.faturamentoMensal || 0)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    (RBT12: {formatarMoeda(faturamentoAnual)})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                    Folha de Pagamento Mensal
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatarMoeda(dadosEmpresa.folhaPagamentoMensal || 0)}/mês
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">
                    Equipe & Emissão NF
                  </span>
                  <span className="text-slate-700 block">
                    {dadosEmpresa.funcionarios} • {dadosEmpresa.emissaoNf}
                  </span>
                </div>
              </div>
            </div>

            {/* Acesso rápido às ferramentas (Exclusivo para Analista / Admin) */}
            {isContador && (
              <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-xs space-y-3">
                <span className="font-bold text-slate-900 block text-sm">
                  Painel do Analista & Ferramentas
                </span>
                <Link
                  to="/carteira"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-[#07132B]">
                      Carteira de Clientes
                    </span>
                    <span className="text-[11px] text-slate-500">Painel analítico consolidado</span>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37]">Acessar</span>
                </Link>

                <Link
                  to="/clientes"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-[#07132B]">
                      Meus Clientes
                    </span>
                    <span className="text-[11px] text-slate-500">Fichas e dados cadastrais</span>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37]">Acessar</span>
                </Link>

                <Link
                  to="/diagnostico"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#2ECC71] transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-[#145A32]">
                      Novo Diagnóstico Tributário
                    </span>
                    <span className="text-[11px] text-slate-500">Simulação do melhor regime</span>
                  </div>
                  <span className="text-xs font-bold text-[#2ECC71]">Abrir</span>
                </Link>

                <Link
                  to="/calculadora-ibs-cbs"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-[#07132B]">
                      Calculadora IBS / CBS
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cálculos completos LC 214/2025
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37]">Abrir</span>
                </Link>
              </div>
            )}

            {/* Informações da Conta Empresário */}
            {isEmpresario && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#07132B] block text-sm">
                    Espaço do Empresário
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Plano R$ 127/mês
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Aqui você tem total visibilidade das análises e cálculos tributários da sua
                  empresa, mantendo você bem informado e seguro sobre o impacto da Reforma
                  Tributária.
                </p>
                {clienteAssociado && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Vínculo de Carteira
                    </span>
                    <span className="font-bold text-slate-800 block text-xs">
                      {clienteAssociado.nome}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      CNPJ/CPF: {clienteAssociado.cnpj_cpf}
                    </span>
                  </div>
                )}

                {/* Box de Upgrade / Migração para Analista */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#07132B] to-[#0d2249] text-white space-y-2 border border-[#D4AF37]/40 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      Upgrade Disponível
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Modo Teste Grátis
                    </span>
                  </div>
                  <strong className="block text-xs font-bold text-white">
                    Deseja atender outros clientes e gerenciar carteira?
                  </strong>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Migre para o Plano Analista ({PLANOS_CONFIG.analista.precoMensalTexto}/mês) e
                    libere Carteira completa, fichas de clientes e envio de convites.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setModalMigrarAberto(true)}
                    className="w-full text-xs font-bold py-2 bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] rounded-lg mt-1"
                  >
                    Migrar para Analista
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: HISTÓRICO DE DADOS DO USUÁRIO */}
          <div className="lg:col-span-2 space-y-6">
            {/* SE FOR EMPRESÁRIO: NAVEGAÇÃO EM ABAS (Diagnósticos, Simulações, Pareceres/Conversas) */}
            {isEmpresario && (
              <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAbaEmpresario('diagnosticos')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all ${
                    abaEmpresario === 'diagnosticos'
                      ? 'bg-[#07132B] text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Meus Diagnósticos ({meusDiagnosticos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAbaEmpresario('simulacoes')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all ${
                    abaEmpresario === 'simulacoes'
                      ? 'bg-[#07132B] text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Simulações da Calculadora ({minhasSimulacoes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAbaEmpresario('conversas')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all ${
                    abaEmpresario === 'conversas'
                      ? 'bg-[#07132B] text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Pareceres & Conversas ({minhasConversas.length})
                </button>
              </div>
            )}

            {/* ABA 1: DIAGNÓSTICOS TRIBUTÁRIOS (visível para contador ou quando aba=diagnosticos) */}
            {(!isEmpresario || abaEmpresario === 'diagnosticos') && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h2 className="font-heading font-bold text-lg text-slate-900">
                      {isEmpresario
                        ? 'Meus Diagnósticos Tributários'
                        : 'Diagnósticos Tributários Vinculados'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isEmpresario
                        ? 'Estudos de enquadramento tributário realizados para sua empresa'
                        : 'Histórico de simulações e pareceres gerados para esta conta'}
                    </p>
                  </div>
                  {isContador && (
                    <Link
                      to="/diagnostico"
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] transition-colors"
                    >
                      Fazer Novo Diagnóstico
                    </Link>
                  )}
                </div>

                {carregando ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">Buscando diagnósticos vinculados...</p>
                  </div>
                ) : meusDiagnosticos.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Nenhum diagnóstico vinculado ainda
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      {isEmpresario
                        ? 'Você ainda não possui diagnósticos tributários registrados. Fale com seu analista ou execute uma análise.'
                        : 'Execute o simulador tributário para descobrir o regime ideal sob o novo sistema IBS/CBS.'}
                    </p>
                    {isContador && (
                      <Link
                        to="/diagnostico"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-sm transition-all"
                      >
                        <span>Iniciar Diagnóstico Agora</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meusDiagnosticos.map((diag) => (
                      <div
                        key={diag.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#2ECC71] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-slate-900 text-sm">
                              {diag.empresa || 'Empresa'}
                            </span>
                            {diag.tipo_diagnostico === '360' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/20 text-[#07132B] border border-[#D4AF37]/40">
                                Diagnóstico 360°
                              </span>
                            ) : diag.tipo_diagnostico === 'transicao' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Transição Fiscal
                              </span>
                            ) : diag.tipo_diagnostico === 'regimes' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                Comparação de Regime
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-[#145A32] border border-emerald-200">
                                Enquadramento Completo
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              Parecer: {diag.sistema_recomendado_novo || diag.regime_recomendado}
                            </span>
                            {diag.ano_base && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                Ano-base {diag.ano_base}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span>
                              RBT12:{' '}
                              <strong className="text-slate-700">
                                {formatarMoeda(diag.rbt12)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Folha 12m:{' '}
                              <strong className="text-slate-700">
                                {formatarMoeda(
                                  diag.folha12 ||
                                    (diag.folha_pagamento ? diag.folha_pagamento * 12 : 0),
                                )}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Economia estimada:{' '}
                              <strong className="text-emerald-600 font-bold">
                                {formatarMoeda(
                                  diag.economia_anual_novo || diag.economia_anual || 0,
                                )}
                                /ano
                              </strong>
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 block">
                            Realizado em{' '}
                            {diag.created
                              ? new Date(diag.created).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <Link
                            to={
                              diag.tipo_diagnostico === '360'
                                ? '/diagnostico/relatorio?aba=autoavaliacao'
                                : diag.tipo_diagnostico === 'transicao'
                                  ? '/diagnostico/relatorio?aba=transicao'
                                  : diag.tipo_diagnostico === 'regimes'
                                    ? '/diagnostico/relatorio?aba=regimes'
                                    : '/diagnostico/relatorio?aba=enquadramento'
                            }
                            className="px-3.5 py-2 rounded-xl bg-[#07132B] text-[#D4AF37] hover:bg-[#0c1f44] text-xs font-bold transition-colors"
                          >
                            Ver Relatório
                          </Link>
                          <Link
                            to="/diagnostico/relatorio"
                            className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          >
                            Consolidado
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 2 (SE EMPRESÁRIO): SIMULAÇÕES DA CALCULADORA */}
            {isEmpresario && abaEmpresario === 'simulacoes' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h2 className="font-heading font-bold text-lg text-slate-900">
                      Simulações da Calculadora IBS / CBS
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cenários e projeções tributárias salvas para sua empresa
                    </p>
                  </div>
                </div>

                {carregando ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">Buscando simulações...</p>
                  </div>
                ) : minhasSimulacoes.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Nenhuma simulação salva encontrada
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Quando seu analista ou você salvarem cenários na Calculadora IBS/CBS, eles
                      ficarão visíveis e acessíveis aqui.
                    </p>
                    <Link
                      to="/calculadora-ibs-cbs"
                      className="inline-flex items-center px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-sm transition-all"
                    >
                      <span>Abrir Calculadora IBS/CBS</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {minhasSimulacoes.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-slate-900 text-sm">
                              {sim.nome}
                            </span>
                            {sim.empresa && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {sim.empresa}
                              </span>
                            )}
                            {sim.regime_recomendado && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/15 text-[#07132B] border border-[#D4AF37]/30">
                                Recomendado: {sim.regime_recomendado}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            {sim.faturamento_mensal && (
                              <span>
                                Faturamento:{' '}
                                <strong className="text-slate-700">
                                  {formatarMoeda(sim.faturamento_mensal)}/mês
                                </strong>
                              </span>
                            )}
                            {sim.aliquota_efetiva !== undefined && (
                              <>
                                <span>•</span>
                                <span>
                                  Alíquota efetiva:{' '}
                                  <strong className="text-slate-700">
                                    {Number(sim.aliquota_efetiva).toFixed(2)}%
                                  </strong>
                                </span>
                              </>
                            )}
                            {sim.economia_anual !== undefined && (
                              <>
                                <span>•</span>
                                <span>
                                  Economia anual:{' '}
                                  <strong className="text-emerald-600 font-bold">
                                    {formatarMoeda(sim.economia_anual)}/ano
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 block">
                            Salva em{' '}
                            {sim.created
                              ? new Date(sim.created).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <Link
                            to="/calculadora-ibs-cbs"
                            className="px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-xs font-semibold text-[#07132B] hover:bg-[#D4AF37] hover:text-[#07132B] transition-colors"
                          >
                            Abrir na Calculadora
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3 (SE EMPRESÁRIO): PARECERES & CONVERSAS DO ASSISTENTE */}
            {isEmpresario && abaEmpresario === 'conversas' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h2 className="font-heading font-bold text-lg text-slate-900">
                      Pareceres & Conversas do Assistente
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Consultas técnicas e pareceres gerados pela IA da Contabilidade 5.0
                    </p>
                  </div>
                </div>

                {carregando ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">Buscando pareceres...</p>
                  </div>
                ) : minhasConversas.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Nenhum parecer registrado ainda
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Todas as análises e consultas sobre IBS/CBS salvas no assistente da plataforma
                      ficarão registradas aqui para sua consulta contínua.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {minhasConversas.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#2ECC71] hover:shadow-md transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-heading font-bold text-slate-900 text-sm">
                            {conv.titulo}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {conv.total_mensagens || conv.mensagens.length} mensagens
                          </span>
                        </div>

                        {conv.mensagens.length > 0 && (
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 line-clamp-3">
                            <strong className="text-slate-800 block mb-1">
                              Última orientação:
                            </strong>
                            {conv.mensagens[conv.mensagens.length - 1]?.texto}
                          </div>
                        )}

                        <span className="text-[11px] text-slate-400 block">
                          Atualizado em{' '}
                          {conv.updated || conv.created
                            ? new Date(conv.updated || conv.created).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EXPLICATIVO DE MIGRAÇÃO PARA ANALISTA (MODO TESTE) */}
      <ModalMigrarParaAnalista
        aberto={modalMigrarAberto}
        aoFechar={() => setModalMigrarAberto(false)}
      />
    </div>
  )
}
