export type AdPlacement = 'FEED' | 'SIDEBAR' | 'BOTH';

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  ctaText: string;
  ctaLink: string;
  placement: AdPlacement;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdInput {
  title: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink: string;
  placement?: AdPlacement;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateAdInput extends Partial<CreateAdInput> {}

export interface AdFilters {
  placement?: AdPlacement;
  isActive?: boolean;
}

export interface AdClickStats {
  clicks1d: number;
  clicks7d: number;
  clicks30d: number;
}

export type AdsAnalytics = Record<string, AdClickStats>;
