import { expect, test, type Page } from "@playwright/test";

// All API responses are local fixtures. These checks never create real accounts
// or read/write production task data, even when a build has VITE_API_URL set.
async function mockApi(page: Page, signedIn = true) {
  const requests: string[] = [];
  const user = { id: 900001, username: "route_tester", email: null, emailVerified: false, hasRecoveryCode: true };
  const today = new Date().toISOString().slice(0, 10);
  const task = { id: 1, title: "Navigation test task", description: "", dueDate: today, completed: false, deletedAt: null, tags: [] };

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    if (path === "/api/auth/me") {
      await route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? { user } : { message: "Sign in required." } });
    } else if (path === "/api/auth/login") {
      signedIn = true;
      await route.fulfill({ json: { user } });
    } else if (path === "/api/auth/register") {
      signedIn = true;
      await route.fulfill({ json: { user, recoveryCode: "ABCD-EFGH-IJKL-MNOP" } });
    } else if (path === "/api/auth/logout") {
      signedIn = false;
      await route.fulfill({ status: 204 });
    } else if (path === "/api/auth/email/verify") {
      await route.fulfill({ json: { message: "Your email is now verified." } });
    } else if (path === "/api/auth/password/recover") {
      signedIn = false;
      await route.fulfill({ json: { recoveryCode: "QRST-UVWX-YZAB-CDEF" } });
    } else if (path === "/api/tasks") {
      await route.fulfill({ json: { tasks: [task] } });
    } else if (path === "/api/tasks/trash") {
      await route.fulfill({ json: { tasks: [] } });
    } else if (path === "/api/tags") {
      await route.fulfill({ json: { tags: [], priorityEnabled: false } });
    } else if (path === "/api/streaks") {
      await route.fulfill({ json: { streak: { today, currentStreak: 0, week: [] } } });
    } else {
      throw new Error(`Unexpected API request: ${route.request().method()} ${path}`);
    }
  });
  return requests;
}

async function signIn(page: Page) {
  await page.getByLabel("Username or email", { exact: true }).fill("route_tester");
  await page.getByLabel("Password", { exact: true }).fill("RoutingTest123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test.use({ timezoneId: "UTC" });

test("sidebar navigation records history and keeps the shared app loaded", async ({ page }) => {
  const requests = await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome route_tester," })).toBeVisible();
  await expect(page.getByText("Navigation test task", { exact: true }).first()).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.navigationTest = "same document"; });
  const initialRequests = requests.length;

  for (const name of ["Calendar", "Trash", "Settings"]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}$`));
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(`${name} | Rubix`);
    if (name === "Calendar") {
      await page.getByRole("link", { name, exact: true }).click();
    }
  }

  await page.goBack();
  await expect(page).toHaveURL(/\/trash$/);
  await expect(page.getByRole("heading", { name: "Trash", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/calendar$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/calendar$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/trash$/);
  expect(requests).toHaveLength(initialRequests);
  expect(await page.evaluate(() => document.documentElement.dataset.navigationTest)).toBe("same document");
  expect(errors).toEqual([]);
});

for (const name of ["Dashboard", "Calendar", "Trash", "Settings"]) {
  test(`${name} opens directly and survives refresh`, async ({ page }) => {
    await mockApi(page);
    const path = name === "Dashboard" ? "/" : `/${name.toLowerCase()}`;
    await page.goto(path);
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page).toHaveTitle(`${name} | Rubix`);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page).toHaveTitle(`${name} | Rubix`);
  });
}

test("a protected link survives sign-in-page refresh and returns to its section", async ({ page }) => {
  await mockApi(page, false);
  await page.goto("/calendar");
  await expect(page).toHaveURL(/\/login\?next=%2Fcalendar$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await signIn(page);
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: "Calendar", exact: true, level: 1 })).toBeVisible();
});

test("account links support history, refresh and recovery while retaining the destination", async ({ page }) => {
  await mockApi(page, false);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("link", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/register\?next=%2Fsettings$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password\?next=%2Fsettings$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
});

test("registration shows its recovery code before opening the requested section", async ({ page }) => {
  await mockApi(page, false);
  await page.goto("/register?next=%2Ftrash");
  await page.getByLabel("Username", { exact: true }).fill("route_tester");
  await page.getByLabel("Password", { exact: true }).fill("RoutingTest123");
  await page.getByLabel("Confirm password", { exact: true }).fill("RoutingTest123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/recovery-code\?next=%2Ftrash$/);
  await expect(page.getByRole("heading", { name: "Save your recovery code" })).toBeVisible();
  await expect(page.getByText("ABCD-EFGH-IJKL-MNOP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue to Rubix" }).click();
  await expect(page).toHaveURL(/\/trash$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Trash", exact: true })).toBeVisible();
});

test("password reset returns to sign-in with the revoked session cleared", async ({ page }) => {
  await mockApi(page);
  await page.goto("/forgot-password?next=%2Fsettings");
  await page.getByLabel("Username or email", { exact: true }).fill("route_tester");
  await page.getByLabel("Recovery code", { exact: true }).fill("ABCD-EFGH-IJKL-MNOP");
  await page.getByLabel("New password", { exact: true }).fill("Replacement123");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Replacement123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Password reset", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
});

test("signing out prevents Back from reopening protected content", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("calendar links and task selection navigate without a document reload", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByRole("link", { name: "View calendar" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await page.locator(".calendar-view-task").getByText("Navigation test task", { exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#task-1")).toHaveClass(/is-selected/);
  await page.goBack();
  await expect(page).toHaveURL(/\/calendar$/);
});

test("verification links survive refresh and continue through the router", async ({ page }) => {
  await mockApi(page, false);
  await page.goto("/verify-email?token=test-token");
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await page.getByRole("link", { name: "Continue to Rubix" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("unknown routes offer a way back to the dashboard", async ({ page }) => {
  await mockApi(page);
  await page.goto("/does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Welcome route_tester," })).toBeVisible();
});

test("trailing slashes retain the section and active navigation link", async ({ page }) => {
  await mockApi(page);
  await page.goto("/calendar/?view=month");
  await expect(page).toHaveURL(/\/calendar\?view=month$/);
  await expect(page.getByRole("link", { name: "Calendar", exact: true })).toHaveAttribute("aria-current", "page");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Calendar", exact: true, level: 1 })).toBeVisible();
});

test("narrow-screen navigation and browser Back keep their matching pages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await page.getByRole("link", { name: "Trash", exact: true }).click();
  await expect(page).toHaveURL(/\/trash$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Calendar", exact: true, level: 1 })).toBeVisible();
});
