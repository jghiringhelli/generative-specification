
/**
 * Domain model for User (matches Prisma schema).
 */
export interface User {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User response DTO (RealWorld API format).
 * Excludes passwordHash, includes token.
 */
export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * Registration DTO.
 */
export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

/**
 * Login DTO.
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Update user DTO.
 * All fields optional.
 */
export interface UpdateUserDTO {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}
