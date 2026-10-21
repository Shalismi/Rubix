import "dotenv/config";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { once } from "node:events";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import {
  createCleanTestDatabase,
  dropTestDatabase,
  testDatabaseUrl,
} from "./helpers/testDatabase.js";

type JsonBody = Record<string, unknown>;

type TestResponse<TBody> = {
  body: TBody | null;
  cookie: string | null;
  status: number;
};

type TestRequest = {
  body?: JsonBody;
  cookie?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
};

type AuthResponse = {
  user: {
    id: number;
    username: string;
  };
};

type Task = {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  tags: Tag[];
};

type Tag = {
  id: number;
  name: string;
  color: string;
};

let apiUrl = "";
let prisma: PrismaClient | null = null;
let server: Server | null = null;

async function request<TBody = JsonBody>(
  path: string,
  options: TestRequest = {},
): Promise<TestResponse<TBody>> {
  const headers: Record<string, string> = {
    Origin: "http://localhost:5173",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const responseText = await response.text();
  const setCookie = response.headers.get("set-cookie");

  return {
    body: responseText ? (JSON.parse(responseText) as TBody) : null,
    cookie: setCookie ? setCookie.split(";", 1)[0] ?? null : null,
    status: response.status,
  };
}

before(async () => {
  await createCleanTestDatabase();
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = "test";

  const [{ app }, prismaModule] = await Promise.all([
    import("../src/app.js"),
    import("../src/db/prisma.js"),
  ]);

  prisma = prismaModule.prisma;
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address() as AddressInfo;
  apiUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  if (prisma) {
    await prisma.$disconnect();
  }

  await dropTestDatabase();
});

test("Rubix authentication and user-owned task flow", async (context) => {
  let firstUserCookie = "";
  let secondUserCookie = "";
  let taskId = 0;
  let tagId = 0;

  await context.test("enforces the complete password policy", async () => {
    const response = await request<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: {
        username: "missing_lowercase",
        password: "ALLCAPS1",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(
      response.body?.message,
      "Password must contain at least one lowercase letter.",
    );
  });

  await context.test("registers two independent users", async () => {
    const firstUser = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { username: "account_one", password: "StartingPass1" },
    });
    const secondUser = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { username: "account_two", password: "SecondPass2" },
    });

    assert.equal(firstUser.status, 201);
    assert.equal(firstUser.body?.user.username, "account_one");
    assert.match(firstUser.cookie ?? "", /^rubix_session=/);
    assert.equal(secondUser.status, 201);
    assert.equal(secondUser.body?.user.username, "account_two");
    assert.match(secondUser.cookie ?? "", /^rubix_session=/);

    firstUserCookie = firstUser.cookie!;
    secondUserCookie = secondUser.cookie!;
  });

  await context.test("requires a session for task access", async () => {
    const response = await request("/api/tasks");

    assert.equal(response.status, 401);
  });

  await context.test("creates reusable tags owned by one user", async () => {
    const createdTag = await request<{ tag: Tag }>("/api/tags", {
      method: "POST",
      cookie: firstUserCookie,
      body: { name: "Work", color: "#2563EB" },
    });

    assert.equal(createdTag.status, 201);
    assert.equal(createdTag.body?.tag.name, "Work");
    assert.equal(createdTag.body?.tag.color, "#2563EB");
    tagId = createdTag.body!.tag.id;

    const duplicateTag = await request<{ message: string }>("/api/tags", {
      method: "POST",
      cookie: firstUserCookie,
      body: { name: "work", color: "#16A34A" },
    });
    const secondUserTags = await request<{ tags: Tag[] }>("/api/tags", {
      cookie: secondUserCookie,
    });
    const forbiddenEdit = await request(`/api/tags/${tagId}`, {
      method: "PATCH",
      cookie: secondUserCookie,
      body: { name: "Stolen", color: "#DC2626" },
    });

    assert.equal(duplicateTag.status, 409);
    assert.equal(secondUserTags.body?.tags.length, 0);
    assert.equal(forbiddenEdit.status, 404);
  });

  await context.test("keeps each user's tasks private", async () => {
    const createdTask = await request<{ task: Task }>("/api/tasks", {
      method: "POST",
      cookie: firstUserCookie,
      body: {
        title: "Private integration task",
        description: "Only account one should see this.",
        dueDate: "2026-10-18",
        tagIds: [tagId],
      },
    });

    assert.equal(createdTask.status, 201);
    assert.equal(createdTask.body?.task.completed, false);
    assert.deepEqual(createdTask.body?.task.tags, [
      { id: tagId, name: "Work", color: "#2563EB" },
    ]);
    taskId = createdTask.body!.task.id;

    const firstUserTasks = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });
    const secondUserTasks = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: secondUserCookie,
    });

    assert.equal(firstUserTasks.status, 200);
    assert.equal(firstUserTasks.body?.tasks.length, 1);
    assert.equal(secondUserTasks.status, 200);
    assert.equal(secondUserTasks.body?.tasks.length, 0);

    const forbiddenUpdate = await request(`/api/tasks/${taskId}`, {
      method: "PATCH",
      cookie: secondUserCookie,
      body: { completed: true },
    });
    const forbiddenDelete = await request(`/api/tasks/${taskId}`, {
      method: "DELETE",
      cookie: secondUserCookie,
    });

    assert.equal(forbiddenUpdate.status, 404);
    assert.equal(forbiddenDelete.status, 404);

    const forbiddenTagUse = await request("/api/tasks", {
      method: "POST",
      cookie: secondUserCookie,
      body: { title: "Wrong tag owner", tagIds: [tagId] },
    });

    assert.equal(forbiddenTagUse.status, 400);
  });

  await context.test("updates, completes, and deletes an owned task", async () => {
    const updatedTask = await request<{ task: Task }>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      cookie: firstUserCookie,
      body: { title: "Updated private task", completed: true },
    });

    assert.equal(updatedTask.status, 200);
    assert.equal(updatedTask.body?.task.title, "Updated private task");
    assert.equal(updatedTask.body?.task.completed, true);

    const updatedTag = await request<{ tag: Tag }>(`/api/tags/${tagId}`, {
      method: "PATCH",
      cookie: firstUserCookie,
      body: { name: "Focus", color: "#7C3AED" },
    });
    const taskWithUpdatedTag = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });

    assert.equal(updatedTag.status, 200);
    assert.deepEqual(taskWithUpdatedTag.body?.tasks[0]?.tags, [
      { id: tagId, name: "Focus", color: "#7C3AED" },
    ]);

    const deletedTag = await request(`/api/tags/${tagId}`, {
      method: "DELETE",
      cookie: firstUserCookie,
    });
    const taskWithoutTag = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });

    assert.equal(deletedTag.status, 204);
    assert.deepEqual(taskWithoutTag.body?.tasks[0]?.tags, []);

    const deletedTask = await request(`/api/tasks/${taskId}`, {
      method: "DELETE",
      cookie: firstUserCookie,
    });
    const remainingTasks = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });

    assert.equal(deletedTask.status, 204);
    assert.equal(remainingTasks.body?.tasks.length, 0);
  });

  await context.test(
    "changes a password and revokes other sessions",
    async () => {
      const otherSession = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { username: "account_one", password: "StartingPass1" },
      });

      assert.equal(otherSession.status, 200);
      assert.ok(otherSession.cookie);

      const passwordChange = await request("/api/auth/password", {
        method: "PATCH",
        cookie: firstUserCookie,
        body: {
          currentPassword: "StartingPass1",
          newPassword: "ChangedPass3",
        },
      });

      assert.equal(passwordChange.status, 204);

      const currentSession = await request<AuthResponse>("/api/auth/me", {
        cookie: firstUserCookie,
      });
      const revokedSession = await request("/api/auth/me", {
        cookie: otherSession.cookie!,
      });
      const oldPasswordLogin = await request("/api/auth/login", {
        method: "POST",
        body: { username: "account_one", password: "StartingPass1" },
      });
      const newPasswordLogin = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { username: "account_one", password: "ChangedPass3" },
      });

      assert.equal(currentSession.status, 200);
      assert.equal(revokedSession.status, 401);
      assert.equal(oldPasswordLogin.status, 401);
      assert.equal(newPasswordLogin.status, 200);
      assert.ok(newPasswordLogin.cookie);

      const logout = await request("/api/auth/logout", {
        method: "POST",
        cookie: newPasswordLogin.cookie!,
      });
      const loggedOutSession = await request("/api/auth/me", {
        cookie: newPasswordLogin.cookie!,
      });

      assert.equal(logout.status, 204);
      assert.equal(loggedOutSession.status, 401);
    },
  );
});
