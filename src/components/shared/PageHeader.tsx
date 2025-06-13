// src/components/shared/PageHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // <--- ADD THIS IMPORT
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    icon?: React.ElementType;
    onClick?: () => void;
    to?: string; // For Link behavior
    disabled?: boolean;
  };
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children?: React.ReactNode;
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
          {actionButton && ( // This logic should now work
            actionButton.to ? (
                <Button asChild disabled={actionButton.disabled || isRefreshing}>
                    <Link to={actionButton.to}>
                        {ActionIcon && <ActionIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />}
                        {actionButton.label}
                    </Link>
                </Button>
            ) : (
                <Button onClick={actionButton.onClick} disabled={actionButton.disabled || isRefreshing}>
                    {ActionIcon && <ActionIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />}
                    {actionButton.label}
                </Button>
            )
          )}
          {children}
        </div>
      </div>
    </div>
  );
};