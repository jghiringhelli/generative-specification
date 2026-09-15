import "dotenv/config";

export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  port: Number(process.env.PORT ?? 3000),
};
