// src/api/adminApi.ts

import axiosInstance from './axiosInstance';
import { Page } from './userApi';
import { ProductCardProps } from '../components/ProductCard';

// 정산 요청 목록 응답 타입
export interface SettlementResponse {
    settlementId: number;
    sellerName: string;
    amount: number;
    requestedAt: string;
}

/** '정산 요청(PENDING)' 상태인 모든 정산 목록을 조회하는 API */
export const fetchPendingSettlements = async (): Promise<SettlementResponse[]> => {
    const response = await axiosInstance.get('/api/v1/admin/settlements/pending');
    return response.data;
};

/** 특정 정산 요청을 '완료' 처리하는 API */
export const completeSettlement = async (settlementId: number): Promise<void> => {
    await axiosInstance.post(`/api/v1/admin/settlements/${settlementId}/complete`);
};

export interface UserSummary {
    userId: number; email: string; name: string;
    role: 'USER' | 'ADMIN'; salesCount: number;
}

// 사용자 목록 조회 API
export const fetchAllUsers = async (page: number, name?: string | null, email?: string | null): Promise<Page<UserSummary>> => {
    const params = new URLSearchParams({
        page: String(page),
        // size: '10' // 페이지 크기를 고정하고 싶다면 추가
    });

    // 값이 존재할 때만 파라미터에 추가
    if (name) params.append('name', name);
    if (email) params.append('email', email);

    const response = await axiosInstance.get(`/api/v1/admin/users`, { params });
    return response.data;
};

// 상품 강제 삭제 API
export const forceDeleteProduct = async (productId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/admin/products/${productId}`);
};

export const grantAdminRole = async (userId: number): Promise<void> => {
    await axiosInstance.post(`/api/v1/admin/users/${userId}/grant-admin`);
};
export const revokeAdminRole = async (userId: number): Promise<void> => {
    await axiosInstance.post(`/api/v1/admin/users/${userId}/revoke-admin`);
};

/** [관리자] 모든 상품 목록을 페이징하여 조회 */
export const fetchAllProducts = async (params: URLSearchParams): Promise<Page<ProductCardProps>> => {
    const response = await axiosInstance.get(`/api/v1/admin/products?${params.toString()}`);
    return response.data;
};