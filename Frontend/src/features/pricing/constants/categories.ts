export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  serviceCount: number;
  serviceSlugs: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'website-domain',
    name: 'Website & Tên Miền',
    description: 'Thiết kế website, tên miền, hosting và SSL',
    icon: 'Globe',
    serviceCount: 5,
    serviceSlugs: [
      'ten-mien',
      'hosting-server',
      'chung-chi-ssl',
      'thiet-ke-website',
      'tinh-nang-bo-sung',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Trực Tuyến',
    description: 'SEO, quảng cáo, content marketing và email',
    icon: 'Megaphone',
    serviceCount: 7,
    serviceSlugs: [
      'seo',
      'backlink-link-building',
      'viet-bai-content-marketing',
      'quang-cao-google-ads',
      'quang-cao-facebook-ads',
      'email-marketing',
      'quan-ly-fanpage-mang-xa-hoi',
    ],
  },
  {
    id: 'mobile-app',
    name: 'Ứng Dụng Di Động',
    description: 'App Android, iOS và Zalo Mini App',
    icon: 'Smartphone',
    serviceCount: 2,
    serviceSlugs: ['zalo-mini-app', 'ung-dung-mobile'],
  },
  {
    id: 'software-system',
    name: 'Phần Mềm & Hệ Thống',
    description: 'Web app, desktop app, CRM/ERP, API và DevOps',
    icon: 'Code',
    serviceCount: 7,
    serviceSlugs: [
      'ung-dung-desktop',
      'phat-trien-web-application-saas',
      'api-tich-hop-he-thong',
      'devops-ha-tang-cloud',
      'kiem-thu-dam-bao-chat-luong-qa',
      'phan-mem-crm-erp-hrm',
      'tu-van-thue-lap-trinh-vien',
    ],
  },
  {
    id: 'design-creative',
    name: 'Thiết Kế & Sáng Tạo',
    description: 'Logo, nhận diện thương hiệu và UI/UX',
    icon: 'Palette',
    serviceCount: 2,
    serviceSlugs: ['thiet-ke-logo-nhan-dien-thuong-hieu', 'thiet-ke-ui-ux'],
  },
  {
    id: 'ai-automation',
    name: 'AI & Tự Động Hóa',
    description: 'Chatbot AI, machine learning, RPA và bảo trì',
    icon: 'Sparkles',
    serviceCount: 4,
    serviceSlugs: [
      'chatbot-ai-bot',
      'ai-machine-learning',
      'tu-dong-hoa-rpa',
      'bao-tri-ho-tro-ky-thuat',
    ],
  },
  {
    id: 'combo-savings',
    name: 'Combo tiết kiệm',
    description: 'Combo tiết kiệm khi mua nhiều dịch vụ cùng lúc - giảm 15-22% so với mua lẻ',
    icon: 'Package',
    serviceCount: 1,
    serviceSlugs: ['combo-tiet-kiem'],
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get category by service slug
 */
export function getCategoryByServiceSlug(slug: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((cat) => cat.serviceSlugs.includes(slug));
}

/**
 * Get all valid service slugs from all categories
 */
export function getAllServiceSlugs(): string[] {
  return SERVICE_CATEGORIES.flatMap((cat) => cat.serviceSlugs);
}

