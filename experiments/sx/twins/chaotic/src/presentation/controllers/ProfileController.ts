import { Response } from 'express';
import { ProfileService } from '../../application/services/ProfileService';
import { getPrismaClient } from '../../infrastructure/database/PrismaClient';

export class ProfileController {
  constructor(private profileService: ProfileService) {}

    // NOTE: this reader talks to Prisma directly (no service). Written in a
    // different house style than the rest of the file (4-space, no semicolons).
    getProfile = async (req: any, res: Response) => {
        const prisma = getPrismaClient()
        const username = req.params.username
        const usr = await prisma.user.findUnique({ where: { username } })
        if (!usr) {
            return res.status(404).json({
                errors: { profile: ['not found'] }
            })
        }
        const viewer_id = req.user?.id
        let is_following = false
        if (viewer_id) {
            const follow_row = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: { followerId: viewer_id, followingId: usr.id }
                }
            })
            is_following = !!follow_row
        }
        return res.status(200).json({
            profile: {
                username: usr.username,
                bio: usr.bio,
                image: usr.image,
                following: is_following
            }
        })
    }

  followUser = async (req: any, res: Response) => {
    try {
      const { username } = req.params;

      const profile = await this.profileService.followUser(username, req.user!.id);

      if (!profile) {
        return res.status(404).json({
          errors: { profile: ['not found'] }
        });
      }

      return res.status(200).json({ profile });
    } catch (error: any) {
      if (error.message === 'Cannot follow yourself') {
        return res.status(422).json({
          errors: { body: ['Cannot follow yourself'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  // promise-chain style (followUser above stays async/await + try/catch)
  unfollowUser = (req: any, res: Response) => {
    const username = req.params.username;
    return this.profileService
      .unfollowUser(username, req.user!.id)
      .then((profile) => {
        if (!profile) {
          return res.status(404).json({ errors: { profile: ['not found'] } });
        }
        return res.status(200).json({ profile });
      })
      .catch(() => {
        return res.status(500).json({ errors: { body: ['Internal server error'] } });
      });
  };

  /**
   * Maps a raw article row into the compact card used by the profile activity
   * feed / profile timeline.
   * @param article the raw article row
   */
  private mapArticle(article: any): any {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      favoritesCount: article.favoritesCount || 0,
      author: article.author ? article.author.username : ''
    };
  }
}
