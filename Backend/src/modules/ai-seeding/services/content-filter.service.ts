import { Injectable, Logger } from "@nestjs/common";
import { ContentHashRepository } from "../repositories/content-hash.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import * as crypto from "crypto";

export interface FilterResult {
  passed: boolean;
  reason?: string;
  sanitizedContent?: string;
}

@Injectable()
export class ContentFilterService {
  private readonly logger = new Logger(ContentFilterService.name);

  // Similarity threshold for rejection (AC-079: >70% similarity)
  private readonly SIMILARITY_THRESHOLD = 0.7;
  // Number of recent posts to check for similarity
  private readonly RECENT_POSTS_TO_CHECK = 10;

  // Vietnamese profanity and inappropriate content patterns
  private readonly profanityPatterns: RegExp[] = [
    // ==================== PROFANITY / SWEAR WORDS ====================
    // Common Vietnamese profanity with diacritics and without
    /\b[đd][ụu][\.,-]?\s*m[ẹe]?\b/i, // đụ, đụ má, du, du me
    /\b[đd][ịi]t\b/i, // địt, dit
    /\b[đd][éeè][oo]?\b/i, // đéo, deo, đè
    /\b[đd]\.?\s*m\.?\b/i, // đ.m, d.m abbreviation
    /\bcl(gt)?\b/i, // cl, clgt
    /\bvcl\b/i, // vcl
    /\bvl\b/i, // vl (vãi lồn)
    /\bvkl\b/i, // vkl
    /\bvcc\b/i, // vcc
    /\bdmm?\b/i, // dm, dmm
    /\bdkm\b/i, // dkm
    /\bdcm\b/i, // dcm
    /\bđcm\b/i, // đcm
    /\bđkm\b/i, // đkm
    /\bl[ồo]n\b/i, // lồn, lon
    /\bc[ặa]c\b/i, // cặc, cac
    /\bbu[ồo]i\b/i, // buồi, buoi
    /\bd[ái]i\b/i, // dái, dai (testicles)
    /\b[đd][ĩi]t\s*m[ẹe]\b/i, // đĩt mẹ, dit me
    /\bm[ẹe]\s*m[àa]y\b/i, // mẹ mày
    /\bcon\s*[đd][ĩi]\b/i, // con đĩ
    /\b[đd][ĩi]\b/i, // đĩ (prostitute)
    /\bth[ằa]ng\s*ch[óo]\b/i, // thằng chó
    /\bcon\s*ch[óo]\b/i, // con chó (insult context)
    /\bch[óo]\s*ch[ếe]t\b/i, // chó chết
    /\bch[ếe]t\s*m[ẹe]\b/i, // chết mẹ
    /\bch[ếe]t\s*ti[ệe]t\b/i, // chết tiệt
    /\b[đd][ồo]\s*ng[ụu]\b/i, // đồ ngu
    /\b[đd][ồo]\s*[đd]i[ên]n\b/i, // đồ điên
    /\bngu\s*nh[ưu]\s*ch[óo]\b/i, // ngu như chó
    /\bngu\s*nh[ưu]\s*b[òo]\b/i, // ngu như bò
    /\bngu\s*nh[ưu]\s*l[ợo]n\b/i, // ngu như lợn

    // ==================== LEETSPEAK / CHARACTER SUBSTITUTION ====================
    /\b[đd][uư][o0][i1]?\b/i, // đuôi variations with 0, 1
    /\bd[1i]t\b/i, // d1t, dit
    /\bl[o0]n\b/i, // l0n
    /\bc[a4]c\b/i, // c4c
    /\bbu[o0][i1]\b/i, // bu0i, bu01
    /\bv[a4][i1]\s*l[o0]n\b/i, // v4i l0n, vai lon
    /\b[đd][e3][o0]\b/i, // đ30, de0
    /\bcl[o0]n\b/i, // cl0n

    // ==================== HATE SPEECH ====================
    /\bph[âa]n\s*bi[ệe]t\s*ch[ủu]ng\s*t[ộo]c\b/i, // phân biệt chủng tộc
    /\bk[ỳy]\s*th[ịi]\b/i, // kỳ thị
    /\bgh[ée]t\s*ng[ườư][ơo]i\b/i, // ghét người
    /\bdi[ệe]t\s*ch[ủu]ng\b/i, // diệt chủng
    /\bx[úu]c\s*ph[ạa]m\b/i, // xúc phạm
    /\bm[ọo]i\s*[đd]en\b/i, // mọi đen (racist)
    /\bch[àa]\s*ch[ổo]ng\b/i, // chà chổng (racist)
    /\b[đd][ồo]\s*man\s*r[ợo]\b/i, // đồ man rợ

    // ==================== SEXUAL CONTENT ====================
    /\bch[ịi]ch\b/i, // chịch
    /\b[đd][ụu]\b/i, // đụ (sexual)
    /\bhi[ếe]p\s*d[âa]m\b/i, // hiếp dâm
    /\bc[ưư][ỡo]ng\s*hi[ếe]p\b/i, // cưỡng hiếp
    /\bd[âa]m\s*[đd][ãa]ng\b/i, // dâm đãng
    /\bd[âa]m\s*d[ụu]c\b/i, // dâm dục
    /\bkh[iêi][êe]u\s*d[âa]m\b/i, // khiêu dâm
    /\bth[ủu]\s*d[âa]m\b/i, // thủ dâm
    /\bqu[ấa]y\s*r[ốo]i\s*t[ìi]nh\s*d[ụu]c\b/i, // quấy rối tình dục
    /\bl[ạa]m\s*d[ụu]ng\s*t[ìi]nh\s*d[ụu]c\b/i, // lạm dụng tình dục
    /\b[ấa]u\s*d[âa]m\b/i, // ấu dâm
    /\blo[ạa]n\s*lu[âa]n\b/i, // loạn luân
    /\bm[ạa]i\s*d[âa]m\b/i, // mại dâm
    /\bg[áa]i\s*g[ọo]i\b/i, // gái gọi
    /\b[đd][ĩi]\s*[đd]i[ếe]m\b/i, // đĩ điếm
    /\bcave\b/i, // cave (slang for prostitute)

    // ==================== VIOLENCE ====================
    /\bgi[ếe]t\s*ng[ườư][ơo]i\b/i, // giết người
    /\bs[áa]t\s*nh[âa]n\b/i, // sát nhân
    /\bt[àa]n\s*s[áa]t\b/i, // tàn sát
    /\bth[ảa]m\s*s[áa]t\b/i, // thảm sát
    /\bh[àa]nh\s*h[ạa]\b/i, // hành hạ
    /\btra\s*t[ấa]n\b/i, // tra tấn
    /\bb[ạa]o\s*l[ựu]c\b/i, // bạo lực
    /\b[đd][áa]nh\s*[đd][ậa]p\b/i, // đánh đập
    /\bch[éé]m\s*gi[ếe]t\b/i, // chém giết
    /\bt[ựu]\s*t[ửu]\b/i, // tự tử
    /\bt[ựu]\s*s[áa]t\b/i, // tự sát

    // ==================== COMMON ABBREVIATIONS / BYPASS ATTEMPTS ====================
    /\bcc\b/i, // cc (con cặc)
    /\bđm\b/i, // đm
    /\bđmm\b/i, // đmm
    /\bvđ\b/i, // vđ (vãi đái)
    /\bvl[n]?\b/i, // vl, vln
    /\bwtf\b/i, // wtf (English but commonly used)
    /\bf[*]+ck\b/i, // f*ck variations
    /\bsh[*i]+t\b/i, // sh*t, shiit
    /\bb[*i]+tch\b/i, // b*tch, biitch
    /\bass\b/i, // ass
    /\bd[*]+ck\b/i, // d*ck
    /\bp[*u]+ssy\b/i, // p*ssy

    // ==================== DOTTED/SPACED BYPASS PATTERNS ====================
    /[đd]\s*[ịi]\s*t/i, // đ ị t, d i t
    /l\s*[ồo]\s*n/i, // l ồ n
    /c\s*[ặa]\s*c/i, // c ặ c
    /[đd]\s*[ụu]\s*m/i, // đ ụ m
  ];

