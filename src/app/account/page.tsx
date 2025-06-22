"use client";

import React, { useState, useEffect } from 'react';
import BottomNavbar from '@/components/BottomNavbar';
import { User, LogOut, Copy, Check, AlertTriangle, Shield, Wallet } from 'lucide-react';

interface WalletInfo {
    name: string;
    address: string;
}

export default function AccountPage() {
    const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [balance, setBalance] = useState<string | null>(null);

    useEffect(() => {
        // Load active wallet from localStorage
        const storedWallets = localStorage.getItem('passkeyWallets');
        if (storedWallets) {
            const parsedWallets: WalletInfo[] = JSON.parse(storedWallets);
            if (parsedWallets.length > 0) {
                setActiveWallet(parsedWallets[0]); // Use first wallet for now
                fetchBalance(parsedWallets[0].address);
            }
        }
        setIsLoading(false);
    }, []);

    const fetchBalance = async (publicKey: string) => {
        try {
            setBalance('Loading...');
            const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
            const account = await response.json();
            const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
            setBalance(xlmBalance ? `${parseFloat(xlmBalance.balance).toLocaleString()} XLM` : '0 XLM');
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setBalance('Could not fetch balance.');
        }
    };

    const handleCopyAddress = async () => {
        if (activeWallet) {
            try {
                await navigator.clipboard.writeText(activeWallet.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('passkeyWallets');
        setActiveWallet(null);
        setBalance(null);
        // Redirect to home page
        window.location.href = '/';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center">
                <div className="text-center">
                    <User className="h-16 w-16 mx-auto text-neutral-600 animate-pulse" />
                    <p className="mt-4 text-neutral-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!activeWallet) {
        return (
            <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
                    <h2 className="text-2xl font-bold text-neutral-100 mb-2">Login Required</h2>
                    <p className="text-neutral-300">You need to log in first to view account information.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 pb-24">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <User className="h-8 w-8 text-[#FD973E]" />
                    <h1 className="text-3xl font-bold text-neutral-100">Account Information</h1>
                </div>

                {/* Wallet Info Card */}
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Wallet className="h-6 w-6 text-[#FD973E]" />
                        <h2 className="text-2xl font-semibold text-neutral-100">{activeWallet.name}</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-neutral-300 font-medium mb-2 block">Wallet Address:</label>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm text-neutral-300 break-all bg-neutral-700 p-3 rounded-lg border border-neutral-600 flex-1">
                                    {activeWallet.address}
                                </p>
                                <button
                                    onClick={handleCopyAddress}
                                    className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-400" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-neutral-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {balance && (
                            <div>
                                <label className="text-neutral-300 font-medium mb-2 block">Balance:</label>
                                <p className="font-mono text-xl font-bold text-[#FD973E] bg-neutral-700 p-3 rounded-lg border border-neutral-600">
                                    {balance}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Info */}
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-5 w-5 text-[#FD973E]" />
                        <h3 className="text-lg font-semibold text-neutral-100">Security</h3>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-300">
                        <p>• Secure login with passkey technology</p>
                        <p>• Biometric verification (fingerprint, facial recognition)</p>
                        <p>• Device-based authentication</p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 p-6">
                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-4 bg-red-300 hover:bg-red-400 rounded-xl transition-all font-semibold text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                    <p className="text-xs text-neutral-400 text-center mt-3">
                        All session information will be deleted when you log out.
                    </p>
                </div>
            </div>

            <BottomNavbar activeWallet={activeWallet} />
        </main>
    );
} 