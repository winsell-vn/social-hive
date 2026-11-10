'use client';

import DOMPurify from 'dompurify';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { PricingFAQ as FAQType } from '@/types/pricing';

interface PricingFAQProps {
  faqs: FAQType[];
}

export function PricingFAQ({ faqs }: PricingFAQProps) {
  if (!faqs || faqs.length === 0) return null;

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Câu hỏi chung';
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQType[]>);

  const categories = Object.keys(groupedFaqs);

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Câu hỏi thường gặp
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Giải đáp những thắc mắc phổ biến về dịch vụ của chúng tôi
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              {categories.length > 1 && (
                <h3 className="text-lg font-semibold mb-4 text-rose-500">
                  {category}
                </h3>
              )}
              <Accordion type="single" collapsible className="space-y-2">
                {groupedFaqs[category].map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400 pb-4">
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

