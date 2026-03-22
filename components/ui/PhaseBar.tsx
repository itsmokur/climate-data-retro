'use client';

import { Phase } from '@/types';

interface PhaseBarProps {
  phase: Phase;
  onChange: (phase: Phase) => void;
}

const PHASES: { label: string; phase: Phase }[] = [
  { label: '✍️ Reflect', phase: 0 },
  { label: '👍 Vote',    phase: 1 },
  { label: '💬 Discuss', phase: 2 },
  { label: '✅ Actions', phase: 3 },
];

export function PhaseBar({ phase, onChange }: PhaseBarProps) {
  return (
    <div className="bg-[#faf9f6] border-b border-[#e2ddd8] px-6 py-2.5 flex items-center gap-2">
      {PHASES.map((p, i) => (
        <div key={p.phase} className="flex items-center gap-2">
          {i > 0 && <div className="w-6 h-px bg-[#e2ddd8]" />}
          <button
            onClick={() => onChange(p.phase)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
              phase === p.phase
                ? 'bg-[#1a1714] text-white border-[#1a1714]'
                : 'border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714]'
            }`}
          >
            {p.label}
          </button>
        </div>
      ))}
    </div>
  );
}
