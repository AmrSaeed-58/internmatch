import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  Building2,
  Briefcase,
  Loader2,
  Smile,
  Paperclip,
  Sparkles,
  Info,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import * as messagesAPI from '../../api/messages';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return formatTime(dateStr);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const AVATAR_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-accent-400 to-orange-500',
  'from-violet-400 to-fuchsia-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-blue-600',
  'from-emerald-400 to-teal-600',
];

function UserAvatar({ name, size = 'md', online = false }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const sizeClass = size === 'xs' ? 'w-7 h-7 text-[10px]' : size === 'sm' ? 'w-9 h-9 text-xs' : size === 'lg' ? 'w-16 h-16 text-lg' : 'w-11 h-11 text-sm';
  const dotClass = size === 'lg' ? 'w-4 h-4' : size === 'xs' ? 'w-2 h-2' : 'w-3 h-3';
  const idx = (name || '').charCodeAt(0) % AVATAR_GRADIENTS.length;
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx]} flex items-center justify-center text-white font-bold shadow-md`}>
        {initials}
      </div>
      {online && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${dotClass} rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-900`} />
      )}
    </div>
  );
}

function ConversationItem({ conversation, isActive, onClick }) {
  const { otherUser, lastMessage, lastMessageAt, unreadCount } = conversation;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl mb-1 transition-all cursor-pointer text-left ${
        isActive
          ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/5 ring-1 ring-primary-400/30 dark:ring-primary-500/30'
          : 'hover:bg-surface-100 dark:hover:bg-surface-800/60'
      }`}
    >
      <UserAvatar name={otherUser.fullName} online={otherUser.isActive} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-bold truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-surface-100'}`}>
            {otherUser.fullName}
          </span>
          <span className="text-[10px] text-surface-400 dark:text-surface-500 shrink-0 ml-2 font-medium">
            {formatListTime(lastMessageAt)}
          </span>
        </div>
        <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate font-medium">
          {otherUser.companyName || 'Unknown'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? 'font-bold text-surface-800 dark:text-surface-200' : 'text-surface-400 dark:text-surface-500'}`}>
            {lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function groupMessages(messages) {
  const groups = [];
  let currentDay = null;
  let currentBlock = null;
  for (const msg of messages) {
    const day = dayLabel(msg.createdAt);
    if (day !== currentDay) {
      currentDay = day;
      groups.push({ type: 'day', day });
      currentBlock = null;
    }
    const prev = currentBlock;
    if (prev && prev.senderUserId === msg.senderUserId && (new Date(msg.createdAt) - new Date(prev.messages[prev.messages.length - 1].createdAt)) < 120000) {
      prev.messages.push(msg);
    } else {
      const block = { type: 'block', senderUserId: msg.senderUserId, messages: [msg] };
      groups.push(block);
      currentBlock = block;
    }
  }
  return groups;
}

function MessageBlock({ block, isMine, otherUserName, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.01, 0.1) }}
      className={`flex gap-2.5 mb-4 ${isMine ? 'flex-row-reverse' : ''}`}
    >
      {!isMine && <UserAvatar name={otherUserName} size="xs" />}
      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {block.messages.map((msg, i) => {
          const isFirst = i === 0;
          const isLast = i === block.messages.length - 1;
          const baseRadius = isMine
            ? `${isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-2xl rounded-tr-md'} ${isLast ? 'rounded-bl-2xl rounded-br-md' : 'rounded-bl-2xl rounded-br-md'}`
            : `${isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-md rounded-tr-2xl'} ${isLast ? 'rounded-bl-md rounded-br-2xl' : 'rounded-bl-md rounded-br-2xl'}`;
          return (
            <div
              key={msg.messageId}
              className={`px-4 py-2.5 text-sm leading-relaxed mb-0.5 last:mb-0 ${baseRadius} ${
                isMine
                  ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-glow-sm'
                  : 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 border border-surface-200/70 dark:border-surface-700/60 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          );
        })}
        <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium text-surface-400 dark:text-surface-500 ${isMine ? 'pr-1' : 'pl-1'}`}>
          <span>{formatTime(block.messages[block.messages.length - 1].createdAt)}</span>
          {isMine && <CheckCheck size={11} className="text-primary-500" />}
        </div>
      </div>
    </motion.div>
  );
}

