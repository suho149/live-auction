import React, {useState, useEffect, useCallback} from 'react';
import Header from '../components/Header';
import useAuthStore from '../hooks/useAuthStore';
import { API_BASE_URL } from '../api/axiosInstance';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import {fetchMyReviews, fetchMyWrittenReviews, Review} from '../api/reviewApi';
import DeliveryModal from '../components/DeliveryModal';

// API 함수 import
import { fetchPurchaseHistory, PurchaseHistory, DeliveryStatus } from '../api/mypageApi';
import { fetchSaleHistory, SaleHistory } from '../api/mypageApi';
import { fetchSettlementSummary, requestSettlement, fetchSettlementHistory, SettlementSummary, SettlementHistory } from '../api/mypageApi';
// 키워드 관련 컴포넌트는 별도로 분리하는 것이 좋습니다. 지금은 간단히 여기에 둡니다.
import { fetchKeywords, addKeyword, deleteKeyword, Keyword } from '../api/keywordApi';
import { XCircleIcon } from '@heroicons/react/24/solid';
import ReviewModal from '../components/ReviewModal';

// 구매 내역을 표시할 컴포넌트
const PurchaseHistoryList = () => {
    const [history, setHistory] = useState<PurchaseHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewTarget, setReviewTarget] = useState<{productId: number, productName: string} | null>(null);
    const [deliveryTarget, setDeliveryTarget] = useState<number | null>(null);

    const getHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPurchaseHistory();
            setHistory(data);
        } catch (error) {
            console.error("구매 내역 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getHistory();
    }, [getHistory]);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (history.length === 0) return <p className="text-center p-4">구매 내역이 없습니다.</p>;

    const renderActionButtons = (item: PurchaseHistory) => {
        const actions: { [key in DeliveryStatus]?: React.ReactNode } = {
            ADDRESS_PENDING: <button onClick={() => setDeliveryTarget(item.paymentId)} className="bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-orange-600">배송지 입력</button>,
            PENDING: <span className="text-sm text-gray-500 font-medium">배송 준비 중</span>,
            SHIPPING: <a href="#" className="bg-blue-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-blue-600">배송 조회</a>,
            COMPLETED: <span className="text-sm text-green-600 font-medium px-3 py-2">배송 완료</span>,
            CANCELED: <span className="text-sm text-red-500 font-medium px-3 py-2">주문 취소</span>,
        };
        return actions[item.deliveryStatus] || null;
    };

    return (
        <>
            <ul className="divide-y divide-gray-200">
                {history.map(item => (
                    <li key={item.paymentId} className="p-4"> {/* ★★★ key를 paymentId로 변경 ★★★ */}
                        <div className="flex justify-between items-center">
                            <Link to={`/products/${item.productId}`} className="flex items-center space-x-4 flex-grow">
                                <img
                                    src={item.productThumbnailUrl ? `${API_BASE_URL}${item.productThumbnailUrl}` : 'https://placehold.co/100x100?text=No+Image'}
                                    alt={item.productName}
                                    className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-gray-200"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">{new Date(item.purchasedAt).toLocaleDateString()}</p>
                                    <p className="font-semibold text-lg text-gray-800">{item.productName}</p>
                                    <p className="font-bold text-blue-600">{item.finalPrice.toLocaleString()}원</p>
                                </div>
                            </Link>

                            <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-2 w-32">
                                {/* 1. 배송 상태 표시 */}
                                {renderActionButtons(item)}

                                {/* 2. 리뷰 작성 버튼 (배송 완료 시에만 표시) */}
                                {item.deliveryStatus === 'COMPLETED' && (
                                    item.reviewWritten ?
                                        <button disabled className="bg-gray-300 text-white text-xs font-semibold px-2 py-1 rounded-md cursor-not-allowed w-full">작성 완료</button> :
                                        <button onClick={() => setReviewTarget({ productId: item.productId, productName: item.productName })} className="bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded-md hover:bg-gray-700 w-full">리뷰 쓰기</button>
                                )}
                            </div>
                        </div>
                        {item.trackingNumber && (
                            <p className="text-right text-xs mt-1 text-gray-500">운송장 번호: {item.trackingNumber}</p>
                        )}
                    </li>
                ))}
            </ul>

            {/* 모달 컴포넌트들 렌더링 */}
            <ReviewModal
                isOpen={!!reviewTarget}
                onClose={() => setReviewTarget(null)}
                productId={reviewTarget?.productId!}
                productName={reviewTarget?.productName!}
                onSubmitSuccess={getHistory}
            />
            <DeliveryModal
                isOpen={!!deliveryTarget}
                onClose={() => setDeliveryTarget(null)}
                paymentId={deliveryTarget!}
                onSubmitSuccess={getHistory}
            />
        </>
    );
};

