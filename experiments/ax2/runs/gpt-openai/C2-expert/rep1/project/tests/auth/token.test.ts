import { signToken, verifyToken } from "../../src/auth/token";

const JWT_SECRET = "unit-test-secret";

describe("token authentication", () => {
  it("signs a token containing the user id", () => {
    const token = signToken(42, JWT_SECRET);

    expect(verifyToken(token, JWT_SECRET)).toEqual({ userId: 42 });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signToken(42, JWT_SECRET);

    expect(() => verifyToken(token, "different-secret")).toThrow();
  });
});
