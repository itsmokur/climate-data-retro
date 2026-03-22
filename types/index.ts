export type ColumnId = 'hifi' | 'complaints' | 'ideas' | 'shoutouts';

export interface Column {
  id: ColumnId;
  title: string;
  dotColor: string;
}

export interface Card {
  id: string;
  text: string;
  author: string;
  ownerUid: string | null;
  col: ColumnId;
  groupId: string | null;
  votes: string[]; // array of clientIds
  ts: number;
}

export interface CardGroup {
  id: string;
  title: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate: string;
  done: boolean;
  createdBy: string;
  ts: number;
}

export interface BoardState {
  cards: Record<string, Card>;
  groups: Record<string, CardGroup>;
  title: string;
  discussed: Record<string, boolean>;
  activeDiscuss: string | null;
  actions: Record<string, ActionItem>;
}

export interface TimerModel {
  durationSec: number;
  running: boolean;
  endsAtMs: number | null;
  remainingSec: number;
}

export interface PresenceUser {
  name: string;
  online: boolean;
  joinedAt: number;
}

export type Phase = 0 | 1 | 2 | 3;
export const PHASE_LABELS: Record<Phase, string> = {
  0: 'Reflect',
  1: 'Vote',
  2: 'Discuss',
  3: 'Actions',
};

export const COLUMNS: Column[] = [
  { id: 'hifi',       title: '🙌 Hi Five',    dotColor: '#22c55e' },
  { id: 'complaints', title: '😬 Complaints', dotColor: '#ef4444' },
  { id: 'ideas',      title: '💡 Ideas',      dotColor: '#6366f1' },
  { id: 'shoutouts',  title: '🏆 Shout Outs', dotColor: '#f59e0b' },
];

export const DEFAULT_BOARD_STATE: BoardState = {
  cards: {},
  groups: {},
  title: 'Sprint Retrospective #1',
  discussed: {},
  activeDiscuss: null,
  actions: {},
};
