"use client";

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/routeProposalTypes';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                    }`}
            >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
        </div>
    );
}

