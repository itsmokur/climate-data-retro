'use client';

import { useState, useCallback } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getClientId } from '@/lib/clientId';
import { BoardState, DEFAULT_BOARD_STATE, Phase } from '@/types';
import { useBoardState } from '@/hooks/useBoardState';
import { useTimer } from '@/hooks/useTimer';
import { usePresence } from '@/hooks/usePresence';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { ShareModal } from '@/components/ui/ShareModal';
import { Header } from '@/components/ui/Header';
import { PhaseBar } from '@/components/ui/PhaseBar';
import { TimerBar } from '@/components/ui/TimerBar';
import { BoardView } from '@/components/board/BoardView';
import { DiscussView } from '@/components/board/DiscussView';
import { ActionsView } from '@/components/board/ActionsView';

interface BoardPageClientProps {
  boardId: string;
}

export function BoardPageClient({ boardId }: BoardPageClientProps) {
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [phase, setPhase] = useState<Phase>(0);
  const [showShare, setShowShare] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'live' | 'syncing' | 'offline'>('live');
  const [state, setState] = useState<BoardState>(DEFAULT_BOARD_STATE);

  const clientId = getClientId();
  const { toasts, toast } = useToast();
  const { saveState } = useBoardState(boardId, joined, (newState) => setState(newState), (status) => setSyncStatus(status));
  const { onlineUsers } = usePresence(boardId, clientId, joined ? currentUser : '');
  const { displayTime, isWarning, timerModel, setTimer, toggleTimer, resetTimer } = useTimer(boardId, joined);

  // Helper to update state and persist
  const update = useCallback(
    (updater: (prev: BoardState) => BoardState, immediate = true) => {
      setState((prev) => {
        const next = updater(prev);
        saveState(next, immediate);
        return next;
      });
    },
    [saveState]
  );

  // Join
  const handleJoin = useCallback(async (name: string) => {
    const cred = await signInAnonymously(auth);
    setCurrentUser(name);
    setCurrentUserUid(cred.user.uid);
    setJoined(true);
  }, []);

  // Title
  const handleTitleChange = useCallback(
    (title: string) => update((s) => ({ ...s, title }), false),
    [update]
  );

  // Card actions
  const handleAddCard = useCallback(
    (colId: string, text: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      update((s) => ({
        ...s,
        cards: {
          ...s.cards,
          [id]: { id, text, author: currentUser, ownerUid: currentUserUid, col: colId as never, groupId: null, votes: [], ts: Date.now() },
        },
      }));
      toast('Card added!');
    },
    [update, currentUser, currentUserUid, toast]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this card?')) return;
      update((s) => {
        const card = s.cards[id];
        if (!card) return s;
        const isOwner = card.ownerUid && currentUserUid
          ? card.ownerUid === currentUserUid
          : card.author === currentUser;
        if (!isOwner) { toast('You can only delete your own cards.'); return s; }
        const { [id]: _, ...rest } = s.cards;
        return { ...s, cards: rest };
      });
    },
    [update, currentUser, currentUserUid, toast]
  );

  const handleVote = useCallback(
    (id: string) => {
      update((s) => {
        const card = s.cards[id];
        if (!card) return s;
        const votes = Array.isArray(card.votes) ? [...card.votes] : [];
        const idx = votes.indexOf(clientId);
        if (idx === -1) votes.push(clientId); else votes.splice(idx, 1);
        return { ...s, cards: { ...s.cards, [id]: { ...card, votes } } };
      });
    },
    [update, clientId]
  );

  const handleMoveCard = useCallback(
    (cardId: string, targetColId: string) => {
      update((s) => {
        const card = s.cards[cardId];
        if (!card) return s;
        return { ...s, cards: { ...s.cards, [cardId]: { ...card, col: targetColId as never } } };
      });
    },
    [update]
  );

  const handleGroupCards = useCallback(
    (sourceId: string, targetId: string) => {
      update((s) => {
        const source = s.cards[sourceId];
        const target = s.cards[targetId];
        if (!source || !target || source.col !== target.col) return s;
        let groupId = target.groupId ?? source.groupId;
        const groups = { ...s.groups };
        if (!groupId) {
          groupId = `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          groups[groupId] = { id: groupId, title: 'Grouped cards' };
        }
        return {
          ...s,
          groups,
          cards: {
            ...s.cards,
            [sourceId]: { ...source, groupId },
            [targetId]: { ...target, groupId },
          },
        };
      });
      toast('Cards grouped');
    },
    [update, toast]
  );

  const handleUngroup = useCallback(
    (cardId: string) => {
      update((s) => {
        const card = s.cards[cardId];
        if (!card?.groupId) return s;
        const groupId = card.groupId;
        const updatedCards = { ...s.cards, [cardId]: { ...card, groupId: null } };
        const remaining = Object.values(updatedCards).filter((c) => c.groupId === groupId);
        const groups = { ...s.groups };
        if (remaining.length <= 1) {
          remaining.forEach((c) => { updatedCards[c.id] = { ...c, groupId: null }; });
          delete groups[groupId];
        }
        return { ...s, cards: updatedCards, groups };
      });
    },
    [update]
  );

  const handleUpdateGroupTitle = useCallback(
    (groupId: string, title: string) => {
      update((s) => ({
        ...s,
        groups: { ...s.groups, [groupId]: { ...s.groups[groupId], title: title.trim() || 'Grouped cards' } },
      }));
    },
    [update]
  );

  // Discuss actions
  const handleToggleDiscussed = useCallback(
    (id: string) => {
      update((s) => ({ ...s, discussed: { ...s.discussed, [id]: !s.discussed[id] } }));
    },
    [update]
  );

  const handleSetActive = useCallback(
    (id: string) => {
      update((s) => ({ ...s, activeDiscuss: s.activeDiscuss === id ? null : id }));
      setTimeout(() => {
        document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    },
    [update]
  );

  // Action items
  const handleAddAction = useCallback(
    (text: string, assignee: string, dueDate: string) => {
      const id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      update((s) => ({
        ...s,
        actions: {
          ...s.actions,
          [id]: { id, text, assignee, dueDate, done: false, createdBy: currentUser, ts: Date.now() },
        },
      }));
      toast('Action item added!');
    },
    [update, currentUser, toast]
  );

  const handleToggleAction = useCallback(
    (id: string) => {
      update((s) => ({
        ...s,
        actions: { ...s.actions, [id]: { ...s.actions[id], done: !s.actions[id].done } },
      }));
    },
    [update]
  );

  const handleDeleteAction = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this action item?')) return;
      update((s) => {
        const { [id]: _, ...rest } = s.actions;
        return { ...s, actions: rest };
      });
    },
    [update]
  );

  // Share
  const handleCopyShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast('Link copied! 🎉');
    setShowShare(false);
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#f0ede8] text-[#1a1714]">
      {!joined && <WelcomeModal onJoin={handleJoin} />}
      {showShare && (
        <ShareModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          onClose={() => setShowShare(false)}
          onCopy={handleCopyShare}
        />
      )}

      <Header
        title={state.title}
        onTitleChange={handleTitleChange}
        syncStatus={syncStatus}
        onlineUsers={onlineUsers}
        currentUser={currentUser}
        onShare={() => setShowShare(true)}
      />

      <PhaseBar phase={phase} onChange={setPhase} />

      <TimerBar
        displayTime={displayTime}
        isRunning={timerModel.running}
        isWarning={isWarning}
        phase={phase}
        onSetTimer={setTimer}
        onToggle={toggleTimer}
        onReset={resetTimer}
      />

      <main className="p-6">
        {phase === 0 || phase === 1 ? (
          <BoardView
            state={state} phase={phase}
            clientId={clientId} currentUserUid={currentUserUid} currentUser={currentUser}
            onAddCard={handleAddCard}
            onVote={handleVote}
            onDelete={handleDeleteCard}
            onMoveCard={handleMoveCard}
            onGroupCards={handleGroupCards}
            onUngroup={handleUngroup}
            onUpdateGroupTitle={handleUpdateGroupTitle}
          />
        ) : phase === 2 ? (
          <DiscussView
            state={state}
            clientId={clientId} currentUserUid={currentUserUid} currentUser={currentUser}
            onToggleDiscussed={handleToggleDiscussed}
            onSetActive={handleSetActive}
            onVote={handleVote}
          />
        ) : (
          <ActionsView
            state={state}
            onAddAction={handleAddAction}
            onToggleAction={handleToggleAction}
            onDeleteAction={handleDeleteAction}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
