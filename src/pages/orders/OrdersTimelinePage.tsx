import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Calendar as CalendarIcon,
  Package,
  User,
  ShoppingBag,
  Info,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

import { getOrders } from "@/api/orderService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { getImageUrl } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import type { OrderItem } from "@/types";

const OrdersTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["orders", "common", "customers"]);
  // currentLocale and currencyCode are used in sub-components, not here.

  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders-timeline", dateFrom, dateTo],
    queryFn: () =>
      getOrders(1, 100, {
        dateFrom,
        dateTo,
      }),
  });

  const orders = response?.data || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-amber-500",
          bg: "bg-amber-500/10",
          text: "text-amber-600",
          secondary: "text-amber-400",
          icon: Clock,
          label: t("status_pending"),
        };
      case "processing":
        return {
          color: "bg-blue-500",
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          secondary: "text-blue-400",
          icon: TrendingUp,
          label: t("status_processing"),
        };
      case "delivered":
        return {
          color: "bg-emerald-500",
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          secondary: "text-emerald-400",
          icon: Truck,
          label: t("status_delivered"),
        };
      case "completed":
        return {
          color: "bg-slate-400",
          bg: "bg-slate-400/10",
          text: "text-slate-500",
          secondary: "text-slate-300",
          icon: CheckCircle2,
          label: t("status_completed"),
        };
      case "cancelled":
        return {
          color: "bg-rose-500",
          bg: "bg-rose-500/10",
          text: "text-rose-600",
          secondary: "text-rose-400",
          icon: AlertCircle,
          label: t("status_cancelled"),
        };
      default:
        return {
          color: "bg-gray-500",
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          secondary: "text-gray-400",
          icon: Package,
          label: status,
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title={t("ordersTimeline", { defaultValue: "Visual Timeline" })}
        description={t("heroTimelineDescription", {
          defaultValue: "Immersive order journey with large visuals",
        })}
      >
        <div className="flex flex-wrap items-center gap-3 bg-white/40 backdrop-blur-xl p-2 rounded-2xl border border-white/60 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border group transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <CalendarIcon className="h-4 w-4 text-primary/40" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 w-36 h-8 text-[11px] font-black"
            />
          </div>
          <span className="text-slate-400 font-black text-xs uppercase italic tracking-widest hidden sm:inline">
            to
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border group transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <CalendarIcon className="h-4 w-4 text-primary/40" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 w-36 h-8 text-[11px] font-black"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl h-11 px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("refresh", { ns: "common" })
            )}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-b-2 border-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-10 w-10 text-primary/20 animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 animate-pulse">
            Constructing Timeline
          </p>
        </div>
      ) : error ? (
        <Card className="max-w-md mx-auto py-12 border-none bg-rose-50/50 backdrop-blur-md rounded-[3rem] text-center shadow-xl border-t border-rose-100/50">
          <CardContent className="space-y-4 pt-6">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto opacity-40" />
            <h2 className="text-xl font-black text-rose-900 tracking-tight">
              {t("errorLoading", { ns: "common" })}
            </h2>
            <p className="text-rose-700/60 text-xs italic tracking-tight">
              {(error as Error).message}
            </p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <div className="text-center py-32 bg-slate-50/50 backdrop-blur-sm rounded-[4rem] border-2 border-dashed border-slate-100 animate-in zoom-in-95 duration-1000">
          <ShoppingBag className="h-16 w-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
            {t("noOrdersFound")}
          </h2>
          <p className="text-[11px] text-slate-400 font-black tracking-widest uppercase mt-2">
            The Collection is Empty
          </p>
        </div>
      ) : (
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* The Vertical Spine */}
          <div className="absolute left-[30px] md:left-[50%] md:-translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/10 via-primary/30 to-transparent" />

          <div className="space-y-12 pb-12">
            {orders.map((order, orderIndex) => {
              const status = getStatusConfig(order.status);
              const isEven = orderIndex % 2 === 0;

              return (
                <div
                  key={order.id}
                  className={`relative md:grid md:grid-cols-2 gap-12 items-center group`}
                  style={{
                    animationDelay: `${orderIndex * 100}ms`,
                    animationName: "slide-in-up",
                    animationDuration: "800ms",
                    animationFillMode: "both",
                  }}
                >
                  {/* The Center Node */}
                  <div className="absolute left-[30px] md:left-[50%] md:-translate-x-1/2 top-24 md:top-1/2 md:-translate-y-1/2 h-4 w-4 rounded-full bg-white border-4 border-primary/20 z-20 shadow-[0_0_0_4px_rgba(255,255,255,1)] group-hover:border-primary transition-colors duration-500 ring-4 ring-white" />

                  {/* Left/Top Content (Image Side for Even, Details for Odd on Desktop) */}
                  <div
                    className={`pl-16 md:pl-0 ${isEven ? "md:order-1" : "md:order-2 text-right"}`}
                  >
                    {/* Only show image here on desktop if odd, or if even show details */}
                    <div
                      className={`hidden md:block ${isEven ? "" : "flex justify-end"}`}
                    >
                      {isEven ? (
                        <OrderItemsGallery order={order} status={status} />
                      ) : (
                        <OrderDetailsCard
                          order={order}
                          status={status}
                          isEven={isEven}
                          navigate={navigate}
                        />
                      )}
                    </div>
                    {/* Mobile: Always Hero Image first */}
                    <div className="md:hidden">
                      <OrderItemsGallery order={order} status={status} />
                    </div>
                  </div>

                  {/* Right/Bottom Content (Details Side for Even, Image for Odd on Desktop) */}
                  <div
                    className={`pl-16 md:pl-0 ${isEven ? "md:order-2" : "md:order-1 flex justify-end"}`}
                  >
                    <div className={`hidden md:block ${isEven ? "" : ""}`}>
                      {isEven ? (
                        <OrderDetailsCard
                          order={order}
                          status={status}
                          isEven={isEven}
                          navigate={navigate}
                        />
                      ) : (
                        <OrderItemsGallery order={order} status={status} />
                      )}
                    </div>
                    {/* Mobile: Always Details second */}
                    <div className="md:hidden mt-6">
                      <OrderDetailsCard
                        order={order}
                        status={status}
                        isEven={false}
                        navigate={navigate}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <style>{`
                @keyframes slide-in-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
      )}
    </div>
  );
};

// Sub-components for cleaner render logic

interface OrderItemsGalleryProps {
  order: any; // Using any for order to avoid strict type checks on complex relations for now, or define Order properly
  status: any;
}

const OrderItemsGallery = ({ order, status }: OrderItemsGalleryProps) => {
  // If no items, show a placeholder box
  if (!order.items || order.items.length === 0) {
    return (
      <div className="h-[200px] w-[200px] bg-slate-50 border-4 border-white rounded-[1.5rem] shadow-lg flex items-center justify-center relative overflow-hidden group">
        <Package className="h-10 w-10 text-slate-200" />
        <div
          className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/40 shadow-sm ${status.bg}`}
        >
          <status.icon className={`h-3 w-3 ${status.text}`} />
          <span
            className={`text-[8px] font-black uppercase tracking-widest ${status.text}`}
          >
            {status.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-[440px]">
      {order.items.map((item: OrderItem, idx: number) => (
        <div
          key={item.id}
          className="relative group/image overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 border-4 border-white flex-shrink-0"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="relative h-[200px] w-[200px]">
            {item.serviceOffering?.productType?.image_url ? (
              <img
                src={getImageUrl(item.serviceOffering.productType.image_url)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-110"
              />
            ) : (
              <div className="h-full w-full bg-slate-50 flex items-center justify-center">
                <Package className="h-10 w-10 text-slate-200" />
              </div>
            )}

            {/* Quantity Badge */}
            <div className="absolute top-3 right-3 h-6 min-w-[24px] px-1.5 flex items-center justify-center rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-black shadow-lg">
              x{item.quantity}
            </div>

            {/* Status Icon (only first item gets main badge logic earlier, but let's just keep clean) */}
            {idx === 0 && (
              <div
                className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-md border border-white/40 shadow-sm ${status.bg}`}
              >
                <status.icon className={`h-3 w-3 ${status.text}`} />
              </div>
            )}
          </div>

          {/* Meta Data Panel */}
          <div className="p-3 bg-white border-t border-slate-50 space-y-1">
            <p className="text-[11px] font-black text-slate-800 truncate leading-tight">
              {item.serviceOffering?.productType?.name}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
              {item.serviceOffering?.display_name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderDetailsCard = ({ order, isEven, navigate }: any) => {
  const { i18n } = useTranslation(["orders"]); // Removed unused 't'
  const { currencyCode } = useCurrency();
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  return (
    <Card
      className={`border-none bg-white/60 backdrop-blur-md shadow-sm hover:bg-white hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden cursor-pointer group/card max-w-[400px] ${!isEven ? "ml-auto text-right" : ""}`}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="p-8 space-y-6">
        <div
          className={`flex flex-col ${!isEven ? "items-end" : "items-start"}`}
        >
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">
            Order Identification
          </p>
          <p className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-4 group-hover/card:text-primary transition-colors">
            #{order.id}
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <p className="text-[11px] font-bold uppercase tracking-tight">
              {format(new Date(order.order_date), "MMMM d, yyyy", {
                locale: currentLocale,
              })}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-4 ${!isEven ? "flex-row-reverse" : ""}`}
        >
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover/card:bg-primary/5 group-hover/card:border-primary/20 flex-shrink-0">
            <User className="h-5 w-5 text-slate-400 group-hover/card:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-tight mb-1">
              {order.customer?.name}
            </p>
            <p className="text-[10px] font-bold text-slate-400 tracking-tight">
              {order.customer?.phone || "Private Contact"}
            </p>
          </div>
        </div>

        <div
          className={`pt-6 border-t border-slate-100 flex items-center justify-between ${!isEven ? "flex-row-reverse" : ""}`}
        >
          <div className={`${!isEven ? "text-right" : ""}`}>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">
              Value
            </p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat(i18n.language, {
                style: "currency",
                currency: currencyCode,
              }).format(order.total_amount)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        {/* Note Indicator if any */}
        {order.notes && (
          <div
            className={`flex items-center gap-2 px-4 py-3 bg-amber-50/50 rounded-2xl border border-amber-100/40 mt-4 ${!isEven ? "flex-row-reverse text-right" : ""}`}
          >
            <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-amber-900/60 font-bold italic truncate flex-1">
              "{order.notes}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrdersTimelinePage;
