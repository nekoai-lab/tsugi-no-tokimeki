import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/routeProposalTypes';

const INITIAL_MESSAGE: ChatMessage = {
    role: 'ai',
    content: 'ルート提案を始めましょう！まず、どのエリアでシールを探しますか？複数選択できます。'
};

export function useRouteProposalChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    };

    const addUserMessage = (content: string) => {
        addMessage({ role: 'user', content });
    };

    const addAIMessage = (content: string) => {
        addMessage({ role: 'ai', content });
    };

    const resetMessages = (initialMessage?: string) => {
        setMessages([
            { role: 'ai', content: initialMessage || INITIAL_MESSAGE.content }
        ]);
    };

    return {
        messages,
        messagesEndRef,
        addUserMessage,
        addAIMessage,
        resetMessages,
    };
}


