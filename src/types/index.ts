// src/types/index.ts

export type OrderStatus = "pending" | "processing" | "ready_for_pickup" | "completed" | "cancelled";

export interface Order {
  id: string;
  customerName: string;
  orderDate: string; // ISO date string
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredDate: string; // ISO date string
  totalOrders: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string; // e.g., "Washing", "Dry Cleaning", "Ironing"
}

// You can expand these as needed