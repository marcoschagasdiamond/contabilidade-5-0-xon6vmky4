import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PLANOS_CONFIG, MODO_TESTE_COBRANCA, migrarParaAnalistaModoTeste } from '@/services/planos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

/**
 * Página /planos — Planos da Contabilidade 5.0 em MODO TESTE
 *
 * 1) Plano Empresário restrito: "R$ 127/mês" (sem Carteira, sem Clientes, sem convites)
 * 2) Plano Analista: "R$ 347/mês" (com Carteira, Clientes e convites liberados)
 * 3) MODO TESTE bem sinalizado (sem cobrança nesta fase, sem checkout, contadores avaliam grátis)
 * 4) Regra Diamond Group (#07132B e #D4AF37), SEM ÍCONES.
 */
export default function Planos() {
  const navigate = useNavigate()
  const { isAuthenticated, isEmpresario, isContador, recarregarUsuario } = useAuth()
  const { toast } = useToast()

  const [modalMigracaoAberto, setModalMigracaoAberto] = useState(false)
  const [migrando, setMigrando] = useState(false)

  const planoEmpresario = PLANOS_CONFIG.empresario
  const planoAnalista = PLANOS_CONFIG.analista

  const handleMigrar = async () => {
    setMigrando(true)
    try {
      const res = await migrarParaAnalistaModoTeste()
      if (res.success) {
        await recarregarUsuario()
        toast({
          title: 'Perfil Migrado com Sucesso!',
          description:
            'Sua conta agora é de Analista. A Carteira, Gestão de Clientes e Convites estão liberados.',
        })
        setModalMigracaoAberto(false)
        navigate('/carteira')
      } else {
        toast({
          title: 'Erro na Migração',
          description: res.error || 'Não foi possível migrar seu perfil.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha na conexão com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setMigrando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* HEADER PRINCIPAL */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Fase de Avaliação • Modo Teste Ativo</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Planos & Modelos de Acesso
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Estrutura transparente desenhada para dar independência ao empresário e poder analítico
            completo aos consultores tributários.
          </p>

          {/* Banner de Modo Teste Informativo */}
          {MODO_TESTE_COBRANCA && (
            <div className="max-w-2xl mx-auto mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-[#D4AF37]/40 text-amber-200 text-xs sm:text-sm text-center">
              <strong className="text-white block font-bold mb-1">
                AVALIAÇÃO GRATUITA — MODO TESTE
              </strong>
              <span>
                Nesta fase, a plataforma está liberada para homologação e testes. Os valores abaixo
                são informativos: nenhuma cobrança ou cartão de crédito é exigido no momento.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* COMPARATIVO DE PLANOS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* CARD 1: PLANO EMPRESÁRIO (R$ 127/mês) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 sm:p-9 flex flex-col justify-between hover:shadow-lg transition-all relative">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-slate-300 text-slate-600 font-bold text-xs px-2.5 py-0.5 uppercase tracking-wider"
                  >
                    {planoEmpresario.tag}
                  </Badge>
                  {isEmpresario && (
                    <Badge className="bg-emerald-600 text-white font-bold text-xs">
                      Seu Plano Atual
                    </Badge>
                  )}
                </div>

                <h2 className="font-heading font-extrabold text-2xl text-[#07132B]">
                  {planoEmpresario.nome}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {planoEmpresario.subtitulo}
                </p>
              </div>

              {/* Preço */}
              <div className="py-4 border-y border-slate-100 flex items-baseline gap-2">
                <span className="font-heading font-black text-4xl sm:text-5xl text-[#07132B]">
                  {planoEmpresario.precoMensalTexto}
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {planoEmpresario.recorrencia}
                </span>
                <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Modo Teste
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{planoEmpresario.descricao}</p>

              {/* Recursos Inclusos */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  O que está incluso:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  {planoEmpresario.recursos
                    .filter((r) => r.liberado)
                    .map((rec, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] shrink-0 mt-1.5" />
                        <span className="leading-snug">{rec.texto}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Recursos Restritos */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recursos restritos neste plano:
                </span>
                <ul className="space-y-2 text-xs text-slate-400">
                  {planoEmpresario.restricoes.map((rest, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      <span className="line-through">{rest}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ação do Card Empresário */}
            <div className="pt-8 mt-6 border-t border-slate-100">
              {isAuthenticated ? (
                isEmpresario ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full text-xs font-bold py-3.5 rounded-xl border-slate-200 text-slate-500"
                  >
                    Plano Ativo na sua Conta
                  </Button>
                ) : (
                  <Link to="/minha-conta">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs font-bold py-3.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      Acessar Minha Conta
                    </Button>
                  </Link>
                )
              ) : (
                <Link to="/cadastro">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs font-bold py-3.5 rounded-xl border-[#07132B] text-[#07132B] hover:bg-slate-100"
                  >
                    Cadastrar como Empresário (Grátis em Teste)
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* CARD 2: PLANO ANALISTA (R$ 347/mês) — DESTAQUE */}
          <div className="bg-[#07132B] text-white rounded-3xl border-2 border-[#D4AF37] shadow-xl p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#D4AF37] text-[#07132B] font-bold text-xs px-2.5 py-0.5 uppercase tracking-wider">
                    {planoAnalista.tag}
                  </Badge>
                  {isContador && (
                    <Badge className="bg-emerald-500 text-slate-900 font-bold text-xs">
                      Seu Plano Atual
                    </Badge>
                  )}
                </div>

                <h2 className="font-heading font-extrabold text-2xl text-white">
                  {planoAnalista.nome}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">{planoAnalista.subtitulo}</p>
              </div>

              {/* Preço */}
              <div className="py-4 border-y border-white/10 flex items-baseline gap-2">
                <span className="font-heading font-black text-4xl sm:text-5xl text-[#D4AF37]">
                  {planoAnalista.precoMensalTexto}
                </span>
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                  {planoAnalista.recorrencia}
                </span>
                <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37] px-2.5 py-0.5 rounded font-heading">
                  Avaliação Gratuita
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{planoAnalista.descricao}</p>

              {/* Recursos Inclusos Liberados */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Todos os recursos liberados:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  {planoAnalista.recursos.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                      <span className={rec.destaque ? 'font-bold text-white' : ''}>
                        {rec.texto}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ação do Card Analista */}
            <div className="pt-8 mt-6 border-t border-white/10 relative">
              {isAuthenticated ? (
                isEmpresario ? (
                  <Button
                    type="button"
                    onClick={() => setModalMigracaoAberto(true)}
                    className="w-full text-xs font-bold py-3.5 rounded-xl bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] shadow-lg transition-all"
                  >
                    Migrar para Analista (Instantâneo no Modo Teste)
                  </Button>
                ) : (
                  <Link to="/carteira">
                    <Button
                      type="button"
                      className="w-full text-xs font-bold py-3.5 rounded-xl bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] shadow-lg transition-all"
                    >
                      Acessar Painel do Analista
                    </Button>
                  </Link>
                )
              ) : (
                <Link to="/cadastro">
                  <Button
                    type="button"
                    className="w-full text-xs font-bold py-3.5 rounded-xl bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] shadow-lg transition-all"
                  >
                    Criar Conta de Analista (Grátis em Teste)
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* NOTA METODOLÓGICA & FAQ RÁPIDO */}
        <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Dúvidas Frequentes sobre a Cobrança
            </span>
            <h3 className="font-heading font-extrabold text-xl text-[#07132B]">
              Como funciona o modelo de testes e migração?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 block font-bold text-sm">
                1. Cobrança Real Desativada
              </strong>
              <p className="leading-relaxed">
                Nesta fase de homologação, nenhum valor é cobrado no seu cartão ou faturado. Os
                preços (R$ 127 e R$ 347) servem para validação comercial e planejamento do serviço.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 block font-bold text-sm">
                2. Migração Imediata
              </strong>
              <p className="leading-relaxed">
                Empresários podem migrar diretamente para o perfil de Analista através da página
                Minha Conta com apenas um clique, liberando Carteira, Gestão de Clientes e Convites.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 block font-bold text-sm">
                3. Convite a Clientes
              </strong>
              <p className="leading-relaxed">
                Analistas contábeis podem convidar clientes da sua carteira por e-mail. O cliente
                recebe link exclusivo e entra com perfil Empresário vinculado diretamente à sua
                carteira.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MIGRAÇÃO PARA ANALISTA (MODO TESTE) */}
      <Dialog open={modalMigracaoAberto} onOpenChange={setModalMigracaoAberto}>
        <DialogContent className="sm:max-w-md bg-[#07132B] text-white border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <DialogHeader className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <span>Modo Teste Ativo</span>
            </div>
            <DialogTitle className="font-heading font-extrabold text-xl text-white">
              Migrar Conta para Perfil Analista
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Você está prestes a atualizar sua conta de <strong>Empresário</strong> para o perfil{' '}
              <strong>Analista</strong>. No modo teste atual, a migração é realizada
              instantaneamente, sem cobrança e sem exigência de pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <span className="font-bold text-[#D4AF37] uppercase tracking-wider block">
              Recursos que serão liberados imediatamente:
            </span>
            <div className="space-y-2 text-slate-200">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
                <span>
                  <strong>Carteira de Clientes:</strong> Painel analítico consolidado e KPIs
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
                <span>
                  <strong>Gestão de Clientes:</strong> Cadastro e fichas individuais de empresas
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" />
                <span>
                  <strong>Envio de Convites:</strong> Disparo de convites para clientes da carteira
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/15 border border-[#D4AF37]/40 text-amber-200 text-[11px] leading-relaxed">
              <strong>Preço oficial do plano:</strong> R$ 347/mês (sem cobrança nesta fase de testes
              gratuitos).
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalMigracaoAberto(false)}
              className="text-xs border-white/20 text-slate-300 hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={migrando}
              onClick={handleMigrar}
              className="flex-1 bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold text-xs"
            >
              {migrando ? 'Migrando Perfil...' : 'Confirmar Migração Gratuita'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
