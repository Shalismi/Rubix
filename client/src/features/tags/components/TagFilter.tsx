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
        <svg className="tag-toolbar-icon" aria-hidden="true" viewBox="0 0 20 20">
          <path d="M3.5 3.5h13v2L12 11v5.5l-4-2V11L3.5 5.5v-2Z" />
        </svg>
        Filter
        {selectedTagIds.length > 0 && (
          <span className="tag-filter-count">{selectedTagIds.length}</span>
        )}
      </summary>
      <div className="tag-filter-menu">
        <div className="tag-filter-heading">
          <div className="tag-panel-title">
            <svg className="tag-panel-icon" aria-hidden="true" viewBox="0 0 20 20">
              <path d="M3.5 3.5h13v2L12 11v5.5l-4-2V11L3.5 5.5v-2Z" />
            </svg>
            <strong>Filter by tag</strong>
          </div>
          {selectedTagIds.length > 0 && (
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
        {tags.length > 0 ? (
          <div className="tag-filter-options" role="group" aria-label="Tags">
            {tags.map((tag) => (
              <label
                className={`tag-filter-option${selectedTagIds.includes(tag.id) ? " is-selected" : ""}`}
                key={tag.id}
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                <TagPill tag={tag} />
              </label>
            ))}
          </div>
        ) : (
          <p>No tags yet.</p>
        )}
      </div>
    </details>
  );
}
