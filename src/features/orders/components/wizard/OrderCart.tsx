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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingCart, PlusCircle, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { restaurantTableService } from "@/api/restaurantTableService";
import { RestaurantTable } from "@/types/restaurantTable.types";
import { useEffect, useState } from "react";

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
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const watchedItems = useWatch({ control, name: "items" });
  const watchedCustomerId = useWatch({ control, name: "customer_id" });

  // Load available tables
  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const availableTables = await restaurantTableService.getAvailable();
        setTables(availableTables);
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, []);

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
      <header className="p-4 border-b shrink-0 flex items-center justify-between mt-10">
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
          <div className="grid gap-1.5">
            <Label htmlFor="order-table" className="text-xs font-semibold flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {t("table", { ns: "orders", defaultValue: "Table" })} ({t("optional", { ns: "common" })})
            </Label>
            <Controller
              name="table_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                  disabled={isSubmitting || loadingTables}
                >
                  <SelectTrigger id="order-table">
                    <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select a table..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No table selected</SelectItem>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{table.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({table.number})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.table_id && (
              <p className="text-sm text-destructive">
                {t(errors.table_id.message as string)}
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
