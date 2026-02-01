"use client";

import React from 'react';
import { StepButton } from './StepButton';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';
import { dateToISOString } from '@/lib/routeProposalUtils';

interface DateStepProps {
    formValues: RouteProposalFormData;
    onDateSelect: (dateType: 'today' | 'tomorrow' | string) => void;
    onSubmit: () => void;
    errors: { selectedDate?: { message?: string } };
}

export function DateStep({
    formValues,
    onDateSelect,
    onSubmit,
    errors,
}: DateStepProps) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const selectedDateValue = formValues.selectedDate || formValues.customDate;

    const isDisabled = !formValues.selectedDate && !formValues.customDate.trim();

    return (
        <>
            <div className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                    <StepButton
                        label="今日"
                        isSelected={selectedDateValue === today}
                        onClick={() => onDateSelect('today')}
                    />
                    <StepButton
                        label="明日"
                        isSelected={selectedDateValue === tomorrowStr}
                        onClick={() => onDateSelect('tomorrow')}
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">日付を選択</label>
                    <input
                        type="date"
                        value={formValues.customDate || formValues.selectedDate || ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                onDateSelect(e.target.value);
                            }
                        }}
                        min={today}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:border-pink-300 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    />
                </div>
            </div>
            {errors.selectedDate && (
                <p className="text-sm text-red-500 px-1 mb-2">{errors.selectedDate.message}</p>
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

