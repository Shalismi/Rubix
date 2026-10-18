import * as argon2 from "argon2";

const ARGON2_MEMORY_COST = 19 * 1024;

export function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ARGON2_MEMORY_COST,
    timeCost: 2,
    parallelism: 1,
  });
}

export function verifyPassword(passwordHash: string, password: string) {
  return argon2.verify(passwordHash, password);
}
