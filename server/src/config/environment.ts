import "dotenv/config";

const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const DEFAULT_PORT = 5000;

const nodeEnvironment = process.env.NODE_ENV?.trim() || "development";
const isProduction = nodeEnvironment === "production";

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

  if (isProduction && url.protocol !== "https:") {
    throw new Error("CLIENT_ORIGIN must use https in production.");
  }

  return url.origin;
}

function getPort() {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

export const environment = Object.freeze({
  clientOrigin: getClientOrigin(),
  isProduction,
  nodeEnvironment,
  port: getPort(),
});
