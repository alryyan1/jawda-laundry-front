// src/api/paymentService.ts
import apiClient from './apiClient';
import type { Payment, RecordPaymentFormData } from '@/types';

// FormData type might have string for amount, payload needs number
type RecordPaymentPayload = Omit<RecordPaymentFormData, 'amount'> & { amount: number };

export const getOrderPayments = async (orderId: number | string): Promise<Payment[]> => {
    const { data } = await apiClient.get<{ data: Payment[] }>(`/orders/${orderId}/payments`);
    return data.data;
};

export const recordOrderPayment = async (orderId: number | string, formData: RecordPaymentFormData): Promise<Payment> => {
    const payload: RecordPaymentPayload = {
        ...formData,
        amount: Number(formData.amount),
    };
    const { data } = await apiClient.post<{ data: Payment }>(`/orders/${orderId}/payments`, payload);
    return data.data;
};

export const deleteOrderPayment = async (orderId: number | string, paymentId: number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/orders/${orderId}/payments/${paymentId}`);
    return data;
};