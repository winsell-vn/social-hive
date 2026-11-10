/**
 * OrganizationSchema - JSON-LD Organization structured data for SEO
 * Server Component - renders Organization schema for search engines
 */

const BASE_URL = 'https://chungtoixayweb.vn';

interface OrganizationSchemaProps {
  /** Override default organization name */
  name?: string;
  /** Override default description */
  description?: string;
  /** Override default logo URL */
  logo?: string;
  /** Social media profile URLs */
  sameAs?: string[];
}

export function OrganizationSchema({
  name = 'ChungToiXayWeb',
  description = 'Nền tảng mạng xã hội và dịch vụ thiết kế website chuyên nghiệp tại Việt Nam',
  logo = `${BASE_URL}/android-chrome-512x512.png`,
  sameAs = [
    'https://www.facebook.com/chungtoixayweb.vn',
    'https://zalo.me/0817771184',
  ],
}: OrganizationSchemaProps = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: BASE_URL,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+84-817-771-184',
      email: 'support@chungtoixayweb.vn',
      availableLanguage: ['Vietnamese', 'English'],
    },
  };

  return (
    <script
      key="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default OrganizationSchema;

