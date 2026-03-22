'use client';

import { useState, useCallback } from 'react';

interface WelcomeModalProps {
  onJoin: (name: string) => void;
}

export function WelcomeModal({ onJoin }: WelcomeModalProps) {
  const [name, setName] = useState('');

  const handleJoin = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onJoin(trimmed);
  }, [name, onJoin]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#faf9f6] rounded-2xl p-6 w-[480px] max-w-[90vw] shadow-2xl">
        <h2 className="font-serif text-xl font-bold mb-1">Welcome to the Retro 👋</h2>
        <p className="text-sm text-[#8a8279] mb-4">
          Enter your name to join. Everyone can access the same board by sharing the link.
        </p>
        <input
          className="w-full text-sm border border-[#e2ddd8] rounded-lg px-3.5 py-2.5 bg-[#f0ede8] text-[#1a1714] mb-3.5 outline-none focus:ring-2 focus:ring-[#6d4c41]"
          placeholder="Your name (e.g. Alex, Milton, Igor, Marick, or Mert)"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
        />
        <div className="flex justify-end">
          <button
            onClick={handleJoin}
            className="bg-[#1a1714] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
          >
            Join →
          </button>
        </div>
      </div>
    </div>
  );
}
