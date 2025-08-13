import React from 'react';
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from '@/types';

interface OrderStatusBadgeComponentProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadgeComponent: React.FC<OrderStatusBadgeComponentProps> = ({ 
  status, 
  className 
}) => {
  const { t } = useTranslation("orders");
  
  let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  
  if (status === "pending")
    bgColor = "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50";
  if (status === "processing")
    bgColor = "bg-blue-400/20 text-blue-600 dark:text-blue-400 border border-blue-500/50";
      if (status === "delivered")
    bgColor = "bg-green-400/20 text-green-600 dark:text-green-400 border border-green-500/50";
  if (status === "completed")
    bgColor = "bg-slate-400/20 text-slate-600 dark:text-slate-400 border border-slate-500/50";
  if (status === "cancelled")
    bgColor = "bg-red-400/20 text-red-600 dark:text-red-400 border border-red-500/50";

  return (
    <Badge
      className={`capitalize px-2.5 py-1 text-xs font-medium ${bgColor} ${className}`}
    >
      {t(`status_${status}`)}
    </Badge>
  );
}; 