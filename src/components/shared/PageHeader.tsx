// src/components/shared/PageHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    icon?: React.ElementType; // e.g., PlusCircle
    onClick?: () => void;
    to?: string; // For Link behavior with <Button asChild>
    disabled?: boolean;
  };
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children?: React.ReactNode; // For additional actions or filters
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actionButton,
  showRefreshButton,
  onRefresh,
  isRefreshing,
  children,
}) => {
  const { t } = useTranslation('common');
  const ActionIcon = actionButton?.icon;

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {showRefreshButton && onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={t('refresh')}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          )}
          {actionButton && (
            <Button
              onClick={actionButton.onClick}
              asChild={!!actionButton.to}
              disabled={actionButton.disabled || isRefreshing}
            >
              {actionButton.to ? (
                // Assuming react-router-dom Link is used
                // You'd need to import Link from 'react-router-dom' in the parent component
                // and pass it like: <PageHeader actionButton={{ to: '/path', label: 'New', icon: Link }} />
                // This is a bit tricky, simpler to handle Link outside or use onClick with navigate
                // For simplicity, let's assume onClick handles navigation if 'to' is not directly supported by Button's asChild for Link easily
                <>
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />}
                  {actionButton.label}
                </>
              ) : (
                <>
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />}
                  {actionButton.label}
                </>
              )}
            </Button>
          )}
          {children} {/* For extra buttons or filter components */}
        </div>
      </div>
    </div>
  );
};