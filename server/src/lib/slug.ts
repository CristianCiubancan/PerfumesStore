/**
 * Generate a URL-friendly slug from product name, brand, and concentration
 *
 * SEO-friendly slugs help search engines understand the page content and
 * improve click-through rates by showing descriptive URLs to users.
 *
 * Example: "Chanel", "No. 5", "Eau de Parfum" -> "chanel-no-5-eau-de-parfum"
 */
export function generateSlug(
  brand: string,
  name: string,
  concentration: string
): string {
  // Combine brand, name, and a shorter concentration
  const concentrationShort = concentration
    .replace(/_/g, ' ')
    .replace('Extrait de Parfum', 'Extrait')

  const combined = `${brand} ${name} ${concentrationShort}`

  return combined
    .toLowerCase()
    // Replace special characters with their ASCII equivalents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace & with 'and'
    .replace(/&/g, 'and')
    // Remove apostrophes and quotes entirely (e.g., "J'adore" -> "jadore")
    .replace(/['"']/g, '')
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
}

/**
 * Generate a unique slug by appending a suffix if needed
 * Used when creating products to ensure uniqueness
 */
export async function generateUniqueSlug(
  brand: string,
  name: string,
  concentration: string,
  checkExists: (slug: string) => Promise<boolean>,
  _excludeId?: number
): Promise<string> {
  const baseSlug = generateSlug(brand, name, concentration)

  // Check if base slug is available
  const exists = await checkExists(baseSlug)
  if (!exists) {
    return baseSlug
  }

  // If it exists and we have an excludeId, check if it belongs to the same product
  // This handles the case of updating a product without changing its name
  // The checkExists function should handle this case

  // Try adding numeric suffixes
  let counter = 2
  while (counter < 100) {
    const suffixedSlug = `${baseSlug}-${counter}`
    const suffixedExists = await checkExists(suffixedSlug)
    if (!suffixedExists) {
      return suffixedSlug
    }
    counter++
  }

  // Fallback: add timestamp
  return `${baseSlug}-${Date.now()}`
}
