const TAG_COLORS = [
  { value: "#2563EB", label: "Blue" },
  { value: "#0F766E", label: "Teal" },
  { value: "#16A34A", label: "Green" },
  { value: "#D97706", label: "Amber" },
  { value: "#EA580C", label: "Orange" },
  { value: "#DC2626", label: "Red" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#DB2777", label: "Pink" },
] as const;

type TagColorPickerProps = {
  color: string;
  label: string;
  onChange: (color: string) => void;
};

export function TagColorPicker({
  color,
  label,
  onChange,
}: TagColorPickerProps) {
  return (
    <div className="tag-color-picker" role="group" aria-label={label}>
      {TAG_COLORS.map((tagColor) => (
        <button
          className={color === tagColor.value ? "is-selected" : ""}
          key={tagColor.value}
          type="button"
          onClick={() => onChange(tagColor.value)}
          aria-label={tagColor.label}
          aria-pressed={color === tagColor.value}
          title={tagColor.label}
          style={{ backgroundColor: tagColor.value }}
        />
      ))}
    </div>
  );
}
