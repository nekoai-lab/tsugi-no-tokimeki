"use client";

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { PROFILE_AREAS, PROFILE_CHARACTERS } from '@/lib/utils';
import ProfileEditModal from '@/components/ProfileEditModal';

function formatDisplayList(items: string[], max = 3): string {
    if (!items || items.length === 0) return '未設定';
    if (items.length <= max) return items.join('、');
    return `${items.slice(0, max).join('、')} 他${items.length - max}件`;
}

export default function ProfileScreen() {
    const { userProfile, user, signOut } = useApp();
    const [editingArea, setEditingArea] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState(false);

    // Current areas: combine legacy single area + new areas array
    const currentAreas = (() => {
        if (userProfile?.areas && userProfile.areas.length > 0) return userProfile.areas;
        if (userProfile?.area) return [userProfile.area];
        return [];
    })();

    const currentCustomAreas = userProfile?.customAreas || [];

    // Current characters: use favorites
    const currentCharacters = userProfile?.favorites || [];
    const currentCustomCharacters = userProfile?.customCharacters || [];

    const allAreas = [...currentAreas, ...currentCustomAreas];
    const allCharacters = [...currentCharacters, ...currentCustomCharacters];

    const handleSaveAreas = async (selected: string[], customItems: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            areas: selected,
            customAreas: customItems,
            area: selected[0] || customItems[0] || '', // backward compat
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleSaveCharacters = async (selected: string[], customItems: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            favorites: selected,
            customCharacters: customItems,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    // Build area options: profile areas first, then standard, plus saved custom items
    const areaOptions = (() => {
        const base = [...PROFILE_AREAS];
        // Add custom areas that aren't already in the standard list
        currentCustomAreas.forEach(a => {
            if (!base.includes(a)) base.push(a);
        });
        return base;
    })();

    const characterOptions = (() => {
        const base = [...PROFILE_CHARACTERS];
        currentCustomCharacters.forEach(c => {
            if (!base.includes(c)) base.push(c);
        });
        return base;
    })();

    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    🦄
                </div>
                <div>
                    <h2 className="font-bold text-lg">My Profile</h2>
                    <p className="text-xs text-gray-500">ID: {user?.uid?.slice(0, 6)}...</p>
                </div>
            </div>

            <div className="space-y-6">
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">設定中の条件</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setEditingArea(true)}
                            className="w-full p-3 border-b border-gray-50 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <div className="text-left">
                                <span className="text-sm text-gray-600">エリア</span>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">
                                    {formatDisplayList(allAreas)}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                        <button
                            onClick={() => setEditingCharacter(true)}
                            className="w-full p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-left flex-1">
                                    <span className="text-sm text-gray-600 block mb-2">お気に入りキャラ</span>
                                    <div className="flex flex-wrap gap-1">
                                        {allCharacters.length > 0 ? (
                                            allCharacters.map(f => (
                                                <span key={f} className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-md">{f}</span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">未設定</span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                            </div>
                        </button>
                    </div>
                </section>

                <button
                    onClick={signOut}
                    className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl mt-8"
                >
                    ログアウト
                </button>
            </div>

            <ProfileEditModal
                isOpen={editingArea}
                onClose={() => setEditingArea(false)}
                onSave={handleSaveAreas}
                title="エリアを選択"
                options={areaOptions}
                initialSelected={currentAreas}
                initialCustomItems={currentCustomAreas}
                customPlaceholder="エリア名を入力してください"
            />

            <ProfileEditModal
                isOpen={editingCharacter}
                onClose={() => setEditingCharacter(false)}
                onSave={handleSaveCharacters}
                title="お気に入りキャラを選択"
                options={characterOptions}
                initialSelected={currentCharacters}
                initialCustomItems={currentCustomCharacters}
                customPlaceholder="キャラ名を入力してください"
            />
        </div>
    );
}
