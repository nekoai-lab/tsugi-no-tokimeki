"use client";

import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { STICKER_TYPES, DEFAULT_POST_CHARACTERS, POST_SHOPS, PROFILE_AREAS } from '@/lib/utils';
import { XCircle, RefreshCw, Send } from 'lucide-react';
import { ButtonSelect } from '@/components/shared/ButtonSelect';
import { CustomDatePicker } from '@/components/shared/CustomDatePicker';

interface PostModalProps {
  onClose: () => void;
}

/** 現在日付を取得 */
function getNowDate(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function PostModal({ onClose }: PostModalProps) {
  const { user, userProfile } = useApp();

  // キャラクター候補: プロフィールのお気に入り + カスタム。なければデフォルトを表示
  const characterOptions = useMemo(() => {
    const profileChars = userProfile?.favorites || [];
    const customChars = userProfile?.customCharacters || [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of [...profileChars, ...customChars]) {
      if (!seen.has(c)) { seen.add(c); result.push(c); }
    }
    // プロフィールに何もない場合はデフォルトを表示
    return result.length > 0 ? result : DEFAULT_POST_CHARACTERS;
  }, [userProfile?.favorites, userProfile?.customCharacters]);

  // 駅（エリア）候補: プロフィールのエリア + カスタム。なければデフォルトを表示
  const stationOptions = useMemo(() => {
    const profileAreas = userProfile?.areas && userProfile.areas.length > 0
      ? userProfile.areas
      : (userProfile?.area ? [userProfile.area] : []);
    const customAreas = userProfile?.customAreas || [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const a of [...profileAreas, ...customAreas]) {
      if (!seen.has(a)) { seen.add(a); result.push(a); }
    }
    // プロフィールに何もない場合はデフォルトを表示
    return result.length > 0 ? result : PROFILE_AREAS;
  }, [userProfile?.areas, userProfile?.area, userProfile?.customAreas]);

  // 店名候補: プロフィールの店名 + カスタム。なければデフォルトを表示
  const shopOptions = useMemo(() => {
    const profileShops = userProfile?.preferredShops || [];
    const customShops = userProfile?.customShops || [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of [...profileShops, ...customShops]) {
      if (!seen.has(s)) { seen.add(s); result.push(s); }
    }
    // プロフィールに何もない場合はデフォルトを表示
    return result.length > 0 ? result : POST_SHOPS;
  }, [userProfile?.preferredShops, userProfile?.customShops]);

  // シールの種類候補: プロフィールのシールの種類 + カスタム。なければデフォルトを表示
  const stickerTypeOptions = useMemo(() => {
    const profileTypes = userProfile?.preferredStickerTypes || [];
    const customTypes = userProfile?.customStickerTypes || [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of [...profileTypes, ...customTypes]) {
      if (!seen.has(t)) { seen.add(t); result.push(t); }
    }
    // プロフィールに何もない場合はデフォルトを表示
    return result.length > 0 ? result : STICKER_TYPES;
  }, [userProfile?.preferredStickerTypes, userProfile?.customStickerTypes]);

  const [status, setStatus] = useState<'seen' | 'soldout'>('seen');
  const [character, setCharacter] = useState(characterOptions[0]);
  const [stickerType, setStickerType] = useState(STICKER_TYPES[0]);
  const [station, setStation] = useState(stationOptions[0]);
  const [shopName, setShopName] = useState(POST_SHOPS[0]);
  const [postDate, setPostDate] = useState(getNowDate());
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
        uid: user.uid,
        text: text || '',
        status,
        character,
        stickerType,
        areaMasked: station || '不明',
        shopName,
        postDate: postDate,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (e) {
      console.error("Post error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-lg">情報をシェア</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status tabs (2 tabs) */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'seen' as const, label: 'あった' },
              { id: 'soldout' as const, label: '売り切れ' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  status === s.id
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Station */}
          <ButtonSelect
            label="場所（駅）"
            value={station}
            onChange={setStation}
            options={stationOptions}
          />

          {/* Shop */}
          <ButtonSelect
            label="店名"
            value={shopName}
            onChange={setShopName}
            options={shopOptions}
          />

          {/* Date */}
          <CustomDatePicker
            label="日付"
            value={postDate}
            onChange={setPostDate}
          />

          {/* Sticker type */}
          <ButtonSelect
            label="シールの種類"
            value={stickerType}
            onChange={setStickerType}
            options={stickerTypeOptions}
          />

          {/* Character */}
          <ButtonSelect
            label="キャラクター"
            value={character}
            onChange={setCharacter}
            options={characterOptions}
          />

          {/* Detail text */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              詳細（任意）{text.length > 0 && <span className="ml-2 text-xs text-gray-400">{text.length}/100文字</span>}
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setText(e.target.value);
                }
              }}
              placeholder="詳細を教えてください（例：イオン3Fのにありました！残りわずかです。）"
              maxLength={100}
              className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            投稿する
          </button>
        </div>
      </div>
    </div>
  );
}
