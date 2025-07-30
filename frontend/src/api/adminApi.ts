// src/api/adminApi.ts

import axiosInstance from './axiosInstance';
import { Page } from './userApi';
import { ProductCardProps } from '../components/ProductCard';
import { ReportReason } from './reportApi';

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

export interface DashboardSummary {
    totalUsers: number;
    newUsersToday: number;
    totalProducts: number;
    onSaleProducts: number;
    totalSalesAmount: number;
    salesAmountToday: number;
    pendingSettlementsCount: number;
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
    const response = await axiosInstance.get('/api/v1/admin/dashboard/summary');
    return response.data;
};

/**
 * 일자별 통계 데이터 타입을 정의합니다.
 * 백엔드의 DailyStatsDto와 일치합니다.
 */
export interface DailyStats {
    date: string;  // "YYYY-MM-DD" 형식의 문자열
    value: number; // 집계된 값 (가입자 수 또는 거래액)
}

/**
 * 최근 7일간의 일자별 가입자 수 통계를 조회하는 API
 */
export const fetchDailySignups = async (): Promise<DailyStats[]> => {
    try {
        const response = await axiosInstance.get('/api/v1/admin/dashboard/daily-signups');
        return response.data;
    } catch (error) {
        console.error("일일 가입자 수 통계 로딩 실패:", error);
        return []; // 에러 발생 시 빈 배열을 반환하여 차트가 깨지지 않도록 함
    }
};

/**
 * 최근 7일간의 일자별 거래액 통계를 조회하는 API
 */
export const fetchDailySales = async (): Promise<DailyStats[]> => {
    try {
        const response = await axiosInstance.get('/api/v1/admin/dashboard/daily-sales');
        return response.data;
    } catch (error) {
        console.error("일일 거래액 통계 로딩 실패:", error);
        return []; // 에러 발생 시 빈 배열을 반환
    }
};

export interface Report {
    reportId: number; productId: number; productName: string;
    reporterId: number; reporterName: string; sellerId: number;
    sellerName: string; reason: ReportReason; detail: string; createdAt: string;
}

/** 처리 대기 중인 신고 목록 조회 */
export const fetchPendingReports = async (): Promise<Report[]> => {
    const response = await axiosInstance.get('/api/v1/admin/reports/pending');
    return response.data;
};

/** 신고 처리 (승인/기각) */
export const processReport = async (reportId: number, isAccepted: boolean): Promise<void> => {
    await axiosInstance.post(`/api/v1/admin/reports/${reportId}/process`, { isAccepted });
};