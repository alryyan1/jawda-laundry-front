// src/components/shared/DeleteConfirmDialog.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button'; // If trigger is a button
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string; // Name of the item being deleted for the message
  itemType?: string; // e.g., "customer", "order" - for translation
  isPending?: boolean; // To show loading state on confirm button
  title?: string;
  description?: string | React.ReactNode;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = "item", // Default item type for translation
  isPending,
  title,
  description,
}) => {
  const { t } = useTranslation('common');

  const dialogTitle = title || t('deleteConfirmationTitle', { item: t(itemType, {defaultValue: itemType}) });
  const dialogDescription = description || (
    <>
      {t('deleteConfirmationMessage', { itemName: itemName || t('thisItem', {defaultValue: 'this item'}) })}
      <br />
      {t('irreversibleAction')}
    </>
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};