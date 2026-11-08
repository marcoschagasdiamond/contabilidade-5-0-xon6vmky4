/**
 * Configurações e constantes institucionais da Contabilidade 5.0
 * Ponto único de verdade para canais de contato, telefone, e-mail e links do WhatsApp.
 */

export const WHATSAPP_EMPRESA_NUMERO = '551140028922'
export const TELEFONE_EMPRESA_FORMATADO = '+55 (11) 4002-8922'
export const TELEFONE_EMPRESA_LINK = 'tel:+551140028922'
export const EMAIL_EMPRESA_CONTATO = 'contato@contabilidade5.com.br'
export const EMAIL_EMPRESA_LINK = 'mailto:contato@contabilidade5.com.br'

export const ENDERECO_EMPRESA = 'Av. Paulista, 1000 — São Paulo/SP'
export const HORARIO_ATENDIMENTO_EMPRESA = 'Seg a Sex, 8h às 18h'

export const WHATSAPP_MENSAGEM_PADRAO_HOME =
  'Olá! Vim pelo site da Contabilidade 5.0 e quero falar com um especialista.'

/**
 * Monta o link wa.me direto com o número da empresa e mensagem pré-preenchida opcional.
 */
export function buildWhatsAppLink(mensagem?: string): string {
  const texto = (mensagem || WHATSAPP_MENSAGEM_PADRAO_HOME).trim()
  return `https://wa.me/${WHATSAPP_EMPRESA_NUMERO}?text=${encodeURIComponent(texto)}`
}
