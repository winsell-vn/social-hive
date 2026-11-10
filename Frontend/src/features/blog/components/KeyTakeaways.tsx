/**
 * KeyTakeaways - Semantic component for blog post key points
 * Server Component - renders bulleted summary with semantic HTML
 * Optimized for AI extraction (GEO) - structured summaries help AI search engines cite content
 */

interface KeyTakeawaysProps {
  /** Array of key points/takeaways */
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  // Don't render if no takeaways
  if (!takeaways || takeaways.length === 0) {
    return null;
  }

  return (
    <aside
      role="note"
      aria-label="Điểm chính"
      className="bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg p-4 mb-8"
    >
      <h2 className="flex items-center gap-2 font-semibold text-foreground mb-3">
        <span aria-hidden="true">📌</span>
        Điểm chính trong bài viết
      </h2>
      <ul className="space-y-2">
        {takeaways.map((takeaway, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-muted-foreground"
          >
            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default KeyTakeaways;

