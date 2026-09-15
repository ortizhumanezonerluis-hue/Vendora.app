export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatStock(value: number, isGranel = false): string {
  if (isNaN(value)) return '0'
  if (!isGranel) {
    return Math.round(value).toLocaleString('es-CO')
  }
  // For granel, limit to at most 2 decimals and remove trailing zeros
  return Number(value.toFixed(2)).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

