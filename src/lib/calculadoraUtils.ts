export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00'
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatarPorcentagem(valor: number, decimais: number = 2): string {
  if (isNaN(valor)) return '0,00%'
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })}%`
}

export function parseInputMoeda(texto: string): number {
  if (!texto) return 0
  // Remove R$, espaços, pontos de milhar e troca vírgula por ponto
  const limpo = texto.replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : num
}

export function parseInputPercentual(texto: string): number {
  if (!texto) return 0
  const limpo = texto.replace(/[% \s]/g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : num
}
