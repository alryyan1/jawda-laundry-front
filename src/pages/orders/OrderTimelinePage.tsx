import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  ArrowLeft,
  Clock,
  Package,
  CheckCircle2,
  Truck,
  User,
  Phone,
  Hash,
  ShoppingBag,
  Info,
} from "lucide-react";

import { getOrderById } from "@/api/orderService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { getImageUrl } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import type { Order, OrderItem } from "@/types";

const OrderTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["orders", "common", "customers"]);
  const { currencyCode } = useCurrency();
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order, Error>({
    queryKey: ["order", id, "timeline"],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          {t("loadingOrder", { defaultValue: "Loading order timeline..." })}
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="p-4 rounded-full bg-destructive/10">
          <Info className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">{t("orderNotFound")}</h2>
        <Button onClick={() => navigate("/orders")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToOrders")}
        </Button>
      </div>
    );
  }

  const timelineEvents = [
    {
      id: "created",
      title: t("orderCreated", { defaultValue: "Order Created" }),
      date: order.created_at,
      icon: <Clock className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      active: true,
    },
    {
      id: "received",
      title: t("orderReceived", { defaultValue: "Order Received" }),
      date: order.received_at,
      icon: <Package className="h-5 w-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      active: !!order.received_at,
    },
    {
      id: "completed",
      title: t("orderCompleted", { defaultValue: "Processing Completed" }),
      date: order.completed_at,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-500",
      bgColor: "bg-green-50",
      active: !!order.completed_at,
    },
    {
      id: "delivered",
      title: t("orderDelivered", { defaultValue: "Order Delivered" }),
      date: order.delivered_date,
      icon: <Truck className="h-5 w-5" />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      active: !!order.delivered_date,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={`${t("orderTimeline", { defaultValue: "Order Timeline" })} #${order.id}`}
        description={t("trackingOrderLifecycle", {
          defaultValue: "Track the lifecycle and items of this order",
        })}
      >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back", { ns: "common" })}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Timeline & Customer */}
        <div className="lg:col-span-1 space-y-6">
          {/* Timeline Card */}
          <Card className="shadow-md border-none bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t("statusLifecycle", { defaultValue: "Status Lifecycle" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative space-y-0">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-8 pb-8 last:pb-0">
                    {/* Vertical Line */}
                    {index !== timelineEvents.length - 1 && (
                      <div
                        className={`absolute left-4 top-6 bottom-0 w-0.5 ${
                          timelineEvents[index + 1].active
                            ? "bg-primary"
                            : "bg-slate-200"
                        }`}
                      />
                    )}

                    {/* Node Dot */}
                    <div
                      className={`absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center z-10 shadow-sm border-2 transition-colors ${
                        event.active
                          ? "bg-white border-primary text-primary"
                          : "bg-slate-50 border-slate-200 text-slate-300"
                      }`}
                    >
                      {event.icon}
                    </div>

                    {/* Content */}
                    <div
                      className={event.active ? "opacity-100" : "opacity-50"}
                    >
                      <h4 className="font-bold text-slate-800 leading-none mb-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {event.date
                          ? format(new Date(event.date), "PPP p", {
                              locale: currentLocale,
                            })
                          : t("notReachedYet", { defaultValue: "Pending..." })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("customerInfo", { ns: "common" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {order.customer?.name?.[0].toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {order.customer?.name ||
                      t("guestCustomer", { ns: "customers" })}
                  </h3>
                  <Badge variant="secondary" className="mt-1">
                    ID: {order.customer?.id || "N/A"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {order.customer?.phone || t("noPhone", { ns: "customers" })}
                  </span>
                </div>
                {order.customer?.email && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Hash className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate">
                      {order.customer.email}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-slate-800 text-white pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  {t("orderItems", { defaultValue: "Order Items" })}
                </CardTitle>
                <div className="text-right">
                  <p className="text-xs opacity-70 uppercase tracking-wider">
                    {t("totalAmount", { ns: "common" })}
                  </p>
                  <p className="text-2xl font-black">
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: currencyCode,
                    }).format(order.total_amount)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items?.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner group">
                        {item.serviceOffering?.productType?.image_url ? (
                          <img
                            src={getImageUrl(
                              item.serviceOffering.productType.image_url,
                            )}
                            alt={item.serviceOffering.productType.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-slate-300" />
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 leading-tight">
                            {item.serviceOffering?.productType?.name ||
                              "Product"}
                          </h4>
                          <Badge variant="outline" className="mt-1 bg-white">
                            {item.serviceOffering?.display_name || "Service"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {new Intl.NumberFormat(i18n.language, {
                              style: "currency",
                              currency: currencyCode,
                            }).format(item.sub_total)}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {item.quantity} x{" "}
                            {new Intl.NumberFormat(i18n.language, {
                              style: "currency",
                              currency: currencyCode,
                            }).format(item.calculated_price_per_unit_item)}
                          </p>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-600 italic">
                          "{item.notes}"
                        </div>
                      )}

                      {(item.length_meters || item.width_meters) && (
                        <div className="flex gap-4 text-xs font-semibold text-slate-500 uppercase tracking-tighter">
                          {item.length_meters && (
                            <span className="flex items-center gap-1">
                              L: {item.length_meters}m
                            </span>
                          )}
                          {item.width_meters && (
                            <span className="flex items-center gap-1">
                              W: {item.width_meters}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!order.items || order.items.length === 0) && (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t("noItemsFound")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes Card */}
          {order.notes && (
            <Card className="border-none bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  {t("orderNotes", { defaultValue: "Order Notes" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 italic">"{order.notes}"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTimelinePage;
