export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface UserAuth {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}
