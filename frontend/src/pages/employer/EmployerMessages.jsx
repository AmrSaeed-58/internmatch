import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { MessageSquare, Send, Search, ChevronLeft, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import * as messagesAPI from '../../api/messages';

function formatTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${s} rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg`}>
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

export default function EmployerMessages() {
  const { user } = useAuth();
  const socket = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConvId = searchParams.get('conversation');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const bottomRef = useRef(null);

  const activeConv = conversations.find((c) => c.conversationId === activeId);

  const filteredConvs = conversations.filter((c) =>
    c.otherUser.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (c.internshipTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await messagesAPI.getConversations({ limit: 50 });
      setConversations(res.data.data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-open the conversation referenced by ?conversation=ID (e.g. when
  // navigating from the "Message Student" button on the applicants page).
  useEffect(() => {
    if (!requestedConvId) return;
    const id = Number(requestedConvId);
    if (!Number.isFinite(id)) return;
    setActiveId(id);
    setMobileView('chat');
    const next = new URLSearchParams(searchParams);
    next.delete('conversation');
    setSearchParams(next, { replace: true });
  }, [requestedConvId, searchParams, setSearchParams]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    async function loadMessages() {
      setMessagesLoading(true);
      try {
        const res = await messagesAPI.getMessages(activeId, { limit: 50 });
        if (!cancelled) setMessages(res.data.data);
        messagesAPI.markAsRead(activeId).catch(() => {});
        if (socket) socket.emit('message:read', { conversationId: activeId });
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [activeId, socket]);

  // Socket.IO real-time
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(msg) {
      // Skip echoes of our own messages — the optimistic update + API
      // response already handle the sender's view, so accepting the socket
      // copy too would race and double-render.
      if (msg.senderUserId === user?.userId) return;

      if (msg.conversationId === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [...prev, msg];
        });
        messagesAPI.markAsRead(msg.conversationId).catch(() => {});
        socket.emit('message:read', { conversationId: msg.conversationId });
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount: msg.conversationId === activeId ? 0 : c.unreadCount + 1,
              }
            : c
        )
      );
    }

    function handleReadReceipt({ conversationId }) {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    }

    socket.on('message:receive', handleNewMessage);
    socket.on('message:read', handleReadReceipt);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:read', handleReadReceipt);
    };
  }, [socket, activeId, user?.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  function openConv(id) {
    setActiveId(id);
    setMobileView('chat');
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !activeId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      messageId: tempId,
      senderUserId: user?.userId,
      content: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await messagesAPI.sendMessage(activeId, trimmed);
      const real = res.data.data;
      // Swap optimistic temp row for the server-confirmed message so the
      // socket echo (same messageId) doesn't add a duplicate.
      setMessages((prev) => prev.map((m) => (m.messageId === tempId ? real : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      toast.error('Could not send message. Please try again.');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <DashboardLayout role="employer">
      <div className="flex flex-col space-y-4">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
          className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
          <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
          <div className="relative p-7 md:p-10">
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">COMMUNICATION</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              Messages
            </h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              Communicate with applicants and students.
            </p>
          </div>
        </motion.div>

        <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="relative flex h-full rounded-xl overflow-hidden">
            {/* Sidebar */}
            <div className={`flex flex-col w-full md:w-72 lg:w-80 shrink-0 border-r border-surface-100 dark:border-surface-700 ${activeId && mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-surface-100 dark:border-surface-700">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-primary-500" />
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mb-3 shadow-lg">
                      <MessageSquare size={20} className="text-white" />
                    </div>
                    <p className="text-sm font-bold text-surface-600 dark:text-surface-400">No conversations yet</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                      Conversations with students will appear here.
                    </p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => openConv(conv.conversationId)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500/30 ${
                        activeId === conv.conversationId
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <Avatar name={conv.otherUser.fullName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                            {conv.otherUser.fullName}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </p>
                        </div>
                        {conv.internshipTitle && (
                          <p className="text-xs text-primary-500 dark:text-primary-400 truncate mt-0.5">
                            {conv.internshipTitle}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-surface-500 dark:text-surface-400 truncate flex-1">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 w-4 h-4 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${(!activeId || mobileView === 'list') ? 'hidden md:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-glow-sm">
                    <MessageSquare size={24} className="text-white" />
                  </div>
                  <h3 className="font-heading text-base font-extrabold text-surface-800 dark:text-white mb-1 tracking-tight">
                    {conversations.length === 0 ? 'No Messages Yet' : 'Select a Conversation'}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {conversations.length === 0
                      ? 'Start a conversation with a student from the applicants page.'
                      : 'Choose a conversation from the sidebar to start messaging.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700 shrink-0 bg-surface-50/50 dark:bg-surface-800/30">
                    <button
                      onClick={() => { setMobileView('list'); }}
                      className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-150 cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <Avatar name={activeConv.otherUser.fullName} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-surface-900 dark:text-white">
                        {activeConv.otherUser.fullName}
                      </p>
                      {activeConv.internshipTitle && (
                        <p className="text-xs text-primary-500 dark:text-primary-400">
                          Re: {activeConv.internshipTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 size={20} className="animate-spin text-primary-500" />
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderUserId === user?.userId;
                        return (
                          <div key={msg.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <Avatar name={activeConv.otherUser.fullName} size="sm" />
                            )}
                            <div className={`max-w-[75%] ml-2 mr-2`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-sm shadow-glow-sm'
                                  : 'bg-surface-100 dark:bg-surface-700/60 text-surface-800 dark:text-surface-200 rounded-bl-sm'
                              }`}>
                                {msg.content}
                              </div>
                              <p className={`text-[10px] text-surface-400 dark:text-surface-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-surface-100 dark:border-surface-700 shrink-0 bg-surface-50/50 dark:bg-surface-800/30">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150"
                        placeholder="Type a message..."
                        style={{ maxHeight: '120px' }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-center hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 shadow-glow-sm"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 ml-1">
                      Press Enter to send · Shift+Enter for new line
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
