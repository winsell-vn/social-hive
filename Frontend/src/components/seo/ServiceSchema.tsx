/**
 * ServiceSchema - JSON-LD Service structured data for SEO
 * Server Component - renders Service schema for rich results in search
 * 
 * @see https://schema.org/Service
 */

const BASE_URL = 'https://chungtoixayweb.vn';

export interface ServiceOffer {
  /** Price value (as string for precision) */
  price: string;
  /** Currency code (e.g., 'VND') */
  priceCurrency: string;
  /** Price note or description */
  priceNote?: string;
}

export interface ServiceItem {
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** URL to service page */
  url?: string;
  /** Service image URL */
  image?: string;
  /** Service category */
  category?: string;
  /** Pricing offers */
  offers?: ServiceOffer[];
  /** Low price for aggregate offer */
  lowPrice?: string;
  /** High price for aggregate offer */
  highPrice?: string;
}

interface ServiceSchemaProps {
  /** Array of services to render */
  services: ServiceItem[];
  /** Provider organization name */
  providerName?: string;
  /** Provider URL */
  providerUrl?: string;
}

export function ServiceSchema({
  services,
  providerName = 'ChungToiXayWeb',
  providerUrl = BASE_URL,
}: ServiceSchemaProps) {
  // Don't render if no services
  if (!services || services.length === 0) {
    return null;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        ...(service.url && { url: service.url }),
        ...(service.image && { image: service.image }),
        ...(service.category && { category: service.category }),
        provider: {
          '@type': 'Organization',
          name: providerName,
          url: providerUrl,
        },
        // Use AggregateOffer if price range is provided
        ...(service.lowPrice && service.highPrice
          ? {
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: service.offers?.[0]?.priceCurrency || 'VND',
                lowPrice: service.lowPrice,
                highPrice: service.highPrice,
                offerCount: service.offers?.length || 1,
              },
            }
          : service.offers && service.offers.length > 0
          ? {
              offers: service.offers.map((offer) => ({
                '@type': 'Offer',
                price: offer.price,
                priceCurrency: offer.priceCurrency,
                ...(offer.priceNote && { description: offer.priceNote }),
              })),
            }
          : {}),
      },
    })),
  };

  return (
    <script
      key="service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default ServiceSchema;

