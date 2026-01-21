import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Order } from "@/types";

interface NewOrderContextType {
  newlyCreatedOrder: Order | null;
  setNewlyCreatedOrder: (order: Order | null) => void;
  clearNewlyCreatedOrder: () => void;
  shouldCreateNewOrder: boolean;
  triggerCreateNewOrder: () => void;
  resetCreateNewOrderTrigger: () => void;
}

const NewOrderContext = createContext<NewOrderContextType | undefined>(
  undefined,
);

export const useNewOrder = () => {
  const context = useContext(NewOrderContext);
  if (context === undefined) {
    throw new Error("useNewOrder must be used within a NewOrderProvider");
  }
  return context;
};

interface NewOrderProviderProps {
  children: ReactNode;
}

export const NewOrderProvider: React.FC<NewOrderProviderProps> = ({
  children,
}) => {
  const [newlyCreatedOrder, setNewlyCreatedOrder] = useState<Order | null>(
    null,
  );
  const [shouldCreateNewOrder, setShouldCreateNewOrder] = useState(false);

  const clearNewlyCreatedOrder = () => {
    setNewlyCreatedOrder(null);
  };

  const triggerCreateNewOrder = () => {
    setShouldCreateNewOrder(true);
  };

  const resetCreateNewOrderTrigger = () => {
    setShouldCreateNewOrder(false);
  };

  return (
    <NewOrderContext.Provider
      value={{
        newlyCreatedOrder,
        setNewlyCreatedOrder,
        clearNewlyCreatedOrder,
        shouldCreateNewOrder,
        triggerCreateNewOrder,
        resetCreateNewOrderTrigger,
      }}
    >
      {children}
    </NewOrderContext.Provider>
  );
};
