import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Calendar, 
  Download, 
  FileText, 
  Filter,
  Loader2,
  Search,
  Eye
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { getOrdersReport, exportOrdersReportPdf, getOrdersReportPdfViewUrl } from '@/api/reportService';
import type { OrdersReportData } from '@/types/report.types';
import { useCurrency } from '@/hooks/useCurrency';
import PdfPreviewDialog from '@/features/orders/components/PdfDialog';

const OrdersReportPage: React.FC = () => {
  const { t, i18n } = useTranslation(['reports', 'common', 'orders']);
  const { currencyCode } = useCurrency();
  
  // Date range state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // PDF view dialog state
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  // Format dates for API
  const formattedDateFrom = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const formattedDateTo = dateTo ? format(dateTo, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  // Fetch orders report data
  const { data: reportData, isLoading, error, refetch } = useQuery<OrdersReportData>({
    queryKey: ['ordersReport', formattedDateFrom, formattedDateTo],
    queryFn: () => getOrdersReport(formattedDateFrom, formattedDateTo),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter data based on search term
  const filteredData = reportData?.orders?.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle PDF export
  const handleExportPdf = async () => {
    if (!dateFrom || !dateTo) {
      toast.error(t('pleaseSelectDateRange', { defaultValue: 'Please select a date range' }));
      return;
    }

    setIsExporting(true);
    try {
      const response = await exportOrdersReportPdf(formattedDateFrom, formattedDateTo);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-report-${formattedDateFrom}-to-${formattedDateTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('reportExportedSuccessfully', { defaultValue: 'Report exported successfully' }));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportFailed', { defaultValue: 'Failed to export report' }));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle PDF view
  const handleViewPdf = () => {
    if (!dateFrom || !dateTo) {
      toast.error(t('pleaseSelectDateRange', { defaultValue: 'Please select a date range' }));
      return;
    }

    const viewUrl = getOrdersReportPdfViewUrl(formattedDateFrom, formattedDateTo);
    setPdfViewUrl(viewUrl);
    setIsPdfDialogOpen(true);
  };

  // Calculate totals
  const totalOrders = filteredData.length;
  const totalAmount = filteredData.reduce((sum, order) => sum + (order.paid_amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive mb-4">
          {t('errorLoadingReport', { defaultValue: 'Error loading report' })}
        </div>
        <Button onClick={() => refetch()}>
          {t('retry', { defaultValue: 'Retry' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('ordersReportTitle', { defaultValue: 'Orders Report' })}
        description={t('ordersReportDescription', { defaultValue: 'Detailed view of all orders with payment information' })}
      />

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters', { defaultValue: 'Filters' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label>{t('dateFrom', { defaultValue: 'From Date' })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>{t('pickDate', { defaultValue: 'Pick a date' })}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>{t('dateTo', { defaultValue: 'To Date' })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>{t('pickDate', { defaultValue: 'Pick a date' })}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>{t('search', { defaultValue: 'Search' })}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchOrders', { defaultValue: 'Search orders...' })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* PDF Actions */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="space-y-2">
                <Button 
                  onClick={handleViewPdf} 
                  disabled={!dateFrom || !dateTo}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t('viewPdf', { defaultValue: 'View PDF' })}
                </Button>
                <Button 
                  onClick={handleExportPdf} 
                  disabled={isExporting || !dateFrom || !dateTo}
                  className="w-full"
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {t('exportPdf', { defaultValue: 'Export PDF' })}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalOrders', { defaultValue: 'Total Orders' })}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalAmount', { defaultValue: 'Total Amount' })}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount, currencyCode, i18n.language, 3)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('averageOrderValue', { defaultValue: 'Average Order Value' })}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue, currencyCode, i18n.language, 3)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('ordersList', { defaultValue: 'Orders List' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orderNumber', { defaultValue: 'Order #' })}</TableHead>
                    <TableHead>{t('orderTime', { defaultValue: 'Order Time' })}</TableHead>
                    <TableHead>{t('amountPaid', { defaultValue: 'Amount Paid' })}</TableHead>
                    <TableHead>{t('user', { defaultValue: 'User' })}</TableHead>
                    <TableHead>{t('orderDetails', { defaultValue: 'Order Details' })}</TableHead>
                    <TableHead>{t('status', { defaultValue: 'Status' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('noOrdersFound', { defaultValue: 'No orders found for the selected date range' })}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.daily_order_number}
                        </TableCell>
                        <TableCell>
                          {order.order_date ? format(new Date(order.order_date), 'MMM dd, yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(order.paid_amount || 0, currencyCode, i18n.language, 3)}
                        </TableCell>
                        <TableCell>
                          {order.user?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {order.items?.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.serviceOffering?.display_name || item.serviceOffering?.name} 
                                <span className="text-muted-foreground"> x{item.quantity}</span>
                                {item.length_meters && item.width_meters && (
                                  <span className="text-muted-foreground">
                                    {' '}({item.length_meters}m x {item.width_meters}m)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {t(`status_${order.status}`, { defaultValue: order.status })}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <PdfPreviewDialog
        isOpen={isPdfDialogOpen}
        onOpenChange={setIsPdfDialogOpen}
        pdfUrl={pdfViewUrl}
        title={t('ordersReportPdf', { defaultValue: 'Orders Report PDF' })}
        fileName={`orders-report-${formattedDateFrom}-to-${formattedDateTo}.pdf`}
      />
    </div>
  );
};

export default OrdersReportPage; 