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
    senderPicture: string;
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

    const [isConnected, setIsConnected] = useState(false);

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
            if (!isLoggedIn) {
                // 이 페이지는 로그인이 필수이므로, 토큰이 없으면 로그인 페이지로 보내는 것이 더 나음
                alert("로그인이 필요한 서비스입니다.");
                navigate('/login');
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
                setIsConnected(true); // ★ 연결 성공
                client.subscribe(`/sub/chat/rooms/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages(prevMessages => [...prevMessages, receivedMessage]);
                });
            },
            onDisconnect: () => {
                console.log('Chat STOMP Disconnected!');
                setIsConnected(false); // ★ 연결 종료
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                setIsConnected(false); // ★ 에러 발생
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
    }, [roomId, accessToken, isLoggedIn, navigate]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected) {
            alert("서버와 연결 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        if (newMessage.trim() && stompClient.current?.active) {
            stompClient.current.publish({
                destination: `/pub/rooms/${roomId}/message`,
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ message: newMessage }),
            });
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isMyMessage = msg.senderId === userInfo?.id;
                    // 이전 메시지와 보낸 사람이 같은지 확인
                    const showSenderInfo = index === 0 || messages[index - 1].senderId !== msg.senderId;

                    return (
                        <div key={msg.messageId} className={`flex items-start gap-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            {!isMyMessage && (
                                <img
                                    src={msg.senderPicture.startsWith('http') ? msg.senderPicture : `${API_BASE_URL}${msg.senderPicture}`}
                                    alt={msg.senderName}
                                    className={`w-10 h-10 rounded-full object-cover ${showSenderInfo ? '' : 'invisible'}`}
                                />
                            )}
                            <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                {showSenderInfo && !isMyMessage && (
                                    <p className="text-sm font-semibold mb-1 ml-2">{msg.senderName}</p>
                                )}
                                <div className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMyMessage ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                        <p className="text-base break-words">{msg.message}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 flex-shrink-0">{new Date(msg.sentAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "메시지를 입력하세요..." : "서버에 연결 중입니다..."}
                    // ★ 연결되기 전에는 입력창 비활성화
                    disabled={!isConnected}
                    className="flex-1 border p-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                    type="submit"
                    // ★ 연결되기 전에는 버튼 비활성화
                    disabled={!isConnected}
                    className="bg-blue-500 text-white p-3 rounded-r-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                >
                    <PaperAirplaneIcon className="w-6 h-6"/>
                </button>
            </form>
        </div>
    );
};

export default ChatRoomPage;