"use client";

import React from 'react';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface ShopsStepProps {
    formValues: RouteProposalFormData;
    onShopToggle: (shop: string) => void;
    onCustomShopChange: (value: string) => void;
    onSubmit: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ShopsStep({
    formValues,
    onShopToggle,
    onCustomShopChange,
    onSubmit,
    inputRef,
}: ShopsStepProps) {
    return (
        <>
            <div className="relative mb-2">
                <input
                    value={formValues.customShop}
                    onChange={(e) => onCustomShopChange(e.target.value)}
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="なければ書いてね（例：無印良品、ユニクロ）"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
            </div>
            <button
                type="button"
                onClick={onSubmit}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
                ルートを提案してもらう
            </button>
        </>
    );
}

