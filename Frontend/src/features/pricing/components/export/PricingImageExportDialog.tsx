'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Loader2, Download, ImageIcon, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceSelector } from './ServiceSelector';
import { PricingImageCanvas } from './PricingImageCanvas';
import { generateSlug } from '@/features/pricing/utils';
import type { PublicCategory, Service } from '@/types/pricing';

interface ExportedImage {
  dataUrl: string;
  serviceName: string;
}

interface PricingImageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PublicCategory[];
  services: Service[];
}

type DialogState = 'selecting' | 'generating' | 'ready' | 'error';

export function PricingImageExportDialog({
  open,
  onOpenChange,
  categories,
  services,
}: PricingImageExportDialogProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>('selecting');
  const [images, setImages] = useState<ExportedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentRenderIndex, setCurrentRenderIndex] = useState(-1);
  const [progress, setProgress] = useState('');

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  // The service currently being rendered for capture
  const currentService = currentRenderIndex >= 0 && currentRenderIndex < selectedServices.length
    ? selectedServices[currentRenderIndex]
    : null;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedServiceIds([]);
      setDialogState('selecting');
      setImages([]);
      setError(null);
      setCurrentRenderIndex(-1);
    }
  }, [open]);

  // Sequential capture: when currentRenderIndex changes, wait for render then capture
  useEffect(() => {
    if (currentRenderIndex < 0 || currentRenderIndex >= selectedServices.length) return;
    if (dialogState !== 'generating') return;

    const service = selectedServices[currentRenderIndex];
    setProgress(`Đang tạo ảnh ${currentRenderIndex + 1}/${selectedServices.length}: ${service.name}`);

    const timer = setTimeout(async () => {
      try {
        await document.fonts.ready;

        if (!canvasRef.current) throw new Error('Canvas not found');

        const canvas = await html2canvas(canvasRef.current, {
          backgroundColor: '#F0F9FF',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });

        const dataUrl = canvas.toDataURL('image/png');
        setImages((prev) => [...prev, { dataUrl, serviceName: service.name }]);

        // Move to next service
        const nextIndex = currentRenderIndex + 1;
        if (nextIndex < selectedServices.length) {
          setCurrentRenderIndex(nextIndex);
        } else {
          setDialogState('ready');
          setCurrentRenderIndex(-1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tạo ảnh');
        setDialogState('error');
        setCurrentRenderIndex(-1);
      }
    }, 300); // Wait for React to render the new service

    return () => clearTimeout(timer);
  }, [currentRenderIndex, selectedServices, dialogState]);

  const handleGenerate = useCallback(() => {
    if (selectedServiceIds.length === 0) return;
    setImages([]);
    setError(null);
    setDialogState('generating');
    setCurrentRenderIndex(0);
  }, [selectedServiceIds.length]);

  const handleDownload = useCallback(async () => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Stagger downloads to prevent browser blocking
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const slug = generateSlug(img.serviceName);
      const link = document.createElement('a');
      link.download = `bang-gia-${slug}-${timestamp}.png`;
      link.href = img.dataUrl;
      link.click();

      // Add delay between downloads (except for the last one)
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  }, [images]);

  const handleRetry = useCallback(() => {
    setImages([]);
    setError(null);
    setDialogState('selecting');
    setCurrentRenderIndex(-1);
  }, []);

  const canGenerate = selectedServiceIds.length > 0 && dialogState === 'selecting';

  return (
    <>
      {/* Hidden canvas - renders one service at a time for capture */}
      {currentService && <PricingImageCanvas ref={canvasRef} service={currentService} />}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-sky-950">Xuất ảnh bảng giá</DialogTitle>
            <DialogDescription>
              Chọn các dịch vụ — mỗi dịch vụ sẽ được xuất thành 1 ảnh riêng
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 min-h-0 overflow-hidden py-4">
            {/* Left: Service selector */}
            <div className="overflow-auto border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <ServiceSelector
                categories={categories}
                services={services}
                selectedServiceIds={selectedServiceIds}
                onSelectionChange={setSelectedServiceIds}
              />
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col items-center justify-center border border-slate-200 rounded-lg p-4 bg-slate-50/50 min-h-[300px] overflow-auto">
              {dialogState === 'selecting' && selectedServiceIds.length === 0 && (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chọn dịch vụ để xem trước</p>
                </div>
              )}

              {dialogState === 'selecting' && selectedServiceIds.length > 0 && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-8 h-8 text-sky-500" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    {selectedServiceIds.length} dịch vụ đã chọn
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Sẽ tạo {selectedServiceIds.length} ảnh riêng biệt
                  </p>
                </div>
              )}

              {dialogState === 'generating' && (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">{progress}</p>
                </div>
              )}

              {dialogState === 'ready' && images.length > 0 && (
                <div className="w-full space-y-4">
                  {images.map((img, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-slate-500 mb-1">{img.serviceName}</p>
                      <img
                        src={img.dataUrl}
                        alt={img.serviceName}
                        className="w-full h-auto rounded-lg shadow-md border border-slate-200"
                      />
                    </div>
                  ))}
                  <p className="text-center text-sm text-emerald-600 font-medium">
                    ✓ Đã tạo {images.length} ảnh thành công!
                  </p>
                </div>
              )}

              {dialogState === 'error' && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-8 h-8 text-rose-500" />
                  </div>
                  <p className="text-rose-600 font-medium">Không thể tạo ảnh</p>
                  <p className="text-sm text-slate-400 mt-1">{error || 'Vui lòng thử lại'}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>

            {dialogState === 'error' && (
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </Button>
            )}

            {dialogState === 'ready' ? (
              <Button onClick={handleDownload} className="bg-emerald-500 hover:bg-emerald-600">
                <Download className="w-4 h-4 mr-2" />
                Tải xuống ({images.length} ảnh)
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="bg-sky-500 hover:bg-sky-600"
              >
                {dialogState === 'generating' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Tạo ảnh
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
