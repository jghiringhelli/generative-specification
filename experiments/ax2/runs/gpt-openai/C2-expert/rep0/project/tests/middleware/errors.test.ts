import { z } from "zod";
import { AuthenticationError, NotFoundError } from "../../src/errors";
import { formatError } from "../../src/middleware/errors";

describe("API error formatting", () => {
  it("formats validation failures with a 422 status and body messages", () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    if (result.success) throw new Error("Expected validation to fail");
    expect(formatError(result.error)).toMatchObject({
      statusCode: 422,
      body: { errors: { body: expect.any(Array) } }
    });
  });

  it("formats authentication failures with a 401 status", () => {
    expect(formatError(new AuthenticationError())).toEqual({
      statusCode: 401,
      body: { errors: { body: ["Unauthorized"] } }
    });
  });

  it("formats not-found failures with a 404 status", () => {
    expect(formatError(new NotFoundError("Article not found"))).toEqual({
      statusCode: 404,
      body: { errors: { body: ["Article not found"] } }
    });
  });

  it("hides unexpected error details behind a stable 500 response", () => {
    expect(formatError(new Error("database credentials"))).toEqual({
      statusCode: 500,
      body: { errors: { body: ["Internal server error"] } }
    });
  });
});
