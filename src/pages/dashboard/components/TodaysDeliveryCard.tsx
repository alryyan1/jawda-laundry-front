// src/pages/dashboard/components/TodaysDeliveryCard.tsx
import React from "react";
import type { TodaysDeliveryOrder } from "@/api/dashboardService";
import { Card, CardContent } from "@/components/ui/card";
import { User, Shirt } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface TodaysDeliveryCardProps {
  order: TodaysDeliveryOrder;
  onClick: () => void;
}

export const TodaysDeliveryCard: React.FC<TodaysDeliveryCardProps> = ({
  order,
  onClick,
}) => {
  return (
    <Card
      className="shadow-sm border border-slate-200 hover:shadow-md transition-all overflow-hidden cursor-pointer active:scale-95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-800 uppercase line-clamp-1">
              {order.customer_name}
            </span>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <User className="h-3 w-3" />
              {/* Placeholder for future icon if needed */}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {order.order_number}
          </span>
        </div>

        {/* Items Row */}
        <div className="flex items-center gap-2 mt-2 h-10">
          {order.item_images && order.item_images.length > 0 ? (
            order.item_images.map((imgUrl, index) => (
              <div
                key={index}
                className="h-10 w-10 relative flex-shrink-0 bg-slate-50 rounded-md border p-0.5"
              >
                <img
                  src={getImageUrl(
                    imgUrl.startsWith("http")
                      ? imgUrl
                      : `product_types/${imgUrl}`,
                  )}
                  alt="Item"
                  className="h-full w-full object-contain"
                />
              </div>
            ))
          ) : (
            <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-300">
              <Shirt className="h-4 w-4" />
            </div>
          )}
          {order.items_count > 4 && (
            <div className="h-8 w-8 flex items-center justify-center bg-slate-100 rounded-full text-[10px] font-medium text-slate-500">
              +{order.items_count - 4}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
