"use client";

import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { uploadStickerImage, createStickerAlbumPost } from '@/lib/stickerAlbumService';
import { getCanonicalUid } from '@/lib/userService';
import { XCircle, Camera, RefreshCw, Send } from 'lucide-react';

interface StickerAlbumPostModalProps {
    onClose: () => void;
}

export default function StickerAlbumPostModal({ onClose }: StickerAlbumPostModalProps) {
    const { user, userProfile } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('画像サイズは10MB以下にしてください');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!user || !selectedFile) return;
        setIsUploading(true);
        try {
            // canonicalUid を取得（LIFF経由ならlineUserIdを使用）
            const lineUserId = userProfile?.lineUserId;
            const canonicalUid = await getCanonicalUid(user.uid, lineUserId);

            const imageUrl = await uploadStickerImage(user.uid, selectedFile);
            await createStickerAlbumPost(user.uid, imageUrl, caption, canonicalUid);
            onClose();
        } catch (error) {
            console.error('Upload error:', error);
            alert('投稿に失敗しました。もう一度お試しください。');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-lg">写真を投稿</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollable">
                    {/* Image picker */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {previewUrl ? (
                        <div className="relative">
                            <img
                                src={previewUrl}
                                alt="preview"
                                className="w-full rounded-xl object-cover max-h-64"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm"
                            >
                                変更
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-pink-400 hover:bg-pink-50/30 transition-colors"
                        >
                            <Camera className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-500">写真を選ぶ</span>
                        </button>
                    )}

                    {/* Caption */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                            ひとこと（任意）
                            {caption.length > 0 && (
                                <span className="ml-2 text-xs text-gray-400">{caption.length}/100文字</span>
                            )}
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => {
                                if (e.target.value.length <= 100) {
                                    setCaption(e.target.value);
                                }
                            }}
                            placeholder="シール帳の一言コメント"
                            maxLength={100}
                            className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedFile || isUploading}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
                    >
                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isUploading ? 'アップロード中...' : '投稿する'}
                    </button>
                </div>
            </div>
        </div>
    );
}