  // Spam patterns
  private readonly spamPatterns: RegExp[] = [
    /(.)\1{5,}/i, // Repeated characters (e.g., "aaaaaaa")
    /\b(buy now|click here|free money|act now)\b/i,
    /(https?:\/\/[^\s]+){3,}/i, // Multiple URLs
  ];

  constructor(
    private readonly contentHashRepository: ContentHashRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Filter content for profanity, spam, duplicates, and similarity (AC-079)
   */
  async filterContent(content: string, agentId: string): Promise<FilterResult> {
    // Check for empty content
    if (!content || content.trim().length === 0) {
      return { passed: false, reason: "Content is empty" };
    }

    // Check minimum length
    if (content.trim().length < 10) {
      return {
        passed: false,
        reason: "Content is too short (minimum 10 characters)",
      };
    }

    // Check maximum length
    if (content.length > 2000) {
      return {
        passed: false,
        reason: "Content is too long (maximum 2000 characters)",
      };
    }

    // Check for profanity
    const profanityResult = this.checkProfanity(content);
    if (!profanityResult.passed) {
      this.logger.warn(
        `Content filtered for profanity: ${profanityResult.reason}`,
      );
      return profanityResult;
    }

    // Check for spam patterns
    const spamResult = this.checkSpam(content);
    if (!spamResult.passed) {
      this.logger.warn(`Content filtered for spam: ${spamResult.reason}`);
      return spamResult;
    }

    // Check for duplicate content (exact hash match)
    const duplicateResult = await this.checkDuplicate(content, agentId);
    if (!duplicateResult.passed) {
      this.logger.warn(
        `Content filtered for duplicate: ${duplicateResult.reason}`,
      );
      return duplicateResult;
    }

    // AC-079: Check for similarity with recent posts (>70% Levenshtein similarity)
    const similarityResult = await this.checkSimilarityWithRecent(
      content,
      agentId,
    );
    if (!similarityResult.passed) {
      this.logger.warn(
        `Content filtered for similarity: ${similarityResult.reason}`,
      );
      return similarityResult;
    }

    return { passed: true };
  }

  /**
   * Check content for profanity
   */
  private checkProfanity(content: string): FilterResult {
    for (const pattern of this.profanityPatterns) {
      if (pattern.test(content)) {
        return {
          passed: false,
          reason: "Content contains inappropriate language",
        };
      }
    }
    return { passed: true };
  }

  /**
   * Check content for spam patterns
   */
  private checkSpam(content: string): FilterResult {
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        return { passed: false, reason: "Content appears to be spam" };
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 20) {
      return { passed: false, reason: "Content has excessive capitalization" };
    }

    return { passed: true };
  }

