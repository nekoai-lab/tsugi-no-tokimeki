"use client";

import React from 'react';

export function LoadingIndicator() {
    return (
        <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">考えてるからちょっと待っててね...</span>
                </div>
            </div>
        </div>
    );
}

