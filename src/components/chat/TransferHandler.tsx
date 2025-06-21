'use client';

import { useState } from 'react';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';
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
    setStatus('Passkey doğrulaması bekleniyor...');

    try {
      const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;
      if (!PARENT_SECRET_KEY) {
        throw new Error('Parent secret key bulunamadı');
      }

      const wallet = new PasskeyWallet('testnet', PARENT_SECRET_KEY, 'base-phrase-for-app');
      
      setStatus('Passkey ile giriş yapılıyor...');
      await wallet.createFromExistingPasskey({ phrase: transferDetails.walletName });
      
      const sourceKeyPair = wallet.keyPair;
      if (!sourceKeyPair) {
        throw new Error("Keypair oluşturulamadı");
      }

      setStatus('Transfer işlemi hazırlanıyor...');
      
      // Transfer işlemini gerçekleştir
      const result = await StellarService.transferToken(
        sourceKeyPair.secret(),
        transferDetails.to,
        transferDetails.amount,
        transferDetails.asset === 'XLM' ? undefined : transferDetails.asset
      );

      if (result.success) {
        setStatus('Transfer başarıyla tamamlandı!');
        onComplete({
          success: true,
          transactionHash: result.transactionHash
        });
      } else {
        throw new Error(result.error || 'Transfer başarısız');
      }

    } catch (error: any) {
      console.error('Transfer error:', error);
      let errorMessage = 'Transfer işlemi başarısız oldu';
      
      if (error.message.includes('NotAllowedError') || error.message.includes('passkey')) {
        errorMessage = 'Passkey doğrulaması başarısız. Lütfen tekrar deneyin.';
      } else if (error.message.includes('AbortError')) {
        errorMessage = 'İşlem kullanıcı tarafından iptal edildi.';
      } else if (error.message.includes('InvalidStateError')) {
        errorMessage = 'Bu cihazda kayıtlı passkey bulunamadı.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setStatus(`Hata: ${errorMessage}`);
      onComplete({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-2">
            🔐 Transfer Onayı Gerekli
          </h4>
          
          <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
            <div className="space-y-2">
              <div>
                <strong>Gönderen:</strong>
                <div className="font-mono text-xs break-all bg-white p-1 rounded mt-1 overflow-hidden">
                  {transferDetails.from.slice(0, 10)}...{transferDetails.from.slice(-10)}
                </div>
              </div>
              <div>
                <strong>Alıcı:</strong>
                <div className="font-mono text-xs break-all bg-white p-1 rounded mt-1 overflow-hidden">
                  {transferDetails.to.slice(0, 10)}...{transferDetails.to.slice(-10)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Miktar:</strong> {transferDetails.amount} {transferDetails.asset}</div>
                <div><strong>Wallet:</strong> {transferDetails.walletName}</div>
              </div>
            </div>
          </div>

          {status && (
            <div className="mb-3 text-sm text-gray-600 flex items-center space-x-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{status}</span>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleTransfer}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm font-medium flex items-center space-x-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Transfer Yap</span>
            </button>
            
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded text-sm font-medium flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>İptal</span>
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            ⚠️ Bu işlem gerçek bir blockchain transferidir ve geri alınamaz.
          </div>
        </div>
      </div>
    </div>
  );
} 