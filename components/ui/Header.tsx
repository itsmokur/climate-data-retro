'use client';

import { PresenceUser } from '@/types';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  syncStatus: 'live' | 'syncing' | 'offline';
  onlineUsers: PresenceUser[];
  currentUser: string;
  onShare: () => void;
}

const SYNC_COLORS = {
  live:    'bg-green-500',
  syncing: 'bg-amber-400',
  offline: 'bg-amber-400',
};

const SYNC_LABELS = {
  live:    'Live',
  syncing: 'Syncing…',
  offline: 'Offline',
};

export function Header({ title, onTitleChange, syncStatus, onlineUsers, currentUser, onShare }: HeaderProps) {
  const initial = currentUser ? currentUser[0].toUpperCase() : '?';

  return (
    <header className="bg-[#faf9f6] border-b border-[#e2ddd8] px-6 flex items-center gap-4 h-[60px] sticky top-0 z-30">
      <div className="font-serif text-[22px] font-bold tracking-tight">
        Retro<span className="text-[#6d4c41]">.</span>
      </div>

      <input
        className="text-sm font-medium border border-[#e2ddd8] rounded-md px-2.5 py-1.5 bg-[#f0ede8] text-[#1a1714] w-56 outline-none focus:ring-2 focus:ring-[#6d4c41]"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Retro title..."
      />

      <div className="flex-1" />

      {/* Sync status */}
      <div className={`w-2 h-2 rounded-full ${SYNC_COLORS[syncStatus]} ${syncStatus === 'live' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-[#8a8279]">{SYNC_LABELS[syncStatus]}</span>

      {/* Online count */}
      <span
        className="text-xs text-[#8a8279] cursor-default"
        title={onlineUsers.map((u) => u.name).join(', ')}
      >
        {onlineUsers.length} online
      </span>

      <button
        onClick={onShare}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714] transition-colors"
      >
        🔗 Share
      </button>

      {/* Avatar */}
      <div className="w-[34px] h-[34px] rounded-full bg-[#6d4c41] text-white flex items-center justify-center text-sm font-semibold shrink-0">
        {initial}
      </div>
    </header>
  );
}
