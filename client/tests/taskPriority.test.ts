import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tag } from "../src/features/tags/types.ts";
import type { Task } from "../src/features/tasks/types.ts";
import { sortTasksByTagPriority } from "../src/features/tasks/utils/taskPriority.ts";

const tags: Tag[] = [
  { id: 1, name: "First", color: "#2563eb" },
  { id: 2, name: "Second", color: "#f06595" },
];

function task(id: number, tagIds: number[], overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    dueDate: "2026-10-25",
    completed: false,
    deletedAt: null,
    tags: tagIds.map((tagId) =>
      tags.find((tag) => tag.id === tagId) ?? {
        id: tagId,
        name: "Unknown tag",
        color: "#888888",
      },
    ),
    ...overrides,
  };
}

const ids = (tasks: Task[]) => tasks.map((task) => task.id);

test("highest tag determines priority; untagged and unknown tags follow", () => {
  const tasks = [task(1, []), task(2, [2]), task(3, [2, 1]), task(4, [1]), task(5, [99])];
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, tags, true)), [3, 4, 2, 1, 5]);
  assert.deepEqual(ids(tasks), [1, 2, 3, 4, 5]);
  assert.deepEqual(tasks[2].tags.map((tag) => tag.id), [2, 1]);
});

test("priority changes reorder tasks without changing their data", () => {
  const tasks = [task(1, [1]), task(2, [2])];
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, tags, true)), [1, 2]);
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, [...tags].reverse(), true)), [2, 1]);
});

test("dates remain chronological before priority is considered", () => {
  const tasks = [
    task(1, [1], { dueDate: "2026-10-26" }),
    task(2, [2]),
    task(3, [1]),
    task(4, [], { dueDate: "2026-10-24" }),
  ];
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, tags, true)), [4, 3, 2, 1]);
});

test("completed tasks use priority within each date", () => {
  const tasks = [
    task(1, [2], { completed: true }),
    task(2, [1], { completed: true }),
    task(3, [1], { completed: true, dueDate: "2026-10-26" }),
    task(4, [], { completed: false, dueDate: "2026-10-26" }),
  ];
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, tags, true)), [4, 2, 1, 3]);
});

test("equal priorities keep the existing order and undated tasks stay last", () => {
  const tasks = [
    task(1, [2], { dueDate: undefined }),
    task(4, [1]),
    task(3, [1]),
    task(2, [1], { dueDate: undefined }),
  ];
  assert.deepEqual(ids(sortTasksByTagPriority(tasks, tags, true)), [4, 3, 2, 1]);
});

test("turning priority off or having no tags keeps the original task order", () => {
  const tasks = [task(3, []), task(2, [2]), task(1, [1])];
  assert.equal(sortTasksByTagPriority(tasks, tags, false), tasks);
  assert.equal(sortTasksByTagPriority(tasks, [], true), tasks);
});
