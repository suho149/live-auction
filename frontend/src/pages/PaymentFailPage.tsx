import React from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const PaymentFailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 토스페이먼츠에서 실패 시 전달하는 쿼리 파라미터들
    const errorCode = searchParams.get('code');
    const errorMessage = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    // orderId에서 productId를 추출 (우리 시스템의 orderId 형식: "order_{productId}_{timestamp}")
    const productId = orderId ? orderId.split('_')[1] : null;

    // 결제 재시도 핸들러
    const handleRetryPayment = () => {
        if (productId) {
            // 상품 상세 페이지로 돌아가서 사용자가 다시 '결제하기' 버튼을 누르도록 유도
            navigate(`/products/${productId}`);
        } else {
            // productId 정보가 없으면 메인으로
            navigate('/');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-lg">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
                    <p className="text-gray-600 mb-6">
                        결제를 완료하지 못했습니다. 아래 오류 메시지를 확인해주세요.
                    </p>

                    {/* 에러 메시지 표시 영역 */}
                    <div className="bg-red-50 p-4 rounded-md text-left text-sm text-red-700">
                        <p><strong>오류 코드:</strong> {errorCode || '정보 없음'}</p>
                        <p><strong>오류 메시지:</strong> {errorMessage || '알 수 없는 오류가 발생했습니다.'}</p>
                    </div>

                    {/* 다음 행동을 위한 버튼들 */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        {productId && (
                            <button
                                onClick={handleRetryPayment}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                결제 다시 시도하기
                            </button>
                        )}
                        <Link
                            to="/"
                            className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            메인으로 이동
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentFailPage;