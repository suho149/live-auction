import React, { useState, useEffect, useCallback } from 'react';
import { fetchPendingReports, processReport, Report } from '../../api/adminApi';
import { Link } from 'react-router-dom';

const AdminReportPage = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = useCallback(async () => {
        setLoading(true);
        try { setReports(await fetchPendingReports()); }
        catch (error) { alert("신고 목록 로딩 실패"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadReports(); }, [loadReports]);

    const handleProcess = async (reportId: number, isAccepted: boolean) => {
        const action = isAccepted ? '승인(상품 삭제)' : '기각';
        if (window.confirm(`신고 ID: ${reportId}\n해당 신고를 '${action}' 처리하시겠습니까?`)) {
            try {
                await processReport(reportId, isAccepted);
                alert("처리가 완료되었습니다.");
                loadReports();
            } catch (error) {
                alert("처리 중 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">신고 관리</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고 ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신고 사유</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세 내용</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-8">로딩 중...</td></tr>
                    ) : reports.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">처리 대기 중인 신고가 없습니다.</td></tr>
                    ) : reports.map(report => (
                        <tr key={report.reportId}>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reportId}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                <Link to={`/products/${report.productId}`} target="_blank" className="hover:underline">{report.productName}</Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reporterName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{report.reason}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={report.detail}>{report.detail}</td>
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
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
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReportPage;