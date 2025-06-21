"use client";

import React, { useState, useEffect } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';
import { Horizon, TransactionBuilder, Operation, Networks, Asset } from '@stellar/stellar-sdk';

// The secret key of the account we created to fund new wallets.
// This is read from an environment variable.
const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;

// A random phrase for key derivation, as required by the library.
const RANDOM_PHRASE = 'stellar-passkey-demo-app-12345';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

export default function Home() {
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('Ready...');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [hasExistingWallet, setHasExistingWallet] = useState(false);

    // New state for the transfer form
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');

    const fetchBalance = async (publicKey: string) => {
        try {
            setBalance('Loading...');
            const account = await server.loadAccount(publicKey);
            const xlmBalance = account.balances.find(
                (b) => b.asset_type === 'native'
            );
            setBalance(xlmBalance ? `${parseFloat(xlmBalance.balance).toLocaleString()} XLM` : '0 XLM');
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setBalance('Could not fetch balance.');
        }
    };

    // On page load, check if a wallet was previously created on this browser
    useEffect(() => {
        const storedAddress = localStorage.getItem('passkeyWalletAddress');
        if (storedAddress) {
            setHasExistingWallet(true);
            setWalletAddress(storedAddress);
            fetchBalance(storedAddress);
            setStatus("Logged in from a previous session.");
        }
    }, []);

    const getWalletInstance = () => {
        if (!PARENT_SECRET_KEY) {
            const errorMessage = "Parent secret key is not configured in .env.local. Please check your configuration.";
            console.error(errorMessage);
            setStatus(`Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return new PasskeyWallet('testnet', PARENT_SECRET_KEY, RANDOM_PHRASE);
    }

    const handleCreateWallet = async () => {
        if (localStorage.getItem('passkeyWalletAddress')) {
            alert("A wallet already exists on this device. Please log in or clear application data to create a new one.");
            return;
        }

        setIsBusy(true);
        setStatus('Initializing wallet and waiting for passkey creation...');
        setWalletAddress(null);
        setBalance(null);

        try {
            const wallet = getWalletInstance();
            await wallet.createFromCreatingPasskey({ phrase: "passkey-user" });
            
            const newPublicKey = wallet.finalPublicKey;
            localStorage.setItem('passkeyWalletAddress', newPublicKey);
            setWalletAddress(newPublicKey);
            setHasExistingWallet(true);
            fetchBalance(newPublicKey);
            setStatus(`Success! New wallet created: ${newPublicKey}`);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    };

    const handleLogin = async () => {
        setIsBusy(true);
        setStatus('Waiting for passkey authentication...');
        setWalletAddress(null);
        setBalance(null);

        try {
            const wallet = getWalletInstance();
            await wallet.createFromExistingPasskey({ phrase: "passkey-user" });

            const loggedInPublicKey = wallet.finalPublicKey;
            localStorage.setItem('passkeyWalletAddress', loggedInPublicKey);
            setWalletAddress(loggedInPublicKey);
            fetchBalance(loggedInPublicKey);
            setStatus(`Welcome back! Logged in with wallet: ${loggedInPublicKey}`);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    }

    const handleLogout = () => {
        // We clear the active session, but keep the knowledge that a wallet exists on this device.
        setWalletAddress(null);
        setBalance(null);
        setStatus("You have been logged out. You can now log in again.");
    }

    // New function to handle the transfer
    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress || !destination || !amount) {
            alert("Please fill in the destination address and amount.");
            return;
        }

        setIsBusy(true);
        setStatus(`Preparing to send ${amount} XLM...`);

        try {
            const wallet = getWalletInstance();
            
            // Re-authenticate with passkey to get the keypair for signing
            await wallet.createFromExistingPasskey({ phrase: "passkey-user" });
            const sourceKeyPair = wallet.keyPair;

            if (!sourceKeyPair) {
                throw new Error("Could not get keypair for signing. Please try logging in again.");
            }

            const sourceAccount = await server.loadAccount(walletAddress);

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
            fetchBalance(walletAddress); // Refresh balance after sending
            setDestination('');
            setAmount('');

        } catch (error) {
            console.error("Transfer failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm flex flex-col gap-8">
                <h1 className="text-4xl font-bold">Stellar Passkey Wallet</h1>

                {!walletAddress ? (
                     <div className="w-full flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleCreateWallet}
                            className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
                            disabled={isBusy || hasExistingWallet}
                            title={hasExistingWallet ? "A wallet already exists on this device." : ""}
                        >
                            Create New Wallet
                        </button>
                         <button
                            onClick={handleLogin}
                            className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
                            disabled={isBusy}
                            title={!hasExistingWallet ? "No wallet has been created on this device yet." : "Login with your saved passkey."}
                        >
                            Login with Passkey
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-4">
                         <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
                            disabled={isBusy}
                        >
                            Logout
                        </button>
                    </div>
                )}


                <div className="w-full p-4 bg-gray-800 rounded-lg min-h-[120px]">
                    <h3 className="text-lg font-semibold">Status:</h3>
                    <p className="mt-2 text-gray-300 break-words">{status}</p>
                    {walletAddress && (
                        <div className="mt-4">
                            <h4 className="font-bold">Active Wallet Address:</h4>
                            <p className="font-mono text-green-400 break-all">{walletAddress}</p>
                            {balance && (
                                <>
                                    <h4 className="font-bold mt-2">Balance:</h4>
                                    <p className="font-mono text-yellow-400">{balance}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Transfer Form */}
                {walletAddress && (
                    <form onSubmit={handleTransfer} className="w-full flex flex-col gap-4 p-6 bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-center text-white">Send Payment</h3>
                        <div className="flex flex-col">
                            <label htmlFor="destination" className="mb-2 text-gray-300">Destination Address</label>
                            <input
                                id="destination"
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="G..."
                                disabled={isBusy}
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="amount" className="mb-2 text-gray-300">Amount (XLM)</label>
                            <input
                                id="amount"
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="10"
                                disabled={isBusy}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 mt-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
                            disabled={isBusy || !destination || !amount}
                        >
                            {isBusy ? 'Sending...' : 'Sign and Send'}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
