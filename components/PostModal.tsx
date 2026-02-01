"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { CHARACTERS, STICKER_TYPES } from '@/lib/utils';
import { XCircle, RefreshCw, Send, MapPin } from 'lucide-react';

interface PostModalProps {
  onClose: () => void;
}

export default function PostModal({ onClose }: PostModalProps) {
  const { user, userProfile } = useApp();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'seen' | 'bought' | 'soldout'>('seen');
  const [character, setCharacter] = useState(userProfile?.favorites?.[0] || CHARACTERS[0]);
  const [stickerType, setStickerType] = useState(STICKER_TYPES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
        uid: user.uid,
        text,
        status,
        character,
        stickerType,
        areaMasked: userProfile?.area || '不明',
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">情報をシェア</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><XCircle className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          {/* Status Select */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            {[
              { id: 'seen' as const, label: '👀 見た', activeClass: 'bg-white text-blue-600 shadow-sm' },
              { id: 'bought' as const, label: '🛍 買えた', activeClass: 'bg-white text-green-600 shadow-sm' },
              { id: 'soldout' as const, label: '😢 売り切れ', activeClass: 'bg-white text-red-600 shadow-sm' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                  status === s.id ? s.activeClass : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <select 
              value={character} onChange={(e) => setCharacter(e.target.value)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              {CHARACTERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={stickerType} onChange={(e) => setStickerType(e.target.value)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              {STICKER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="詳細を教えてください（例：3Fのガチャコーナーにありました！残りわずかです。）"
            className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
          />

          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <MapPin className="w-3 h-3" />
            <span>位置情報は「{userProfile?.area}」周辺として丸められます</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            投稿する
          </button>
        </div>
      </div>
    </div>
  );
}

