"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CHARACTERS, AREAS, POST_SHOPS, STICKER_TYPES } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import LineLoginButton from '@/components/LineLoginButton';

export default function OnboardingPage() {
    const { user, userProfile, loading } = useApp();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<UserProfile>({
        favorites: [],
        area: '',
        areas: [],
        preferredShops: [],
        preferredStickerTypes: [],
        availability: {}
    });
    const [lineUserId, setLineUserId] = useState<string | null>(null);

    // Redirect if profile already exists
    useEffect(() => {
        if (!loading && user && userProfile) {
            router.push('/home');
        }
    }, [loading, user, userProfile, router]);

    const toggleFavorite = (char: string) => {
        setProfile(prev => ({
            ...prev,
            favorites: prev.favorites.includes(char)
                ? prev.favorites.filter(c => c !== char)
                : [...prev.favorites, char]
        }));
    };

    const toggleArea = (area: string) => {
        setProfile(prev => ({
            ...prev,
            areas: prev.areas?.includes(area)
                ? prev.areas.filter(a => a !== area)
                : [...(prev.areas || []), area],
            area: prev.areas?.includes(area)
                ? (prev.areas.filter(a => a !== area)[0] || '')
                : area // backward compatibility: set first selected as area
        }));
    };

    const toggleShop = (shop: string) => {
        setProfile(prev => ({
            ...prev,
            preferredShops: prev.preferredShops?.includes(shop)
                ? prev.preferredShops.filter(s => s !== shop)
                : [...(prev.preferredShops || []), shop]
        }));
    };

    const toggleStickerType = (type: string) => {
        setProfile(prev => ({
            ...prev,
            preferredStickerTypes: prev.preferredStickerTypes?.includes(type)
                ? prev.preferredStickerTypes.filter(t => t !== type)
                : [...(prev.preferredStickerTypes || []), type]
        }));
    };

    const saveProfile = async (skipLineConnect = false) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                ...profile,
                ...(lineUserId && { lineUserId }),
                updatedAt: serverTimestamp()
            });
            // Profile will be updated via Context, then redirect happens in useEffect
            router.push('/home');
        } catch (e) {
            console.error("Error saving profile", e);
        }
    };

    const handleLineLoginSuccess = (lineProfile: {
        userId: string;
        displayName: string;
        pictureUrl?: string;
    }) => {
        setLineUserId(lineProfile.userId);
    };

    if (loading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-pink-50">
                <div className="flex flex-col items-center">
                    <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
                    <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-pink-50 p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                    <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800">Tsugi no Tokimeki</h1>
                    <p className="text-gray-500 text-sm mt-2">次のトキメキを逃さないための<br />行動判断エージェント</p>
                </div>

                {step === 1 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">お気に入りのキャラを選んでね</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {CHARACTERS.map(char => (
                                <button
                                    key={char}
                                    onClick={() => toggleFavorite(char)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${profile.favorites.includes(char)
                                        ? 'bg-pink-500 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={profile.favorites.length === 0}
                            className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            次へ
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">よく行くエリアは？</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {AREAS.map(area => (
                                <button
                                    key={area}
                                    onClick={() => toggleArea(area)}
                                    className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${(profile.areas || []).includes(area)
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-transparent bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={(profile.areas || []).length === 0}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">よく行く店は？</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {POST_SHOPS.map(shop => (
                                <button
                                    key={shop}
                                    onClick={() => toggleShop(shop)}
                                    className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${(profile.preferredShops || []).includes(shop)
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-transparent bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {shop}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(4)}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">欲しいシールの種類は？</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto">
                            {STICKER_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleStickerType(type)}
                                    className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${(profile.preferredStickerTypes || []).includes(type)
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-transparent bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(3)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(5)}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-2 text-center">LINE通知を受け取る</h2>
                        <p className="text-xs text-center text-gray-400 mb-6">
                            LINEを連携すると、シールが見つかったときに<br />プッシュ通知でお知らせします 🔔
                        </p>

                        <div className="mb-6">
                            <LineLoginButton
                                onLoginSuccess={handleLineLoginSuccess}
                                className="w-full"
                            />
                            {lineUserId && (
                                <p className="text-center text-green-600 text-sm mt-3">
                                    ✓ LINE連携が完了しました！
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(4)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => saveProfile()}
                                className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200"
                            >
                                {lineUserId ? 'はじめる' : 'スキップして始める'}
                            </button>
                        </div>

                        {!lineUserId && (
                            <p className="text-center text-gray-400 text-xs mt-4">
                                あとからプロフィールで連携できます
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
