import { Response } from 'express';
import { UserService } from '../../application/services/UserService';

export class UserController {
  constructor(private userService: UserService) {}

  register = async (req: any, res: Response) => {
    try {
      const { user } = req.body;

      const errors: Record<string, string[]> = {};
      if (!user || !user.username) errors.username = ["can't be blank"];
      if (!user || !user.email) errors.email = ["can't be blank"];
      if (!user || !user.password) errors.password = ["can't be blank"];
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ errors });
      }

      const userAuth = await this.userService.register(user.email, user.username, user.password);

      return res.status(201).json({ user: userAuth });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = this.duplicateField(error);
        return res.status(409).json({
          errors: { [field]: ['has already been taken'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  private duplicateField(error: any): string {
    const target = error?.meta?.target;
    const asText = Array.isArray(target) ? target.join(',') : String(target ?? '');
    return asText.toLowerCase().includes('email') ? 'email' : 'username';
  }

  login = async (req: any, res: Response) => {
    try {
      const { user } = req.body;

      const errors: Record<string, string[]> = {};
      if (!user || !user.email) errors.email = ["can't be blank"];
      if (!user || !user.password) errors.password = ["can't be blank"];
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ errors });
      }

      const userAuth = await this.userService.login(user.email, user.password);

      if (!userAuth) {
        return res.status(401).json({
          errors: { credentials: ['invalid'] }
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
          errors: { body: ["can't be blank"] }
        });
      }

      const errors: Record<string, string[]> = {};
      const updates: any = {};

      if ('email' in user) {
        if (user.email === null || user.email === '') errors.email = ["can't be blank"];
        else updates.email = user.email;
      }
      if ('username' in user) {
        if (user.username === null || user.username === '') errors.username = ["can't be blank"];
        else updates.username = user.username;
      }
      if ('password' in user) {
        if (user.password === null || user.password === '' || String(user.password).length < 8) {
          errors.password = ['is too short (minimum is 8 characters)'];
        } else {
          updates.password = user.password;
        }
      }
      if ('bio' in user) {
        updates.bio = user.bio === '' ? null : user.bio;
      }
      if ('image' in user) {
        updates.image = user.image === '' ? null : user.image;
      }

      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ errors });
      }

      const userAuth = await this.userService.updateUser(req.user!.id, updates);

      return res.status(200).json({ user: userAuth });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = this.duplicateField(error);
        return res.status(409).json({
          errors: { [field]: ['has already been taken'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