  /**
   * Check for duplicate content using content hash
   */
  private async checkDuplicate(
    content: string,
    agentId: string,
  ): Promise<FilterResult> {
    const hash = this.hashContent(content);

    const existing = await this.contentHashRepository.findByHash(hash);
    if (existing) {
      return { passed: false, reason: "Duplicate content detected" };
    }

    // Store the hash for future duplicate detection
    await this.contentHashRepository.create({
      hash,
      agentId,
      contentType: "generated",
    });

    return { passed: true };
  }

  /**
   * Generate SHA-256 hash of content
   */
  private hashContent(content: string): string {
    // Normalize content before hashing (lowercase, trim, remove extra spaces)
    const normalized = content.toLowerCase().trim().replace(/\s+/g, " ");
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Validate content without storing hash (for preview/testing)
   */
  async validateContent(content: string): Promise<FilterResult> {
    if (!content || content.trim().length === 0) {
      return { passed: false, reason: "Content is empty" };
    }

    if (content.trim().length < 10) {
      return { passed: false, reason: "Content is too short" };
    }

    const profanityResult = this.checkProfanity(content);
    if (!profanityResult.passed) return profanityResult;

    const spamResult = this.checkSpam(content);
    if (!spamResult.passed) return spamResult;

    return { passed: true };
  }

  /**
   * Calculate Levenshtein distance-based similarity between two strings (AC-079)
   * Returns a value between 0.0 (completely different) and 1.0 (identical)
   * @param str1 - First string to compare
   * @param str2 - Second string to compare
   * @returns Similarity score from 0.0 to 1.0
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize strings for comparison
    const s1 = str1.toLowerCase().trim().replace(/\s+/g, " ");
    const s2 = str2.toLowerCase().trim().replace(/\s+/g, " ");

    // Handle edge cases
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // Calculate Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;

    // Create distance matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }

    // Initialize first row
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    // Calculate similarity as 1 - (distance / max length)
    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return 1 - distance / maxLength;
  }

  /**
   * Check if content is too similar to agent's recent posts (AC-079)
   * Rejects content with >70% Levenshtein similarity to any of the last 10 posts
   * @param content - The new content to check
   * @param agentId - The agent's ID
   * @returns FilterResult indicating pass/fail
   */
  async checkSimilarityWithRecent(
    content: string,
    agentId: string,
  ): Promise<FilterResult> {
    try {
      // Get the agent to find their userId
      const agent = await this.prisma.aiAgent.findUnique({
        where: { id: agentId },
        select: { userId: true },
      });

      if (!agent) {
        // If agent not found, skip similarity check (shouldn't happen)
        this.logger.warn(`Agent ${agentId} not found for similarity check`);
        return { passed: true };
      }

      // Get the agent's last 10 posts
      const recentPosts = await this.prisma.post.findMany({
        where: {
          authorId: agent.userId,
          status: "PUBLISHED",
        },
        orderBy: { createdAt: "desc" },
        take: this.RECENT_POSTS_TO_CHECK,
        select: { content: true },
      });

      if (recentPosts.length === 0) {
        // No recent posts to compare against
        return { passed: true };
      }

      // Check similarity against each recent post
      for (const post of recentPosts) {
        if (!post.content) continue;

        const similarity = this.calculateSimilarity(content, post.content);

        if (similarity > this.SIMILARITY_THRESHOLD) {
          const similarityPercent = Math.round(similarity * 100);
          this.logger.debug(
            `Content rejected: ${similarityPercent}% similar to recent post for agent ${agentId}`,
          );
          return {
            passed: false,
            reason: `Content is ${similarityPercent}% similar to a recent post (threshold: ${Math.round(this.SIMILARITY_THRESHOLD * 100)}%)`,
          };
        }
      }

      return { passed: true };
    } catch (error) {
      // Log error but don't block content generation
      this.logger.error(
        `Error checking similarity for agent ${agentId}: ${error.message}`,
      );
      return { passed: true };
    }
  }
}
