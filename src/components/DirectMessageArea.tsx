import React, { useEffect, useRef, useState } from 'react';
import { DirectMessage, FriendUser, MessageAttachment, User } from '../types';
import {
  ArrowLeft,
  AtSign,
  Compass,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Phone,
  PhoneCall,
  Send,
  Smile,
  Users,
  Video,
  X,
} from 'lucide-react';

interface DirectMessageAreaProps {
  currentUser: User;
  recipient: FriendUser;
  messages: DirectMessage[];
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void;
  onSendTyping: (isTyping: boolean) => void;
  isTyping?: boolean;
  onStartVoiceCall: (recipientId: string) => void;
  onToggleMobileNav?: () => void;
  onBackToFriends: () => void;
}

export const DirectMessageArea: React.FC<DirectMessageAreaProps> = ({
  currentUser,
  recipient,
  messages,
  onSendMessage,
  onSendTyping,
  isTyping,
  onStartVoiceCall,
  onToggleMobileNav,
  onBackToFriends,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Send typing broadcast
    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    onSendTyping(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            type: file.type,
            url: result,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const EMOJI_LIST = ['👍', '❤️', '🔥', '🎉', '😂', '✨', '🚀', '👋', '🎮', '💯'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden text-zinc-100 select-none">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#202225] bg-[#313338] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 truncate">
          {/* Back to Friends / Nav on mobile */}
          <button
            onClick={onBackToFriends}
            className="p-1.5 rounded-lg bg-[#2b2d31] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Friends"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Recipient Profile Header */}
          <div className="relative shrink-0">
            <img
              src={recipient.avatar}
              alt={recipient.name}
              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#313338] ${
                recipient.status === 'online'
                  ? 'bg-emerald-500'
                  : recipient.status === 'idle'
                  ? 'bg-amber-500'
                  : recipient.status === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-zinc-500'
              }`}
            />
          </div>

          <div className="truncate">
            <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <span>{recipient.name}</span>
              <span className="text-zinc-500 text-xs font-mono">#{recipient.tag}</span>
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {recipient.customStatus || recipient.bio || (recipient.status === 'online' ? 'Online' : 'Offline')}
            </div>
          </div>
        </div>

        {/* Action Buttons: Voice Call, Video */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onStartVoiceCall(recipient.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            title="Start Private Voice Call"
          >
            <PhoneCall className="w-4 h-4" />
            <span className="hidden sm:inline">Start Voice Call</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Beginning of DM banner */}
        <div className="py-6 border-b border-[#383a40] space-y-2">
          <div className="w-16 h-16 rounded-full bg-zinc-800 p-0.5 ring-2 ring-indigo-500/50 overflow-hidden mb-2">
            <img src={recipient.avatar} alt={recipient.name} className="w-full h-full object-cover rounded-full" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{recipient.name}</span>
            <span className="text-xs font-mono text-zinc-500">#{recipient.tag}</span>
          </h2>
          <p className="text-xs text-zinc-400">
            This is the beginning of your direct message history with{' '}
            <strong className="text-white">{recipient.name}#{recipient.tag}</strong>.
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              className="flex gap-3 group hover:bg-[#2e3035]/60 p-1.5 rounded-lg transition-colors"
            >
              <img
                src={msg.senderAvatar || (isMe ? currentUser.avatar : recipient.avatar)}
                alt={msg.senderName}
                className="w-10 h-10 rounded-full object-cover bg-zinc-800 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white hover:underline cursor-pointer">
                    {msg.senderName}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded">
                      YOU
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">{timeStr}</span>
                </div>

                <div className="text-sm text-zinc-200 mt-1 whitespace-pre-wrap break-words leading-relaxed select-text font-normal">
                  {msg.text}
                </div>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="max-w-xs rounded-lg overflow-hidden border border-[#3f4147] bg-[#1e1f22]">
                        {att.type.startsWith('image/') ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="max-h-60 object-contain cursor-pointer hover:opacity-95"
                            onClick={() => window.open(att.url, '_blank')}
                          />
                        ) : (
                          <div className="p-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <div className="truncate">
                              <div className="text-xs font-bold text-white truncate">{att.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                {Math.round(att.size / 1024)} KB
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="h-5 px-4 text-[11px] text-indigo-400 font-medium">
        {isTyping && (
          <span className="animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>{recipient.name} is typing...</span>
          </span>
        )}
      </div>

      {/* Attachment previews before sending */}
      {attachments.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative p-1.5 bg-[#2b2d31] rounded-lg border border-[#3f4147] flex items-center gap-2 text-xs"
            >
              {att.type.startsWith('image/') ? (
                <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileText className="w-5 h-5 text-indigo-400" />
              )}
              <span className="truncate max-w-[120px] text-zinc-300 font-medium">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <div className="mx-4 mb-2 p-2 bg-[#2b2d31] border border-[#3f4147] rounded-xl shadow-xl flex items-center gap-2 flex-wrap">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg p-1.5 rounded-lg hover:bg-[#35373c] transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Composer */}
      <div className="p-3 bg-[#313338] border-t border-[#202225] shrink-0">
        <form
          onSubmit={handleSend}
          className="bg-[#383a40] rounded-xl px-3 py-2 flex items-center gap-2 shadow-inner focus-within:ring-1 focus-within:ring-indigo-500"
        >
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#4e5058]/40 transition-colors cursor-pointer"
            title="Upload Files or Photos"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message @${recipient.name}`}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-400 outline-none font-medium"
          />

          {/* Emoji Trigger */}
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className="p-1.5 text-zinc-400 hover:text-yellow-400 rounded-lg hover:bg-[#4e5058]/40 transition-colors cursor-pointer"
            title="Add Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer shadow"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
