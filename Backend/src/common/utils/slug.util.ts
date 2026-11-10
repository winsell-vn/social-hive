/**
 * Slug utility for generating SEO-friendly URLs from Vietnamese text
 */

// Vietnamese diacritics mapping
const vietnameseMap: Record<string, string> = {
  // Lowercase
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  đ: "d",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
  // Uppercase
  À: "a",
  Á: "a",
  Ả: "a",
  Ã: "a",
  Ạ: "a",
  Ă: "a",
  Ằ: "a",
  Ắ: "a",
  Ẳ: "a",
  Ẵ: "a",
  Ặ: "a",
  Â: "a",
  Ầ: "a",
  Ấ: "a",
  Ẩ: "a",
  Ẫ: "a",
  Ậ: "a",
  Đ: "d",
  È: "e",
  É: "e",
  Ẻ: "e",
  Ẽ: "e",
  Ẹ: "e",
  Ê: "e",
  Ề: "e",
  Ế: "e",
  Ể: "e",
  Ễ: "e",
  Ệ: "e",
  Ì: "i",
  Í: "i",
  Ỉ: "i",
  Ĩ: "i",
  Ị: "i",
  Ò: "o",
  Ó: "o",
  Ỏ: "o",
  Õ: "o",
  Ọ: "o",
  Ô: "o",
  Ồ: "o",
  Ố: "o",
  Ổ: "o",
  Ỗ: "o",
  Ộ: "o",
  Ơ: "o",
  Ờ: "o",
  Ớ: "o",
  Ở: "o",
  Ỡ: "o",
  Ợ: "o",
  Ù: "u",
  Ú: "u",
  Ủ: "u",
  Ũ: "u",
  Ụ: "u",
  Ư: "u",
  Ừ: "u",
  Ứ: "u",
  Ử: "u",
  Ữ: "u",
  Ự: "u",
  Ỳ: "y",
  Ý: "y",
  Ỷ: "y",
  Ỹ: "y",
  Ỵ: "y",
};

/**
 * Remove Vietnamese diacritics from text
 */
export function removeVietnameseDiacritics(text: string): string {
  return text
    .split("")
    .map((char) => vietnameseMap[char] || char)
    .join("");
}

/**
 * Generate a short random suffix for slug uniqueness
 */
export function generateShortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a URL-friendly slug from text content
 * @param content - The text content to generate slug from
 * @param maxLength - Maximum length of the slug (default: 60)
 * @returns URL-friendly slug
 *
 * Example:
 * Input: "Đây là bài viết test từ Playwright! 🎉 Testing post creation"
 * Output: "day-la-bai-viet-test-tu-playwright-testing-post-creation"
 */
export function generateSlug(content: string, maxLength = 60): string {
  // Remove Vietnamese diacritics
  let slug = removeVietnameseDiacritics(content);

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Remove emojis and special unicode characters
  slug = slug.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); // Emoticons
  slug = slug.replace(/[\u{1F300}-\u{1F5FF}]/gu, ""); // Misc Symbols and Pictographs
  slug = slug.replace(/[\u{1F680}-\u{1F6FF}]/gu, ""); // Transport and Map
  slug = slug.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ""); // Flags
  slug = slug.replace(/[\u{2600}-\u{26FF}]/gu, ""); // Misc symbols
  slug = slug.replace(/[\u{2700}-\u{27BF}]/gu, ""); // Dingbats

  // Replace special characters and spaces with hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/-+/g, "-");

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  // Truncate to max length, but don't cut in the middle of a word
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > maxLength * 0.6) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug;
}

/**
 * Generate a unique slug by appending a short ID if needed
 * @param baseSlug - The base slug
 * @param existingCheck - Function to check if slug exists
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existingCheck: (slug: string) => Promise<boolean>,
): Promise<string> {
  // First try the base slug
  const exists = await existingCheck(baseSlug);
  if (!exists) {
    return baseSlug;
  }

  // If exists, append short ID
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const uniqueSlug = `${baseSlug}-${generateShortId(6)}`;
    const slugExists = await existingCheck(uniqueSlug);
    if (!slugExists) {
      return uniqueSlug;
    }
    attempts++;
  }

  // Fallback: use timestamp
  return `${baseSlug}-${Date.now().toString(36)}`;
}
