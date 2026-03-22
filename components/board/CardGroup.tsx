'use client';

import { Card as CardType, CardGroup as CardGroupType, Phase } from '@/types';
import { CardItem } from './Card';

interface CardGroupProps {
  group: CardGroupType;
  cards: CardType[];
  phase: Phase;
  clientId: string;
  currentUserUid: string | null;
  currentUser: string;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
  onUngroup: (id: string) => void;
  onUpdateTitle: (groupId: string, title: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropOnCard: (targetId: string) => void;
}

export function CardGroupItem({
  group, cards, phase, clientId, currentUserUid, currentUser,
  onVote, onDelete, onUngroup, onUpdateTitle,
  onDragStart, onDragEnd, onDropOnCard,
}: CardGroupProps) {
  return (
    <div className="bg-[#f0ede8] border border-dashed border-[#e2ddd8] rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <input
          defaultValue={group.title}
          onBlur={(e) => onUpdateTitle(group.id, e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-[#1a1714]"
        />
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-400">
          {cards.length} cards
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card, i) => (
          <div key={card.id} className="bg-white border border-[#e2ddd8] rounded-lg p-2.5">
            <CardItem
              card={card} phase={phase} rank={i}
              clientId={clientId} currentUserUid={currentUserUid} currentUser={currentUser}
              compact
              onVote={onVote} onDelete={onDelete}
              onDragStart={onDragStart} onDragEnd={onDragEnd} onDropOnCard={onDropOnCard}
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={() => onUngroup(card.id)}
                className="text-[11px] px-2 py-1 rounded-md border border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714] transition-colors"
              >
                Ungroup
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
