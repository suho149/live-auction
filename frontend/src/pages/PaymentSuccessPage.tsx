// frontend/src/pages/PaymentSuccessPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'; // 아이콘 추가
import Header from '../components/Header';

// 백엔드에서 받을 성공 응답 DTO 타입
interface SuccessInfo {
    productName: string;
    amount: number;
    orderId: string;
}

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

    // API 처리 중복 실행을 막기 위한 ref
    const isProcessing = useRef(false);

    useEffect(() => {
        const confirmPayment = async () => {
            // 1. 이미 API 호출이 시작되었다면, 다시 실행하지 않고 종료
            if (isProcessing.current) {
                return;
            }
            // 2. API 호출 시작을 표시
            isProcessing.current = true;

            setLoading(true); // 로딩 상태 시작

            const paymentKey = searchParams.get('paymentKey');
            const orderId = searchParams.get('orderId');
            const amount = searchParams.get('amount');

            // 3. URL 파라미터 유효성 검사
            if (!paymentKey || !orderId || !amount) {
                setError("잘못된 결제 정보입니다. 필수 파라미터가 누락되었습니다.");
                setLoading(false);
                return;
            }

            try {
                // 4. 백엔드로 최종 결제 승인 요청
                const response = await axiosInstance.post<SuccessInfo>('/api/v1/payments/confirm', {
                    paymentKey,
                    orderId,
                    amount: Number(amount)
                });

                // 5. 성공 시, 백엔드로부터 받은 데이터를 상태에 저장
                setSuccessInfo(response.data);

            } catch (err: any) {
                // 6. 실패 시, 백엔드로부터 받은 에러 메시지를 상태에 저장
                const errorMessage = err.response?.data?.message || "결제 승인 처리 중 알 수 없는 오류가 발생했습니다.";
                setError(errorMessage);
            } finally {
                // 7. 성공/실패 여부와 관계없이 로딩 상태 종료
                setLoading(false);
            }
        };

        confirmPayment();

    }, [searchParams]); // 의존성 배열은 searchParams로 유지합니다.

    // 성공 후 3초 뒤에 메인 페이지로 이동하는 로직
    useEffect(() => {
        if (successInfo) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 3000);
            return () => clearTimeout(timer); // 컴포넌트가 사라질 때 타이머 정리
        }
    }, [successInfo, navigate]);


    // 화면에 표시될 컨텐츠를 결정하는 함수
    const renderContent = () => {
        if (loading) {
            return (
                <div>
                    <h2 className="text-2xl font-bold">결제 승인 중...</h2>
                    <p className="mt-4 text-gray-600">안전하게 결제를 처리하고 있습니다. 잠시만 기다려주세요.</p>
                </div>
            );
        }
        if (error) {
            return (
                <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-bold text-red-600 mb-2">결제 승인 실패</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        to="/"
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        메인으로 이동
                    </Link>
                </>
            );
        }
        if (successInfo) {
            return (
                <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
                    <p className="text-gray-600 mb-6">
                        구매해주셔서 감사합니다. 3초 후 메인 페이지로 이동합니다.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md text-left text-sm text-gray-700 border w-full">
                        <p className="font-semibold">주문 번호: <span className="font-normal">{successInfo.orderId}</span></p>
                        <p className="font-semibold mt-1">상품명: <span className="font-normal">{successInfo.productName}</span></p>
                        <p className="font-semibold mt-1">결제 금액: <span className="font-normal">{successInfo.amount.toLocaleString()}원</span></p>
                    </div>
                </>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-lg w-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default PaymentSuccessPage;