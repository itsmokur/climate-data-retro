'use client';

import { Card as CardType, Phase } from '@/types';

interface CardProps {
  card: CardType;
  phase: Phase;
  clientId: string;
  currentUserUid: string | null;
  currentUser: string;
  rank?: number;
  compact?: boolean;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropOnCard: (targetId: string) => void;
}

export function CardItem({
  card, phase, clientId, currentUserUid, currentUser,
  rank = 0, compact = false,
  onVote, onDelete, onDragStart, onDragEnd, onDropOnCard,
}: CardProps) {
  const votes = Array.isArray(card.votes) ? card.votes : [];
  const myVote = votes.includes(clientId);
  const voteCount = votes.length;
  const isOwner = card.ownerUid && currentUserUid
    ? card.ownerUid === currentUserUid
    : card.author === currentUser;
  const showRank = phase === 2 && voteCount > 0;
  const isTop = showRank && rank === 0;

  return (
    <div
      draggable
      data-id={card.id}
      onDragStart={() => onDragStart(card.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropOnCard(card.id); }}
      className={`group bg-white border border-[#e2ddd8] rounded-lg p-3 cursor-grab hover:-translate-y-px hover:shadow-md transition-all ${compact ? 'shadow-none' : ''}`}
    >
      {showRank && (
        <div className="mb-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${isTop ? 'bg-yellow-50 text-yellow-800 border-yellow-300' : 'bg-amber-50 text-amber-700 border-amber-400'}`}>
            {isTop ? '🥇 ' : ''}{voteCount} vote{voteCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-[#1a1714]">{card.text}</p>

      <div className="flex items-center justify-between mt-2">
        <span />
        <div className="flex items-center gap-1">
          {phase >= 1 && (
            <button
              onClick={() => onVote(card.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${
                myVote
                  ? 'bg-amber-50 border-amber-500 text-amber-700'
                  : 'bg-[#f0ede8] border-[#e2ddd8] text-[#8a8279] hover:bg-amber-50 hover:border-amber-500 hover:text-amber-700'
              }`}
            >
              {myVote ? '❤️' : '🤍'} {voteCount}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => onDelete(card.id)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded border border-[#e2ddd8] bg-[#f0ede8] text-[#8a8279] text-xs flex items-center justify-center hover:bg-[#1a1714] hover:text-white hover:border-[#1a1714] transition-all"
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
