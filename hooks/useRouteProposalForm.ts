import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeProposalSchema, type RouteProposalFormData } from '@/lib/routeProposalTypes';
import { validateTimeRange } from '@/lib/routeProposalUtils';
import { useMemo } from 'react';

export function useRouteProposalForm(selectedDate?: string) {
    const form = useForm<RouteProposalFormData>({
        resolver: zodResolver(routeProposalSchema),
        defaultValues: {
            areas: [],
            customArea: '',
            selectedDate: selectedDate || '',
            customDate: '',
            stickerType: '',
            customStickerType: '',
            stickerDesign: '',
            customStickerDesign: '',
            startTime: '10:00',
            endTime: '15:00',
            customTime: '',
            preferredShops: [],
            customShop: '',
        },
        mode: 'onChange',
    });

    const formValues = form.watch();

    // 時間バリデーション結果をメモ化
    const timeValidation = useMemo(() => {
        return validateTimeRange(formValues);
    }, [formValues.startTime, formValues.endTime, formValues.customTime]);

    return {
        ...form,
        formValues,
        timeValidation,
        errors: form.formState.errors,
    };
}

