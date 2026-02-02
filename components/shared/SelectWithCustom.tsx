"use client";

import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface SelectWithCustomProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  customPlaceholder: string;
}

/** ドロップダウン + カスタム入力（チェック・キャンセルボタン付き） */
export function SelectWithCustom({
  label,
  value,
  onChange,
  options,
  customPlaceholder,
}: SelectWithCustomProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
      {!isCustom ? (
        <div className="relative">
          <select
            value={options.includes(value) ? value : ''}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustom(true);
                setCustomInput(''); // 初めは空にする
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__custom__">その他（入力する）</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={customPlaceholder}
            autoFocus
            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
          <button
            type="button"
            onClick={() => {
              if (customInput.trim()) {
                onChange(customInput.trim());
              }
              setIsCustom(false);
            }}
            className="p-2.5 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
            title="確定"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              setCustomInput('');
            }}
            className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            title="キャンセル"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
