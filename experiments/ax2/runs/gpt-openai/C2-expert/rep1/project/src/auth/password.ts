import bcrypt from "bcryptjs";

export const PASSWORD_HASH_ROUNDS = 12;

/** Hashes a plaintext password using bcrypt. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

/** Checks a plaintext password against a bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
