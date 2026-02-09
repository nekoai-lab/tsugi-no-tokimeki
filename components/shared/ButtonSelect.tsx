"use client";

import { StepButton } from './StepButton';

interface ButtonSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

/** ボタン形式の選択 */
export function ButtonSelect({
  label,
  value,
  onChange,
  options,
}: ButtonSelectProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2">{label}</label>

      {options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <StepButton
              key={option}
              label={option}
              isSelected={value === option}
              onClick={() => onChange(option)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
