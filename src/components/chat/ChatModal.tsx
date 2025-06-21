'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import TransferHandler from './TransferHandler';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet?: {
    name: string;
    address: string;
  } | null;
}

export default function ChatModal({ isOpen, onClose, activeWallet }: ChatModalProps) {
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div 
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-16' 
            : 'w-96 h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-sm">Stellar AI Assistant</h3>
              {!isMinimized && <p className="text-xs text-blue-100">Bakiye & Transfer Yardımcısı</p>}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Messages */}
            <div className="h-[460px] overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium mb-2">AI Assistant'a Hoş Geldiniz!</p>
                  <p className="text-xs mb-3">Size nasıl yardımcı olabilirim?</p>
                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2 rounded shadow-sm">
                      <p className="font-medium text-gray-700">💰 Bakiye:</p>
                      <p className="text-gray-600">"GXXX... adresinin bakiyesi nedir?"</p>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <p className="font-medium text-gray-700">🚀 Transfer:</p>
                      <p className="text-gray-600">"10 XLM nasıl gönderirim?"</p>
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
                     className={`flex items-start space-x-2 max-w-[90%] ${
                       message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                     }`}
                   >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </div>
                    
                                         <div
                       className={`rounded-lg p-2 text-sm break-words overflow-hidden ${
                         message.role === 'user'
                           ? 'bg-blue-500 text-white'
                           : 'bg-white border border-gray-200 text-gray-800'
                       }`}
                     >
                                             <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full">{message.content}</div>
                      
                      {/* Tool Invocations Display */}
                                               {message.toolInvocations && message.toolInvocations.length > 0 && (
                           <div className="mt-2 space-y-1 max-w-full">
                             {message.toolInvocations.map((tool, index) => (
                               <div key={index} className="bg-gray-100 rounded p-1 text-xs overflow-hidden">
                                 <div className="font-medium text-gray-700 mb-1">
                                   🔧 {tool.toolName === 'checkBalance' ? 'Bakiye Kontrolü' : 'Transfer İşlemi'}
                                 </div>
                                                       {tool.state === 'result' && tool.result && (
                           <div className="text-gray-600">
                             {(tool.result as any).requiresPasskeyAuth ? (
                               <TransferHandler
                                 transferDetails={(tool.result as any).transferDetails}
                                 onComplete={(result) => {
                                   // Transfer tamamlandığında sonucu AI'ya gönder
                                   if (result.success) {
                                     const successMessage = `✅ Transfer başarıyla tamamlandı!\n\nTx Hash: ${result.transactionHash}`;
                                     // Yeni mesaj olarak eklenebilir
                                   } else {
                                     const errorMessage = `❌ Transfer başarısız: ${result.error}`;
                                   }
                                   setPendingTransfer(null);
                                 }}
                                 onCancel={() => setPendingTransfer(null)}
                               />
                             ) : (
                                                               <div className="text-xs break-words overflow-hidden">
                                  <pre className="whitespace-pre-wrap break-all max-w-full overflow-x-auto text-wrap">
                                    {JSON.stringify(tool.result, null, 2)}
                                  </pre>
                                </div>
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
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-gray-600 text-sm">Düşünüyorum...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded flex items-center space-x-1 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              
              <div className="mt-1 text-xs text-gray-500 text-center">
                💡 Stellar adresleri G ile başlar (56 karakter)
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Floating Chat Button Component
export function ChatFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 z-40"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
} 