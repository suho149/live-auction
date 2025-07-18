import axiosInstance from './axiosInstance';

export interface Keyword {
    id: number;
    keyword: string;
}

export const fetchKeywords = async (): Promise<Keyword[]> => {
    const response = await axiosInstance.get('/api/v1/keywords');
    return response.data;
};

export const addKeyword = async (keyword: string): Promise<Keyword> => {
    const response = await axiosInstance.post('/api/v1/keywords', { keyword });
    return response.data;
};

export const deleteKeyword = async (keywordId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/keywords/${keywordId}`);
};