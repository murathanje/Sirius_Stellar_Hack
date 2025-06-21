"use client";

import React, { useState } from 'react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';

// The secret key of the account we created to fund new wallets.
// This is now read from an environment variable.
const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;

// A random phrase for key derivation, as required by the library.
const RANDOM_PHRASE = 'stellar-passkey-demo-app-12345';

export default function Home() {
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('Ready...');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    const handleCreateWallet = async () => {
        setIsBusy(true);
        setStatus('Initializing wallet and waiting for passkey creation...');
        setWalletAddress(null);

        if (!PARENT_SECRET_KEY) {
            const errorMessage = "Parent secret key is not configured in .env.local";
            console.error(errorMessage);
            setStatus(`Error: ${errorMessage}`);
            setIsBusy(false);
            return;
        }

        try {
            // Initialize the wallet instance
            const wallet = new PasskeyWallet('testnet', PARENT_SECRET_KEY, RANDOM_PHRASE);

            // The method expects an options object. We can pass the user handle in the 'phrase' property.
            await wallet.createFromCreatingPasskey({ phrase: "passkey-user" });
            
            const newPublicKey = wallet.finalPublicKey;
            setWalletAddress(newPublicKey);
            setStatus(`Success! New wallet created with address: ${newPublicKey}`);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm flex flex-col gap-8">
                <h1 className="text-4xl font-bold">Stellar Passkey Wallet (Simple)</h1>
                <p className="text-gray-400 text-center">
                    This demo uses a simpler, frontend-only Passkey library. Click the button to create a new Stellar account on the Testnet using your device's biometrics.
                </p>

                <div className="w-full">
                    <button
                        onClick={handleCreateWallet}
                        className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold disabled:bg-gray-600"
                        disabled={isBusy}
                    >
                        {isBusy ? 'Processing...' : 'Create New Wallet with Passkey'}
                    </button>
                </div>

                <div className="w-full p-4 bg-gray-800 rounded-lg min-h-[120px]">
                    <h3 className="text-lg font-semibold">Status:</h3>
                    <p className="mt-2 text-gray-300 break-words">{status}</p>
                    {walletAddress && (
                        <div className="mt-4">
                            <h4 className="font-bold">New Wallet Address:</h4>
                            <p className="font-mono text-green-400 break-all">{walletAddress}</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
