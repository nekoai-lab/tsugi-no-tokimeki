"use client";

import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { STICKER_TYPES, DEFAULT_POST_CHARACTERS, POST_SHOPS, PROFILE_AREAS } from '@/lib/utils';
import { XCircle, RefreshCw, Send, ChevronDown } from 'lucide-react';

interface PostModalProps {
  onClose: () => void;
}

/** ドロップダウン + カスタム入力 */
function SelectWithCustom({
  label,
  value,
  onChange,
  options,
  customPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  customPlaceholder: string;
}) {
  const [isCustom, setIsCustom] = useState(false);

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
      {!isCustom ? (
        <div className="relative">
          <select
            value={options.includes(value) ? value : ''}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustom(true);
                onChange('');
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__custom__">その他（入力する）</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={customPlaceholder}
            autoFocus
            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange(options[0]);
            }}
            className="px-3 text-xs text-gray-500 hover:text-gray-700"
          >
            一覧
          </button>
        </div>
      )}
    </div>
  );
}

/** 現在日時を 5分単位に丸めて "YYYY-MM-DDTHH:MM" 形式で返す */
function getNowRounded5(): string {
  const now = new Date();
  const minutes = Math.round(now.getMinutes() / 5) * 5;
  now.setMinutes(minutes, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function PostModal({ onClose }: PostModalProps) {
  const { user, userProfile } = useApp();

  // キャラクター候補: プロフィールのお気に入り + カスタム → デフォルト
  const characterOptions = useMemo(() => {
    const profileChars = userProfile?.favorites || [];
    const customChars = userProfile?.customCharacters || [];
    if (profileChars.length > 0 || customChars.length > 0) {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const c of [...profileChars, ...customChars, ...DEFAULT_POST_CHARACTERS]) {
        if (!seen.has(c)) { seen.add(c); result.push(c); }
      }
      return result;
    }
    return DEFAULT_POST_CHARACTERS;
  }, [userProfile?.favorites, userProfile?.customCharacters]);

  // 駅（エリア）候補: プロフィールのエリア → デフォルト
  const stationOptions = useMemo(() => {
    const profileAreas = userProfile?.areas && userProfile.areas.length > 0
      ? userProfile.areas
      : (userProfile?.area ? [userProfile.area] : []);
    const customAreas = userProfile?.customAreas || [];
    if (profileAreas.length > 0 || customAreas.length > 0) {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const a of [...profileAreas, ...customAreas, ...PROFILE_AREAS]) {
        if (!seen.has(a)) { seen.add(a); result.push(a); }
      }
      return result;
    }
    return PROFILE_AREAS;
  }, [userProfile?.areas, userProfile?.area, userProfile?.customAreas]);

  const [status, setStatus] = useState<'seen' | 'soldout'>('seen');
  const [character, setCharacter] = useState(characterOptions[0]);
  const [stickerType, setStickerType] = useState(STICKER_TYPES[0]);
  const [station, setStation] = useState(stationOptions[0]);
  const [shopName, setShopName] = useState(POST_SHOPS[0]);
  const [postDate, setPostDate] = useState(getNowRounded5());
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
        postDate,
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

          {/* Character */}
          <SelectWithCustom
            label="キャラクター"
            value={character}
            onChange={setCharacter}
            options={characterOptions}
            customPlaceholder="キャラ名を入力"
          />

          {/* Sticker type */}
          <SelectWithCustom
            label="シールの種類"
            value={stickerType}
            onChange={setStickerType}
            options={STICKER_TYPES}
            customPlaceholder="シールの種類を入力"
          />

          {/* Station */}
          <SelectWithCustom
            label="場所（駅）"
            value={station}
            onChange={setStation}
            options={stationOptions}
            customPlaceholder="駅名を入力"
          />

          {/* Shop */}
          <SelectWithCustom
            label="店名"
            value={shopName}
            onChange={setShopName}
            options={POST_SHOPS}
            customPlaceholder="店名を入力"
          />

          {/* DateTime */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">時間</label>
            <input
              type="datetime-local"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              step={300}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          {/* Detail text */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">詳細（任意）</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="詳細を教えてください（例：イオン3Fのにありました！残りわずかです。）"
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


