import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';


export default function ChatInput({ onSend, disabled }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-slate-900">
      <div className="relative max-w-3xl mx-auto flex items-end bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-lg focus-within:border-teal-500/50 transition">
        <textarea
          ref={textareaRef}
          rows="1"
          placeholder="Ask anything..."
          className="flex-1 bg-transparent border-0 outline-none resize-none text-slate-200 text-sm max-h-40 font-light pr-12 focus:ring-0 custom-scrollbar py-0.5"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="absolute right-3 bottom-2.5 p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg disabled:opacity-30 disabled:hover:bg-teal-500 transition duration-200 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
