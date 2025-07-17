import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';

interface ChatRoom {
    roomId: number;
    productName: string;
    opponentName: string;
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

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">내 채팅 목록</h1>
                <div className="bg-white rounded-lg shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {chatRooms.map(room => (
                            <li key={room.roomId}>
                                <Link to={`/chat/rooms/${room.roomId}`} className="block p-4 hover:bg-gray-50">
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-lg">{room.opponentName}</p>
                                        <p className="text-sm text-gray-500">{room.productName}</p>
                                    </div>
                                    {/* <p className="text-sm text-gray-600 mt-1">마지막 메시지...</p> */}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default ChatListPage;