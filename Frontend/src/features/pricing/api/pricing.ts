import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type {
  PublicPricingResponse,
  PublicFaqsResponse,
  CreateQuoteInput,
  PublicCategory,
} from '@/types/pricing';

export const pricingKeys = {
  all: ['pricing'] as const,
  public: () => [...pricingKeys.all, 'public'] as const,
  publicCategories: () => [...pricingKeys.all, 'public', 'categories'] as const,
  faqs: () => [...pricingKeys.all, 'faqs'] as const,
};

/**
 * Fetch public pricing data (services with tiers)
 *
 * Backend returns: { success, data: { data: [...services] }, timestamp }
 * Axios unwraps HTTP body, so response.data = { success, data: { data: [...] }, timestamp }
 * We need to handle triple-nesting: response.data.data.data
 */
export function usePublicPricing() {
  return useQuery({
    queryKey: pricingKeys.public(),
    queryFn: async () => {
      const response = await apiClient.get('/pricing/public');
      // Handle triple-nesting: response.data.data may be { data: [...] } or [...] directly
      const rawData = response.data?.data?.data || response.data?.data;
      const services = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      return { services } as PublicPricingResponse;
    },
    staleTime: 60 * 1000, // 1 minute - reduced from 5 minutes for fresher data
  });
}

/**
 * Fetch public FAQs
 *
 * Backend returns: { success, data: { data: [...faqs] }, timestamp }
 * Same triple-nesting pattern as usePublicPricing
 */
export function usePublicFaqs() {
  return useQuery({
    queryKey: pricingKeys.faqs(),
    queryFn: async () => {
      const response = await apiClient.get('/pricing/public/faqs');
      // Handle triple-nesting: response.data.data may be { data: [...] } or [...] directly
      const rawData = response.data?.data?.data || response.data?.data;
      const faqs = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      return { faqs } as PublicFaqsResponse;
    },
    staleTime: 60 * 1000, // 1 minute - reduced from 5 minutes for fresher data
  });
}

/**
 * Fetch public categories for the pricing wizard
 *
 * Backend returns: { success, data: [...categories], timestamp }
 */
export function usePublicCategories() {
  return useQuery({
    queryKey: pricingKeys.publicCategories(),
    queryFn: async () => {
      const response = await apiClient.get('/pricing/public/categories');
      // Handle nesting: response.data.data may be [...] or { data: [...] }
      const rawData = response.data?.data?.data || response.data?.data;
      const categories = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
      return categories as PublicCategory[];
    },
    staleTime: 60 * 1000, // 1 minute - reduced from 5 minutes for fresher data
  });
}

/**
 * Submit a quote request
 */
export function useSubmitQuote() {
  return useMutation({
    mutationFn: async (data: CreateQuoteInput) => {
      const response = await apiClient.post('/pricing/quotes/submit', data);
      return response.data.data;
    },
  });
}

