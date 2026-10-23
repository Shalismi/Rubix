import { useCallback, useEffect, useState } from "react";
import { getStreak } from "../api/streakApi";
import type { StreakSummary } from "../types";

export function useStreak() {
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  const [streakError, setStreakError] = useState<string | null>(null);

  const refreshStreak = useCallback(async () => {
    try {
      setStreak(await getStreak());
      setStreakError(null);
    } catch {
      setStreakError("Could not load streak progress.");
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    getStreak()
      .then((nextStreak) => {
        if (isActive) {
          setStreak(nextStreak);
          setStreakError(null);
        }
      })
      .catch(() => {
        if (isActive) {
          setStreakError("Could not load streak progress.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStreak(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return {
    isLoadingStreak,
    refreshStreak,
    streak,
    streakError,
  };
}
