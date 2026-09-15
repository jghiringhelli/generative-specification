import { z } from "zod";
import { NotFoundError } from "../../src/errors";
import { formatError } from "../../src/middleware/error-handler";

describe("API error formatting", () => {
  it("formats application errors under their configured field", () => {
    expect(formatError(new NotFoundError("Article not found"))).toEqual({
      errors: { body: ["Article not found"] }
    });
  });

  it("formats validation issues as a body message array", () => {
    const result = z.object({ title: z.string().min(1) }).safeParse({ title: "" });
    if (result.success) throw new Error("Expected validation to fail");
    expect(formatError(result.error)).toEqual({
      errors: { body: ["String must contain at least 1 character(s)"] }
    });
  });
});
