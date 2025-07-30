import React, { useState } from 'react';
import { reportProduct, ReportReason, ReportRequest } from '../api/reportApi';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
}

// 백엔드 Enum과 매핑되는 한글 텍스트
const reasonMap: { [key in ReportReason]: string } = {
    SPAM: '스팸/홍보성 게시물',
    FRAUD: '사기 의심',
    INAPPROPRIATE: '음란물/욕설 등 부적절한 내용',
    IP_INFRINGEMENT: '지식재산권 침해',
    OTHER: '기타',
};

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, productId, productName }) => {
    const [reason, setReason] = useState<ReportReason>('SPAM');
    const [detail, setDetail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!detail.trim() && reason === 'OTHER') {
            alert("기타 사유를 선택한 경우, 상세 내용을 반드시 입력해야 합니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            const reportData: ReportRequest = { reason, detail };
            await reportProduct(productId, reportData);
            alert("신고가 정상적으로 접수되었습니다. 검토 후 처리하겠습니다.");
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || "신고 접수에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-2">"{productName}" 상품 신고</h3>
                <p className="text-sm text-gray-500 mb-6">신고 사유를 선택하고 상세 내용을 작성해주세요.</p>

                <div className="space-y-4">
                    {/* 신고 사유 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">신고 사유</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(reasonMap).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setReason(key as ReportReason)}
                                    className={`p-2 rounded-md text-sm border ${reason === key ? 'bg-blue-500 text-white border-blue-500' : 'bg-white hover:bg-gray-100'}`}
                                >
                                    {reasonMap[key as ReportReason]}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* 상세 내용 입력 */}
                    <div>
                        <label htmlFor="detail" className="block text-sm font-medium text-gray-700">상세 내용 (선택)</label>
                        <textarea
                            id="detail"
                            rows={4}
                            value={detail}
                            onChange={e => setDetail(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md"
                            placeholder="신고에 대한 구체적인 내용을 작성해주시면 처리에 도움이 됩니다."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-400"
                    >
                        {isSubmitting ? '접수 중...' : '신고하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;