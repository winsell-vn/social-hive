import {
  buildPersonalityPrompt,
  getEmojiGuidelines,
  getHashtagGuidelines,
  PersonalityTemplate,
  VIETNAMESE_EMOTICONS,
  CONTENT_POLICY_INSTRUCTION,
} from "./personality-templates";

/**
 * Vietnamese emoticon usage guide for prompts
 */
const VIETNAMESE_EMOTICON_GUIDE = `
## Vietnamese Emoticon Guide:
Use these text-based emoticons instead of Unicode emoji:
- Laughing/LOL: =)) =]] :))
- Happy/Smile: :) ^^ :3
- Sad/Crying: :(( T_T
- Sarcasm/Irony: :v (very common in Vietnamese)
- Confused/Dizzy: @@
- Indifferent: ==~ ~
- Love: <3
- Playful: :P xD
IMPORTANT: Do NOT use Unicode emoji like 😀 🎉 ❤️ - only use text emoticons.
`.trim();

export interface ContentPromptOptions {
  personality: {
    traits: string;
    tone: string;
    interests?: string[];
    writingStyle?: string;
  };
  emojiUsage?: PersonalityTemplate["emojiUsage"];
  hashtagUsage?: PersonalityTemplate["hashtagUsage"];
  context?: string;
  maxLength?: number;
}

/**
 * Generate system prompt for post creation
 */
export function buildPostSystemPrompt(options: ContentPromptOptions): string {
  const basePrompt = buildPersonalityPrompt(options.personality);

  const guidelines = [
    basePrompt,
    "",
    "## Post Guidelines:",
    `- Keep the post under ${options.maxLength || 500} characters`,
    "- Write a single, complete thought or story",
    "- Make it engaging and shareable",
    `- ${CONTENT_POLICY_INSTRUCTION}`,
    options.emojiUsage && options.emojiUsage !== "none"
      ? getEmojiGuidelines(options.emojiUsage)
      : "",
    options.emojiUsage && options.emojiUsage !== "none"
      ? VIETNAMESE_EMOTICON_GUIDE
      : "",
    options.hashtagUsage ? getHashtagGuidelines(options.hashtagUsage) : "",
  ].filter(Boolean);

  return guidelines.join("\n");
}

/**
 * Generate user prompt for post creation (AC-078: includes topic avoidance instructions)
 */
export function buildPostUserPrompt(options: {
  topic?: string;
  mood?: string;
  context?: string;
  /** Topics to avoid - recently used by this agent (AC-078) */
  excludedTopics?: string[];
}): string {
  const parts = ["Write a social media post"];

  if (options.topic) {
    parts.push(`about ${options.topic}`);
  }

  if (options.mood) {
    parts.push(`with a ${options.mood} mood`);
  }

  if (options.context) {
    parts.push(`\n\nContext: ${options.context}`);
  }

  // AC-078: Add topic avoidance instructions to LLM prompt
  if (options.excludedTopics && options.excludedTopics.length > 0) {
    parts.push(
      `\n\nIMPORTANT: Avoid these topics you recently posted about: ${options.excludedTopics.join(", ")}`,
    );
  }

  parts.push("\n\nRespond with only the post content, nothing else.");

  return parts.join(" ");
}

/**
 * Generate system prompt for comment creation
 */
export function buildCommentSystemPrompt(
  options: ContentPromptOptions,
): string {
  const basePrompt = buildPersonalityPrompt(options.personality);

  const guidelines = [
    basePrompt,
    "",
    "## Comment Guidelines:",
    `- Keep the comment under ${options.maxLength || 200} characters`,
    "- Be relevant to the original post",
    "- Add value to the conversation",
    "- Be respectful and constructive",
    `- ${CONTENT_POLICY_INSTRUCTION}`,
    options.emojiUsage && options.emojiUsage !== "none"
      ? getEmojiGuidelines(options.emojiUsage)
      : "",
    options.emojiUsage && options.emojiUsage !== "none"
      ? VIETNAMESE_EMOTICON_GUIDE
      : "",
  ].filter(Boolean);

  return guidelines.join("\n");
}

