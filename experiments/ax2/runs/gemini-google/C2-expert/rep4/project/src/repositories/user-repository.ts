import { User, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from './user-repository.interface';

/**
 * Prisma implementation of the User repository.
 */
export class UserRepository implements IUserRepository {
  private readonly db: PrismaClient;

  /**
   * Constructs the repository with a PrismaClient instance.
   *
   * @param {PrismaClient} [dbClient=defaultPrisma] - Prisma database client
   */
  constructor(dbClient: PrismaClient = defaultPrisma) {
    this.db = dbClient;
  }

  /**
   * Creates a new user record.
   *
   * @param {CreateUserData} data - User creation data
   * @returns {Promise<User>} The created user
   */
  public async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        bio: data.bio ?? null,
        image: data.image ?? null,
      },
    });
  }

  /**
   * Finds a user by email address.
   *
   * @param {string} email - Email address
   * @returns {Promise<User | null>} The user or null
   */
  public async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds a user by username.
   *
   * @param {string} username - Username
   * @returns {Promise<User | null>} The user or null
   */
  public async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { username },
    });
  }

  /**
   * Finds a user by ID.
   *
   * @param {string} id - User ID
   * @returns {Promise<User | null>} The user or null
   */
  public async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  /**
   * Updates user fields.
   *
   * @param {string} id - User ID
   * @param {UpdateUserData} data - Fields to update
   * @returns {Promise<User>} Updated user
   */
  public async update(id: string, data: UpdateUserData): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });
  }
}
