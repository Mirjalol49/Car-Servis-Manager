/**
 * Formats a raw Uzbek phone number (+998XXXXXXXXX) into a readable format (+998 XX XXX XX XX)
 */
export function formatPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return ""
  
  // Ensure it has exactly +998 followed by 9 digits
  const match = rawPhone.match(/^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/)
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`
  }
  
  // If it doesn't match the strict format but has 12 digits total
  const digits = rawPhone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
  }

  return rawPhone
}

/**
 * Strips all non-digit characters and ensures the +998 prefix exists.
 * Assumes the input comes from the UI which enforces the format.
 */
export function parsePhone(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '')
  if (digits.startsWith('998')) {
    return `+${digits}`
  }
  return formattedPhone
}

/**
 * Formats currency (UZS default or based on env NEXT_PUBLIC_CURRENCY)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "0"
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numericAmount)) return "0"

  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

export function getCurrencySymbol(): string {
  return process.env.NEXT_PUBLIC_CURRENCY || "UZS"
}
