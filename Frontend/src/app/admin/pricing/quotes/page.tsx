'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, Trash2, Loader2, Mail, Phone, Building2, Calendar, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  useQuotes,
  useUpdateQuoteStatus,
  useDeleteQuote,
  useServices,
  useTiers,
  getQuoteStatusLabel,
  getQuoteStatusColor,
  exportQuotesCSV,
} from '@/features/pricing';
import { QuoteStatus } from '@/types/pricing';
import type { QuoteRequest } from '@/types/pricing';

const statusOptions = Object.values(QuoteStatus);

export default function AdminPricingQuotesPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewingQuote, setViewingQuote] = useState<QuoteRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<{ id: string; status: QuoteStatus } | null>(null);
  const [notes, setNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: quotesData, isLoading } = useQuotes({
    status: filterStatus === 'all' ? undefined : filterStatus,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const quotes = quotesData?.data;
  const { data: services } = useServices();
  const { data: tiers } = useTiers();
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    setUpdatingStatus({ id: quoteId, status: newStatus });
    setNotes('');
  };

  const confirmStatusChange = async () => {
    if (!updatingStatus) return;
    try {
      await updateStatus.mutateAsync({
        id: updatingStatus.id,
        data: { status: updatingStatus.status, notes: notes || undefined },
      });
      toast.success('Đã cập nhật trạng thái');
      setUpdatingStatus(null);
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuote.mutateAsync(deleteId);
      toast.success('Đã xóa yêu cầu báo giá');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportQuotesCSV({
        status: filterStatus === 'all' ? undefined : filterStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success('Đã xuất file CSV');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi xuất CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return '-';
    return services?.find(s => s.id === serviceId)?.name || '-';
  };

  const getTierName = (tierId: string | null) => {
    if (!tierId) return '-';
    return tiers?.find(t => t.id === tierId)?.name || '-';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Yêu cầu báo giá</h1>
          <p className="text-gray-500">Quản lý các yêu cầu báo giá từ khách hàng</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {getQuoteStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Label htmlFor="startDate" className="text-sm text-gray-500 whitespace-nowrap">Từ ngày:</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="endDate" className="text-sm text-gray-500 whitespace-nowrap">Đến ngày:</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Xuất CSV
        </Button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dịch vụ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotes?.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{quote.name}</div>
                  {quote.company && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {quote.company}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {quote.email}
                  </div>
                  {quote.phone && (
                    <div className="text-sm flex items-center gap-1 text-gray-500">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {quote.phone}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{getServiceName(quote.serviceId)}</td>
                <td className="px-4 py-3">
                  <Select
                    value={quote.status}
                    onValueChange={(value) => handleStatusChange(quote.id, value as QuoteStatus)}
                  >
                    <SelectTrigger className="w-36 h-8">
                      <Badge className={getQuoteStatusColor(quote.status)}>
                        {getQuoteStatusLabel(quote.status)}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge className={getQuoteStatusColor(status)}>
                            {getQuoteStatusLabel(status)}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(quote.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setViewingQuote(quote)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(quote.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!quotes || quotes.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Chưa có yêu cầu báo giá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewingQuote} onOpenChange={() => setViewingQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu báo giá</DialogTitle>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Họ tên</Label>
                  <p className="font-medium">{viewingQuote.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Công ty</Label>
                  <p className="font-medium">{viewingQuote.company || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="font-medium">{viewingQuote.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Điện thoại</Label>
                  <p className="font-medium">{viewingQuote.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Dịch vụ quan tâm</Label>
                  <p className="font-medium">{getServiceName(viewingQuote.serviceId)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Gói dịch vụ</Label>
                  <p className="font-medium">{getTierName(viewingQuote.tierId)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Ngân sách</Label>
                  <p className="font-medium">{viewingQuote.budget || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Timeline</Label>
                  <p className="font-medium">{viewingQuote.timeline || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Nguồn</Label>
                  <p className="font-medium">{viewingQuote.source || '-'}</p>
                </div>
              </div>
              {viewingQuote.requirements && (
                <div>
                  <Label className="text-gray-500 text-xs">Yêu cầu chi tiết</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                    {viewingQuote.requirements}
                  </div>
                </div>
              )}
              {viewingQuote.notes && (
                <div>
                  <Label className="text-gray-500 text-xs">Ghi chú nội bộ</Label>
                  <div className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                    <FileText className="w-4 h-4 inline mr-2 text-yellow-600" />
                    {viewingQuote.notes}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Tạo lúc: {formatDate(viewingQuote.createdAt)}
                </div>
                <Badge className={getQuoteStatusColor(viewingQuote.status)}>
                  {getQuoteStatusLabel(viewingQuote.status)}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <Dialog open={!!updatingStatus} onOpenChange={() => setUpdatingStatus(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Bạn đang thay đổi trạng thái thành:{' '}
              <Badge className={getQuoteStatusColor(updatingStatus?.status || '')}>
                {getQuoteStatusLabel(updatingStatus?.status || '')}
              </Badge>
            </p>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú về việc thay đổi trạng thái..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpdatingStatus(null)}>Hủy</Button>
              <Button onClick={confirmStatusChange} disabled={updateStatus.isPending}>
                {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa yêu cầu báo giá này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteQuote.isPending}
            >
              {deleteQuote.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