export default function StudentMessages() {
  const { user } = useAuth();
  const socket = useSocket();
  const currentUserId = user?.userId;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConversation = conversations.find((c) => c.conversationId === activeConvId);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      (c.otherUser?.fullName || '').toLowerCase().includes(q) ||
      (c.otherUser?.companyName || '').toLowerCase().includes(q) ||
      (c.internshipTitle || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + (c.unreadCount || 0), 0), [conversations]);
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

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

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Auto-open the conversation referenced by ?conversation=ID (e.g. when
  // navigating from a "Message" button on an internship detail page).
  useEffect(() => {
    if (!requestedConvId) return;
    const id = Number(requestedConvId);
    if (!Number.isFinite(id)) return;
    setActiveConvId(id);
    setMobileShowChat(true);
    // Clear the param so refresh doesn't keep re-triggering
    const next = new URLSearchParams(searchParams);
    next.delete('conversation');
    setSearchParams(next, { replace: true });
  }, [requestedConvId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeConvId) return;
    let cancelled = false;
    async function loadMessages() {
      setMessagesLoading(true);
      try {
        const res = await messagesAPI.getMessages(activeConvId, { limit: 50 });
        if (!cancelled) setMessages(res.data.data);
        messagesAPI.markAsRead(activeConvId).catch(() => {});
        if (socket) socket.emit('message:read', { conversationId: activeConvId });
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [activeConvId, socket]);

  useEffect(() => {
    if (!socket) return;
    function handleNewMessage(msg) {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => prev.some((m) => m.messageId === msg.messageId) ? prev : [...prev, msg]);
        messagesAPI.markAsRead(msg.conversationId).catch(() => {});
        socket.emit('message:read', { conversationId: msg.conversationId });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === msg.conversationId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt, unreadCount: msg.conversationId === activeConvId ? 0 : c.unreadCount + 1 }
            : c
        )
      );
    }
    function handleReadReceipt({ conversationId }) {
      setConversations((prev) => prev.map((c) => c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c));
    }
    socket.on('message:receive', handleNewMessage);
    socket.on('message:read', handleReadReceipt);
    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:read', handleReadReceipt);
    };
  }, [socket, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConvId]);

  function handleSelectConversation(convId) {
    setActiveConvId(convId);
    setMobileShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || !activeConvId) return;
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      messageId: tempId,
      senderUserId: currentUserId,
      content: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await messagesAPI.sendMessage(activeConvId, trimmed);
      const real = res.data.data;
      // Swap the optimistic temp row for the server-confirmed message so the
      // socket echo (which also carries the real messageId) doesn't add a duplicate.
      setMessages((prev) => prev.map((m) => (m.messageId === tempId ? real : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      toast.error('Could not send message. Please try again.');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <DashboardLayout role="student">
      {/* Simple header line */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Inbox</h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">
            {conversations.length} conversations
            {totalUnread > 0 && <span className="ml-2 text-primary-600 dark:text-primary-400">· {totalUnread} unread</span>}
          </p>
        </div>
      </div>

      {/* 3-column chat */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-800 shadow-floating">
        <div className="flex h-[calc(100vh-15rem)] min-h-[560px]">
          {/* LEFT: conversation list */}
          <aside className={`${mobileShowChat ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-80 shrink-0 border-r border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40`}>
            <div className="p-4 border-b border-surface-100 dark:border-surface-800">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm placeholder-surface-400 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-primary-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={22} className="text-surface-400" />
                  </div>
                  <p className="text-sm font-bold text-surface-700 dark:text-surface-300">
                    {search ? 'No matches' : 'No conversations'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.conversationId}
                    conversation={conv}
                    isActive={activeConvId === conv.conversationId}
                    onClick={() => handleSelectConversation(conv.conversationId)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* CENTER: chat */}
          <section className={`${!mobileShowChat ? 'hidden' : 'flex'} lg:flex flex-col flex-1 min-w-0`}>
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-800">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <UserAvatar name={activeConversation.otherUser.fullName} size="sm" online={activeConversation.otherUser.isActive} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                      {activeConversation.otherUser.fullName}
                    </p>
                    <p className="text-[11px] font-medium">
                      {activeConversation.otherUser.isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400">● Online now</span>
                      ) : (
                        <span className="text-surface-500 dark:text-surface-400">Offline</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetails((s) => !s)}
                    className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
                    aria-label="Toggle details"
                  >
                    <Info size={16} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 bg-gradient-to-b from-surface-50/50 to-white dark:from-surface-900/20 dark:to-surface-950/10">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={20} className="animate-spin text-primary-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-3 shadow-glow-sm">
                        <Sparkles size={24} className="text-white" />
                      </div>
                      <p className="text-sm font-bold text-surface-700 dark:text-surface-300">Start the conversation</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Send a message to break the ice</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {groupedMessages.map((item, i) => {
                        if (item.type === 'day') {
                          return (
                            <div key={`d-${i}`} className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 px-2">{item.day}</span>
                              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
                            </div>
                          );
                        }
                        const isMine = item.senderUserId === currentUserId;
                        return (
                          <MessageBlock
                            key={`b-${i}-${item.messages[0].messageId}`}
                            block={item}
                            isMine={isMine}
                            otherUserName={activeConversation.otherUser.fullName}
                            index={i}
                          />
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-dark-card">
                  <div className="flex items-end gap-2 bg-surface-50 dark:bg-surface-800 rounded-2xl px-2 py-1.5 border border-surface-200 dark:border-surface-700 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl text-surface-400 hover:text-primary-600 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Paperclip size={16} />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 bg-transparent text-surface-900 dark:text-surface-100 text-sm placeholder-surface-400 focus:outline-none resize-none min-h-[38px] max-h-28 py-2 px-1"
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
                      }}
                    />
                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl text-surface-400 hover:text-primary-600 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Smile size={16} />
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center cursor-pointer shrink-0 shadow-glow-sm disabled:shadow-none"
                      aria-label="Send"
                    >
                      <Send size={15} />
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-500 flex items-center justify-center shadow-glow-sm"
                  >
                    <MessageSquare size={32} className="text-white" />
                  </motion.div>
                  <h3 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-1">Pick a chat</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Select a conversation to start messaging employers.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT: details panel */}
          {activeConversation && showDetails && (
            <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40">
              <div className="p-6 text-center border-b border-surface-100 dark:border-surface-800">
                <div className="flex justify-center mb-3">
                  <UserAvatar name={activeConversation.otherUser.fullName} size="lg" online={activeConversation.otherUser.isActive} />
                </div>
                <p className="font-heading font-bold text-base text-surface-900 dark:text-white truncate">
                  {activeConversation.otherUser.fullName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex items-center justify-center gap-1">
                  <Building2 size={11} />
                  {activeConversation.otherUser.companyName}
                </p>
                {activeConversation.otherUser.isActive && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    ● Active now
                  </span>
                )}
              </div>

              {activeConversation.internshipTitle && (
                <div className="p-5 border-b border-surface-100 dark:border-surface-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
                    Internship
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                        <Briefcase size={14} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-surface-900 dark:text-white truncate">
                          {activeConversation.internshipTitle}
                        </p>
                        <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate">
                          {activeConversation.otherUser.companyName}
                        </p>
                      </div>
                    </div>
                    {activeConversation.internshipId && (
                      <Link
                        to={`/internship/${activeConversation.internshipId}`}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[11px] font-bold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        View listing <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
                  Quick stats
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500 dark:text-surface-400">Total messages</span>
                    <span className="font-bold text-surface-800 dark:text-surface-200 tabular-nums">{messages.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500 dark:text-surface-400">Started</span>
                    <span className="font-bold text-surface-800 dark:text-surface-200">
                      {messages.length > 0 ? new Date(messages[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
