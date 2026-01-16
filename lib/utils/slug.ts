/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

/**
 * Generate unique slug by appending number if needed
 */
export function generateUniqueSlug(text: string, existingSlugs: string[]): string {
  let slug = generateSlug(text)
  let counter = 1

  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(text)}-${counter}`
    counter++
  }

  return slug
}
