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
  if (isNaN(value) || value === null || value === undefined) return '0'
  if (!isGranel) {
    return Math.round(value).toLocaleString('es-CO')
  }
  // For granel, limit to at most 3 decimals without trailing junk
  return Number(Number(value).toFixed(3)).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  })
}

export function formatGranelQuantity(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0'
  return Number(Number(value).toFixed(3)).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  })
}

