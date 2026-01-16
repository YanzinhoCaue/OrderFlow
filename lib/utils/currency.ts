/**
 * Format currency value to Brazilian Real (BRL)
 */
export function formatCurrency(value: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: getCurrencyCode(locale),
  }).format(value)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Get currency code based on locale
 */
function getCurrencyCode(locale: string): string {
  const currencyMap: Record<string, string> = {
    'pt-BR': 'BRL',
    'en': 'USD',
    'es': 'EUR',
    'zh': 'CNY',
    'ja': 'JPY',
  }
  return currencyMap[locale] || 'BRL'
}

/**
 * Format currency input (as user types)
 */
export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const amount = parseInt(numbers) / 100
  return amount.toFixed(2)
}
