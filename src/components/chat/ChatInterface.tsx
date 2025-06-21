'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <Bot className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">Stellar AI Assistant</h1>
            <p className="text-blue-100 text-sm">Bakiye sorgu ve token transfer yardımcınız</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Stellar AI Assistant'a Hoş Geldiniz!</p>
            <p className="text-sm mb-4">Size nasıl yardımcı olabilirim?</p>
            <div className="space-y-2 text-xs text-left max-w-md mx-auto">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="font-medium text-gray-700">💰 Bakiye Sorgulama:</p>
                <p className="text-gray-600">"GXXXXXXX adresinin bakiyesini kontrol et"</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="font-medium text-gray-700">🚀 Transfer Bilgisi:</p>
                <p className="text-gray-600">"10 XLM'yi GXXXXXXX adresine nasıl gönderirim?"</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="font-medium text-gray-700">ℹ️ Stellar Hakkında:</p>
                <p className="text-gray-600">"Stellar nedir?" veya "XLM token nedir?"</p>
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
              className={`flex items-start space-x-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div
                className={`rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Tool Invocations Display */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.toolInvocations.map((tool, index) => (
                      <div key={index} className="bg-gray-100 rounded-md p-2 text-sm">
                        <div className="font-medium text-gray-700 mb-1">
                          🔧 {tool.toolName === 'checkBalance' ? 'Bakiye Kontrolü' : 'Transfer İşlemi'}
                        </div>
                                                 {tool.state === 'result' && tool.result && (
                           <div className="text-gray-600">
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
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-600">Düşünüyorum...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Mesajınızı yazın... (örn: 'GXXXXXXX adresinin bakiyesini kontrol et')"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Gönder</span>
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          💡 Stellar adresleri G harfi ile başlar ve 56 karakter uzunluğundadır
        </div>
      </div>
    </div>
  );
} 