import { NextFunction, Request, RequestHandler, Response } from 'express';
import pkg from 'jsonwebtoken';
import { IUserRepository } from '../repositories/IUserRepository';
import { UnauthorizedError } from '../errors/AppError';
import { JwtPayload } from '../utils/TokenService';

const { verify } = pkg;

/**
 * Extract a JWT from the Authorization header. The Conduit spec uses the
 * `Token` scheme; `Bearer` is also accepted for interoperability.
 * @param header - The raw Authorization header value.
 * @returns The token string, or null if absent/malformed.
 */
function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (!value || (scheme !== 'Token' && scheme !== 'Bearer')) {
    return null;
  }
  return value;
}

/**
 * Verify a token and load the associated user.
 * @param token - The JWT string.
 * @param jwtSecret - Signing secret.
 * @param userRepository - User lookup port.
 * @returns The user entity.
 * @throws UnauthorizedError if the token is invalid or the user is missing.
 */
async function resolveUser(
  token: string,
  jwtSecret: string,
  userRepository: IUserRepository
): Promise<import('../domain/types').UserEntity> {
  let payload: JwtPayload;
  try {
    payload = verify(token, jwtSecret) as JwtPayload;
  } catch {
    throw new UnauthorizedError('token is invalid');
  }
  const user = await userRepository.findById(payload.userId);
  if (!user) {
    throw new UnauthorizedError('token is invalid');
  }
  return user;
}

/**
 * Build middleware that requires a valid JWT and attaches the user to the
 * request.
 * @param jwtSecret - Signing secret.
 * @param userRepository - User lookup port.
 * @returns Express middleware.
 */
export function requireAuth(
  jwtSecret: string,
  userRepository: IUserRepository
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req.header('authorization'));
    if (!token) {
      next(new UnauthorizedError('authorization required'));
      return;
    }
    try {
      const user = await resolveUser(token, jwtSecret, userRepository);
      req.user = user;
      req.userId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Build middleware that attaches the user when a valid token is present but
 * does not fail when authentication is absent.
 * @param jwtSecret - Signing secret.
 * @param userRepository - User lookup port.
 * @returns Express middleware.
 */
export function optionalAuth(
  jwtSecret: string,
  userRepository: IUserRepository
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req.header('authorization'));
    if (!token) {
      next();
      return;
    }
    try {
      const user = await resolveUser(token, jwtSecret, userRepository);
      req.user = user;
      req.userId = user.id;
    } catch {
      // Optional auth: ignore invalid tokens and proceed as anonymous.
    }
    next();
  };
}
