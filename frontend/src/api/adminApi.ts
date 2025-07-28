// src/api/adminApi.ts

import axiosInstance from './axiosInstance';

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