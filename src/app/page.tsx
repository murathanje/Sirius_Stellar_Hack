"use client";

import React, { useState, useEffect } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';
import { Horizon, TransactionBuilder, Operation, Networks, Asset } from '@stellar/stellar-sdk';
import Link from 'next/link';
import Image from 'next/image';
import ChatModal, { ChatFloatingButton } from '@/components/chat/ChatModal';
import { Bot, Wallet, Send, Shield, ArrowRight, Lock, AlertTriangle } from 'lucide-react';

// The secret key of the account we created to fund new wallets.
// This is read from an environment variable.
const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;

// A random phrase for key derivation, as required by the library.
const RANDOM_PHRASE = 'stellar-passkey-demo-app-12345';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

interface WalletInfo {
    name: string;
    address: string;
}

export default function Home() {
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('Ready...');
    
    // Holds the list of all wallets known to this browser
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    
    // Holds the currently active/logged-in wallet
    const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
    const [balance, setBalance] = useState<string | null>(null);

    // For the transfer form
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');

    // For the error popup
    const [transferError, setTransferError] = useState<string | null>(null);
    
    // Chat modal state
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // Login attempt state
    const [loginAttemptError, setLoginAttemptError] = useState<string | null>(null);

    // On page load, load the list of wallets from local storage
    useEffect(() => {
        const storedWallets = localStorage.getItem('passkeyWallets');
        if (storedWallets) {
            const parsedWallets: WalletInfo[] = JSON.parse(storedWallets);
            setWallets(parsedWallets);
            if (parsedWallets.length > 0) {
                setStatus("Existing wallets found. Please select one to log in.");
            }
        }
    }, []);

    const fetchBalance = async (publicKey: string) => {
        try {
            setBalance('Loading...');
            const account = await server.loadAccount(publicKey);
            const xlmBalance = account.balances.find((b) => b.asset_type === 'native');
            setBalance(xlmBalance ? `${parseFloat(xlmBalance.balance).toLocaleString()} XLM` : '0 XLM');
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setBalance('Could not fetch balance.');
        }
    };
    
    const getWalletInstance = () => {
        if (!PARENT_SECRET_KEY) {
            const errorMessage = "Parent secret key is not configured in .env.local.";
            setStatus(`Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        // The random phrase is now a base, the wallet name will be the unique identifier
        return new PasskeyWallet('testnet', PARENT_SECRET_KEY, 'base-phrase-for-app');
    }

    const handleCreateWallet = async () => {
        const walletName = window.prompt("Please enter a name for your new wallet (e.g., 'Savings', 'Main Account'):");
        if (!walletName) {
            return; // User cancelled
        }
        if (wallets.some(w => w.name === walletName)) {
            alert("A wallet with this name already exists. Please choose a unique name.");
            return;
        }

        setIsBusy(true);
        setStatus(`Creating '${walletName}' and waiting for passkey registration...`);
        
        try {
            const wallet = getWalletInstance();
            // Use the unique walletName as the phrase to create a unique passkey credential
            await wallet.createFromCreatingPasskey({ phrase: walletName });
            
            const newPublicKey = wallet.finalPublicKey;
            const newWallet: WalletInfo = { name: walletName, address: newPublicKey };

            // Add the new wallet to our list and save to local storage
            const updatedWallets = [...wallets, newWallet];
            setWallets(updatedWallets);
            localStorage.setItem('passkeyWallets', JSON.stringify(updatedWallets));

            // Log in with the new wallet immediately
            setActiveWallet(newWallet);
            fetchBalance(newPublicKey);
            setStatus(`Success! New wallet '${walletName}' created and logged in.`);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const selectedWalletName = (form.elements.namedItem('walletSelector') as HTMLSelectElement).value;

        if (!selectedWalletName) {
            alert("Please select a wallet to log in.");
            return;
        }

        setIsBusy(true);
        setLoginAttemptError(null);
        setStatus(`Logging in to '${selectedWalletName}'...`);

        try {
            const wallet = getWalletInstance();
            // Use the selected wallet's name to find the correct passkey
            await wallet.createFromExistingPasskey({ phrase: selectedWalletName });

            const loggedInWallet = wallets.find(w => w.name === selectedWalletName);
            if (loggedInWallet) {
                setActiveWallet(loggedInWallet);
                fetchBalance(loggedInWallet.address);
                setStatus(`Welcome back to '${loggedInWallet.name}'!`);
            } else {
                 throw new Error("Could not find wallet data after login.");
            }

        } catch (error) {
            console.error(error);
            let errorMessage = "An unknown error occurred.";
            
            if (error instanceof Error) {
                if (error.message.includes('NotAllowedError') || error.message.includes('passkey')) {
                    errorMessage = "Passkey doğrulaması başarısız. Lütfen doğru passkey ile tekrar deneyin veya tarayıcı ayarlarınızı kontrol edin.";
                } else if (error.message.includes('AbortError')) {
                    errorMessage = "İşlem iptal edildi. Passkey doğrulamasını tamamlamak için tekrar deneyin.";
                } else if (error.message.includes('InvalidStateError')) {
                    errorMessage = "Bu cihazda bu wallet için kayıtlı passkey bulunamadı.";
                } else {
                    errorMessage = error.message;
                }
            }
            
            setLoginAttemptError(errorMessage);
            setStatus(`Login Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    }

    const handleLogout = () => {
        setActiveWallet(null);
        setBalance(null);
        setStatus("You have been logged out. Select a wallet to log in again.");
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferError(null); // Clear previous errors before a new attempt

        if (!activeWallet || !destination || !amount) {
            alert("Please log in and fill in all transfer details.");
            return;
        }

        setIsBusy(true);
        setStatus(`Preparing to send ${amount} XLM from '${activeWallet.name}'...`);

        try {
            const wallet = getWalletInstance();
            await wallet.createFromExistingPasskey({ phrase: activeWallet.name });
            const sourceKeyPair = wallet.keyPair;

            if (!sourceKeyPair) throw new Error("Could not get keypair for signing.");

            const sourceAccount = await server.loadAccount(activeWallet.address);
            const transaction = new TransactionBuilder(sourceAccount, {
                fee: await server.fetchBaseFee().then(fee => fee.toString()),
                networkPassphrase: Networks.TESTNET,
            })
            .addOperation(Operation.payment({
                destination,
                asset: Asset.native(),
                amount,
            }))
            .setTimeout(30)
            .build();
            
            transaction.sign(sourceKeyPair);

            const txResult = await server.submitTransaction(transaction);
            setStatus(`Success! Transaction sent: ${txResult.hash}`);
            fetchBalance(activeWallet.address);
            setDestination('');
            setAmount('');

        } catch (error) {
            // Log the error for debugging without triggering the Next.js error overlay.
            console.log("Transfer failed:", error);

            const userFriendlyMessage = "Transaction could not be completed. The network rejected it. Please check the destination address and ensure you have sufficient funds.";
            setTransferError(userFriendlyMessage);

            let detailedStatus = "An unknown error occurred.";
            if (error instanceof Error) {
                if ('response' in error && (error as any).response?.data) {
                    const errorData = (error as any).response.data;
                    detailedStatus = `Horizon Error: ${errorData.title}. ${errorData.detail || ''}`;
                    const resultCodes = errorData.extras?.result_codes;
                    if(resultCodes) {
                        detailedStatus += ` (Tx: ${resultCodes.transaction}, Op: ${resultCodes.operations?.[0]})`;
                    }
                } else {
                    detailedStatus = error.message;
                }
            }
            setStatus(`Error: ${detailedStatus}`);
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-neutral-900 text-neutral-100">
            {/* Transfer Error Popup */}
            {transferError && (
                <div className="fixed top-5 right-5 w-80 bg-neutral-800 border border-neutral-700 text-neutral-200 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-neutral-100">İşlem Başarısız</h4>
                        <button onClick={() => setTransferError(null)} className="text-2xl font-bold leading-none hover:text-neutral-400 transition-colors">&times;</button>
                    </div>
                    <p className="text-sm text-neutral-300">{transferError}</p>
                </div>
            )}
            
            {/* Login Error Popup */}
            {loginAttemptError && (
                <div className="fixed top-5 left-5 w-80 bg-neutral-800 border border-neutral-700 text-neutral-200 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-neutral-100">Giriş Başarısız</h4>
                        <button onClick={() => setLoginAttemptError(null)} className="text-2xl font-bold leading-none hover:text-neutral-400 transition-colors">&times;</button>
                    </div>
                    <p className="text-sm text-neutral-300">{loginAttemptError}</p>
                    <div className="mt-2 text-xs text-neutral-400">
                        💡 İpucu: Passkey doğrulaması için parmak izi, yüz tanıma veya PIN kullanabilirsiniz.
                    </div>
                </div>
            )}
            <div className="z-10 w-full max-w-2xl items-center justify-between flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                    <Image 
                        src="/sirius-logo.png" 
                        alt="Sirius Logo" 
                        width={120} 
                        height={120} 
                        className="rounded-xl"
                    />
                    <h1 className="text-3xl font-bold text-neutral-100 text-center">Multi-Passkey Wallet</h1>
                </div>

                {/* Login/Create Section */}
                {!activeWallet ? (
                    <div className="w-full p-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 flex flex-col gap-6">
                        <h2 className="text-2xl text-center font-semibold text-neutral-100">Başlayın</h2>
                        {wallets.length > 0 && (
                            <form onSubmit={handleLogin} className="flex flex-col md:flex-row gap-4 items-center">
                                <select name="walletSelector" className="w-full px-4 py-3 bg-neutral-700 rounded-xl border border-neutral-600 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all">
                                    {wallets.map(w => <option key={w.name} value={w.name}>{w.name} ({w.address.slice(0,6)}...{w.address.slice(-6)})</option>)}
                                </select>
                                <button type="submit" disabled={isBusy} className="w-full md:w-auto px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all font-semibold disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600">
                                    Giriş Yap
                                </button>
                            </form>
                        )}
                        <button onClick={handleCreateWallet} disabled={isBusy} className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all font-semibold disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600">
                            Yeni Wallet Oluştur
                        </button>
                    </div>
                ) : (
                    <div className="w-full p-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-neutral-100">Giriş yapıldı: <span className="font-bold text-[#FD973E]">{activeWallet.name}</span></h2>
                            <button onClick={handleLogout} disabled={isBusy} className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all font-semibold disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600">
                                Çıkış Yap
                            </button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-300 mb-2">Adres:</h3>
                            <p className="font-mono text-sm text-[#D856FB] break-all bg-neutral-700 p-3 rounded-lg border border-neutral-600">{activeWallet.address}</p>
                        </div>
                    </div>
                )}

                {/* Status and Balance Section */}
                <div className="w-full p-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 min-h-[120px]">
                    <h3 className="text-xl font-semibold text-neutral-100 mb-3">Durum:</h3>
                    <p className="text-neutral-300 break-words">{status}</p>
                    {activeWallet && balance && (
                        <div className="mt-4">
                            <h4 className="font-bold text-neutral-100">Bakiye:</h4>
                            <p className="font-mono text-2xl font-bold text-[#FD973E]">{balance}</p>
                        </div>
                    )}
                </div>

                {/* Transfer Form */}
                {activeWallet && (
                    <form onSubmit={handleTransfer} className="w-full flex flex-col gap-6 p-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700">
                        <h3 className="text-2xl font-semibold text-center text-neutral-100">Ödeme Gönder</h3>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="destination" className="text-neutral-300 font-medium">Hedef Adres</label>
                            <input id="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="px-4 py-3 bg-neutral-700 rounded-xl border border-neutral-600 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all" placeholder="G..." disabled={isBusy} required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="amount" className="text-neutral-300 font-medium">Miktar (XLM)</label>
                            <input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-4 py-3 bg-neutral-700 rounded-xl border border-neutral-600 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all" placeholder="10" disabled={isBusy} required />
                        </div>
                        <button type="submit" className="w-full px-6 py-4 mt-2 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all text-lg font-semibold disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600" disabled={isBusy || !destination || !amount}>
                            {isBusy ? 'Gönderiliyor...' : 'İmzala ve Gönder'}
                        </button>
                    </form>
                )}

                {/* AI Assistant Info */}
                <div className="w-full p-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700">
                    <div className="text-center">
                        <h3 className="text-2xl font-semibold mb-4 text-neutral-100 flex items-center justify-center gap-2">
                            <Bot className="h-6 w-6" />
                            AI Asistan
                        </h3>
                        <p className="text-neutral-300 mb-6 text-base">
                            Stellar AI Asistan ile bakiye sorgulayın ve transfer işlemlerinizi kolaylaştırın!
                        </p>
                        {activeWallet ? (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={() => setIsChatOpen(true)}
                                    className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-neutral-100 shadow-lg hover:shadow-xl border border-neutral-600 flex items-center justify-center gap-2"
                                >
                                    <Send className="h-5 w-5" />
                                    Hemen Konuş
                                </button>
                                <Link 
                                    href="/ai-chat" 
                                    className="inline-block px-8 py-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-neutral-100 shadow-lg hover:shadow-xl border border-neutral-600 flex items-center justify-center gap-2"
                                >
                                    <ArrowRight className="h-5 w-5" />
                                    Tam Sayfa
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-neutral-700 border border-neutral-600 rounded-xl p-6 mb-4">
                                    <p className="text-neutral-200 text-base mb-2 flex items-center justify-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        AI Asistan'ı kullanmak için giriş yapmanız gerekiyor
                                    </p>
                                    <p className="text-neutral-400 text-sm">
                                        Güvenliğiniz için AI Asistan sadece kimlik doğrulaması yapılmış kullanıcılara açıktır.
                                    </p>
                                </div>
                                <div className="text-neutral-400 text-sm flex items-center justify-center gap-1">
                                    <ArrowRight className="h-4 w-4 rotate-90" />
                                    Yukarıdan giriş yapın veya yeni wallet oluşturun
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Floating Chat Button - only show when modal is closed and user is logged in */}
            {!isChatOpen && activeWallet && <ChatFloatingButton onClick={() => setIsChatOpen(true)} />}
            
            {/* Chat Modal - only available for logged in users */}
            {activeWallet && (
                <ChatModal 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)}
                    activeWallet={activeWallet}
                />
            )}
        </main>
    );
}
