'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { BoardState, DEFAULT_BOARD_STATE } from '@/types';

export function useBoardState(
  boardId: string,
  joined: boolean,
  onStateChange: (state: BoardState) => void,
  onSyncStatusChange: (status: 'live' | 'syncing' | 'offline') => void
) {
  const callbacksRef = useRef({ onStateChange, onSyncStatusChange });
  callbacksRef.current = { onStateChange, onSyncStatusChange };

  const boardRef = ref(db, `boards/${boardId}/state`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!boardId || !joined) return;

    if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
      callbacksRef.current.onSyncStatusChange('syncing');
    }

    const unsub = onValue(
      boardRef,
      async (snap) => {
        if (snap.exists()) {
          const remote = snap.val() as Partial<BoardState>;
          if (typeof callbacksRef.current.onStateChange === 'function') {
            callbacksRef.current.onStateChange({
              cards: remote.cards ?? {},
              groups: remote.groups ?? {},
              title: remote.title ?? DEFAULT_BOARD_STATE.title,
              discussed: remote.discussed ?? {},
              activeDiscuss: remote.activeDiscuss ?? null,
              actions: remote.actions ?? {},
            });
          }
        } else {
          await set(boardRef, DEFAULT_BOARD_STATE);
        }
        if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
          callbacksRef.current.onSyncStatusChange('live');
        }
      },
      (err) => {
        console.error(err);
        if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
          callbacksRef.current.onSyncStatusChange('offline');
        }
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, joined]);

  const saveState = useCallback(
    (state: BoardState, immediate = true) => {
      if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
        callbacksRef.current.onSyncStatusChange('syncing');
      }
      if (!immediate) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => saveState(state, true), 250);
        return;
      }
      set(boardRef, state)
        .then(() => {
          if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
            callbacksRef.current.onSyncStatusChange('live');
          }
        })
        .catch((e) => {
          console.error(e);
          if (typeof callbacksRef.current.onSyncStatusChange === 'function') {
            callbacksRef.current.onSyncStatusChange('offline');
          }
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardId]
  );

  return { saveState };
}
