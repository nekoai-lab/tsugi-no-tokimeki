"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavButtonProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export default function NavButton({ href, icon: Icon, label }: NavButtonProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} prefetch={true} className="flex flex-col items-center gap-1 w-16">
      <Icon className={`w-6 h-6 transition-colors ${active ? 'text-pink-500' : 'text-gray-400'}`} />
      <span className={`text-[10px] font-medium ${active ? 'text-pink-500' : 'text-gray-400'}`}>{label}</span>
    </Link>
  );
}


