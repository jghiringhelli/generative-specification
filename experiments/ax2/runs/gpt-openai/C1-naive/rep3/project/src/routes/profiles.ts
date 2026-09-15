import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, optionalAuth, requireAuth } from '../middleware/auth';
import { formatProfile } from '../utils/responses';

export const profilesRouter = Router();

profilesRouter.get('/profiles/:username', optionalAuth, async (request: AuthenticatedRequest, response) => {
  const profileUser = await prisma.user.findUnique({ where: { username: request.params.username } });
  if (!profileUser) {
    response.status(404).json({ errors: { body: ['Profile not found'] } });
    return;
  }

  const following = request.userId
    ? Boolean(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: request.userId, followingId: profileUser.id } },
      }))
    : false;
  response.json({ profile: formatProfile(profileUser, following) });
});

profilesRouter.post('/profiles/:username/follow', requireAuth, async (request: AuthenticatedRequest, response) => {
  const profileUser = await prisma.user.findUnique({ where: { username: request.params.username } });
  if (!profileUser) {
    response.status(404).json({ errors: { body: ['Profile not found'] } });
    return;
  }
  if (profileUser.id === request.userId) {
    response.status(422).json({ errors: { body: ['You cannot follow yourself'] } });
    return;
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: request.userId!, followingId: profileUser.id } },
    update: {},
    create: { followerId: request.userId!, followingId: profileUser.id },
  });
  response.json({ profile: formatProfile(profileUser, true) });
});

profilesRouter.delete('/profiles/:username/follow', requireAuth, async (request: AuthenticatedRequest, response) => {
  const profileUser = await prisma.user.findUnique({ where: { username: request.params.username } });
  if (!profileUser) {
    response.status(404).json({ errors: { body: ['Profile not found'] } });
    return;
  }

  await prisma.follow.deleteMany({ where: { followerId: request.userId, followingId: profileUser.id } });
  response.json({ profile: formatProfile(profileUser, false) });
});
