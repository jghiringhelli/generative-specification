import bcrypt from "bcryptjs";

export const PASSWORD_HASH_ROUNDS = 12;

/** Hashes a plaintext password for persistence. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

/** Verifies a plaintext password against a persisted hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
