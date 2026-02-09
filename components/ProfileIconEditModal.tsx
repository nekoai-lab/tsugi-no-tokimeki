"use client";

import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { uploadProfileIcon } from '@/lib/profileService';

interface ProfileIconEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (photoUrl: string) => void;
    currentPhotoUrl?: string;
}

// 既存アイコン一覧
const EXISTING_ICONS = [
    '/profile-icons/icon-1.png',
    '/profile-icons/icon-2.png',
    '/profile-icons/icon-3.png',
    '/profile-icons/icon-4.png',
    '/profile-icons/icon-5.png',
    '/profile-icons/icon-6.png',
    '/profile-icons/icon-7.png',
    '/profile-icons/icon-8.png',
];

export default function ProfileIconEditModal({
    isOpen,
    onClose,
    onSave,
    currentPhotoUrl,
}: ProfileIconEditModalProps) {
    const { user } = useApp();
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(currentPhotoUrl || '');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('画像サイズは5MB以下にしてください');
            return;
        }

        // プレビュー用のURLを作成
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
    };

    const handleSelectExistingIcon = (iconUrl: string) => {
        setSelectedPhotoUrl(iconUrl);
        setPreviewUrl('');
        setSelectedFile(null);
    };

    const handleSave = async () => {
        // 既存アイコンを選択した場合は直接保存
        if (selectedPhotoUrl && !selectedFile) {
            onSave(selectedPhotoUrl);
            onClose();
            return;
        }

        // カスタム画像をアップロードする場合
        if (!user || !selectedFile) return;

        setUploading(true);
        try {
            const uploadedUrl = await uploadProfileIcon(user.uid, selectedFile);
            onSave(uploadedUrl);
            onClose();
        } catch (error) {
            console.error('Upload error:', error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg">アイコンを変更</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* プレビュー */}
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-pink-500">
                            {(previewUrl || currentPhotoUrl) ? (
                                <img
                                    src={previewUrl || currentPhotoUrl}
                                    alt="アイコン"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 画像アップロード */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-pink-400 hover:bg-pink-50/30 transition-colors disabled:opacity-50"
                        >
                            <Camera className="w-6 h-6 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {uploading ? 'アップロード中...' : '画像を選択'}
                            </span>
                        </button>
                    </div>

                    {previewUrl && (
                        <p className="text-center text-sm text-green-600">
                            ✓ 画像を選択しました
                        </p>
                    )}

                    {/* 既存アイコン選択 */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">または既存アイコンから選択</p>
                        <div className="grid grid-cols-4 gap-3">
                            {EXISTING_ICONS.map((iconUrl, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectExistingIcon(iconUrl)}
                                    className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                                        selectedPhotoUrl === iconUrl && !previewUrl
                                            ? 'border-pink-500 ring-2 ring-pink-200'
                                            : 'border-gray-200 hover:border-pink-300'
                                    }`}
                                >
                                    <img
                                        src={iconUrl}
                                        alt={`アイコン${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={(!selectedFile && !selectedPhotoUrl) || uploading}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'アップロード中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}

