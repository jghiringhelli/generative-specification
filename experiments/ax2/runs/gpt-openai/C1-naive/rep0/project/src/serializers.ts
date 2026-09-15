import { User } from "@prisma/client";
import { createToken } from "./auth";

export function serializeUser(user: User) {
  return {
    email: user.email,
    token: createToken(user.id),
    username: user.username,
    bio: user.bio,
    image: user.image,
  };
}

export function serializeProfile(user: User, following: boolean) {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following,
  };
}
