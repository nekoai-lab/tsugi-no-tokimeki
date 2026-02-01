"use client";

import { useState, useEffect } from "react";
import {
  initializeLiff,
  loginWithLine,
  isLineLoggedIn,
  getLineProfile,
} from "@/lib/liff";

interface LineLoginButtonProps {
  onLoginSuccess?: (profile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }) => void;
  className?: string;
}

export default function LineLoginButton({
  onLoginSuccess,
  className = "",
}: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const success = await initializeLiff();
      if (!success) {
        setError("LINE連携の初期化に失敗しました");
        setIsLoading(false);
        return;
      }

      if (isLineLoggedIn()) {
        setIsLoggedIn(true);
        // ログイン済みの場合、プロフィールを取得してコールバック
        const profile = await getLineProfile();
        if (profile && onLoginSuccess) {
          onLoginSuccess(profile);
        }
      }

      setIsLoading(false);
    };

    init();
  }, [onLoginSuccess]);

  const handleLogin = () => {
    loginWithLine();
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-lg ${className}`}
      >
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        読み込み中...
      </button>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>{error}</div>
    );
  }

  if (isLoggedIn) {
    return (
      <div
        className={`flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 px-6 rounded-lg ${className}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        LINE連携済み
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className={`flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b54d] text-white font-medium py-3 px-6 rounded-lg transition-colors ${className}`}
    >
      {/* LINE アイコン */}
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      LINEでログイン
    </button>
  );
}

