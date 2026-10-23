import "dotenv/config";

const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const DEFAULT_PORT = 5000;

const nodeEnvironment = process.env.NODE_ENV?.trim() || "development";
const isProduction = nodeEnvironment === "production";

function isLoopbackHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

function getClientOrigin() {
  const configuredOrigin =
    process.env.CLIENT_ORIGIN?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim();

  if (!configuredOrigin) {
    if (isProduction) {
      throw new Error(
        "CLIENT_ORIGIN is required in production outside Render.",
      );
    }

    return DEFAULT_CLIENT_ORIGIN;
  }

  let url: URL;

  try {
    url = new URL(configuredOrigin);
  } catch {
    throw new Error("CLIENT_ORIGIN must be a valid URL origin.");
  }

  const hasOnlyOrigin =
    url.username === "" &&
    url.password === "" &&
    url.pathname === "/" &&
    url.search === "" &&
    url.hash === "";

  if (!hasOnlyOrigin || !["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      "CLIENT_ORIGIN must contain only an http or https origin.",
    );
  }

  if (
    isProduction &&
    url.protocol !== "https:" &&
    !isLoopbackHostname(url.hostname)
  ) {
    throw new Error("CLIENT_ORIGIN must use https in production.");
  }

  return url.origin;
}

function getSecureCookies(clientOrigin: string) {
  const configuredValue = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (!configuredValue) {
    return isProduction;
  }

  if (!["true", "false"].includes(configuredValue)) {
    throw new Error("COOKIE_SECURE must be true or false.");
  }

  const secureCookies = configuredValue === "true";
  const clientHostname = new URL(clientOrigin).hostname;

  if (isProduction && !secureCookies && !isLoopbackHostname(clientHostname)) {
    throw new Error(
      "COOKIE_SECURE can only be false for a loopback production origin.",
    );
  }

  return secureCookies;
}

function getPort() {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

const clientOrigin = getClientOrigin();

export const environment = Object.freeze({
  clientOrigin,
  isProduction,
  nodeEnvironment,
  port: getPort(),
  secureCookies: getSecureCookies(clientOrigin),
});
