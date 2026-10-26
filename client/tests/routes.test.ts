import assert from "node:assert/strict";
import { test } from "node:test";
import { getAccountPath, getReturnPath } from "../src/app/config/routes.ts";

test("sign-in destinations survive account pages and refresh", () => {
  for (const destination of ["/", "/calendar", "/trash", "/settings", "/calendar?month=2026-12#tasks"]) {
    for (const page of ["login", "register", "forgot-password", "recovery-code"] as const) {
      const address = new URL(getAccountPath(page, destination), "https://rubix.example");
      assert.equal(address.pathname, `/${page}`);
      assert.equal(getReturnPath(address.search), destination);
    }
  }
});

test("return destinations cannot redirect outside Rubix or loop through auth", () => {
  for (const destination of [
    "https://other.example/calendar", "//other.example", "/\\other.example",
    "javascript:alert(1)", "/login", "/register", "/forgot-password", "/recovery-code",
    "/verify-email?token=secret", "/unknown", "/%2fother.example", "calendar",
  ]) {
    assert.equal(getReturnPath(`?${new URLSearchParams({ next: destination })}`), "/", destination);
  }
  assert.equal(getReturnPath(""), "/");
  assert.equal(getReturnPath("?next=%E0%A4%A"), "/");
  assert.equal(getReturnPath("?next=%2Fcalendar%2F"), "/calendar");
});
