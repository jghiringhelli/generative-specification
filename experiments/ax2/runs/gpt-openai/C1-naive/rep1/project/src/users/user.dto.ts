import { User } from "@prisma/client";

import { createToken } from "../auth";

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export function toUserResponse(user: User): UserResponse {
  return {
    email: user.email,
    token: createToken(user.id),
    username: user.username,
    bio: user.bio,
    image: user.image,
  };
}
