"use client";

import React, { useState, useEffect } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';
import { Horizon, TransactionBuilder, Operation, Networks, Asset } from '@stellar/stellar-sdk';
import BottomNavbar from '@/components/BottomNavbar';
import { Send, AlertTriangle } from 'lucide-react';

const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

interface WalletInfo {
    name: string;
    address: string;
}

export default function SendPage() {
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('Ready...');
    const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);

    useEffect(() => {
        // Load active wallet from localStorage
        const storedWallets = localStorage.getItem('passkeyWallets');
        if (storedWallets) {
            const parsedWallets: WalletInfo[] = JSON.parse(storedWallets);
            if (parsedWallets.length > 0) {
                setActiveWallet(parsedWallets[0]); // Use first wallet for now
            }
        }
    }, []);

    const getWalletInstance = () => {
        if (!PARENT_SECRET_KEY) {
            const errorMessage = "Parent secret key is not configured in .env.local.";
            setStatus(`Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return new PasskeyWallet('testnet', PARENT_SECRET_KEY, 'base-phrase-for-app');
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferError(null);

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
            setDestination('');
            setAmount('');

        } catch (error) {
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

    if (!activeWallet) {
        return (
            <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
                    <h2 className="text-2xl font-bold text-neutral-100 mb-2">Login Required</h2>
                    <p className="text-neutral-300">You need to log in first to make transfers.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 pb-24">
            {/* Transfer Error Popup */}
            {transferError && (
                <div className="fixed top-5 right-5 w-80 bg-neutral-800 border border-neutral-700 text-neutral-200 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-neutral-100">Transaction Failed</h4>
                        <button onClick={() => setTransferError(null)} className="text-2xl font-bold leading-none hover:text-neutral-400 transition-colors">&times;</button>
                    </div>
                    <p className="text-sm text-neutral-300">{transferError}</p>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Send className="h-8 w-8 text-[#FD973E]" />
                    <h1 className="text-3xl font-bold text-neutral-100">Send Payment</h1>
                </div>

                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-neutral-100 mb-2">Sender:</h3>
                    <p className="text-neutral-300 font-mono text-sm break-all bg-neutral-700 p-3 rounded-lg border border-neutral-600">
                        {activeWallet.address}
                    </p>
                    <p className="text-neutral-400 text-sm mt-1">Wallet: {activeWallet.name}</p>
                </div>

                <form onSubmit={handleTransfer} className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-700 p-8">
                    <h3 className="text-2xl font-semibold text-center text-neutral-100 mb-6">Transfer Details</h3>
                    
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="destination" className="text-neutral-300 font-medium">Recipient Address</label>
                            <input 
                                id="destination" 
                                type="text" 
                                value={destination} 
                                onChange={(e) => setDestination(e.target.value)} 
                                className="px-4 py-3 bg-neutral-700 rounded-xl border border-neutral-600 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all" 
                                placeholder="G..." 
                                disabled={isBusy} 
                                required 
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="amount" className="text-neutral-300 font-medium">Amount (XLM)</label>
                            <input 
                                id="amount" 
                                type="number" 
                                step="any" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="px-4 py-3 bg-neutral-700 rounded-xl border border-neutral-600 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all" 
                                placeholder="10" 
                                disabled={isBusy} 
                                required 
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="w-full px-6 py-4 mt-2 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all text-lg font-semibold disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600 flex items-center justify-center gap-2" 
                            disabled={isBusy || !destination || !amount}
                        >
                            {isBusy ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-100"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Sign and Send
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700">
                    <h4 className="font-semibold text-neutral-100 mb-2">Status:</h4>
                    <p className="text-neutral-300 break-words">{status}</p>
                </div>
            </div>

            <BottomNavbar activeWallet={activeWallet} />
        </main>
    );
} 