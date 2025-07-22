import axiosInstance from './axiosInstance';

/** 내가 받은 리뷰 정보 타입 */
export interface Review {
    reviewId: number;
    reviewerName: string;
    rating: number;
    comment: string;
    productName: string;
    reviewWritten: boolean;
}

/** 리뷰 작성을 위한 데이터 타입 */
export interface ReviewRequest {
    rating: number;
    comment: string;
}

/** 내가 받은 리뷰 목록을 조회하는 API */
export const fetchMyReviews = async (): Promise<Review[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/reviews');
    return response.data;
};

/** 특정 상품 거래에 대해 리뷰를 작성하는 API */
export const createReview = async (productId: number, reviewData: ReviewRequest): Promise<void> => {
    await axiosInstance.post(`/api/v1/products/${productId}/reviews`, reviewData);
};

/** 내가 쓴 리뷰 목록을 조회하는 API */
export const fetchMyWrittenReviews = async (): Promise<Review[]> => {
    const response = await axiosInstance.get('/api/v1/users/me/reviews/written');
    return response.data;
};