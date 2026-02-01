"use client";

import React from 'react';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface StickerDesignStepProps {
    formValues: RouteProposalFormData;
    onStickerDesignSelect: (design: string) => void;
    onCustomStickerDesignChange: (value: string) => void;
    onSubmit: () => void;
    errors: { stickerDesign?: { message?: string } };
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export function StickerDesignStep({
    formValues,
    onCustomStickerDesignChange,
    onSubmit,
    errors,
    inputRef,
}: StickerDesignStepProps) {
    const isDisabled = !formValues.stickerDesign && !formValues.customStickerDesign.trim();

    return (
        <>
            <div className="relative mb-2">
                <input
                    value={formValues.customStickerDesign}
                    onChange={(e) => onCustomStickerDesignChange(e.target.value)}
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="なければ書いてね"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.stickerDesign ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                />
            </div>
            {errors.stickerDesign && (
                <p className="text-sm text-red-500 px-1 mb-2">{errors.stickerDesign.message}</p>
            )}
            <button
                type="button"
                onClick={onSubmit}
                disabled={isDisabled}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                次へ
            </button>
        </>
    );
}

