// src/features/orders/components/WhatsAppMessageDialog.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Order } from '@/types';
import { sendOrderWhatsAppMessage } from '@/api/orderService';
import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WhatsAppMessageDialogProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const WhatsAppMessageDialog: React.FC<WhatsAppMessageDialogProps> = ({
  order,
  isOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation(['orders', 'common']);
  const { can } = useAuth();
  const [message, setMessage] = useState('');

  // Default message template
  const defaultMessage = t('orderReceivedMessage', {
    customerName: order.customer?.name || t('customer', { ns: 'common' }),
    orderNumber: order.id,
    defaultValue: `Hello ${order.customer?.name || 'Customer'}, your order #${order.id} has been received and is being processed. We will notify you when it's ready. Thank you for choosing our service!`
  });

  // Initialize message with default template when dialog opens
  React.useEffect(() => {
    if (isOpen && !message) {
      setMessage(defaultMessage);
    }
  }, [isOpen, message, defaultMessage]);

  const sendMessageMutation = useMutation<
    { message: string },
    Error,
    { orderId: string | number; message: string }
  >({
    mutationFn: ({ orderId, message }) => sendOrderWhatsAppMessage(orderId, message),
    onSuccess: () => {
      toast.success(t('whatsappMessageSentSuccess'));
      onOpenChange(false);
      setMessage('');
    },
    onError: (error) => {
      toast.error(error.message || t('whatsappMessageSendFailed'));
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error(t('messageRequired'));
      return;
    }

    sendMessageMutation.mutate({
      orderId: order.id,
      message: message.trim(),
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessage('');
  };

  // Check if user has permission to send WhatsApp messages
  if (!can('order:send-whatsapp')) {
    return null;
  }

  // Check if customer has phone number
  if (!order.customer?.phone) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sendWhatsAppMessage')}</DialogTitle>
            <DialogDescription>
              {t('sendWhatsAppMessageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              {t('customerPhoneMissing')}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('close', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sendWhatsAppMessage')}</DialogTitle>
          <DialogDescription>
            {t('sendWhatsAppMessageDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-message">
              {t('message', { ns: 'common' })}
            </Label>
            <Textarea
              id="whatsapp-message"
              placeholder={t('enterMessage', { ns: 'common' })}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
            <div className="text-xs text-muted-foreground">
              {t('messageLength', { 
                current: message.length, 
                max: 1000,
                ns: 'common' 
              })}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>{t('recipient', { ns: 'common' })}:</strong> {order.customer?.name} ({order.customer?.phone})
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={sendMessageMutation.isPending}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sending', { ns: 'common' })}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('sendMessage', { ns: 'common' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 