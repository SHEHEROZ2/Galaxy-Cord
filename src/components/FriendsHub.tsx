import React, { useState } from 'react';
import { FriendUser, User } from '../types';
import {
  Check,
  Clock,
  Compass,
  Copy,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface FriendsHubProps {
  currentUser: User;
  friends: FriendUser[];
  onOpenDm: (friendId: string) => void;
  onStartVoiceCall: (friendId: string) => void;
  onSendFriendRequest: (targetTag: string) => void;
  onRespondFriendRequest: (friendId: string, action: 'accept' | 'decline') => void;
  onRemoveFriend: (friendId: string) => void;
  onToggleMobileNav?: () => void;
}

export const FriendsHub: React.FC<FriendsHubProps> = ({
  currentUser,
  friends,
  onOpenDm,
  onStartVoiceCall,
  onSendFriendRequest,
  onRespondFriendRequest,
  onRemoveFriend,
  onToggleMobileNav,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('online');
  const [searchFilter, setSearchFilter] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedOwnTag, setCopiedOwnTag] = useState(false);

  // Group friends
  const onlineFriends = friends.filter((f) => f.relationship === 'friends' && f.status !== 'offline');
  const allFriends = friends.filter((f) => f.relationship === 'friends');
  const pendingIncoming = friends.filter((f) => f.relationship === 'pending_incoming');
  const pendingOutgoing = friends.filter((f) => f.relationship === 'pending_outgoing');
  const totalPending = pendingIncoming.length + pendingOutgoing.length;

  // Filter based on search query
  const filteredFriends = (activeTab === 'online' ? onlineFriends : allFriends).filter((f) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.tag.includes(q) || (f.bio && f.bio.toLowerCase().includes(q));
  });

  const handleSendAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;

    onSendFriendRequest(addFriendInput.trim());
    setAddFeedback({
      type: 'success',
      message: `Friend request sent to ${addFriendInput.trim()}!`,
    });
    setAddFriendInput('');
    setTimeout(() => setAddFeedback(null), 4000);
  };

  const copyOwnTag = () => {
    const fullTag = `${currentUser.name}#${currentUser.tag || '0000'}`;
    navigator.clipboard.writeText(fullTag);
    setCopiedOwnTag(true);
    setTimeout(() => setCopiedOwnTag(false), 2000);
  };

  // Suggested demo friends to quick add
  const SUGGESTED_FRIENDS = [
    { name: 'Elena Rostova', tag: '1001', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', bio: 'Community Manager & WebRTC Host' },
    { name: 'Marcus Vance', tag: '2048', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', bio: 'Pterodactyl Node Administrator' },
    { name: 'CyberNova', tag: '7777', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNova', bio: 'Streamer & FPS Gamer' },
    { name: 'Galaxy Bot', tag: '0001', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop', bio: 'Official Galaxy Cord Automation Hub' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden text-zinc-100 select-none">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#202225] bg-[#313338] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {/* Mobile Back / Nav button */}
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 rounded-lg bg-[#2b2d31] text-zinc-300 hover:text-white"
              title="Open Navigation"
            >
              <Compass className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 font-bold text-white pr-2 border-r border-[#3f4147]">
            <Users className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-bold tracking-tight">Friends</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'online'
                  ? 'bg-[#3f4147] text-white font-bold'
                  : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200'
              }`}
            >
              Online ({onlineFriends.length})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#3f4147] text-white font-bold'
                  : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200'
              }`}
            >
              All ({allFriends.length})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded-md transition-colors relative flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#3f4147] text-white font-bold'
                  : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200'
              }`}
            >
              <span>Pending</span>
              {totalPending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'blocked'
                  ? 'bg-[#3f4147] text-white font-bold'
                  : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200'
              }`}
            >
              Blocked
            </button>

            {/* Add Friend Button */}
            <button
              onClick={() => setActiveTab('add')}
              className={`ml-2 px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 shadow-sm ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* TAB: ADD FRIEND */}
        {activeTab === 'add' ? (
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Add Friend</h2>
              <p className="text-xs text-zinc-400 mt-1">
                You can add friends with their unique Galaxy Cord Tag. You can also search by their username or email.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAdd} className="relative">
              <div className="bg-[#1e1f22] border border-[#202225] rounded-xl p-3 flex items-center gap-3 shadow-inner focus-within:border-emerald-500">
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="You can add friends with their tag, like Username#1234"
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={!addFriendInput.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer shrink-0"
                >
                  Send Friend Request
                </button>
              </div>

              {addFeedback && (
                <div
                  className={`mt-2 text-xs font-semibold p-2.5 rounded-lg border ${
                    addFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {addFeedback.message}
                </div>
              )}
            </form>

            {/* User's own Tag Card */}
            <div className="bg-[#2b2d31] border border-[#383a40] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Your tag to share with others:</div>
                  <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-emerald-400">#{currentUser.tag || '0000'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={copyOwnTag}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedOwnTag ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOwnTag ? 'Copied to Clipboard!' : 'Copy Your Tag'}</span>
              </button>
            </div>

            {/* Quick Add Suggestions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Suggested Friends in the Community</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUGGESTED_FRIENDS.map((sug) => {
                  const alreadyFriend = friends.some(
                    (f) =>
                      f.relationship === 'friends' &&
                      f.name.toLowerCase() === sug.name.toLowerCase()
                  );
                  const isPending = friends.some(
                    (f) =>
                      f.relationship.startsWith('pending') &&
                      f.name.toLowerCase() === sug.name.toLowerCase()
                  );

                  return (
                    <div
                      key={sug.tag}
                      className="bg-[#2b2d31] border border-[#383a40] rounded-xl p-3 flex items-center justify-between gap-3 hover:border-zinc-500 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={sug.avatar}
                          alt={sug.name}
                          className="w-10 h-10 rounded-full object-cover bg-zinc-800 shrink-0"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            <span>{sug.name}</span>
                            <span className="text-zinc-500 text-[11px] font-mono">#{sug.tag}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">{sug.bio}</div>
                        </div>
                      </div>

                      {alreadyFriend ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-md shrink-0">
                          Friends ✓
                        </span>
                      ) : isPending ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-md shrink-0">
                          Pending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSendFriendRequest(`${sug.name}#${sug.tag}`);
                            setAddFeedback({
                              type: 'success',
                              message: `Friend request sent to ${sug.name}#${sug.tag}!`,
                            });
                            setTimeout(() => setAddFeedback(null), 3500);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'pending' ? (
          /* TAB: PENDING REQUESTS */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Incoming Friend Requests — {pendingIncoming.length}
              </h3>
              {pendingIncoming.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-[#2b2d31]/50 rounded-xl border border-[#35373c]">
                  No incoming friend requests right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingIncoming.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-[#2b2d31] border border-[#35373c] rounded-xl flex items-center justify-between gap-3 hover:bg-[#35373c] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.avatar}
                          alt={req.name}
                          className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                        />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{req.name}</span>
                            <span className="text-zinc-500 text-xs font-mono">#{req.tag}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400">Incoming Friend Request</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRespondFriendRequest(req.id, 'accept')}
                          className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md cursor-pointer"
                          title="Accept Friend Request"
                        >
                          <Check className="w-5 h-5 font-bold" />
                        </button>
                        <button
                          onClick={() => onRespondFriendRequest(req.id, 'decline')}
                          className="w-9 h-9 rounded-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Ignore / Decline"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Outgoing Friend Requests — {pendingOutgoing.length}
              </h3>
              {pendingOutgoing.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-[#2b2d31]/50 rounded-xl border border-[#35373c]">
                  No outgoing friend requests pending.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingOutgoing.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-[#2b2d31] border border-[#35373c] rounded-xl flex items-center justify-between gap-3 hover:bg-[#35373c] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.avatar}
                          alt={req.name}
                          className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                        />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{req.name}</span>
                            <span className="text-zinc-500 text-xs font-mono">#{req.tag}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400">Request Sent</div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRespondFriendRequest(req.id, 'decline')}
                        className="w-9 h-9 rounded-full bg-zinc-700/60 hover:bg-red-600/30 text-zinc-300 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Cancel Request"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'blocked' ? (
          /* TAB: BLOCKED */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <Shield className="w-12 h-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">You haven't blocked anyone</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              When you block a user, they won't be able to send you direct messages or friend requests.
            </p>
          </div>
        ) : (
          /* TAB: ONLINE & ALL FRIENDS */
          <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 max-w-4xl w-full mx-auto">
            {/* Search filter input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search friends..."
                className="w-full bg-[#1e1f22] border border-[#202225] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Friends Count Label */}
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {activeTab === 'online' ? 'Online' : 'All Friends'} — {filteredFriends.length}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
              {filteredFriends.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  {searchFilter ? 'No friends matched your search.' : 'No friends online right now.'}
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-2.5 rounded-xl bg-[#2b2d31]/50 hover:bg-[#35373c] border border-transparent hover:border-[#3f4147] transition-all flex items-center justify-between gap-3 group"
                  >
                    {/* User info */}
                    <div
                      onClick={() => onOpenDm(friend.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                            friend.status === 'online'
                              ? 'bg-emerald-500'
                              : friend.status === 'idle'
                              ? 'bg-amber-500'
                              : friend.status === 'dnd'
                              ? 'bg-red-500'
                              : 'bg-zinc-500'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                          <span>{friend.name}</span>
                          <span className="text-zinc-500 text-xs font-mono">#{friend.tag}</span>
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {friend.customStatus || friend.bio || (friend.status === 'online' ? 'Online' : 'Offline')}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Direct Message, Voice Call, Remove */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onOpenDm(friend.id)}
                        className="p-2 rounded-full bg-[#1e1f22] text-zinc-300 hover:text-white hover:bg-indigo-600 transition-colors shadow-sm cursor-pointer"
                        title="Send Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onStartVoiceCall(friend.id)}
                        className="p-2 rounded-full bg-[#1e1f22] text-zinc-300 hover:text-white hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                        title="Start Voice Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Remove ${friend.name}#${friend.tag} from your friends?`)) {
                            onRemoveFriend(friend.id);
                          }
                        }}
                        className="p-2 rounded-full bg-[#1e1f22] text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
