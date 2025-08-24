// src/pages/services/product-compositions/ProductCompositionsListPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ProductComposition } from "@/types";
import { 
  getProductCompositions, 
  createProductComposition, 
  updateProductComposition, 
  deleteProductComposition 
} from "@/api/productCompositionService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

interface CompositionFormData {
  name: string;
}

export default function ProductCompositionsListPage() {
  const { t } = useTranslation(["common", "services"]);
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<ProductComposition | null>(null);
  const [deletingComposition, setDeletingComposition] = useState<ProductComposition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CompositionFormData>({ name: "" });

  // Fetch compositions
  const { data: compositionsResponse, isLoading } = useQuery({
    queryKey: ['productCompositions'],
    queryFn: getProductCompositions,
  });

  const compositions = compositionsResponse?.data || [];

  // Filter compositions based on search term and sort by ID desc
  const filteredCompositions = compositions
    .filter((composition: ProductComposition) =>
      composition.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.id - a.id); // Sort by ID in descending order

  // Create composition mutation
  const createMutation = useMutation({
    mutationFn: (data: CompositionFormData) => createProductComposition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCompositions'] });
      toast.success(t("compositionCreatedSuccess", { 
        ns: "services", 
        defaultValue: "Composition created successfully" 
      }));
      setIsAddDialogOpen(false);
      setFormData({ name: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionCreateFailed", { 
        ns: "services", 
        defaultValue: "Failed to create composition" 
      }));
    },
  });

  // Update composition mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompositionFormData }) => 
      updateProductComposition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCompositions'] });
      toast.success(t("compositionUpdatedSuccess", { 
        ns: "services", 
        defaultValue: "Composition updated successfully" 
      }));
      setIsEditDialogOpen(false);
      setEditingComposition(null);
      setFormData({ name: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionUpdateFailed", { 
        ns: "services", 
        defaultValue: "Failed to update composition" 
      }));
    },
  });

  // Delete composition mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProductComposition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCompositions'] });
      toast.success(t("compositionDeletedSuccess", { 
        ns: "services", 
        defaultValue: "Composition deleted successfully" 
      }));
      setIsDeleteDialogOpen(false);
      setDeletingComposition(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionDeleteFailed", { 
        ns: "services", 
        defaultValue: "Failed to delete composition" 
      }));
    },
  });

  const handleAdd = () => {
    setFormData({ name: "" });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (composition: ProductComposition) => {
    setEditingComposition(composition);
    setFormData({ name: composition.name });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (composition: ProductComposition) => {
    setDeletingComposition(composition);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t("compositionNameRequired", { 
        ns: "services", 
        defaultValue: "Composition name is required" 
      }));
      return;
    }

    if (editingComposition) {
      await updateMutation.mutateAsync({ 
        id: editingComposition.id, 
        data: { name: formData.name.trim() } 
      });
    } else {
      await createMutation.mutateAsync({ name: formData.name.trim() });
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingComposition) {
      await deleteMutation.mutateAsync(deletingComposition.id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {t("productCompositions", { ns: "services", defaultValue: "Product Compositions" })}
          </h1>
          <p className="text-muted-foreground">
            {t("manageProductCompositions", { 
              ns: "services", 
              defaultValue: "Manage product compositions and ingredients" 
            })}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addComposition", { ns: "services", defaultValue: "Add Composition" })}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchCompositions", { 
              ns: "services", 
              defaultValue: "Search compositions..." 
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>
                {t("name", { defaultValue: "Name" })}
              </TableHead>
              <TableHead>
                {t("createdAt", { defaultValue: "Created At" })}
              </TableHead>
              <TableHead className="text-right">
                {t("actions", { defaultValue: "Actions" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2">{t("loading", { defaultValue: "Loading..." })}</p>
                </TableCell>
              </TableRow>
            ) : filteredCompositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? t("noCompositionsFound", { 
                          ns: "services", 
                          defaultValue: "No compositions found matching your search" 
                        })
                      : t("noCompositions", { 
                          ns: "services", 
                          defaultValue: "No compositions found" 
                        })
                    }
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCompositions.map((composition: ProductComposition) => (
                <TableRow key={composition.id}>
                  <TableCell>{composition.id}</TableCell>
                  <TableCell className="font-medium">{composition.name}</TableCell>
                  <TableCell>
                    {new Date(composition.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(composition)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(composition)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingComposition(null);
          setFormData({ name: "" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingComposition 
                ? t("editComposition", { ns: "services", defaultValue: "Edit Composition" })
                : t("addComposition", { ns: "services", defaultValue: "Add Composition" })
              }
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="composition-name">
                {t("compositionName", { ns: "services", defaultValue: "Composition Name" })}
              </Label>
              <Input
                id="composition-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("enterCompositionName", { 
                  ns: "services", 
                  defaultValue: "Enter composition name..." 
                })}
                disabled={createMutation.isPending || updateMutation.isPending}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingComposition(null);
                  setFormData({ name: "" });
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {t("cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim()}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingComposition 
                      ? t("updating", { defaultValue: "Updating..." })
                      : t("creating", { defaultValue: "Creating..." })
                    }
                  </>
                ) : (
                  editingComposition 
                    ? t("update", { defaultValue: "Update" })
                    : t("create", { defaultValue: "Create" })
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteComposition", { ns: "services", defaultValue: "Delete Composition" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCompositionConfirmation", { 
                ns: "services", 
                defaultValue: "Are you sure you want to delete this composition? This action cannot be undone." 
              })}
              {deletingComposition && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{deletingComposition.name}</strong>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting", { defaultValue: "Deleting..." })}
                </>
              ) : (
                t("delete", { defaultValue: "Delete" })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
