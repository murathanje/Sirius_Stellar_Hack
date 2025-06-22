'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Coins, Settings, HelpCircle, Info } from 'lucide-react';
import TransferHandler from './TransferHandler';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

interface ChatInterfaceProps {
  activeWallet?: {
    name: string;
    address: string;
  } | null;
}

export default function ChatInterface({ activeWallet }: ChatInterfaceProps = {}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      activeWallet: activeWallet ? {
        name: activeWallet.name,
        address: activeWallet.address
      } : null
    }
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FD973E]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-neutral-800/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-neutral-700">
      {/* Header */}
      <div className="bg-neutral-700 text-neutral-100 p-6">
        <div className="flex items-center space-x-4">
          <Bot className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Stellar AI Asistan</h1>
            <p className="text-neutral-300 text-base">Bakiye sorgu ve token transfer yardımcınız</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-neutral-900">
        {messages.length === 0 && (
          <div className="text-center text-neutral-400 mt-20">
            <Bot className="h-16 w-16 mx-auto mb-6 text-neutral-600" />
            <p className="text-xl font-medium mb-3 text-neutral-200">Stellar AI Asistan'a Hoş Geldiniz!</p>
            <p className="text-base mb-6 text-neutral-400">Size nasıl yardımcı olabilirim?</p>
            <div className="space-y-3 text-sm text-left max-w-md mx-auto">
              <div className="bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-700">
                <p className="font-medium text-neutral-200 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Bakiye Sorgulama:
                </p>
                <p className="text-neutral-400">"GXXXXXXX adresinin bakiyesini kontrol et"</p>
              </div>
              <div className="bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-700">
                <p className="font-medium text-neutral-200 flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Transfer Bilgisi:
                </p>
                <p className="text-neutral-400">"10 XLM'yi GXXXXXXX adresine nasıl gönderirim?"</p>
              </div>
              <div className="bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-700">
                <p className="font-medium text-neutral-200 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Stellar Hakkında:
                </p>
                <p className="text-neutral-400">"Stellar nedir?" veya "XLM token nedir?"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-4 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-[#FD973E] text-neutral-900'
                    : 'bg-neutral-700 text-neutral-200'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              
              <div
                className={`rounded-xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#FD973E] text-neutral-900'
                    : 'bg-neutral-800 border border-neutral-700 text-neutral-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Tool Invocations Display */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.toolInvocations.map((tool, index) => (
                      <div key={index} className="bg-neutral-700 rounded-lg p-3 text-sm border border-neutral-600">
                        <div className="font-medium text-neutral-200 mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {tool.toolName === 'checkBalance' ? 'Bakiye Kontrolü' : 'Transfer İşlemi'}
                        </div>
                                                 {tool.state === 'result' && tool.result && (
                           <div className="text-neutral-300">
                             {(tool.result as any).requiresPasskeyAuth ? (
                               <TransferHandler
                                 transferDetails={(tool.result as any).transferDetails}
                                 onComplete={(result) => {
                                   if (result.success) {
                                     console.log('Transfer başarılı:', result.transactionHash);
                                   } else {
                                     console.log('Transfer başarısız:', result.error);
                                   }
                                 }}
                                 onCancel={() => console.log('Transfer iptal edildi')}
                               />
                             ) : (
                               <pre className="whitespace-pre-wrap">
                                 {JSON.stringify(tool.result, null, 2)}
                               </pre>
                             )}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FD973E]" />
                  <span className="text-neutral-300">Düşünüyorum...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-neutral-700 p-6 bg-neutral-800">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Mesajınızı yazın... (örn: 'GXXXXXXX adresinin bakiyesini kontrol et')"
            className="flex-1 border border-neutral-600 rounded-xl px-5 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all bg-neutral-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 px-8 py-3 rounded-xl flex items-center space-x-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span>Gönder</span>
          </button>
        </form>
        
        <div className="mt-3 text-sm text-neutral-400 text-center flex items-center justify-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Stellar adresleri G harfi ile başlar ve 56 karakter uzunluğundadır
        </div>
      </div>
    </div>
  );
} 