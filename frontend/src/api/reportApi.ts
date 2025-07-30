import axiosInstance from './axiosInstance';

// 신고 사유 타입 (백엔드 Enum과 일치)
export type ReportReason = 'SPAM' | 'FRAUD' | 'INAPPROPRIATE' | 'IP_INFRINGEMENT' | 'OTHER';

// 신고 생성 요청 데이터 타입
export interface ReportRequest {
    reason: ReportReason;
    detail: string;
}

/** 상품을 신고하는 API */
export const reportProduct = async (productId: number, data: ReportRequest): Promise<void> => {
    await axiosInstance.post(`/api/v1/products/${productId}/report`, data);
};