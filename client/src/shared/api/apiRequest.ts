import { API_BASE_URL } from "../../config/api";

type ApiRequestOptions = RequestInit & {
  defaultErrorMessage?: string;
};

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function getErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    message?: unknown;
  } | null;

  return typeof body?.message === "string" ? body.message : fallback;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const {
    defaultErrorMessage = "Something went wrong. Please try again.",
    headers,
    ...requestOptions
  } = options;
  const requestHeaders = new Headers(headers);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (typeof requestOptions.body === "string" && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (timeZone && !requestHeaders.has("X-Rubix-Time-Zone")) {
    requestHeaders.set("X-Rubix-Time-Zone", timeZone);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: requestHeaders,
    ...requestOptions,
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await getErrorMessage(response, defaultErrorMessage),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
