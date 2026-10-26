import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop
 *
 * Garante que em toda navegação entre rotas o viewport seja posicionado no TOPO (0, 0),
 * corrigindo o problema de páginas abrirem roladas no meio ou no final.
 *
 * Preserva o comportamento de âncoras internas (ex.: #contato, #sobre, #depoimentos)
 * rolando suavemente até o elemento âncora quando houver hash na URL.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Se a URL contiver hash (âncora interna), rola suavemente até o elemento âncora
    if (hash) {
      const targetId = hash.replace(/^#/, '')
      // Pequeno timeout para garantir que o DOM da página de destino esteja pronto
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)

      return () => clearTimeout(timer)
    }

    // Navegação comum entre rotas (sem hash): força reset instantâneo ao topo absoluto
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, hash])

  return null
}
