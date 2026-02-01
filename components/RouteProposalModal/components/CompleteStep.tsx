"use client";

interface CompleteStepProps {
    onConfirm: () => void;
    onAnotherProposal: () => void;
}

export function CompleteStep({ onConfirm, onAnotherProposal }: CompleteStepProps) {
    return (
        <div className="flex flex-col gap-2 mt-4">
            <button
                type="button"
                onClick={onConfirm}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
                このルートで行く！
            </button>
            <button
                type="button"
                onClick={onAnotherProposal}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
                別の提案をもらう
            </button>
        </div>
    );
}

