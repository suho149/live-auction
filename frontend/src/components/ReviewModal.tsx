// src/components/ReviewModal.tsx
import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { createReview, ReviewRequest } from '../api/reviewApi';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    onSubmitSuccess: () => void; // 리뷰 작성 성공 시 호출될 콜백
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, productId, productName, onSubmitSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async () => {
        if (comment.trim().length === 0) {
            alert("리뷰 내용을 입력해주세요.");
            return;
        }
        try {
            const reviewData: ReviewRequest = { rating, comment };
            await createReview(productId, reviewData);
            alert("리뷰가 성공적으로 등록되었습니다.");
            onSubmitSuccess(); // 성공 콜백 호출
            onClose(); // 모달 닫기
        } catch (error) {
            alert("리뷰 등록에 실패했습니다.");
            console.error(error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-2">"{productName}" 거래 리뷰 작성</h3>
                <div className="my-4">
                    <p className="font-medium mb-2">평점을 선택해주세요.</p>
                    <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <StarIcon
                                    key={starValue}
                                    className={`h-8 w-8 cursor-pointer ${
                                        starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHoverRating(starValue)}
                                    onMouseLeave={() => setHoverRating(0)}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="my-4">
                    <label htmlFor="comment" className="font-medium mb-2 block">리뷰 내용</label>
                    <textarea
                        id="comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="거래 경험을 공유해주세요."
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">취소</button>
                    <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-md">등록하기</button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;