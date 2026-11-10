/**
 * FAQSchema - JSON-LD FAQPage structured data for SEO
 * Server Component - renders FAQ schema for rich results in search
 */

export interface FAQItem {
  /** The question text */
  question: string;
  /** The answer text */
  answer: string;
}

interface FAQSchemaProps {
  /** Array of FAQ items to render */
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      key="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default FAQSchema;

