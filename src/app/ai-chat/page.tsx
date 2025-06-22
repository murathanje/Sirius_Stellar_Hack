'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { Bot, ArrowLeft, Lock, Shield, HelpCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-neutral-600 animate-pulse" />
          <p className="mt-4 text-neutral-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-900 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border border-neutral-700">
            <div className="mb-8">
              <Lock className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
              <h1 className="text-3xl font-bold text-neutral-100 mb-3">
                Kimlik Doğrulaması Gerekli
              </h1>
              <p className="text-neutral-300 mb-8 text-lg">
                AI Asistan'ı kullanabilmek için Stellar wallet'ınızla giriş yapmanız gerekiyor.
              </p>
            </div>

            <div className="bg-neutral-700 border border-neutral-600 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-neutral-100 mb-3 text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Güvenlik Önlemleri
              </h3>
              <ul className="text-sm text-neutral-300 space-y-2 text-left">
                <li>• AI Asistan sadece doğrulanmış kullanıcılara açıktır</li>
                <li>• Stellar bakiye sorguları ve işlemler için kimlik doğrulaması gerekir</li>
                <li>• Passkey teknolojisi ile güvenli giriş</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link 
                href="/"
                className="inline-block w-full px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-neutral-600"
              >
                Ana Sayfaya Dön ve Giriş Yap
              </Link>
              
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center w-full px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Geri Dön
              </button>
            </div>

            <div className="mt-8 text-sm text-neutral-400 flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Henüz wallet'ınız yok mu? Ana sayfadan ücretsiz oluşturabilirsiniz!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-8 px-4">
      <div className="container mx-auto mb-6">
        <Link 
          href="/"
          className="inline-flex items-center text-neutral-300 hover:text-neutral-100 transition-colors bg-neutral-800/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-700"
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