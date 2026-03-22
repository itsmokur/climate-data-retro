'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { BoardState, DEFAULT_BOARD_STATE } from '@/types';

type SetState = (updater: (prev: BoardState) => BoardState) => void;

interface UseBoardStateReturn {
  saveState: (state: BoardState, immediate?: boolean) => void;
}

export function useBoardState(
  boardId: string,
  setState: SetState,
  setSyncStatus: (status: 'live' | 'syncing' | 'offline') => void
): UseBoardStateReturn {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = ref(db, `boards/${boardId}/state`);

  useEffect(() => {
    if (!boardId) return;
    setSyncStatus('syncing');

    const unsub = onValue(
      boardRef,
      async (snap) => {
        if (snap.exists()) {
          const remote = snap.val() as Partial<BoardState>;
          setState(() => ({
            cards:        remote.cards        ?? {},
            groups:       remote.groups       ?? {},
            title:        remote.title        ?? DEFAULT_BOARD_STATE.title,
            discussed:    remote.discussed    ?? {},
            activeDiscuss: remote.activeDiscuss ?? null,
            actions:      remote.actions      ?? {},
          }));
        } else {
          await set(boardRef, DEFAULT_BOARD_STATE);
        }
        setSyncStatus('live');
      },
      (err) => {
        console.error(err);
        setSyncStatus('offline');
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const saveState = useCallback(
    (state: BoardState, immediate = true) => {
      setSyncStatus('syncing');
      if (!immediate) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => saveState(state, true), 250);
        return;
      }
      set(boardRef, state)
        .then(() => setSyncStatus('live'))
        .catch((e) => {
          console.error(e);
          setSyncStatus('offline');
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardId]
  );

  return { saveState };
}
