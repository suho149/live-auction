// src/api/userApi.ts
import axiosInstance from './axiosInstance';
import { DeliveryInfo as Address } from './deliveryApi'; // Address 타입을 재사용
import { ProductCardProps } from '../components/ProductCard'; // ProductCard 타입 재사용
import { Review } from './reviewApi'; // Review 타입 재사용


/** 기본 배송지 정보를 업데이트하는 API */
export const updateDefaultAddress = async (address: Address): Promise<void> => {
    await axiosInstance.put('/api/v1/users/me/address', address);
};

// Spring Page 객체 타입을 정의
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;         // 현재 페이지 번호 (0부터 시작)
    size: number;           // 페이지 크기
    first: boolean;         // 첫 페이지 여부
    last: boolean;          // ★ 마지막 페이지 여부 (이 속성 추가)
    empty: boolean;         // 현재 페이지가 비어있는지 여부
}

export interface UserProfile {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    ratingScore: number;
    reviewCount: number;
    salesCount: number;
    reviews: Review[];
    sellingProductsPage: Page<ProductCardProps>;
}

export const fetchUserProfile = async (userId: number, page: number = 0): Promise<UserProfile> => {
    // size는 6으로 고정
    const response = await axiosInstance.get(`/api/v1/users/${userId}/profile?page=${page}&size=6`);
    return response.data;
};