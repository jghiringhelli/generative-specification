import { Response } from 'express';
import { UserService } from '../../application/services/UserService';

export class UserController {
  constructor(private userService: UserService) {}

  register = async (req: any, res: Response) => {
    try {
      const { user } = req.body;

      if (!user || !user.email || !user.username || !user.password) {
        return res.status(422).json({
          errors: { body: ['Email, username, and password are required'] }
        });
      }

      const userAuth = await this.userService.register(user.email, user.username, user.password);

      return res.status(201).json({ user: userAuth });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(422).json({
          errors: { body: ['Email or username already taken'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  login = async (req: any, res: Response) => {
    try {
      const { user } = req.body;

      if (!user || !user.email || !user.password) {
        return res.status(422).json({
          errors: { body: ['Email and password are required'] }
        });
      }

      const userAuth = await this.userService.login(user.email, user.password);

      if (!userAuth) {
        return res.status(401).json({
          errors: { body: ['Invalid email or password'] }
        });
      }

      return res.status(200).json({ user: userAuth });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  getCurrent = async (req: any, res: Response) => {
    try {
      const userAuth = await this.userService.getCurrentUser(req.user!.id);

      if (!userAuth) {
        return res.status(404).json({
          errors: { body: ['User not found'] }
        });
      }

      return res.status(200).json({ user: userAuth });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  update = async (req: any, res: Response) => {
    try {
      const { user } = req.body;

      if (!user) {
        return res.status(422).json({
          errors: { body: ['User data is required'] }
        });
      }

      const userAuth = await this.userService.updateUser(req.user!.id, user);

      return res.status(200).json({ user: userAuth });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(422).json({
          errors: { body: ['Email or username already taken'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
