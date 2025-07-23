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
