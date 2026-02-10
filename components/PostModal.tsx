"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { getCanonicalUid } from '@/lib/userService';
import { CHARACTERS, STICKER_TYPES, POST_TIMES, PREFERRED_SHOPS, AREAS } from '@/lib/utils';
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

/** 現在時刻に近いデフォルト時間を取得 */
function getDefaultPostTime(): string {
  const now = new Date();
  const hour = now.getHours();

  // 10:00～20:00の範囲内
  if (hour >= 10 && hour <= 20) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // 範囲外は「その他」
  return 'その他';
}

export default function PostModal({ onClose }: PostModalProps) {
  const { user, userProfile } = useApp();

  const [status, setStatus] = useState<'seen' | 'soldout'>('seen');
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [stickerType, setStickerType] = useState(STICKER_TYPES[0]);
  const [station, setStation] = useState(AREAS[0]);
  const [shopName, setShopName] = useState(PREFERRED_SHOPS[0]);
  const [postDate, setPostDate] = useState(getNowDate());
  const [postTime, setPostTime] = useState(getDefaultPostTime());
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // canonicalUid を取得（LIFF経由ならlineUserIdを使用）
      const lineUserId = userProfile?.lineUserId;
      const canonicalUid = await getCanonicalUid(user.uid, lineUserId);

      // 投稿データを作成
      const postData: any = {
        uid: user.uid, // 旧フィールド（後方互換性）
        authorUid: canonicalUid, // 安定したユーザーID
        text: text || '',
        status,
        character,
        stickerType,
        areaMasked: station || '不明',
        shopName,
        postDate: postDate,
        postTime: postTime,
        createdAt: serverTimestamp()
      };

      // lineUserIdがある場合のみ追加（undefinedを避ける）
      if (lineUserId) {
        postData.authorLineUserId = lineUserId;
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), postData);

      // Fire-and-forget: 通知APIを非同期で呼ぶ（UIはブロックしない）
      fetch('/api/notify-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          stickerType,
          areaMasked: station || '不明',
          shopName,
          status,
          postDate,
          posterUid: canonicalUid, // canonicalUidを使用
        }),
      }).catch(err => console.error('Notification error:', err));

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
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${status === s.id
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
            options={AREAS}
          />

          {/* Shop */}
          <ButtonSelect
            label="店名"
            value={shopName}
            onChange={setShopName}
            options={PREFERRED_SHOPS}
          />

          {/* Date */}
          <CustomDatePicker
            label="日付"
            value={postDate}
            onChange={setPostDate}
          />

          {/* Time */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">時間</label>
            <div className="grid grid-cols-4 gap-2">
              {POST_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setPostTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${postTime === time
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Sticker type */}
          <ButtonSelect
            label="シールの種類"
            value={stickerType}
            onChange={setStickerType}
            options={STICKER_TYPES}
          />

          {/* Character */}
          <ButtonSelect
            label="キャラクター"
            value={character}
            onChange={setCharacter}
            options={CHARACTERS}
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

