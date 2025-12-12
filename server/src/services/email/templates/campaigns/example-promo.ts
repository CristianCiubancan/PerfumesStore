/**
 * Example Campaign Template
 *
 * This is a sample campaign template that demonstrates how to create
 * new campaign emails. To create a new campaign:
 *
 * 1. Copy this file and rename it (e.g., `summer-sale-2025.ts`)
 * 2. Update the metadata (id, name, description)
 * 3. Update the content object with your localized content
 * 4. Register the template in ../index.ts
 *
 * The template will then appear in the admin campaign creation dropdown.
 */

import { config } from '../../../../config'
import { Locale } from '../translations'
import { CampaignContent, renderCampaignEmail } from '../campaign-base'

// ============================================================================
// Template Metadata
// ============================================================================

export const metadata = {
  id: 'campaign-example-promo',
  name: 'Example Promotion',
  description: 'Sample promotional campaign template',
  category: 'campaign' as const, // Must be 'campaign' to appear in campaign dropdown
  variables: [] as string[], // No external variables needed - content is baked in
}

// ============================================================================
// Campaign Content (All Localized)
// ============================================================================

const content: CampaignContent = {
  subject: {
    en: 'Exclusive Offer Just for You!',
    ro: 'Ofertă Exclusivă Doar Pentru Tine!',
    fr: 'Offre Exclusive Rien Que Pour Vous!',
    de: 'Exklusives Angebot Nur Für Sie!',
    es: '¡Oferta Exclusiva Solo Para Ti!',
  },
  heading: {
    en: 'Discover Our Latest Collection',
    ro: 'Descoperă Ultima Noastră Colecție',
    fr: 'Découvrez Notre Dernière Collection',
    de: 'Entdecken Sie Unsere Neueste Kollektion',
    es: 'Descubre Nuestra Última Colección',
  },
  body: {
    en: `
      <p>We're excited to share something special with you!</p>
      <p>As a valued subscriber, you get <strong>exclusive early access</strong> to our newest fragrances. From timeless classics to bold new scents, there's something for everyone.</p>
      <p>Don't miss out on this limited-time opportunity to find your perfect signature scent.</p>
    `,
    ro: `
      <p>Suntem încântați să împărtășim ceva special cu tine!</p>
      <p>Ca abonat valoros, ai <strong>acces exclusiv anticipat</strong> la cele mai noi parfumuri ale noastre. De la clasice atemporale la arome îndrăznețe noi, există ceva pentru toată lumea.</p>
      <p>Nu rata această oportunitate limitată de a-ți găsi parfumul perfect.</p>
    `,
    fr: `
      <p>Nous sommes ravis de partager quelque chose de spécial avec vous!</p>
      <p>En tant qu'abonné privilégié, vous bénéficiez d'un <strong>accès exclusif en avant-première</strong> à nos derniers parfums. Des classiques intemporels aux nouvelles senteurs audacieuses, il y en a pour tous les goûts.</p>
      <p>Ne manquez pas cette opportunité limitée de trouver votre parfum signature parfait.</p>
    `,
    de: `
      <p>Wir freuen uns, etwas Besonderes mit Ihnen zu teilen!</p>
      <p>Als geschätzter Abonnent erhalten Sie <strong>exklusiven Frühzugang</strong> zu unseren neuesten Düften. Von zeitlosen Klassikern bis zu mutigen neuen Düften ist für jeden etwas dabei.</p>
      <p>Verpassen Sie nicht diese zeitlich begrenzte Gelegenheit, Ihren perfekten Signaturduft zu finden.</p>
    `,
    es: `
      <p>¡Estamos emocionados de compartir algo especial contigo!</p>
      <p>Como suscriptor valioso, tienes <strong>acceso exclusivo anticipado</strong> a nuestras fragancias más nuevas. Desde clásicos atemporales hasta nuevos aromas atrevidos, hay algo para todos.</p>
      <p>No te pierdas esta oportunidad por tiempo limitado de encontrar tu aroma distintivo perfecto.</p>
    `,
  },
  ctaText: {
    en: 'Shop Now',
    ro: 'Cumpără Acum',
    fr: 'Acheter Maintenant',
    de: 'Jetzt Einkaufen',
    es: 'Comprar Ahora',
  },
  ctaUrl: `${config.CLIENT_URL}/store`,
}

// ============================================================================
// Template Functions
// ============================================================================

/**
 * Render the campaign email for a given locale
 */
export function render(
  _data: Record<string, never>, // No data needed - content is baked in
  locale: Locale
): { subject: string; html: string; text: string } {
  return renderCampaignEmail(content, locale)
}

/**
 * Get sample data for preview (empty - content is in template)
 */
export function getSampleData(): Record<string, never> {
  return {}
}
