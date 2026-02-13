"use client";

import { useState } from 'react';
import { XCircle, Pin, MapPin, Calendar, Clock, Package, Users } from 'lucide-react';
import { pinPost, unpinPost } from '@/lib/postService';
import { useApp } from '@/contexts/AppContext';
import { getRelativeTime } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface PostDetailModalProps {
  post: Post;
  authorHandle?: string;
  onClose: () => void;
}

export default function PostDetailModal({ post, authorHandle, onClose }: PostDetailModalProps) {
  const { user, pinnedPostIds } = useApp();
  const [isPinning, setIsPinning] = useState(false);

  const handleTogglePin = async () => {
    if (!user || isPinning) return;
    setIsPinning(true);
    try {
      const isPinned = pinnedPostIds.includes(post.id);
      if (isPinned) {
        await unpinPost(user.uid, post.id);
      } else {
        await pinPost(user.uid, post.id);
      }
    } catch (error) {
      console.error('Pin error:', error);
    } finally {
      setIsPinning(false);
    }
  };

  const isPinned = pinnedPostIds.includes(post.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-lg">投稿詳細</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide border-2 ${
              post.status === 'soldout' 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {post.status === 'soldout' ? '売り切れ' : 'あった！'}
            </span>
            {authorHandle && (
              <span className="text-sm text-gray-500">{authorHandle}</span>
            )}
          </div>

          {/* Main Info */}
          <div className="space-y-4 mb-6">
            {/* Character */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500">キャラクター</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{post.character}</p>
            </div>

            {/* Sticker Type */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500">シールの種類</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{post.stickerType}</p>
            </div>

            {/* Location & Shop */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500">場所・店舗</span>
              </div>
              <p className="text-base font-bold text-gray-800">{post.areaMasked || '不明'}</p>
              {post.shopName && (
                <p className="text-sm text-gray-600 mt-1">{post.shopName}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500">日時</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-800">{post.postDate || '不明'}</p>
                {post.postTime && (
                  <>
                    <span className="text-gray-300">/</span>
                    <Clock className="w-3 h-3 text-gray-500" />
                    <p className="text-sm text-gray-600">{post.postTime}</p>
                  </>
                )}
              </div>
            </div>

            {/* Detail Text */}
            {post.text && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-500">詳細</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.text}</p>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {getRelativeTime(post.createdAt)}に投稿
            </span>
            
            {/* Pin Button */}
            <button
              onClick={handleTogglePin}
              disabled={isPinning}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Pin
                className={`w-5 h-5 transition-colors ${
                  isPinned
                    ? 'fill-pink-500 text-pink-500'
                    : 'text-gray-400'
                }`}
              />
              <span className={`text-sm font-medium ${
                isPinned ? 'text-pink-500' : 'text-gray-500'
              }`}>
                {isPinned ? 'ピン留め中' : 'ピン留め'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

