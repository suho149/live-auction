// mypageApi.ts
import axiosInstance from './axiosInstance';

// 구매 내역 타입 정의
export interface PurchaseHistory {
    productId: number;
    productName: string;
    productThumbnailUrl: string | null;
    finalPrice: number;
    purchasedAt: string;
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