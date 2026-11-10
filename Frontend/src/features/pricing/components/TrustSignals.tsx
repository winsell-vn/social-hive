'use client';

import { Card } from '@/components/ui/card';
import { Shield, Clock, HeadphonesIcon, Award, RefreshCw, Zap } from 'lucide-react';

const guarantees = [
  {
    icon: Shield,
    title: 'Bảo hành trọn đời',
    description: 'Hỗ trợ kỹ thuật và bảo trì miễn phí trong suốt thời gian sử dụng',
  },
  {
    icon: Clock,
    title: 'Đúng tiến độ',
    description: 'Cam kết bàn giao đúng thời hạn hoặc hoàn tiền 100%',
  },
  {
    icon: HeadphonesIcon,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ bạn mọi lúc',
  },
  {
    icon: Award,
    title: 'Chất lượng cao',
    description: 'Sản phẩm được kiểm tra kỹ lưỡng trước khi bàn giao',
  },
  {
    icon: RefreshCw,
    title: 'Sửa đổi miễn phí',
    description: 'Không giới hạn số lần chỉnh sửa trong quá trình phát triển',
  },
  {
    icon: Zap,
    title: 'Tối ưu hiệu suất',
    description: 'Website được tối ưu tốc độ và SEO ngay từ đầu',
  },
];

export function TrustSignals() {
  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Chúng tôi cam kết mang đến dịch vụ tốt nhất với những đảm bảo rõ ràng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guarantees.map((item, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                  <item.icon className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

