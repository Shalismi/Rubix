import { useState } from "react";
import { useDismissibleDetails } from "../../tags/hooks/useDismissibleDetails";

const months = Array.from({ length: 12 }, (_, monthIndex) => {
  const date = new Date(2000, monthIndex, 1);
  return {
    short: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    long: new Intl.DateTimeFormat("en-US", { month: "long" }).format(date),
  };
});

type CalendarMonthPickerProps = {
  month: Date;
  onChange: (month: Date) => void;
};

export function CalendarMonthPicker({ month, onChange }: CalendarMonthPickerProps) {
  const detailsRef = useDismissibleDetails();
  const [year, setYear] = useState(month.getFullYear());
  const [yearInput, setYearInput] = useState(String(month.getFullYear()));
  const isValidYear = /^\d{3,4}$/.test(yearInput) && Number(yearInput) >= 100;
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(month);

  function showYear(nextYear: number) {
    setYear(nextYear);
    setYearInput(String(nextYear));
  }

  function chooseMonth(monthIndex: number) {
    const nextMonth = new Date(month);
    nextMonth.setFullYear(year, monthIndex, 1);
    onChange(nextMonth);
    if (detailsRef.current) {
      detailsRef.current.open = false;
      detailsRef.current.querySelector("summary")?.focus();
    }
  }

  return (
    <details className="calendar-month-picker" ref={detailsRef}>
      <summary
        aria-label={`Choose month and year, currently ${monthTitle}`}
        onClick={() => {
          if (!detailsRef.current?.open) showYear(month.getFullYear());
        }}
      >
        <h2 id="calendar-view-heading">{monthTitle}</h2>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </summary>
      <div className="calendar-month-menu" role="group" aria-label="Choose month">
        <div className="calendar-month-year">
          <button
            className="calendar-view-control"
            type="button"
            aria-label="Previous year"
            disabled={year <= 100}
            onClick={() => showYear(year - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <input
            className="calendar-year-input"
            type="text"
            inputMode="numeric"
            aria-label="Year"
            title="Type a year"
            autoComplete="off"
            maxLength={4}
            value={yearInput}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (!/^\d{0,4}$/.test(value)) return;
              setYearInput(value);
              if (Number(value) >= 100) setYear(Number(value));
            }}
            onBlur={() => setYearInput(String(year))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (isValidYear) chooseMonth(month.getMonth());
                else setYearInput(String(year));
              }
            }}
          />
          <button
            className="calendar-view-control"
            type="button"
            aria-label="Next year"
            disabled={year >= 9999}
            onClick={() => showYear(year + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m10 6 6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="calendar-month-options">
          {months.map((option, monthIndex) => (
            <button
              type="button"
              key={option.short}
              aria-label={`${option.long} ${year}`}
              aria-pressed={month.getFullYear() === year && month.getMonth() === monthIndex}
              disabled={!isValidYear}
              onClick={() => chooseMonth(monthIndex)}
            >
              {option.short}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
