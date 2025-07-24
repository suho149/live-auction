// src/components/TrackingModal.tsx

import React, { useState, useEffect } from 'react';
import { fetchTrackingInfo, TrackingInfo } from '../api/deliveryApi';
import { XMarkIcon, TruckIcon } from '@heroicons/react/24/solid';

interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    trackingNumber: string | null;
}

const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose, trackingNumber }) => {
    const [info, setInfo] = useState<TrackingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 모달이 열리고, 운송장 번호가 있으며, 아직 데이터를 불러오지 않았을 때 API 호출
        if (isOpen && trackingNumber) {
            setLoading(true);
            setError(null);
            fetchTrackingInfo(trackingNumber)
                .then(data => {
                    setInfo(data);
                })
                .catch(err => {
                    setError("배송 정보를 조회할 수 없습니다.");
                    console.error(err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, trackingNumber]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* 모달 헤더 */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <TruckIcon className="w-6 h-6 mr-2 text-blue-500" />
                        배송 조회
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* 모달 컨텐츠 */}
                <div className="p-6 overflow-y-auto">
                    {loading && <p className="text-center">배송 정보를 조회 중입니다...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {info && (
                        <div className="space-y-6">
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md">
                                <div><span className="font-semibold text-gray-500">운송장 번호:</span> {info.trackingNumber}</div>
                                <div><span className="font-semibold text-gray-500">받는 분:</span> {info.recipientName}</div>
                                <div><span className="font-semibold text-gray-500">보내는 분:</span> {info.senderName}</div>
                                <div><span className="font-semibold text-gray-500">상품명:</span> {info.productName}</div>
                            </div>

                            {/* 배송 이력 테이블 */}
                            <div>
                                <h4 className="font-bold mb-2">배송 현황</h4>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">처리 시간</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">현재 위치</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">배송 상태</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상세 정보</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {info.history.map((detail, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(detail.time).toLocaleString()}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{detail.location}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        detail.status === '배달완료' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {detail.status}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{detail.description}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingModal;