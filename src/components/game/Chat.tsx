"use client";

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
    code: string;
    canChat: boolean;
    playerName: string;
}

interface Message {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export default function Chat({ code, canChat, playerName }: ChatProps) {
    const socket = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: Message) => {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

        socket.on('chat_message', handleMessage);

        return () => {
            socket.off('chat_message', handleMessage);
        };
    }, [socket]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !canChat) return;

        socket?.emit('send_chat', { code, message: input });
        setInput('');
    };

    return (
        <div className="flex flex-col h-[300px] md:h-[400px] bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-bold text-white/80">Village Chat</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-white/20 text-sm mt-10">
                        No messages yet. Start the discussion!
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.senderName === playerName ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-white/40 mb-1 px-1">{msg.senderName}</span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.senderName === playerName
                                ? 'bg-purple-600/80 text-white rounded-tr-none'
                                : 'bg-white/10 text-white/90 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={canChat ? "Type a message..." : "Chat disabled during night"}
                    disabled={!canChat}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 text-sm"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || !canChat}
                    className="p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
