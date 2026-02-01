import { useState, useEffect, useRef } from 'react';
import type { Step } from '@/lib/routeProposalTypes';

export function useRouteProposalSteps() {
    const [step, setStep] = useState<Step>('areas');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [step]);

    return {
        step,
        setStep,
        isLoading,
        setIsLoading,
        inputRef,
    };
}

