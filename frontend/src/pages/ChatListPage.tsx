import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance, {API_BASE_URL} from '../api/axiosInstance';
import Header from '../components/Header';

interface ChatRoom {
    roomId: number;
    productName: string;
    opponentName: string;
    opponentPicture: string;
    lastMessage: string;
    lastMessageTime: string;
}

const ChatListPage = () => {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const response = await axiosInstance.get('/api/v1/chat/rooms');
                setChatRooms(response.data);
            } catch (error) {
                console.error("채팅방 목록을 불러오는 데 실패했습니다.", error);
            }
        };
        fetchChatRooms();
    }, []);

    const formatTime = (time: string | null) => {
        if (!time) return '';
        // 시간 포맷팅 로직 추가 (예: '오후 3:05')
        return new Date(time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-8">내 채팅 목록</h1>
                <div className="bg-white rounded-lg shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {chatRooms.length > 0 ? chatRooms.map(room => (
                            <li key={room.roomId}>
                                <Link to={`/chat/rooms/${room.roomId}`} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                                    <img src={room.opponentPicture.startsWith('http') ? room.opponentPicture : `${API_BASE_URL}${room.opponentPicture}`} alt={room.opponentName} className="w-12 h-12 rounded-full object-cover mr-4"/>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-lg">{room.opponentName}</p>
                                            <p className="text-xs text-gray-500">{formatTime(room.lastMessageTime)}</p>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{room.productName}: {room.lastMessage}</p>
                                    </div>
                                </Link>
                            </li>
                        )) : <p className="p-4 text-center text-gray-500">채팅 내역이 없습니다.</p>}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default ChatListPage;