"use client";

import React from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import { CustomTimePicker } from './CustomTimePicker';
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
    formValues,
    timeValidation,
    onTimeSelect,
    onSubmit,
    errors,
    setValue,
}: TimeStepProps) {
    return (
        <>
            <div className="space-y-4 mb-3">
                <CustomTimePicker
                    name="startTime"
                    label="開始時刻"
                    error={errors.startTime?.message}
                    formValues={formValues}
                    setValue={setValue}
                />
                <CustomTimePicker
                    name="endTime"
                    label="終了時刻"
                    error={errors.startTime?.message}
                    formValues={formValues}
                    setValue={setValue}
                />
                {!formValues.customTime?.trim() && formValues.startTime && formValues.endTime && !timeValidation.isValid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600 font-medium">
                            {timeValidation.errorMessage}
                        </p>
                    </div>
                )}
            </div>
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

