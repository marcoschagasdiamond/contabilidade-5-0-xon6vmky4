/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { DadosEmpresaProvider } from '@/context/DadosEmpresaContext'
import { ClienteAtivoProvider } from '@/context/ClienteAtivoContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'

// Pages
import Index from './pages/Index'
import Servicos from './pages/Servicos'
import ContabilidadeDigital from './pages/ContabilidadeDigital'
import GestaoFiscalTributaria from './pages/GestaoFiscalTributaria'
import DepartamentoPessoal from './pages/DepartamentoPessoal'
import ConsultoriaFinanceira from './pages/ConsultoriaFinanceira'
import PlanejamentoSucessorio from './pages/PlanejamentoSucessorio'
import AssessoriaTributaria from './pages/AssessoriaTributaria'
import TreinamentoCapacitacao from './pages/TreinamentoCapacitacao'
import BpoContabil from './pages/BpoContabil'
import BackOffice50 from './pages/BackOffice50'
import GestaoRecebiveis from './pages/GestaoRecebiveis'
import Diagnostico360Servico from './pages/Diagnostico360Servico'
import NegociacaoCreditosPrecatorios from './pages/NegociacaoCreditosPrecatorios'
import MercadoCreditos from './pages/MercadoCreditos'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contato from './pages/Contato'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import TermosDeUso from './pages/TermosDeUso'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import MinhaConta from './pages/MinhaConta'
import Admin from './pages/Admin'
import Clientes from './pages/Clientes'
import DetalheCliente from './pages/DetalheCliente'
import Carteira from './pages/Carteira'
import Crm from './pages/Crm'
import FichaClienteCrm from './pages/FichaClienteCrm'
import DiagnosticosHub from './pages/DiagnosticosHub'
import DiagnosticoConfiguracoes from './pages/DiagnosticoConfiguracoes'
import Diagnostico360 from './pages/Diagnostico360'
import DiagnosticoAutoavaliacao from './pages/DiagnosticoAutoavaliacao'
import DiagnosticoTransicao from './pages/DiagnosticoTransicao'
import DiagnosticoRegimes from './pages/DiagnosticoRegimes'
import Diagnostico from './pages/Diagnostico'
import DiagnosticoRelatorioConsolidado from './pages/DiagnosticoRelatorioConsolidado'
import CalculadoraIbsCbs from './pages/CalculadoraIbsCbs'
import RecuperadorCreditos from './pages/RecuperadorCreditos'
import DadosEmpresa from './pages/DadosEmpresa'
import Planos from './pages/Planos'
import Agendamento from './pages/Agendamento'
import NotFound from './pages/NotFound'

// Reforma Tributária (Diamond Group)
import Legislacao from './pages/Legislacao'
import ReformaTributariaHub from './pages/reforma/ReformaTributariaHub'
import SubpageVisaoGeral from './pages/reforma/SubpageVisaoGeral'
import SubpageCalendario from './pages/reforma/SubpageCalendario'
import SubpageDicionario from './pages/reforma/SubpageDicionario'
import SubpageImpactoSetor from './pages/reforma/SubpageImpactoSetor'
import SubpageExcecoes from './pages/reforma/SubpageExcecoes'
import SubpagePainelCarteira from './pages/reforma/SubpagePainelCarteira'
import SubpageSplitPayment from './pages/reforma/SubpageSplitPayment'
import SubpageReformaNaPratica from './pages/reforma/SubpageReformaNaPratica'
import SubpageGlossarioFontes from './pages/reforma/SubpageGlossarioFontes'

// Guarda de rota autenticada (exige usuário logado e não renderiza nada do conteúdo antes da validação)
function RotaAutenticada({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Evita falso deslogado durante hidratação/inicialização do AuthStore
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sem sessão autenticada, redireciona para /login sem renderizar os dados filhos em cache
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// Rota protegida genérica (exige usuário logado)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <RotaAutenticada>{children}</RotaAutenticada>
}

// Rota protegida exclusiva para Analista / Admin (bloqueia perfil Empresário)
function AnalistaRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isEmpresario } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se for empresário, redireciona para a sua área restrita Minha Conta
  if (isEmpresario) {
    return <Navigate to="/minha-conta" replace />
  }

  return <>{children}</>
}

