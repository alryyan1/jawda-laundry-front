// src/pages/services/product-types/ProductTypeCompositionsPage.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type { ProductType, ProductTypeComposition } from "@/types";
import { getProductTypeById } from "@/api/productTypeService";
import { 
  getProductTypeCompositions, 
  createComposition,
  updateComposition,
  deleteComposition,
  toggleCompositionStatus
} from "@/api/productTypeCompositionService";

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { CompositionFormModal } from "./components/CompositionFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Utensils,
  List,
  Settings,
} from "lucide-react";

export default function ProductTypeCompositionsPage() {
  const { t } = useTranslation();
  const { productTypeId } = useParams<{ productTypeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<ProductTypeComposition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductTypeComposition | null>(null);

  // Fetch product type details
  const { data: productType, isLoading: isLoadingProductType } = useQuery({
    queryKey: ["productType", productTypeId],
    queryFn: () => getProductTypeById(Number(productTypeId)),
    enabled: !!productTypeId,
  });

  // Fetch compositions
  const { data: compositionsResponse, isLoading: isLoadingCompositions } = useQuery({
    queryKey: ["productTypeCompositions", productTypeId],
    queryFn: () => getProductTypeCompositions(Number(productTypeId)),
    enabled: !!productTypeId,
  });

  const compositions = compositionsResponse?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => createComposition(Number(productTypeId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productTypeId] });
      toast.success(t("تم إنشاء المكون بنجاح"));
      setIsFormModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("حدث خطأ أثناء إنشاء المكون"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateComposition(Number(productTypeId), editingComposition!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productTypeId] });
      toast.success(t("تم تحديث المكون بنجاح"));
      setIsFormModalOpen(false);
      setEditingComposition(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("حدث خطأ أثناء تحديث المكون"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (compositionId: number) => deleteComposition(Number(productTypeId), compositionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productTypeId] });
      toast.success(t("تم حذف المكون بنجاح"));
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("حدث خطأ أثناء حذف المكون"));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (compositionId: number) => toggleCompositionStatus(Number(productTypeId), compositionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productTypeId] });
      toast.success(t("تم تحديث حالة المكون بنجاح"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("حدث خطأ أثناء تحديث حالة المكون"));
    },
  });

  // Filter compositions based on search term
  const filteredCompositions = compositions.filter((composition: ProductTypeComposition) =>
    composition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    composition.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setEditingComposition(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (composition: ProductTypeComposition) => {
    setEditingComposition(composition);
    setIsFormModalOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingComposition) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleToggleStatus = (composition: ProductTypeComposition) => {
    toggleStatusMutation.mutate(composition.id);
  };

  if (isLoadingProductType) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!productType) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("نوع المنتج غير موجود")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/services/product-types")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("العودة")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("مكونات المنتج")}</h1>
            <p className="text-muted-foreground">
              {t("إدارة مكونات")}: {productType.name}
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          {t("إضافة مكون جديد")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder={t("البحث في المكونات...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Compositions List */}
      {isLoadingCompositions ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCompositions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("لا توجد مكونات")}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? t("لا توجد نتائج للبحث") : t("لم يتم إضافة أي مكونات بعد")}
                </p>
                {!searchTerm && (
                  <Button onClick={handleOpenCreateModal}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("إضافة أول مكون")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCompositions.map((composition: ProductTypeComposition) => (
                <Card key={composition.id} className={`${!composition.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{composition.name}</h3>
                          <Badge variant={composition.is_active ? "default" : "secondary"}>
                            {composition.is_active ? t("مفعل") : t("معطل")}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("الإجراءات")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEditModal(composition)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            {t("تعديل")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(composition)}>
                            {composition.is_active ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                {t("إلغاء التفعيل")}
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                {t("تفعيل")}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setItemToDelete(composition)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("حذف")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {composition.description && (
                      <p className="text-muted-foreground">{composition.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t("العناصر المطلوبة")}:</span>
                        <span className="text-muted-foreground">{composition.required_items_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t("العناصر الاختيارية")}:</span>
                        <span className="text-muted-foreground">{composition.optional_items_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t("إجمالي العناصر")}:</span>
                        <span className="text-muted-foreground">{composition.total_items_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <CompositionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingComposition(null);
        }}
        onSubmit={handleSubmit}
        composition={editingComposition}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title={t("حذف المكون")}
        message={t("هل أنت متأكد من حذف هذا المكون؟ لا يمكن التراجع عن هذا الإجراء.")}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
