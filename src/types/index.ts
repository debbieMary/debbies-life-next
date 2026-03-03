export type GoalCategory = 'influencer' | 'programadora' | 'spa' | 'salud' | 'otro';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  target_date: string | null;
  completed: boolean;
  created_at: string;
}

export type ActionType = 'buena' | 'mala';

export interface GoalAction {
  id: string;
  goal_id: string;
  title: string;
  type: ActionType;
  completed: boolean;
  action_date: string | null;
  action_time: string | null;
  created_at: string;
}

export type TransactionType = 'ingreso' | 'gasto';
export type Currency = 'USD' | 'BOB';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  currency: Currency;
  date: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  rate: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  notes: string;
  created_at: string;
}

export type DiaryMood = 'increible' | 'feliz' | 'normal' | 'triste' | 'enojada' | 'ansiosa' | 'cansada' | 'enferma';

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  created_at: string;
}

export interface PeriodEntry {
  id: string;
  start_date: string;
  duration_days: number;
  notes: string;
  created_at: string;
}

export interface PeriodCycleLength {
  id: string;
  cycle_days: number;
  notes: string;
  recorded_at: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  sexo: string | null;
  direccion: string | null;
  telefono: string | null;
}
