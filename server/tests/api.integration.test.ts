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
    email: string | null;
    emailVerified: boolean;
    hasRecoveryCode: boolean;
  };
};

type RegistrationResponse = AuthResponse & {
  recoveryCode: string;
};

type RecoveryCodeResponse = AuthResponse & {
  recoveryCode: string;
};

type PasswordRecoveryResponse = {
  message: string;
  recoveryCode: string;
};

type VerificationRequestResponse = {
  message: string;
  developmentVerificationUrl?: string;
};

type Task = {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  deletedAt: string | null;
  tags: Tag[];
};

type Tag = {
  id: number;
  name: string;
  color: string;
};

type StreakResponse = {
  streak: {
    currentStreak: number;
    today: string;
    week: Array<{
      date: string;
      label: string;
      completed: boolean;
      isToday: boolean;
    }>;
  };
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
    "X-Rubix-Time-Zone": "UTC",
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
  let firstUserId = 0;
  let taskId = 0;
  let tagId = 0;
  let secondTagId = 0;

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
    const firstUser = await request<RegistrationResponse>("/api/auth/register", {
      method: "POST",
      body: {
        username: "account_one",
        email: "Account.One@Example.com",
        password: "StartingPass1",
      },
    });
    const secondUser = await request<RegistrationResponse>("/api/auth/register", {
      method: "POST",
      body: { username: "account_two", password: "SecondPass2" },
    });

    assert.equal(firstUser.status, 201);
    assert.equal(firstUser.body?.user.username, "account_one");
    assert.equal(firstUser.body?.user.email, "account.one@example.com");
    assert.equal(firstUser.body?.user.emailVerified, false);
    assert.equal(firstUser.body?.user.hasRecoveryCode, true);
    assert.match(
      firstUser.body?.recoveryCode ?? "",
      /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/,
    );
    assert.match(firstUser.cookie ?? "", /^rubix_session=/);
    assert.equal(secondUser.status, 201);
    assert.equal(secondUser.body?.user.username, "account_two");
    assert.equal(secondUser.body?.user.email, null);
    assert.equal(secondUser.body?.user.hasRecoveryCode, true);
    assert.match(secondUser.cookie ?? "", /^rubix_session=/);

    firstUserCookie = firstUser.cookie!;
    secondUserCookie = secondUser.cookie!;
    firstUserId = firstUser.body!.user.id;
  });

  await context.test(
    "supports optional email management and email sign-in",
    async () => {
      const noEmailVerification = await request<{ message: string }>(
        "/api/auth/email/verification",
        {
          method: "POST",
          cookie: secondUserCookie,
        },
      );
      const emailLogin = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: {
          identifier: "ACCOUNT.ONE@example.com",
          password: "StartingPass1",
        },
      });
      const duplicateRegistration = await request<{ message: string }>(
        "/api/auth/register",
        {
          method: "POST",
          body: {
            username: "account_three",
            email: "account.one@example.com",
            password: "ThirdPass3",
          },
        },
      );
      const wrongPassword = await request<{ message: string }>(
        "/api/auth/email",
        {
          method: "PATCH",
          cookie: secondUserCookie,
          body: {
            email: "account.two@example.com",
            currentPassword: "WrongPass9",
          },
        },
      );
      const duplicateEmail = await request<{ message: string }>(
        "/api/auth/email",
        {
          method: "PATCH",
          cookie: secondUserCookie,
          body: {
            email: "account.one@example.com",
            currentPassword: "SecondPass2",
          },
        },
      );
      const emailChange = await request<AuthResponse>("/api/auth/email", {
        method: "PATCH",
        cookie: secondUserCookie,
        body: {
          email: "Account.Two@Example.com",
          currentPassword: "SecondPass2",
        },
      });

      assert.equal(noEmailVerification.status, 400);
      assert.equal(emailLogin.status, 200);
      assert.equal(emailLogin.body?.user.username, "account_one");
      assert.equal(duplicateRegistration.status, 409);
      assert.equal(
        duplicateRegistration.body?.message,
        "Email is already in use.",
      );
      assert.equal(wrongPassword.status, 400);
      assert.equal(wrongPassword.body?.message, "Current password is incorrect.");
      assert.equal(duplicateEmail.status, 409);
      assert.equal(emailChange.status, 200);
      assert.equal(emailChange.body?.user.email, "account.two@example.com");
      assert.equal(emailChange.body?.user.emailVerified, false);
    },
  );

  await context.test(
    "verifies an email with an expiring single-use token",
    async () => {
      const verificationRequest =
        await request<VerificationRequestResponse>(
          "/api/auth/email/verification",
          {
            method: "POST",
            cookie: firstUserCookie,
          },
        );
      const duplicateRequest = await request<{ message: string }>(
        "/api/auth/email/verification",
        {
          method: "POST",
          cookie: firstUserCookie,
        },
      );
      const verificationUrl = new URL(
        verificationRequest.body!.developmentVerificationUrl!,
      );
      const token = verificationUrl.searchParams.get("token")!;
      const verification = await request<{ message: string }>(
        "/api/auth/email/verify",
        {
          method: "POST",
          body: { token },
        },
      );
      const verifiedSession = await request<AuthResponse>("/api/auth/me", {
        cookie: firstUserCookie,
      });
      const replay = await request<{ message: string }>(
        "/api/auth/email/verify",
        {
          method: "POST",
          body: { token },
        },
      );

      assert.equal(verificationRequest.status, 200);
      assert.match(
        verificationRequest.body?.developmentVerificationUrl ?? "",
        /^http:\/\/localhost:5173\/verify-email\?token=/,
      );
      assert.equal(duplicateRequest.status, 429);
      assert.equal(verification.status, 200);
      assert.equal(verifiedSession.body?.user.emailVerified, true);
      assert.equal(replay.status, 400);
    },
  );

  await context.test(
    "recovers a password with a one-time code and revokes sessions",
    async () => {
      const registration = await request<RegistrationResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: {
            username: "recovery_account",
            email: "recovery@example.com",
            password: "RecoveryPass1",
          },
        },
      );
      const originalCode = registration.body!.recoveryCode;
      const otherSession = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: {
          identifier: "recovery_account",
          password: "RecoveryPass1",
        },
      });
      const unknownAccount = await request<{ message: string }>(
        "/api/auth/password/recover",
        {
          method: "POST",
          body: {
            identifier: "missing_account",
            recoveryCode: originalCode,
            newPassword: "RecoveredPass2",
          },
        },
      );
      const wrongCode = await request<{ message: string }>(
        "/api/auth/password/recover",
        {
          method: "POST",
          body: {
            identifier: "recovery_account",
            recoveryCode: "AAAA-AAAA-AAAA-AAAA",
            newPassword: "RecoveredPass2",
          },
        },
      );
      const recovered = await request<PasswordRecoveryResponse>(
        "/api/auth/password/recover",
        {
          method: "POST",
          body: {
            identifier: "RECOVERY@EXAMPLE.COM",
            recoveryCode: originalCode.toLowerCase(),
            newPassword: "RecoveredPass2",
          },
        },
      );

      assert.equal(registration.status, 201);
      assert.equal(unknownAccount.status, 400);
      assert.equal(wrongCode.status, 400);
      assert.equal(unknownAccount.body?.message, wrongCode.body?.message);
      assert.equal(recovered.status, 200);
      assert.match(
        recovered.body?.recoveryCode ?? "",
        /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/,
      );
      assert.notEqual(recovered.body?.recoveryCode, originalCode);

      const firstRevokedSession = await request("/api/auth/me", {
        cookie: registration.cookie!,
      });
      const secondRevokedSession = await request("/api/auth/me", {
        cookie: otherSession.cookie!,
      });
      const oldPasswordLogin = await request("/api/auth/login", {
        method: "POST",
        body: {
          identifier: "recovery_account",
          password: "RecoveryPass1",
        },
      });
      const newPasswordLogin = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: {
          identifier: "recovery_account",
          password: "RecoveredPass2",
        },
      });
      const replayedCode = await request<{ message: string }>(
        "/api/auth/password/recover",
        {
          method: "POST",
          body: {
            identifier: "recovery_account",
            recoveryCode: originalCode,
            newPassword: "AnotherPass3",
          },
        },
      );

      assert.equal(firstRevokedSession.status, 401);
      assert.equal(secondRevokedSession.status, 401);
      assert.equal(oldPasswordLogin.status, 401);
      assert.equal(newPasswordLogin.status, 200);
      assert.equal(replayedCode.status, 400);

      const wrongCurrentPassword = await request<{ message: string }>(
        "/api/auth/recovery-code",
        {
          method: "POST",
          cookie: newPasswordLogin.cookie!,
          body: { currentPassword: "WrongPass9" },
        },
      );
      const replacedCode = await request<RecoveryCodeResponse>(
        "/api/auth/recovery-code",
        {
          method: "POST",
          cookie: newPasswordLogin.cookie!,
          body: { currentPassword: "RecoveredPass2" },
        },
      );

      assert.equal(wrongCurrentPassword.status, 400);
      assert.equal(
        wrongCurrentPassword.body?.message,
        "Current password is incorrect.",
      );
      assert.equal(replacedCode.status, 200);
      assert.equal(replacedCode.body?.user.hasRecoveryCode, true);
      assert.notEqual(
        replacedCode.body?.recoveryCode,
        recovered.body?.recoveryCode,
      );
    },
  );

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

    const secondTag = await request<{ tag: Tag }>("/api/tags", {
      method: "POST",
      cookie: firstUserCookie,
      body: { name: "Personal", color: "#16A34A" },
    });

    assert.equal(secondTag.status, 201);
    secondTagId = secondTag.body!.tag.id;

    const reorderedTags = await request<{ tags: Tag[] }>("/api/tags/order", {
      method: "PATCH",
      cookie: firstUserCookie,
      body: { tagIds: [secondTagId, tagId] },
    });
    const creationOrderTags = await request<{
      tags: Tag[];
      priorityEnabled: boolean;
    }>("/api/tags/priority", {
      method: "PATCH",
      cookie: firstUserCookie,
      body: { enabled: false },
    });
    const priorityOrderTags = await request<{
      tags: Tag[];
      priorityEnabled: boolean;
    }>("/api/tags/priority", {
      method: "PATCH",
      cookie: firstUserCookie,
      body: { enabled: true },
    });

    assert.deepEqual(
      reorderedTags.body?.tags.map((tag) => tag.name),
      ["Personal", "Work"],
    );
    assert.equal(creationOrderTags.body?.priorityEnabled, false);
    assert.deepEqual(
      creationOrderTags.body?.tags.map((tag) => tag.name),
      ["Work", "Personal"],
    );
    assert.equal(priorityOrderTags.body?.priorityEnabled, true);
    assert.deepEqual(
      priorityOrderTags.body?.tags.map((tag) => tag.name),
      ["Personal", "Work"],
    );

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
    assert.equal(createdTask.body?.task.deletedAt, null);
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

  await context.test(
    "records one account-owned streak day per completion date",
    async () => {
      const completedTask = await request<{ task: Task }>(
        `/api/tasks/${taskId}`,
        {
          method: "PATCH",
          cookie: firstUserCookie,
          body: { completed: true },
        },
      );
      const firstSummary = await request<StreakResponse>("/api/streaks", {
        cookie: firstUserCookie,
      });

      assert.equal(completedTask.status, 200);
      assert.equal(firstSummary.status, 200);
      assert.equal(firstSummary.body?.streak.currentStreak, 1);
      assert.equal(
        firstSummary.body?.streak.week.find((day) => day.isToday)?.completed,
        true,
      );

      await request(`/api/tasks/${taskId}`, {
        method: "PATCH",
        cookie: firstUserCookie,
        body: { completed: false },
      });
      const summaryAfterUndo = await request<StreakResponse>("/api/streaks", {
        cookie: firstUserCookie,
      });

      assert.equal(summaryAfterUndo.body?.streak.currentStreak, 1);

      await request(`/api/tasks/${taskId}`, {
        method: "PATCH",
        cookie: firstUserCookie,
        body: { completed: true },
      });

      assert.equal(
        await prisma!.streakDay.count({ where: { userId: firstUserId } }),
        1,
      );

      const secondUserSummary = await request<StreakResponse>("/api/streaks", {
        cookie: secondUserCookie,
      });

      assert.equal(secondUserSummary.body?.streak.currentStreak, 0);

      const today = firstSummary.body!.streak.today;
      const getDateWithOffset = (offset: number) => {
        const [year, month, day] = today.split("-").map(Number);
        const date = new Date(Date.UTC(year!, month! - 1, day! + offset));

        return date.toISOString().slice(0, 10);
      };
      const yesterday = getDateWithOffset(-1);
      const twoDaysAgo = getDateWithOffset(-2);

      await prisma!.streakDay.createMany({
        data: [
          { userId: firstUserId, activityDate: yesterday },
          { userId: firstUserId, activityDate: twoDaysAgo },
        ],
        skipDuplicates: true,
      });

      const consecutiveSummary = await request<StreakResponse>(
        "/api/streaks",
        { cookie: firstUserCookie },
      );

      assert.equal(consecutiveSummary.body?.streak.currentStreak, 3);

      await prisma!.streakDay.delete({
        where: {
          userId_activityDate: { userId: firstUserId, activityDate: today },
        },
      });

      const yesterdayGraceSummary = await request<StreakResponse>(
        "/api/streaks",
        { cookie: firstUserCookie },
      );

      assert.equal(yesterdayGraceSummary.body?.streak.currentStreak, 2);

      await prisma!.streakDay.delete({
        where: {
          userId_activityDate: {
            userId: firstUserId,
            activityDate: yesterday,
          },
        },
      });

      const gapSummary = await request<StreakResponse>("/api/streaks", {
        cookie: firstUserCookie,
      });

      assert.equal(gapSummary.body?.streak.currentStreak, 0);
    },
  );

  await context.test("updates, recycles, restores, and deletes an owned task", async () => {
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

    const deletedTask = await request<{ task: Task }>(`/api/tasks/${taskId}`, {
      method: "DELETE",
      cookie: firstUserCookie,
    });
    const remainingTasks = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });
    const firstUserTrash = await request<{ tasks: Task[] }>(
      "/api/tasks/trash",
      { cookie: firstUserCookie },
    );
    const secondUserTrash = await request<{ tasks: Task[] }>(
      "/api/tasks/trash",
      { cookie: secondUserCookie },
    );

    assert.equal(deletedTask.status, 200);
    assert.ok(deletedTask.body?.task.deletedAt);
    assert.equal(remainingTasks.body?.tasks.length, 0);
    assert.equal(firstUserTrash.body?.tasks.length, 1);
    assert.equal(secondUserTrash.body?.tasks.length, 0);

    const forbiddenRestore = await request(`/api/tasks/${taskId}/restore`, {
      method: "PATCH",
      cookie: secondUserCookie,
    });
    const forbiddenPermanentDelete = await request(
      `/api/tasks/${taskId}/permanent`,
      { method: "DELETE", cookie: secondUserCookie },
    );

    assert.equal(forbiddenRestore.status, 404);
    assert.equal(forbiddenPermanentDelete.status, 404);

    const restoredTask = await request<{ task: Task }>(
      `/api/tasks/${taskId}/restore`,
      { method: "PATCH", cookie: firstUserCookie },
    );
    const restoredTasks = await request<{ tasks: Task[] }>("/api/tasks", {
      cookie: firstUserCookie,
    });
    const emptyTrash = await request<{ tasks: Task[] }>("/api/tasks/trash", {
      cookie: firstUserCookie,
    });

    assert.equal(restoredTask.status, 200);
    assert.equal(restoredTask.body?.task.deletedAt, null);
    assert.equal(restoredTasks.body?.tasks.length, 1);
    assert.equal(emptyTrash.body?.tasks.length, 0);

    const recycledAgain = await request(`/api/tasks/${taskId}`, {
      method: "DELETE",
      cookie: firstUserCookie,
    });
    const permanentlyDeleted = await request(
      `/api/tasks/${taskId}/permanent`,
      { method: "DELETE", cookie: firstUserCookie },
    );
    const trashAfterPermanentDelete = await request<{ tasks: Task[] }>(
      "/api/tasks/trash",
      { cookie: firstUserCookie },
    );

    assert.equal(recycledAgain.status, 200);
    assert.equal(permanentlyDeleted.status, 204);
    assert.equal(trashAfterPermanentDelete.body?.tasks.length, 0);

    const expiringTask = await request<{ task: Task }>("/api/tasks", {
      method: "POST",
      cookie: firstUserCookie,
      body: { title: "Expired trash task" },
    });
    const expiringTaskId = expiringTask.body!.task.id;

    await request(`/api/tasks/${expiringTaskId}`, {
      method: "DELETE",
      cookie: firstUserCookie,
    });
    await prisma!.task.update({
      where: { id: expiringTaskId },
      data: { deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    });

    const trashAfterExpiration = await request<{ tasks: Task[] }>(
      "/api/tasks/trash",
      { cookie: firstUserCookie },
    );
    const expiredTask = await prisma!.task.findUnique({
      where: { id: expiringTaskId },
    });

    assert.equal(trashAfterExpiration.body?.tasks.length, 0);
    assert.equal(expiredTask, null);
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
