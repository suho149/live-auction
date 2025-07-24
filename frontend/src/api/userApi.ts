// src/api/userApi.ts
import axiosInstance from './axiosInstance';
import { DeliveryInfo as Address } from './deliveryApi'; // Address 타입을 재사용

/** 기본 배송지 정보를 업데이트하는 API */
export const updateDefaultAddress = async (address: Address): Promise<void> => {
    await axiosInstance.put('/api/v1/users/me/address', address);
};