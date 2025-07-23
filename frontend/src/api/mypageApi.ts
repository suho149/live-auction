// mypageApi.ts
import axiosInstance from './axiosInstance';
import { ProductCardProps } from '../components/ProductCard';

// DeliveryStatus 타입을 명시적으로 정의
export type DeliveryStatus = 'ADDRESS_PENDING' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELED';

// 구매 내역 타입 정의
export interface PurchaseHistory {
    productId: number;
    paymentId: number;
    productName: string;
    productThumbnailUrl: string | null;
    finalPrice: number;
    purchasedAt: string;
    reviewWritten: boolean;
    deliveryStatus: DeliveryStatus;
    trackingNumber: string | null;
}

// 구매 내역 API 호출 함수
export const fetchPurchaseHistory = async (): Promise<PurchaseHistory[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/purchases');
    return response.data;
};

// 판매 내역 타입 정의
export interface SaleHistory {
    productId: number;
    productName: string;
    productThumbnailUrl: string | null;
    finalPrice: number;
    soldAt: string;
    buyerName: string;
}

// 판매 내역 API 호출 함수
export const fetchSaleHistory = async (): Promise<SaleHistory[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/sales');
    return response.data;
};

export interface SettlementSummary {
    totalSalesAmount: number;
    totalSettledAmount: number;
    pendingSettlementAmount: number;
    availableSettlementAmount: number;
}

export interface SettlementHistory {
    id: number;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    requestedAt: string;
    completedAt: string | null;
}

export const fetchSettlementSummary = async (): Promise<SettlementSummary> => {
    const response = await axiosInstance.get('/api/v1/users/me/settlement-summary');
    return response.data;
};

export const requestSettlement = async (): Promise<void> => {
    await axiosInstance.post('/api/v1/users/me/settlement-request');
};

export const fetchSettlementHistory = async (): Promise<SettlementHistory[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/settlement-history');
    return response.data;
};

export const fetchBiddingProducts = async (): Promise<ProductCardProps[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/bidding');
    return response.data;
};

export const fetchSellingProducts = async (): Promise<ProductCardProps[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/selling');
    return response.data;
};
