import axiosInstance from './axiosInstance';

export interface DeliveryInfo {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    mainAddress: string;
    detailAddress: string;
}

/** 배송지 정보를 업데이트(생성/수정)하는 API */
export const updateDeliveryInfo = async (paymentId: number, data: DeliveryInfo): Promise<void> => {
    await axiosInstance.post(`/api/v1/payments/${paymentId}/delivery-info`, data);
};

// 1. 판매자가 발송 처리를 위해 보낼 데이터 타입
export interface ShipRequest {
    carrierId: string;
    carrierName: string;
    trackingNumber: string;
}

// 2. 판매자가 발송 처리를 요청하는 새로운 API 함수
export const shipProduct = async (deliveryId: number, data: ShipRequest): Promise<void> => {
    await axiosInstance.post(`/api/v1/deliveries/${deliveryId}/ship`, data);
};

// 3. 배송 조회 API 함수
export const fetchTrackingInfo = async (trackingNumber: string): Promise<TrackingInfo> => {
    const response = await axiosInstance.get(`/api/v1/deliveries/track/${trackingNumber}`);
    return response.data;
};

// 4. TrackingInfo 인터페이스 수정 (carrierName 추가)
export interface TrackingInfo {
    trackingNumber: string;
    carrierName: string; // 택배사 이름 필드 추가
    senderName: string;
    recipientName: string;
    productName: string;
    history: TrackingDetail[];
}

export interface TrackingDetail {
    time: string;
    location: string;
    status: string;
    description: string;
}

/** 구매 확정 API */
export const confirmPurchase = async (deliveryId: number): Promise<void> => {
    // 백엔드 DeliveryController에 deliveryId로 구매 확정하는 API가 있다고 가정
    // 예: @PostMapping("/deliveries/{deliveryId}/confirm")
    // PaymentId를 사용한다면 그에 맞게 수정
    await axiosInstance.post(`/api/v1/deliveries/${deliveryId}/confirm`);
};