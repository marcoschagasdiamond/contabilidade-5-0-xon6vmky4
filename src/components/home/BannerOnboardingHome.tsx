import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/hooks/useOnboarding'
import {
  getClienteEmpresaPorUsuario,
  getClienteEmpresaPorClienteAtivo,
} from '@/services/clientesEmpresas'

/**
 * Banner discreto de onboarding na home.
 *
 * Regras de exibição (criterio 4 do ajuste):
 *  - só para usuário LOGADO;
 *  - só quando NÃO há dados de empresa (clientes_empresas) para o usuário;
 *  - só quando o onboarding NÃO foi concluído nem dispensado
 *    (concluido_em || wizard_dispensado) — quem completou nunca é incomodado;
 *  - dispensável (X grava wizard_dispensado via salvarProgressoOnboarding).
 */
export default function BannerOnboardingHome() {
  const { user, isAuthenticated } = useAuth()
  const { progresso, carregando, dispensarWizard } = useOnboarding()
  const [temEmpresa, setTemEmpresa] = useState<boolean | null>(null)

  useEffect(() => {
    let vivo = true
    if (!isAuthenticated || !user?.id) {
      setTemEmpresa(null)
      return
    }
    // Fonte mestra: mesmo padrão do widget (cliente ativo → fallback usuário)
    ;(async () => {
      try {
        const porCliente = await getClienteEmpresaPorClienteAtivo()
        const registro = porCliente || (await getClienteEmpresaPorUsuario(user.id))
        if (vivo) setTemEmpresa(Boolean(registro))
      } catch {
        if (vivo) setTemEmpresa(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [isAuthenticated, user?.id])

  const onboardingEncerrado = Boolean(progresso?.concluido_em || progresso?.wizard_dispensado)
  const deveExibir = isAuthenticated && !carregando && temEmpresa === false && !onboardingEncerrado

  if (!deveExibir) return null

  return (
    <div
      data-testid="banner-onboarding-home"
      className="border-b border-[#D4AF37]/25 bg-[#07132B]/95 text-white"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <p className="flex-1 text-xs sm:text-sm text-slate-200">
          Falta pouco: configure sua empresa em 4 passos rápidos e desbloqueie o Diagnóstico 360°.
        </p>
        <Link
          to="/onboarding"
          data-testid="banner-onboarding-cta"
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-heading font-bold text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-all"
        >
          Começar
        </Link>
        <button
          type="button"
          aria-label="Dispensar aviso de onboarding"
          data-testid="banner-onboarding-fechar"
          onClick={() => dispensarWizard()}
          className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
