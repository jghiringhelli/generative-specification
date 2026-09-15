import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

export const config = {
  jwtSecret,
  port: Number(process.env.PORT ?? 3000),
};
