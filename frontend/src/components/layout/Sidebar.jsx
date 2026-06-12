import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';
import { Plus, MessageSquare, Trash2, Edit3, Check, X, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { chats, activeChatId, selectChat, createChat, renameChat, deleteChat, chatsLoading } = useChat();
  const navigate = useNavigate();

  // Local state for renaming tracking
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreate = async () => {
    await createChat();
  };

  const handleStartEdit = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = async (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat conversation?')) {
      await deleteChat(chatId);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full font-sans select-none">
      {/* Top Header & Actions */}
      <div className="p-4 flex flex-col flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center space-x-2 mb-6 px-2">
          <MessageSquare className="h-6 w-6 text-teal-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
            Gemini Chatbot
          </span>
        </div>

        <button
          onClick={handleCreate}
          className="w-full mb-6 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/30 text-teal-300 font-medium rounded-lg transition duration-200 shadow-md hover:shadow-teal-500/5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-0">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
              <span>Loading chats...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-slate-500 text-center text-sm py-8 font-light">
              No conversations yet
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = chat.id === editingChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => !isEditing && selectChat(chat.id)}
                  className={`group relative flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-teal-400 border border-slate-700/50 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 w-full min-w-0 pr-12">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-400'}`} />

                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-teal-500 rounded px-1.5 py-0.5 text-slate-100 focus:outline-none text-xs"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(chat.id, e)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-slate-350 font-light group-hover:text-slate-200">
                        {chat.title}
                      </span>
                    )}
                  </div>

                  {/* Hover Edit/Delete Action Icons */}
                  <div className="absolute right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveEdit(chat.id, e)}
                          className="p-1 hover:text-emerald-400 text-slate-400 transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:text-red-400 text-slate-400 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartEdit(chat, e)}
                          className="p-1 hover:text-teal-400 text-slate-500 transition"
                          title="Rename"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(chat.id, e)}
                          className="p-1 hover:text-red-400 text-slate-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Profile Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-4">
        <div className="text-xs text-slate-400 truncate px-2 font-light">
          User: {user?.email}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center space-x-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
