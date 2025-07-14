import axiosInstance from './axiosInstance';

// DTO 타입 정의
export interface ProductCreateRequest {
    name: string;
    description: string;
    startPrice: number;
    imageUrl: string;
    auctionEndTime: string; // ISO 8601 형식의 문자열 (e.g., "2025-07-15T12:00:00")
}

export const createProduct = (productData: ProductCreateRequest) => {
    return axiosInstance.post('/api/v1/products', productData);
};