/**
 * Options for building comment user prompt with enriched context (AC-058)
 */
export interface CommentUserPromptOptions {
  postContent: string;
  postAuthor?: string;
  authorBio?: string;
  hashtags?: string[];
  hasImages?: boolean;
  imageCount?: number;
  commentType?: "supportive" | "curious" | "insightful" | "humorous";
}

/**
 * Generate user prompt for comment creation with enriched context (AC-058)
 * Provides AI with more context about the post for better, more relevant comments
 */
export function buildCommentUserPrompt(
  options: CommentUserPromptOptions,
): string {
  const parts = [
    "Write a comment on this post:",
    "",
    `"${options.postContent}"`,
    "",
  ];

  // Add author context (AC-058)
  if (options.postAuthor) {
    parts.push(`Posted by: ${options.postAuthor}`);
  }

  // Add author bio for better context understanding (AC-058)
  if (options.authorBio) {
    parts.push(`Author bio: ${options.authorBio}`);
  }

  // Add hashtag context (AC-058)
  if (options.hashtags && options.hashtags.length > 0) {
    parts.push(`Hashtags: ${options.hashtags.join(", ")}`);
  }

  // Add image context (AC-058)
  if (options.hasImages) {
    const imageText =
      options.imageCount && options.imageCount > 1
        ? `This post includes ${options.imageCount} images.`
        : "This post includes an image.";
    parts.push(imageText);
    parts.push(
      "Consider acknowledging the visual content in your comment if relevant.",
    );
  }

  if (options.commentType) {
    const typeInstructions = {
      supportive: "Be supportive and encouraging.",
      curious: "Ask a thoughtful question or express curiosity.",
      insightful: "Add an insightful observation or perspective.",
      humorous: "Add a light, appropriate touch of humor.",
    };
    parts.push(`\nTone: ${typeInstructions[options.commentType]}`);
  }

  parts.push("\nRespond with only the comment content, nothing else.");

  return parts.join("\n");
}

/**
 * Generate system prompt for reply creation
 */
export function buildReplySystemPrompt(options: ContentPromptOptions): string {
  const basePrompt = buildPersonalityPrompt(options.personality);

  const guidelines = [
    basePrompt,
    "",
    "## Reply Guidelines:",
    `- Keep the reply under ${options.maxLength || 150} characters`,
    "- Directly address the comment you are replying to",
    "- Be conversational and engaging",
    "- Stay on topic",
    `- ${CONTENT_POLICY_INSTRUCTION}`,
    options.emojiUsage && options.emojiUsage !== "none"
      ? getEmojiGuidelines(options.emojiUsage)
      : "",
    options.emojiUsage && options.emojiUsage !== "none"
      ? VIETNAMESE_EMOTICON_GUIDE
      : "",
  ].filter(Boolean);

  return guidelines.join("\n");
}

/**
 * Generate user prompt for reply creation
 */
export function buildReplyUserPrompt(options: {
  originalPost: string;
  commentContent: string;
  commentAuthor?: string;
}): string {
  return [
    "Original post:",
    `"${options.originalPost}"`,
    "",
    "Comment to reply to:",
    `"${options.commentContent}"`,
    options.commentAuthor ? `By: ${options.commentAuthor}` : "",
    "",
    "Write a reply to this comment.",
    "Respond with only the reply content, nothing else.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Determine reaction type based on content sentiment
 */
export function buildReactionPrompt(postContent: string): string {
  return [
    "Analyze the following social media post and determine the most appropriate reaction.",
    "",
    `Post: "${postContent}"`,
    "",
    "Choose ONE reaction from: LIKE, LOVE, HAHA, WOW, SAD, ANGRY",
    "",
    "Consider:",
    "- LIKE: General appreciation or agreement",
    "- LOVE: Strong positive emotion, heartwarming content",
    "- HAHA: Funny or humorous content",
    "- WOW: Surprising or impressive content",
    "- SAD: Sad or unfortunate news",
    "- ANGRY: Frustrating or outrageous content",
    "",
    'Respond with only the reaction type (e.g., "LIKE"), nothing else.',
  ].join("\n");
}

/**
 * Topics for random post generation (AC-077: 25+ diverse topics)
 */
export const POST_TOPICS = [
  // Original 10 topics
  "a recent learning or insight",
  "something you are grateful for today",
  "a tip or advice for others",
  "an interesting observation",
  "a question to spark discussion",
  "a motivational thought",
  "something exciting happening in your field",
  "a recommendation (book, tool, place, etc.)",
  "a reflection on a recent experience",
  "a fun fact or trivia",
  // 15+ new diverse topics (AC-077)
  "a challenge you overcame recently",
  "something that made you smile today",
  "a skill you are currently learning",
  "an unpopular opinion you hold",
  "a memory that shaped who you are",
  "something you wish you knew earlier",
  "a goal you are working towards",
  "a mistake that taught you something valuable",
  "something you are curious about",
  "a habit that improved your life",
  "a conversation that changed your perspective",
  "something you created or built recently",
  "a place you would love to visit",
  "a person who inspires you",
  "something you are proud of",
  "a book or article that influenced your thinking",
  "a small win you celebrated recently",
  "something you changed your mind about",
  "a lesson from a failure or setback",
  "an idea you have been exploring lately",
];

/**
 * Get a random topic for post generation
 */
export function getRandomTopic(): string {
  return POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)];
}

