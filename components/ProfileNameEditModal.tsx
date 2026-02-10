"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProfileNameEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (displayName: string, handle: string) => void;
    currentDisplayName?: string;
    currentHandle?: string;
}

export default function ProfileNameEditModal({
    isOpen,
    onClose,
    onSave,
    currentDisplayName = '',
    currentHandle = '',
}: ProfileNameEditModalProps) {
    const [displayName, setDisplayName] = useState('');
    const [handle, setHandle] = useState('');
    const [handleError, setHandleError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDisplayName(currentDisplayName);
            setHandle(currentHandle);
            setHandleError('');
        }
    }, [isOpen, currentDisplayName, currentHandle]);

    if (!isOpen) return null;

    const validateHandle = (value: string): boolean => {
        // ハンドルネームのバリデーション
        // @は不要、英数字とアンダースコアのみ、3-20文字
        // 先頭の@は自動で除去される
        const cleanValue = value.startsWith('@') ? value.slice(1) : value;
        const handleRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!handleRegex.test(cleanValue)) {
            setHandleError('英数字とアンダースコアのみ、3-20文字で入力してください');
            return false;
        }
        setHandleError('');
        return true;
    };

    const handleHandleChange = (value: string) => {
        setHandle(value);
        if (value && value !== currentHandle) {
            validateHandle(value);
        } else {
            setHandleError('');
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            alert('表示名を入力してください');
            return;
        }

        if (!handle.trim()) {
            alert('ハンドルネームを入力してください');
            return;
        }

        if (handle !== currentHandle && !validateHandle(handle)) {
            return;
        }

        setSaving(true);
        try {
            // TODO: 重複チェックなどの実際の処理を実装
            // @が付いていたら除去して保存
            const cleanHandle = handle.trim().startsWith('@') ? handle.trim().slice(1) : handle.trim();
            await onSave(displayName.trim(), cleanHandle);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('保存に失敗しました。再試行してください。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg">プロフィールを編集</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* 表示名 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">
                            表示名
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="例：あや"
                            maxLength={20}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">重複OK、表示用</p>
                    </div>

                    {/* ハンドルネーム */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">
                            ハンドルネーム
                        </label>
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => handleHandleChange(e.target.value)}
                            placeholder="例：youjougaw_ws1"
                            maxLength={20}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                                handleError
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-gray-200 focus:ring-pink-500/20 focus:border-pink-500'
                            }`}
                        />
                        {handleError && (
                            <p className="text-xs text-red-500 mt-1">{handleError}</p>
                        )}
                        {!handleError && (
                            <p className="text-xs text-gray-400 mt-1">
                                検索&フォロー用、重複NG、変更可能
                            </p>
                        )}
                    </div>
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
                        disabled={saving || !displayName.trim() || !handle.trim() || !!handleError}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}

