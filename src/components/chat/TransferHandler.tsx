'use client';

import { useState } from 'react';
import { Loader2, Check, X, AlertTriangle, Shield, Wallet, ArrowRight, AlertCircle } from 'lucide-react';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';
import { StellarService } from '@/lib/stellar-service';

interface TransferDetails {
  from: string;
  to: string;
  amount: string;
  asset: string;
  walletName: string;
}

interface TransferHandlerProps {
  transferDetails: TransferDetails;
  onComplete: (result: { success: boolean; transactionHash?: string; error?: string }) => void;
  onCancel: () => void;
}

export default function TransferHandler({ transferDetails, onComplete, onCancel }: TransferHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleTransfer = async () => {
    setIsProcessing(true);
    setStatus('Waiting for passkey verification...');

    try {
      const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;
      if (!PARENT_SECRET_KEY) {
        throw new Error('Parent secret key not found');
      }

      const wallet = new PasskeyWallet('testnet', PARENT_SECRET_KEY, 'base-phrase-for-app');
      
      setStatus('Logging in with passkey...');
      await wallet.createFromExistingPasskey({ phrase: transferDetails.walletName });
      
      const sourceKeyPair = wallet.keyPair;
      if (!sourceKeyPair) {
        throw new Error("Keypair could not be created");
      }

      setStatus('Preparing transfer transaction...');
      
      // Transfer işlemini gerçekleştir
      const result = await StellarService.transferToken(
        sourceKeyPair.secret(),
        transferDetails.to,
        transferDetails.amount,
        transferDetails.asset === 'XLM' ? undefined : transferDetails.asset
      );

      if (result.success) {
        setStatus('Transfer completed successfully!');
        onComplete({
          success: true,
          transactionHash: result.transactionHash
        });
      } else {
        throw new Error(result.error || 'Transfer failed');
      }

    } catch (error: any) {
      console.error('Transfer error:', error);
      let errorMessage = 'Transfer operation failed';
      
      if (error.message.includes('NotAllowedError') || error.message.includes('passkey')) {
        errorMessage = 'Passkey verification failed. Please try again.';
      } else if (error.message.includes('AbortError')) {
        errorMessage = 'Operation was cancelled by user.';
      } else if (error.message.includes('InvalidStateError')) {
        errorMessage = 'No passkey registered on this device.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setStatus(`Error: ${errorMessage}`);
      onComplete({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-neutral-800/95 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 mt-3 shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-[#FD973E]" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-100 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Transfer Confirmation Required
          </h4>
          
          <div className="bg-neutral-700 rounded-lg p-4 mb-4 text-sm border border-neutral-600">
            <div className="space-y-3">
              <div>
                <strong className="text-neutral-200">From:</strong>
                <div className="font-mono text-xs break-all bg-neutral-800 p-2 rounded-lg mt-1 overflow-hidden border border-neutral-600">
                  {transferDetails.from.slice(0, 10)}...{transferDetails.from.slice(-10)}
                </div>
              </div>
              <div>
                <strong className="text-neutral-200">To:</strong>
                <div className="font-mono text-xs break-all bg-neutral-800 p-2 rounded-lg mt-1 overflow-hidden border border-neutral-600">
                  {transferDetails.to.slice(0, 10)}...{transferDetails.to.slice(-10)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><strong className="text-neutral-200">Amount:</strong> <span className="text-[#D856FB] font-semibold">{transferDetails.amount} {transferDetails.asset}</span></div>
                <div><strong className="text-neutral-200">Wallet:</strong> <span className="text-[#FD973E] font-semibold">{transferDetails.walletName}</span></div>
              </div>
            </div>
          </div>

          {status && (
            <div className="mb-4 text-sm text-neutral-300 flex items-center space-x-2 bg-neutral-700 p-3 rounded-lg border border-neutral-600">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-[#FD973E]" />}
              <span>{status}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleTransfer}
              disabled={isProcessing}
              className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 text-neutral-100 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Confirm Transfer</span>
            </button>
            
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 text-neutral-100 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>

          <div className="mt-3 text-xs text-neutral-400 bg-neutral-700 p-3 rounded-lg border border-neutral-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            This is a real blockchain transaction and cannot be reversed.
          </div>
        </div>
      </div>
    </div>
  );
} 