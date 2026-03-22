'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface ToastItem {
  id: string;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, duration = 2500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return { toasts, toast };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[#1a1714] text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-slide-in max-w-xs"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
