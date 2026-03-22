'use client';

import { useState, useRef } from 'react';
import { Column, Card as CardType, CardGroup, Phase } from '@/types';
import { CardItem } from './Card';
import { CardGroupItem } from './CardGroup';

interface ColumnProps {
  column: Column;
  cards: CardType[];
  groups: Record<string, CardGroup>;
  phase: Phase;
  clientId: string;
  currentUserUid: string | null;
  currentUser: string;
  onAddCard: (colId: string, text: string) => void;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
  onDropCard: (cardId: string, targetColId: string) => void;
  onGroupCards: (sourceId: string, targetId: string) => void;
  onUngroup: (cardId: string) => void;
  onUpdateGroupTitle: (groupId: string, title: string) => void;
}

export function ColumnItem({
  column, cards, groups, phase, clientId, currentUserUid, currentUser,
  onAddCard, onVote, onDelete, onDropCard, onGroupCards, onUngroup, onUpdateGroupTitle,
}: ColumnProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const draggingId = useRef<string | null>(null);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddCard(column.id, trimmed);
    setText('');
    setAdding(false);
  };

  // Build render list (groups first, then singles)
  const groupedMap: Record<string, CardType[]> = {};
  cards.forEach((c) => {
    if (c.groupId) {
      if (!groupedMap[c.groupId]) groupedMap[c.groupId] = [];
      groupedMap[c.groupId].push(c);
    }
  });

  const renderedIds = new Set<string>();
  const renderItems: React.ReactNode[] = [];

  cards.forEach((c) => {
    if (renderedIds.has(c.id)) return;
    if (c.groupId && groupedMap[c.groupId]) {
      groupedMap[c.groupId].forEach((gc) => renderedIds.add(gc.id));
      const group = groups[c.groupId] ?? { id: c.groupId, title: 'Grouped cards' };
      renderItems.push(
        <CardGroupItem
          key={c.groupId}
          group={group}
          cards={groupedMap[c.groupId]}
          phase={phase}
          clientId={clientId}
          currentUserUid={currentUserUid}
          currentUser={currentUser}
          onVote={onVote}
          onDelete={onDelete}
          onUngroup={onUngroup}
          onUpdateTitle={onUpdateGroupTitle}
          onDragStart={(id) => { draggingId.current = id; }}
          onDragEnd={() => { draggingId.current = null; }}
          onDropOnCard={(targetId) => {
            if (draggingId.current && draggingId.current !== targetId) {
              onGroupCards(draggingId.current, targetId);
            }
          }}
        />
      );
    } else {
      renderedIds.add(c.id);
      renderItems.push(
        <CardItem
          key={c.id}
          card={c}
          phase={phase}
          rank={0}
          clientId={clientId}
          currentUserUid={currentUserUid}
          currentUser={currentUser}
          onVote={onVote}
          onDelete={onDelete}
          onDragStart={(id) => { draggingId.current = id; }}
          onDragEnd={() => { draggingId.current = null; }}
          onDropOnCard={(targetId) => {
            if (draggingId.current && draggingId.current !== targetId) {
              onGroupCards(draggingId.current, targetId);
            }
          }}
        />
      );
    }
  });

  return (
    <div className="bg-[#faf9f6] border border-[#e2ddd8] rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2ddd8] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.dotColor }} />
        <span className="font-serif text-[15px] font-semibold flex-1">{column.title}</span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f0ede8] border border-[#e2ddd8] text-[#8a8279]">
          {cards.length}
        </span>
      </div>

      {/* Body */}
      <div
        className={`flex-1 p-3 flex flex-col gap-2 overflow-y-auto min-h-[200px] transition-colors ${isDragOver ? 'bg-[#f0ede8]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const cardId = e.dataTransfer.getData('cardId');
          if (cardId) onDropCard(cardId, column.id);
        }}
      >
        {cards.length === 0 && !adding && (
          <p className="text-center text-[#8a8279] text-xs py-5">No cards yet.<br />Add the first one! 👇</p>
        )}

        {renderItems}

        {/* Add card form */}
        {adding ? (
          <div className="border border-dashed border-[#e2ddd8] rounded-lg p-2.5 flex flex-col gap-2">
            <textarea
              autoFocus
              className="text-[13px] bg-transparent border-none outline-none resize-none text-[#1a1714] placeholder-[#8a8279] w-full min-h-[60px]"
              placeholder="Share your thoughts..."
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAdd(); }}
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => { setAdding(false); setText(''); }}
                className="text-xs font-medium px-2.5 py-1 rounded-md border border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="text-xs font-semibold px-3 py-1 rounded-md bg-[#1a1714] text-white hover:opacity-80 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[#8a8279] text-xs font-medium px-2 py-1.5 rounded-md hover:bg-[#f0ede8] hover:text-[#1a1714] transition-colors w-full"
          >
            <span className="text-base leading-none">+</span> Add card
          </button>
        )}
      </div>
    </div>
  );
}
