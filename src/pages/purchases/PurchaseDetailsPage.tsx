// src/pages/purchases/PurchaseDetailsPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import type { Purchase, PurchaseStatus, PurchaseItem } from "@/types";
import { getPurchaseById } from "@/api/purchaseService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Reusable local component for status badges
const PurchaseStatusBadge: React.FC<{ status: PurchaseStatus }> = ({
  status,
}) => {
  const { t } = useTranslation("purchases");
  let statusClasses = "";
  switch (status) {
    case "ordered":
      statusClasses =
        "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300 dark:border-blue-600";
      break;
    case "received":
      statusClasses =
        "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
      break;
    case "paid":
      statusClasses =
        "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-700/30 dark:text-purple-300 dark:border-purple-600";
      break;
    case "partially_paid":
      statusClasses =
        "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
      break;
    case "cancelled":
      statusClasses =
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600";
      break;
    default:
      statusClasses =
        "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600";
  }
  return (
    <Badge className={cn("capitalize", statusClasses)}>
      {t(`status_${status}`)}
    </Badge>
  );
};

const PurchaseDetailsPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "purchases"]);
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();

  const {
    data: purchase,
    isLoading,
    error,
    refetch,
  } = useQuery<Purchase, Error>({
    queryKey: ["purchase", id],
    queryFn: () => getPurchaseById(Number(id!)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">
          {t("loadingPurchaseDetails", { ns: "purchases" })}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive text-lg">
          {t("errorLoadingPurchase", { ns: "purchases" })}
        </p>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-8 text-center">
        {t("purchaseNotFound", { ns: "purchases" })}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={`${t("purchaseDetails", { ns: "purchases" })} #${purchase.id}`}
        description={t("purchaseFromSupplier", {
          ns: "purchases",
          supplier: purchase.supplier?.name || "N/A",
          date: format(new Date(purchase.purchase_date), "PPP"),
        })}
      >
        <Button variant="outline" asChild>
          <Link to="/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPurchases", { ns: "purchases" })}
          </Link>
        </Button>
        {can("purchase:update") && (
          <Button asChild>
            <Link to={`/purchases/${purchase.id}/edit`}>
              <Edit3 className="mr-2 h-4 w-4" />
              {t("edit")}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content: Items Table */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("itemsPurchased", { ns: "purchases" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("itemName", { ns: "purchases" })}</TableHead>
                    <TableHead className="text-center">
                      {t("quantity")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("unitPrice")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("subtotal")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((item: PurchaseItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.item_name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity} {item.unit || ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price, "USD", i18n.language)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.sub_total, "USD", i18n.language)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {purchase.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {purchase.notes}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("summary", { ns: "purchases" })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("supplier", { ns: "purchases" })}:
                </span>
                <span className="font-medium">
                  {purchase.supplier?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("purchaseDate", { ns: "purchases" })}:
                </span>
                <span className="font-medium">
                  {format(new Date(purchase.purchase_date), "PPP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("reference", { ns: "purchases" })}:
                </span>
                <span className="font-medium">
                  {purchase.reference_number || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("status")}:</span>
                <PurchaseStatusBadge status={purchase.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("recordedBy", { ns: "expenses" })}:
                </span>
                <span className="font-medium">
                  {purchase.user?.name || "-"}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold text-base">
                <span>{t("totalAmount", { ns: "purchases" })}:</span>
                <span className="text-primary">
                  {formatCurrency(purchase.total_amount, "USD", i18n.language)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailsPage;
