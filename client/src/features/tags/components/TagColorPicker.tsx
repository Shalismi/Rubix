const TAG_COLORS = [
  { value: "#DC2626", label: "Red" },
  { value: "#FF8A00", label: "Orange" },
  { value: "#FDE047", label: "Yellow" },
  { value: "#16A34A", label: "Green" },
  { value: "#2563EB", label: "Blue" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#DB2777", label: "Pink" },
  { value: "#8B5E3C", label: "Brown" },
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
