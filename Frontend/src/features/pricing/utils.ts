import { QuoteStatus } from '@/types/pricing';

/**
 * Format price in Vietnamese Dong format
 * @param price - Price as number or string
 * @returns Formatted price string (e.g., "5.000.000đ")
 */
export function formatVNDPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(numPrice) + 'đ';
}

// Vietnamese diacritics mapping (mirrors Backend/src/common/utils/slug.util.ts)
const vietnameseMap: Record<string, string> = {
  // Lowercase
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  đ: 'd',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  // Uppercase
  À: 'a', Á: 'a', Ả: 'a', Ã: 'a', Ạ: 'a',
  Ă: 'a', Ằ: 'a', Ắ: 'a', Ẳ: 'a', Ẵ: 'a', Ặ: 'a',
  Â: 'a', Ầ: 'a', Ấ: 'a', Ẩ: 'a', Ẫ: 'a', Ậ: 'a',
  Đ: 'd',
  È: 'e', É: 'e', Ẻ: 'e', Ẽ: 'e', Ẹ: 'e',
  Ê: 'e', Ề: 'e', Ế: 'e', Ể: 'e', Ễ: 'e', Ệ: 'e',
  Ì: 'i', Í: 'i', Ỉ: 'i', Ĩ: 'i', Ị: 'i',
  Ò: 'o', Ó: 'o', Ỏ: 'o', Õ: 'o', Ọ: 'o',
  Ô: 'o', Ồ: 'o', Ố: 'o', Ổ: 'o', Ỗ: 'o', Ộ: 'o',
  Ơ: 'o', Ờ: 'o', Ớ: 'o', Ở: 'o', Ỡ: 'o', Ợ: 'o',
  Ù: 'u', Ú: 'u', Ủ: 'u', Ũ: 'u', Ụ: 'u',
  Ư: 'u', Ừ: 'u', Ứ: 'u', Ử: 'u', Ữ: 'u', Ự: 'u',
  Ỳ: 'y', Ý: 'y', Ỷ: 'y', Ỹ: 'y', Ỵ: 'y',
};

/**
 * Remove Vietnamese diacritics from text
 * @param text - Text with Vietnamese diacritics
 * @returns Text with diacritics converted to ASCII equivalents
 */
export function removeVietnameseDiacritics(text: string): string {
  return text
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');
}

/**
 * Generate slug from Vietnamese text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  // First, convert Vietnamese diacritics to ASCII
  let slug = removeVietnameseDiacritics(text);

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Replace non-alphanumeric with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Get status label in Vietnamese
 */
export function getQuoteStatusLabel(status: QuoteStatus | string): string {
  const labels: Record<string, string> = {
    [QuoteStatus.PENDING]: 'Chờ xử lý',
    [QuoteStatus.CONTACTED]: 'Đã liên hệ',
    [QuoteStatus.QUOTED]: 'Đã báo giá',
    [QuoteStatus.NEGOTIATING]: 'Đang thương lượng',
    [QuoteStatus.ACCEPTED]: 'Đã chấp nhận',
    [QuoteStatus.REJECTED]: 'Đã từ chối',
    [QuoteStatus.CANCELLED]: 'Đã hủy',
  };
  return labels[status] || status;
}

/**
 * Get status color for badges
 */
export function getQuoteStatusColor(status: QuoteStatus | string): string {
  const colors: Record<string, string> = {
    [QuoteStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [QuoteStatus.CONTACTED]: 'bg-blue-100 text-blue-800',
    [QuoteStatus.QUOTED]: 'bg-purple-100 text-purple-800',
    [QuoteStatus.NEGOTIATING]: 'bg-orange-100 text-orange-800',
    [QuoteStatus.ACCEPTED]: 'bg-green-100 text-green-800',
    [QuoteStatus.REJECTED]: 'bg-red-100 text-red-800',
    [QuoteStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Group services by category
 */
export function groupServicesByCategory<T extends { slug: string }>(
  services: T[],
  categorySlugs: string[]
): T[] {
  return services.filter((service) => categorySlugs.includes(service.slug));
}

