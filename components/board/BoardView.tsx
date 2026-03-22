'use client';

import { BoardState, Phase, COLUMNS } from '@/types';
import { ColumnItem } from './Column';

interface BoardViewProps {
  state: BoardState;
  phase: Phase;
  clientId: string;
  currentUserUid: string | null;
  currentUser: string;
  onAddCard: (colId: string, text: string) => void;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveCard: (cardId: string, targetColId: string) => void;
  onGroupCards: (sourceId: string, targetId: string) => void;
  onUngroup: (cardId: string) => void;
  onUpdateGroupTitle: (groupId: string, title: string) => void;
}

export function BoardView({
  state, phase, clientId, currentUserUid, currentUser,
  onAddCard, onVote, onDelete, onMoveCard, onGroupCards, onUngroup, onUpdateGroupTitle,
}: BoardViewProps) {
  return (
    <div className="grid grid-cols-4 gap-5 min-h-[calc(100vh-180px)]">
      {COLUMNS.map((col) => {
        const cards = Object.values(state.cards)
          .filter((c) => c.col === col.id)
          .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

        return (
          <ColumnItem
            key={col.id}
            column={col}
            cards={cards}
            groups={state.groups}
            phase={phase}
            clientId={clientId}
            currentUserUid={currentUserUid}
            currentUser={currentUser}
            onAddCard={onAddCard}
            onVote={onVote}
            onDelete={onDelete}
            onDropCard={onMoveCard}
            onGroupCards={onGroupCards}
            onUngroup={onUngroup}
            onUpdateGroupTitle={onUpdateGroupTitle}
          />
        );
      })}
    </div>
  );
}
