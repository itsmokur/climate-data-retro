'use client';

import { BoardState, COLUMNS } from '@/types';
import { CardItem } from './Card';

interface DiscussViewProps {
  state: BoardState;
  clientId: string;
  currentUserUid: string | null;
  currentUser: string;
  onToggleDiscussed: (id: string) => void;
  onSetActive: (id: string) => void;
  onVote: (id: string) => void;
}

function getVoteCount(votes: unknown): number {
  if (!votes) return 0;
  if (Array.isArray(votes)) return votes.length;
  return 0;
}

export function DiscussView({
  state, clientId, currentUserUid, currentUser,
  onToggleDiscussed, onSetActive, onVote,
}: DiscussViewProps) {
  const allCards = Object.values(state.cards).sort(
    (a, b) => getVoteCount(b.votes) - getVoteCount(a.votes)
  );
  const discussed = state.discussed ?? {};
  const doneCount = Object.keys(discussed).filter((id) => discussed[id] && state.cards[id]).length;
  const totalCount = allCards.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="flex gap-5 min-h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-[300px] shrink-0 bg-[#faf9f6] border border-[#e2ddd8] rounded-xl flex flex-col overflow-hidden sticky top-[160px] max-h-[calc(100vh-180px)]">
        <div className="px-4 py-3.5 border-b border-[#e2ddd8] flex items-center gap-2">
          <h3 className="font-serif text-sm font-bold flex-1">💬 Discussion Queue</h3>
          <span className="text-[11px] font-semibold text-[#8a8279]">{doneCount}/{totalCount}</span>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-[#e2ddd8] mx-4 mb-2.5 rounded-full overflow-hidden">
          <div className="h-full bg-[#2d6a4f] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {allCards.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#8a8279]">No cards yet.</p>
          ) : (
            COLUMNS.map((col) => {
              const colCards = allCards.filter((c) => c.col === col.id);
              if (!colCards.length) return null;
              return (
                <div key={col.id}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a8279] px-4 py-2">{col.title}</p>
                  {colCards.map((c) => {
                    const votes = getVoteCount(c.votes);
                    const done = discussed[c.id];
                    const isActive = state.activeDiscuss === c.id;
                    const rank = allCards.indexOf(c);
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSetActive(c.id)}
                        className={`flex items-start gap-2.5 px-4 py-2 cursor-pointer border-l-[3px] transition-all ${
                          isActive ? 'bg-[#f0ede8] border-l-[#6d4c41]' : 'border-l-transparent hover:bg-[#f0ede8]'
                        } ${done ? 'opacity-45' : ''}`}
                      >
                        <span className={`font-serif text-[15px] font-bold shrink-0 mt-0.5 ${rank === 0 ? 'text-amber-600' : 'text-[#8a8279]'}`}>
                          {rank + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug line-clamp-2 ${done ? 'line-through text-[#8a8279]' : 'text-[#1a1714]'}`}>
                            {c.text}
                          </p>
                          {votes > 0 && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700">
                              ❤️ {votes}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleDiscussed(c.id); }}
                          className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center text-[10px] transition-all ${
                            done ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white' : 'border-[#e2ddd8] hover:border-[#2d6a4f]'
                          }`}
                        >
                          {done ? '✓' : ''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Board columns */}
      <div className="flex-1 grid grid-cols-4 gap-5 content-start">
        {COLUMNS.map((col) => {
          const cards = allCards.filter((c) => c.col === col.id);
          return (
            <div key={col.id} className="bg-[#faf9f6] border border-[#e2ddd8] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2ddd8] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dotColor }} />
                <span className="font-serif text-[15px] font-semibold flex-1">{col.title}</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f0ede8] border border-[#e2ddd8] text-[#8a8279]">
                  {cards.length}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {cards.length === 0 && <p className="text-center text-[#8a8279] text-xs py-4">No cards</p>}
                {cards.map((c, i) => {
                  const isActive = state.activeDiscuss === c.id;
                  return (
                    <div
                      key={c.id}
                      style={isActive ? { boxShadow: '0 0 0 2px #6d4c41, 0 4px 16px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } : {}}
                    >
                      <CardItem
                        card={c} phase={2} rank={i}
                        clientId={clientId} currentUserUid={currentUserUid} currentUser={currentUser}
                        onVote={onVote} onDelete={() => {}}
                        onDragStart={() => {}} onDragEnd={() => {}} onDropOnCard={() => {}}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
