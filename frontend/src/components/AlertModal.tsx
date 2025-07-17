import React from 'react';

// AlertModal이 받을 props 타입 정의
interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
    // isOpen이 false이면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        // 모달 배경 (어두운 반투명)
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {/* 모달 컨텐츠 */}
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default AlertModal;