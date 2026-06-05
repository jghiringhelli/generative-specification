/**
 * Defense-in-depth guard specs for the HTTP controllers.
 *
 * Each controller carries two kinds of internal guard that the routed request
 * path can never trip (the `authenticate` middleware always sets `req.userId`
 * before a protected handler runs, and Express only invokes a handler once its
 * declared `:param` segments are bound). They exist purely to narrow the
 * `string | undefined` index types into a typed value — but they encode a real
 * contract: a missing identity is a 401 and a missing path segment is a 404.
 * The subcutaneous endpoint suites cannot exercise these branches, so we invoke
 * the controller methods directly with the precondition violated and assert the
 * documented error type. The injected service is a bare stub: every guard
 * throws before any service method is reached.
 */
import { describe, expect, it } from '@jest/globals';
import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import { ArticleController } from './ArticleController.js';
import { CommentController } from './CommentController.js';
import { ProfileController } from './ProfileController.js';
import { UserController } from './UserController.js';
import type { ArticleService } from '../services/ArticleService.js';
import type { CommentService } from '../services/CommentService.js';
import type { ProfileService } from '../services/ProfileService.js';
import type { UserService } from '../services/UserService.js';

/**
 * A service stub whose every method, *if invoked*, throws. Property access
 * resolves to the throwing function (the call's callee is evaluated before its
 * argument expressions), so the controller's guard — which lives in those
 * arguments — throws first. If a guard ever fails to fire, this surfaces it.
 */
const unusedService: unknown = new Proxy(
  {},
  {
    get() {
      return () => {
        throw new Error('service must not be reached: a guard should throw first');
      };
    },
  },
);

/** Minimal request with an optional identity and path params. */
function req(params: Record<string, string> = {}, userId?: string): Request {
  return { params, query: {}, body: {}, userId } as unknown as Request;
}

const res = {} as Response;

describe('controller defensive guards', () => {
  describe('missing identity → 401', () => {
    it('UserController.getCurrent throws UnauthorizedError', async () => {
      const controller = new UserController(unusedService as UserService);
      await expect(controller.getCurrent(req(), res)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('ArticleController.feed throws UnauthorizedError', async () => {
      const controller = new ArticleController(unusedService as ArticleService);
      await expect(controller.feed(req(), res)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('ProfileController.follow throws UnauthorizedError', async () => {
      const controller = new ProfileController(unusedService as ProfileService);
      await expect(controller.follow(req({ username: 'jane' }), res)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it('CommentController.remove throws UnauthorizedError', async () => {
      const controller = new CommentController(unusedService as CommentService);
      await expect(
        controller.remove(req({ slug: 'how-to', id: '1' }), res),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('missing path segment → 404', () => {
    it('ArticleController.get throws NotFoundError when :slug is absent', async () => {
      const controller = new ArticleController(unusedService as ArticleService);
      await expect(controller.get(req(), res)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('ProfileController.get throws NotFoundError when :username is absent', async () => {
      const controller = new ProfileController(unusedService as ProfileService);
      await expect(controller.get(req(), res)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('CommentController.list throws NotFoundError when :slug is absent', async () => {
      const controller = new CommentController(unusedService as CommentService);
      await expect(controller.list(req(), res)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('CommentController.remove throws NotFoundError when :id is absent', async () => {
      const controller = new CommentController(unusedService as CommentService);
      await expect(controller.remove(req({ slug: 'how-to' }, 'u1'), res)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
