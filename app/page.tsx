'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const boardId = Math.random().toString(36).slice(2, 10);
    router.replace(`/board/${boardId}`);
  }, [router]);
  return (
    <div className="min-h-screen bg-[#f0ede8] flex items-center justify-center">
      <div className="font-serif text-2xl font-bold text-[#1a1714]">Retro<span className="text-[#6d4c41]">.</span></div>
    </div>
  );
}
