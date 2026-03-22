'use client';

interface ShareModalProps {
  url: string;
  onClose: () => void;
  onCopy: () => void;
}

export function ShareModal({ url, onClose, onCopy }: ShareModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#faf9f6] rounded-2xl p-6 w-[480px] max-w-[90vw] shadow-2xl">
        <h2 className="font-serif text-xl font-bold mb-1">Share this Retro 🔗</h2>
        <p className="text-sm text-[#8a8279] mb-4">Share this link with your team. Everyone can join directly.</p>
        <div className="font-mono text-xs bg-[#f0ede8] border border-[#e2ddd8] rounded-lg p-3 break-all text-[#8a8279] mb-3">
          {url}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="text-sm font-medium px-3.5 py-2 rounded-lg border border-[#e2ddd8] text-[#8a8279] hover:border-[#1a1714] hover:text-[#1a1714] transition-colors"
          >
            Close
          </button>
          <button
            onClick={onCopy}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#2d6a4f] text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            📋 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
