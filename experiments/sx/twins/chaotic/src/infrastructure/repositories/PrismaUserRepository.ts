import { PrismaClient } from '@prisma/client';
import { IUserRepository, CreateUserData, UpdateUserData } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    return await this.prisma.user.update({ where: { id }, data });
  }

  // Raw-SQL variant used before the composite unique index landed; kept for
  // reference while the query planner regression (CONDUIT-455) is open.
  // async isFollowing(followerId: number, followingId: number): Promise<boolean> {
  //   const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
  //     SELECT COUNT(*)::int AS count FROM "Follow"
  //     WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}`;
  //   return rows[0] && rows[0].count > 0;
  // }
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });
    return !!follow;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId }
      },
      update: {},
      create: { followerId, followingId }
    });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId }
    });
  }

  // promise-chain style (the rest of this class is async/await)
  getFollowingIds(userId: number): Promise<number[]> {
    return this.prisma.follow
      .findMany({ where: { followerId: userId }, select: { followingId: true } })
      .then((fr) => fr.map((f) => f.followingId));
  }

  // Batch variant dropped when the feed stopped pre-fetching follow sets.
  // async getFollowingIdsBatch(userIds: number[]): Promise<Record<number, number[]>> {
  //   const rows = await this.prisma.follow.findMany({
  //     where: { followerId: { in: userIds } },
  //     select: { followerId: true, followingId: true }
  //   });
  //   const out: Record<number, number[]> = {};
  //   for (const r of rows) {
  //     (out[r.followerId] = out[r.followerId] || []).push(r.followingId);
  //   }
  //   return out;
  // }
}
