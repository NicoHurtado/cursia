// Simple client-side streak tracker using localStorage.
// Tracks consecutive days the user opened the app.

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'cursia:streak';

function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') {
    return { count: 0, lastDate: '' };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lastDate: '' };
    const data = JSON.parse(raw) as StreakData;
    return {
      count: typeof data.count === 'number' ? data.count : 0,
      lastDate: data.lastDate || '',
    };
  } catch {
    return { count: 0, lastDate: '' };
  }
}

export function touchStreak(): StreakData {
  if (typeof window === 'undefined') {
    return { count: 0, lastDate: '' };
  }
  const today = getTodayKey();
  const prev = getStreak();
  if (!prev.lastDate) {
    const next = { count: 1, lastDate: today };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  if (prev.lastDate === today) {
    return prev; // already counted today
  }

  // Calculate if consecutive day
  const last = new Date(prev.lastDate + 'T00:00:00');
  const nextDate = new Date(last);
  nextDate.setDate(last.getDate() + 1);
  const isConsecutive = getTodayKey() === `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

  const count = isConsecutive ? prev.count + 1 : 1;
  const next = { count, lastDate: today };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}


