import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import type { ProductType, ServiceOffering } from '@/types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ServiceOfferingColumn } from '@/features/pos/components/ServiceOfferingColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';

interface CartItem {
  id: string;
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number;
}

const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductType(null);
  };

  const handleSelectProduct = (product: ProductType) => {
    setSelectedProductType(product);
  };

  const handleSelectOffering = (offering: ServiceOffering) => {
    const newItem: CartItem = {
      id: uuidv4(),
      productType: selectedProductType!,
      serviceOffering: offering,
      quantity: 1,
      price: selectedProductType?.is_dimension_based 
        ? offering.default_price_per_sq_meter || 0
        : offering.default_price || 0,
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement checkout logic
      console.log('Checkout items:', cartItems);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setCartItems([]);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted">
      <header className="px-6 py-4 border-b bg-background shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{t("pointOfSale", { ns: "common" })}</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full p-4">
          {/* Category Column */}
          <section className="bg-background rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">{t("category", { ns: "common" })}</h2>
            <CategoryColumn
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
            />
          </section>

          {/* Product Column */}
          <section className="bg-background rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">{t("product", { ns: "common" })}</h2>
            <ProductColumn
              categoryId={selectedCategoryId}
              onSelectProduct={handleSelectProduct}
            />
          </section>

          {/* Service Offering Column */}
          <section className="bg-background rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">{t("serviceOffering", { ns: "common" })}</h2>
            <ServiceOfferingColumn
              productType={selectedProductType}
              onSelectOffering={handleSelectOffering}
            />
          </section>

          {/* Cart Column */}
          <section className="bg-background rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">{t("cart", { ns: "common" })}</h2>
            <CartColumn
              items={cartItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onCheckout={handleCheckout}
              isProcessing={isProcessing}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default POSPage; 