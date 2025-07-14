// src/features/orders/components/PdfDialog.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { printPosPdfReceipt } from '@/lib/printUtils';

interface PdfDialogProps {
    orderId: number | string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PdfDialog: React.FC<PdfDialogProps> = ({ orderId, isOpen, onOpenChange }) => {
    const { t } = useTranslation(['orders', 'common']);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    const pdfUrl = `${baseUrl}/orders/${orderId}/pos-invoice-pdf`;

    const handlePrint = () => {
        printPosPdfReceipt(orderId);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `receipt-${orderId}.pdf`;
        link.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{t('paymentReceipt', { defaultValue: 'Payment Receipt' })}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 min-h-0">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={t('paymentReceipt', { defaultValue: 'Payment Receipt' })}
                    />
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('download', { ns: 'common' })}
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        {t('print', { ns: 'common' })}
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('close', { ns: 'common' })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 