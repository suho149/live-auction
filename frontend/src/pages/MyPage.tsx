import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import useAuthStore from '../hooks/useAuthStore';
import { API_BASE_URL } from '../api/axiosInstance';
import { fetchKeywords, addKeyword, deleteKeyword, Keyword } from '../api/keywordApi'; // ★ API 함수 import
import { XCircleIcon } from '@heroicons/react/24/solid';

const MyPage = () => {
    const { userInfo, fetchUserInfo, isLoggedIn } = useAuthStore();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        if (isLoggedIn && !userInfo) {
            fetchUserInfo();
        }
        if (isLoggedIn) {
            // 로그인 상태일 때 내 키워드 목록 불러오기
            fetchKeywords().then(setKeywords);
        }
    }, [isLoggedIn, userInfo, fetchUserInfo]);

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newKeyword.trim()) {
            try {
                const addedKeyword = await addKeyword(newKeyword);
                setKeywords(prev => [...prev, addedKeyword]); // 상태에 즉시 반영
                setNewKeyword(''); // 입력창 비우기
            } catch (error) {
                console.error("키워드 추가 실패:", error);
                alert("키워드 추가에 실패했습니다.");
            }
        }
    };

    const handleDeleteKeyword = async (keywordId: number) => {
        if (window.confirm("정말로 이 키워드를 삭제하시겠습니까?")) {
            try {
                await deleteKeyword(keywordId);
                setKeywords(prev => prev.filter(k => k.id !== keywordId)); // 상태에서 즉시 제거
            } catch (error) {
                console.error("키워드 삭제 실패:", error);
                alert("키워드 삭제에 실패했습니다.");
            }
        }
    };

    if (!userInfo) {
        return <div>로딩 중...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 max-w-4xl">
                <div className="flex items-center space-x-6 mb-12">
                    <img
                        src={userInfo.picture.startsWith('http') ? userInfo.picture : `${API_BASE_URL}${userInfo.picture}`}
                        alt="프로필 사진"
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                    />
                    <div>
                        <h1 className="text-4xl font-bold">{userInfo.name}</h1>
                        <p className="text-gray-600">{userInfo.email}</p>
                    </div>
                </div>

                {/* ★ 키워드 알림 설정 섹션 ★ */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">키워드 알림 설정</h2>
                    <p className="text-gray-600 mb-6">원하는 상품의 키워드를 등록하면, 해당 상품이 올라왔을 때 알림을 보내드립니다.</p>
                    <form onSubmit={handleAddKeyword} className="flex space-x-2 mb-6">
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="예: 닌텐도 스위치"
                            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700">
                            추가
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-3">
                        {keywords.map(k => (
                            <div key={k.id} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                                <span className="text-gray-800">{k.keyword}</span>
                                <button onClick={() => handleDeleteKeyword(k.id)} className="ml-2 text-gray-400 hover:text-gray-600">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyPage;