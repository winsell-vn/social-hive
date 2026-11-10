/**
 * Action Parser for Chatbot Page Control
 *
 * Parses action tags from AI response content.
 * Tags format: [ACTION:TYPE:param1=value1,param2=value2]
 * Returns clean content (tags removed) and parsed actions.
 */

export type ChatActionType = 'NAVIGATE' | 'SELECT_SERVICE' | 'SELECT_TIER' | 'SHOW_SERVICE';

export interface ChatAction {
  type: ChatActionType;
  params: Record<string, string>;
}

export interface ParseResult {
  cleanContent: string;
  actions: ChatAction[];
}

/**
 * Parse action tags from AI response content.
 * Tags format: [ACTION:TYPE:param1=value1,param2=value2]
 * Returns clean content (tags removed) and parsed actions.
 *
 * Also handles malformed tags where AI forgets the colon before params:
 * e.g., [ACTION:SHOW_SERVICEslug=ten-mien] -> should be [ACTION:SHOW_SERVICE:slug=ten-mien]
 */
export function parseActions(content: string): ParseResult {
  // Primary regex: correct format [ACTION:TYPE:params]
  const actionRegex = /\[ACTION:([A-Z_]+)(?::([^\]]*))?\]/g;
  // Fallback regex: malformed format [ACTION:TYPEparam=value] (missing colon before params)
  const malformedRegex = /\[ACTION:([A-Z_]+)((?:slug|step|tier)=[^\]]*)\]/g;
  // Matches unclosed action tags during streaming (no closing bracket at end of string)
  const unclosedTagRegex = /\[ACTION:[A-Z_]+(?::?[^\]]*)?$/g;

  const actions: ChatAction[] = [];
  const processedMatches = new Set<string>();

  // First pass: parse correct format
  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    processedMatches.add(fullMatch);

    const type = match[1] as ChatActionType;
    const paramsStr = match[2] || '';
    const params = parseParams(paramsStr);

    actions.push({ type, params });
  }

  // Second pass: parse malformed format (only if not already matched)
  while ((match = malformedRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    if (processedMatches.has(fullMatch)) continue;
    processedMatches.add(fullMatch);

    // Extract the actual type by removing the param key that got concatenated
    // e.g., "SHOW_SERVICEslug" -> "SHOW_SERVICE", params: "slug=..."
    const rawType = match[1]; // e.g., "SHOW_SERVICEslug" or "SHOW_SERVICE"
    const paramsStr = match[2]; // e.g., "slug=ten-mien"

    // Known action types to match against
    const knownTypes: ChatActionType[] = ['NAVIGATE', 'SELECT_SERVICE', 'SELECT_TIER', 'SHOW_SERVICE'];

    // Find the longest matching known type
    let type: ChatActionType | null = null;
    for (const knownType of knownTypes) {
      if (rawType.startsWith(knownType)) {
        if (!type || knownType.length > type.length) {
          type = knownType;
        }
      }
    }

    if (type) {
      // Extract any extra chars that were concatenated (e.g., "slug" from "SHOW_SERVICEslug")
      const extraChars = rawType.slice(type.length);
      const fullParamsStr = extraChars + paramsStr; // e.g., "slug" + "slug=ten-mien" or "" + "slug=ten-mien"

      // If extraChars is a param key prefix, reconstruct properly
      const params = parseParams(fullParamsStr.startsWith('=') ? fullParamsStr.slice(1) : fullParamsStr);

      actions.push({ type, params });
    }
  }

  // Remove all action tags (both correct and malformed) from content for display
  let cleanContent = content
    .replace(actionRegex, '')
    .replace(malformedRegex, '')
    .replace(unclosedTagRegex, '') // Strip unclosed tags during streaming
    .trim();

  // Final cleanup: remove any remaining partial action tag fragments
  cleanContent = cleanContent.replace(/\[ACTION:[^\]]*$/g, '').trim();

  return { cleanContent, actions };
}

/**
 * Parse params string into key-value pairs
 */
function parseParams(paramsStr: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (paramsStr) {
    paramsStr.split(',').forEach((pair) => {
      const [key, ...valueParts] = pair.split('=');
      if (key && valueParts.length > 0) {
        params[key.trim()] = valueParts.join('=').trim();
      }
    });
  }

  return params;
}

