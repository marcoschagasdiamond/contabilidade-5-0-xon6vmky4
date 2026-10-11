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
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { getDiagnosticos, type DiagnosticoRecord } from '@/services/diagnosticos'
import { Button } from '@/components/ui/button'

export default function MinhaConta() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { dadosEmpresa, salvoNoBanco } = useDadosEmpresa()

  const [meusDiagnosticos, setMeusDiagnosticos] = useState<DiagnosticoRecord[]>([])
  const [carregandoDiags, setCarregandoDiags] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregandoDiags(true)
      try {
        const todos = await getDiagnosticos()
        // Filtra diagnósticos do usuário por user_id ou pelo e-mail
        const userEmail = user?.email?.toLowerCase() || ''
        const filtrados = todos.filter(
          (d) =>
            (d as any).user_id === user?.id ||
            (d.email && d.email.toLowerCase() === userEmail) ||
            (dadosEmpresa.email && d.email.toLowerCase() === dadosEmpresa.email.toLowerCase()),
        )
        setMeusDiagnosticos(filtrados)
      } catch (err) {
        console.warn('Erro ao carregar diagnósticos do usuário:', err)
      } finally {
        setCarregandoDiags(false)
      }
    }
    carregar()
  }, [user?.id, user?.email, dadosEmpresa.email])

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

            {/* Acesso rápido às ferramentas */}
            <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-xs space-y-3">
              <span className="font-bold text-slate-900 block text-sm">
                Ferramentas Disponíveis
              </span>
              <Link
                to="/diagnostico"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#2ECC71] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#145A32]" />
                  <span className="font-semibold text-slate-800 group-hover:text-[#145A32]">
                    Novo Diagnóstico Tributário
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/calculadora-ibs-cbs"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-semibold text-slate-800 group-hover:text-[#07132B]">
                    Calculadora IBS / CBS
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* COLUNA DIREITA: HISTÓRICO DE DIAGNÓSTICOS VINCULADOS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900">
                    Diagnósticos Tributários Vinculados
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Histórico de simulações e pareceres gerados para esta conta
                  </p>
                </div>
                <Link
                  to="/diagnostico"
                  className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] transition-colors"
                >
                  Fazer Novo Diagnóstico
                </Link>
              </div>

              {carregandoDiags ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2ECC71]" />
                  <p className="text-xs">Buscando diagnósticos vinculados...</p>
                </div>
              ) : meusDiagnosticos.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Nenhum diagnóstico vinculado ainda
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Execute o simulador tributário para descobrir o regime ideal (Simples, Presumido
                    ou Real) sob o novo sistema tributário IBS/CBS.
                  </p>
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Iniciar Diagnóstico Agora</span>
                  </Link>
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-[#145A32] border border-emerald-200">
                            Recomendado: {diag.sistema_recomendado_novo || diag.regime_recomendado}
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
                            <strong className="text-slate-700">{formatarMoeda(diag.rbt12)}</strong>
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
                              {formatarMoeda(diag.economia_anual_novo || diag.economia_anual || 0)}
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
                          to="/diagnostico"
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Novo cálculo
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
