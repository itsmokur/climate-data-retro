'use client';

import { useState } from 'react';
import { BoardState, COLUMNS } from '@/types';

interface ActionsViewProps {
  state: BoardState;
  onAddAction: (text: string, assignee: string, dueDate: string) => void;
  onToggleAction: (id: string) => void;
  onDeleteAction: (id: string) => void;
}

function getVoteCount(votes: unknown): number {
  if (!votes) return 0;
  if (Array.isArray(votes)) return votes.length;
  return 0;
}

export function ActionsView({ state, onAddAction, onToggleAction, onDeleteAction }: ActionsViewProps) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const actions = Object.values(state.actions ?? {}).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  const doneCount = actions.filter((a) => a.done).length;
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddAction(trimmed, assignee.trim(), dueDate);
    setText('');
    setAssignee('');
    setDueDate('');
  };

  // Discussion summary sidebar
  const allCards = Object.values(state.cards ?? {}).sort(
    (a, b) => getVoteCount(b.votes) - getVoteCount(a.votes)
  );
  const discussed = state.discussed ?? {};
  const discussedCount = Object.keys(discussed).filter((id) => discussed[id] && state.cards[id]).length;
  const totalCount = allCards.length;
  const pct = totalCount > 0 ? Math.round((discussedCount / totalCount) * 100) : 0;

  return (
    <div className="flex gap-5 min-h-[calc(100vh-200px)]">
      {/* Discussion summary sidebar */}
      <div className="w-[300px] shrink-0 bg-[#faf9f6] border border-[#e2ddd8] rounded-xl flex flex-col overflow-hidden sticky top-[160px] max-h-[calc(100vh-180px)]">
        <div className="px-4 py-3.5 border-b border-[#e2ddd8] flex items-center gap-2">
          <h3 className="font-serif text-sm font-bold flex-1">💬 Discussion Summary</h3>
          <span className="text-[11px] font-semibold text-[#8a8279]">{discussedCount}/{totalCount}</span>
        </div>
        <div className="h-[3px] bg-[#e2ddd8] mx-4 mb-2.5 rounded-full overflow-hidden">
          <div className="h-full bg-[#2d6a4f] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {allCards.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#8a8279]">No cards discussed yet.</p>
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
                    const rank = allCards.indexOf(c);
                    return (
                      <div
                        key={c.id}
                        className={`flex items-start gap-2.5 px-4 py-2 cursor-default border-l-[3px] border-l-transparent ${done ? 'opacity-45' : ''}`}
                      >
                        <span className={`font-serif text-[15px] font-bold shrink-0 mt-0.5 ${rank === 0 ? 'text-amber-600' : 'text-[#8a8279]'}`}>
                          {rank + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug line-clamp-2 ${done ? 'line-through text-[#8a8279]' : 'text-[#1a1714]'}`}>
                            {c.text}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {votes > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700">
                                ❤️ {votes}
                              </span>
                            )}
                            {done && (
                              <span className="text-[10px] font-semibold text-[#2d6a4f]">✓ discussed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action items */}
      <div className="flex-1 min-w-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-serif text-[22px] font-bold">✅ Action Items</h2>
            <p className="text-sm text-[#8a8279] mt-0.5">{doneCount} of {actions.length} completed</p>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2.5 mb-5">
          {actions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm text-[#8a8279]">No action items yet.<br />Add one below to track what needs to happen next sprint.</p>
            </div>
          ) : (
            actions.map((a) => {
              const isOverdue = a.dueDate && !a.done && a.dueDate < today;
              return (
                <div
                  key={a.id}
                  className={`group bg-[#faf9f6] border border-[#e2ddd8] rounded-xl px-4 py-3.5 flex items-start gap-3 hover:shadow-sm transition-shadow ${a.done ? 'opacity-55' : ''}`}
                >
                  <button
                    onClick={() => onToggleAction(a.id)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center text-[11px] transition-all ${
                      a.done ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white' : 'border-[#e2ddd8] hover:border-[#2d6a4f] hover:bg-[#d8f3dc]'
                    }`}
                  >
                    {a.done ? '✓' : ''}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${a.done ? 'line-through text-[#8a8279]' : 'text-[#1a1714]'}`}>
                      {a.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {a.assignee && (
                        <span className="text-[11px] font-semibold text-[#6d4c41] bg-[#f3ede8] rounded-full px-2 py-0.5">
                          👤 {a.assignee}
                        </span>
                      )}
                      {a.dueDate && (
                        <span className={`text-[11px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-[#8a8279]'}`}>
                          📅 {a.dueDate}{isOverdue ? ' · overdue' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteAction(a.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded border border-[#e2ddd8] bg-[#f0ede8] text-[#8a8279] text-xs flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shrink-0"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add form */}
        <div className="bg-[#faf9f6] border border-dashed border-[#e2ddd8] rounded-xl p-4">
          <textarea
            className="text-sm bg-transparent border-none outline-none resize-none text-[#1a1714] placeholder-[#8a8279] w-full min-h-[60px]"
            placeholder="What needs to happen? e.g. 'Set up weekly sync with Igor'"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAdd(); }}
          />
          <div className="flex gap-2 mt-2.5 flex-wrap">
            <input
              className="flex-1 min-w-[120px] text-xs border border-[#e2ddd8] rounded-lg px-3 py-2 bg-[#f0ede8] text-[#1a1714] placeholder-[#8a8279] outline-none focus:ring-2 focus:ring-[#6d4c41]"
              placeholder="👤 Assignee (optional)"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
            <input
              type="date"
              className="flex-1 min-w-[120px] text-xs border border-[#e2ddd8] rounded-lg px-3 py-2 bg-[#f0ede8] text-[#1a1714] outline-none focus:ring-2 focus:ring-[#6d4c41]"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button
              onClick={handleAdd}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#1a1714] text-white hover:opacity-80 transition-opacity"
            >
              + Add Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
