"use client";

import React from 'react';
import { StepButton } from './StepButton';
import { Check } from 'lucide-react';

interface ButtonSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  customPlaceholder?: string;
}

/** ボタン形式の選択 + カスタム入力フィールド */
export function ButtonSelect({
  label,
  value,
  onChange,
  options,
  customPlaceholder = '選択になければ入力してね',
}: ButtonSelectProps) {
  const [customInput, setCustomInput] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  // プリセットに含まれない値が選択されている場合、それはカスタム入力
  const isCustomValue = value && !options.includes(value);

  const handleOptionSelect = (option: string) => {
    setCustomInput('');
    setIsEditing(false);
    onChange(option);
  };

  const handleCustomInputChange = (input: string) => {
    setCustomInput(input);
    setIsEditing(true);
  };

  const handleConfirmCustomInput = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setIsEditing(false);
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2">{label}</label>

      {/* プリセットボタン */}
      {options.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {options.map((option) => (
            <StepButton
              key={option}
              label={option}
              isSelected={value === option}
              onClick={() => handleOptionSelect(option)}
            />
          ))}
        </div>
      )}

      {/* カスタム入力フィールド */}
      <div className="flex gap-2">
        <input
          type="text"
          value={isEditing ? customInput : (isCustomValue ? value : '')}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={customPlaceholder}
          className={`flex-1 p-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 text-gray-900 ${
            isCustomValue && !isEditing
              ? 'bg-pink-50 border-pink-500 focus:ring-pink-500/20'
              : 'bg-gray-50 border-gray-200 focus:ring-pink-500/20 focus:border-pink-500'
          }`}
        />
        {isEditing && customInput.trim() && (
          <button
            type="button"
            onClick={handleConfirmCustomInput}
            className="p-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
            title="確定"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
