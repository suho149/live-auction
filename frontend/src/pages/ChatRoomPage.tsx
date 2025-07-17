import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance';
import useAuthStore from '../hooks/useAuthStore'; // ★ zustand 스토어 import
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Header from '../components/Header';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

// 타입 정의
interface ChatMessage {
    messageId: number;
    senderId: number;
    senderName: string;
    message: string;
    sentAt: string;
}

const ChatRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    // ★ 스토어에서 필요한 상태와 액션을 가져옵니다.
    const { userInfo, accessToken, isLoggedIn, fetchUserInfo } = useAuthStore();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const stompClient = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // ★ 사용자 정보 로딩을 위한 useEffect
    useEffect(() => {
        // 로그인 상태이지만, 아직 userInfo가 없다면 가져옵니다.
        if (isLoggedIn && !userInfo) {
            fetchUserInfo();
        }
    }, [isLoggedIn, userInfo, fetchUserInfo]);

    // ★ 채팅방 연결 및 메시지 로딩을 위한 useEffect
    useEffect(() => {
        // 필수 정보(roomId, accessToken)가 없으면 연결을 시도하지 않습니다.
        if (!roomId || !accessToken) {
            if (!accessToken) {
                alert("로그인이 필요한 서비스입니다.");
                navigate('/login'); // 혹은 메인 페이지로
            }
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/chat/rooms/${roomId}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error("채팅 내역을 불러오는데 실패했습니다.", error);
            }
        };
        fetchMessages();

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-stomp`),
            connectHeaders: { Authorization: `Bearer ${accessToken}` },
            onConnect: () => {
                console.log('Chat STOMP Connected!');
                client.subscribe(`/sub/chat/rooms/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages(prevMessages => [...prevMessages, receivedMessage]);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current?.active) {
                stompClient.current.deactivate();
                console.log('Chat STOMP Disconnected!');
            }
        };
    }, [roomId, accessToken, navigate]); // 의존성 배열 수정

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && stompClient.current?.active) {
            stompClient.current.publish({
                destination: `/pub/chat/rooms/${roomId}/message`,
                body: JSON.stringify({ message: newMessage }),
            });
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.messageId} className={`flex items-end gap-2 ${msg.senderId === userInfo?.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== userInfo?.id && (
                            <img
                                src="https://placehold.co/32x32" // 상대방 프로필 사진 (나중에 실제 데이터로 교체)
                                alt={msg.senderName}
                                className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"
                            />
                        )}
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${msg.senderId === userInfo?.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                            {msg.senderId !== userInfo?.id && (
                                <p className="text-xs font-bold mb-1 text-gray-600">{msg.senderName}</p>
                            )}
                            <p className="text-base">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-75 text-right">{new Date(msg.sentAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border p-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-500 text-white p-3 rounded-r-md hover:bg-blue-600 transition-colors">
                    <PaperAirplaneIcon className="w-6 h-6"/>
                </button>
            </form>
        </div>
    );
};

export default ChatRoomPage;