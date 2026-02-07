"use client";

import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    { text: '🔍 候補を集めています...', delay: 0 },
    { text: '🗺️ 条件に合うルートを作成中...', delay: 3000 },
    { text: '✨ 仕上げています...', delay: 6000 },
];

export function LoadingIndicator() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        
        LOADING_MESSAGES.forEach((msg, index) => {
            if (index > 0) {
                const timer = setTimeout(() => {
                    setMessageIndex(index);
                }, msg.delay);
                timers.push(timer);
            }
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, []);

    const currentMessage = LOADING_MESSAGES[messageIndex];

    return (
        <div className="sticky top-2 z-10 flex justify-center">
            <div className="bg-pink-500 text-white rounded-full px-5 py-3 shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm font-medium">{currentMessage.text}</span>
                </div>
            </div>
        </div>
    );
}

