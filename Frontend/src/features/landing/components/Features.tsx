'use client';

import { Users, Users2, Shield } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Kết nối bạn bè',
    description: 'Connect with friends',
  },
  {
    icon: Users2,
    title: 'Tham gia nhóm',
    description: 'Join groups based on interests',
  },
  {
    icon: Shield,
    title: 'Bảo mật cao',
    description: 'Advanced security and privacy',
  },
];

export function Features() {
  return (
    <section className="py-20 px-4 bg-[#18191a]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tính năng nổi bật
          </h2>
          <p className="text-lg text-[#a6a6a6]">
            Khám phá những gì làm nên sự khác biệt của chúng tôi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#262627] rounded-lg p-6 border border-[#3a3a3b] hover:border-[#1877F2] transition-colors duration-300"
              >
                <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-[#1877F2]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#a6a6a6] text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
