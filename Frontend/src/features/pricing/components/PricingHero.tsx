'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Star, Zap } from 'lucide-react';

const stats = [
  { icon: Users, value: '500+', label: 'Khách hàng tin tưởng' },
  { icon: CheckCircle, value: '1000+', label: 'Dự án hoàn thành' },
  { icon: Star, value: '4.9/5', label: 'Đánh giá trung bình' },
  { icon: Zap, value: '24h', label: 'Phản hồi nhanh chóng' },
];

export function PricingHero() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative max-w-6xl mx-auto text-center">
        <Badge variant="secondary" className="mb-4 bg-rose-500/10 text-rose-400 border-rose-500/20">
          Bảng giá minh bạch
        </Badge>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Giải pháp số cho doanh nghiệp của bạn
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12">
          Chúng tôi cung cấp dịch vụ thiết kế website, Zalo Mini App, Mobile App 
          với giá cả cạnh tranh và chất lượng hàng đầu Việt Nam.
        </p>
        
        {/* Trust signals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <stat.icon className="w-8 h-8 text-rose-400 mb-2" />
              <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

