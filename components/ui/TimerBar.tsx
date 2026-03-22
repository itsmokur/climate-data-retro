'use client';

import { Phase, PHASE_LABELS } from '@/types';

interface TimerBarProps {
  displayTime: string;
  isRunning: boolean;
  isWarning: boolean;
  phase: Phase;
  onSetTimer: (minutes: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

const PRESETS = [3, 5, 10, 15];

export function TimerBar({ displayTime, isRunning, isWarning, phase, onSetTimer, onToggle, onReset }: TimerBarProps) {
  return (
    <div className="bg-[#faf9f6] border-b border-[#e2ddd8] px-6 py-2 flex items-center gap-3">
      <span className="text-xs font-semibold text-[#8a8279]">⏱ TIMER</span>

      <span className={`font-serif text-[22px] font-bold tracking-widest min-w-[72px] transition-colors ${isWarning ? 'text-red-500' : 'text-[#1a1714]'}`}>
        {displayTime}
      </span>

      <div className="flex items-center gap-1.5">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => onSetTimer(m)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border-[1.5px] border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714] transition-colors"
          >
            {m}m
          </button>
        ))}

        <button
          onClick={onToggle}
          className={`w-[30px] h-[30px] rounded-lg border-[1.5px] text-sm flex items-center justify-center transition-all ${
            isRunning
              ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
              : 'border-[#e2ddd8] text-[#8a8279] hover:bg-[#1a1714] hover:text-white hover:border-[#1a1714]'
          }`}
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        <button
          onClick={onReset}
          title="Reset"
          className="w-[30px] h-[30px] rounded-lg border-[1.5px] border-[#e2ddd8] text-[#8a8279] text-sm flex items-center justify-center hover:bg-[#1a1714] hover:text-white hover:border-[#1a1714] transition-all"
        >
          ↺
        </button>
      </div>

      <div className="flex-1" />
      <span className="text-xs font-semibold text-[#8a8279]">{PHASE_LABELS[phase]} phase</span>
    </div>
  );
}
