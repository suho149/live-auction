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

export interface TrackingDetail {
    time: string;
    location: string;
    status: string;
    description: string;
}

export interface TrackingInfo {
    trackingNumber: string;
    senderName: string;
    recipientName: string;
    productName: string;
    history: TrackingDetail[];
}

export const fetchTrackingInfo = async (trackingNumber: string): Promise<TrackingInfo> => {
    const response = await axiosInstance.get(`/api/v1/deliveries/track/${trackingNumber}`);
    return response.data;
};

/** 구매 확정 API */
export const confirmPurchase = async (deliveryId: number): Promise<void> => {
    // 백엔드 DeliveryController에 deliveryId로 구매 확정하는 API가 있다고 가정
    // 예: @PostMapping("/deliveries/{deliveryId}/confirm")
    // PaymentId를 사용한다면 그에 맞게 수정
    await axiosInstance.post(`/api/v1/deliveries/${deliveryId}/confirm`);
};