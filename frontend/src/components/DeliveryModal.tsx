// src/components/DeliveryModal.tsx

import React, { useState } from 'react';
import { updateDeliveryInfo, DeliveryInfo } from '../api/deliveryApi';

interface DeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentId: number;
    onSubmitSuccess: () => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, onClose, paymentId, onSubmitSuccess }) => {
    const [formData, setFormData] = useState<DeliveryInfo>({
        recipientName: '',
        recipientPhone: '',
        postalCode: '',
        mainAddress: '',
        detailAddress: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        // 간단한 유효성 검사
        for (const key in formData) {
            if (!formData[key as keyof DeliveryInfo]) {
                alert("모든 필드를 입력해주세요.");
                return;
            }
        }
        setIsSubmitting(true);
        try {
            await updateDeliveryInfo(paymentId, formData);
            alert("배송지 정보가 저장되었습니다.");
            onSubmitSuccess(); // 성공 콜백 호출하여 목록 새로고침
            onClose(); // 모달 닫기
        } catch (error) {
            alert("배송지 저장에 실패했습니다. 다시 시도해주세요.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">배송지 정보 입력</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">받는 사람</label>
                        <input type="text" id="recipientName" name="recipientName" value={formData.recipientName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="recipientPhone" className="block text-sm font-medium text-gray-700">연락처</label>
                        <input type="text" id="recipientPhone" name="recipientPhone" value={formData.recipientPhone} onChange={handleChange} placeholder="'-' 없이 숫자만 입력" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">우편번호</label>
                        <input type="text" id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="mainAddress" className="block text-sm font-medium text-gray-700">기본 주소</label>
                        <input type="text" id="mainAddress" name="mainAddress" value={formData.mainAddress} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="detailAddress" className="block text-sm font-medium text-gray-700">상세 주소</label>
                        <input type="text" id="detailAddress" name="detailAddress" value={formData.detailAddress} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} disabled={isSubmitting} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100">취소</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isSubmitting ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default DeliveryModal;