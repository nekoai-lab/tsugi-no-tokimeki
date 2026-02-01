"use client";

import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { saveRouteProposal } from '@/lib/routeProposalService';
import { AREAS } from '@/lib/utils';
import type { Shop } from '@/lib/types';
import { useRouteProposalForm } from '@/hooks/useRouteProposalForm';
import { useRouteProposalChat } from '@/hooks/useRouteProposalChat';
import { useRouteProposalSteps } from '@/hooks/useRouteProposalSteps';
import { formatRouteProposal, dateToISOString, formatDateLabel } from '@/lib/routeProposalUtils';
import type { RouteProposalModalProps } from '@/lib/routeProposalTypes';
import { ChatMessage } from './components/ChatMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { AreasStep } from './components/AreasStep';
import { DateStep } from './components/DateStep';
import { StickerTypeStep } from './components/StickerTypeStep';
import { StickerDesignStep } from './components/StickerDesignStep';
import { TimeStep } from './components/TimeStep';
import { ShopsStep } from './components/ShopsStep';
import { CompleteStep } from './components/CompleteStep';
import { StepButton } from './components/StepButton';
import { CustomTimePicker } from './components/CustomTimePicker';

export default function RouteProposalModal({ onClose, onConfirm, selectedDate }: RouteProposalModalProps) {
    const { user, userProfile, posts } = useApp();
    const [proposedShops, setProposedShops] = useState<Shop[] | null>(null);
    const [proposedTotalTime, setProposedTotalTime] = useState<number | null>(null);

    const { formValues, setValue, trigger, errors, timeValidation } = useRouteProposalForm(selectedDate);
    const { messages, messagesEndRef, addUserMessage, addAIMessage, resetMessages } = useRouteProposalChat();
    const { step, setStep, isLoading, setIsLoading, inputRef } = useRouteProposalSteps();

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, step, messagesEndRef]);

    // プロフィールのエリアを参考にした候補を取得
    const getAreaCandidates = () => {
        const profileArea = userProfile?.area || '';
        const candidates = profileArea ? [profileArea, ...AREAS.filter(a => a !== profileArea)] : AREAS;
        return candidates;
    };

    const handleAreaToggle = (area: string) => {
        const currentAreas = formValues.areas || [];
        const newAreas = currentAreas.includes(area)
            ? currentAreas.filter(a => a !== area)
            : [...currentAreas, area];
        setValue('areas', newAreas);
    };

    const onAreasSubmit = async () => {
        const isValid = await trigger(['areas', 'customArea']);
        if (!isValid) return;

        const areas = [...(formValues.areas || [])];
        if (formValues.customArea.trim()) {
            areas.push(formValues.customArea.trim());
        }

        if (areas.length === 0) {
            return;
        }

        addUserMessage(areas.join('、'));
        addAIMessage('どの種類のシールを探しますか？');
        setStep('stickerType');
        setValue('customArea', '');
    };

    const handleStickerTypeSelect = (type: string) => {
        setValue('stickerType', type);
        setValue('customStickerType', '');
    };

    const onStickerTypeSubmit = async () => {
        const isValid = await trigger(['stickerType', 'customStickerType']);
        if (!isValid) return;

        const finalType = formValues.stickerType || formValues.customStickerType.trim();
        if (!finalType) return;

        addUserMessage(finalType);
        addAIMessage('どの柄のシールを探しますか？');
        setStep('stickerDesign');
    };

    const handleStickerDesignSelect = (design: string) => {
        setValue('stickerDesign', design);
        setValue('customStickerDesign', '');
    };

    const onStickerDesignSubmit = async () => {
        const isValid = await trigger(['stickerDesign', 'customStickerDesign']);
        if (!isValid) return;

        const finalDesign = formValues.stickerDesign || formValues.customStickerDesign.trim();
        if (!finalDesign) return;

        addUserMessage(finalDesign);
        addAIMessage('いつ行きますか？');
        setStep('date');
    };

    const handleDateSelect = (dateType: 'today' | 'tomorrow' | string) => {
        const dateStr = dateToISOString(dateType);
        setValue('selectedDate', dateStr);
        setValue('customDate', '');
    };

    const onDateSubmit = async () => {
        const isValid = await trigger(['selectedDate', 'customDate']);
        if (!isValid) return;

        const finalDate = formValues.selectedDate || formValues.customDate.trim();
        if (!finalDate) return;

        const dateLabel = formatDateLabel(finalDate);
        addUserMessage(dateLabel);
        addAIMessage('何時から何時まで回れますか？開始時刻と終了時刻を選んでください。');
        setStep('time');
    };

    const handleTimeSelect = (field: 'startTime' | 'endTime', time: string) => {
        setValue(field, time, { shouldValidate: true });
        if (field === 'startTime') {
            setValue('customTime', '', { shouldValidate: true });
        }
    };

    const onTimeSubmit = async () => {
        if (!timeValidation.isValid) {
            return;
        }

        const isValid = await trigger(['startTime', 'endTime', 'customTime']);
        if (!isValid) return;

        let timeRange = '';
        if (formValues.customTime.trim()) {
            timeRange = formValues.customTime.trim();
        } else if (formValues.startTime && formValues.endTime) {
            timeRange = `${formValues.startTime}〜${formValues.endTime}`;
        } else {
            return;
        }

        addUserMessage(timeRange);
        addAIMessage('特に見たいお店はありますか？複数選択できます。');
        setStep('shops');
    };

    const handleShopToggle = (shop: string) => {
        const currentShops = formValues.preferredShops || [];
        const newShops = currentShops.includes(shop)
            ? currentShops.filter(s => s !== shop)
            : [...currentShops, shop];
        setValue('preferredShops', newShops);
    };

    const onShopsSubmit = async () => {
        const shops = [...(formValues.preferredShops || [])];
        if (formValues.customShop.trim()) {
            shops.push(formValues.customShop.trim());
        }

        const shopsText = shops.length > 0 ? shops.join('、') : '特になし';
        addUserMessage(shopsText);

        setIsLoading(true);
        setStep('complete');

        try {
            const userPosts = posts
                .filter(p => p.uid === user?.uid)
                .map(p => ({
                    text: p.text,
                    status: p.status,
                    character: p.character,
                    areaMasked: p.areaMasked,
                    createdAt: p.createdAt,
                }));

            const finalAreas = [...(formValues.areas || [])];
            if (formValues.customArea.trim()) {
                finalAreas.push(formValues.customArea.trim());
            }

            const response = await fetch('/api/route-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.uid,
                    areas: finalAreas,
                    stickerType: formValues.stickerType || formValues.customStickerType.trim(),
                    stickerDesign: formValues.stickerDesign || formValues.customStickerDesign.trim(),
                    startTime: formValues.startTime || formValues.customTime.split('〜')[0] || '',
                    endTime: formValues.endTime || formValues.customTime.split('〜')[1] || '',
                    preferredShops: shops,
                    userPosts,
                    favorites: userProfile?.favorites || [],
                    userArea: userProfile?.area || '',
                }),
            });

            if (!response.ok) {
                throw new Error('API呼び出しに失敗しました');
            }

            const data = await response.json();
            setProposedShops(data.shops);
            setProposedTotalTime(data.totalTravelTime);

            const finalDate = formValues.selectedDate || formValues.customDate || selectedDate || '';
            const routeMessage = formatRouteProposal(
                data.shops,
                data.totalTravelTime,
                finalAreas.join('、'),
                formValues.startTime || formValues.customTime.split('〜')[0] || '',
                formValues.endTime || formValues.customTime.split('〜')[1] || '',
                finalDate
            );
            addAIMessage(routeMessage);
        } catch (error) {
            console.error('Route proposal error:', error);
            addAIMessage('申し訳ございません、少し時間をおいて再度お試しください。');
            setStep('shops');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        const finalDate = formValues.selectedDate || formValues.customDate || selectedDate || '';
        if (!proposedShops || proposedTotalTime === null || !user || !finalDate) return;

        const finalAreas = [...(formValues.areas || [])];
        if (formValues.customArea.trim()) {
            finalAreas.push(formValues.customArea.trim());
        }

        try {
            await saveRouteProposal(user.uid, {
                date: finalDate,
                areas: finalAreas,
                stickerType: formValues.stickerType || formValues.customStickerType.trim(),
                stickerDesign: formValues.stickerDesign || formValues.customStickerDesign.trim(),
                startTime: formValues.startTime || formValues.customTime.split('〜')[0] || '',
                endTime: formValues.endTime || formValues.customTime.split('〜')[1] || '',
                preferredShops: formValues.preferredShops.length > 0
                    ? formValues.preferredShops
                    : (formValues.customShop.trim() ? [formValues.customShop.trim()] : []),
                shops: proposedShops,
                totalTravelTime: proposedTotalTime,
            });

            onConfirm?.();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('保存に失敗しました');
        }
    };

    const handleAnotherProposal = () => {
        resetMessages('別の条件で提案しますか？まず、どのエリアでシールを探しますか？');
        setStep('areas');
        setValue('areas', []);
        setValue('customArea', '');
        setValue('stickerType', '');
        setValue('customStickerType', '');
        setValue('stickerDesign', '');
        setValue('customStickerDesign', '');
        setValue('startTime', '');
        setValue('endTime', '');
        setValue('customTime', '');
        setValue('preferredShops', []);
        setValue('customShop', '');
        setProposedShops(null);
        setProposedTotalTime(null);
    };

    // チャット内に表示する選択ボタン
    const renderSelectionButtons = () => {
        switch (step) {
            case 'areas':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {getAreaCandidates().map((area) => (
                            <StepButton
                                key={area}
                                label={area}
                                isSelected={formValues.areas.includes(area)}
                                onClick={() => handleAreaToggle(area)}
                            />
                        ))}
                    </div>
                );

            case 'date':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <StepButton
                                label="今日"
                                isSelected={formValues.selectedDate === new Date().toISOString().split('T')[0]}
                                onClick={() => handleDateSelect('today')}
                            />
                            <StepButton
                                label="明日"
                                isSelected={formValues.selectedDate === (() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    return tomorrow.toISOString().split('T')[0];
                                })()}
                                onClick={() => handleDateSelect('tomorrow')}
                            />
                        </div>
                        <div className="space-y-3 mt-3">
                            <input
                                type="date"
                                value={formValues.customDate || formValues.selectedDate || ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleDateSelect(e.target.value);
                                    }
                                }}
                                min={today}
                                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:border-pink-300 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                            />
                        </div>
                    </>
                );

            case 'stickerType':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {['フレークシール', 'ロールシール', 'ステッカー', 'マスキングテープ'].map((type) => (
                            <StepButton
                                key={type}
                                label={type}
                                isSelected={formValues.stickerType === type}
                                onClick={() => handleStickerTypeSelect(type)}
                            />
                        ))}
                    </div>
                );

            case 'stickerDesign':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {['キャラクター', '動物', '植物', 'レトロ'].map((design) => (
                            <StepButton
                                key={design}
                                label={design}
                                isSelected={formValues.stickerDesign === design}
                                onClick={() => handleStickerDesignSelect(design)}
                            />
                        ))}
                    </div>
                );

            case 'time':
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
                    </>
                );



            case 'shops':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {['東急ハンズ', 'LOFT', '紀伊国屋書店', 'ヴィレッジヴァンガード'].map((shop) => (
                            <StepButton
                                key={shop}
                                label={shop}
                                isSelected={formValues.preferredShops.includes(shop)}
                                onClick={() => handleShopToggle(shop)}
                            />
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    // 下部固定エリアに表示する入力欄と次へボタン
    const renderBottomInput = () => {
        switch (step) {
            case 'areas':
                return (
                    <AreasStep
                        formValues={formValues}
                        onAreaToggle={handleAreaToggle}
                        onCustomAreaChange={(value) => setValue('customArea', value)}
                        onSubmit={onAreasSubmit}
                        errors={errors}
                        inputRef={inputRef}
                        areaCandidates={getAreaCandidates()}
                    />
                );

            case 'date':
                return (
                    <DateStep
                        formValues={formValues}
                        onDateSelect={handleDateSelect}
                        onSubmit={onDateSubmit}
                        errors={errors}
                    />
                );

            case 'stickerType':
                return (
                    <StickerTypeStep
                        formValues={formValues}
                        onStickerTypeSelect={handleStickerTypeSelect}
                        onCustomStickerTypeChange={(value) => {
                            setValue('customStickerType', value);
                            if (value) setValue('stickerType', '');
                        }}
                        onSubmit={onStickerTypeSubmit}
                        errors={errors}
                        inputRef={inputRef}
                    />
                );

            case 'stickerDesign':
                return (
                    <StickerDesignStep
                        formValues={formValues}
                        onStickerDesignSelect={handleStickerDesignSelect}
                        onCustomStickerDesignChange={(value) => {
                            setValue('customStickerDesign', value);
                            if (value) setValue('stickerDesign', '');
                        }}
                        onSubmit={onStickerDesignSubmit}
                        errors={errors}
                        inputRef={inputRef}
                    />
                );

            case 'time':
                return (
                    <TimeStep
                        formValues={formValues}
                        timeValidation={timeValidation}
                        onTimeSelect={handleTimeSelect}
                        onSubmit={onTimeSubmit}
                        errors={errors}
                        setValue={setValue}
                    />
                );

            case 'shops':
                return (
                    <ShopsStep
                        formValues={formValues}
                        onShopToggle={handleShopToggle}
                        onCustomShopChange={(value) => setValue('customShop', value)}
                        onSubmit={onShopsSubmit}
                        inputRef={inputRef}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full h-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg">ルート提案 by AI</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '200px' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            <ChatMessage message={msg} />

                            {/* 最新のAIメッセージの直後に選択ボタンを表示 */}
                            {msg.role === 'ai' &&
                                idx === messages.length - 1 &&
                                step !== 'complete' &&
                                !isLoading && (
                                    <div className="mt-3">
                                        {renderSelectionButtons()}
                                    </div>
                                )}
                        </div>
                    ))}

                    {isLoading && <LoadingIndicator />}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Fixed at bottom */}
                {step !== 'complete' && !isLoading && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-lg">
                        <div className="max-w-md mx-auto">
                            {renderBottomInput()}
                        </div>
                    </div>
                )}

                {proposedShops && proposedShops.length > 0 && step === 'complete' && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-lg">
                        <div className="max-w-md mx-auto">
                            <CompleteStep
                                onConfirm={handleConfirm}
                                onAnotherProposal={handleAnotherProposal}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
