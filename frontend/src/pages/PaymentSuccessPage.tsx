import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const confirmPayment = async () => {
            const paymentKey = searchParams.get('paymentKey');
            const orderId = searchParams.get('orderId');
            const amount = searchParams.get('amount');

            try {
                // 백엔드에 최종 결제 승인 요청
                await axiosInstance.post('/api/v1/payments/confirm', { paymentKey, orderId, amount: Number(amount) });
                alert("결제가 성공적으로 완료되었습니다!");
                navigate(`/`); // 성공 시 메인 페이지로
            } catch (error) {
                alert("결제 승인에 실패했습니다.");
                navigate(`/`); // 실패 시 메인 페이지로
            }
        };
        confirmPayment();
    }, [searchParams, navigate]);

    return <div>결제 승인 중...</div>;
};
export default PaymentSuccessPage;