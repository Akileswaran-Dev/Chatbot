import React, { useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import MessageCard from './MessageCard';
import ChatInput from './ChatInput';
import { Bot, MessageSquare, Square, AlertTriangle } from 'lucide-react';


export default function ChatWindow() {
  const {
    activeChatId,
    chats,
    messages,
    messagesLoading,
    sendMessage,
    isGenerating,
    streamError,
    stopGeneration
  } = useChat();
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto Scroll Logic - Smooth scroll for user messages, snap scroll for model streaming (Step 12)
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const behavior = lastMessage.role === 'user' ? 'smooth' : 'auto';
      scrollToBottom(behavior);
    } else {
      scrollToBottom('smooth');
    }
  }, [messages]);

  const handleSend = async (content) => {
    await sendMessage(content);
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col justify-between bg-slate-950/20 font-sans">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/10">
          <div className="font-semibold text-slate-400">No Chat Active</div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="h-16 w-16 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/5">
            <Bot className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Gemini AI SaaS MVP
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mb-8 font-light leading-relaxed">
            Select a conversation thread from the sidebar or start a new chat to begin speaking with Gemini 2.5 Flash.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-950/20 font-sans min-h-0">
      {/* Active Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/10 shrink-0">
        <div className="font-medium text-slate-200 truncate pr-4">{activeChat?.title || 'Active Conversation'}</div>
        <div className="text-xs px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-400 shrink-0 select-none">
          Model: Gemini 2.5 Flash
        </div>
      </header>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar bg-slate-900/5 relative">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mb-2"></div>
            <span>Fetching messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm select-none">
            <MessageSquare className="h-8 w-8 mb-2 text-slate-600" />
            <span className="font-light">This conversation is empty. Send a prompt to begin!</span>
          </div>
        ) : (
          <div className="flex flex-col pb-16">
            {messages.map((msg) => (
              <MessageCard key={msg.id} role={msg.role} content={msg.content} />
            ))}
            
            {/* Error alerts to display rate limit or connection warnings */}
            {streamError && (
              <div className="mx-6 my-4 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start space-x-2 animate-fade-in">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Error:</span> {streamError}
                </div>
              </div>
            )}

            {/* Anchor scroll ref */}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating Stop Generation Button */}
        {isGenerating && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none select-none z-10">
            <button
              onClick={stopGeneration}
              type="button"
              className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800 text-slate-300 hover:text-red-400 text-xs font-medium rounded-full shadow-lg transition duration-200 cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop Generation</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Form Panel */}
      <ChatInput onSend={handleSend} disabled={messagesLoading || isGenerating} />
    </div>
  );
}