// 판매 내역을 표시할 컴포넌트
const SaleHistoryList = () => {
    const [history, setHistory] = useState<SaleHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getHistory = async () => {
            try {
                const data = await fetchSaleHistory();
                setHistory(data);
            } catch (error) {
                console.error("판매 내역을 불러오는 데 실패했습니다.", error);
            } finally {
                setLoading(false);
            }
        };
        getHistory();
    }, []);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (history.length === 0) return <p className="text-center p-4">판매 내역이 없습니다.</p>;

    return (
        <ul className="divide-y divide-gray-200">
            {history.map(item => (
                <li key={item.productId} className="p-4 hover:bg-gray-50">
                    <Link to={`/products/${item.productId}`} className="flex items-center space-x-4">
                        <img
                            src={item.productThumbnailUrl ? `${API_BASE_URL}${item.productThumbnailUrl}` : 'https://placehold.co/100x100?text=No+Image'}
                            alt={item.productName}
                            className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-gray-200"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-500">{new Date(item.soldAt).toLocaleDateString()}</p>
                            <p className="font-semibold text-lg text-gray-800">{item.productName}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="font-bold text-blue-600">{item.finalPrice.toLocaleString()}원</p>
                                <p className="text-sm text-gray-600">구매자: {item.buyerName}</p>
                            </div>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
};

// 키워드 관리 컴포넌트 (기존 로직을 별도 컴포넌트로 분리)
const KeywordManager = () => {
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        fetchKeywords().then(setKeywords);
    }, []);

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newKeyword.trim()) {
            const added = await addKeyword(newKeyword);
            setKeywords(prev => [...prev, added]);
            setNewKeyword('');
        }
    };

    const handleDeleteKeyword = async (id: number) => {
        if (window.confirm("삭제하시겠습니까?")) {
            await deleteKeyword(id);
            setKeywords(prev => prev.filter(k => k.id !== id));
        }
    };

    return (
        <>
            <p className="text-gray-600 mb-6">원하는 상품의 키워드를 등록하면, 해당 상품이 올라왔을 때 알림을 보내드립니다.</p>
            <form onSubmit={handleAddKeyword} className="flex space-x-2 mb-6">
                <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="예: 닌텐도 스위치" className="flex-grow p-3 border rounded-md" />
                <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md">추가</button>
            </form>
            <div className="flex flex-wrap gap-3">
                {keywords.map(k => (
                    <div key={k.id} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                        <span>{k.keyword}</span>
                        <button onClick={() => handleDeleteKeyword(k.id)} className="ml-2 text-gray-400 hover:text-red-500"><XCircleIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
        </>
    );
};

// 정산 관리 컴포넌트
const SettlementManager = () => {
    const [summary, setSummary] = useState<SettlementSummary | null>(null);
    const [history, setHistory] = useState<SettlementHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const summaryData = await fetchSettlementSummary();
            const historyData = await fetchSettlementHistory();
            setSummary(summaryData);
            setHistory(historyData);
        } catch (error) {
            console.error("정산 정보를 불러오는 데 실패했습니다.", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRequestSettlement = async () => {
        if (summary && summary.availableSettlementAmount > 0) {
            if (window.confirm(`${summary.availableSettlementAmount.toLocaleString()}원을 정산 요청하시겠습니까?`)) {
                try {
                    await requestSettlement();
                    alert("정산 요청이 완료되었습니다. 관리자 확인 후 처리됩니다.");
                    fetchData(); // 데이터 새로고침
                } catch (error) {
                    alert("정산 요청에 실패했습니다.");
                }
            }
        }
    };

    const getStatusText = (status: SettlementHistory['status']) => {
        const statusMap = { PENDING: '대기중', COMPLETED: '정산완료', REJECTED: '거절됨' };
        return statusMap[status] || status;
    }

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (!summary) return <p className="text-center p-4">정보를 불러올 수 없습니다.</p>;

    return (
        <div>
            {/* 요약 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">총 판매액</p>
                    <p className="text-2xl font-bold">{summary.totalSalesAmount.toLocaleString()}원</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">정산 완료액</p>
                    <p className="text-2xl font-bold">{summary.totalSettledAmount.toLocaleString()}원</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-yellow-700">처리중인 금액</p>
                    <p className="text-2xl font-bold text-yellow-800">{summary.pendingSettlementAmount.toLocaleString()}원</p>
                </div>
                <div className="p-4 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-700">정산 가능액</p>
                    <p className="text-2xl font-bold text-green-800">{summary.availableSettlementAmount.toLocaleString()}원</p>
                </div>
            </div>

            {/* 정산 요청 버튼 */}
            <button
                onClick={handleRequestSettlement}
                disabled={summary.availableSettlementAmount <= 0}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                정산 요청하기
            </button>

            {/* 정산 내역 */}
            <h3 className="text-xl font-bold mt-12 mb-4">정산 요청 내역</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청금액</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리일</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {history.length > 0 ? history.map(item => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(item.requestedAt).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.amount.toLocaleString()}원</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold">{getStatusText(item.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="text-center py-4">정산 요청 내역이 없습니다.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// 내가 받은 리뷰를 표시할 컴포넌트
const MyReviewsList = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getReviews = async () => {
            try {
                setReviews(await fetchMyReviews());
            } finally {
                setLoading(false);
            }
        };
        getReviews();
    }, []);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (reviews.length === 0) return <p className="text-center p-4">받은 리뷰가 없습니다.</p>;

    return (
        <ul className="divide-y divide-gray-200">
            {reviews.map(review => (
                <li key={review.reviewId} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">{review.reviewerName}님의 리뷰</p>
                        <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-600 mb-2">"{review.comment}"</p>
                    <p className="text-right text-xs text-gray-400">- "{review.productName}" 거래</p>
                </li>
            ))}
        </ul>
    );
};

const MyWrittenReviewsList = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getReviews = async () => {
            try {
                // API 호출 함수만 변경
                setReviews(await fetchMyWrittenReviews());
            } finally {
                setLoading(false);
            }
        };
        getReviews();
    }, []);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (reviews.length === 0) return <p className="text-center p-4">작성한 리뷰가 없습니다.</p>;

    return (
        <ul className="divide-y divide-gray-200">
            {reviews.map(review => (
                <li key={review.reviewId} className="p-4">
                    {/* 내가 쓴 리뷰이므로 '누구에게' 썼는지를 보여주면 더 좋음. (백엔드 수정 필요) */}
                    {/* 지금은 기존 ReviewResponse를 재사용하므로, 받은 리뷰와 UI가 동일 */}
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">"{review.productName}" 거래에 대한 나의 리뷰</p>
                        <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-600 mb-2">"{review.comment}"</p>
                </li>
            ))}
        </ul>
    );
};

