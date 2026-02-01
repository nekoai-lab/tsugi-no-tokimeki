"use client";

"use client";

import React, { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import NavButton from '@/components/NavButton';
import PostModal from '@/components/PostModal';
import { Sparkles, Home, Calendar as CalendarIcon, User } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showPostModal, setShowPostModal] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-4 py-3 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Tsugi no Tokimeki
        </h1>
        <div className="flex items-center gap-3">
          {/* Mock Notification Badge */}
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-300 to-purple-300 border-2 border-white"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Floating Action Button for Post */}
      <button 
        onClick={() => setShowPostModal(true)}
        className="absolute bottom-20 right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20">
        <NavButton href="/home" icon={Sparkles} label="For You" />
        <NavButton href="/feed" icon={Home} label="Feed" />
        <NavButton href="/calendar" icon={CalendarIcon} label="Calendar" />
        <NavButton href="/profile" icon={User} label="Profile" />
      </nav>

      {/* Post Modal Overlay */}
      {showPostModal && (
        <PostModal onClose={() => setShowPostModal(false)} />
      )}
    </div>
  );
}

