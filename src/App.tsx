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
import Diagnostico from './pages/Diagnostico'
import DiagnosticosHub from './pages/DiagnosticosHub'
import Diagnostico360 from './pages/Diagnostico360'
import DiagnosticoTransicao from './pages/DiagnosticoTransicao'
import DiagnosticoRegimes from './pages/DiagnosticoRegimes'
import CalculadoraIbsCbs from './pages/CalculadoraIbsCbs'
import DadosEmpresa from './pages/DadosEmpresa'
import NotFound from './pages/NotFound'

// Reforma Tributária (Diamond Group)
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

// Rota protegida genérica (exige usuário logado)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
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

  return <>{children}</>
}

// Rota protegida exclusiva para Contador / Admin (bloqueia perfil Empresário)
function ContadorRoute({ children }: { children: React.ReactNode }) {
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
                <Route path="/reforma-tributaria" element={<ReformaTributariaHub />} />
                <Route path="/calculadora-ibs-cbs" element={<CalculadoraIbsCbs />} />
                <Route path="/dados-empresa" element={<DadosEmpresa />} />
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
                {/* Carteira de Clientes do Contador (Restrita a Contadores) */}
                <Route
                  path="/carteira"
                  element={
                    <ContadorRoute>
                      <Carteira />
                    </ContadorRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ContadorRoute>
                      <Clientes />
                    </ContadorRoute>
                  }
                />
                <Route
                  path="/clientes/:id"
                  element={
                    <ContadorRoute>
                      <DetalheCliente />
                    </ContadorRoute>
                  }
                />
                {/* Hub e Trilha dos 4 Diagnósticos Tributários */}
                <Route path="/diagnosticos" element={<DiagnosticosHub />} />
                <Route path="/diagnostico-360" element={<Diagnostico360 />} />
                <Route path="/diagnostico-transicao" element={<DiagnosticoTransicao />} />
                <Route path="/diagnostico-regimes" element={<DiagnosticoRegimes />} />
                <Route path="/diagnostico" element={<Diagnostico />} />
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
