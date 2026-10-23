export type StreakWeekDay = {
  date: string;
  label: string;
  completed: boolean;
  isToday: boolean;
};

export type StreakSummary = {
  currentStreak: number;
  today: string;
  week: StreakWeekDay[];
};