// 메인 MyPage 컴포넌트
const MyPage = () => {
    const { userInfo } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'purchase' | 'sales' | 'settlement' | 'writtenReviews' | 'reviews' | 'keywords'>('purchase');

    if (!userInfo) return <div>로딩 중...</div>;

    const tabs = {
        purchase: { name: '구매 내역', component: <PurchaseHistoryList /> },
        sales: { name: '판매 내역', component: <SaleHistoryList /> },
        settlement: { name: '정산 관리', component: <SettlementManager /> },
        writtenReviews: { name: '내가 쓴 리뷰', component: <MyWrittenReviewsList /> },
        reviews: { name: '내가 받은 리뷰', component: <MyReviewsList /> },
        keywords: { name: '키워드 알림', component: <KeywordManager /> },
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 max-w-4xl">
                <div className="flex items-center space-x-6 mb-12">
                    <img src={userInfo.picture.startsWith('http') ? userInfo.picture : `${API_BASE_URL}${userInfo.picture}`} alt="프로필" className="w-24 h-24 rounded-full shadow-lg"/>
                    <div>
                        <h1 className="text-4xl font-bold">{userInfo.name}</h1>
                        <p className="text-gray-600">{userInfo.email}</p>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {Object.entries(tabs).map(([key, tab]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as any)}
                                className={`${
                                    activeTab === key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* 선택된 탭의 컨텐츠 렌더링 */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">{tabs[activeTab].name}</h2>
                    {tabs[activeTab].component}
                </div>
            </main>
        </div>
    );
};

export default MyPage;