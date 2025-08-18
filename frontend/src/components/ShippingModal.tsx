import React, {useEffect, useState} from 'react';
import { shipProduct, ShipRequest } from '../api/deliveryApi';

interface ShippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    deliveryId: number;
    productName: string;
    onSubmitSuccess: () => void;
}

// 스윗트래커에서 지원하는 주요 택배사 코드
const CARRIERS = [
    { id: "04", name: "CJ대한통운", testTrackingNumber: "644485324395" },
    { id: "01", name: "우체국택배", testTrackingNumber: "6067751999855" },
    { id: "05", name: "한진택배", testTrackingNumber: "104060287515" },
    { id: "06", name: "로젠택배", testTrackingNumber: "97116851334" },
    { id: "08", name: "롯데택배", testTrackingNumber: "505679412173" },
];

const ShippingModal: React.FC<ShippingModalProps> = ({ isOpen, onClose, deliveryId, productName, onSubmitSuccess }) => {
    const [carrierId, setCarrierId] = useState(CARRIERS[0].id); // 기본값 CJ대한통운
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 모달이 열릴 때마다 선택된 택배사에 맞는 운송장 번호를 설정합니다.
        if (isOpen) {
            const selectedCarrier = CARRIERS.find(c => c.id === carrierId);
            if (selectedCarrier) {
                setTrackingNumber(selectedCarrier.testTrackingNumber);
            }
        }
    }, [isOpen, carrierId]); // 모달이 열리거나, carrierId가 바뀔 때마다 실행

    const handleSubmit = async () => {
        if (!trackingNumber.trim()) {
            alert("운송장 번호를 입력해주세요.");
            return;
        }
        setIsSubmitting(true);
        try {
            const selectedCarrier = CARRIERS.find(c => c.id === carrierId);
            if (!selectedCarrier) return;

            const requestData: ShipRequest = {
                carrierId,
                carrierName: selectedCarrier.name,
                trackingNumber
            };

            await shipProduct(deliveryId, requestData);
            alert("발송 처리가 완료되었습니다.");
            onSubmitSuccess();
            onClose();
        } catch (error) {
            alert("발송 처리에 실패했습니다. 다시 시도해주세요.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">발송 정보 입력</h3>
                <p className="text-gray-600 mb-6">상품: <span className="font-semibold">{productName}</span></p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">택배사</label>
                        <select
                            id="carrier"
                            value={carrierId}
                            onChange={(e) => setCarrierId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {CARRIERS.map(carrier => (
                                <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700">운송장 번호</label>
                        <input
                            type="text"
                            id="trackingNumber"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            readOnly
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} disabled={isSubmitting} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-300">취소</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700">
                        {isSubmitting ? '처리 중...' : '발송 처리'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ShippingModal;