import { useState } from 'react'
import { buildWhatsAppLink, WHATSAPP_MENSAGEM_PADRAO_HOME } from '@/config/empresa'

interface BotaoWhatsAppFlutuanteProps {
  mensagem?: string
  className?: string
}

/**
 * Ícone SVG oficial do WhatsApp para renderização vetorial nítida.
 */
function WhatsAppIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.97.57 3.89 1.66 5.54L2 22l4.72-1.63a9.86 9.86 0 0 0 5.32 1.54h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.12c-.24.68-1.4 1.25-1.94 1.33-.51.08-1.18.11-3.39-.8-2.36-.97-3.88-3.37-4-3.53-.11-.16-.97-1.3-0.97-2.48s.62-1.76.84-2c.22-.24.49-.3.65-.3s.33.01.47.02c.16.01.37-.06.58.44.22.53.75 1.83.81 1.97.07.14.11.3.02.48-.09.18-.14.29-.28.45-.14.16-.3.35-.43.48-.15.14-.3.3-.13.6.17.29.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.14.47.12.65-.08.18-.21.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.98.3.15.5.23.57.36.08.13.08.76-.16 1.44z" />
    </svg>
  )
}

/**
 * Botão flutuante de WhatsApp exclusivo para a Home.
 *
 * Características:
 * - Fixo no canto inferior direito (bottom-6 right-6 no desktop; bottom-5 right-5 no mobile)
 * - Verde WhatsApp oficial (#25D366) com hover rico e sombra profunda
 * - Tooltip/balão orientativo suave que se expande ao passar o mouse ou focar por teclado
 * - Animação suave de entrada (animate-fade-in + bounce leve)
 * - Acessibilidade completa: role link, target _blank com rel seguro e aria-label claro
 * - Discreto em mobile sem obstruir elementos centrais da página
 */
export function BotaoWhatsAppFlutuante({
  mensagem = WHATSAPP_MENSAGEM_PADRAO_HOME,
  className = '',
}: BotaoWhatsAppFlutuanteProps) {
  const [isHovered, setIsHovered] = useState(false)
  const href = buildWhatsAppLink(mensagem)

  return (
    <div
      data-testid="whatsapp-floating-container"
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3 animate-fade-in pointer-events-auto ${className}`}
    >
      {/* Balão / Tooltip lateral visível no hover ou foco em desktop/tablet */}
      <div
        className={`hidden sm:flex items-center bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xl border border-white/10 transition-all duration-300 transform pointer-events-none ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
        aria-hidden="true"
      >
        <span>Falar com especialista no WhatsApp</span>
        <span className="w-2 h-2 bg-[#25D366] rounded-full ml-2 animate-pulse" />
      </div>

      {/* Botão de Ação Principal */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com um especialista no WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        data-testid="whatsapp-floating-button"
        className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] text-white shadow-[0_10px_25px_-5px_rgba(37,211,102,0.5),0_8px_10px_-6px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        {/* Halo de pulso sutil ao fundo */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:opacity-50"
          style={{ animationDuration: '3s' }}
          aria-hidden="true"
        />

        {/* Ícone oficial */}
        <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8 fill-white relative z-10 transition-transform group-hover:rotate-6" />

        {/* Badge indicador de status online */}
        <span
          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm z-20"
          title="Online agora"
        />
      </a>
    </div>
  )
}

export default BotaoWhatsAppFlutuante
