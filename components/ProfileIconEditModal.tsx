"use client";

import { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon } from 'lucide-react';

interface ProfileIconEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (photoUrl: string) => void;
    currentPhotoUrl?: string;
    // 既存アイコン選択用のオプション（ダミーデータ）
    existingIcons?: string[];
}

export default function ProfileIconEditModal({
    isOpen,
    onClose,
    onSave,
    currentPhotoUrl,
    existingIcons = [],
}: ProfileIconEditModalProps) {
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(currentPhotoUrl || '');
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

        setUploading(true);
        try {
            // TODO: 実際のアップロード処理を実装
            // ここではダミーデータとして、オブジェクトURLを使用
            const objectUrl = URL.createObjectURL(file);
            setSelectedPhotoUrl(objectUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        onSave(selectedPhotoUrl);
        onClose();
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
                    {/* 現在のアイコン */}
                    {selectedPhotoUrl && (
                        <div className="flex justify-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-pink-500">
                                <img
                                    src={selectedPhotoUrl}
                                    alt="アイコン"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

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
                                {uploading ? 'アップロード中...' : '画像をアップロード'}
                            </span>
                        </button>
                    </div>

                    {/* 既存アイコン選択 */}
                    {existingIcons.length > 0 && (
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-3">既存アイコンから選択</p>
                            <div className="grid grid-cols-4 gap-3">
                                {existingIcons.map((iconUrl, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedPhotoUrl(iconUrl)}
                                        className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                                            selectedPhotoUrl === iconUrl
                                                ? 'border-pink-500 ring-2 ring-pink-200'
                                                : 'border-gray-200 hover:border-gray-300'
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
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedPhotoUrl || uploading}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}

