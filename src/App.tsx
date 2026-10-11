/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { DadosEmpresaProvider } from '@/context/DadosEmpresaContext'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Sobre from './pages/Sobre'
import Servicos from './pages/Servicos'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contato from './pages/Contato'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import TermosDeUso from './pages/TermosDeUso'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Diagnostico from './pages/Diagnostico'
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
import SubpageComparador from './pages/reforma/SubpageComparador'
import SubpageDiagnosticoReforma from './pages/reforma/SubpageDiagnosticoReforma'
import SubpagePainelCarteira from './pages/reforma/SubpagePainelCarteira'
import SubpageGlossarioFontes from './pages/reforma/SubpageGlossarioFontes'

// Rota protegida para /admin
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

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <DadosEmpresaProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              {/* Landing page principal */}
              <Route path="/" element={<Index />} />

              {/* Páginas institucionais */}
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/servicos" element={<Servicos />} />
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
              <Route path="/reforma-tributaria/comparador" element={<SubpageComparador />} />
              <Route
                path="/reforma-tributaria/diagnostico-reforma"
                element={<SubpageDiagnosticoReforma />}
              />
              <Route
                path="/reforma-tributaria/painel-carteira"
                element={<SubpagePainelCarteira />}
              />
              <Route
                path="/reforma-tributaria/kit-precificacao"
                element={<Navigate to="/reforma-tributaria" replace />}
              />
              <Route path="/reforma-tributaria/glossario" element={<SubpageGlossarioFontes />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />

              {/* Login */}
              <Route path="/login" element={<Login />} />

              {/* Rota Protegida Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DadosEmpresaProvider>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
