// src/pages/admin/AdminDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { fetchDashboardSummary, DashboardSummary } from '../../api/adminApi';

// 재사용 가능한 정보 카드 컴포넌트
const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
        {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
    </div>
);

const AdminDashboardPage = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const data = await fetchDashboardSummary();
                setSummary(data);
            } catch (error) {
                alert("대시보드 정보 로딩에 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        loadSummary();
    }, []);

    if (loading) return <div>대시보드 로딩 중...</div>;
    if (!summary) return <div>데이터를 불러올 수 없습니다.</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">대시보드</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 사용자 현황 */}
                <StatCard title="총 회원 수" value={summary.totalUsers} />
                <StatCard title="오늘 가입한 회원" value={summary.newUsersToday} description="오늘 0시 이후 가입" />

                {/* 상품 현황 */}
                <StatCard title="총 등록 상품 수" value={summary.totalProducts} />
                <StatCard title="현재 판매 중인 상품" value={summary.onSaleProducts} />

                {/* 거래 현황 */}
                <StatCard title="누적 거래액" value={`${summary.totalSalesAmount.toLocaleString()}원`} />
                <StatCard title="오늘 발생한 거래액" value={`${summary.salesAmountToday.toLocaleString()}원`} />

                {/* 운영 현황 */}
                <StatCard title="처리 대기 중인 정산" value={`${summary.pendingSettlementsCount} 건`} description="정산 관리 페이지에서 확인" />
            </div>
        </div>
    );
};

export default AdminDashboardPage;