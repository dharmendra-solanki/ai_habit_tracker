import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";

// =========================
// DATE HELPERS
// =========================

export const toDateKey = (date) => format(date, "yyyy-MM-dd");

export const todayKey = () => toDateKey(new Date());

// =========================
// LAST 90 DAYS
// =========================

export const last90Days = () => {
  const end = new Date();

  const start = subDays(end, 90);

  return eachDayOfInterval({
    start,
    end,
  }).map(toDateKey);
};

// =========================
// CURRENT WEEK
// =========================

export const currentWeekKeys = () => {
  const now = new Date();

  const start = startOfWeek(now, {
    weekStartsOn: 1,
  });

  const end = endOfWeek(now, {
    weekStartsOn: 1,
  });

  return eachDayOfInterval({
    start,
    end,
  }).map(toDateKey);
};

// =========================
// LAST N DAYS
// =========================

export const lastNDays = (n) => {
  const end = new Date();

  const start = subDays(end, n - 1);

  return eachDayOfInterval({
    start,
    end,
  }).map(toDateKey);
};

// =========================
// STREAK CALCULATOR
// =========================

export const calcStreak = (sortedDateKeys = []) => {
  // newest first unique

  if (!sortedDateKeys.length) {
    return {
      current: 0,
      longest: 0,
    };
  }

  const set = new Set(sortedDateKeys);

  const today = toDateKey(new Date());

  const yesterday = toDateKey(subDays(new Date(), 1));

  let current = 0;

  let cursor = new Date();

  // If neither today nor yesterday exists
  // streak is broken
  if (!set.has(today) && !set.has(yesterday)) {
    current = 0;
  } else {
    // If today completed
    // start checking from yesterday
    if (set.has(today)) {
      current = 1;
      cursor = subDays(cursor, 1);
    }

    while (set.has(toDateKey(cursor))) {
      current++;

      cursor = subDays(cursor, 1);
    }
  }

  // =========================
  // LONGEST STREAK
  // =========================

  const sortedAsc = [...new Set(sortedDateKeys)].sort();

  let longest = 0;

  let run = 0;

  let prev = null;

  for (const key of sortedAsc) {
    if (prev) {
      const currentDate = new Date(key);

      const prevDate = new Date(prev);

      const diff = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        run++;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }

    if (run > longest) {
      longest = run;
    }

    prev = key;
  }

  return {
    current,
    longest,
  };
};
