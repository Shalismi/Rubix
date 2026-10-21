import { TagPill } from "./TagPill";
import { useDismissibleDetails } from "../hooks/useDismissibleDetails";
import type { Tag } from "../types";

type TagFilterProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
};

export function TagFilter({ tags, selectedTagIds, onChange }: TagFilterProps) {
  const detailsRef = useDismissibleDetails();

  function toggleTag(tagId: number) {
    onChange(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((selectedId) => selectedId !== tagId)
        : [...selectedTagIds, tagId],
    );
  }

  return (
    <details className="tag-filter" ref={detailsRef}>
      <summary>
        Filter
        {selectedTagIds.length > 0 && (
          <span className="tag-filter-count">{selectedTagIds.length}</span>
        )}
      </summary>
      <div className="tag-filter-menu">
        <div className="tag-filter-heading">
          <strong>Filter by tag</strong>
          {selectedTagIds.length > 0 && (
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <label className="tag-filter-option" key={tag.id}>
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              <TagPill tag={tag} />
            </label>
          ))
        ) : (
          <p>No tags yet.</p>
        )}
      </div>
    </details>
  );
}
