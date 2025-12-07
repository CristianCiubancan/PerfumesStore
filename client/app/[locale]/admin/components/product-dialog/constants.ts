import { ProductFormData } from '@/lib/schemas/product'

export const PRODUCT_FORM_DEFAULTS: ProductFormData = {
  name: '',
  brand: '',
  concentration: 'Eau_de_Parfum',
  gender: 'Unisex',
  fragranceFamilyId: 0,
  topNotes: '',
  heartNotes: '',
  baseNotes: '',
  volumeMl: 100,
  priceRON: 0,
  launchYear: new Date().getFullYear(),
  perfumer: '',
  longevityId: 0,
  sillageId: 0,
  seasonIds: [],
  occasionIds: [],
  rating: 0,
  stock: 0,
  imageUrl: '',
  description: '',
}

export function getProductFormDefaults(): ProductFormData {
  return {
    ...PRODUCT_FORM_DEFAULTS,
    launchYear: new Date().getFullYear(),
  }
}
