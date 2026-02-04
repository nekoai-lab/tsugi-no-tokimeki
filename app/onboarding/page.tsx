"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CHARACTERS, AREAS, POST_SHOPS, STICKER_TYPES } from '@/lib/utils';
import { Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { initializeLiff, getLineProfile, isLineLoggedIn } from '@/lib/liff';

// LINE公式アカウントの友達追加URL（lin.ee は友達追加画面、LIFF URLは挨拶メッセージで使用）
const LINE_FRIEND_ADD_URL = 'https://lin.ee/TexjI38b';

// ローディングコンポーネント
function OnboardingLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-pink-50">
            <div className="flex flex-col items-center">
                <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
                <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
            </div>
        </div>
    );
}

// メインページをSuspenseでラップしてエクスポート
export default function OnboardingPage() {
    return (
        <Suspense fallback={<OnboardingLoading />}>
            <OnboardingContent />
        </Suspense>
    );
}

// 実際のオンボーディングコンテンツ
function OnboardingContent() {
    const { user, userProfile, loading } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // URLパラメータから初期ステップを取得（LINE友達登録後の復帰用）
    const initialStep = parseInt(searchParams.get('step') || '1');
    const [step, setStep] = useState(initialStep);
    
    const [profile, setProfile] = useState<UserProfile>({
        favorites: [],
        area: '',
        areas: [],
        preferredShops: [],
        preferredStickerTypes: [],
        availability: {}
    });
    const [lineUserId, setLineUserId] = useState<string | null>(null);
    const [liffInitialized, setLiffInitialized] = useState(false);

    // LIFF初期化とLINEログイン状態の確認（1回だけ実行）
    const liffInitializedRef = useRef(false);
    useEffect(() => {
        // 既に初期化済みなら何もしない
        if (liffInitializedRef.current) {
            return;
        }
        liffInitializedRef.current = true;
        
        const initLiff = async () => {
            console.log('🔵 [LIFF] Starting initialization...');
            
            // step=2 の場合は LIFF 経由で戻ってきた可能性が高い
            // リダイレクトループを防ぐため、lineUserId取得のみ行う
            const urlStep = searchParams.get('step');
            if (urlStep === '2') {
                console.log('🔵 [LIFF] step=2 detected, simplified init to prevent loop');
                try {
                    const initialized = await initializeLiff();
                    setLiffInitialized(initialized);
                    if (initialized && isLineLoggedIn()) {
                        const lineProfile = await getLineProfile();
                        if (lineProfile) {
                            console.log('🔵 [LIFF] Got profile from step=2, userId:', lineProfile.userId.slice(0, 8) + '...');
                            setLineUserId(lineProfile.userId);
                        }
                    }
                } catch (error) {
                    console.warn('🔵 [LIFF] Init failed in step=2 mode:', error);
                }
                return; // step変更なし、ループ防止
            }
            
            try {
                // タイムアウト付きでLIFF初期化（5秒）
                const timeoutPromise = new Promise<boolean>((_, reject) => {
                    setTimeout(() => reject(new Error('LIFF init timeout')), 5000);
                });
                
                const initialized = await Promise.race([
                    initializeLiff(),
                    timeoutPromise
                ]).catch((err) => {
                    console.warn('🔵 [LIFF] Init failed or timeout:', err);
                    return false;
                });
                
                setLiffInitialized(initialized);
                console.log('🔵 [LIFF] Initialized:', initialized);
                
                if (initialized && isLineLoggedIn()) {
                    console.log('🔵 [LIFF] User is logged in, getting profile...');
                    const lineProfile = await getLineProfile();
                    if (lineProfile) {
                        console.log('🔵 [LIFF] Got profile, userId:', lineProfile.userId.slice(0, 8) + '...');
                        setLineUserId(lineProfile.userId);
                        // LINE連携済みの場合はStep 2から開始
                        setStep(2);
                    }
                } else {
                    console.log('🔵 [LIFF] Not logged in or init failed');
                }
            } catch (error) {
                console.error('🔵 [LIFF] Error:', error);
                setLiffInitialized(false);
            }
        };
        
        // Firebase Auth の初期化を待たずに並行してLIFF初期化
        initLiff();
    }, []); // 依存配列を空に - 1回だけ実行

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

    // LINE友達追加URLを開く
    const openLineFriendAdd = () => {
        // LINE友達追加ページを開く
        // 友達追加後、LIFFアプリ経由でこのページに戻ってくる
        window.open(LINE_FRIEND_ADD_URL, '_blank');
    };
    
    // LINE友達登録完了後にアプリに戻ってきた場合の処理
    const handleLineFriendAdded = async () => {
        // LIFF経由でlineUserIdを取得する場合はここで処理
        // 現在はスキップしてStep 2へ進む
        setStep(2);
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
                        <h2 className="text-lg font-bold mb-2 text-center">
                            <MessageCircle className="w-6 h-6 inline-block mr-2 text-[#06C755]" />
                            LINE通知を設定しよう
                        </h2>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            シールが見つかったときに<br />
                            LINEでお知らせします 🔔
                        </p>

                        {lineUserId ? (
                            <div className="text-center mb-6">
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-green-600 font-medium">
                                        ✓ LINE連携が完了しています
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                <button
                                    onClick={openLineFriendAdd}
                                    className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    LINE友達追加する
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <p className="text-xs text-center text-gray-400">
                                    別ウィンドウでLINEが開きます。<br />
                                    友達追加後、こちらに戻ってきてください。
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleLineFriendAdded}
                            className={`w-full py-3 rounded-xl font-bold transition-colors ${
                                lineUserId 
                                    ? 'bg-gray-800 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {lineUserId ? '次へ' : '友達追加したので次へ'}
                        </button>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-2 mt-2 text-gray-400 text-sm"
                        >
                            あとで設定する（スキップ）
                        </button>
                    </div>
                )}

                {step === 2 && (
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
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={profile.favorites.length === 0}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
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
                            <button onClick={() => setStep(2)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={(profile.areas || []).length === 0}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
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
                            <button onClick={() => setStep(4)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(6)}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-2 text-center">準備完了！</h2>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            設定が完了しました！<br />
                            さっそくシールを探しに行きましょう 🎉
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm">
                            <p className="font-medium text-gray-700 mb-2">あなたの設定:</p>
                            <ul className="space-y-1 text-gray-600">
                                <li>💖 キャラ: {profile.favorites.join(', ') || '未設定'}</li>
                                <li>📍 エリア: {(profile.areas || []).join(', ') || '未設定'}</li>
                                <li>🏪 店舗: {(profile.preferredShops || []).join(', ') || '未設定'}</li>
                                <li>🎀 シール: {(profile.preferredStickerTypes || []).slice(0, 3).join(', ')}{(profile.preferredStickerTypes || []).length > 3 ? '...' : ''}</li>
                                <li>🔔 LINE通知: {lineUserId ? '連携済み ✓' : '未連携'}</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(5)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => saveProfile()}
                                className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200"
                            >
                                はじめる ✨
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
