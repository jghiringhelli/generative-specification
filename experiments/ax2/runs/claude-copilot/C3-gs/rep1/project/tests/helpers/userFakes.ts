import { User } from '@prisma/client';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from '../../src/repositories/IUserRepository';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { ITagRepository } from '../../src/repositories/ITagRepository';

/**
 * Shared, mutable in-memory data store backing the fake repositories.
 */
export class InMemoryStore {
  users: User[] = [];
  articles: Article[] = [];
  comments: Comment[] = [];
  tagsByArticle = new Map<number, string[]>();
  follows: Array<{ followerId: number; followingId: number }> = [];
  favorites: Array<{ userId: number; articleId: number }> = [];
  private sequence = 0;

  /**
   * Produce a fresh monotonically increasing id.
   * @returns The next id.
   */
  nextId(): number {
    this.sequence += 1;
    return this.sequence;
  }
}

/**
 * In-memory implementation of IUserRepository.
 */
export class InMemoryUserRepository implements IUserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: this.store.nextId(),
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.users.push(user);
    return user;
  }

  async findById(id: number): Promise<User | null> {
    return this.store.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.store.users.find((user) => user.email === email) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.store.users.find((user) => user.username === username) ?? null;
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    const user = this.store.users.find((candidate) => candidate.id === id);
    if (!user) {
      throw new Error('user not found');
    }
    if (data.email !== undefined) user.email = data.email;
    if (data.username !== undefined) user.username = data.username;
    if (data.passwordHash !== undefined) user.passwordHash = data.passwordHash;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.image !== undefined) user.image = data.image;
    user.updatedAt = new Date();
    return user;
  }
}

/**
 * In-memory implementation of IProfileRepository.
 */
export class InMemoryProfileRepository implements IProfileRepository {
  constructor(private readonly store: InMemoryStore) {}

  async follow(followerId: number, followingId: number): Promise<void> {
    if (!(await this.isFollowing(followerId, followingId))) {
      this.store.follows.push({ followerId, followingId });
    }
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    this.store.follows = this.store.follows.filter(
      (follow) => !(follow.followerId === followerId && follow.followingId === followingId),
    );
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.store.follows.some(
      (follow) => follow.followerId === followerId && follow.followingId === followingId,
    );
  }

  async findFollowingIds(followerId: number): Promise<number[]> {
    return this.store.follows
      .filter((follow) => follow.followerId === followerId)
      .map((follow) => follow.followingId);
  }
}

/**
 * In-memory implementation of ITagRepository.
 */
export class InMemoryTagRepository implements ITagRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAll(): Promise<string[]> {
    const names = new Set<string>();
    for (const tags of this.store.tagsByArticle.values()) {
      tags.forEach((tag) => names.add(tag));
    }
    return Array.from(names).sort();
  }

  async ensure(): Promise<void> {
    // Tags are recorded alongside articles in this fake.
  }
}
