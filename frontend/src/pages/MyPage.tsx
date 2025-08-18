import React, {useState, useEffect, useCallback} from 'react';
import Header from '../components/Header';
import useAuthStore from '../hooks/useAuthStore';
import { API_BASE_URL } from '../api/axiosInstance';
import {Link, useSearchParams} from 'react-router-dom';
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
import TrackingModal from "../components/TrackingModal";
import { confirmPurchase } from '../api/deliveryApi';
import { DeliveryInfo as Address } from '../api/deliveryApi';
import { updateDefaultAddress } from '../api/userApi';
import ShippingModal from '../components/ShippingModal';

// 구매 내역을 표시할 컴포넌트
const PurchaseHistoryList = () => {
    const [history, setHistory] = useState<PurchaseHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewTarget, setReviewTarget] = useState<{productId: number, productName: string} | null>(null);
    const [deliveryTarget, setDeliveryTarget] = useState<number | null>(null);
    const [trackingTarget, setTrackingTarget] = useState<string | null>(null);

    const [shippingTarget, setShippingTarget] = useState<{ deliveryId: number; productName: string; } | null>(null);

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

    // 구매 확정 핸들러 함수 추가
    const handleConfirmPurchase = async (deliveryId: number | null) => {
        if (!deliveryId) {
            alert("유효하지 않은 주문입니다.");
            return;
        }
        if (window.confirm("상품을 잘 받으셨나요? 구매를 확정하시면 거래가 종료되며, 판매자에게 정산이 진행됩니다.")) {
            try {
                await confirmPurchase(deliveryId);
                alert("구매가 확정되었습니다.");
                getHistory(); // 목록을 새로고침하여 '리뷰 쓰기' 버튼을 표시
            } catch (error) {
                alert("구매 확정에 실패했습니다.");
            }
        }
    };

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (history.length === 0) return <p className="text-center p-4">구매 내역이 없습니다.</p>;

    const renderActionButtons = (item: PurchaseHistory) => {
        switch (item.deliveryStatus) {
            case 'ADDRESS_PENDING':
                return <button onClick={() => setDeliveryTarget(item.paymentId)} className="w-full bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-orange-600">배송지 입력</button>;
            case 'PENDING':
                return <span className="w-full text-center text-sm text-gray-500 font-medium px-3 py-2">배송 준비 중</span>;
            case 'SHIPPING':
                return (
                    <div className="flex flex-col items-center space-y-1">
                        <button onClick={() => setTrackingTarget(item.trackingNumber!)} className="w-full bg-blue-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-blue-600">배송 조회</button>
                        <p className="text-xs text-gray-500">운송장 번호: {item.trackingNumber}</p>
                    </div>
                );
            case 'COMPLETED':
                return (
                    <div className="flex flex-col items-center space-y-1">
                        <button onClick={() => handleConfirmPurchase(item.deliveryId)} className="w-full bg-purple-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-purple-600">구매 확정</button>
                        <button onClick={() => setTrackingTarget(item.trackingNumber!)} className="text-xs text-gray-500 hover:text-blue-600">배송 조회</button>
                    </div>
                );
            case 'CONFIRMED':
                return (
                    <div className="flex flex-col items-center space-y-1">
                        {/* span을 div로 감싸고 text-center를 적용하여 버튼과 정렬을 맞춥니다. */}
                        <div className="w-full text-center">
                            <span className="text-sm text-green-600 font-medium px-3 py-2">거래 완료</span>
                        </div>
                        {/*/!* 운송장 번호 표시 로직은 유지합니다. *!/*/}
                        {/*{item.trackingNumber && (*/}
                        {/*    <p className="text-xs text-gray-500">운송장: {item.trackingNumber}</p>*/}
                        {/*)}*/}
                    </div>
                );
            case 'CANCELED':
                return <span className="w-full text-center text-sm text-red-500 font-medium px-3 py-2">주문 취소</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <ul className="divide-y divide-gray-200">
                {history.map(item => (
                    <li key={item.productId} className="p-4 flex justify-between items-center">
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

                        <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-2 w-40">
                            {/* 배송 상태에 따른 버튼/텍스트 */}
                            <div className="w-full">
                                {renderActionButtons(item)}
                            </div>

                            {/* 리뷰 작성 버튼 (거래 완료 시에만 표시) */}
                            {item.deliveryStatus === 'CONFIRMED' && (
                                item.reviewWritten ?
                                    <button disabled className="bg-gray-300 text-white text-xs font-semibold px-2 py-1 rounded-md cursor-not-allowed w-full">리뷰 작성 완료</button> :
                                    <button onClick={() => setReviewTarget({ productId: item.productId, productName: item.productName })} className="bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded-md hover:bg-gray-700 w-full">리뷰 쓰기</button>
                            )}
                        </div>
                        {/*{item.trackingNumber && (*/}
                        {/*    <p className="text-right text-xs mt-1 text-gray-500">운송장 번호: {item.trackingNumber}</p>*/}
                        {/*)}*/}
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
            <TrackingModal
                isOpen={!!trackingTarget}
                onClose={() => setTrackingTarget(null)}
                trackingNumber={trackingTarget}
            />
            <ShippingModal
                isOpen={!!shippingTarget}
                onClose={() => setShippingTarget(null)}
                deliveryId={shippingTarget?.deliveryId!}
                productName={shippingTarget?.productName!}
                onSubmitSuccess={getHistory}
            />
        </>
    );
};

// 판매 내역을 표시할 컴포넌트
const SaleHistoryList = () => {
    const [history, setHistory] = useState<SaleHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const [shippingTarget, setShippingTarget] = useState<{ deliveryId: number; productName: string; } | null>(null);

    const getHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSaleHistory();
            setHistory(data);
        } catch (error) {
            console.error("판매 내역을 불러오는 데 실패했습니다.", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getHistory();
    }, [getHistory]);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (history.length === 0) return <p className="text-center p-4">판매 내역이 없습니다.</p>;

    return (
        <>
            <ul className="divide-y divide-gray-200">
                {history.map(item => {
                    // history 배열의 각 'item'이 실제로 어떤 데이터를 가지고 있는지 확인합니다.
                    console.log("판매 내역 데이터:", item);

                    return (
                        <li key={item.productId} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <Link to={`/products/${item.productId}`} className="flex items-center space-x-4 flex-grow">
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
                                        {/*<p className="text-sm text-gray-600">구매자: {item.buyerName}</p>*/}
                                    </div>
                                </div>
                            </Link>

                            {/* 배송 상태 및 액션 버튼 추가 */}
                            <div className="ml-4 flex-shrink-0 flex flex-col items-end w-40 text-right space-y-1">
                                {/* 배송 상태 및 액션 버튼 */}
                                <div>
                                    {item.deliveryStatus === 'PENDING' && (
                                        <button
                                            onClick={() => setShippingTarget({ deliveryId: item.deliveryId!, productName: item.productName })}
                                            className="bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-green-600"
                                        >
                                            발송 처리
                                        </button>
                                    )}
                                    {item.deliveryStatus === 'SHIPPING' && <span className="text-sm text-blue-600 font-medium">배송 중</span>}
                                    {item.deliveryStatus === 'COMPLETED' && <span className="text-sm text-purple-600 font-medium">배송 완료</span>}
                                    {item.deliveryStatus === 'CONFIRMED' && <span className="text-sm text-gray-500 font-medium">거래 완료</span>}
                                    {item.deliveryStatus === 'ADDRESS_PENDING' && <span className="text-sm text-orange-500 font-medium">배송지 입력 대기중</span>}
                                </div>
                                {/* 구매자 정보 */}
                                <p className="text-sm text-gray-600">구매자: {item.buyerName}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* 발송 처리 모달 렌더링 */}
            <ShippingModal
                isOpen={!!shippingTarget}
                onClose={() => setShippingTarget(null)}
                deliveryId={shippingTarget?.deliveryId!}
                productName={shippingTarget?.productName!}
                onSubmitSuccess={getHistory} // 성공 시 목록 새로고침
            />
        </>
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

// 기본 배송지 관리 컴포넌트
const DefaultAddressManager = () => {
    const { userInfo, fetchUserInfo } = useAuthStore();

    // 1. useState의 초기값을 userInfo.defaultAddress에서 직접 가져오도록 수정
    //    컴포넌트가 처음 렌더링될 때, 스토어에 이미 주소 정보가 있다면 바로 폼을 채움
    const [address, setAddress] = useState<Address>(
        userInfo?.defaultAddress || {
            recipientName: '',
            recipientPhone: '',
            postalCode: '',
            mainAddress: '',
            detailAddress: ''
        }
    );
    const [isSaving, setIsSaving] = useState(false);

    // 2. useEffect는 스토어의 userInfo가 변경될 때마다(예: fetchUserInfo 호출 후)
    //    컴포넌트 내부의 address 상태를 동기화하는 역할을 담당
    useEffect(() => {
        if (userInfo?.defaultAddress) {
            setAddress(userInfo.defaultAddress);
        } else {
            // 사용자가 기본 주소를 삭제한 경우(기능 추가 시)를 대비해 폼을 비워줌
            setAddress({
                recipientName: '', recipientPhone: '', postalCode: '',
                mainAddress: '', detailAddress: ''
            });
        }
    }, [userInfo]); // 의존성 배열은 userInfo 객체 그대로 유지

    // 3. input 변경 핸들러 (변경 없음)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    // 4. 카카오 주소 검색 로직 (변경 없음)
    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: function(data: any) {
                setAddress(prev => ({
                    ...prev,
                    postalCode: data.zonecode,
                    mainAddress: data.address,
                }));
            }
        }).open();
    };

    // 5. 저장 핸들러 (await fetchUserInfo() 추가)
    const handleSave = async () => {
        // 간단한 유효성 검사
        if (Object.values(address).some(value => !value)) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        setIsSaving(true);
        try {
            await updateDefaultAddress(address);
            alert("기본 배송지가 저장되었습니다.");

            // ★ await를 사용하여 스토어 업데이트가 완료될 때까지 기다림
            await fetchUserInfo();
        } catch (error) {
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-gray-600 mb-6">상품 구매 시 자동으로 입력될 기본 배송지 정보입니다.</p>

            {/* 받는 사람 */}
            <div>
                <label htmlFor="default-recipientName" className="block text-sm font-medium text-gray-700">받는 사람</label>
                <input type="text" id="default-recipientName" name="recipientName" value={address.recipientName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>

            {/* 연락처 */}
            <div>
                <label htmlFor="default-recipientPhone" className="block text-sm font-medium text-gray-700">연락처</label>
                <input type="text" id="default-recipientPhone" name="recipientPhone" value={address.recipientPhone} onChange={handleChange} placeholder="'-' 없이 숫자만 입력" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>

            {/* 우편번호 */}
            <div>
                <label htmlFor="default-postalCode" className="block text-sm font-medium text-gray-700">우편번호</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                        type="text"
                        name="postalCode"
                        id="default-postalCode"
                        value={address.postalCode}
                        onChange={handleChange}
                        readOnly
                        className="block w-full flex-1 rounded-none rounded-l-md bg-gray-100 px-3 py-2 border-gray-300"
                        placeholder="주소 검색"
                    />
                    <button
                        type="button"
                        onClick={handleAddressSearch}
                        className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        주소 검색
                    </button>
                </div>
            </div>

            {/* 기본 주소 */}
            <div>
                <label htmlFor="default-mainAddress" className="block text-sm font-medium text-gray-700">기본 주소</label>
                <input type="text" id="default-mainAddress" name="mainAddress" value={address.mainAddress} onChange={handleChange} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"/>
            </div>

            {/* 상세 주소 */}
            <div>
                <label htmlFor="default-detailAddress" className="block text-sm font-medium text-gray-700">상세 주소</label>
                <input type="text" id="default-detailAddress" name="detailAddress" value={address.detailAddress} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>

            {/* 저장 버튼 */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex justify-center mt-6 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isSaving ? "저장 중..." : "기본 배송지로 저장"}
            </button>
        </div>
    );
};

// 메인 MyPage 컴포넌트
const MyPage = () => {
    const { userInfo } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialTab = searchParams.get('tab') || 'purchase';
    const [activeTab, setActiveTab] = useState(initialTab);

    if (!userInfo) return <div>로딩 중...</div>;

    const handleTabClick = (tabKey: string) => {
        setActiveTab(tabKey);
        setSearchParams({ tab: tabKey });
    };

    const tabs = {
        purchase: { name: '구매 내역', component: <PurchaseHistoryList /> },
        sales: { name: '판매 내역', component: <SaleHistoryList /> },
        settlement: { name: '정산 관리', component: <SettlementManager /> },
        writtenReviews: { name: '내가 쓴 리뷰', component: <MyWrittenReviewsList /> },
        reviews: { name: '내가 받은 리뷰', component: <MyReviewsList /> },
        keywords: { name: '키워드 알림', component: <KeywordManager /> },
        address: { name: '기본 배송지', component: <DefaultAddressManager /> },
    };

    // 현재 활성화된 탭에 해당하는 컴포넌트를 변수에 할당
    const ActiveTabComponent = tabs[activeTab as keyof typeof tabs]?.component || <PurchaseHistoryList />;
    const activeTabName = tabs[activeTab as keyof typeof tabs]?.name || '구매 내역';

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 max-w-4xl">
                {/* 프로필 정보 */}
                <div className="flex items-center space-x-6">
                    <img src={userInfo.picture.startsWith('http') ? userInfo.picture : `${API_BASE_URL}${userInfo.picture}`} alt="프로필" className="w-24 h-24 rounded-full shadow-lg"/>
                    <div>
                        <h1 className="text-4xl font-bold">{userInfo.name}</h1>
                        <p className="text-gray-600">{userInfo.email}</p>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {Object.entries(tabs).map(([key, tab]) => (
                            <button
                                key={key}
                                onClick={() => handleTabClick(key)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base ${
                                    activeTab === key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* 선택된 탭의 컨텐츠 렌더링 */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6">{activeTabName}</h2>
                    {ActiveTabComponent}
                </div>
            </main>
        </div>
    );
};

export default MyPage;