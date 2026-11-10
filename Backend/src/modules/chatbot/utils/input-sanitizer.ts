export class InputSanitizer {
  /**
   * Sanitize user input: strip HTML, control chars, validate length
   */
  static sanitize(input: string): string {
    if (!input || typeof input !== "string") return "";

    let sanitized = input;

    // 1. Strip HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, "");

    // 2. Remove control characters (keep newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // 3. Trim whitespace
    sanitized = sanitized.trim();

    // 4. Limit length
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }

    return sanitized;
  }

  /**
   * Check for prompt injection patterns (log but don't block)
   */
  static detectInjection(input: string): boolean {
    const patterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /you\s+are\s+now/i,
      /^system:/i,
      /forget\s+(all\s+)?your\s+(instructions|rules|prompt)/i,
      /pretend\s+you\s+are/i,
      /act\s+as\s+(if\s+you\s+are|a)/i,
      /reveal\s+(your|the)\s+(system\s+)?prompt/i,
      /what\s+(are|is)\s+your\s+(instructions|system\s+prompt|rules)/i,
    ];

    return patterns.some((pattern) => pattern.test(input));
  }
}
