import {
  Globe,
  Megaphone,
  Smartphone,
  Code,
  Palette,
  Sparkles,
  Package,
  Rocket,
  TrendingUp,
  GraduationCap,
  Building,
  Crown,
  MessageSquare,
  Wrench,
  Shield,
  Server,
  Database,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

/**
 * Centralized icon mapping for pricing components.
 * Supports both PascalCase (CategoryCard) and lowercase (ServiceTabs, QuoteForm) keys.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // PascalCase keys (used by CategoryCard, admin categories)
  Globe,
  Megaphone,
  Smartphone,
  Code,
  Palette,
  Sparkles,
  Package,
  Rocket,
  TrendingUp,
  GraduationCap,
  Building,
  Crown,
  MessageSquare,
  Wrench,
  Shield,
  Server,
  Database,
  FolderOpen,
  // Lowercase keys (used by ServiceTabs, QuoteForm)
  globe: Globe,
  megaphone: Megaphone,
  smartphone: Smartphone,
  code: Code,
  palette: Palette,
  sparkles: Sparkles,
  package: Package,
  rocket: Rocket,
  'trending-up': TrendingUp,
  'graduation-cap': GraduationCap,
  building: Building,
  crown: Crown,
  'message-square': MessageSquare,
  wrench: Wrench,
  shield: Shield,
  server: Server,
  database: Database,
  'folder-open': FolderOpen,
};

/** Default icon when no match is found */
export const DEFAULT_ICON = Globe;

/**
 * Get icon component by name (case-insensitive lookup with fallback)
 */
export function getIconByName(name: string | null | undefined): LucideIcon {
  if (!name) return DEFAULT_ICON;
  return ICON_MAP[name] || DEFAULT_ICON;
}

