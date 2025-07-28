import React, { useState, useEffect, useCallback } from 'react';
import { fetchPendingSettlements, completeSettlement, SettlementResponse } from '../../api/adminApi';

const AdminSettlementPage = () => {
    const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSettlements = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPendingSettlements();
            setSettlements(data);
        } catch (error) {
            console.error("정산 요청 목록을 불러오는 데 실패했습니다.", error);
            alert("목록을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettlements();
    }, [loadSettlements]);

    const handleComplete = async (settlementId: number) => {
        if (window.confirm(`정산 ID: ${settlementId}\n해당 정산 요청을 '완료' 처리하시겠습니까?`)) {
            try {
                await completeSettlement(settlementId);
                alert("성공적으로 처리되었습니다.");
                loadSettlements(); // 처리 후 목록을 새로고침
            } catch (error) {
                alert("처리 중 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">정산 요청 관리</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정산 ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 금액</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 일시</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={5} className="text-center py-4">로딩 중...</td></tr>
                    ) : settlements.length > 0 ? (
                        settlements.map(item => (
                            <tr key={item.settlementId}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.settlementId}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.sellerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.amount.toLocaleString()}원</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.requestedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => handleComplete(item.settlementId)}
                                        className="bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-green-600"
                                    >
                                        승인
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={5} className="text-center py-4">처리할 정산 요청이 없습니다.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSettlementPage;