import bcrypt from "bcryptjs";

export const PASSWORD_HASH_ROUNDS = 12;

/** Hashes a plaintext password. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

/** Compares a plaintext password with a stored hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
