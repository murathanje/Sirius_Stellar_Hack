'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { Bot, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AIChat() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWallet, setActiveWallet] = useState<{name: string, address: string} | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user has active wallet from localStorage
    const storedWallets = localStorage.getItem('passkeyWallets');
    if (storedWallets) {
      const parsedWallets = JSON.parse(storedWallets);
      setIsLoggedIn(parsedWallets.length > 0);
      // For now, use the first wallet as active (can be enhanced later)
      if (parsedWallets.length > 0) {
        setActiveWallet(parsedWallets[0]);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Kimlik Doğrulaması Gerekli
              </h1>
              <p className="text-gray-600 mb-6">
                AI Assistant'ı kullanabilmek için Stellar wallet'ınızla giriş yapmanız gerekiyor.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">🔐 Güvenlik Önlemleri</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• AI Assistant sadece doğrulanmış kullanıcılara açıktır</li>
                <li>• Stellar bakiye sorguları ve işlemler için kimlik doğrulaması gerekir</li>
                <li>• Passkey teknolojisi ile güvenli giriş</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link 
                href="/"
                className="inline-block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Ana Sayfaya Dön ve Giriş Yap
              </Link>
              
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>💡 Henüz wallet'ınız yok mu? Ana sayfadan ücretsiz oluşturabilirsiniz!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
      <div className="container mx-auto mb-4">
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ana Sayfaya Dön
        </Link>
      </div>
      <div className="container mx-auto">
        <ChatInterface activeWallet={activeWallet} />
      </div>
    </div>
  );
} 