import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import useAuthStore from '../hooks/useAuthStore';
import { API_BASE_URL } from '../api/axiosInstance';
import { Link } from 'react-router-dom';

// ★ API 함수 import
import { fetchPurchaseHistory, PurchaseHistory } from '../api/mypageApi';
import { fetchSaleHistory, SaleHistory } from '../api/mypageApi';
// 키워드 관련 컴포넌트는 별도로 분리하는 것이 좋습니다. 지금은 간단히 여기에 둡니다.
import { fetchKeywords, addKeyword, deleteKeyword, Keyword } from '../api/keywordApi';
import { XCircleIcon } from '@heroicons/react/24/solid';

// ★ 구매 내역을 표시할 컴포넌트
const PurchaseHistoryList = () => {
    const [history, setHistory] = useState<PurchaseHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getHistory = async () => {
            try {
                const data = await fetchPurchaseHistory();
                setHistory(data);
            } catch (error) {
                console.error("구매 내역을 불러오는 데 실패했습니다.", error);
            } finally {
                setLoading(false);
            }
        };
        getHistory();
    }, []);

    if (loading) return <p className="text-center p-4">로딩 중...</p>;
    if (history.length === 0) return <p className="text-center p-4">구매 내역이 없습니다.</p>;

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
                            <p className="text-sm text-gray-500">{new Date(item.purchasedAt).toLocaleDateString()}</p>
                            <p className="font-semibold text-lg text-gray-800">{item.productName}</p>
                            <p className="font-bold text-blue-600">{item.finalPrice.toLocaleString()}원</p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
};

// ★ 판매 내역을 표시할 컴포넌트
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

// ★ 키워드 관리 컴포넌트 (기존 로직을 별도 컴포넌트로 분리)
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


// ★ 메인 MyPage 컴포넌트
const MyPage = () => {
    const { userInfo } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'purchase' | 'sales' | 'keywords'>('purchase');

    if (!userInfo) return <div>로딩 중...</div>;

    const tabs = {
        purchase: { name: '구매 내역', component: <PurchaseHistoryList /> },
        sales: { name: '판매 내역', component: <SaleHistoryList /> },
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