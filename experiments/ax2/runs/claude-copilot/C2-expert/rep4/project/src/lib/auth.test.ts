import {
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from "./auth";

describe("hashPassword and verifyPassword", () => {
  it("produces a hash that differs from the plaintext password", async () => {
    const hash = await hashPassword("s3cret-password");
    expect(hash).not.toBe("s3cret-password");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse");
    await expect(verifyPassword("correct-horse", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against a hash", async () => {
    const hash = await hashPassword("correct-horse");
    await expect(verifyPassword("wrong-horse", hash)).resolves.toBe(false);
  });
});

describe("signToken and verifyToken", () => {
  it("round-trips the user identity through a signed token", () => {
    const token = signToken({ id: 42, username: "ada" });
    const payload = verifyToken(token);
    expect(payload.id).toBe(42);
    expect(payload.username).toBe("ada");
  });

  it("throws when verifying a malformed token", () => {
    expect(() => verifyToken("not-a-real-token")).toThrow();
  });
});
