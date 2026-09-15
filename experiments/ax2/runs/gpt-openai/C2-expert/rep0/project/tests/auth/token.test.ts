import { signToken, verifyToken } from "../../src/auth/token";

describe("token utilities", () => {
  it("signs a token and verifies its user identifier", () => {
    const token = signToken({ userId: 42 }, "test-secret");
    expect(verifyToken(token, "test-secret")).toEqual({ userId: 42 });
  });

  it("rejects a token signed with another secret", () => {
    const token = signToken({ userId: 42 }, "first-secret");
    expect(() => verifyToken(token, "second-secret")).toThrow();
  });
});
