import { hashPassword, verifyPassword } from "../../src/auth/password";

describe("password utilities", () => {
  it("hashes a password and verifies the matching plaintext value", async () => {
    const hash = await hashPassword("correct-password");
    expect(hash).not.toBe("correct-password");
    await expect(verifyPassword("correct-password", hash)).resolves.toBe(true);
  });

  it("rejects a plaintext value that does not match the hash", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
