"use client";

import React, { useState, useEffect } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';
import { Horizon, TransactionBuilder, Operation, Networks, Asset } from '@stellar/stellar-sdk';
import Link from 'next/link';
import ChatModal, { ChatFloatingButton } from '@/components/chat/ChatModal';

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
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
            {/* Transfer Error Popup */}
            {transferError && (
                <div className="fixed top-5 right-5 w-80 bg-red-800 border border-red-600 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">Transaction Failed</h4>
                        <button onClick={() => setTransferError(null)} className="text-2xl font-bold leading-none hover:text-gray-300">&times;</button>
                    </div>
                    <p className="text-sm">{transferError}</p>
                </div>
            )}
            
            {/* Login Error Popup */}
            {loginAttemptError && (
                <div className="fixed top-5 left-5 w-80 bg-orange-800 border border-orange-600 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">Login Failed</h4>
                        <button onClick={() => setLoginAttemptError(null)} className="text-2xl font-bold leading-none hover:text-gray-300">&times;</button>
                    </div>
                    <p className="text-sm">{loginAttemptError}</p>
                    <div className="mt-2 text-xs text-orange-200">
                        💡 İpucu: Passkey doğrulaması için parmak izi, yüz tanıma veya PIN kullanabilirsiniz.
                    </div>
                </div>
            )}
            <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm flex flex-col gap-6">
                <h1 className="text-4xl font-bold">Stellar Multi-Passkey Wallet</h1>

                {/* Login/Create Section */}
                {!activeWallet ? (
                    <div className="w-full p-6 bg-gray-800 rounded-lg flex flex-col gap-4">
                        <h2 className="text-xl text-center font-semibold">Get Started</h2>
                        {wallets.length > 0 && (
                            <form onSubmit={handleLogin} className="flex flex-col md:flex-row gap-4 items-center">
                                <select name="walletSelector" className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {wallets.map(w => <option key={w.name} value={w.name}>{w.name} ({w.address.slice(0,6)}...{w.address.slice(-6)})</option>)}
                                </select>
                                <button type="submit" disabled={isBusy} className="w-full md:w-auto px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-600 shrink-0">
                                    Login
                                </button>
                            </form>
                        )}
                        <button onClick={handleCreateWallet} disabled={isBusy} className="w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-600">
                            Create a New Wallet
                        </button>
                    </div>
                ) : (
                    <div className="w-full p-6 bg-gray-800 rounded-lg flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Logged in as: <span className="font-bold text-green-400">{activeWallet.name}</span></h2>
                            <button onClick={handleLogout} disabled={isBusy} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-600">
                                Logout
                            </button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-300">Address:</h3>
                            <p className="font-mono text-sm text-green-300 break-all">{activeWallet.address}</p>
                        </div>
                    </div>
                )}

                {/* Status and Balance Section */}
                <div className="w-full p-4 bg-gray-800 rounded-lg min-h-[100px]">
                    <h3 className="text-lg font-semibold">Status:</h3>
                    <p className="mt-2 text-gray-300 break-words">{status}</p>
                    {activeWallet && balance && (
                        <div className="mt-4">
                            <h4 className="font-bold">Balance:</h4>
                            <p className="font-mono text-yellow-400 text-xl">{balance}</p>
                        </div>
                    )}
                </div>

                {/* Transfer Form */}
                {activeWallet && (
                    <form onSubmit={handleTransfer} className="w-full flex flex-col gap-4 p-6 bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-center text-white">Send Payment</h3>
                        <div className="flex flex-col">
                            <label htmlFor="destination" className="mb-2 text-gray-300">Destination Address</label>
                            <input id="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="G..." disabled={isBusy} required />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="amount" className="mb-2 text-gray-300">Amount (XLM)</label>
                            <input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="10" disabled={isBusy} required />
                        </div>
                        <button type="submit" className="w-full px-4 py-3 mt-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold disabled:bg-gray-600" disabled={isBusy || !destination || !amount}>
                            {isBusy ? 'Sending...' : 'Sign and Send'}
                        </button>
                    </form>
                )}

                {/* AI Assistant Info */}
                <div className="w-full p-6 bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">🤖 AI Assistant</h3>
                        <p className="text-gray-300 mb-4 text-sm">
                            Stellar AI Assistant ile bakiye sorgulayın ve transfer işlemlerinizi kolaylaştırın!
                        </p>
                        {activeWallet ? (
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <button 
                                    onClick={() => setIsChatOpen(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                                >
                                    💬 Hemen Konuş
                                </button>
                                <Link 
                                    href="/ai-chat" 
                                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                                >
                                    📱 Tam Sayfa
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-3">
                                    <p className="text-yellow-200 text-sm mb-2">
                                        🔒 AI Assistant'ı kullanmak için giriş yapmanız gerekiyor
                                    </p>
                                    <p className="text-yellow-300 text-xs">
                                        Güvenliğiniz için AI Assistant sadece kimlik doğrulaması yapılmış kullanıcılara açıktır.
                                    </p>
                                </div>
                                <div className="text-gray-400 text-xs">
                                    ↑ Yukarıdan giriş yapın veya yeni wallet oluşturun
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
