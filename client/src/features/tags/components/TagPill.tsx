import type { Tag } from "../types";

type TagPillProps = {
  tag: Tag;
};

export function TagPill({ tag }: TagPillProps) {
  return (
    <span className="tag-pill">
      <span
        className="tag-color-dot"
        style={{ backgroundColor: tag.color }}
        aria-hidden="true"
      />
      <span>{tag.name}</span>
    </span>
  );
}
