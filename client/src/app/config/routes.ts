export const APP_PATHS = {
  dashboard: "/",
  calendar: "/calendar",
  trash: "/trash",
  settings: "/settings",
} as const;

export type AppView = keyof typeof APP_PATHS;
export type AuthMode = "login" | "register";

// Only return to known app pages, never an external address or another auth page.
export function getReturnPath(search: string) {
  const destination = new URLSearchParams(search).get("next");
  if (!destination) return APP_PATHS.dashboard;

  const pathname = destination.split(/[?#]/, 1)[0];
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  if (!Object.values<string>(APP_PATHS).includes(normalizedPathname)) {
    return APP_PATHS.dashboard;
  }

  return normalizedPathname + destination.slice(pathname.length);
}

export function getAccountPath(
  page: AuthMode | "forgot-password" | "recovery-code",
  destination: string = APP_PATHS.dashboard,
) {
  const search = new URLSearchParams({ next: destination }).toString();
  return destination === APP_PATHS.dashboard ? `/${page}` : `/${page}?${search}`;
}

export function getPageTitle(pathname: string) {
  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/calendar": "Calendar",
    "/trash": "Trash",
    "/settings": "Settings",
    "/login": "Sign in",
    "/register": "Create account",
    "/forgot-password": "Reset password",
    "/recovery-code": "Recovery code",
    "/verify-email": "Verify email",
  };
  return `${titles[pathname.replace(/\/+$/, "") || "/"] ?? "Page not found"} | Rubix`;
}
