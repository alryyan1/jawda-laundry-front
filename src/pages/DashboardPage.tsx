// src/pages/DashboardPage.tsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Loader,
  ShoppingBag,
  Search,
  ChevronDown,
} from "lucide-react";

import {
  fetchDashboardSummary,
  fetchTodaysDeliveries,
} from "@/api/dashboardService";
import type { TodaysDeliveryOrder } from "@/api/dashboardService";
import type { DashboardSummary } from "@/types";
import { cn } from "@/lib/utils";
import { TodaysDeliveryCard } from "./dashboard/components/TodaysDeliveryCard";
import { OverviewDonutChart } from "./dashboard/components/OverviewDonutChart";
import { OrderDetailsDialog } from "./dashboard/components/OrderDetailsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Styling constants matching the image
const STAT_CARDS = [
  {
    key: "pendingOrders",
    titleKey: "PENDING ORDERS",
    icon: ShoppingBag,
    colorClass: "bg-slate-500",
    iconBgClass: "bg-slate-500",
    borderClass: "border-l-0",
  },
  {
    key: "processingOrders",
    titleKey: "PROCESSING ORDER",
    icon: Loader,
    colorClass: "bg-orange-400",
    iconBgClass: "bg-orange-400",
    borderClass: "border-l-0",
  },
  {
    key: "readyForPickupOrders",
    titleKey: "READY TO DELIVER",
    icon: CheckCircle,
    colorClass: "bg-emerald-500",
    iconBgClass: "bg-emerald-500",
    borderClass: "border-l-0",
  },
  {
    key: "deliveredOrders",
    titleKey: "DELIVERED ORDERS",
    icon: CheckCircle,
    colorClass: "bg-blue-600",
    iconBgClass: "bg-blue-600",
    borderClass: "border-l-0",
  },
];

const StatCard: React.FC<{
  title: string;
  value?: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
  colorClass: string;
}> = ({ title, value, icon: Icon, isLoading, colorClass }) => (
  <Card className="shadow-sm border-none shadow-slate-200">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className="text-3xl font-bold text-slate-800">
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : value !== undefined ? (
            value
          ) : (
            "-"
          )}
        </div>
      </div>
      <div
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-200",
          colorClass,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  // const { t } = useTranslation(["common", "dashboard", "orders"]); // Removed unused import

  const { data: summary, isLoading: isLoadingSummary } = useQuery<
    DashboardSummary,
    Error
  >({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: todaysDeliveries, isLoading: isLoadingDeliveries } = useQuery<
    TodaysDeliveryOrder[],
    Error
  >({
    queryKey: ["todaysDeliveries"],
    queryFn: fetchTodaysDeliveries,
    staleTime: 5 * 60 * 1000,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailsOpen(true);
  };

  const filteredDeliveries = useMemo(() => {
    if (!todaysDeliveries) return [];
    if (!searchTerm) return todaysDeliveries;
    const lowerTerm = searchTerm.toLowerCase();
    return todaysDeliveries.filter(
      (d) =>
        d.customer_name.toLowerCase().includes(lowerTerm) ||
        d.order_number.toLowerCase().includes(lowerTerm),
    );
  }, [todaysDeliveries, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px] space-y-6 bg-slate-50 min-h-screen">
      {/* --- Stats Cards Grid --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((cardConfig) => (
          <StatCard
            key={cardConfig.key}
            title={cardConfig.titleKey}
            value={summary?.[cardConfig.key as keyof DashboardSummary]}
            icon={cardConfig.icon}
            isLoading={isLoadingSummary}
            colorClass={cardConfig.iconBgClass}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Today's Delivery Grid (Takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-700">
                Today's Delivery
              </h2>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search Here..."
                    className="pl-9 h-10 bg-slate-50 border-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-3 text-slate-600 border-slate-200 bg-white"
                >
                  All Orders <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </div>
            </div>

            {isLoadingDeliveries ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDeliveries.map((order) => (
                  <TodaysDeliveryCard
                    key={order.id}
                    order={order}
                    onClick={() => handleOrderClick(order.id)}
                  />
                ))}
                {filteredDeliveries.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No deliveries found for today.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Overview Chart (Takes 1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
            <OverviewDonutChart summary={summary} />
          </div>
        </div>
      </div>

      <OrderDetailsDialog
        orderId={selectedOrderId}
        isOpen={isOrderDetailsOpen}
        onOpenChange={setIsOrderDetailsOpen}
      />
    </div>
  );
};

export default DashboardPage;
