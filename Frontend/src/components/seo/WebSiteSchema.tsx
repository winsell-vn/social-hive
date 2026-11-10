/**
 * WebSiteSchema - JSON-LD WebSite structured data with SearchAction for SEO
 * Server Component - enables sitelinks search box in Google search results
 */

const BASE_URL = 'https://chungtoixayweb.vn';

interface WebSiteSchemaProps {
  /** Override default site name */
  name?: string;
  /** Override default description */
  description?: string;
  /** Override default search URL template */
  searchUrlTemplate?: string;
}

export function WebSiteSchema({
  name = 'ChungToiXayWeb',
  description = 'Nền tảng mạng xã hội và dịch vụ thiết kế website chuyên nghiệp tại Việt Nam',
  searchUrlTemplate = `${BASE_URL}/search?q={search_term_string}`,
}: WebSiteSchemaProps = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: BASE_URL,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      key="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default WebSiteSchema;

