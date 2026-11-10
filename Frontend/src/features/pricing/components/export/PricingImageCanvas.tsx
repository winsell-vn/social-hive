'use client';

import { forwardRef } from 'react';
import { formatVNDPrice } from '../../utils';
import type { Service } from '@/types/pricing';

interface PricingImageCanvasProps {
  service: Service;
}

const MAX_FEATURES_SHOWN = 5;

function formatVietnameseDate(): string {
  const now = new Date();
  return `${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
}

function getBillingLabel(billingType: string): string {
  switch (billingType) {
    case 'monthly': return '/ tháng';
    case 'yearly': return '/ năm';
    case 'one-time': return 'một lần';
    default: return '';
  }
}

function getGridCols(count: number): string {
  if (count <= 2) return '1fr';
  if (count <= 4) return '1fr 1fr';
  return '1fr 1fr 1fr';
}

export const PricingImageCanvas = forwardRef<HTMLDivElement, PricingImageCanvasProps>(
  function PricingImageCanvas({ service }, ref) {
    const tiers = service.pricingTiers || [];
    const gridCols = getGridCols(tiers.length);

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1200px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '32px',
            background: 'linear-gradient(to bottom right, #F0F9FF, #E0F2FE)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                height: '6px',
                borderRadius: '9999px',
                marginBottom: '20px',
                marginLeft: 'auto',
                marginRight: 'auto',
                width: '160px',
                background: 'linear-gradient(to right, #0EA5E9, #10B981)',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  chungtoixayweb.vn
                </div>
                <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>
                  Bảng Giá Dịch Vụ
                </div>
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(125,211,252,0.3)',
                  fontSize: '13px',
                  color: '#475569',
                }}
              >
                {formatVietnameseDate()}
              </div>
            </div>
          </div>

          {/* Service name + description */}
          <div
            style={{
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(125,211,252,0.3)',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {service.name}
            </div>
            {service.description && (
              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                {service.description}
              </div>
            )}
          </div>

          {/* Tiers grid */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '20px' }}>
            {tiers.map((tier) => {
              const features = (tier.features || []) as string[];
              const visible = features.slice(0, MAX_FEATURES_SHOWN);
              const remaining = features.length - MAX_FEATURES_SHOWN;

              return (
                <div
                  key={tier.id}
                  style={{
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    border: tier.isRecommended
                      ? '2px solid #10B981'
                      : tier.isPopular
                        ? '2px solid #F59E0B'
                        : '1px solid #e2e8f0',
                    position: 'relative',
                  }}
                >
                  {/* Badge */}
                  {(tier.isPopular || tier.isRecommended) && (
                    <div style={{ position: 'absolute', top: '-10px', right: '12px' }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#fff',
                          borderRadius: '4px',
                          background: tier.isRecommended ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {tier.isRecommended ? 'KHUYÊN DÙNG' : 'PHỔ BIẾN'}
                      </span>
                    </div>
                  )}

                  {/* Tier name */}
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                    {tier.name}
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#0EA5E9' }}>
                      {formatVNDPrice(tier.price)}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>
                      {getBillingLabel(tier.billingType)}
                    </span>
                  </div>

                  {/* Features */}
                  <div>
                    {visible.map((feature, idx) => {
                      const isExcluded = feature.startsWith('!');
                      const text = isExcluded ? feature.slice(1) : feature;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            fontSize: '13px',
                            marginTop: idx === 0 ? 0 : '4px',
                            color: isExcluded ? '#94a3b8' : '#475569',
                            textDecoration: isExcluded ? 'line-through' : 'none',
                          }}
                        >
                          <span style={{ flexShrink: 0, marginTop: '1px' }}>
                            {isExcluded ? '✕' : '✓'}
                          </span>
                          <span>{text}</span>
                        </div>
                      );
                    })}
                    {remaining > 0 && (
                      <div style={{ fontSize: '13px', color: '#0ea5e9', marginTop: '4px', paddingLeft: '22px' }}>
                        +{remaining} tính năng khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px solid rgba(125,211,252,0.3)',
              fontSize: '13px',
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>🌐 chungtoixayweb.vn</span>
              <span>✉ contact@chungtoixayweb.vn</span>
            </div>
            <span style={{ color: '#94a3b8' }}>© {new Date().getFullYear()} chungtoixayweb.vn</span>
          </div>
        </div>
      </div>
    );
  }
);
