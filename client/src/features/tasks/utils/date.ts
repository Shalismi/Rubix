export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateValue() {
  return toDateValue(new Date());
}

export function formatSectionDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatCalendarDay(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
}

export function formatCalendarMonth(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
}

export function formatCalendarWeekday(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
}

export function formatNextTaskTiming(
  dateValue: string,
  todayDateValue = getTodayDateValue(),
) {
  if (dateValue === todayDateValue) {
    return "Today";
  }

  const tomorrow = new Date(`${todayDateValue}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateValue === toDateValue(tomorrow)) {
    return "Tomorrow";
  }

  const weekEnd = new Date(`${todayDateValue}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const date = new Date(`${dateValue}T00:00:00`);
  if (dateValue > todayDateValue && dateValue <= toDateValue(weekEnd)) {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== Number(todayDateValue.slice(0, 4))
      ? { year: "numeric" as const }
      : {}),
  }).format(date);
}

export function compareDateValues(firstDate: string, secondDate: string) {
  return (
    new Date(`${firstDate}T00:00:00`).getTime() -
    new Date(`${secondDate}T00:00:00`).getTime()
  );
}

export function getDefaultDueDate(dateValue?: string) {
  return dateValue || getTodayDateValue();
}
