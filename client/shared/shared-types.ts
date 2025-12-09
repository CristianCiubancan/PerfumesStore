/**
 * Shared Types and Enums
 *
 * Type definitions and enum values that are shared between client and server.
 * These MUST match the Prisma schema definitions.
 *
 * IMPORTANT: These values are duplicated in:
 * - /client/types/index.ts (genderValues, concentrationValues)
 * - /server/src/services/product/filter-builder.ts (enum validators)
 * - Prisma schema enum definitions
 *
 * Any changes must be synchronized across all locations.
 */

// Gender enum values - must match Prisma schema
export const GENDER_VALUES = ['Men', 'Women', 'Unisex'] as const
export type Gender = (typeof GENDER_VALUES)[number]

// Concentration enum values - must match Prisma schema
export const CONCENTRATION_VALUES = [
  'Eau_de_Cologne',
  'Eau_de_Toilette',
  'Eau_de_Parfum',
  'Parfum',
  'Extrait_de_Parfum',
] as const
export type Concentration = (typeof CONCENTRATION_VALUES)[number]

// Display labels for concentrations
export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  Eau_de_Cologne: 'Eau de Cologne',
  Eau_de_Toilette: 'Eau de Toilette',
  Eau_de_Parfum: 'Eau de Parfum',
  Parfum: 'Parfum',
  Extrait_de_Parfum: 'Extrait de Parfum',
} as const

// Type guards for runtime validation
export function isValidGender(value: string): value is Gender {
  return GENDER_VALUES.includes(value as Gender)
}

export function isValidConcentration(value: string): value is Concentration {
  return CONCENTRATION_VALUES.includes(value as Concentration)
}
