import type { AuthSession } from "../features/auth/authTypes.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthSession;
    }
  }
}

export {};
