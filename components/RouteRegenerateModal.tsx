"use client";

import { useState, useRef, useEffect } from 'react';
import { XCircle, Send, Loader2, RefreshCw, Check } from 'lucide-react';
import type { RouteProposal, Shop } from '@/lib/types';

interface ChatMessage {
    role: 'ai' | 'user';
    text: string;
}

interface RouteRegenerateModalProps {
    proposal: RouteProposal;
    onClose: () => void;
    onConfirm: (shops: Shop[], totalTravelTime: number) => void;
}

export default function RouteRegenerateModal({
    proposal,
    onClose,
    onConfirm,
}: RouteRegenerateModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'ai', text: '既存のルート提案を修正します！\nどのように変更したいですか？' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [latestShops, setLatestShops] = useState<Shop[] | null>(null);
    const [latestTotalTime, setLatestTotalTime] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = originalOverflow; };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const buildExistingProposalText = () => {
        const lines: string[] = [];
        lines.push(`エリア: ${proposal.areas?.join('、') || proposal.area || '不明'}`);
        lines.push(`時間: ${proposal.startTime || ''}〜${proposal.endTime || ''}`);
        lines.push(`店舗:`);
        proposal.shops.forEach((shop, i) => {
            lines.push(`  ${i + 1}. ${shop.time} ${shop.name} - ${shop.description}`);
            if (shop.travelTimeFromPrevious) {
                lines.push(`     (前の店から${shop.travelTimeFromPrevious}分)`);
            }
        });
        lines.push(`合計移動時間: ${proposal.totalTravelTime}分`);
        return lines.join('\n');
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', text }]);
        setInput('');
        setIsLoading(true);
        setLatestShops(null);
        setLatestTotalTime(null);

        try {
            const response = await fetch('/api/route-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: proposal.userId,
                    areas: proposal.areas || (proposal.area ? [proposal.area] : []),
                    stickerType: proposal.stickerType || '',
                    stickerDesign: proposal.stickerDesign || '',
                    startTime: proposal.startTime || '',
                    endTime: proposal.endTime || '',
                    preferredShops: proposal.preferredShops || [],
                    userPosts: [],
                    favorites: [],
                    userArea: proposal.area || '',
                    existingProposal: buildExistingProposalText(),
                    modificationRequest: text,
                }),
            });

            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            setLatestShops(data.shops || []);
            setLatestTotalTime(data.totalTravelTime || 0);
            setMessages(prev => [...prev, { role: 'ai', text: data.message || 'ルートを修正しました！' }]);
        } catch (error) {
            console.error('Regenerate error:', error);
            setMessages(prev => [...prev, { role: 'ai', text: '申し訳ございません、少し時間をおいて再度お試しください。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (latestShops && latestTotalTime !== null) {
            onConfirm(latestShops, latestTotalTime);
        }
    };

    const handleAnother = () => {
        setLatestShops(null);
        setLatestTotalTime(null);
        setMessages(prev => [...prev, { role: 'ai', text: '他にどのように変更したいですか？' }]);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm animate-in fade-in duration-200"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="bg-white w-full h-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 pt-safe border-b border-gray-100">
                    <h3 className="font-bold text-lg">ルート提案 by AI</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollable">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                    msg.role === 'user'
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-500">考え中...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Bottom Area */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-lg">
                    {latestShops && latestShops.length > 0 ? (
                        <div className="flex gap-3">
                            <button
                                onClick={handleAnother}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                別の提案をもらう
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                このルートで行く
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="変更内容を入力..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
