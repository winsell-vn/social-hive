/**
 * ComparisonTable - Semantic table component for blog comparisons
 * Server Component - renders comparison data with semantic HTML
 * Optimized for accessibility and SEO with proper table structure
 */

interface ComparisonTableProps {
  /** Table caption/title */
  caption: string;
  /** Column headers */
  headers: string[];
  /** Table rows data */
  rows: string[][];
  /** Optional source attribution */
  source?: string;
}

export function ComparisonTable({
  caption,
  headers,
  rows,
  source,
}: ComparisonTableProps) {
  // Don't render if no data
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <caption className="px-4 py-3 text-left font-semibold text-foreground bg-muted/50 border-b border-border">
            {caption}
          </caption>
          <thead>
            <tr className="bg-muted/30">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-foreground border-b border-border"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-muted-foreground border-b border-border last:border-b-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source && (
        <figcaption className="mt-2 text-xs text-muted-foreground text-right">
          Nguồn: {source}
        </figcaption>
      )}
    </figure>
  );
}

export default ComparisonTable;

