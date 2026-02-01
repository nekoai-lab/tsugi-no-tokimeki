"use client";

import React from 'react';
import { MapPin } from 'lucide-react';
import { AREAS } from '@/lib/utils';
import { StepButton } from './StepButton';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface AreasStepProps {
    formValues: RouteProposalFormData;
    onAreaToggle: (area: string) => void;
    onCustomAreaChange: (value: string) => void;
    onSubmit: () => void;
    errors: { areas?: { message?: string } };
    inputRef: React.RefObject<HTMLInputElement | null>;
    areaCandidates: string[];
}

export function AreasStep({
    formValues,
    onAreaToggle,
    onCustomAreaChange,
    onSubmit,
    errors,
    inputRef,
    areaCandidates,
}: AreasStepProps) {
    const isDisabled = (formValues.areas?.length || 0) === 0 && !formValues.customArea.trim();

    return (
        <>
            <div className="grid grid-cols-2 gap-2 mb-3">
                {areaCandidates.slice(0, 6).map((area) => (
                    <StepButton
                        key={area}
                        label={area}
                        isSelected={formValues.areas?.includes(area) || false}
                        onClick={() => onAreaToggle(area)}
                    />
                ))}
            </div>
            <div className="relative mb-2">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={formValues.customArea}
                    onChange={(e) => onCustomAreaChange(e.target.value)}
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="なければ書いてね（例：吉祥寺、下北沢）"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.areas ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                />
            </div>
            {errors.areas && (
                <p className="text-sm text-red-500 px-1 mb-2">{errors.areas.message}</p>
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

