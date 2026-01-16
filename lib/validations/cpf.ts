/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas)
 * CPF format: XXX.XXX.XXX-XX or XXXXXXXXXXX
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '')

  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

/**
 * Formats CPF with mask: XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Checks if a string is a CPF (11 digits)
 */
export function isCPF(value: string): boolean {
  const clean = value.replace(/\D/g, '')
  return clean.length === 11
}
