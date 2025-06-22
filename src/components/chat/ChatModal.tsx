'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageCircle, Minimize2, Maximize2, Wallet, Coins, Settings, HelpCircle } from 'lucide-react';
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
        className={`bg-neutral-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-700 pointer-events-auto transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-16' 
            : 'w-96 h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="bg-neutral-700 text-neutral-100 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-sm">Stellar AI Assistant</h3>
              {!isMinimized && <p className="text-xs text-neutral-300">Balance & Transfer Helper</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Messages */}
            <div className="h-[460px] overflow-y-auto p-4 space-y-4 bg-neutral-900">
              {messages.length === 0 && (
                <div className="text-center text-neutral-400 mt-10">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
                  <p className="text-sm font-medium mb-2 text-neutral-200">Welcome to AI Assistant!</p>
                  <p className="text-xs mb-4 text-neutral-400">How can I help you?</p>
                  <div className="space-y-3 text-xs">
                    <div className="bg-neutral-800 p-3 rounded-xl shadow-sm border border-neutral-700">
                      <p className="font-medium text-neutral-200 flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Balance:
                      </p>
                      <p className="text-neutral-400">"What is the balance of address GXXX...?"</p>
                    </div>
                    <div className="bg-neutral-800 p-3 rounded-xl shadow-sm border border-neutral-700">
                      <p className="font-medium text-neutral-200 flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Transfer:
                      </p>
                      <p className="text-neutral-400">"How do I send 10 XLM?"</p>
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
                     className={`flex items-start space-x-3 max-w-[90%] ${
                       message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                     }`}
                   >
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-[#FD973E] text-neutral-900'
                          : 'bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>
                    
                                         <div
                       className={`rounded-xl p-3 text-sm break-words overflow-hidden shadow-sm ${
                         message.role === 'user'
                           ? 'bg-[#FD973E] text-neutral-900'
                           : 'bg-neutral-800 border border-neutral-700 text-neutral-100'
                       }`}
                     >
                                             <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full">{message.content}</div>
                      
                      {/* Tool Invocations Display */}
                                               {message.toolInvocations && message.toolInvocations.length > 0 && (
                           <div className="mt-3 space-y-2 max-w-full">
                             {message.toolInvocations.map((tool, index) => (
                               <div key={index} className="bg-neutral-700 rounded-lg p-3 text-xs overflow-hidden border border-neutral-600">
                                 <div className="font-medium text-neutral-200 mb-2 flex items-center gap-2">
                                   <Settings className="h-4 w-4" />
                                   {tool.toolName === 'checkBalance' ? 'Balance Check' : 'Transfer Operation'}
                                 </div>
                                                       {tool.state === 'result' && tool.result && (
                           <div className="text-neutral-300">
                             {(tool.result as any).requiresPasskeyAuth ? (
                               <TransferHandler
                                 transferDetails={(tool.result as any).transferDetails}
                                 onComplete={(result) => {
                                   // Send result to AI when transfer is completed
                                   if (result.success) {
                                     const successMessage = `✅ Transfer completed successfully!\n\nTx Hash: ${result.transactionHash}`;
                                     // Can be added as new message
                                   } else {
                                     const errorMessage = `❌ Transfer failed: ${result.error}`;
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
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#FD973E]" />
                        <span className="text-neutral-300 text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-neutral-700 p-4 bg-neutral-800 rounded-b-2xl">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 border border-neutral-600 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FD973E] focus:border-transparent transition-all bg-neutral-700"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed text-neutral-100 px-4 py-3 rounded-xl flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-neutral-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              
              <div className="mt-2 text-xs text-neutral-400 text-center flex items-center justify-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Stellar addresses start with G (56 characters)
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
      className="fixed bottom-6 right-6 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-110 z-40 backdrop-blur-sm border border-neutral-600"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
} 