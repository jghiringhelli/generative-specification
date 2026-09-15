import { signToken, verifyToken } from "../../src/auth/token";

describe("token helpers", () => {
  const secret = "test-secret";

  it("signs and verifies a token containing the user id", () => {
    expect(verifyToken(signToken(42, secret), secret).userId).toBe(42);
  });

  it("rejects a token verified with a different secret", () => {
    expect(() => verifyToken(signToken(42, secret), "other-secret")).toThrow();
  });
});
