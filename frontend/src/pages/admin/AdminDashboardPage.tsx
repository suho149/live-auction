// src/pages/admin/AdminDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import {
    fetchDashboardSummary,
    DashboardSummary,
    DailyStats,
    fetchDailySignups,
    fetchDailySales
} from '../../api/adminApi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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

    const [signupData, setSignupData] = useState<DailyStats[]>([]);
    const [salesData, setSalesData] = useState<DailyStats[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Promise.all을 사용하여 여러 API를 병렬로 호출
                const [summary, signups, sales] = await Promise.all([
                    fetchDashboardSummary(),
                    fetchDailySignups(),
                    fetchDailySales()
                ]);
                setSummary(summary);
                setSignupData(signups);
                setSalesData(sales);
            } catch (error) {
                alert("대시보드 정보 로딩 실패");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- 차트 데이터 가공 ---
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
    }).reverse();

    const chartData = (data: DailyStats[]) => {
        const dataMap = new Map(data.map(d => [d.date, d.value]));
        return last7Days.map(date => dataMap.get(date) || 0);
    };

    const signupChartData = {
        labels: last7Days,
        datasets: [{ label: '일일 가입자 수', data: chartData(signupData), backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
    };
    const salesChartData = {
        labels: last7Days,
        datasets: [{ label: '일일 거래액 (원)', data: chartData(salesData), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' }]
    };


    const chartOptions = {
        responsive: true, // 반응형
        plugins: {
            legend: {
                position: 'top' as const, // 범례 위치
            },
        },
        scales: {
            y: {
                beginAtZero: true, // y축이 0부터 시작하도록
                grace: '10%' // 최댓값의 10%만큼 여유 공간을 줌 (예: 최댓값이 1이면 1.1까지 표시)
            }
        }
    };

    // 2. 거래액 차트에만 적용할 특수 옵션 (원화 표시)
    const salesChartOptions = {
        ...chartOptions, // 공통 옵션 상속
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                ticks: {
                    // y축 눈금에 '원' 단위를 붙여주는 콜백 함수
                    callback: function(value: any) {
                        return value.toLocaleString() + '원';
                    }
                }
            }
        }
    };

    if (loading) return <div>대시보드 로딩 중...</div>;
    if (!summary) return <div>데이터를 불러올 수 없습니다.</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">대시보드</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold mb-4">최근 7일 가입 현황</h3>
                    <Bar options={chartOptions} data={signupChartData} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold mb-4">최근 7일 거래액 현황</h3>
                    <Line options={salesChartOptions} data={salesChartData} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;