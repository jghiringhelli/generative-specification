import type { User } from '@prisma/client';

export class UserBuilder {
  private user: User = {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'hashed-password',
    bio: null,
    image: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  /** Overrides builder values. */
  public with(values: Partial<User>): UserBuilder {
    this.user = { ...this.user, ...values };
    return this;
  }

  /** Builds a user. */
  public build(): User {
    return { ...this.user };
  }
}
