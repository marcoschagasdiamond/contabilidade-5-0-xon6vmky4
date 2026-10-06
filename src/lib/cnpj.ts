/**
 * Utilitários para formatação e validação de CNPJ brasileiro
 */

/**
 * Remove qualquer caractere que não seja dígito
 */
export function limparCNPJ(valor: string): string {
  return (valor || '').replace(/\D/g, '')
}

/**
 * Aplica a máscara brasileira de CNPJ: 00.000.000/0000-00
 * Conforme o usuário digita ou cola, formata progressivamente até 14 dígitos.
 */
export function formatarCNPJ(valor: string): string {
  const digits = limparCNPJ(valor).slice(0, 14)
  if (!digits) return ''

  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

/**
 * Validação do algoritmo oficial de dígitos verificadores de CNPJ da Receita Federal
 * Rejeita CNPJs com tamanho diferente de 14 dígitos e dígitos repetidos (ex: 00000000000000, 11111111111111).
 */
export function validarCNPJ(cnpj: string): boolean {
  const digits = limparCNPJ(cnpj)

  if (digits.length !== 14) {
    return false
  }

  // Rejeita sequências repetidas como 11.111.111/1111-11
  if (/^(\d)\1{13}$/.test(digits)) {
    return false
  }

  // Cálculo do 1º dígito verificador (pesos: 5,4,3,2,9,8,7,6,5,4,3,2)
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < 12; i++) {
    soma += parseInt(digits[i], 10) * pesos1[i]
  }
  let resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto

  if (parseInt(digits[12], 10) !== dv1) {
    return false
  }

  // Cálculo do 2º dígito verificador (pesos: 6,5,4,3,2,9,8,7,6,5,4,3,2)
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  soma = 0
  for (let i = 0; i < 13; i++) {
    soma += parseInt(digits[i], 10) * pesos2[i]
  }
  resto = soma % 11
  const dv2 = resto < 2 ? 0 : 11 - resto

  return parseInt(digits[13], 10) === dv2
}
