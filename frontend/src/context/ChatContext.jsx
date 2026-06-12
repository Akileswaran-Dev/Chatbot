import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api';
import useAuth from '../hooks/useAuth';

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { token, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const abortControllerRef = useRef(null);

  // Load chat threads index
  const loadChats = useCallback(async () => {
    if (!token) return;
    setChatsLoading(true);
    try {
      const res = await apiClient.get('/chats');
      setChats(res.data);
      // If there's an active chat, make sure it still exists
      if (activeChatId && !res.data.some(c => c.id === activeChatId)) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setChatsLoading(false);
    }
  }, [token, activeChatId]);

  // Load chats on authentication state changes
  useEffect(() => {
    if (token) {
      loadChats();
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    }
  }, [token, loadChats]);

  // Fetch history for selected conversation
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    setMessagesLoading(true);
    try {
      const res = await apiClient.get(`/chats/${chatId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Cancel generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, []);

  // Handle switching active chats
  const selectChat = (chatId) => {
    stopGeneration();
    setActiveChatId(chatId);
    setStreamError(null);
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
    }
  };

  // Create new chat
  const createChat = async (title = 'New Chat') => {
    try {
      const res = await apiClient.post('/chats', { title });
      const newChat = res.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      return newChat;
    } catch (err) {
      console.error('Failed to create chat:', err);
      return null;
    }
  };

  // Rename conversation
  const renameChat = async (chatId, title) => {
    try {
      const res = await apiClient.patch(`/chats/${chatId}`, { title });
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: res.data.title } : c));
      return true;
    } catch (err) {
      console.error('Failed to rename chat:', err);
      return false;
    }
  };

  // Delete conversation
  const deleteChat = async (chatId) => {
    try {
      await apiClient.delete(`/chats/${chatId}`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete chat:', err);
      return false;
    }
  };

  // Send message and stream response locally
  const sendMessage = async (content) => {
    if (!activeChatId || isGenerating) return;
    
    setIsGenerating(true);
    setStreamError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Optimistically create and append User message locally
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };

    const tempModelMsg = {
      id: 'temp-model-streaming',
      role: 'model',
      content: '',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, tempModelMsg]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    try {
      const response = await fetch(`${API_URL}/chats/${activeChatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content }),
        signal: controller.signal
      });

      if (response.status === 401) {
        if (logout) logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        let errMsg = 'Failed to connect to the stream.';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                setStreamError(parsed.error);
              } else if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setMessages(prev => prev.map(m => 
                  m.id === 'temp-model-streaming' ? { ...m, content: accumulatedText } : m
                ));
              }
            } catch (err) {
              console.error('Error parsing stream chunk:', err);
            }
          }
        }
      }

      // Sync database messages at the end to get actual model message with UUID and precise time
      await loadMessages(activeChatId);
      await loadChats();

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
        await loadMessages(activeChatId);
      } else {
        console.error('Failed to send message/stream:', err);
        setStreamError(err.message || 'Connection lost. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== 'temp-model-streaming'));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChatId,
      messages,
      chatsLoading,
      messagesLoading,
      isGenerating,
      streamError,
      loadChats,
      selectChat,
      createChat,
      renameChat,
      deleteChat,
      sendMessage,
      stopGeneration
    }}>
      {children}
    </ChatContext.Provider>
  );
};
