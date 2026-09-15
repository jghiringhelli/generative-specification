import { hashPassword, PASSWORD_HASH_ROUNDS, verifyPassword } from "../../src/auth/password";

describe("password helpers", () => {
  it("hashes a password with the configured cost", async () => {
    const hash = await hashPassword("secret-password");
    expect(hash).not.toBe("secret-password");
    expect(Number(hash.split("$")[2])).toBe(PASSWORD_HASH_ROUNDS);
  });

  it("verifies the matching password and rejects a different password", async () => {
    const hash = await hashPassword("secret-password");
    await expect(verifyPassword("secret-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("different-password", hash)).resolves.toBe(false);
  });
});
