'use client';

import { useState } from 'react';
import { Wallet, Send, Bot, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavbarProps {
  activeWallet: {
    name: string;
    address: string;
  };
}

export default function BottomNavbar({ activeWallet }: BottomNavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Ana Sayfa',
      href: '/',
      icon: Wallet,
      active: pathname === '/'
    },
    {
      name: 'Gönder',
      href: '/send',
      icon: Send,
      active: pathname === '/send'
    },
    {
      name: 'AI Asistan',
      href: '/ai',
      icon: Bot,
      active: pathname === '/ai'
    },
    {
      name: 'Hesap',
      href: '/account',
      icon: User,
      active: pathname === '/account'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-800/95 backdrop-blur-sm border-t border-neutral-700 z-50">
      <div className="flex justify-around items-center py-3 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                item.active
                  ? 'text-[#FD973E] bg-neutral-700/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 