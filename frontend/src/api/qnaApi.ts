// src/api/qnaApi.ts
import axiosInstance from './axiosInstance';

// 질문 목록 응답 타입
export interface QuestionResponse {
    questionId: number;
    authorName: string;
    content: string;
    answer: string | null;
    isPrivate: boolean;
    createdAt: string;
    answeredAt: string | null;
    canBeViewed: boolean;
}

// 질문 작성 요청 타입
export interface QuestionRequest {
    content: string;
    isPrivate: boolean;
}

// 답변 작성 요청 타입
export interface AnswerRequest {
    answer: string;
}

/** 특정 상품의 Q&A 목록을 조회하는 API */
export const fetchQuestions = async (productId: number): Promise<QuestionResponse[]> => {
    const response = await axiosInstance.get(`/api/v1/products/${productId}/qna`);
    return response.data;
};

/** 새로운 질문을 작성하는 API */
export const createQuestion = async (productId: number, data: QuestionRequest): Promise<void> => {
    await axiosInstance.post(`/api/v1/products/${productId}/qna`, data);
};

/** 특정 질문에 답변을 작성하는 API */
export const createAnswer = async (productId: number, questionId: number, data: AnswerRequest): Promise<void> => {
    await axiosInstance.post(`/api/v1/products/${productId}/qna/${questionId}/answer`, data);
};