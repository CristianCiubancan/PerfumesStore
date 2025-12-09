import { Prisma } from '@prisma/client'

/**
 * Decimal Utility
 *
 * Provides shared utility functions for working with Prisma.Decimal types.
 * This ensures consistent conversion between JavaScript numbers and Prisma Decimals
 * throughout the application.
 */

/**
 * Convert a number or string to Prisma.Decimal
 */
export function toDecimal(value: number | string): Prisma.Decimal {
  return new Prisma.Decimal(value)
}

/**
 * Convert a Prisma.Decimal to a JavaScript number
 */
export function toNumber(value: Prisma.Decimal): number {
  return value.toNumber()
}

/**
 * Convert an optional value to Prisma.Decimal
 */
export function toDecimalOrUndefined(value: number | string | undefined): Prisma.Decimal | undefined {
  return value !== undefined ? new Prisma.Decimal(value) : undefined
}

/**
 * Convert an optional Prisma.Decimal to a JavaScript number
 */
export function toNumberOrUndefined(value: Prisma.Decimal | undefined | null): number | undefined {
  return value ? value.toNumber() : undefined
}

/**
 * Convert a record of values to Prisma.Decimal
 * Useful for bulk conversions
 */
export function toDecimalRecord<T extends string>(
  record: Record<T, number | string>
): Record<T, Prisma.Decimal> {
  const result = {} as Record<T, Prisma.Decimal>
  for (const key in record) {
    result[key] = new Prisma.Decimal(record[key])
  }
  return result
}

/**
 * Convert a record of Prisma.Decimal values to JavaScript numbers
 */
export function toNumberRecord<T extends string>(
  record: Record<T, Prisma.Decimal>
): Record<T, number> {
  const result = {} as Record<T, number>
  for (const key in record) {
    result[key] = record[key].toNumber()
  }
  return result
}
