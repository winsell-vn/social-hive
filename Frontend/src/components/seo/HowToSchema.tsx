/**
 * HowToSchema - JSON-LD HowTo structured data for SEO
 * Server Component - renders HowTo schema for tutorial posts
 * Optimized for Google rich results and AI search engines
 */

export interface HowToStep {
  /** Step name/title */
  name: string;
  /** Step description/instructions */
  text: string;
  /** Optional URL to step anchor */
  url?: string;
  /** Optional step image URL */
  image?: string;
}

export interface HowToSchemaProps {
  /** Tutorial title */
  name: string;
  /** Tutorial description */
  description: string;
  /** Total time in ISO 8601 duration format (e.g., "PT30M") */
  totalTime?: string;
  /** Estimated cost */
  estimatedCost?: {
    currency: string;
    value: string;
  };
  /** Tools needed (e.g., ["VS Code", "Node.js"]) */
  tools?: string[];
  /** Supplies needed (e.g., ["Tailwind CSS v4"]) */
  supplies?: string[];
  /** Array of steps */
  steps: HowToStep[];
}

export function HowToSchema({
  name,
  description,
  totalTime,
  estimatedCost,
  tools,
  supplies,
  steps,
}: HowToSchemaProps) {
  // Don't render if no steps
  if (!steps || steps.length === 0) {
    return null;
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
  };

  // Add optional totalTime
  if (totalTime) {
    schema.totalTime = totalTime;
  }

  // Add optional estimatedCost
  if (estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: estimatedCost.currency,
      value: estimatedCost.value,
    };
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    schema.tool = tools.map((tool) => ({
      '@type': 'HowToTool',
      name: tool,
    }));
  }

  // Add supplies if provided
  if (supplies && supplies.length > 0) {
    schema.supply = supplies.map((supply) => ({
      '@type': 'HowToSupply',
      name: supply,
    }));
  }

  // Add steps
  schema.step = steps.map((step, index) => {
    const stepSchema: Record<string, unknown> = {
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    };

    if (step.url) {
      stepSchema.url = step.url;
    }

    if (step.image) {
      stepSchema.image = step.image;
    }

    return stepSchema;
  });

  return (
    <script
      key="howto-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default HowToSchema;

