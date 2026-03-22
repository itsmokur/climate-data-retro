import { BoardPageClient } from '@/components/board/BoardPageClient';

interface Props {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { boardId } = await params;
  return <BoardPageClient boardId={boardId} />;
}
