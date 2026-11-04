import React, { useState } from 'react';
import { Hash, Volume2, X } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory: string;
  defaultType?: 'text' | 'voice';
  onCreateChannel: (name: string, type: 'text' | 'voice', topic: string, category: string) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  defaultType = 'text',
  onCreateChannel,
}) => {
  const [type, setType] = useState<'text' | 'voice'>(defaultType);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChannel(name.trim(), type, topic.trim(), defaultCategory);
    setName('');
    setTopic('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#35373c] flex items-center justify-between bg-[#2b2d31]">
          <div>
            <h3 className="font-bold text-white text-base">Create Channel</h3>
            <p className="text-xs text-zinc-400">in {defaultCategory}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-400 uppercase">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  type === 'text'
                    ? 'bg-[#2b2d31] border-indigo-500 text-white shadow-md'
                    : 'bg-[#17181a] border-[#35373c] text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <Hash className="w-5 h-5 text-zinc-300" />
                <div className="text-left">
                  <div className="text-sm font-bold">Text</div>
                  <div className="text-[10px] text-zinc-400">Post messages, links, files</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('voice')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  type === 'voice'
                    ? 'bg-[#2b2d31] border-emerald-500 text-white shadow-md'
                    : 'bg-[#17181a] border-[#35373c] text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm font-bold">Voice</div>
                  <div className="text-[10px] text-zinc-400">Talk & share screen</div>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
              Channel Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-400">
                {type === 'text' ? <Hash className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="new-channel"
                required
                className="w-full bg-[#2b2d31] border border-[#3f4147] rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
              Topic / Description (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full bg-[#2b2d31] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-[#2b2d31]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg disabled:opacity-50"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
