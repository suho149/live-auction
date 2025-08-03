import React, { useState, useEffect, useCallback } from 'react';
import {fetchCompletedReports, fetchPendingReports, processReport, Report} from '../../api/adminApi';
import { Link } from 'react-router-dom';

const AdminReportPage = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            // 활성화된 탭에 따라 다른 API를 호출
            const fetchFunction = activeTab === 'pending' ? fetchPendingReports : fetchCompletedReports;
            const data = await fetchFunction();
            setReports(data);
        } catch (error) {
            alert("신고 목록 로딩에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [activeTab]); // activeTab이 변경될 때마다 이 함수가 재생성됨

    useEffect(() => {
        loadReports();
    }, [loadReports]); // loadReports 함수가 변경될 때 (즉, 탭이 바뀔 때) 목록을 다시 로드

    const handleProcess = async (reportId: number, isAccepted: boolean) => {
        const action = isAccepted ? '승인(상품 삭제)' : '기각';
        if (window.confirm(`신고 ID: ${reportId}\n해당 신고를 '${action}' 처리하시겠습니까?`)) {
            try {
                await processReport(reportId, isAccepted);
                alert("처리가 완료되었습니다.");
                loadReports(); // 처리 후 현재 탭 목록 새로고침
            } catch (error) {
                alert("처리 중 오류가 발생했습니다.");
            }
        }
    };

    const ReportTable = ({ data, isLoading }: { data: Report[], isLoading: boolean }) => {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고 ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고 사유</th>
                        {activeTab === 'completed' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리 상태</th>}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                        <tr><td colSpan={activeTab === 'completed' ? 6 : 5} className="text-center py-8">로딩 중...</td></tr>
                    ) : data.length === 0 ? (
                        <tr><td colSpan={activeTab === 'completed' ? 6 : 5} className="text-center py-8 text-gray-500">해당하는 신고 내역이 없습니다.</td></tr>
                    ) : data.map(report => (
                        <tr key={report.reportId}>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reportId}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                <Link to={`/products/${report.productId}`} target="_blank" className="hover:underline">{report.productName}</Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reporterName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reason}</td>
                            {activeTab === 'completed' && (
                                <td className="px-6 py-4 text-sm">
                                    <span className={`font-semibold ${report.status === 'ACCEPTED' ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.status === 'ACCEPTED' ? '승인됨' : '기각됨'}
                                    </span>
                                </td>
                            )}
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                {activeTab === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleProcess(report.reportId, true)}
                                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs font-semibold"
                                        >
                                            승인
                                        </button>
                                        <button
                                            onClick={() => handleProcess(report.reportId, false)}
                                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-semibold"
                                        >
                                            기각
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-gray-400">처리 완료</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">신고 관리</h2>

            {/* 탭 UI */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'pending'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        처리 대기
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'completed'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        처리 완료
                    </button>
                </nav>
            </div>

            {/* 현재 활성화된 탭에 맞는 테이블을 렌더링 */}
            <ReportTable data={reports} isLoading={loading} />
        </div>
    );
};

export default AdminReportPage;
