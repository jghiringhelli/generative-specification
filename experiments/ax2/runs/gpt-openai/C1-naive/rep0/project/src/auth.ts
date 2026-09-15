import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";

type TokenPayload = { userId: number };

export function createToken(userId: number): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "7d" });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization");
  const token = header?.replace(/^Token\s+/i, "");

  if (!token) {
    res.status(401).json({ errors: { body: ["Unauthorized"] } });
    return;
  }

  export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
    const token = req.header("Authorization")?.replace(/^Token\s+/i, "");
    if (!token) {
      next();
      return;
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
      req.userId = payload.userId;
    } catch {
      req.userId = undefined;
    }
    next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ errors: { body: ["Unauthorized"] } });
  }
}
