export const WELCOME_MESSAGES = [
  "What would you like to make time for today?",
  "Pick one thing to start with. The rest can follow.",
  "A little focus can make room for a good day.",
  "Your plans are here. Take them one step at a time.",
  "Make space for what matters to you today.",
] as const;

const sessionIndexes = new Map<number, number>();
const lastIndexes = new Map<number, number>();

function parseIndex(value: string | null) {
  if (value === null) return null;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < WELCOME_MESSAGES.length
    ? index
    : null;
}

export function startWelcomeSession(userId: number) {
  const lastKey = `rubix.welcome.last.${userId}`;
  let previousIndex = lastIndexes.get(userId) ?? -1;
  try {
    previousIndex = parseIndex(window.localStorage.getItem(lastKey)) ?? previousIndex;
  } catch {
    // In-memory rotation still works when browser storage is unavailable.
  }

  const index = (previousIndex + 1) % WELCOME_MESSAGES.length;
  lastIndexes.set(userId, index);
  sessionIndexes.set(userId, index);
  try {
    window.localStorage.setItem(lastKey, String(index));
  } catch {
    // The current session still keeps its message.
  }
  try {
    window.sessionStorage.setItem(`rubix.welcome.session.${userId}`, String(index));
  } catch {
    // The in-memory session keeps the same message while navigating.
  }
  return WELCOME_MESSAGES[index];
}

export function getWelcomeMessage(userId: number) {
  let index = sessionIndexes.get(userId);
  if (index !== undefined) return WELCOME_MESSAGES[index];

  try {
    index = parseIndex(window.sessionStorage.getItem(`rubix.welcome.session.${userId}`)) ?? undefined;
  } catch {
    // Start a session using the available storage or in-memory fallback.
  }
  if (index !== undefined) {
    sessionIndexes.set(userId, index);
    return WELCOME_MESSAGES[index];
  }
  return startWelcomeSession(userId);
}
