'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { TimerModel } from '@/types';

const DEFAULT_TIMER: TimerModel = {
  durationSec: 5 * 60,
  running: false,
  endsAtMs: null,
  remainingSec: 5 * 60,
};

export function useTimer(boardId: string) {
  const [timerModel, setTimerModel] = useState<TimerModel>(DEFAULT_TIMER);
  const [displayTime, setDisplayTime] = useState('05:00');
  const [isWarning, setIsWarning] = useState(false);
  const timerRef = ref(db, `boards/${boardId}/timer`);
  const toastRef = useRef<((msg: string) => void) | null>(null);

  const computeRemaining = useCallback((model: TimerModel): number => {
    if (model.running && model.endsAtMs) {
      return Math.max(0, Math.ceil((model.endsAtMs - Date.now()) / 1000));
    }
    return Math.max(0, model.remainingSec ?? model.durationSec ?? 0);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!boardId) return;
    const unsub = onValue(timerRef, async (snap) => {
      if (snap.exists()) {
        setTimerModel(snap.val() as TimerModel);
      } else {
        await set(timerRef, DEFAULT_TIMER);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerModel((prev) => {
        const remaining = computeRemaining(prev);
        setDisplayTime(formatTime(remaining));
        setIsWarning(remaining <= 30 && prev.running);

        if (prev.running && remaining <= 0) {
          update(timerRef, { running: false, remainingSec: 0, endsAtMs: null }).catch(() => {});
          toastRef.current?.('⏰ Time is up!');
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const setTimer = useCallback((minutes: number) => {
    const dur = Math.max(1, minutes) * 60;
    update(timerRef, { durationSec: dur, running: false, remainingSec: dur, endsAtMs: null }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const toggleTimer = useCallback(() => {
    const remaining = computeRemaining(timerModel);
    if (!timerModel.running) {
      update(timerRef, { running: true, endsAtMs: Date.now() + remaining * 1000, remainingSec: remaining }).catch(console.error);
    } else {
      update(timerRef, { running: false, endsAtMs: null, remainingSec: remaining }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerModel, boardId]);

  const resetTimer = useCallback(() => {
    const dur = timerModel.durationSec ?? 5 * 60;
    update(timerRef, { running: false, remainingSec: dur, endsAtMs: null }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerModel, boardId]);

  return {
    timerModel,
    displayTime,
    isWarning,
    setTimer,
    toggleTimer,
    resetTimer,
    registerToast: (fn: (msg: string) => void) => { toastRef.current = fn; },
  };
}
