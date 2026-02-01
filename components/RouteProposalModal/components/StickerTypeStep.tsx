"use client";

import React from 'react';
import { STICKER_TYPES } from '@/lib/utils';
import { StepButton } from './StepButton';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface StickerTypeStepProps {
    formValues: RouteProposalFormData;
    onStickerTypeSelect: (type: string) => void;
    onCustomStickerTypeChange: (value: string) => void;
    onSubmit: () => void;
    errors: { stickerType?: { message?: string } };
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export function StickerTypeStep({
    formValues,
    onStickerTypeSelect,
    onCustomStickerTypeChange,
    onSubmit,
    errors,
    inputRef,
}: StickerTypeStepProps) {
    const isDisabled = !formValues.stickerType && !formValues.customStickerType.trim();

    return (
        <>
            <div className="grid grid-cols-2 gap-2 mb-3">
                {STICKER_TYPES.map((type) => (
                    <StepButton
                        key={type}
                        label={type}
                        isSelected={formValues.stickerType === type}
                        onClick={() => onStickerTypeSelect(type)}
                    />
                ))}
            </div>
            <div className="relative mb-2">
                <input
                    value={formValues.customStickerType}
                    onChange={(e) => onCustomStickerTypeChange(e.target.value)}
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="なければ書いてね"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.stickerType ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                />
            </div>
            {errors.stickerType && (
                <p className="text-sm text-red-500 px-1 mb-2">{errors.stickerType.message}</p>
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

