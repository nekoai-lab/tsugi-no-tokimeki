"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CHARACTERS, AREAS, STICKER_TYPES, PREFERRED_SHOPS } from '@/lib/utils';
import { Sparkles, MessageCircle, ExternalLink, Share2, CalendarDays, Bell, Clock, BookOpen } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { initializeLiff, getLineProfile, isLineLoggedIn } from '@/lib/liff';

// LINE公式アカウントの友達追加URL（lin.ee は友達追加画面、LIFF URLは挨拶メッセージで使用）
const LINE_FRIEND_ADD_URL = 'https://lin.ee/TexjI38b';

// 時間選択肢（10:00〜20:00）
const TIME_OPTIONS = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 10;
    return `${hour}:00`;
});

// LINE通知設定の内部ステップ番号
const LINE_STEP = 13;
// 確認画面の内部ステップ番号
const CONFIRM_STEP = 14;

// ローディングコンポーネント
function OnboardingLoading() {
    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center onboarding-bg">
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
// ステップ構成:
// Step 1: ウェルカム画面（自動遷移）
// Step 2: アプリ説明（自動遷移）
// Step 3: 機能紹介タイトル（自動遷移）
// Step 4: 機能紹介スライド（スワイプ式）
// Step 5: ユーザー情報入力開始（自動遷移）
// Step 6: シール種類選択
// Step 7: キャラ選択
// Step 8: エリア選択
// Step 9: 店舗選択
// Step 10: 時間指定
// Step 11: ありがとう画面（自動遷移）
// Step 12: LINE通知案内画面（自動遷移）
// Step 13: LINE通知設定（友達追加）
// Step 14: 確認＆保存
function OnboardingContent() {
    const { user, userProfile, loading } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();

    // URLパラメータから初期ステップを取得（LINE友達登録後の復帰用）
    // LIFF endpoint は step=5 で戻ってくる（外部設定のため変更不可）
    // 内部的に確認画面（CONFIRM_STEP）にマッピングし、自動保存＆遷移
    const urlStep = searchParams.get('step');
    const initialStep = urlStep === '5' ? CONFIRM_STEP : parseInt(urlStep || '1');
    const [step, setStep] = useState(initialStep);

    // スライダー用の状態
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<UserProfile>({
        favorites: [],
        area: '',
        areas: [],
        preferredShops: [],
        preferredStickerTypes: [],
        startTime: '10:00',
        endTime: '20:00',
        availability: {}
    });
    const [lineUserId, setLineUserId] = useState<string | null>(null);
    const [liffInitialized, setLiffInitialized] = useState(false);

    // 自動遷移ロジック（Step 1, 2, 3, 5, 11, 12）
    useEffect(() => {
        if ([1, 2, 3, 5, 11, 12].includes(step)) {
            const timer = setTimeout(() => {
                setStep(step + 1);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // スライダーのスクロール監視
    // step を依存配列に含めることで、Step 4 に遷移した時にリスナーを登録する
    useEffect(() => {
        if (step !== 4) return;
        const slider = sliderRef.current;
        if (!slider) return;

        const handleScroll = () => {
            const slideWidth = slider.offsetWidth;
            const scrollPosition = slider.scrollLeft;
            const newSlide = Math.round(scrollPosition / slideWidth);
            setCurrentSlide(newSlide);
        };

        slider.addEventListener('scroll', handleScroll);
        return () => slider.removeEventListener('scroll', handleScroll);
    }, [step]);

    // スライダーを次のスライドに移動
    // React state ではなく DOM の scrollLeft から現在位置を取得することで
    // PC ブラウザで scroll イベントが遅延した場合でも正しく動作する
    const goToNextSlide = () => {
        const slider = sliderRef.current;
        if (!slider) return;

        const slideWidth = slider.offsetWidth;
        if (slideWidth === 0) return;

        const currentPosition = slider.scrollLeft;
        const currentSlideIndex = Math.round(currentPosition / slideWidth);

        if (currentSlideIndex < 2) {
            const nextSlide = currentSlideIndex + 1;
            // インジケーターを即座に更新
            setCurrentSlide(nextSlide);
            slider.scrollTo({
                left: slideWidth * nextSlide,
                behavior: 'smooth'
            });
        } else {
            // 最後のスライドなら次のステップへ
            setStep(5);
        }
    };

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

            // step=5 の場合は LIFF 経由で戻ってきた可能性が高い
            // リダイレクトループを防ぐため、lineUserId取得のみ行い、stepは変更しない
            if (urlStep === '5') {
                console.log('🔵 [LIFF] step=5 detected (LIFF return), simplified init to prevent loop');
                try {
                    const initialized = await initializeLiff();
                    setLiffInitialized(initialized);
                    if (initialized && isLineLoggedIn()) {
                        const lineProfile = await getLineProfile();
                        if (lineProfile) {
                            console.log('🔵 [LIFF] Got profile from step=5, userId:', lineProfile.userId.slice(0, 8) + '...');
                            setLineUserId(lineProfile.userId);
                        }
                    }
                } catch (error) {
                    console.warn('🔵 [LIFF] Init failed in step=5 mode:', error);
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
                        // LINE連携済み＆LINE Stepにいる場合は確認画面へ
                        if (step === LINE_STEP) {
                            setStep(CONFIRM_STEP);
                        }
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
            // step=5 の場合でも、既存ユーザーはすぐに /home へ
            // lineUserId の保存は AppContext の自動LINE連携で行われる
            console.log('🔵 [Onboarding] User has profile, redirecting to /home');
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

    const saveProfile = useCallback(async () => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                ...profile,
                ...(lineUserId && { lineUserId }),
                updatedAt: serverTimestamp()
            });
            router.push('/home');
        } catch (e) {
            console.error("Error saving profile", e);
        }
    }, [user, profile, lineUserId, router]);

    // 確認画面（CONFIRM_STEP）の自動保存＆遷移
    useEffect(() => {
        if (step !== CONFIRM_STEP || !user) return;

        // 既存ユーザーの LIFF return: lineUserId のみ追記保存
        if (urlStep === '5' && userProfile) {
            if (!lineUserId) {
                // LIFF init 完了を待つ（タイムアウト: 8秒で /home へ）
                const fallback = setTimeout(() => {
                    router.push('/home');
                }, 8000);
                return () => clearTimeout(fallback);
            }
            // lineUserId 取得済み → 既存プロフィールに merge 保存して遷移
            const timer = setTimeout(async () => {
                try {
                    await setDoc(
                        doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'),
                        { lineUserId, updatedAt: serverTimestamp() },
                        { merge: true }
                    );
                } catch (e) {
                    console.error("Error updating lineUserId", e);
                }
                router.push('/home');
            }, 3000);
            return () => clearTimeout(timer);
        }

        // 新規ユーザーの LIFF return: lineUserId 取得を待ってからフル保存
        if (urlStep === '5' && !lineUserId) {
            const fallback = setTimeout(() => {
                saveProfile();
            }, 8000);
            return () => clearTimeout(fallback);
        }

        // 通常フロー or LIFF return で lineUserId 取得済み: 3秒後に保存
        const timer = setTimeout(() => {
            saveProfile();
        }, 3000);
        return () => clearTimeout(timer);
    }, [step, lineUserId, user, urlStep, saveProfile, userProfile, router]);

    // LINE友達追加URLを開く
    const openLineFriendAdd = () => {
        // LINE友達追加ページを開く
        // 友達追加後、LIFFアプリ経由でこのページに戻ってくる
        window.open(LINE_FRIEND_ADD_URL, '_blank');
    };

    // LINE友達登録完了後にアプリに戻ってきた場合の処理
    const handleLineFriendAdded = async () => {
        // LIFF経由でlineUserIdを取得する場合はここで処理
        // 確認画面へ進む
        setStep(CONFIRM_STEP);
    };

    // step=5 で戻ってきた場合、loading が長く続いたら強制的に /home へ
    useEffect(() => {
        if (urlStep === '5' && loading) {
            const timeout = setTimeout(() => {
                console.log('🔵 [Onboarding] Loading timeout on step=5, forcing redirect to /home');
                router.push('/home');
            }, 5000); // 5秒でタイムアウト
            return () => clearTimeout(timeout);
        }
    }, [urlStep, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex min-h-[100dvh] w-full items-center justify-center onboarding-bg">
                <div className="flex flex-col items-center">
                    <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
                    <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] onboarding-bg p-6 overflow-y-auto overflow-x-hidden">
            <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">

                {/* ヘッダー: 選択ステップ（6以降、自動遷移画面を除く）でのみ表示 */}
                {step >= 6 && step !== 11 && step !== 12 && step !== CONFIRM_STEP && (
                    <div className="mb-8 text-center">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800">Tsugi no Tokimeki</h1>
                    </div>
                )}

                {/* Step 1: ウェルカム画面（自動遷移） */}
                {step === 1 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <div className="animate-float-up">
                            <Sparkles className="w-16 h-16 text-pink-500 mx-auto mb-6" />
                        </div>
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            ようこそ！
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            Tsugi no Tokimekiへ！
                        </p>
                    </div>
                )}

                {/* Step 2: アプリ説明（自動遷移） */}
                {step === 2 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            このアプリは、シールを楽しみながら<br />
                            探しに行くためのアプリです。
                        </p>
                    </div>
                )}

                {/* Step 3: 機能紹介タイトル（自動遷移） */}
                {step === 3 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            主な機能は3つ
                        </p>
                    </div>
                )}

                {/* Step 4: 機能紹介スライド（スワイプ式） */}
                {step === 4 && (
                    <div className="w-full flex flex-col items-center justify-center overflow-hidden">
                        <div
                            ref={sliderRef}
                            className="slider-container w-full"
                        >
                            {/* スライド1: 共有機能 */}
                            <div className="slider-slide flex flex-col items-center justify-center text-center px-4">
                                <div className="bg-pink-100 p-6 rounded-full mb-6">
                                    <Share2 className="w-12 h-12 text-pink-500" />
                                </div>
                                <p className="text-base text-gray-700 leading-relaxed">
                                    シールを見つけたら<br />
                                    みんなに共有することができます。
                                </p>
                            </div>

                            {/* スライド2: AIスケジュール */}
                            <div className="slider-slide flex flex-col items-center justify-center text-center px-4">
                                <div className="bg-purple-100 p-6 rounded-full mb-6">
                                    <CalendarDays className="w-12 h-12 text-purple-500" />
                                </div>
                                <p className="text-base text-gray-700 leading-relaxed">
                                    AIが過去のデータを元に、その日の<br />
                                    最適なスケジュールを提案してくれます。
                                </p>
                            </div>

                            {/* スライド3: シール帳 */}
                            <div className="slider-slide flex flex-col items-center justify-center text-center px-4">
                                <div className="bg-green-100 p-6 rounded-full mb-6">
                                    <BookOpen className="w-12 h-12 text-green-500" />
                                </div>
                                <p className="text-base text-gray-700 leading-relaxed">
                                    みんなのシール帳を見ることができるます<br />
                                    ぜひ参考にしてみてください
                                </p>
                            </div>
                        </div>

                        {/* ドットインジケーター */}
                        <div className="flex gap-2 mt-8 mb-6">
                            {[0, 1, 2].map((index) => (
                                <div
                                    key={index}
                                    className={`dot-indicator ${currentSlide === index ? 'active' : ''}`}
                                />
                            ))}
                        </div>

                        {/* 次へボタン */}
                        <button
                            onClick={goToNextSlide}
                            className="w-full max-w-xs bg-gray-800 text-white py-3 rounded-xl font-bold"
                        >
                            次へ
                        </button>
                    </div>
                )}

                {/* Step 5: ユーザー情報入力開始（自動遷移） */}
                {step === 5 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <p className="text-lg text-gray-500 animate-float-up">
                            それでは、シールを探す前に
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            君のことを教えてね！
                        </p>
                    </div>
                )}

                {/* Step 6: シール種類選択 */}
                {step === 6 && (
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
                        <button
                            onClick={() => setStep(7)}
                            disabled={(profile.preferredStickerTypes || []).length === 0}
                            className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            次へ
                        </button>
                    </div>
                )}

                {/* Step 7: キャラ選択 */}
                {step === 7 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">お気に入りのキャラを選んでね</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {CHARACTERS.map(char => (
                                <button
                                    key={char}
                                    onClick={() => toggleFavorite(char)}
                                    className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${profile.favorites.includes(char)
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-transparent bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(6)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(8)}
                                disabled={profile.favorites.length === 0}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 8: エリア選択 */}
                {step === 8 && (
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
                            <button onClick={() => setStep(7)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(9)}
                                disabled={(profile.areas || []).length === 0}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 9: 店舗選択 */}
                {step === 9 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-4 text-center">よく行く店は？</h2>
                        <p className="text-xs text-center text-gray-400 mb-4">複数選択できます</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {PREFERRED_SHOPS.map(shop => (
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
                            <button onClick={() => setStep(8)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(10)}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 10: 時間指定 */}
                {step === 10 && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-2 text-center">
                            <Clock className="w-5 h-5 inline-block mr-1 text-pink-500" />
                            探しに行ける時間帯は？
                        </h2>
                        <p className="text-xs text-center text-gray-400 mb-6">お出かけできる時間帯を教えてね</p>

                        <div className="space-y-5 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">開始時間</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TIME_OPTIONS.filter(t => t < (profile.endTime || '20:00')).map(time => (
                                        <button
                                            key={`start-${time}`}
                                            onClick={() => setProfile(prev => ({ ...prev, startTime: time }))}
                                            className={`p-2 rounded-xl text-sm font-medium border-2 transition-all ${profile.startTime === time
                                                ? 'border-pink-500 bg-pink-50 text-pink-700'
                                                : 'border-transparent bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">終了時間</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TIME_OPTIONS.filter(t => t > (profile.startTime || '10:00')).map(time => (
                                        <button
                                            key={`end-${time}`}
                                            onClick={() => setProfile(prev => ({ ...prev, endTime: time }))}
                                            className={`p-2 rounded-xl text-sm font-medium border-2 transition-all ${profile.endTime === time
                                                ? 'border-pink-500 bg-pink-50 text-pink-700'
                                                : 'border-transparent bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(9)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
                            <button
                                onClick={() => setStep(11)}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 11: ありがとう画面（自動遷移） */}
                {step === 11 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            教えてくれてありがとう！
                        </p>
                    </div>
                )}

                {/* Step 12: LINE通知案内画面（自動遷移） */}
                {step === 12 && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <div className="animate-float-up">
                            <MessageCircle className="w-12 h-12 text-[#06C755] mx-auto mb-6" />
                        </div>
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up">
                            教えてくれたことを元に<br />
                            LINEで通知できるようにするね！
                        </p>
                    </div>
                )}

                {/* Step 13: LINE通知設定 */}
                {step === LINE_STEP && (
                    <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
                        <h2 className="text-lg font-bold mb-2 text-center">
                            <MessageCircle className="w-6 h-6 inline-block mr-2 text-[#06C755]" />
                            LINE通知を設定しよう
                        </h2>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            シールが見つかったときに<br />
                            LINEでお知らせします
                        </p>

                        {lineUserId ? (
                            <div className="text-center mb-4">
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-green-600 font-medium">
                                        ✓ LINE連携が完了しています
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-4">
                                <button
                                    onClick={openLineFriendAdd}
                                    className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    LINE友達追加する
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setStep(CONFIRM_STEP)}
                            className="w-full py-2 text-gray-400 text-sm"
                        >
                            あとで設定する（スキップ）
                        </button>
                    </div>
                )}

                {/* Step 14: 確認＆保存 */}
                {step === CONFIRM_STEP && (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                        <p className="text-lg text-gray-700 leading-relaxed animate-float-up px-4">
                            設定が完了しました！<br />
                            さっそくシールを探しに行きましょう 🎉
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
