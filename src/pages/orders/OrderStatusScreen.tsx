import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Loader2, Plus, ShoppingBag } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { getOrders, updateOrderStatus } from "@/api/orderService";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductImage } from "@/components/ProductImage";
import type { Order, OrderStatus } from "@/types";

// Column configuration
interface ColumnConfig {
  id: OrderStatus;
  title: string;
  color: string;
  borderColor: string;
  cardBorderColor: string;
  emptyColor?: string;
  queryKey: string[];
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "pending",
    title: "PENDING",
    color: "text-gray-400",
    borderColor: "border-gray-200",
    cardBorderColor: "border-gray-200",
    queryKey: ["orders", "status-screen", "pending"],
  },
  {
    id: "processing",
    title: "PROCESSING",
    color: "text-orange-400",
    borderColor: "border-orange-200",
    cardBorderColor: "border-orange-400",
    queryKey: ["orders", "status-screen", "processing"],
  },
  {
    id: "completed",
    title: "COMPLETED",
    color: "text-green-500",
    borderColor: "border-green-200",
    cardBorderColor: "border-green-400",
    queryKey: ["orders", "status-screen", "completed"],
  },
];

const OrderStatusScreen: React.FC = () => {
  const { t, i18n } = useTranslation(["orders", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // --- Data Fetching ---
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: COLUMNS[0].queryKey,
    queryFn: () => getOrders(1, 20, { status: "pending" }),
    refetchInterval: 30000,
  });

  const { data: processingData, isLoading: isProcessingLoading } = useQuery({
    queryKey: COLUMNS[1].queryKey,
    queryFn: () => getOrders(1, 20, { status: "processing" }),
    refetchInterval: 30000,
  });

  const { data: completedData, isLoading: isCompletedLoading } = useQuery({
    queryKey: COLUMNS[2].queryKey,
    queryFn: () => getOrders(1, 20, { status: "completed" }),
    refetchInterval: 30000,
  });

  const pendingOrders = pendingData?.data || [];
  const processingOrders = processingData?.data || [];
  const completedOrders = completedData?.data || [];
  const allOrders = [...pendingOrders, ...processingOrders, ...completedOrders];

  // --- Dnd Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
      },
    }),
    useSensor(TouchSensor),
  );

  // --- Mutation ---
  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: number;
      status: OrderStatus;
    }) => updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders", "status-screen"] });
      toast.success(`Order #${variables.orderId} moved to ${variables.status}`);
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const orderId = Number(active.id);

    const order = allOrders.find((o) => o.id === orderId);
    if (order) setActiveOrder(order);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset active state
    setActiveOrder(null);

    if (!over) return;

    const orderId = Number(active.id);
    const newStatus = over.id as OrderStatus;

    // Find current order to check if status actually changed
    const order = allOrders.find((o) => o.id === orderId);
    if (order && order.status !== newStatus) {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Header */}
        <header className="bg-blue-500 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-bold">Order Status Screen</h1>
          <Button
            onClick={() => navigate("/pos")}
            className="bg-white text-blue-600 hover:bg-blue-50 border-none font-semibold gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t("addNewOrder", { defaultValue: "Add New Order" })}
          </Button>
        </header>

        {/* Main Board */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <StatusColumn
              config={COLUMNS[0]}
              orders={pendingOrders}
              isLoading={isPendingLoading}
              locale={currentLocale}
              navigate={navigate}
            />
            <StatusColumn
              config={COLUMNS[1]}
              orders={processingOrders}
              isLoading={isProcessingLoading}
              locale={currentLocale}
              navigate={navigate}
            />
            <StatusColumn
              config={COLUMNS[2]}
              orders={completedOrders}
              isLoading={isCompletedLoading}
              locale={currentLocale}
              navigate={navigate}
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeOrder && (
          <OrderCard
            order={activeOrder}
            locale={currentLocale}
            borderColor="border-blue-500 shadow-xl"
            navigate={() => {}} // No navigation on drag
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

interface StatusColumnProps {
  config: ColumnConfig;
  isLoading: boolean;
  orders: Order[];
  locale: any;
  navigate: (path: string) => void;
}

const StatusColumn: React.FC<StatusColumnProps> = ({
  config,
  isLoading,
  orders,
  locale,
  navigate,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full bg-white rounded-xl shadow-sm border ${config.borderColor} overflow-hidden transition-colors ${isOver ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100" : ""}`}
    >
      <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10 transition-colors">
        <h2
          className={`text-lg font-bold uppercase tracking-wide ${config.color}`}
        >
          {config.title}
        </h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-300">
            <ShoppingBag
              className={`h-16 w-16 ${config.emptyColor || config.color} opacity-20`}
            />
            <span className="text-sm font-medium uppercase tracking-widest opacity-60">
              No orders
            </span>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {orders.map((order) => (
              <DraggableOrderCard
                key={order.id}
                order={order}
                locale={locale}
                borderColor={config.cardBorderColor}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface DraggableOrderCardProps extends OrderCardProps {}

const DraggableOrderCard: React.FC<DraggableOrderCardProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.order.id,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50 grayscale">
        <OrderCard {...props} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <OrderCard {...props} />
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  locale: any;
  borderColor: string;
  navigate: (path: string) => void;
  isOverlay?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  locale,
  borderColor,
  navigate,
  isOverlay,
}) => {
  return (
    <div
      className={`border-l-4 rounded-r-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing bg-white p-3 max-h-[124px] overflow-hidden ${isOverlay ? "cursor-grabbing shadow-xl scale-105 rotate-2" : ""} ${borderColor.replace("border-", "border-l-")}`}
      style={{
        borderLeftColor: borderColor.includes("orange")
          ? "#fb923c"
          : borderColor.includes("green")
            ? "#22c55e"
            : "#9ca3af",
      }}
      onClick={() => !isOverlay && navigate(`/orders/${order.id}`)}
    >
      <div className="flex flex-col gap-1.5">
        {/* Header: Name and ID */}
        <div className="flex justify-between items-center">
          <div className="font-bold text-gray-800 capitalize text-sm line-clamp-1">
            {order.customer?.name || "Guest"}
          </div>
          <div className="text-xs font-bold text-gray-500 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">
            #{order.id}
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between items-center text-[10px] text-gray-500">
          <div>
            <span className="opacity-75">Created:</span>{" "}
            {format(new Date(order.created_at), "dd MMM", { locale })}
          </div>
          <div>
            <span className="opacity-75">Delivery:</span>{" "}
            {order.pickup_date
              ? format(new Date(order.pickup_date), "dd MMM", { locale })
              : "-"}
          </div>
        </div>

        {/* Items Preview (Compact) */}
        <div className="flex gap-1 overflow-hidden pt-0.5">
          {order.items?.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="h-6 w-6 flex-shrink-0 bg-gray-50 rounded border border-gray-100 flex items-center justify-center relative overflow-hidden"
              title={`${item.quantity}x ${item.serviceOffering?.display_name || item.serviceOffering?.productType?.name}`}
            >
              <ProductImage
                url={item.serviceOffering?.productType?.image_url}
                alt={item.serviceOffering?.productType?.name || ""}
                className="h-full w-full object-cover"
                isIconFallback={false}
              />
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <div className="h-6 w-6 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
              +{order.items!.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusScreen;
