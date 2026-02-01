"use client";

import type { UseFormSetValue } from 'react-hook-form';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface TimeStepProps {
    formValues: RouteProposalFormData;
    timeValidation: { isValid: boolean; errorMessage?: string };
    onTimeSelect: (field: 'startTime' | 'endTime', time: string) => void;
    onSubmit: () => void;
    errors: { startTime?: { message?: string } };
    setValue: UseFormSetValue<RouteProposalFormData>;
}

export function TimeStep({
    timeValidation,
    onSubmit,
    errors,
}: TimeStepProps) {
    return (
        <>
            {errors.startTime && (
                <p className="text-sm text-red-500 px-1 mb-2">{errors.startTime.message}</p>
            )}
            <button
                type="button"
                onClick={onSubmit}
                disabled={!timeValidation.isValid}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                次へ
            </button>
        </>
    );
}

