// src/api/userApi.ts
import axiosInstance from './axiosInstance';
import { DeliveryInfo as Address } from './deliveryApi'; // Address 타입을 재사용
import { ProductCardProps } from '../components/ProductCard'; // ProductCard 타입 재사용
import { Review } from './reviewApi'; // Review 타입 재사용


/** 기본 배송지 정보를 업데이트하는 API */
export const updateDefaultAddress = async (address: Address): Promise<void> => {
    await axiosInstance.put('/api/v1/users/me/address', address);
};

export interface UserProfile {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    ratingScore: number;
    reviewCount: number;
    salesCount: number;
    reviews: Review[];
    sellingProducts: ProductCardProps[];
}

export const fetchUserProfile = async (userId: number): Promise<UserProfile> => {
    const response = await axiosInstance.get(`/api/v1/users/${userId}/profile`);
    return response.data;
};