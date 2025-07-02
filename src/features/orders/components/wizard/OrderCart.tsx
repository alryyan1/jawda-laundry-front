// src/features/orders/components/wizard/OrderCart.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useWatch, Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFieldArrayRemove,
  FieldArrayWithId,
} from "react-hook-form";

import { OrderCartItem } from "./OrderCartItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

import type { NewOrderFormData } from "@/types";
import { useNavigate } from "react-router-dom";

interface OrderCartProps {
  control: Control<NewOrderFormData>;
  errors: FieldErrors<NewOrderFormData>;
  fields: FieldArrayWithId<NewOrderFormData, "items", "id">[];
  remove: UseFieldArrayRemove;
  onEditItem: (index: number) => void;
  onNewOrderClick: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export const OrderCart: React.FC<OrderCartProps> = ({
  control,
  errors,
  fields,
  remove,
  onEditItem,
  onNewOrderClick,
  isSubmitting,
  isEditing = false,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const navigate = useNavigate();

  const watchedItems = useWatch({ control, name: "items" });
  const watchedCustomerId = useWatch({ control, name: "customer_id" });

  const isQuotingAnyItem = useMemo(
    () => watchedItems?.some((item) => item._isQuoting),
    [watchedItems]
  );

  const orderTotal = useMemo(() => {
    return (
      watchedItems?.reduce(
        (total, item) => total + (item._quoted_sub_total || 0),
        0
      ) || 0
    );
  }, [watchedItems]);

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">
            {t("orderCart", { ns: "orders" })}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={onNewOrderClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isEditing ? t("newOrder") : t("newOrder")}
        </Button>
      </header>

      <ScrollArea className="flex-grow h-[500px]">
        <div className="p-4 space-y-4">
          {fields.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p className="max-w-[250px]">
                {t("cartIsEmpty", { ns: "orders" })}
              </p>
            </div>
          ) : (
            fields.map((field, index) => (
              <OrderCartItem
                key={field.id}
                index={index}
                onRemove={remove}
                onEdit={onEditItem}
                isSubmittingOrder={isSubmitting}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 p-4 space-y-4 border-t bg-background">
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="order-notes" className="text-xs font-semibold">
              {t("overallOrderNotesOptional", { ns: "orders" })}
            </Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="order-notes"
                  {...field}
                  rows={2}
                  disabled={isSubmitting}
                  placeholder={t("addNotesForThisOrder", { ns: "orders", defaultValue: "Add notes for this order..." })}
                />
              )}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="order-due_date" className="text-xs font-semibold">
              {t("dueDateOptional", { ns: "orders" })}
            </Label>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Input
                  id="order-due_date"
                  type="date"
                  {...field}
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.due_date && (
              <p className="text-sm text-destructive">
                {t(errors.due_date.message as string)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center text-xl font-bold">
          <span>{t("estimatedTotal", { ns: "orders" })}:</span>
          <span className="text-primary">
            {formatCurrency(orderTotal, "USD", i18n.language)}
          </span>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate("/orders")}
            disabled={isSubmitting || isQuotingAnyItem}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={
              isSubmitting ||
              isQuotingAnyItem ||
              !watchedCustomerId ||
              fields.length === 0
            }
          >
            {(isSubmitting || isQuotingAnyItem) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
            )}
            {isEditing ? t("updateOrder", { ns: "orders" }) : t("createOrderCta", { ns: "orders" })}
          </Button>
        </div>
      </div>
    </div>
  );
};
