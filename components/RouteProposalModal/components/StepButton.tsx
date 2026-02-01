"use client";

import React from 'react';
import { Check } from 'lucide-react';

interface StepButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}

export function StepButton({ label, isSelected, onClick, className = '' }: StepButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-3 rounded-xl border-2 transition-all ${isSelected
                ? 'bg-pink-100 border-pink-500 text-pink-700 font-bold'
                : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'
                } ${className}`}
        >
            {isSelected && <Check className="w-4 h-4 inline mr-1" />}
            {label}
        </button>
    );
}

