import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma.client';
import { UserEntity } from '../types/user.types';

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  update(id: number, data: UpdateUserData): Promise<UserEntity>;
}

export class UserRepository implements IUserRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * Creates a new user record in the database.
   *
   * @param {CreateUserData} data - User creation attributes
   * @returns {Promise<UserEntity>} The created user entity
   */
  public async create(data: CreateUserData): Promise<UserEntity> {
    return this.db.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password
      }
    });
  }

  /**
   * Finds a user record by email address.
   *
   * @param {string} email - Email address to search
   * @returns {Promise<UserEntity | null>} Found user entity or null
   */
  public async findByEmail(email: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { email }
    });
  }

  /**
   * Finds a user record by username.
   *
   * @param {string} username - Username to search
   * @returns {Promise<UserEntity | null>} Found user entity or null
   */
  public async findByUsername(username: string): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { username }
    });
  }

  /**
   * Finds a user record by primary key identifier.
   *
   * @param {number} id - User ID
   * @returns {Promise<UserEntity | null>} Found user entity or null
   */
  public async findById(id: number): Promise<UserEntity | null> {
    return this.db.user.findUnique({
      where: { id }
    });
  }

  /**
   * Updates an existing user record.
   *
   * @param {number} id - User ID
   * @param {UpdateUserData} data - Fields to update
   * @returns {Promise<UserEntity>} Updated user entity
   */
  public async update(id: number, data: UpdateUserData): Promise<UserEntity> {
    return this.db.user.update({
      where: { id },
      data
    });
  }
}
