"use client";

import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface DateStepProps {
    formValues: RouteProposalFormData;
    onDateSelect: (dateType: 'today' | 'tomorrow' | string) => void;
    onSubmit: () => void;
    errors: { selectedDate?: { message?: string } };
}

export function DateStep({
    formValues,
    onSubmit,
    errors,
}: DateStepProps) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isDisabled = !formValues.selectedDate && !formValues.customDate.trim();

    return (
        <>
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

