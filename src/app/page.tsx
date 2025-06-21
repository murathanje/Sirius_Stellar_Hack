"use client";

import React, { useState, useEffect } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';

// The secret key of the account we created to fund new wallets.
// This is read from an environment variable.
const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;

// A random phrase for key derivation, as required by the library.
const RANDOM_PHRASE = 'stellar-passkey-demo-app-12345';

export default function Home() {
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('Ready...');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [hasExistingWallet, setHasExistingWallet] = useState(false);

    // On page load, check if a wallet was previously created on this browser
    useEffect(() => {
        if (localStorage.getItem('passkeyWalletAddress')) {
            setHasExistingWallet(true);
            setStatus("An existing wallet was found on this device. You can log in.");
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

        try {
            const wallet = getWalletInstance();
            await wallet.createFromCreatingPasskey({ phrase: "passkey-user" });
            
            const newPublicKey = wallet.finalPublicKey;
            localStorage.setItem('passkeyWalletAddress', newPublicKey);
            setWalletAddress(newPublicKey);
            setHasExistingWallet(true);
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

        try {
            const wallet = getWalletInstance();
            await wallet.createFromExistingPasskey({ phrase: "passkey-user" });

            const loggedInPublicKey = wallet.finalPublicKey;
            setWalletAddress(loggedInPublicKey);
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
        // We clear the active session and the cached address,
        // but keep hasExistingWallet true so the user knows they can log back in.
        localStorage.removeItem('passkeyWalletAddress');
        setWalletAddress(null);
        setStatus("You have been logged out. You can now log in again.");
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
                    <div className="w-full">
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
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