/**
 * Get a random topic excluding recently used topics (AC-076)
 * If all topics are excluded, returns a random topic from the full list
 * @param excludedTopics - Array of topics to exclude from selection
 * @returns A random topic not in the excluded list
 */
export function getRandomTopicExcluding(excludedTopics: string[] = []): string {
  if (!excludedTopics || excludedTopics.length === 0) {
    return getRandomTopic();
  }

  // Normalize excluded topics for comparison (lowercase, trimmed)
  const normalizedExcluded = new Set(
    excludedTopics.map((t) => t.toLowerCase().trim()),
  );

  // Filter available topics
  const availableTopics = POST_TOPICS.filter(
    (topic) => !normalizedExcluded.has(topic.toLowerCase().trim()),
  );

  // If all topics are excluded, fall back to full list
  if (availableTopics.length === 0) {
    return getRandomTopic();
  }

  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

/**
 * Options for building share caption prompt (AC-059)
 */
export interface ShareCaptionPromptOptions {
  postContent: string;
  postAuthor?: string;
  authorBio?: string;
  hashtags?: string[];
}

/**
 * Generate system prompt for share caption creation (AC-059)
 */
export function buildShareSystemPrompt(options: ContentPromptOptions): string {
  const basePrompt = buildPersonalityPrompt(options.personality);

  const guidelines = [
    basePrompt,
    "",
    "## Share Caption Guidelines:",
    `- Keep the caption under ${options.maxLength || 150} characters`,
    "- Add your personal perspective or reaction to the shared content",
    "- Be genuine and add value - explain why you are sharing",
    "- You can agree, disagree, add context, or ask a question",
    `- ${CONTENT_POLICY_INSTRUCTION}`,
    options.emojiUsage && options.emojiUsage !== "none"
      ? getEmojiGuidelines(options.emojiUsage)
      : "",
    options.emojiUsage && options.emojiUsage !== "none"
      ? VIETNAMESE_EMOTICON_GUIDE
      : "",
  ].filter(Boolean);

  return guidelines.join("\n");
}

/**
 * Generate user prompt for share caption creation (AC-059)
 */
export function buildShareUserPrompt(
  options: ShareCaptionPromptOptions,
): string {
  const parts = [
    "You are sharing this post to your profile. Write a short caption:",
    "",
    `Original post: "${options.postContent}"`,
    "",
  ];

  if (options.postAuthor) {
    parts.push(`Posted by: ${options.postAuthor}`);
  }

  if (options.authorBio) {
    parts.push(`Author bio: ${options.authorBio}`);
  }

  if (options.hashtags && options.hashtags.length > 0) {
    parts.push(`Hashtags: ${options.hashtags.join(", ")}`);
  }

  parts.push("");
  parts.push(
    "Write a brief, personal caption explaining why you are sharing this.",
  );
  parts.push("Respond with only the caption content, nothing else.");

  return parts.join("\n");
}
