'use client';

import { useEffect, useState } from 'react';
import { ref, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { PresenceUser } from '@/types';

export function usePresence(boardId: string, clientId: string, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!boardId || !userName) return;

    const meRef      = ref(db, `presence/${boardId}/${clientId}`);
    const listRef    = ref(db, `presence/${boardId}`);

    set(meRef, { name: userName, online: true, joinedAt: serverTimestamp() });
    onDisconnect(meRef).remove();

    const unsub = onValue(listRef, (snap) => {
      const val = snap.val() ?? {};
      const users = Object.values(val as Record<string, PresenceUser>).filter(
        (u) => u?.online
      );
      setOnlineUsers(users);
    });

    return () => {
      unsub();
      // Don't remove meRef here — onDisconnect handles it
    };
  }, [boardId, clientId, userName]);

  return { onlineUsers };
}