// Rota protegida exclusiva para Admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/minha-conta" replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthProvider>
      <TooltipProvider>
        <DadosEmpresaProvider>
          <ClienteAtivoProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route element={<Layout />}>
                {/* Landing page principal */}
                <Route path="/" element={<Index />} />
                {/* Redirecionamento da URL antiga /sobre para a seção na Home /#sobre */}
                <Route path="/sobre" element={<Navigate to="/#sobre" replace />} />
                {/* Páginas institucionais */}
                <Route path="/servicos" element={<Servicos />} />
                <Route path="/servicos/diagnostico-360" element={<Diagnostico360Servico />} />
                <Route path="/servicos/contabilidade-digital" element={<ContabilidadeDigital />} />
                <Route
                  path="/contabilidade-digital"
                  element={<Navigate to="/servicos/contabilidade-digital" replace />}
                />
                <Route
                  path="/servicos/gestao-fiscal-tributaria"
                  element={<GestaoFiscalTributaria />}
                />
                <Route
                  path="/gestao-fiscal-tributaria"
                  element={<Navigate to="/servicos/gestao-fiscal-tributaria" replace />}
                />
                <Route path="/servicos/departamento-pessoal" element={<DepartamentoPessoal />} />
                <Route
                  path="/departamento-pessoal"
                  element={<Navigate to="/servicos/departamento-pessoal" replace />}
                />
                <Route
                  path="/servicos/consultoria-financeira"
                  element={<ConsultoriaFinanceira />}
                />
                <Route
                  path="/consultoria-financeira"
                  element={<Navigate to="/servicos/consultoria-financeira" replace />}
                />
                <Route
                  path="/servicos/planejamento-sucessorio"
                  element={<PlanejamentoSucessorio />}
                />
                <Route
                  path="/planejamento-sucessorio"
                  element={<Navigate to="/servicos/planejamento-sucessorio" replace />}
                />
                <Route path="/servicos/assessoria-tributaria" element={<AssessoriaTributaria />} />
                <Route
                  path="/assessoria-tributaria"
                  element={<Navigate to="/servicos/assessoria-tributaria" replace />}
                />
                <Route path="/servicos/treinamento" element={<TreinamentoCapacitacao />} />
                <Route
                  path="/treinamento"
                  element={<Navigate to="/servicos/treinamento" replace />}
                />
                <Route path="/servicos/bpo-contabil" element={<BpoContabil />} />
                <Route
                  path="/bpo-contabil"
                  element={<Navigate to="/servicos/bpo-contabil" replace />}
                />
                <Route path="/servicos/back-office-50" element={<BackOffice50 />} />
                <Route
                  path="/back-office-50"
                  element={<Navigate to="/servicos/back-office-50" replace />}
                />
                <Route path="/servicos/gestao-recebiveis" element={<GestaoRecebiveis />} />
                <Route
                  path="/gestao-recebiveis"
                  element={<Navigate to="/servicos/gestao-recebiveis" replace />}
                />
                <Route
                  path="/servicos/negociacao-creditos-precatorios"
                  element={<NegociacaoCreditosPrecatorios />}
                />
                <Route
                  path="/negociacao-creditos-precatorios"
                  element={<Navigate to="/servicos/negociacao-creditos-precatorios" replace />}
                />
                <Route path="/mercado-creditos" element={<MercadoCreditos />} />
                <Route path="/reforma-tributaria" element={<ReformaTributariaHub />} />
                <Route path="/legislacao" element={<Legislacao />} />
                {/* Redirecionamentos da rota antiga Radar de Alertas para /legislacao */}
                <Route path="/radar-alertas" element={<Navigate to="/legislacao" replace />} />
                <Route path="/radar" element={<Navigate to="/legislacao" replace />} />
                <Route path="/radar-de-alertas" element={<Navigate to="/legislacao" replace />} />
                <Route path="/alertas" element={<Navigate to="/legislacao" replace />} />
                <Route path="/calculadora-ibs-cbs" element={<CalculadoraIbsCbs />} />
                <Route path="/recuperador-creditos" element={<RecuperadorCreditos />} />
                <Route
                  path="/dados-empresa"
                  element={
                    <RotaAutenticada>
                      <DadosEmpresa />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/agendamento"
                  element={
                    <RotaAutenticada>
                      <Agendamento />
                    </RotaAutenticada>
                  }
                />
                <Route path="/planos" element={<Planos />} />
                <Route path="/reforma-tributaria/visao-geral" element={<SubpageVisaoGeral />} />
                <Route path="/reforma-tributaria/calendario" element={<SubpageCalendario />} />
                <Route path="/reforma-tributaria/dicionario" element={<SubpageDicionario />} />
                <Route
                  path="/reforma-tributaria/impacto-por-setor"
                  element={<SubpageImpactoSetor />}
                />
                <Route path="/reforma-tributaria/excecoes" element={<SubpageExcecoes />} />
                {/* Redirecionamentos: módulos 6 e 7 da reforma migrados para a trilha oficial de diagnósticos */}
                <Route
                  path="/reforma-tributaria/comparador"
                  element={<Navigate to="/diagnostico-regimes" replace />}
                />
                <Route
                  path="/reforma-tributaria/diagnostico-reforma"
                  element={<Navigate to="/diagnostico-transicao" replace />}
                />
                <Route
                  path="/reforma-tributaria/painel-carteira"
                  element={<SubpagePainelCarteira />}
                />
                <Route path="/reforma-tributaria/split-payment" element={<SubpageSplitPayment />} />
                <Route
                  path="/reforma-tributaria/reforma-na-pratica"
                  element={<SubpageReformaNaPratica />}
                />
                <Route
                  path="/reforma-tributaria/kit-precificacao"
                  element={<Navigate to="/reforma-tributaria" replace />}
                />
                <Route path="/reforma-tributaria/glossario" element={<SubpageGlossarioFontes />} />
                {/* CRM e Carteira de Clientes do Analista (Restrita a Analistas, Master e Admin) */}
                <Route
                  path="/crm"
                  element={
                    <AnalistaRoute>
                      <Crm />
                    </AnalistaRoute>
                  }
                />
                <Route
                  path="/crm/cliente/:id"
                  element={
                    <AnalistaRoute>
                      <FichaClienteCrm />
                    </AnalistaRoute>
                  }
                />
                <Route
                  path="/carteira"
                  element={
                    <AnalistaRoute>
                      <Carteira />
                    </AnalistaRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <AnalistaRoute>
                      <Clientes />
                    </AnalistaRoute>
                  }
                />
                <Route
                  path="/clientes/:id"
                  element={
                    <AnalistaRoute>
                      <DetalheCliente />
                    </AnalistaRoute>
                  }
                />{' '}
                {/* Hub e Trilha dos Diagnósticos Tributários */}
                <Route path="/diagnosticos" element={<DiagnosticosHub />} />
                <Route
                  path="/diagnosticos/configuracoes"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoConfiguracoes />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-configuracoes"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoConfiguracoes />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-360"
                  element={
                    <RotaAutenticada>
                      <Diagnostico360 />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-autoavaliacao"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoAutoavaliacao />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-transicao"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoTransicao />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-regimes"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoRegimes />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico"
                  element={
                    <RotaAutenticada>
                      <Diagnostico />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico/relatorio"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoRelatorioConsolidado />
                    </RotaAutenticada>
                  }
                />
                <Route
                  path="/diagnostico-relatorio"
                  element={
                    <RotaAutenticada>
                      <DiagnosticoRelatorioConsolidado />
                    </RotaAutenticada>
                  }
                />
                <Route path="/blog" element={<Blog />} />{' '}
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                {/* Autenticação & Conta do Cliente */}
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                <Route
                  path="/minha-conta"
                  element={
                    <ProtectedRoute>
                      <MinhaConta />
                    </ProtectedRoute>
                  }
                />
                {/* Rota Protegida Admin */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClienteAtivoProvider>
        </DadosEmpresaProvider>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
