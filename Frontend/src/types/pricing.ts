export enum QuoteStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  QUOTED = 'QUOTED',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// Wizard types
export type WizardStep = 1 | 2 | 3 | 4;

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  serviceCount: number;
  serviceSlugs: string[];
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  pricingTiers?: PricingTier[];
}

export interface PricingTier {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  price: string; // Decimal as string from API
  priceNote: string | null;
  currency: string;
  billingType: string;
  features: string[]; // Parsed JSON array
  isPopular: boolean;
  isRecommended: boolean;
  displayOrder: number;
  ctaText: string;
  ctaLink: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  service?: Service;
}

export interface PricingFAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceId: string | null;
  tierId: string | null;
  budget: string | null;
  timeline: string | null;
  requirements: string | null;
  source: string | null;
  status: QuoteStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Input types for mutations
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface ServiceCategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { services: number };
}

/**
 * Public category type returned by GET /api/pricing/public/categories
 */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
  _count: { services: number };
}

export interface CreateServiceInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  displayOrder?: number;
  categoryId?: string;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

export interface CreateTierInput {
  serviceId: string;
  name: string;
  description?: string;
  price: number;
  priceNote?: string;
  currency?: string;
  billingType?: string;
  features: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  displayOrder?: number;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
}

export interface UpdateTierInput extends Partial<Omit<CreateTierInput, 'serviceId'>> {}

export interface CreateFaqInput {
  question: string;
  answer: string;
  category?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateFaqInput extends Partial<CreateFaqInput> {}

export interface CreateQuoteInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceId?: string;
  tierId?: string;
  budget?: string;
  timeline?: string;
  requirements?: string;
  source?: string;
}

export interface UpdateQuoteStatusInput {
  status: QuoteStatus;
  notes?: string;
}

// Response types
export interface PublicPricingResponse {
  services: Array<Service & { pricingTiers: PricingTier[] }>;
}

export interface PublicFaqsResponse {
  faqs: PricingFAQ[];
}

