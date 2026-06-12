import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Bot, User } from 'lucide-react';


export default function MessageCard({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full space-x-4 p-6 border-b border-slate-900/60 ${isUser ? 'bg-slate-950/20' : 'bg-slate-900/10'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold select-none ${
        isUser
          ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden select-text">
        <div className="text-xs font-semibold text-slate-500 capitalize select-none">
          {isUser ? 'You' : 'Assistant'}
        </div>

        <div className="prose prose-invert prose-sm max-w-none text-slate-350 font-light leading-relaxed">
          {!content && !isUser ? (
            <div className="flex space-x-1.5 py-2 items-center" aria-label="Assistant is thinking">
              <div className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      value={String(children).replace(/\n$/, '')}
                      language={match[1]}
                      {...props}
                    />
                  ) : (
                    <code className={`${className} bg-slate-950 px-1.5 py-0.5 rounded text-xs border border-slate-800 text-teal-350 font-mono`} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
