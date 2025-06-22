"use client";

import React, { useState, useEffect } from 'react';
import BottomNavbar from '@/components/BottomNavbar';
import ChatInterface from '@/components/chat/ChatInterface';
import { Bot, AlertTriangle } from 'lucide-react';

interface WalletInfo {
    name: string;
    address: string;
}

export default function AIPage() {
    const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load active wallet from localStorage
        const storedWallets = localStorage.getItem('passkeyWallets');
        if (storedWallets) {
            const parsedWallets: WalletInfo[] = JSON.parse(storedWallets);
            if (parsedWallets.length > 0) {
                setActiveWallet(parsedWallets[0]); // Use first wallet for now
            }
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center">
                <div className="text-center">
                    <Bot className="h-16 w-16 mx-auto text-neutral-600 animate-pulse" />
                    <p className="mt-4 text-neutral-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!activeWallet) {
        return (
            <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
                    <h2 className="text-2xl font-bold text-neutral-100 mb-2">Giriş Gerekli</h2>
                    <p className="text-neutral-300">AI Asistan'ı kullanabilmek için önce giriş yapmanız gerekiyor.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Bot className="h-8 w-8 text-[#FD973E]" />
                    <h1 className="text-3xl font-bold text-neutral-100">AI Asistan</h1>
                </div>
                
                <ChatInterface activeWallet={activeWallet} />
            </div>

            <BottomNavbar activeWallet={activeWallet} />
        </main>
    );
} 