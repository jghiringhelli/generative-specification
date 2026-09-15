import express from "express";
import request from "supertest";
import { ValidationError } from "../../src/errors/application-error";
import { errorHandler } from "../../src/middleware/error.middleware";
import { notFoundHandler } from "../../src/middleware/not-found.middleware";

describe("API error formatting", () => {
  it("formats application errors with body message arrays", async () => {
    const app = express();
    app.get("/invalid", (_request, _response, next) => {
      next(new ValidationError("Invalid input"));
    });
    app.use(errorHandler);

    const response = await request(app).get("/invalid");

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: ["Invalid input"] } });
  });

  it("formats unexpected errors without exposing details", async () => {
    const app = express();
    app.get("/failure", (_request, _response, next) => {
      next(new Error("sensitive detail"));
    });
    app.use(errorHandler);

    const response = await request(app).get("/failure");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errors: { body: ["Internal server error"] } });
  });

  it("formats unmatched routes as not-found errors", async () => {
    const app = express();
    app.use(notFoundHandler);

    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ errors: { body: ["Route does not exist"] } });
  });
});
