/**
 * Shared Types and Enums
 *
 * Single source of truth for type definitions and enum values.
 * These MUST match the Prisma schema definitions.
 *
 * Imported by:
 * - /client/types/index.ts
 * - /server/src/services/product/filter-builder.ts
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
