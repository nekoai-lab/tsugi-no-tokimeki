import { useState, useRef } from 'react';
import type { Step } from '@/lib/routeProposalTypes';

export function useRouteProposalSteps() {
    const [step, setStep] = useState<Step>('areas');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 自動フォーカスを削除 - ユーザーがタップした時のみキーボードが出る
    // useEffect(() => { inputRef.current?.focus(); }, [step]); は削除

    return {
        step,
        setStep,
        isLoading,
        setIsLoading,
        inputRef,
    };
}


