import React, { useEffect, useRef, useState } from 'react';
import { Channel, Message, MessageAttachment, User } from '../types';
import {
  Bell,
  ChevronDown,
  Compass,
  Copy,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Paperclip,
  Pin,
  Plus,
  Radio,
  Search,
  Menu,
  Send,
  Smile,
  Tv,
  Users,
  X
} from 'lucide-react';

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  currentUser: User;
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void;
  onSendTyping: (isTyping: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  typingUsers: { id: string; name: string }[];
  isMemberListOpen: boolean;
  onToggleMemberList: () => void;
  isVoiceActive?: boolean;
  onOpenVoiceStage?: () => void;
  onToggleMobileNav?: () => void;
  onNavigateToCommunity?: (channelId?: string) => void;
  isCommunityServer?: boolean;
  communityChannels?: Channel[];
}

const POPULAR_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '👀', '💯'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  messages,
  currentUser,
  onSendMessage,
  onSendTyping,
  onToggleReaction,
  typingUsers,
  isMemberListOpen,
  onToggleMemberList,
  isVoiceActive = false,
  onOpenVoiceStage,
  onToggleMobileNav,
  onNavigateToCommunity,
  isCommunityServer = true,
  communityChannels = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMessageReactionId, setActiveMessageReactionId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const channelMessages = messages.filter((m) => m.channelId === channel.id);

  const filteredMessages = searchQuery.trim()
    ? channelMessages.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channelMessages;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Typing throttle
    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    onSendTyping(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            type: file.type,
            size: file.size,
            url,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Helper to render markdown-like text
  const renderMessageText = (text: string) => {
    if (!text) return null;

    // Check for code blocks
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.slice(3, -3).replace(/^[a-z]+\n/i, '');
          return (
            <div key={index} className="my-2 rounded-lg bg-[#1e1f22] border border-[#313338] p-3 overflow-x-auto relative group">
              <pre className="font-mono text-xs text-emerald-300 leading-relaxed">{content}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(content)}
                className="absolute top-2 right-2 p-1 rounded bg-[#2b2d31] opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity"
                title="Copy Code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }
        return <span key={index}>{renderInlineStyles(part)}</span>;
      });
    }

    return renderInlineStyles(text);
  };

  const renderInlineStyles = (content: string) => {
    // Basic bold **text** and inline `code`
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-[#1e1f22] text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const otherTypingUsers = typingUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="flex-1 bg-[#313338] flex flex-col min-w-0 relative">
      {/* Top Channel Header */}
      <div className="h-12 px-2.5 sm:px-4 border-b border-[#202225] shadow-sm flex items-center justify-between shrink-0 bg-[#313338] z-10 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 lg:hidden shrink-0 shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Open Server & Channels"
              aria-label="Open Channels"
            >
              <Menu className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">Channels</span>
            </button>
          )}
          <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="font-bold text-white text-sm sm:text-base truncate">{channel.name}</h3>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            In Channel
          </span>
          {channel.topic && (
            <>
              <div className="hidden lg:block w-[1px] h-4 bg-[#3f4147] mx-2" />
              <p className="hidden lg:block text-xs text-zinc-400 truncate max-w-xs">{channel.topic}</p>
            </>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2 text-zinc-400 shrink-0">
          {/* Navigate Button */}
          {onNavigateToCommunity && (
            <div className="relative inline-flex items-center">
              <div className="flex items-center rounded-lg bg-indigo-600/25 border border-indigo-500/40 text-xs font-bold shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToCommunity(channel.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-colors group cursor-pointer active:scale-95 touch-manipulation"
                  title="Navigate to Community Server"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-transform group-hover:rotate-45" />
                  <span className="text-xs">Navigate</span>
                  <span className="hidden sm:inline text-[9px] bg-indigo-500/40 text-indigo-200 px-1 py-0.2 rounded font-mono">
                    Hub
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNavDropdownOpen(!navDropdownOpen);
                  }}
                  className="px-1.5 py-1.5 hover:bg-indigo-600 text-indigo-300 hover:text-white border-l border-indigo-500/30 transition-colors cursor-pointer touch-manipulation"
                  title="Browse Channels"
                  aria-label="Browse Channels"
                >
                  <ChevronDown className="w-3 h-3 text-indigo-300" />
                </button>
              </div>

              {/* Navigate Dropdown */}
              {navDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNavDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-9 bg-[#1e1f22] border border-[#35373c] rounded-xl p-1.5 shadow-2xl z-40 w-64 space-y-1 text-xs font-medium">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span>Galaxy Cord Community Server</span>
                    </div>

                    <button
                      onClick={() => {
                        setNavDropdownOpen(false);
                        onNavigateToCommunity(channel.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#2b2d31] text-white flex items-center justify-between font-semibold cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate">Return to #{channel.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">Current</span>
                    </button>

                    <div className="h-[1px] bg-[#313338] my-1" />

                    {(communityChannels.length > 0 ? communityChannels : [
                      { id: 'c-general', name: 'general', type: 'text' },
                      { id: 'c-announcements', name: 'announcements', type: 'text' },
                      { id: 'c-gaming', name: 'gaming', type: 'text' },
                      { id: 'v-lounge', name: 'Lounge Talk', type: 'voice' },
                      { id: 'v-screenshare', name: 'Screen Share & Streams', type: 'voice' },
                    ]).map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setNavDropdownOpen(false);
                          onNavigateToCommunity(c.id);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#2b2d31] text-zinc-300 hover:text-white flex items-center gap-2 truncate cursor-pointer"
                      >
                        {c.type === 'voice' ? (
                          <Tv className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Voice Watch Stream Banner */}
          {isVoiceActive && onOpenVoiceStage && (
            <button
              onClick={onOpenVoiceStage}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 transition-colors cursor-pointer touch-manipulation"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Watch Stream</span>
            </button>
          )}

          {/* Search Button for Mobile */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-1.5 rounded hover:bg-[#35373c] text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
            title="Search Messages"
            aria-label="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Search Bar for Desktop / Medium+ screens */}
          <div className="hidden md:relative md:block">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 lg:w-44 focus:w-56 transition-all bg-[#1e1f22] text-xs text-zinc-200 placeholder-zinc-500 rounded px-2.5 py-1 pl-7 outline-none border border-transparent focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onToggleMemberList}
            className={`p-1.5 rounded hover:bg-[#35373c] transition-colors cursor-pointer touch-manipulation ${
              isMemberListOpen ? 'text-white bg-[#35373c]' : 'text-zinc-400'
            }`}
            title="Toggle Member List"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Search Strip */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3 py-2 bg-[#232428] border-b border-[#35373c] flex items-center gap-2 z-10 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              placeholder={`Search in #${channel.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f22] text-xs text-zinc-200 placeholder-zinc-500 rounded-lg px-3 py-1.5 pl-8 outline-none border border-indigo-500/50"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              setSearchQuery('');
            }}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 no-scrollbar select-text touch-pan-y overscroll-contain">
        {/* Welcome Channel Banner */}
        <div className="pt-8 pb-4 space-y-2 border-b border-[#35373c]/50">
          <div className="w-14 h-14 rounded-full bg-[#2b2d31] flex items-center justify-center text-zinc-300">
            <Hash className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to #{channel.name}!</h1>
          <p className="text-zinc-400 text-sm">
            This is the start of the #{channel.name} channel. Send messages, talk, or share your screen!
          </p>
        </div>

        {/* Message Items */}
        {filteredMessages.map((msg, index) => {
          const isSameSender =
            index > 0 &&
            filteredMessages[index - 1].senderId === msg.senderId &&
            msg.timestamp - filteredMessages[index - 1].timestamp < 300000;

          const date = new Date(msg.timestamp);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={msg.id}
              className={`group flex gap-3 px-2 py-1 -mx-2 rounded-lg hover:bg-[#2b2d31]/50 transition-colors relative ${
                msg.system ? 'bg-indigo-950/20 border-l-2 border-indigo-500 pl-3' : ''
              }`}
            >
              {/* Message Hover Actions (Add Reaction, etc.) */}
              <div className="absolute right-3 -top-3 hidden group-hover:flex items-center bg-[#2b2d31] border border-[#35373c] rounded-md shadow-lg p-0.5 z-10">
                {POPULAR_EMOJIS.slice(0, 4).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(msg.id, emoji)}
                    className="p-1 hover:bg-[#35373c] rounded text-sm transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setActiveMessageReactionId(
                      activeMessageReactionId === msg.id ? null : msg.id
                    )
                  }
                  className="p-1 text-zinc-400 hover:text-white hover:bg-[#35373c] rounded"
                  title="Add Reaction"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Reaction Popover if open for this message */}
              {activeMessageReactionId === msg.id && (
                <div className="absolute right-3 top-6 bg-[#1e1f22] border border-[#35373c] rounded-lg p-2 shadow-2xl flex gap-1 z-30">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onToggleReaction(msg.id, emoji);
                        setActiveMessageReactionId(null);
                      }}
                      className="p-1.5 hover:bg-[#2b2d31] rounded text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Avatar */}
              {!isSameSender ? (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-10 h-10 rounded-full bg-zinc-800 object-cover shrink-0 cursor-pointer hover:opacity-90 mt-0.5"
                />
              ) : (
                <div className="w-10 shrink-0 text-right pr-2">
                  <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100">
                    {timeString}
                  </span>
                </div>
              )}

              {/* Message Body */}
              <div className="flex-1 min-w-0">
                {!isSameSender && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                      {msg.senderName}
                    </span>
                    {msg.system && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 rounded uppercase">
                        System
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400">{timeString}</span>
                  </div>
                )}

                {/* Text Content */}
                <div className="text-zinc-200 text-sm break-words whitespace-pre-wrap leading-relaxed">
                  {renderMessageText(msg.text)}
                </div>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((att) => {
                      const isImage = att.type.startsWith('image/');
                      return isImage ? (
                        <div key={att.id} className="relative group max-w-sm rounded-lg overflow-hidden border border-[#35373c]">
                          <img
                            src={att.url}
                            alt={att.name}
                            onClick={() => setPreviewImage(att.url)}
                            className="max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-95"
                          />
                          <a
                            href={att.url}
                            download={att.name}
                            className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download Image"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-lg border border-[#35373c] max-w-sm"
                        >
                          <FileText className="w-6 h-6 text-indigo-400 shrink-0" />
                          <div className="truncate flex-1">
                            <div className="text-xs font-semibold text-white truncate">{att.name}</div>
                            <div className="text-[10px] text-zinc-400">
                              {(att.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <a
                            href={att.url}
                            download={att.name}
                            className="p-1.5 rounded bg-[#35373c] text-zinc-300 hover:text-white hover:bg-indigo-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                      const hasReacted = userIds.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => onToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
                            hasReacted
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                              : 'bg-[#2b2d31] text-zinc-300 border-[#35373c] hover:bg-[#35373c]'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[11px] font-bold">{userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-4 h-5 text-xs text-zinc-400 flex items-center shrink-0">
        {otherTypingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="font-semibold text-zinc-300">
              {otherTypingUsers.map((u) => u.name).join(', ')}
            </span>
            <span>{otherTypingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
      </div>

      {/* Message Input Container */}
      <div className="px-4 pb-4 shrink-0">
        {/* Pending Attachments Strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-[#2b2d31] rounded-t-lg border-x border-t border-[#35373c]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-[#1e1f22] px-2.5 py-1.5 rounded-md text-xs text-zinc-200 border border-[#35373c]"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 gap-3 border border-[#3f4147] focus-within:border-indigo-500 transition-colors relative ${attachments.length > 0 ? 'rounded-t-none' : ''}`}>
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 rounded-full bg-[#4e5058] hover:bg-zinc-300 text-zinc-300 hover:text-black flex items-center justify-center transition-colors shrink-0"
            title="Attach a file or image"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>

          {/* Text Input */}
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}`}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-zinc-400 text-sm outline-none resize-none max-h-32 leading-relaxed"
          />

          {/* Emoji Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-zinc-400 hover:text-yellow-400 transition-colors p-1"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-10 right-0 bg-[#1e1f22] border border-[#35373c] rounded-xl p-3 shadow-2xl z-40 grid grid-cols-4 gap-2 w-48">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 hover:bg-[#2b2d31] rounded text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && attachments.length === 0}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              inputText.trim() || attachments.length > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Images */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[85vh] max-w-[85vw] rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
